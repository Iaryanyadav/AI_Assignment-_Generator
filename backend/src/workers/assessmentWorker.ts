import { Worker, Job } from 'bullmq';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { redis } from '../lib/queue';
import { Assignment } from '../models/Assignment';
import {
  runAssignmentGeneration,
  failAssignmentGeneration,
  GenerationStatusPayload,
} from '../lib/runGeneration';

dotenv.config();

export function createAssessmentWorker(io: SocketIOServer) {
  const emit = (assignmentId: string, payload: Omit<GenerationStatusPayload, 'assignmentId'>) => {
    io.to(`assignment:${assignmentId}`).emit('status', { assignmentId, ...payload });
  };

  const worker = new Worker(
    'assessment-generation',
    async (job: Job) => {
      const { assignmentId } = job.data as { assignmentId: string };
      console.log(`[Worker] Processing job ${job.id} for assignment ${assignmentId}`);

      await runAssignmentGeneration(assignmentId, (payload) =>
        emit(assignmentId, payload)
      );

      console.log(`[Worker] Job ${job.id} completed for assignment ${assignmentId}`);
    },
    {
      connection: redis,
      concurrency: 3,
    }
  );

  worker.on('failed', async (job, err) => {
    if (job) {
      const { assignmentId } = job.data as { assignmentId: string };
      console.error(`[Worker] Job ${job.id} failed:`, err.message);
      await failAssignmentGeneration(assignmentId, err.message, (payload) =>
        emit(assignmentId, payload)
      );
    }
  });

  worker.on('error', (err) => {
    console.error('[Worker] Worker error:', err);
  });

  return worker;
}
