# allEdu — Educational Platform

A full-stack monorepo for live and recorded online education. Built for competitive exam preparation (JEE, NEET, UPSC, etc.) with support for live classes, video content, quizzes, doubt sessions, payments, and more.

**Live:** [edu-app-web.vercel.app](https://edu-app-web.vercel.app)

---

## What It Does

allEdu is a multi-role platform (Student, Teacher, Admin) that covers the full lifecycle of online education:

| Feature | Description |
|---|---|
| **Live Classes** | Teachers schedule and conduct live sessions; students join in real-time via socket |
| **Recorded Videos** | YouTube Unlisted videos organized by subject and chapter |
| **Batches** | Course bundles with enrollment, pricing (free/paid), and progress tracking |
| **Quizzes & Tests** | MCQ quizzes, test series with leaderboard rankings |
| **Doubt Sessions** | Students post doubts; teachers respond |
| **Study Materials** | PDF/image uploads organized by chapter |
| **Payments** | Razorpay integration for batch enrollment |
| **Certificates** | Auto-generated on batch completion |
| **Announcements** | Teacher/admin broadcasts to enrolled students |
| **Notifications** | Firebase push notifications + in-app alerts |
| **Leaderboard** | Points-based ranking across quizzes and tests |
| **PWA** | Installable on mobile with offline support via service worker |

---

## Tech Stack

### Frontend (`apps/web`)
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Redux Toolkit** + **Zustand** (state management)
- **TanStack Query** (server state / caching)
- **NextAuth.js** (Google OAuth + custom auth)
- **Socket.io Client** (real-time)
- **Firebase** (push notifications)
- **Razorpay** (payments)
- **PWA** (service worker, manifest)

### Backend (`apps/api`)
- **NestJS** (Node.js framework)
- **TypeScript**
- **TypeORM** + **PostgreSQL** (Supabase)
- **Redis** (Upstash — OTP caching, rate limiting)
- **JWT** (access + refresh tokens)
- **Passport.js** (Google OAuth strategy)
- **Socket.io** (live class real-time events)
- **Firebase Admin** (push notifications)
- **Razorpay** (payment webhooks)
- **ImageKit** (image/PDF storage)
- **Nodemailer** (email OTP)

### Infrastructure
- **Turborepo** (monorepo build system)
- **pnpm workspaces**
- **Vercel** (frontend deployment)
- **Render** (backend deployment)
- **Supabase** (PostgreSQL database)
- **Upstash** (Redis)

---

## Project Structure

```
eduApp/
├── apps/
│   ├── api/          # NestJS backend
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/           # JWT, Google OAuth, OTP
│   │       │   ├── users/          # User profiles, roles
│   │       │   ├── batches/        # Course bundles
│   │       │   ├── content/        # Subjects & chapters
│   │       │   ├── videos/         # Recorded video management
│   │       │   ├── live-classes/   # Live session scheduling
│   │       │   ├── quizzes/        # MCQ quizzes
│   │       │   ├── test-series/    # Full test series
│   │       │   ├── doubts/         # Doubt Q&A
│   │       │   ├── payments/       # Razorpay integration
│   │       │   ├── leaderboard/    # Rankings
│   │       │   ├── certificates/   # Completion certificates
│   │       │   ├── notifications/  # FCM push notifications
│   │       │   ├── announcements/  # Batch announcements
│   │       │   ├── study-materials/# PDFs and resources
│   │       │   ├── socket/         # Real-time WebSocket
│   │       │   ├── admin/          # Admin controls
│   │       │   └── settings/       # Platform settings
│   │       └── common/
│   │           ├── guards/         # JWT & roles guards
│   │           ├── decorators/     # @CurrentUser, @Roles, etc.
│   │           ├── redis/          # Redis service
│   │           └── storage/        # ImageKit/Cloudinary abstraction
│   └── web/          # Next.js frontend
│       └── src/
│           ├── app/
│           │   ├── student/        # Student dashboard & pages
│           │   ├── teacher/        # Teacher dashboard & pages
│           │   ├── admin/          # Admin panel
│           │   ├── auth/           # Login, onboarding
│           │   └── batches/        # Public batch listing
│           ├── components/         # Shared UI components
│           ├── hooks/              # Custom React hooks
│           ├── store/              # Redux store
│           └── lib/                # API client, utilities
├── packages/
│   ├── types/        # Shared TypeScript types
│   └── utils/        # Shared utility functions
├── turbo.json        # Turborepo config
├── render.yaml       # Render deployment config
└── package.json      # Root workspace config
```

---

## User Roles

| Role | Access |
|---|---|
| **Student** | Browse batches, enroll, watch videos, attend live classes, take quizzes, post doubts |
| **Teacher** | Create batches, upload content, schedule live classes, manage quizzes, answer doubts |
| **Admin** | Full platform control — manage users, content, settings, payments |

---

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL database (Supabase recommended)
- Redis instance (Upstash recommended)

### Installation

```bash
# Clone the repo
git clone https://github.com/rohittrv7/eduApp.git
cd eduApp

# Install dependencies
pnpm install
```

### Environment Setup

**Backend** — copy and fill `apps/api/.env.example`:
```bash
cp apps/api/.env.example apps/api/.env
```

Key variables to set:
```env
FRONTEND_URL=http://localhost:3000
DB_HOST=your_supabase_host
DB_PASSWORD=your_db_password
JWT_ACCESS_SECRET=your_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback
EMAIL_USER=your_gmail
EMAIL_PASS=your_gmail_app_password
```

**Frontend** — create `apps/web/.env`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Development

```bash
# Run both frontend and backend together
pnpm dev

# Or run individually
pnpm --filter @educational/api dev
pnpm --filter @educational/web dev
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001/api/v1`
- Health check: `http://localhost:3001/api/v1/health`

### Build

```bash
pnpm build
```

---

## Deployment

### Frontend — Vercel
1. Connect GitHub repo to Vercel
2. Set **Root Directory** to `apps/web`
3. Add all `NEXT_PUBLIC_*` environment variables in Vercel dashboard
4. Set `NEXTAUTH_URL` to your production domain

### Backend — Render
1. Connect GitHub repo to Render
2. Use `render.yaml` for automatic service configuration
3. Set all secret environment variables in Render dashboard
4. Set `FRONTEND_URL` to your Vercel production URL (no trailing slash)

### Google OAuth Setup
Add these to **Authorized Redirect URIs** in Google Cloud Console:
```
https://your-api-domain.onrender.com/api/v1/auth/google/callback
http://localhost:3001/api/v1/auth/google/callback
```

---

## API Overview

Base URL: `https://eduapp-1-nn7j.onrender.com/api/v1`

| Module | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/verify-otp`, `GET /auth/google` |
| Users | `GET /users/me`, `PATCH /users/profile` |
| Batches | `GET /batches`, `POST /batches`, `POST /batches/:id/enroll` |
| Videos | `GET /videos`, `POST /videos` |
| Live Classes | `GET /live-classes`, `POST /live-classes` |
| Quizzes | `GET /quizzes`, `POST /quizzes/:id/submit` |
| Doubts | `GET /doubts`, `POST /doubts` |
| Payments | `POST /payments/order`, `POST /payments/verify` |
| Leaderboard | `GET /leaderboard` |
| Notifications | `POST /notifications/subscribe` |

---

## Scripts

```bash
pnpm dev          # Start all apps in development
pnpm build        # Build all apps
pnpm lint         # Lint all apps
pnpm type-check   # TypeScript check all apps
pnpm test         # Run all tests
```

---

## License

MIT
