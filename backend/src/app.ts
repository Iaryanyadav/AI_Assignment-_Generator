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
      const message =
        err instanceof Error && /whitelist|ServerSelection/i.test(err.message)
          ? 'MongoDB Atlas blocked this server. In Atlas → Network Access, allow 0.0.0.0/0 (required for Vercel).'
          : 'Database connection failed. Check MONGODB_URI on the backend project.';
      res.status(503).json({ success: false, error: message });
    }
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/assignments', assignmentRoutes);

  return app;
}
