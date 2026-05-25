import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface QuestionType {
  id: string;
  type: string;
  count: number;
  marks: number;
}

export interface Question {
  text: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  marks: number;
  section: string;
  answerKey?: string;
}

export interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}

export interface GeneratedPaper {
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: string;
  maxMarks: number;
  sections: Section[];
}

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  className: string;
  dueDate: string;
  questionTypes: { type: string; count: number; marks: number }[];
  additionalInstructions?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  jobId?: string;
  generatedPaper?: GeneratedPaper;
  errorMessage?: string;
  createdAt: string;
}

export interface AssignmentFormState {
  title: string;
  subject: string;
  className: string;
  dueDate: string;
  questionTypes: QuestionType[];
  additionalInstructions: string;
  uploadedFile: File | null;
}

interface GenerationStatus {
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  progress: number;
}

interface AssignmentStore {
  // List
  assignments: Assignment[];
  isLoadingList: boolean;
  listError: string | null;
  
  // Form
  form: AssignmentFormState;
  isSubmitting: boolean;
  submitError: string | null;
  currentAssignmentId: string | null;
  
  // Generation status
  generationStatus: GenerationStatus;
  generatedPaper: GeneratedPaper | null;
  
  // Actions
  setAssignments: (assignments: Assignment[]) => void;
  setIsLoadingList: (loading: boolean) => void;
  setListError: (error: string | null) => void;
  
  updateForm: (partial: Partial<AssignmentFormState>) => void;
  addQuestionType: () => void;
  removeQuestionType: (id: string) => void;
  updateQuestionType: (id: string, partial: Partial<QuestionType>) => void;
  resetForm: () => void;
  
  setIsSubmitting: (submitting: boolean) => void;
  setSubmitError: (error: string | null) => void;
  setCurrentAssignmentId: (id: string | null) => void;
  
  updateGenerationStatus: (status: Partial<GenerationStatus>) => void;
  setGeneratedPaper: (paper: GeneratedPaper | null) => void;
  
  removeAssignment: (id: string) => void;
}

const defaultForm: AssignmentFormState = {
  title: '',
  subject: '',
  className: '',
  dueDate: '',
  questionTypes: [
    { id: '1', type: 'Multiple Choice Questions', count: 4, marks: 1 },
    { id: '2', type: 'Short Questions', count: 3, marks: 2 },
  ],
  additionalInstructions: '',
  uploadedFile: null,
};

export const useAssignmentStore = create<AssignmentStore>()(
  devtools((set) => ({
    assignments: [],
    isLoadingList: false,
    listError: null,
    form: defaultForm,
    isSubmitting: false,
    submitError: null,
    currentAssignmentId: null,
    generationStatus: { status: 'idle', message: '', progress: 0 },
    generatedPaper: null,

    setAssignments: (assignments) => set({ assignments }),
    setIsLoadingList: (isLoadingList) => set({ isLoadingList }),
    setListError: (listError) => set({ listError }),

    updateForm: (partial) =>
      set((state) => ({ form: { ...state.form, ...partial } })),

    addQuestionType: () =>
      set((state) => ({
        form: {
          ...state.form,
          questionTypes: [
            ...state.form.questionTypes,
            {
              id: Date.now().toString(),
              type: 'Numerical Problems',
              count: 3,
              marks: 5,
            },
          ],
        },
      })),

    removeQuestionType: (id) =>
      set((state) => ({
        form: {
          ...state.form,
          questionTypes: state.form.questionTypes.filter((qt) => qt.id !== id),
        },
      })),

    updateQuestionType: (id, partial) =>
      set((state) => ({
        form: {
          ...state.form,
          questionTypes: state.form.questionTypes.map((qt) =>
            qt.id === id ? { ...qt, ...partial } : qt
          ),
        },
      })),

    resetForm: () => set({ form: defaultForm }),

    setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
    setSubmitError: (submitError) => set({ submitError }),
    setCurrentAssignmentId: (currentAssignmentId) => set({ currentAssignmentId }),

    updateGenerationStatus: (status) =>
      set((state) => ({
        generationStatus: { ...state.generationStatus, ...status },
      })),

    setGeneratedPaper: (generatedPaper) => set({ generatedPaper }),

    removeAssignment: (id) =>
      set((state) => ({
        assignments: state.assignments.filter((a) => a._id !== id),
      })),
  }))
);
