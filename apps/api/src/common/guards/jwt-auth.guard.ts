import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IS_OPTIONAL_JWT_KEY } from '../decorators/optional-jwt.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  private isOptionalRoute(context: ExecutionContext): boolean {
    return this.reflector.getAllAndOverride<boolean>(IS_OPTIONAL_JWT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? false;
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    if (this.isOptionalRoute(context)) {
      try {
        // Try to authenticate — if it fails, still allow through (user = null)
        return (await super.canActivate(context)) as boolean;
      } catch {
        return true;
      }
    }

    return super.canActivate(context) as Promise<boolean>;
  }

  // For optional routes: swallow auth errors, return null user
  override handleRequest(err: any, user: any, _info: any, context: ExecutionContext) {
    if (this.isOptionalRoute(context)) {
      return user ?? null;
    }
    if (err || !user) throw err || new Error('Unauthorized');
    return user;
  }
}
