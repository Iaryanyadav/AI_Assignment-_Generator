import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import assignmentRoutes from './routes/assignments';
import { createAssessmentWorker } from './workers/assessmentWorker';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/assignments', assignmentRoutes);

// WebSocket
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  socket.on('subscribe', (assignmentId: string) => {
    socket.join(`assignment:${assignmentId}`);
    console.log(`[WS] ${socket.id} subscribed to assignment:${assignmentId}`);
  });

  socket.on('unsubscribe', (assignmentId: string) => {
    socket.leave(`assignment:${assignmentId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// Start worker
const worker = createAssessmentWorker(io);

// Connect to MongoDB
async function startServer() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vedaai';
    await mongoose.connect(mongoUri);
    console.log('[DB] MongoDB connected');

    const port = Number(process.env.PORT) || 4000;
    server.listen(port, () => {
      console.log(`[Server] Running on http://localhost:${port}`);
      console.log(`[Worker] Assessment worker started`);
    });
  } catch (err) {
    console.error('[Server] Startup error:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  await worker.close();
  await mongoose.disconnect();
  process.exit(0);
});

startServer();

export { io };
