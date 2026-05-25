import { Assignment } from '../models/Assignment';
import { generateQuestionPaper } from './aiGenerator';
import { cacheSet } from './queue';

export type GenerationStatusPayload = {
  assignmentId: string;
  status: string;
  message: string;
  progress: number;
  generatedPaper?: unknown;
};

export async function runAssignmentGeneration(
  assignmentId: string,
  emit?: (payload: GenerationStatusPayload) => void
): Promise<void> {
  const emitStatus = (payload: GenerationStatusPayload) => emit?.(payload);

  emitStatus({
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

  emitStatus({
    assignmentId,
    status: 'processing',
    message: 'Building prompt and contacting AI...',
    progress: 40,
  });

  const generatedPaper = await generateQuestionPaper(assignment);

  emitStatus({
    assignmentId,
    status: 'processing',
    message: 'Structuring question paper...',
    progress: 80,
  });

  await Assignment.findByIdAndUpdate(assignmentId, {
    status: 'completed',
    generatedPaper,
  });

  await cacheSet(`assignment:${assignmentId}`, {
    ...assignment.toObject(),
    generatedPaper,
    status: 'completed',
  });

  emitStatus({
    assignmentId,
    status: 'completed',
    message: 'Question paper generated successfully!',
    progress: 100,
    generatedPaper,
  });
}

export async function failAssignmentGeneration(
  assignmentId: string,
  message: string,
  emit?: (payload: GenerationStatusPayload) => void
): Promise<void> {
  await Assignment.findByIdAndUpdate(assignmentId, {
    status: 'failed',
    errorMessage: message,
  });

  emit?.({
    assignmentId,
    status: 'failed',
    message: `Generation failed: ${message}`,
    progress: 0,
  });
}
