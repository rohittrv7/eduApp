import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Response, Request } from 'express';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from '../users/entities/user.entity';

export interface JwtPayload {
  sub: string;
  role: string;
  mobile?: string | null;
  email?: string | null;
  full_name?: string;
  session_version?: number;
}

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async issueTokens(user: User, res: Response, deviceInfo?: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Single-device enforcement: increment session_version to invalidate prior access tokens
    user.session_version = (user.session_version || 0) + 1;
    await this.userRepository.save(user);

    // Revoke all existing refresh tokens
    await this.revokeAllTokens(user.id);

    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      mobile: user.mobile ?? null,
      email: user.email ?? null,
      full_name: user.full_name ?? undefined,
      session_version: user.session_version,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn') ?? '15m',
    });

    const refreshTokenValue = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d',
    });

    const tokenHash = await bcrypt.hash(refreshTokenValue, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        device_info: deviceInfo ?? null,
        revoked: false,
      }),
    );

    const isProd = this.configService.get<string>('nodeEnv') === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', refreshTokenValue, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }

  async refreshAccessToken(req: Request, res: Response, refreshTokenFromBody?: string): Promise<{ accessToken?: string; message: string }> {
    // Accept token from body (cross-origin) or cookie (same-origin)
    const refreshTokenValue = refreshTokenFromBody || (req.cookies?.['refresh_token'] as string | undefined);
    if (!refreshTokenValue) {
      throw new UnauthorizedException('No refresh token provided');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshTokenValue, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Find matching token in DB
    const tokens = await this.refreshTokenRepository.find({
      where: { user_id: payload.sub, revoked: false },
    });

    let matchedToken: RefreshToken | null = null;
    for (const token of tokens) {
      const isMatch = await bcrypt.compare(refreshTokenValue, token.token_hash);
      if (isMatch) {
        matchedToken = token;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Refresh token not found or revoked');
    }

    if (new Date() > matchedToken.expires_at) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const newAccessToken = this.jwtService.sign(
      { sub: payload.sub, role: payload.role, mobile: payload.mobile, email: payload.email, session_version: payload.session_version },
      {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<string>('jwt.accessExpiresIn') ?? '15m',
      },
    );

    const isProd = this.configService.get<string>('nodeEnv') === 'production';
    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
    });

    return { accessToken: newAccessToken, message: 'Token refreshed' };
  }

  async revokeToken(tokenId: string): Promise<void> {
    await this.refreshTokenRepository.update(tokenId, { revoked: true });
  }

  async revokeAllTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { user_id: userId, revoked: false },
      { revoked: true },
    );
  }

  async revokeCurrentToken(req: Request, res: Response): Promise<void> {
    const refreshTokenValue = req.cookies?.['refresh_token'] as string | undefined;
    if (refreshTokenValue) {
      try {
        const payload = this.jwtService.verify<JwtPayload>(refreshTokenValue, {
          secret: this.configService.get<string>('jwt.refreshSecret'),
        });

        const tokens = await this.refreshTokenRepository.find({
          where: { user_id: payload.sub, revoked: false },
        });

        for (const token of tokens) {
          const isMatch = await bcrypt.compare(refreshTokenValue, token.token_hash);
          if (isMatch) {
            await this.revokeToken(token.id);
            break;
          }
        }
      } catch {
        // Token invalid, just clear cookies
      }
    }

    this.clearCookies(res);
  }

  clearCookies(res: Response): void {
    const isProd = this.configService.get<string>('nodeEnv') === 'production';
    const options = {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
    };
    res.clearCookie('access_token', options);
    res.clearCookie('refresh_token', options);
  }
}
