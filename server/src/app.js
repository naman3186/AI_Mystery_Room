import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import caseRoutes from './routes/caseRoutes.js';

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((value) => value.trim());
const limiterOptions = { windowMs: 60_000, standardHeaders: true, legacyHeaders: false, handler: (_req, res) => res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait a moment and try again.' } }) };
const createCaseLimit = rateLimit({ ...limiterOptions, limit: 3 });
app.disable('x-powered-by');
app.use(cors({ origin(origin, callback) { if (!origin || allowedOrigins.includes(origin)) return callback(null, true); callback(new Error('Origin is not allowed.')); } }));
app.use(express.json({ limit: '12kb' }));
app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok' }));
app.use('/api/cases', (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, error: { code: 'DATABASE_UNAVAILABLE', message: 'Case storage is unavailable. Set MONGODB_URI in server/.env and restart the API.' } });
  }
  return next();
});
app.use('/api/cases', rateLimit({ ...limiterOptions, limit: 40 }));
app.use('/api/cases', (req, res, next) => {
  if (req.method !== 'POST' || req.path !== '/') return next();
  return createCaseLimit(req, res, next);
});
app.use('/api/cases', caseRoutes);
app.use((_req, res) => res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'That route could not be found.' } }));
app.use((error, _req, res, _next) => {
  const status = Number.isInteger(error.status) ? error.status : error.type === 'entity.parse.failed' ? 400 : 500;
  const code = error.code || (status === 400 ? 'INVALID_REQUEST' : 'INTERNAL_ERROR');
  if (status >= 500) console.error('API request failed:', error.name || 'Error');
  const message = error.expose === true ? error.message : status >= 500 ? 'Something went wrong. Please try again.' : error.message;
  res.status(status).json({ success: false, error: { code, message } });
});
export default app;
