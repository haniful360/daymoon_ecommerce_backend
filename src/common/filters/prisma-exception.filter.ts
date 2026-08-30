import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('PrismaExceptionFilter');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';
    let errors: any = null;

    if (exception && exception.code) {
      switch (exception.code) {
        case 'P2002': {
          status = HttpStatus.CONFLICT;
          const fields = (exception.meta?.target as string[]) || [];
          message = `Unique constraint violation: ${fields.join(', ')} already exists`;
          break;
        }
        case 'P2025': {
          status = HttpStatus.NOT_FOUND;
          message = exception.meta?.cause || 'Record not found';
          break;
        }
        case 'P2003': {
          status = HttpStatus.BAD_REQUEST;
          message = `Foreign key constraint failed on field: ${exception.meta?.field_name || 'unknown'}`;
          break;
        }
        case 'P2014': {
          status = HttpStatus.BAD_REQUEST;
          message = 'The change you are trying to make would violate a required relation';
          break;
        }
        default:
          this.logger.error(
            `Prisma Error [${exception.code}]: ${exception.message}`,
            exception.stack,
          );
          message = `Database query failure [${exception.code}]`;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errors,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
