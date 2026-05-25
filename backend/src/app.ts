import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import assignmentRoutes from './routes/assignments';
import { corsOriginCallback } from './lib/corsOrigins';
import { connectMongo } from './lib/db';

dotenv.config();

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: corsOriginCallback,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.use(async (_req, res, next) => {
    try {
      await connectMongo();
      next();
    } catch (err) {
      console.error('[DB] Connection error:', err);
      res.status(503).json({ success: false, error: 'Database connection failed' });
    }
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/assignments', assignmentRoutes);

  return app;
}
