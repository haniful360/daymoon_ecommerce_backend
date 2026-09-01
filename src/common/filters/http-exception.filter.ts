import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../interfaces';
import { handlePrismaException } from './prisma-exception.filter';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error occurred';
    let errors: string[] | Record<string, any> | null = null;

    // 1. Handle NestJS HttpExceptions (BadRequest, Unauthorized, ValidationPipe errors, etc.)
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const respObj = exceptionResponse as Record<string, any>;
        
        // Handle class-validator ValidationPipe error array
        if (Array.isArray(respObj['message'])) {
          statusCode = HttpStatus.BAD_REQUEST;
          message = 'Validation failed';
          errors = respObj['message'];
        } else {
          message = respObj['message'] || exception.message;
          errors = respObj['error'] ? [respObj['error']] : null;
        }
      } else {
        message = String(exceptionResponse);
      }
    }
    // 2. Handle Prisma Known Database Request Errors (Unique constraint P2002, Record Not Found P2025, etc.)
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaParsed = handlePrismaException(exception, this.logger);
      statusCode = prismaParsed.statusCode;
      message = prismaParsed.message;
      errors = [`Prisma Error [${exception.code}]`];
    }
    // 3. Handle Prisma Validation Errors
    else if (exception instanceof Prisma.PrismaClientValidationError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Database query validation error. Please check your input parameters.';
      this.logger.warn(`Prisma Validation Error: ${exception.message}`);
    }
    // 4. Handle standard JavaScript Errors
    else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `💥 Unhandled Server Exception at ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error(
        `💥 Unknown Exception at ${request.method} ${request.url}`,
        JSON.stringify(exception),
      );
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      statusCode,
      message,
      errors,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(errorResponse);
  }
}

// Re-export as HttpExceptionFilter for backwards compatibility
export { AllExceptionsFilter as HttpExceptionFilter };
