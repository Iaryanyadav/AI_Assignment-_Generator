import { Worker, Job } from 'bullmq';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { redis } from '../lib/queue';
import { Assignment } from '../models/Assignment';
import { generateQuestionPaper } from '../lib/aiGenerator';
import { cacheSet } from '../lib/queue';

dotenv.config();

export function createAssessmentWorker(io: SocketIOServer) {
  const worker = new Worker(
    'assessment-generation',
    async (job: Job) => {
      const { assignmentId } = job.data as { assignmentId: string };

      console.log(`[Worker] Processing job ${job.id} for assignment ${assignmentId}`);

      // Emit processing status
      io.to(`assignment:${assignmentId}`).emit('status', {
        assignmentId,
        status: 'processing',
        message: 'AI is generating your question paper...',
        progress: 20,
      });

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw new Error(`Assignment ${assignmentId} not found`);
      }

      await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing' });

      io.to(`assignment:${assignmentId}`).emit('status', {
        assignmentId,
        status: 'processing',
        message: 'Building prompt and contacting AI...',
        progress: 40,
      });

      const generatedPaper = await generateQuestionPaper(assignment);

      io.to(`assignment:${assignmentId}`).emit('status', {
        assignmentId,
        status: 'processing',
        message: 'Structuring question paper...',
        progress: 80,
      });

      await Assignment.findByIdAndUpdate(assignmentId, {
        status: 'completed',
        generatedPaper,
      });

      // Cache the result
      await cacheSet(`assignment:${assignmentId}`, { ...assignment.toObject(), generatedPaper, status: 'completed' });

      io.to(`assignment:${assignmentId}`).emit('status', {
        assignmentId,
        status: 'completed',
        message: 'Question paper generated successfully!',
        progress: 100,
        generatedPaper,
      });

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

      await Assignment.findByIdAndUpdate(assignmentId, {
        status: 'failed',
        errorMessage: err.message,
      });

      io.to(`assignment:${assignmentId}`).emit('status', {
        assignmentId,
        status: 'failed',
        message: `Generation failed: ${err.message}`,
        progress: 0,
      });
    }
  });

  worker.on('error', (err) => {
    console.error('[Worker] Worker error:', err);
  });

  return worker;
}
