import { BadRequestException, Injectable } from '@nestjs/common';
import { Response, Request } from 'express';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { UsersService } from '../users/users.service';
import { RegisterEmailDto } from './dto/register-email.dto';
import { LoginEmailDto } from './dto/login-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

export interface GoogleProfile {
  googleId: string;
  email: string;
  displayName: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
  ) {}

  async register(
    dto: RegisterEmailDto,
    res: Response,
    deviceInfo?: string,
  ): Promise<{ isNewUser: boolean; accessToken: string }> {
    const { user } = await this.usersService.registerEmail({
      email: dto.email,
      password: dto.password,
      full_name: dto.full_name,
      role: dto.role,
    });
    const { accessToken } = await this.tokenService.issueTokens(user, res, deviceInfo);
    await this.usersService.updateStreak(user.id);
    return { isNewUser: true, accessToken };
  }

  async login(
    dto: LoginEmailDto,
    res: Response,
    deviceInfo?: string,
  ): Promise<{ isNewUser: boolean; accessToken: string }> {
    const user = await this.usersService.validateEmailPassword(dto.email, dto.password);
    const { accessToken } = await this.tokenService.issueTokens(user, res, deviceInfo);
    await this.usersService.updateStreak(user.id);
    return { isNewUser: !user.full_name, accessToken };
  }

  async forgotPassword(email: string): Promise<void> {
    // Always send same response regardless of whether email exists
    // to prevent user enumeration attacks
    const user = await this.usersService.findByEmail(email);
    if (user) {
      // Only send OTP if user exists — silently skip otherwise
      await this.otpService.sendPasswordResetOtp(email);
    }
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    await this.otpService.verifyPasswordResetOtp(dto.email, dto.otp);
    await this.usersService.resetPassword(dto.email, dto.newPassword);
  }

  async requestOtp(mobile: string): Promise<void> {
    // Firebase: no-op (OTP sent client-side via Firebase SDK)
    // MSG91: generates OTP, sends SMS, stores hash in Redis
    await this.otpService.sendOtp(mobile);
  }

  async requestEmailOtp(email: string): Promise<void> {
    await this.otpService.sendEmailOtp(email);
  }

  async verifyEmailOtp(
    email: string,
    otp: string,
    res: Response,
    deviceInfo?: string,
  ): Promise<{ isNewUser: boolean; accessToken: string }> {
    await this.otpService.verifyEmailOtp(email, otp);
    const { user, isNewUser } = await this.usersService.findOrCreateByEmail(email);
    const { accessToken } = await this.tokenService.issueTokens(user, res, deviceInfo);
    await this.usersService.updateStreak(user.id);
    return { isNewUser: isNewUser || !user.full_name, accessToken };
  }

  async verifyOtp(
    mobile: string,
    otp: string,
    res: Response,
    deviceInfo?: string,
  ): Promise<{ isNewUser: boolean }> {
    // Only active when OTP_PROVIDER=msg91
    await this.otpService.verifyOtp(mobile, otp);
    const { user, isNewUser } = await this.usersService.findOrCreateByMobile(mobile);
    await this.tokenService.issueTokens(user, res, deviceInfo);
    return { isNewUser };
  }

  /**
   * Firebase Phone Auth flow (active when OTP_PROVIDER=firebase).
   * Frontend verifies OTP via Firebase SDK → gets ID token → sends here.
   */
  async verifyFirebaseToken(
    idToken: string,
    res: Response,
    deviceInfo?: string,
  ): Promise<{ isNewUser: boolean; accessToken: string }> {
    const firebasePhone = await this.otpService.verifyFirebaseToken(idToken);
    const mobile = this.otpService.normalizePhoneNumber(firebasePhone);
    const { user, isNewUser } = await this.usersService.findOrCreateByMobile(mobile);
    const { accessToken } = await this.tokenService.issueTokens(user, res, deviceInfo);
    await this.usersService.updateStreak(user.id);
    return { isNewUser, accessToken };
  }

  async handleGoogleCallback(
    profile: GoogleProfile,
    res: Response,
  ): Promise<{ isNewUser: boolean; role: string; accessToken: string }> {
    // Try to find by google_id first, then by email
    let user = await this.usersService.findByGoogleId(profile.googleId);
    let wasCreated = false;

    if (!user && profile.email) {
      user = await this.usersService.findByEmail(profile.email);
      if (user) {
        // Link google_id to existing account
        user = await this.usersService.updateUser(user.id, {
          google_id: profile.googleId,
          full_name: user.full_name || profile.displayName,
        });
      }
    }

    if (!user) {
      // New Google user — create account directly, no mobile required
      const mobilePlaceholder = `google_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
      user = await this.usersService.createUser({
        google_id: profile.googleId,
        email: profile.email,
        full_name: profile.displayName,
        mobile: mobilePlaceholder,
      });
      wasCreated = true;
    }

    const { accessToken } = await this.tokenService.issueTokens(user, res);
    await this.usersService.updateStreak(user.id);
    return { isNewUser: wasCreated, role: user.role, accessToken };
  }

  async linkMobileToGoogle(
    googleId: string,
    mobile: string,
    otp: string,
    res: Response,
  ): Promise<void> {
    await this.otpService.verifyOtp(mobile, otp);

    let user = await this.usersService.findByMobile(mobile);
    if (user) {
      // Link google_id to existing mobile account
      user = await this.usersService.updateUser(user.id, { google_id: googleId });
    } else {
      // Create new user with both mobile and google_id
      user = await this.usersService.createUser({ mobile, google_id: googleId });
    }

    if (!user) {
      throw new BadRequestException('Failed to link mobile to Google account');
    }

    await this.tokenService.issueTokens(user, res);
  }

  async refresh(
    req: Request,
    res: Response,
    refreshTokenFromBody?: string,
  ): Promise<{ accessToken?: string; message: string }> {
    return this.tokenService.refreshAccessToken(req, res, refreshTokenFromBody);
  }

  async logout(req: Request, res: Response): Promise<void> {
    await this.tokenService.revokeCurrentToken(req, res);
  }

  async logoutAll(userId: string, res: Response): Promise<void> {
    await this.tokenService.revokeAllTokens(userId);
    this.tokenService.clearCookies(res);
  }
}
