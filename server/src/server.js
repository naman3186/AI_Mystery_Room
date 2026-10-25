import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

const port = Number(process.env.PORT || 5000);
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI).then(() => app.listen(port, () => console.log(`AI Mystery Room API listening on ${port}`))).catch(() => { console.error('MongoDB connection failed. Verify MONGODB_URI and Atlas network access.'); process.exit(1); });
} else if (process.env.NODE_ENV === 'production') {
  console.error('MONGODB_URI is required in production.'); process.exit(1);
} else {
  console.warn('MONGODB_URI is not set. API is running in health-check-only mode.');
  app.listen(port, () => console.log(`AI Mystery Room API listening on ${port}`));
}
