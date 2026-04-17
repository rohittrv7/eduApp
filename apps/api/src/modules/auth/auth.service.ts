import { BadRequestException, Injectable } from '@nestjs/common';
import { Response, Request } from 'express';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { UsersService } from '../users/users.service';

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

  async setUserRole(email: string, role: 'student' | 'teacher' | 'admin'): Promise<any> {
    let user = await this.usersService.findByEmail(email);
    if (!user) {
      // Create the user if they don't exist yet
      const mobilePlaceholder = `admin_${Date.now()}`;
      user = await this.usersService.createUser({ email, mobile: mobilePlaceholder, role: role as any });
    } else {
      user = await this.usersService.updateUser(user.id, { role: role as any });
    }
    return user;
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
  ): Promise<{ isNewUser: boolean }> {
    await this.otpService.verifyEmailOtp(email, otp);
    const { user, isNewUser } = await this.usersService.findOrCreateByEmail(email);
    await this.tokenService.issueTokens(user, res, deviceInfo);
    await this.usersService.updateStreak(user.id);
    return { isNewUser: isNewUser || !user.full_name };
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
  ): Promise<{ isNewUser: boolean }> {
    const firebasePhone = await this.otpService.verifyFirebaseToken(idToken);
    const mobile = this.otpService.normalizePhoneNumber(firebasePhone);
    const { user, isNewUser } = await this.usersService.findOrCreateByMobile(mobile);
    await this.tokenService.issueTokens(user, res, deviceInfo);
    await this.usersService.updateStreak(user.id);
    return { isNewUser };
  }

  async handleGoogleCallback(
    profile: GoogleProfile,
    res: Response,
  ): Promise<{ isNewUser: boolean; role: string; requiresMobileLinking?: boolean }> {
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

    await this.tokenService.issueTokens(user, res);
    await this.usersService.updateStreak(user.id);
    return { isNewUser: wasCreated, role: user.role };
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

  async refresh(req: Request, res: Response): Promise<void> {
    await this.tokenService.refreshAccessToken(req, res);
  }

  async logout(req: Request, res: Response): Promise<void> {
    await this.tokenService.revokeCurrentToken(req, res);
  }

  async logoutAll(userId: string, res: Response): Promise<void> {
    await this.tokenService.revokeAllTokens(userId);
    this.tokenService.clearCookies(res);
  }
}
