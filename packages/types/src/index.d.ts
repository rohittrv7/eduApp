export declare enum UserRole {
    STUDENT = "student",
    TEACHER = "teacher",
    ADMIN = "admin",
    PARENT = "parent"
}
export declare enum BatchLanguage {
    HINDI = "hindi",
    ENGLISH = "english",
    HINGLISH = "hinglish"
}
export declare enum LiveClassStatus {
    SCHEDULED = "scheduled",
    PENDING_APPROVAL = "pending_approval",
    APPROVED = "approved",
    REJECTED = "rejected",
    ACTIVE = "active",
    ENDED = "ended"
}
export declare enum TransactionStatus {
    PENDING = "pending",
    SUCCESS = "success",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export declare enum QuestionType {
    MCQ = "mcq",
    TRUE_FALSE = "true_false",
    FILL_BLANK = "fill_blank"
}
export declare enum SkillLevel {
    BASIC = "basic",
    INTERMEDIATE = "intermediate",
    ADVANCED = "advanced",
    PRO = "pro"
}
export declare enum NotificationType {
    LIVE_CLASS_REMINDER = "live_class_reminder",
    DOUBT_REPLY = "doubt_reply",
    NEW_ANNOUNCEMENT = "new_announcement",
    QUIZ_RESULT = "quiz_result",
    LEADERBOARD_UPDATE = "leaderboard_update",
    NEW_BATCH_LAUNCH = "new_batch_launch",
    PAYMENT_SUCCESS = "payment_success",
    PAYMENT_FAILED = "payment_failed",
    BADGE_EARNED = "badge_earned",
    CERTIFICATE_ISSUED = "certificate_issued"
}
export declare enum BadgeType {
    SEVEN_DAY_STREAK = "seven_day_streak",
    TOP_10_LEADERBOARD = "top_10_leaderboard",
    QUIZ_MASTER = "quiz_master",
    PERFECT_ATTENDANCE = "perfect_attendance"
}
export declare enum ParentLinkStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare enum DoubtStatus {
    OPEN = "open",
    RESOLVED = "resolved"
}
export declare enum DiscountType {
    PERCENTAGE = "percentage",
    FLAT = "flat"
}
export declare enum PollStatus {
    ACTIVE = "active",
    CLOSED = "closed"
}
export declare enum DoubtSessionStatus {
    AVAILABLE = "available",
    BOOKED = "booked",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare enum StudyMaterialType {
    PDF = "pdf",
    IMAGE = "image",
    TEXT = "text"
}
export declare enum PushPlatform {
    WEB = "web",
    ANDROID = "android"
}
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
//# sourceMappingURL=index.d.ts.map