export default () => ({
  port: parseInt(process.env['PORT'] ?? '3001', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  frontendUrl: process.env['FRONTEND_URL'] ?? 'http://localhost:3000',

  database: {
    host: process.env['DB_HOST'],
    port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
    username: process.env['DB_USERNAME'],
    password: process.env['DB_PASSWORD'],
    name: process.env['DB_NAME'],
  },

  redis: {
    host: process.env['REDIS_HOST'] ?? 'localhost',
    port: parseInt(process.env['REDIS_PORT'] ?? '6379', 10),
    password: process.env['REDIS_PASSWORD'],
  },

  jwt: {
    secret: process.env['JWT_ACCESS_SECRET'],
    accessSecret: process.env['JWT_ACCESS_SECRET'],
    refreshSecret: process.env['JWT_REFRESH_SECRET'],
    accessExpiresIn: process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m',
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d',
  },

  razorpay: {
    keyId: process.env['RAZORPAY_KEY_ID'],
    keySecret: process.env['RAZORPAY_KEY_SECRET'],
    webhookSecret: process.env['RAZORPAY_WEBHOOK_SECRET'],
  },

  // Storage — switch provider via STORAGE_PROVIDER env var
  // DB always stores only the file path, never the full URL
  storage: {
    provider: process.env['STORAGE_PROVIDER'] ?? 'imagekit', // 'imagekit' | 'cloudinary'
    imagekit: {
      publicKey: process.env['IMAGEKIT_PUBLIC_KEY'],
      privateKey: process.env['IMAGEKIT_PRIVATE_KEY'],
      urlEndpoint: process.env['IMAGEKIT_URL_ENDPOINT'],
    },
    cloudinary: {
      cloudName: process.env['CLOUDINARY_CLOUD_NAME'],
      apiKey: process.env['CLOUDINARY_API_KEY'],
      apiSecret: process.env['CLOUDINARY_API_SECRET'],
    },
  },

  // OTP — switch provider via OTP_PROVIDER env var
  otp: {
    // 'phone_firebase' → Firebase Phone Auth (requires Blaze plan)
    // 'email'          → Nodemailer email OTP (free, works on any plan) ← default
    // 'msg91'          → MSG91 SMS OTP (future fallback)
    provider: process.env['OTP_PROVIDER'] ?? 'email',
    // LOGIN_IDENTIFIER controls what the user enters: 'mobile' | 'email'
    loginIdentifier: process.env['LOGIN_IDENTIFIER'] ?? 'email',
  },

  email: {
    host: process.env['EMAIL_HOST'] ?? 'smtp.gmail.com',
    port: parseInt(process.env['EMAIL_PORT'] ?? '587', 10),
    user: process.env['EMAIL_USER'],
    pass: process.env['EMAIL_PASS'],
    from: process.env['EMAIL_FROM'] ?? process.env['EMAIL_USER'],
  },

  msg91: {
    authKey: process.env['MSG91_AUTH_KEY'],
    templateId: process.env['MSG91_TEMPLATE_ID'],
  },

  // Firebase — Phone Auth (OTP) + FCM (push notifications)
  firebase: {
    projectId: process.env['FIREBASE_PROJECT_ID'],
    privateKey: process.env['FIREBASE_PRIVATE_KEY'],
    clientEmail: process.env['FIREBASE_CLIENT_EMAIL'],
  },

  google: {
    clientId: process.env['GOOGLE_CLIENT_ID'],
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
    callbackUrl: process.env['GOOGLE_CALLBACK_URL'],
  },

  fcm: {
    projectId: process.env['FCM_PROJECT_ID'],
    privateKey: process.env['FCM_PRIVATE_KEY'],
    clientEmail: process.env['FCM_CLIENT_EMAIL'],
    serverKey: process.env['FCM_SERVER_KEY'],
  },

  vapid: {
    publicKey: process.env['VAPID_PUBLIC_KEY'],
    privateKey: process.env['VAPID_PRIVATE_KEY'],
  },

  // Video provider — switch via VIDEO_PROVIDER env var
  // Videos (recorded + live) are always YouTube Unlisted — ImageKit is for images/PDFs only
  // 'youtube'     → YouTube IFrame (free, zero bandwidth, no download UI shown)
  // 'gumlet'      → Gumlet streaming (future paid tier — encrypted offline download enabled)
  video: {
    provider: process.env['VIDEO_PROVIDER'] ?? 'youtube',
    downloadTokenSecret: process.env['DOWNLOAD_TOKEN_SECRET'],
    gumlet: {
      apiKey: process.env['GUMLET_API_KEY'],
      collectionId: process.env['GUMLET_COLLECTION_ID'],
    },
  },
});
