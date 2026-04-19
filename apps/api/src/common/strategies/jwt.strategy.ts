import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UsersService } from '../../modules/users/users.service';
import { JwtPayload } from '../../modules/auth/token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Authorization: Bearer <token> header (cross-origin — Vercel + Render)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // 2. Cookie fallback (same-origin / local dev)
        (req: Request) => {
          return (req?.cookies?.['access_token'] as string) ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret') ?? 'fallback-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.is_banned) {
      throw new UnauthorizedException('User is banned');
    }
    return user;
  }
}
