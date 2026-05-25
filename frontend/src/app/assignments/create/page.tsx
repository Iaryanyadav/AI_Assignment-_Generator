'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Calendar,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Minus,
} from 'lucide-react';
import { useAssignmentStore } from '@/store/assignmentStore';
import { api } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { loadAppSettings } from '@/lib/settings';

const QUESTION_TYPE_OPTIONS = [
  'Multiple Choice Questions',
  'Short Questions',
  'Long Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'Fill in the Blanks',
  'True or False',
  'Essay Questions',
];

export default function CreateAssignmentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { subscribe } = useWebSocket();

  const {
    form,
    updateForm,
    addQuestionType,
    removeQuestionType,
    updateQuestionType,
    isSubmitting,
    setIsSubmitting,
    submitError,
    setSubmitError,
    setCurrentAssignmentId,
    updateGenerationStatus,
    resetForm,
  } = useAssignmentStore();

  const [step, setStep] = useState(1); // 1 = details, 2 = confirm
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const s = loadAppSettings();
    if (!form.subject && s.defaultSubject) updateForm({ subject: s.defaultSubject });
    if (!form.className && s.defaultClass) updateForm({ className: s.defaultClass });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalQuestions = form.questionTypes.reduce((s, qt) => s + qt.count, 0);
  const totalMarks = form.questionTypes.reduce((s, qt) => s + qt.count * qt.marks, 0);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.subject.trim()) errs.subject = 'Subject is required';
    if (!form.className.trim()) errs.className = 'Class is required';
    if (!form.dueDate) errs.dueDate = 'Due date is required';
    if (form.questionTypes.length === 0) errs.questionTypes = 'Add at least one question type';
    form.questionTypes.forEach((qt, i) => {
      if (qt.count < 1) errs[`qt_count_${i}`] = 'Count must be ≥ 1';
      if (qt.marks < 1) errs[`qt_marks_${i}`] = 'Marks must be ≥ 1';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await api.assignments.create({
        title: form.title,
        subject: form.subject,
        className: form.className,
        dueDate: form.dueDate,
        questionTypes: form.questionTypes.map(({ type, count, marks }) => ({ type, count, marks })),
        additionalInstructions: form.additionalInstructions || undefined,
        file: form.uploadedFile || undefined,
      });

      const { assignmentId } = res.data;
      setCurrentAssignmentId(assignmentId);
      updateGenerationStatus({ status: 'pending', message: 'Assignment created, queuing...', progress: 10 });

      subscribe(assignmentId);
      resetForm();
      router.push(`/assignments/${assignmentId}`);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create assignment');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFile(file: File) {
    updateForm({ uploadedFile: file });
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3 mb-0.5">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronLeft size={18} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-gray-900" style={{ fontFamily: 'Sora, sans-serif' }}>
              Create Assignment
            </h1>
            <p className="text-xs text-gray-400">Set up a new assignment for your students</p>
          </div>
        </div>
        {/* Step progress */}
        <div className="flex gap-2 mt-3">
          {[1, 2].map((s) => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{
                background: step >= s ? 'var(--brand-orange)' : '#E5E5E5',
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Assignment Details Card */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 mb-0.5" style={{ fontFamily: 'Sora, sans-serif' }}>
                Assignment Details
              </h2>
              <p className="text-xs text-gray-400">Basic information about your assignment</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Title & Subject row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => updateForm({ title: e.target.value })}
                    placeholder="e.g. Quiz on Electricity"
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 ${
                      errors.title ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => updateForm({ subject: e.target.value })}
                    placeholder="e.g. Science"
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 ${
                      errors.subject ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Class <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.className}
                  onChange={(e) => updateForm({ className: e.target.value })}
                  placeholder="e.g. Grade 8 / Class 10"
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 ${
                    errors.className ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {errors.className && <p className="text-xs text-red-500 mt-1">{errors.className}</p>}
              </div>

              {/* File upload */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Reference Material (Optional)
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    dragOver ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={24} className="mx-auto mb-2 text-gray-300" />
                  {form.uploadedFile ? (
                    <p className="text-sm font-medium text-gray-700">{form.uploadedFile.name}</p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500">Choose a file or drag & drop it here</p>
                      <p className="text-xs text-gray-400 mt-1">JPEG, PNG, upto 10MB</p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.txt,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                </div>
                {form.uploadedFile && (
                  <button
                    onClick={() => updateForm({ uploadedFile: null })}
                    className="mt-1.5 text-xs text-red-500 hover:underline"
                  >
                    Remove file
                  </button>
                )}
                <p className="text-xs text-gray-400 mt-1.5">
                  Upload images of your preferred document/image
                </p>
              </div>

              {/* Due date */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => updateForm({ dueDate: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 ${
                      errors.dueDate ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  <Calendar
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
                {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>}
              </div>

              {/* Question types */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-600">Question Type</label>
                  <div className="grid grid-cols-2 gap-8 pr-8 text-xs font-medium text-gray-500">
                    <span>No. of Questions</span>
                    <span>Marks</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {form.questionTypes.map((qt, i) => (
                    <div key={qt.id} className="flex items-center gap-3">
                      <select
                        value={qt.type}
                        onChange={(e) => updateQuestionType(qt.id, { type: e.target.value })}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 bg-white"
                      >
                        {QUESTION_TYPE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>

                      {/* Count stepper */}
                      <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-1.5 py-1">
                        <button
                          onClick={() => updateQuestionType(qt.id, { count: Math.max(1, qt.count - 1) })}
                          className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-800"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{qt.count}</span>
                        <button
                          onClick={() => updateQuestionType(qt.id, { count: qt.count + 1 })}
                          className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-800"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Marks stepper */}
                      <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-1.5 py-1">
                        <button
                          onClick={() => updateQuestionType(qt.id, { marks: Math.max(1, qt.marks - 1) })}
                          className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-800"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{qt.marks}</span>
                        <button
                          onClick={() => updateQuestionType(qt.id, { marks: qt.marks + 1 })}
                          className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-800"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeQuestionType(qt.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addQuestionType}
                  className="flex items-center gap-1.5 text-sm text-gray-500 mt-3 hover:text-gray-700"
                >
                  <Plus size={14} />
                  Add Question Type
                </button>

                {errors.questionTypes && (
                  <p className="text-xs text-red-500 mt-1">{errors.questionTypes}</p>
                )}

                {form.questionTypes.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end gap-6 text-xs text-gray-500">
                    <span>Total Questions: <strong className="text-gray-800">{totalQuestions}</strong></span>
                    <span>Total Marks: <strong className="text-gray-800">{totalMarks}</strong></span>
                  </div>
                )}
              </div>

              {/* Additional instructions */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Additional Information (For better output)
                </label>
                <div className="relative">
                  <textarea
                    value={form.additionalInstructions}
                    onChange={(e) => updateForm({ additionalInstructions: e.target.value })}
                    placeholder="e.g. Generate a question paper for 3 hour exam duration..."
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 resize-none"
                  />
                </div>
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {submitError}
                </div>
              )}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-between mt-5">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-full text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-60"
              style={{ background: 'var(--brand-dark)' }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Next
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
