import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SignUpDto {
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @Transform(({ value }) => String(value).trim())
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  name!: string;

  @Transform(({ value }) =>
    String(value).trim().replace(/^@/, '').toLowerCase(),
  )
  @Matches(/^[a-z0-9._]{3,20}$/, {
    message: 'username은 영문 소문자, 숫자, 점, 밑줄로 3~20자여야 합니다.',
  })
  username!: string;
}
