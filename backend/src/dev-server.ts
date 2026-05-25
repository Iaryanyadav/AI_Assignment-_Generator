import http from 'http';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { createAssessmentWorker } from './workers/assessmentWorker';
import { corsOriginCallback } from './lib/corsOrigins';
import { connectMongo } from './lib/db';

const app = createApp();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: corsOriginCallback,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

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

const worker = createAssessmentWorker(io);

async function startServer() {
  try {
    await connectMongo();

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
