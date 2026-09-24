import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

import { AppException } from '../errors/app.exception';
import { ErrorCode } from '../errors/error-code';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof AppException) {
      response.status(exception.getStatus()).json({
        success: false,
        error: {
          code: exception.code,
          message: exception.message,
          ...(exception.details !== undefined
            ? { details: exception.details }
            : {}),
        },
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const payloadObject =
        typeof payload === 'object' && payload !== null
          ? (payload as Record<string, unknown>)
          : undefined;
      const rawMessage = payloadObject?.message ?? exception.message;
      const message = Array.isArray(rawMessage)
        ? '요청 값을 확인해주세요.'
        : String(rawMessage);

      response.status(status).json({
        success: false,
        error: {
          code:
            status === HttpStatus.BAD_REQUEST
              ? ErrorCode.VALIDATION_FAILED
              : ErrorCode.AUTH_TOKEN_INVALID,
          message,
          ...(Array.isArray(rawMessage) ? { details: rawMessage } : {}),
        },
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: '서버 오류가 발생했습니다.',
      },
    });
  }
}
