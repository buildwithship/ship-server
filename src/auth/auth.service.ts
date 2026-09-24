import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';

import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-code';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/sign-up.dto';

interface RefreshPayload {
  sub: string;
  tokenId: string;
  type: 'refresh';
}

function durationToSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) return Number(value) || 0;
  const amount = Number(match[1]);
  const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[match[2]];
  return amount * multiplier;
}

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessTtl: string;
  private readonly refreshTtl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.accessSecret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.refreshSecret = config.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.accessTtl = config.get<string>('JWT_ACCESS_TTL', '15m');
    this.refreshTtl = config.get<string>('JWT_REFRESH_TTL', '30d');
  }

  async signup(dto: SignUpDto) {
    const passwordHash = await argon2.hash(dto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          name: dto.name,
          passwordHash,
        },
      });
      return this.issueTokens(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = String(error.meta?.target ?? '');
        if (target.includes('email')) {
          throw new AppException(
            ErrorCode.EMAIL_ALREADY_EXISTS,
            '이미 사용 중인 이메일입니다.',
            HttpStatus.CONFLICT,
          );
        }
        throw new AppException(
          ErrorCode.USERNAME_ALREADY_EXISTS,
          '이미 사용 중인 사용자 이름입니다.',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new AppException(
        ErrorCode.AUTH_INVALID_CREDENTIALS,
        '이메일 또는 비밀번호가 일치하지 않습니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    const payload = await this.verifyRefresh(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
      include: { user: true },
    });

    if (
      !stored ||
      stored.userId !== payload.sub ||
      stored.revokedAt ||
      stored.expiresAt <= new Date() ||
      !(await argon2.verify(stored.tokenHash, refreshToken))
    ) {
      throw new AppException(
        ErrorCode.AUTH_REFRESH_TOKEN_REVOKED,
        '만료되었거나 폐기된 Refresh Token입니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const revoked = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (revoked.count !== 1) {
      throw new AppException(
        ErrorCode.AUTH_REFRESH_TOKEN_REVOKED,
        '이미 사용된 Refresh Token입니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.issueTokens(stored.user);
  }

  async logout(refreshToken: string) {
    try {
      const payload = await this.verifyRefresh(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { id: payload.tokenId, userId: payload.sub, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Logout is intentionally idempotent.
    }
    return { loggedOut: true };
  }

  private async issueTokens(user: User) {
    const accessTokenExpiresIn = durationToSeconds(this.accessTtl);
    const refreshTokenExpiresIn = durationToSeconds(this.refreshTtl);
    const tokenId = randomUUID();

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, username: user.username, type: 'access' },
      { secret: this.accessSecret, expiresIn: accessTokenExpiresIn },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, tokenId, type: 'refresh' },
      { secret: this.refreshSecret, expiresIn: refreshTokenExpiresIn },
    );

    await this.prisma.refreshToken.create({
      data: {
        id: tokenId,
        userId: user.id,
        tokenHash: await argon2.hash(refreshToken),
        expiresAt: new Date(Date.now() + refreshTokenExpiresIn * 1000),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
      refreshToken,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    };
  }

  private async verifyRefresh(token: string): Promise<RefreshPayload> {
    try {
      const payload = await this.jwt.verifyAsync<RefreshPayload>(token, {
        secret: this.refreshSecret,
      });
      if (payload.type !== 'refresh' || !payload.tokenId) throw new Error();
      return payload;
    } catch {
      throw new AppException(
        ErrorCode.AUTH_TOKEN_INVALID,
        '유효하지 않은 Refresh Token입니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
