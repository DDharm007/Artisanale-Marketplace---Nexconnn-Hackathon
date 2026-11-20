import { app } from './app';
import { ENV } from './config/env';

if (!process.env.VERCEL) {
  app.listen(ENV.PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 ConvoCart Authoritative Backend Server`);
    console.log(`📡 URL: http://localhost:${ENV.PORT}`);
    console.log(`🔑 Nexconn AppKey: ${ENV.NEXCONN_APP_KEY}`);
    console.log(`💳 Razorpay Mode: Test Gateway Active`);
    console.log(`🤖 AI Vendor Engine: Active & Grounded`);
    console.log(`=======================================================`);
  });
}

export default app;
