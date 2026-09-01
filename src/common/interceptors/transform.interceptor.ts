import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode ?? 200;

    return next.handle().pipe(
      map((res) => {
        // If response is already formatted as ApiResponse, return as is
        if (
          res &&
          typeof res === 'object' &&
          'success' in res &&
          'statusCode' in res
        ) {
          return res;
        }

        // Handle Paginated Responses: { data: [...], meta: { total, page, limit, totalPages } }
        if (
          res &&
          typeof res === 'object' &&
          'meta' in res &&
          ('data' in res || 'items' in res)
        ) {
          return {
            success: true,
            statusCode,
            message: 'Data retrieved successfully',
            data: (res as any).data ?? (res as any).items,
            meta: res.meta,
            timestamp: new Date().toISOString(),
          };
        }

        // Handle Object with custom message: { message: "...", ...data }
        if (
          res &&
          typeof res === 'object' &&
          'message' in res &&
          typeof res.message === 'string'
        ) {
          const { message, ...rest } = res;
          const dataKeys = Object.keys(rest);
          return {
            success: true,
            statusCode,
            message,
            data: dataKeys.length === 0 ? null : (rest as any),
            timestamp: new Date().toISOString(),
          };
        }

        // Standard response wrapper
        return {
          success: true,
          statusCode,
          message: 'Operation completed successfully',
          data: res ?? null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
