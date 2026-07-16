import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifyFirebaseTokenDto } from './dto/verify-firebase-token.dto';
import { RequestEmailOtpDto } from './dto/request-email-otp.dto';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';
import { LinkMobileDto } from './dto/link-mobile.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('bootstrap')
  @HttpCode(HttpStatus.OK)
  async bootstrap(
    @Body() body: { secret: string; email: string; role?: string },
  ): Promise<{ message: string }> {
    const bootstrapSecret = process.env['BOOTSTRAP_SECRET'];
    if (!bootstrapSecret || body.secret !== bootstrapSecret) {
      throw new Error('Unauthorized');
    }
    const user = await this.authService.setUserRole(body.email, (body.role as any) || 'admin');
    return { message: `User ${user.email} is now ${user.role}` };
  }
  @Public()
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() dto: RequestOtpDto): Promise<{ message: string }> {
    await this.authService.requestOtp(dto.mobile);
    return { message: 'OTP is sent via Firebase Phone Auth on the client side' };
  }

  /**
   * Email OTP — request (active when OTP_PROVIDER=email).
   */
  @Public()
  @Post('email/request-otp')
  @HttpCode(HttpStatus.OK)
  async requestEmailOtp(@Body() dto: RequestEmailOtpDto): Promise<{ message: string }> {
    await this.authService.requestEmailOtp(dto.email);
    return { message: 'OTP sent to your email' };
  }

  /**
   * Email OTP — verify (active when OTP_PROVIDER=email).
   */
  @Public()
  @Post('email/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyEmailOtp(
    @Body() dto: VerifyEmailOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ isNewUser: boolean }> {
    const deviceInfo = req.headers['user-agent'] ?? undefined;
    return this.authService.verifyEmailOtp(dto.email, dto.otp, res, deviceInfo as string);
  }

  /**
   * MSG91 OTP verify endpoint (active when OTP_PROVIDER=msg91).
   * For Firebase flow, use POST /auth/firebase/verify instead.
   */
  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ isNewUser: boolean }> {
    const deviceInfo = req.headers['user-agent'] ?? null;
    return this.authService.verifyOtp(dto.mobile, dto.otp, res, deviceInfo as string);
  }

  /**
   * Primary auth endpoint for Firebase Phone Auth flow.
   * Frontend sends the Firebase ID token after OTP verification.
   */
  @Public()
  @Post('firebase/verify')
  @HttpCode(HttpStatus.OK)
  async verifyFirebaseToken(
    @Body() dto: VerifyFirebaseTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ isNewUser: boolean }> {
    const deviceInfo = req.headers['user-agent'] ?? null;
    return this.authService.verifyFirebaseToken(dto.idToken, res, deviceInfo as string);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() body: { refreshToken?: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken?: string; message: string }> {
    return this.authService.refresh(req, res, body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.logout(req, res);
    return { message: 'Logged out' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.logoutAll(user.id, res);
    return { message: 'Logged out from all devices' };
  }

  // Google OAuth
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {
    // Redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request & { user: any },
    @Res() res: Response,
  ): Promise<void> {
    let frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:3000';
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    if (isMobile || process.env['NODE_ENV'] === 'production') {
      if (frontendUrl.includes('localhost')) {
        frontendUrl = 'https://edu-app-web.vercel.app';
      }
    }
    frontendUrl = (frontendUrl.split(',')[0] || '').trim().replace(/\/$/, '');
    const result = await this.authService.handleGoogleCallback(req.user, res);

    const dest = result.isNewUser ? 'onboarding'
      : result.role === 'teacher' ? 'teacher/dashboard'
      : result.role === 'admin' ? 'admin/dashboard'
      : 'student/dashboard';

    // Redirect to frontend auth-success page with tokens in URL params
    // (cross-origin cookie approach doesn't work between Render and Vercel)
    const params = new URLSearchParams({
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      redirect: `/${dest}`,
    });
    res.redirect(`${frontendUrl}/auth/google/success?${params.toString()}`);
  }

  @Public()
  @Post('google/mobile')
  @HttpCode(HttpStatus.OK)
  async googleMobileAuth(
    @Body() dto: { idToken: string },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ isNewUser: boolean; accessToken: string; refreshToken: string }> {
    return this.authService.verifyGoogleMobileToken(dto.idToken, res);
  }

  @Public()
  @Post('google/link-mobile')
  @HttpCode(HttpStatus.OK)
  async linkMobile(
    @Body() dto: LinkMobileDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.linkMobileToGoogle(dto.googleId, dto.mobile, dto.otp, res);
    return { message: 'Mobile linked successfully' };
  }
}
