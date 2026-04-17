"use strict";
// ─── Enums ────────────────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushPlatform = exports.StudyMaterialType = exports.DoubtSessionStatus = exports.PollStatus = exports.DiscountType = exports.DoubtStatus = exports.ParentLinkStatus = exports.BadgeType = exports.NotificationType = exports.SkillLevel = exports.QuestionType = exports.TransactionStatus = exports.LiveClassStatus = exports.BatchLanguage = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["STUDENT"] = "student";
    UserRole["TEACHER"] = "teacher";
    UserRole["ADMIN"] = "admin";
    UserRole["PARENT"] = "parent";
})(UserRole || (exports.UserRole = UserRole = {}));
var BatchLanguage;
(function (BatchLanguage) {
    BatchLanguage["HINDI"] = "hindi";
    BatchLanguage["ENGLISH"] = "english";
    BatchLanguage["HINGLISH"] = "hinglish";
})(BatchLanguage || (exports.BatchLanguage = BatchLanguage = {}));
var LiveClassStatus;
(function (LiveClassStatus) {
    LiveClassStatus["SCHEDULED"] = "scheduled";
    LiveClassStatus["PENDING_APPROVAL"] = "pending_approval";
    LiveClassStatus["APPROVED"] = "approved";
    LiveClassStatus["REJECTED"] = "rejected";
    LiveClassStatus["ACTIVE"] = "active";
    LiveClassStatus["ENDED"] = "ended";
})(LiveClassStatus || (exports.LiveClassStatus = LiveClassStatus = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["SUCCESS"] = "success";
    TransactionStatus["FAILED"] = "failed";
    TransactionStatus["REFUNDED"] = "refunded";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var QuestionType;
(function (QuestionType) {
    QuestionType["MCQ"] = "mcq";
    QuestionType["TRUE_FALSE"] = "true_false";
    QuestionType["FILL_BLANK"] = "fill_blank";
})(QuestionType || (exports.QuestionType = QuestionType = {}));
var SkillLevel;
(function (SkillLevel) {
    SkillLevel["BASIC"] = "basic";
    SkillLevel["INTERMEDIATE"] = "intermediate";
    SkillLevel["ADVANCED"] = "advanced";
    SkillLevel["PRO"] = "pro";
})(SkillLevel || (exports.SkillLevel = SkillLevel = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["LIVE_CLASS_REMINDER"] = "live_class_reminder";
    NotificationType["DOUBT_REPLY"] = "doubt_reply";
    NotificationType["NEW_ANNOUNCEMENT"] = "new_announcement";
    NotificationType["QUIZ_RESULT"] = "quiz_result";
    NotificationType["LEADERBOARD_UPDATE"] = "leaderboard_update";
    NotificationType["NEW_BATCH_LAUNCH"] = "new_batch_launch";
    NotificationType["PAYMENT_SUCCESS"] = "payment_success";
    NotificationType["PAYMENT_FAILED"] = "payment_failed";
    NotificationType["BADGE_EARNED"] = "badge_earned";
    NotificationType["CERTIFICATE_ISSUED"] = "certificate_issued";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var BadgeType;
(function (BadgeType) {
    BadgeType["SEVEN_DAY_STREAK"] = "seven_day_streak";
    BadgeType["TOP_10_LEADERBOARD"] = "top_10_leaderboard";
    BadgeType["QUIZ_MASTER"] = "quiz_master";
    BadgeType["PERFECT_ATTENDANCE"] = "perfect_attendance";
})(BadgeType || (exports.BadgeType = BadgeType = {}));
var ParentLinkStatus;
(function (ParentLinkStatus) {
    ParentLinkStatus["PENDING"] = "pending";
    ParentLinkStatus["APPROVED"] = "approved";
    ParentLinkStatus["REJECTED"] = "rejected";
})(ParentLinkStatus || (exports.ParentLinkStatus = ParentLinkStatus = {}));
var DoubtStatus;
(function (DoubtStatus) {
    DoubtStatus["OPEN"] = "open";
    DoubtStatus["RESOLVED"] = "resolved";
})(DoubtStatus || (exports.DoubtStatus = DoubtStatus = {}));
var DiscountType;
(function (DiscountType) {
    DiscountType["PERCENTAGE"] = "percentage";
    DiscountType["FLAT"] = "flat";
})(DiscountType || (exports.DiscountType = DiscountType = {}));
var PollStatus;
(function (PollStatus) {
    PollStatus["ACTIVE"] = "active";
    PollStatus["CLOSED"] = "closed";
})(PollStatus || (exports.PollStatus = PollStatus = {}));
var DoubtSessionStatus;
(function (DoubtSessionStatus) {
    DoubtSessionStatus["AVAILABLE"] = "available";
    DoubtSessionStatus["BOOKED"] = "booked";
    DoubtSessionStatus["COMPLETED"] = "completed";
    DoubtSessionStatus["CANCELLED"] = "cancelled";
})(DoubtSessionStatus || (exports.DoubtSessionStatus = DoubtSessionStatus = {}));
var StudyMaterialType;
(function (StudyMaterialType) {
    StudyMaterialType["PDF"] = "pdf";
    StudyMaterialType["IMAGE"] = "image";
    StudyMaterialType["TEXT"] = "text";
})(StudyMaterialType || (exports.StudyMaterialType = StudyMaterialType = {}));
var PushPlatform;
(function (PushPlatform) {
    PushPlatform["WEB"] = "web";
    PushPlatform["ANDROID"] = "android";
})(PushPlatform || (exports.PushPlatform = PushPlatform = {}));
//# sourceMappingURL=index.js.map