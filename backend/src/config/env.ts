import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'convocart_super_secure_jwt_secret_key_2026_nexconn',
  
  // Nexconn Configuration (Official keys provided)
  NEXCONN_APP_KEY: process.env.NEXCONN_APP_KEY || '8w7jv4qb8gtvy',
  NEXCONN_APP_SECRET: process.env.NEXCONN_APP_SECRET || '6bNYoqv739Ng',
  NEXCONN_ACCESS_KEY: process.env.NEXCONN_ACCESS_KEY || 'ASPGNSOBMWBGVB4KVVHIWB2XNMTJDHOA5MGCDG63NGY6LJZDZAS3AOPDJA4BIXHG3VUHQRCUROZBLF2RTYXS3EUTILRQLIYJCEHPNLQ',
  
  // Razorpay Test Configuration
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_SLFBgoJ4nh7Ilv',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'ivWArti6cljuZEN01bhrQxVz',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret_convocart_321',

  // Groq Cloud LLM Configuration (Secure environment variable)
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',

  // Gemini / AI Provider Configuration
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.AI_PROVIDER_API_KEY || '',

  // Firebase Configuration (society-adc76)
  FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || 'AIzaSyDln1f-95w7Fm5KGy03QTKcZZW1ET1v85I',
  FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || 'society-adc76.firebaseapp.com',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'society-adc76',
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || 'society-adc76.firebasestorage.app',
  FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID || '642891526455',
  FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || '1:642891526455:web:10ca2be8102f2c532d6ab2',
  FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID || 'G-T2V7VNY89X',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
};
