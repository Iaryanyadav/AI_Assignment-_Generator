import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { Assignment } from '../models/Assignment';
import { cacheGet, cacheDel } from '../lib/queue';
import { scheduleAssignmentGeneration } from '../lib/scheduleGeneration';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'text/plain' ||
      file.mimetype.startsWith('image/')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, text, and image files are allowed'));
    }
  },
});

const QuestionTypeSchema = z.object({
  type: z.string().min(1),
  count: z.number().int().min(1),
  marks: z.number().int().min(1),
});

const CreateAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subject: z.string().min(1, 'Subject is required'),
  className: z.string().min(1, 'Class is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  questionTypes: z
    .array(QuestionTypeSchema)
    .min(1, 'At least one question type required'),
  additionalInstructions: z.string().optional(),
});

// GET all assignments
router.get('/', async (req: Request, res: Response) => {
  try {
    const cached = await cacheGet<unknown[]>('all-assignments');
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const assignments = await Assignment.find()
      .select('-generatedPaper -uploadedFileContent')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: assignments });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch assignments' });
  }
});

// GET single assignment
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cached = await cacheGet<unknown>(`assignment:${id}`);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    return res.json({ success: true, data: assignment });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch assignment' });
  }
});

// POST create assignment
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    // Parse questionTypes if sent as JSON string
    if (typeof req.body.questionTypes === 'string') {
      req.body.questionTypes = JSON.parse(req.body.questionTypes);
    }
    // Parse numbers
    if (Array.isArray(req.body.questionTypes)) {
      req.body.questionTypes = req.body.questionTypes.map((qt: Record<string, unknown>) => ({
        ...qt,
        count: Number(qt.count),
        marks: Number(qt.marks),
      }));
    }

    const parsed = CreateAssignmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.errors,
      });
    }

    let uploadedFileContent: string | undefined;
    if (req.file) {
      if (req.file.mimetype === 'text/plain') {
        uploadedFileContent = req.file.buffer.toString('utf-8');
      } else if (req.file.mimetype === 'application/pdf') {
        // Basic PDF text extraction placeholder
        uploadedFileContent = `[PDF uploaded: ${req.file.originalname}]`;
      }
    }

    const assignment = new Assignment({
      ...parsed.data,
      dueDate: new Date(parsed.data.dueDate),
      uploadedFileContent,
      status: 'pending',
    });

    await assignment.save();

    // Invalidate list cache
    await cacheDel('all-assignments');

    const jobId = await scheduleAssignmentGeneration(assignment._id.toString());

    return res.status(201).json({
      success: true,
      data: {
        assignmentId: assignment._id,
        jobId,
        status: 'pending',
        message: 'Assignment created. AI generation started.',
      },
    });
  } catch (err) {
    console.error('[Route] Create assignment error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create assignment' });
  }
});

// DELETE assignment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findByIdAndDelete(id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }
    await cacheDel(`assignment:${id}`);
    await cacheDel('all-assignments');
    return res.json({ success: true, message: 'Assignment deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to delete assignment' });
  }
});

// POST regenerate
router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    await Assignment.findByIdAndUpdate(id, {
      status: 'pending',
      generatedPaper: undefined,
      errorMessage: undefined,
    });

    await cacheDel(`assignment:${id}`);

    const jobId = await scheduleAssignmentGeneration(id);

    return res.json({
      success: true,
      data: { assignmentId: id, jobId, status: 'pending' },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to regenerate' });
  }
});

export default router;
