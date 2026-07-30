/**
 * Property-Based Tests for JWT Token Issuance Correctness
 *
 * **Validates: Requirements 15.2, 40.1**
 *
 * Property 12: JWT Token Issuance Correctness
 * For any valid OTP verification, the issued access token must:
 *   - Decode to the correct userId (sub) and role
 *   - Have an expiry within 15 minutes of issuance
 */

import * as fc from 'fast-check';
import { JwtService } from '@nestjs/jwt';
import { TokenService, JwtPayload } from './token.service';
import { UserRole } from '../users/entities/user.entity';
import { User } from '../users/entities/user.entity';

// ─── Minimal stubs ────────────────────────────────────────────────────────────

const ACCESS_SECRET = 'test-access-secret';
const REFRESH_SECRET = 'test-refresh-secret';
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

function makeJwtService(): JwtService {
  return new JwtService({});
}

function makeConfigService() {
  return {
    get: (key: string): string | undefined => {
      const map: Record<string, string> = {
        'jwt.accessSecret': ACCESS_SECRET,
        'jwt.refreshSecret': REFRESH_SECRET,
        'jwt.accessExpiresIn': ACCESS_EXPIRES_IN,
        'jwt.refreshExpiresIn': REFRESH_EXPIRES_IN,
        nodeEnv: 'test',
      };
      return map[key];
    },
  };
}

function makeRefreshTokenRepository() {
  return {
    find: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockImplementation((data: unknown) => data),
    update: jest.fn().mockResolvedValue({}),
  };
}

function makeUserRepository() {
  return {
    save: jest.fn().mockImplementation((user: unknown) => Promise.resolve(user)),
    findOne: jest.fn(),
  };
}

function makeMockResponse() {
  const cookies: Record<string, string> = {};
  return {
    cookie: jest.fn((name: string, value: string) => {
      cookies[name] = value;
    }),
    _cookies: cookies,
  };
}

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const roleArb = fc.constantFrom(
  UserRole.STUDENT,
  UserRole.TEACHER,
  UserRole.ADMIN,
  UserRole.PARENT,
);

/** Generates a plausible User object with arbitrary id, mobile, and role */
const userArb = fc
  .record({
    id: fc.uuid(),
    mobile: fc.stringMatching(/^\+91[6-9]\d{9}$/),
    role: roleArb,
  })
  .map(
    ({ id, mobile, role }) =>
      ({
        id,
        mobile,
        role,
        email: null,
        full_name: null,
        google_id: null,
        profile_photo: null,
        class_grade: null,
        target_exam: null,
        language_pref: 'hindi',
        skill_level: 'basic',
        cumulative_score: 0,
        streak_count: 0,
        last_active: null,
        is_banned: false,
        ban_reason: null,
        referral_code: 'REF000',
        exam_target_date: null,
        low_bandwidth_mode: false,
        created_at: new Date(),
        updated_at: new Date(),
      }) as User,
  );

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Property 12: JWT Token Issuance Correctness', () => {
  let jwtService: JwtService;
  let tokenService: TokenService;

  beforeEach(() => {
    jwtService = makeJwtService();
    tokenService = new TokenService(
      makeRefreshTokenRepository() as any,
      makeUserRepository() as any,
      jwtService,
      makeConfigService() as any,
    );
  });

  /**
   * **Validates: Requirements 15.2, 40.1**
   *
   * For any valid user (arbitrary userId and role), the access token issued by
   * TokenService.issueTokens must decode to the exact same userId (sub) and role.
   */
  it(
    'access token always decodes to the correct userId and role',
    async () => {
      await fc.assert(
        fc.asyncProperty(userArb, async (user) => {
          const res = makeMockResponse();

          await tokenService.issueTokens(user, res as any);

          const accessToken = res._cookies['access_token'];
          expect(accessToken).toBeDefined();
          if (typeof accessToken !== 'string') throw new Error('Access token cookie missing');

          const decoded = jwtService.verify<JwtPayload>(accessToken, {
            secret: ACCESS_SECRET,
          });

          expect(decoded.sub).toBe(user.id);
          expect(decoded.role).toBe(user.role);
          expect(decoded.mobile).toBe(user.mobile);
        }),
        { numRuns: 20 },
      );
    },
    30000,
  );

  /**
   * **Validates: Requirements 15.2, 40.1**
   *
   * For any valid user, the access token expiry (exp) must be within 15 minutes
   * (900 seconds) of the time of issuance.
   */
  it(
    'access token expiry is within 15 minutes of issuance',
    async () => {
      await fc.assert(
        fc.asyncProperty(userArb, async (user) => {
          const beforeIssuance = Math.floor(Date.now() / 1000);

          const res = makeMockResponse();
          await tokenService.issueTokens(user, res as any);

          const afterIssuance = Math.floor(Date.now() / 1000);

          const accessToken = res._cookies['access_token'];
          expect(accessToken).toBeDefined();
          if (typeof accessToken !== 'string') throw new Error('Access token cookie missing');

          const decoded = jwtService.decode(accessToken) as {
            exp: number;
            iat: number;
          };

          expect(decoded.exp).toBeDefined();
          expect(decoded.iat).toBeDefined();

          // exp must be iat + 900s (15 min), with ±2s tolerance for test execution time
          const ttl = decoded.exp - decoded.iat;
          expect(ttl).toBeGreaterThanOrEqual(898);
          expect(ttl).toBeLessThanOrEqual(902);

          // exp must be in the future relative to when we started
          expect(decoded.exp).toBeGreaterThan(beforeIssuance);
          // exp must not be more than 15 min + 2s after issuance
          expect(decoded.exp).toBeLessThanOrEqual(afterIssuance + 902);
        }),
        { numRuns: 20 },
      );
    },
    30000,
  );
});
