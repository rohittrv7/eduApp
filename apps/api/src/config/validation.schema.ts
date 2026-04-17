import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // Redis — password optional (local dev has no auth)
  REDIS_URL: Joi.string().optional(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Razorpay — optional in dev
  RAZORPAY_KEY_ID: Joi.string().optional(),
  RAZORPAY_KEY_SECRET: Joi.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: Joi.string().optional(),

  // Storage
  STORAGE_PROVIDER: Joi.string().valid('imagekit', 'cloudinary').default('imagekit'),
  IMAGEKIT_PUBLIC_KEY: Joi.string().optional(),
  IMAGEKIT_PRIVATE_KEY: Joi.string().optional(),
  IMAGEKIT_URL_ENDPOINT: Joi.string().uri().optional(),
  CLOUDINARY_CLOUD_NAME: Joi.string().optional(),
  CLOUDINARY_API_KEY: Joi.string().optional(),
  CLOUDINARY_API_SECRET: Joi.string().optional(),

  // Video
  VIDEO_PROVIDER: Joi.string().valid('youtube', 'gumlet', 'self-hosted').default('youtube'),
  DOWNLOAD_TOKEN_SECRET: Joi.string().optional(),
  GUMLET_API_KEY: Joi.string().optional(),
  GUMLET_COLLECTION_ID: Joi.string().optional(),

  // OTP + Login identifier
  OTP_PROVIDER: Joi.string().valid('email', 'phone_firebase', 'msg91').default('email'),
  LOGIN_IDENTIFIER: Joi.string().valid('email', 'mobile').default('email'),

  // Email OTP (Nodemailer) — optional, defaults to Gmail SMTP
  EMAIL_HOST: Joi.string().optional(),
  EMAIL_PORT: Joi.number().optional(),
  EMAIL_USER: Joi.string().optional(),
  EMAIL_PASS: Joi.string().optional(),
  EMAIL_FROM: Joi.string().optional(),

  // Firebase — optional in dev (needed for phone OTP + FCM in prod)
  FIREBASE_PROJECT_ID: Joi.string().optional(),
  FIREBASE_PRIVATE_KEY: Joi.string().optional(),
  FIREBASE_CLIENT_EMAIL: Joi.string().email().optional(),

  // MSG91 — optional
  MSG91_AUTH_KEY: Joi.string().optional(),
  MSG91_TEMPLATE_ID: Joi.string().optional(),

  // Google OAuth — optional in dev
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().optional(),

  // FCM — optional in dev
  FCM_PROJECT_ID: Joi.string().optional(),
  FCM_PRIVATE_KEY: Joi.string().optional(),
  FCM_CLIENT_EMAIL: Joi.string().email().optional(),

  // VAPID — optional in dev
  VAPID_PUBLIC_KEY: Joi.string().optional(),
  VAPID_PRIVATE_KEY: Joi.string().optional(),
});
