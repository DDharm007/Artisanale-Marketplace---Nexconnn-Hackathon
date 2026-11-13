import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'convocart_super_secure_jwt_secret_key_2026_nexconn',
  
  // Nexconn Configuration (Official keys provided)
  NEXCONN_APP_KEY: process.env.NEXCONN_APP_KEY || '8w7jv4qb8gtvy',
  NEXCONN_APP_SECRET: process.env.NEXCONN_APP_SECRET || '6bNYoqv739Ng',
  NEXCONN_ACCESS_KEY: process.env.NEXCONN_ACCESS_KEY || 'KCPAU3HTYNPRP5WUBGPCCTCHUMIJHUZ7JIDRAI2UTSN5WEMMJ7STQHL4OKMLHYJK2QF4ZEJEFYA57ZFPTGRRRRTDXUUROPL55UVPN5I',
  
  // Razorpay Test Configuration
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_convocart123',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'test_secret_convocart_secure_987',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret_convocart_321',

  // Gemini / AI Provider Configuration
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.AI_PROVIDER_API_KEY || '',

  // Firebase Admin configuration
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'convocart-app',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
};
