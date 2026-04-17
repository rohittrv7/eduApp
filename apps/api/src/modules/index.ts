// Users & Auth
export { User } from './users/entities/user.entity';
export { OtpRequest } from './auth/entities/otp-request.entity';
export { RefreshToken } from './auth/entities/refresh-token.entity';
export { ParentLink } from './users/entities/parent-link.entity';
export { TeacherFollow } from './users/entities/teacher-follow.entity';

// Content Hierarchy
export { Subject } from './content/entities/subject.entity';
export { Chapter } from './content/entities/chapter.entity';
export { Batch } from './batches/entities/batch.entity';
export { Enrollment } from './batches/entities/enrollment.entity';

// Video & Live Classes
export { LiveClass } from './live-classes/entities/live-class.entity';
export { Attendance } from './live-classes/entities/attendance.entity';
export { RecordedVideo } from './videos/entities/recorded-video.entity';
export { WatchSession } from './videos/entities/watch-session.entity';

// Quizzes & Assessments
export { Quiz } from './quizzes/entities/quiz.entity';
export { Question } from './quizzes/entities/question.entity';
export { QuizAttempt } from './quizzes/entities/quiz-attempt.entity';
export { TestSeries } from './test-series/entities/test-series.entity';
export { MockTest } from './test-series/entities/mock-test.entity';

// Communication & Social
export { ChatMessage } from './chat/entities/chat-message.entity';
export { Doubt } from './doubts/entities/doubt.entity';
export { DoubtReply } from './doubts/entities/doubt-reply.entity';
export { DoubtUpvote } from './doubts/entities/doubt-upvote.entity';
export { Announcement } from './announcements/entities/announcement.entity';
export { AnnouncementRead } from './announcements/entities/announcement-read.entity';
export { LivePoll } from './polls/entities/live-poll.entity';
export { PollResponse } from './polls/entities/poll-response.entity';

// Payments & Commerce
export { Transaction } from './payments/entities/transaction.entity';
export { Coupon } from './payments/entities/coupon.entity';
export { Referral } from './payments/entities/referral.entity';
export { TeacherPayout } from './payments/entities/teacher-payout.entity';

// Engagement & Gamification
export { Achievement } from './achievements/entities/achievement.entity';
export { Certificate } from './certificates/entities/certificate.entity';
export { Bookmark } from './bookmarks/entities/bookmark.entity';
export { PersonalNote } from './notes/entities/personal-note.entity';
export { StudyMaterial } from './study-materials/entities/study-material.entity';
export { Notification } from './notifications/entities/notification.entity';
export { PushSubscription } from './notifications/entities/push-subscription.entity';
export { NotificationPreference } from './notifications/entities/notification-preference.entity';
export { DoubtSession } from './doubt-sessions/entities/doubt-session.entity';
export { StudyGoal } from './study-planner/entities/study-goal.entity';
export { PlatformSetting } from './settings/entities/platform-setting.entity';
