// ─── Enums ────────────────────────────────────────────────────────────────────

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
  PARENT = 'parent',
}

export enum BatchLanguage {
  HINDI = 'hindi',
  ENGLISH = 'english',
  HINGLISH = 'hinglish',
}

export enum LiveClassStatus {
  SCHEDULED = 'scheduled',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  ENDED = 'ended',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum QuestionType {
  MCQ = 'mcq',
  TRUE_FALSE = 'true_false',
  FILL_BLANK = 'fill_blank',
}

export enum SkillLevel {
  BASIC = 'basic',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  PRO = 'pro',
}

export enum NotificationType {
  LIVE_CLASS_REMINDER = 'live_class_reminder',
  DOUBT_REPLY = 'doubt_reply',
  NEW_ANNOUNCEMENT = 'new_announcement',
  QUIZ_RESULT = 'quiz_result',
  LEADERBOARD_UPDATE = 'leaderboard_update',
  NEW_BATCH_LAUNCH = 'new_batch_launch',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  BADGE_EARNED = 'badge_earned',
  CERTIFICATE_ISSUED = 'certificate_issued',
}

export enum BadgeType {
  SEVEN_DAY_STREAK = 'seven_day_streak',
  TOP_10_LEADERBOARD = 'top_10_leaderboard',
  QUIZ_MASTER = 'quiz_master',
  PERFECT_ATTENDANCE = 'perfect_attendance',
}

export enum ParentLinkStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum DoubtStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FLAT = 'flat',
}

export enum PollStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
}

export enum DoubtSessionStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum StudyMaterialType {
  PDF = 'pdf',
  IMAGE = 'image',
  TEXT = 'text',
}

export enum PushPlatform {
  WEB = 'web',
  ANDROID = 'android',
}

// ─── Generic API Response Shapes ─────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
}

// ─── Domain Interfaces ────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  mobile: string;
  email?: string;
  fullName?: string;
  role: UserRole;
  profilePhoto?: string;
  classGrade?: string;
  targetExam?: string;
  languagePref: BatchLanguage;
  skillLevel: SkillLevel;
  cumulativeScore: number;
  streakCount: number;
  lastActive?: string;
  isBanned: boolean;
  referralCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchSummary {
  id: string;
  teacherId: string;
  name: string;
  slug: string;
  description?: string;
  targetExam?: string;
  language: BatchLanguage;
  price: number;
  isFree: boolean;
  trialDays: number;
  capacity?: number;
  isFeatured: boolean;
  isActive: boolean;
  thumbnail?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiveClassSummary {
  id: string;
  batchId: string;
  teacherId: string;
  chapterId?: string;
  title: string;
  description?: string;
  youtubeUrl?: string;
  youtubeVideoId?: string;
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  status: LiveClassStatus;
  recordingUrl?: string;
  viewerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPayload {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  deepLink?: string;
  isRead: boolean;
  createdAt: string;
}
