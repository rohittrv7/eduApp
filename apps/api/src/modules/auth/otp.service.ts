/**
 * OtpService — provider-agnostic OTP abstraction
 *
 * Switch provider via OTP_PROVIDER env var:
 *   'email'          → Nodemailer email OTP (free, default)
 *   'phone_firebase' → Firebase Phone Auth (requires Blaze plan)
 *   'msg91'          → MSG91 SMS OTP (future fallback)
 */

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as dns from 'dns';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly provider: string;
  private readonly OTP_TTL_SECONDS = 600; // 10 min
  private firebaseApp?: admin.app.App;
  private mailer?: nodemailer.Transporter;

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {
    this.provider = this.config.get<string>('otp.provider') ?? 'email';

    if (this.provider === 'phone_firebase') {
      this.initFirebase();
    } else if (this.provider === 'email') {
      this.initMailer();
    }
  }

  // ─── Email OTP flow ───────────────────────────────────────────────────────

  /**
   * Generate a 6-digit OTP, hash it, store in Redis, and send via email.
   */
  async sendEmailOtp(email: string): Promise<void> {
    const otp = this.generateOtp();
    const hash = await bcrypt.hash(otp, 10);
    await this.redis.set(`otp:email:${email}`, hash, this.OTP_TTL_SECONDS);

    if (this.config.get<string>('nodeEnv') !== 'production') {
      this.logger.log(`[DEV] Email OTP for ${email}: ${otp}`);
      // Send email asynchronously in dev mode so HTTP request responds instantly (~30ms)
      this.sendEmailViaNodemailer(email, otp).catch(() => {});
    } else {
      await this.sendEmailViaNodemailer(email, otp);
    }
  }

  /**
   * Verify the OTP submitted by the user for email login.
   */
  async verifyEmailOtp(email: string, otp: string): Promise<void> {
    const hash = await this.redis.get(`otp:email:${email}`);
    if (!hash) {
      throw new BadRequestException('OTP has expired or was not requested');
    }
    const isValid = await bcrypt.compare(otp, hash);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP');
    }
    await this.redis.del(`otp:email:${email}`);
  }

  /**
   * Send Password Reset OTP via email
   */
  async sendPasswordResetOtp(email: string): Promise<void> {
    const otp = this.generateOtp();
    const hash = await bcrypt.hash(otp, 10);
    await this.redis.set(`reset:email:${email}`, hash, this.OTP_TTL_SECONDS);

    if (this.config.get<string>('nodeEnv') !== 'production') {
      this.logger.log(`[DEV] Password Reset OTP for ${email}: ${otp}`);
      this.sendEmailViaNodemailer(email, otp, 'Password Reset OTP').catch(() => {});
    } else {
      await this.sendEmailViaNodemailer(email, otp, 'Password Reset OTP');
    }
  }

  /**
   * Verify Password Reset OTP
   */
  async verifyPasswordResetOtp(email: string, otp: string): Promise<void> {
    const hash = await this.redis.get(`reset:email:${email}`);
    if (!hash) {
      throw new BadRequestException('Password reset OTP has expired or was not requested');
    }
    const isValid = await bcrypt.compare(otp, hash);
    if (!isValid) {
      throw new BadRequestException('Invalid Password Reset OTP');
    }
    await this.redis.del(`reset:email:${email}`);
  }

  // ─── Firebase Phone Auth flow ─────────────────────────────────────────────

  /**
   * Verify a Firebase ID token (returned by Firebase SDK after OTP success).
   * Returns the verified phone number e.g. "+919876543210".
   */
  async verifyFirebaseToken(idToken: string): Promise<string> {
    if (this.provider !== 'phone_firebase') {
      throw new BadRequestException('Firebase Phone Auth is not the active provider');
    }
    if (!this.firebaseApp) {
      throw new BadRequestException('Firebase not configured');
    }
    try {
      const decoded = await admin.auth(this.firebaseApp).verifyIdToken(idToken);
      if (!decoded.phone_number) {
        throw new BadRequestException('Firebase token does not contain a phone number');
      }
      return decoded.phone_number;
    } catch (err: any) {
      this.logger.error('Firebase token verification failed', err?.message);
      throw new BadRequestException('Invalid or expired Firebase token');
    }
  }

  /** Strip country code — Firebase returns "+91XXXXXXXXXX", DB stores "XXXXXXXXXX" */
  normalizePhoneNumber(firebasePhone: string): string {
    return firebasePhone.replace(/^\+91/, '').replace(/^\+/, '');
  }

  // ─── MSG91 flow ───────────────────────────────────────────────────────────

  async sendOtp(mobile: string): Promise<void> {
    if (this.provider !== 'msg91') return;
    const otp = this.generateOtp();
    const hash = await bcrypt.hash(otp, 10);
    await this.redis.set(`otp:${mobile}`, hash, this.OTP_TTL_SECONDS);

    if (this.config.get<string>('nodeEnv') !== 'production') {
      this.logger.log(`[DEV] SMS OTP for ${mobile}: ${otp}`);
      return;
    }
    await this.sendViaMSG91(mobile, otp);
  }

  async verifyOtp(mobile: string, otp: string): Promise<void> {
    const hash = await this.redis.get(`otp:${mobile}`);
    if (!hash) throw new BadRequestException('OTP has expired or was not requested');
    const isValid = await bcrypt.compare(otp, hash);
    if (!isValid) throw new BadRequestException('Invalid OTP');
    await this.redis.del(`otp:${mobile}`);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  get activeProvider(): string {
    return this.provider;
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async resolveIpv4Host(hostname: string): Promise<string> {
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return hostname;
    }
    return new Promise((resolve) => {
      dns.resolve4(hostname, (err, addrs) => {
        if (!err && addrs && addrs.length > 0) {
          resolve(addrs[0]!);
        } else {
          resolve(hostname);
        }
      });
    });
  }

  private async sendEmailViaNodemailer(email: string, otp: string, subject = 'Your Login OTP'): Promise<void> {
    const rawHost = this.config.get<string>('email.host') || 'smtp.gmail.com';
    const user = this.config.get<string>('email.user');
    const pass = this.config.get<string>('email.pass');

    if (!user || !pass) {
      this.logger.warn('Email credentials not configured — OTP logged to console only');
      return;
    }

    const port = this.config.get<number>('email.port') || 587;
    const ipv4Host = await this.resolveIpv4Host(rawHost);

    const transporter = nodemailer.createTransport({
      host: ipv4Host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
      tls: {
        servername: rawHost,
        rejectUnauthorized: false,
      },
    } as any);

    try {
      const from = this.config.get<string>('email.from') || user;
      await transporter.sendMail({
        from: `"allEdu" <${from}>`,
        to: email,
        subject,
        text: `Your OTP is: ${otp}\n\nThis OTP is valid for 10 minutes. Do not share it with anyone.`,
        html: `
          <div style="font-family:sans-serif;max-width:400px;margin:auto">
            <h2 style="color:#1a56db">${subject}</h2>
            <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#111">${otp}</p>
            <p style="color:#666">Valid for 10 minutes. Do not share this OTP with anyone.</p>
          </div>
        `,
      });
      this.logger.log(`✅ Email OTP successfully sent to ${email}`);
    } catch (err: any) {
      this.logger.error(`Failed to send email OTP to ${email}: ${err?.message || err}`, err?.stack);
      if (this.config.get<string>('nodeEnv') === 'production') {
        throw new BadRequestException('Failed to send OTP email. Please check email credentials.');
      } else {
        this.logger.warn(`[DEV MODE] Email delivery failed. Use DEV OTP above to log in: ${otp}`);
      }
    }
  }

  private async sendViaMSG91(mobile: string, otp: string): Promise<void> {
    const authKey = this.config.get<string>('msg91.authKey');
    const templateId = this.config.get<string>('msg91.templateId');
    if (!authKey || !templateId) {
      this.logger.warn('MSG91 credentials not configured');
      return;
    }
    try {
      const res = await fetch('https://api.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authkey: authKey },
        body: JSON.stringify({ template_id: templateId, mobile: `91${mobile}`, otp }),
      });
      if (!res.ok) this.logger.error(`MSG91 error: ${res.status}`);
    } catch (err) {
      this.logger.error('Failed to send OTP via MSG91', err);
    }
  }

  private initFirebase(): void {
    if (admin.apps.length > 0) {
      this.firebaseApp = admin.apps[0]!;
      return;
    }
    const projectId = this.config.get<string>('firebase.projectId');
    const privateKey = this.config.get<string>('firebase.privateKey')?.replace(/\\n/g, '\n');
    const clientEmail = this.config.get<string>('firebase.clientEmail');

    if (!projectId || !privateKey || !clientEmail) {
      this.logger.warn('Firebase credentials not configured');
      return;
    }
    this.firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({ projectId, privateKey, clientEmail }),
    });
  }

  private initMailer(): void {
    // Transporter created dynamically per request in sendEmailViaNodemailer with IPv4 host resolution
  }
}
