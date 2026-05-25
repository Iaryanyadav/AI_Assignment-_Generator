import { waitUntil } from '@vercel/functions';
import { v4 as uuidv4 } from 'uuid';
import { Assignment } from '../models/Assignment';
import { assessmentQueue } from './queue';
import { runAssignmentGeneration, failAssignmentGeneration } from './runGeneration';

/** Queue on Railway/local; run inline on Vercel serverless (no persistent BullMQ worker). */
export async function scheduleAssignmentGeneration(assignmentId: string): Promise<string> {
  if (process.env.VERCEL) {
    const jobId = `vercel-${uuidv4()}`;
    await Assignment.findByIdAndUpdate(assignmentId, { jobId });

    waitUntil(
      runAssignmentGeneration(assignmentId).catch(async (err) => {
        console.error('[Vercel] Generation failed:', err);
        await failAssignmentGeneration(
          assignmentId,
          err instanceof Error ? err.message : 'Generation failed'
        );
      })
    );

    return jobId;
  }

  const job = await assessmentQueue.add(
    'generate',
    { assignmentId },
    { jobId: uuidv4() }
  );

  await Assignment.findByIdAndUpdate(assignmentId, { jobId: job.id });
  return job.id!;
}
