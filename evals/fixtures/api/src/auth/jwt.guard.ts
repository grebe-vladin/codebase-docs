import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
@Injectable() export class JwtGuard implements CanActivate { canActivate(ctx: ExecutionContext) { return !!ctx.switchToHttp().getRequest().headers.authorization && !!process.env.JWT_SECRET; } }
