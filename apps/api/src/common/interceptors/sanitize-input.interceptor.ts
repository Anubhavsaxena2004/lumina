import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

const FORBIDDEN_SERVER_FIELDS = [
  'entry_at',
  'created_by',
  'created_at',
  'deleted_at',
  'deleted_by',
  'is_deleted',
  'bill_no',
  'voucher_no',
];

@Injectable()
export class SanitizeInputInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;

    if (body && typeof body === 'object') {
      this.checkObject(body);
    }

    return next.handle();
  }

  private checkObject(obj: any) {
    if (!obj || typeof obj !== 'object') return;

    for (const key of Object.keys(obj)) {
      if (FORBIDDEN_SERVER_FIELDS.includes(key.toLowerCase())) {
        throw new BadRequestException(
          `Field '${key}' is managed exclusively by the server and cannot be submitted.`,
        );
      }
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.checkObject(obj[key]);
      }
    }
  }
}
