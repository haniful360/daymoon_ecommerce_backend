import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';

/**
 * Global or Param Pipe that automatically trims leading/trailing whitespace from string inputs
 */
@Injectable()
export class TrimPipe implements PipeTransform {
  transform(values: any, metadata: ArgumentMetadata) {
    if (typeof values === 'string') {
      return values.trim();
    }

    if (this.isObject(values)) {
      return this.trimObject(values);
    }

    return values;
  }

  private isObject(obj: any): boolean {
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
  }

  private trimObject(obj: Record<string, any>): Record<string, any> {
    const trimmed: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        trimmed[key] = value.trim();
      } else if (this.isObject(value)) {
        trimmed[key] = this.trimObject(value);
      } else if (Array.isArray(value)) {
        trimmed[key] = value.map((item) =>
          typeof item === 'string'
            ? item.trim()
            : this.isObject(item)
              ? this.trimObject(item)
              : item,
        );
      } else {
        trimmed[key] = value;
      }
    }
    return trimmed;
  }
}
