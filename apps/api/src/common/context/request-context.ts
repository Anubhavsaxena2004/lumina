import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../decorators/roles.decorator';

export interface IRequestContext {
  userId: string;
  username: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  ip: string;
  isOwner: boolean;
  isStaff: boolean;
}

/**
 * Parameter decorator to inject the complete strongly typed RequestContext into controller handlers
 */
export const ReqContext = createParamDecorator(
  (data: keyof IRequestContext | undefined, ctx: ExecutionContext): IRequestContext | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    const ip = request.ip || request.connection?.remoteAddress || '127.0.0.1';

    if (!user) {
      return null;
    }

    const context: IRequestContext = {
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      ip,
      isOwner: user.role === 'OWNER',
      isStaff: user.role === 'STAFF',
    };

    return data ? context[data] : context;
  },
);
