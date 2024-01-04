import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class ExceptionMiddleware implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const errorInstanceStatus =
      exception.getStatus() ?? HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(errorInstanceStatus).json({
      status_code: errorInstanceStatus,
      status_description: exception.getResponse()['message']
    });
  }
}
