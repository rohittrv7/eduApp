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
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifyFirebaseTokenDto } from './dto/verify-firebase-token.dto';
import { RequestEmailOtpDto } from './dto/request-email-otp.dto';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';
import { RegisterEmailDto } from './dto/register-email.dto';
import { LoginEmailDto } from './dto/login-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
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
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterEmailDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ isNewUser: boolean; accessToken: string }> {
    const deviceInfo = req.headers['user-agent'] ?? undefined;
    return this.authService.register(dto, res, deviceInfo);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 per min
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginEmailDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ isNewUser: boolean; accessToken: string }> {
    const deviceInfo = req.headers['user-agent'] ?? undefined;
    return this.authService.login(dto, res, deviceInfo);
  }

  @Public()
  @Throttle({ default: { ttl: 900000, limit: 3 } }) // 3 per 15 min per IP
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.forgotPassword(dto.email);
    return {
      message: 'If an account with that email exists, a password reset link/OTP has been sent.',
    };
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 per min
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(dto);
    return { message: 'Password reset successfully. Please log in with your new password.' };
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3 } }) // 3 per min
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
  @Throttle({ default: { ttl: 60000, limit: 3 } }) // 3 per min
  @Post('email/request-otp')
  @HttpCode(HttpStatus.OK)
  async requestEmailOtp(@Body() dto: RequestEmailOtpDto): Promise<{ message: string }> {
    await this.authService.requestEmailOtp(dto.email);
    return { message: 'If registered, OTP has been sent to your email.' };
  }

  /**
   * Email OTP — verify (active when OTP_PROVIDER=email).
   */
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 attempts per min
  @Post('email/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyEmailOtp(
    @Body() dto: VerifyEmailOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ isNewUser: boolean; accessToken: string }> {
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
  ): Promise<{ isNewUser: boolean; accessToken: string }> {
    const deviceInfo = req.headers['user-agent'] ?? null;
    const result = await this.authService.verifyFirebaseToken(
      dto.idToken,
      res,
      deviceInfo as string,
    );
    return { isNewUser: result.isNewUser, accessToken: result.accessToken };
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
  async googleCallback(@Req() req: Request & { user: any }, @Res() res: Response): Promise<void> {
    const rawFrontendUrls = (process.env['FRONTEND_URL'] || 'http://localhost:3000')
      .split(',')
      .map((u) => u.trim().replace(/\/$/, ''));
    const isProd = process.env['NODE_ENV'] === 'production';
    const frontendUrl =
      (isProd ? rawFrontendUrls.find((u) => !u.includes('localhost')) : null) ||
      rawFrontendUrls[0] ||
      'http://localhost:3000';
    const result = await this.authService.handleGoogleCallback(req.user, res);

    const dest = result.isNewUser
      ? 'onboarding'
      : result.role === 'teacher'
        ? 'teacher/dashboard'
        : result.role === 'admin'
          ? 'admin/dashboard'
          : 'student/dashboard';

    // Post tokens via hidden form instead of URL params to avoid
    // leaking tokens in browser history, server logs and referrer headers
    const html = `<!DOCTYPE html><html><body>
<form id="f" method="POST" action="${frontendUrl}/auth/google/success">
  <input type="hidden" name="access_token" value="${result.accessToken}">
  <input type="hidden" name="redirect" value="/${dest}">
</form>
<script>document.getElementById('f').submit();</script>
</body></html>`;
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store');
    res.send(html);
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
