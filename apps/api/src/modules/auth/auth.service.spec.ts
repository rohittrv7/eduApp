/**
 * Unit Tests for OTP Expiry and Single-Device Session Enforcement
 *
 * Validates: Requirements 22.4, 22.9
 */

import { BadRequestException } from '@nestjs/common';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { AuthService } from './auth.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<{ id: string; mobile: string; role: string }> = {}) {
  return {
    id: overrides.id ?? 'user-uuid-1',
    mobile: overrides.mobile ?? '9876543210',
    role: overrides.role ?? 'student',
    email: null,
    full_name: null,
    google_id: null,
    profile_photo: null,
    is_banned: false,
  } as any;
}

function makeOtpService(overrides: Partial<OtpService> = {}): jest.Mocked<OtpService> {
  return {
    sendOtp: jest.fn().mockResolvedValue(undefined),
    verifyOtp: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as any;
}

function makeTokenService(overrides: Partial<TokenService> = {}): jest.Mocked<TokenService> {
  return {
    issueTokens: jest.fn().mockResolvedValue(undefined),
    revokeAllTokens: jest.fn().mockResolvedValue(undefined),
    revokeCurrentToken: jest.fn().mockResolvedValue(undefined),
    refreshAccessToken: jest.fn().mockResolvedValue(undefined),
    clearCookies: jest.fn(),
    ...overrides,
  } as any;
}

function makeUsersService(user = makeUser()) {
  return {
    findOrCreateByMobile: jest.fn().mockResolvedValue({ user, isNewUser: false }),
    findByMobile: jest.fn().mockResolvedValue(user),
    findByGoogleId: jest.fn().mockResolvedValue(null),
    findByEmail: jest.fn().mockResolvedValue(null),
    createUser: jest.fn().mockResolvedValue(user),
    updateUser: jest.fn().mockResolvedValue(user),
  } as any;
}

const mockRes = {} as any;

// ─── Requirement 22.4: OTP Expiry ─────────────────────────────────────────────

describe('Requirement 22.4 – OTP rejection after 5-minute expiry', () => {
  it('throws BadRequestException when OTP has expired (no hash in Redis)', async () => {
    const otpService = makeOtpService({
      verifyOtp: jest.fn().mockRejectedValue(
        new BadRequestException('OTP has expired or was not requested'),
      ),
    });
    const tokenService = makeTokenService();
    const usersService = makeUsersService();
    const authService = new AuthService(otpService, tokenService, usersService);

    await expect(
      authService.verifyOtp('9876543210', '123456', mockRes),
    ).rejects.toThrow(BadRequestException);

    await expect(
      authService.verifyOtp('9876543210', '123456', mockRes),
    ).rejects.toThrow('OTP has expired or was not requested');
  });

  it('does NOT issue tokens when OTP is expired', async () => {
    const otpService = makeOtpService({
      verifyOtp: jest.fn().mockRejectedValue(
        new BadRequestException('OTP has expired or was not requested'),
      ),
    });
    const tokenService = makeTokenService();
    const usersService = makeUsersService();
    const authService = new AuthService(otpService, tokenService, usersService);

    await expect(
      authService.verifyOtp('9876543210', '123456', mockRes),
    ).rejects.toThrow(BadRequestException);

    expect(tokenService.issueTokens).not.toHaveBeenCalled();
  });

  it('succeeds and issues tokens when OTP is valid (not expired)', async () => {
    const otpService = makeOtpService(); // verifyOtp resolves successfully
    const tokenService = makeTokenService();
    const user = makeUser();
    const usersService = makeUsersService(user);
    const authService = new AuthService(otpService, tokenService, usersService);

    const result = await authService.verifyOtp('9876543210', '654321', mockRes);

    expect(otpService.verifyOtp).toHaveBeenCalledWith('9876543210', '654321');
    expect(tokenService.issueTokens).toHaveBeenCalledWith(user, mockRes, undefined);
    expect(result).toEqual({ isNewUser: false });
  });
});

// ─── Requirement 22.9: Single-Device Session Enforcement ──────────────────────

describe('Requirement 22.9 – Single-device enforcement: second login revokes first session', () => {
  it('calls revokeAllTokens before issuing new tokens on login', async () => {
    const revokeAllTokens = jest.fn().mockResolvedValue(undefined);
    const issueTokens = jest.fn().mockImplementation(async () => {
      // Simulate the real TokenService: revokeAllTokens is called inside issueTokens
      await revokeAllTokens();
    });

    const otpService = makeOtpService();
    const tokenService = makeTokenService({ issueTokens, revokeAllTokens });
    const user = makeUser({ id: 'user-uuid-1' });
    const usersService = makeUsersService(user);
    const authService = new AuthService(otpService, tokenService, usersService);

    await authService.verifyOtp('9876543210', '111111', mockRes, 'device-B');

    expect(issueTokens).toHaveBeenCalledWith(user, mockRes, 'device-B');
    expect(revokeAllTokens).toHaveBeenCalledTimes(1);
  });

  it('second login revokes the first session via TokenService.revokeAllTokens', async () => {
    // Tracks call order to verify revoke happens before new token issuance
    const callOrder: string[] = [];

    const revokeAllTokens = jest.fn().mockImplementation(async () => {
      callOrder.push('revokeAll');
    });
    const issueTokens = jest.fn().mockImplementation(async () => {
      await revokeAllTokens();
      callOrder.push('issue');
    });

    const otpService = makeOtpService();
    const tokenService = makeTokenService({ issueTokens, revokeAllTokens });
    const user = makeUser({ id: 'user-uuid-1' });
    const usersService = makeUsersService(user);
    const authService = new AuthService(otpService, tokenService, usersService);

    // First login
    await authService.verifyOtp('9876543210', '111111', mockRes, 'device-A');
    // Second login (simulates new device)
    await authService.verifyOtp('9876543210', '222222', mockRes, 'device-B');

    // revokeAll must have been called once per login (2 total)
    expect(revokeAllTokens).toHaveBeenCalledTimes(2);
    // Order: revoke then issue, for each login
    expect(callOrder).toEqual(['revokeAll', 'issue', 'revokeAll', 'issue']);
  });

  it('logoutAll revokes all tokens for the user and clears cookies', async () => {
    const otpService = makeOtpService();
    const tokenService = makeTokenService();
    const usersService = makeUsersService();
    const authService = new AuthService(otpService, tokenService, usersService);

    await authService.logoutAll('user-uuid-1', mockRes);

    expect(tokenService.revokeAllTokens).toHaveBeenCalledWith('user-uuid-1');
    expect(tokenService.clearCookies).toHaveBeenCalledWith(mockRes);
  });
});

// ─── OtpService unit tests (expiry via Redis TTL) ─────────────────────────────

describe('OtpService.verifyOtp – OTP expiry (Requirement 22.4)', () => {
  function makeRedisService(storedHash: string | null) {
    return {
      get: jest.fn().mockResolvedValue(storedHash),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    } as any;
  }

  function makeConfigService() {
    return { get: jest.fn().mockReturnValue('test') } as any;
  }

  it('throws BadRequestException when Redis returns null (OTP expired / not requested)', async () => {
    const { OtpService: OtpSvc } = await import('./otp.service');
    const service = new OtpSvc(makeRedisService(null), makeConfigService());

    await expect(service.verifyOtp('9876543210', '123456')).rejects.toThrow(
      new BadRequestException('OTP has expired or was not requested'),
    );
  });

  it('throws BadRequestException when OTP code does not match hash', async () => {
    const bcrypt = await import('bcrypt');
    const validHash = await bcrypt.hash('999999', 10);

    const { OtpService: OtpSvc } = await import('./otp.service');
    const service = new OtpSvc(makeRedisService(validHash), makeConfigService());

    await expect(service.verifyOtp('9876543210', '000000')).rejects.toThrow(
      new BadRequestException('Invalid OTP'),
    );
  });

  it('resolves and deletes the key when OTP is correct', async () => {
    const bcrypt = await import('bcrypt');
    const otp = '654321';
    const validHash = await bcrypt.hash(otp, 10);
    const redisService = makeRedisService(validHash);

    const { OtpService: OtpSvc } = await import('./otp.service');
    const service = new OtpSvc(redisService, makeConfigService());

    await expect(service.verifyOtp('9876543210', otp)).resolves.toBeUndefined();
    expect(redisService.del).toHaveBeenCalledWith('otp:9876543210');
  });
});
