'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Download,
  RefreshCw,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { useAssignmentStore, Assignment, GeneratedPaper, Question } from '@/store/assignmentStore';
import { api } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';

function DifficultyBadge({ difficulty }: { difficulty: Question['difficulty'] }) {
  const cls = {
    easy: 'badge-easy',
    moderate: 'badge-moderate',
    hard: 'badge-hard',
  }[difficulty];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </span>
  );
}

function GenerationProgress({ status }: { status: { status: string; message: string; progress: number } }) {
  const icons = {
    pending: <Clock size={20} className="text-yellow-500" />,
    processing: <Loader2 size={20} className="text-blue-500 animate-spin" />,
    completed: <CheckCircle size={20} className="text-green-500" />,
    failed: <AlertCircle size={20} className="text-red-500" />,
    idle: <Clock size={20} className="text-gray-400" />,
  };

  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center shadow-sm">
        <div className="flex justify-center mb-4">
          {icons[status.status as keyof typeof icons]}
        </div>
        <h3 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
          {status.status === 'pending' && 'Queuing your request...'}
          {status.status === 'processing' && 'AI is generating your paper...'}
          {status.status === 'completed' && 'Paper generated!'}
          {status.status === 'failed' && 'Generation failed'}
          {status.status === 'idle' && 'Waiting...'}
        </h3>
        <p className="text-sm text-gray-400 mb-6">{status.message}</p>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${status.progress}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-2">{status.progress}% complete</p>
      </div>
    </div>
  );
}

function QuestionPaper({ paper, assignmentId }: { paper: GeneratedPaper; assignmentId: string }) {
  const paperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { updateGenerationStatus, setGeneratedPaper } = useAssignmentStore();

  async function handleDownloadPDF() {
    try {
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;

      const el = paperRef.current;
      if (!el) return;

      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let y = 10;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, 'PNG', 10, y, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;

      while (heightLeft > 0) {
        pdf.addPage();
        y = -(imgHeight - heightLeft) - 10;
        pdf.addImage(imgData, 'PNG', 10, y, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
      }

      pdf.save(`${paper.subject}_${paper.className}_QuestionPaper.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    }
  }

  async function handleRegenerate() {
    try {
      setGeneratedPaper(null);
      updateGenerationStatus({ status: 'pending', message: 'Queuing regeneration...', progress: 10 });
      await api.assignments.regenerate(assignmentId);
    } catch (err) {
      console.error('Regeneration failed:', err);
    }
  }

  const totalQuestions = paper.sections.reduce((s, sec) => s + sec.questions.length, 0);

  return (
    <div>
      {/* Action bar */}
      <div
        className="sticky top-14 z-20 border-b border-gray-200 px-6 py-3 flex items-center justify-between no-print"
        style={{ background: 'var(--brand-dark)' }}
      >
        <div className="flex items-center gap-3">
          <CheckCircle size={16} className="text-green-400" />
          <span className="text-white text-sm font-medium">
            Question paper generated — {totalQuestions} questions · {paper.maxMarks} marks
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-white/20 text-white text-sm hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={14} />
            Regenerate
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white text-gray-800 text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            <Download size={14} />
            Download as PDF
          </button>
        </div>
      </div>

      {/* Paper */}
      <div className="p-6 flex justify-center">
        <div
          ref={paperRef}
          className="bg-white rounded-2xl border border-gray-200 w-full max-w-3xl overflow-hidden shadow-sm"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          {/* Paper header */}
          <div className="p-8 pb-5 text-center border-b-2 border-gray-800">
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Sora, sans-serif' }}>
              {paper.schoolName}
            </h1>
            <p className="text-base font-medium text-gray-700 mt-1">Subject: {paper.subject}</p>
            <p className="text-base font-medium text-gray-700">Class: {paper.className}</p>
          </div>

          {/* Meta */}
          <div className="px-8 py-4 border-b border-gray-200 flex items-start justify-between text-sm text-gray-700">
            <div>
              <p><span className="font-semibold">Time Allowed:</span> {paper.timeAllowed}</p>
            </div>
            <div className="text-right">
              <p><span className="font-semibold">Maximum Marks:</span> {paper.maxMarks}</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="px-8 py-4 border-b border-gray-200">
            <p className="text-sm text-gray-600 italic">
              All questions are compulsory unless stated otherwise.
            </p>
          </div>

          {/* Student info */}
          <div className="px-8 py-4 border-b border-gray-200">
            <div className="grid grid-cols-3 gap-6 text-sm text-gray-700">
              <div>
                <span className="font-medium">Name: </span>
                <span className="inline-block border-b border-gray-400 w-32">&nbsp;</span>
              </div>
              <div>
                <span className="font-medium">Roll Number: </span>
                <span className="inline-block border-b border-gray-400 w-20">&nbsp;</span>
              </div>
              <div>
                <span className="font-medium">Class: </span>
                <span className="inline-block border-b border-gray-400 w-16">&nbsp;</span>
                <span className="font-medium ml-2">Section: </span>
                <span className="inline-block border-b border-gray-400 w-10">&nbsp;</span>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="px-8 py-6 space-y-8">
            {paper.sections.map((section, si) => (
              <div key={si}>
                {/* Section header */}
                <div className="text-center mb-4">
                  <h2 className="text-base font-bold text-gray-900 underline" style={{ fontFamily: 'Sora, sans-serif' }}>
                    {section.title}
                  </h2>
                </div>

                {/* Section instruction */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 mb-4">
                  <p className="text-xs font-medium text-gray-600 italic">{section.instruction}</p>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  {section.questions.map((q, qi) => (
                    <div key={qi} className="flex gap-3">
                      <span className="text-sm font-semibold text-gray-700 flex-shrink-0 mt-0.5 w-6">
                        {qi + 1}.
                      </span>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm text-gray-800 leading-relaxed flex-1">{q.text}</p>
                          <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                            <DifficultyBadge difficulty={q.difficulty} />
                            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                              [{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}]
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="border-t border-gray-200 pt-4 text-center">
              <p className="text-xs text-gray-400 font-medium">— End of Question Paper —</p>
            </div>
          </div>

          {/* Answer Key */}
          <div className="border-t-4 border-dashed border-gray-300 mx-8 mb-2" />
          <div className="px-8 py-6">
            <h3 className="text-base font-bold text-gray-800 mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
              Answer Key:
            </h3>
            <div className="space-y-3">
              {paper.sections.flatMap((sec) => sec.questions).map((q, i) => (
                q.answerKey ? (
                  <div key={i} className="text-sm text-gray-700">
                    <span className="font-medium">{i + 1}.</span>{' '}
                    {q.answerKey}
                  </div>
                ) : null
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssignmentDetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { subscribe, unsubscribe } = useWebSocket();
  const { generationStatus, generatedPaper, setGeneratedPaper, updateGenerationStatus } = useAssignmentStore();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const res = await api.assignments.get(id as string);
        const data = res.data as Assignment;
        setAssignment(data);

        if (data.status === 'completed' && data.generatedPaper) {
          setGeneratedPaper(data.generatedPaper);
          updateGenerationStatus({ status: 'completed', message: 'Paper generated!', progress: 100 });
        } else if (data.status === 'failed') {
          updateGenerationStatus({ status: 'failed', message: data.errorMessage || 'Generation failed', progress: 0 });
        } else {
          updateGenerationStatus({ status: data.status, message: 'Processing your request...', progress: 20 });
          subscribe(id as string);
        }
      } catch (err) {
        console.error('Failed to load assignment:', err);
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => {
      if (id) unsubscribe(id as string);
    };
  }, [id, subscribe, unsubscribe, setGeneratedPaper, updateGenerationStatus]);

  // Poll while generating (WebSockets do not work on Vercel serverless backend)
  useEffect(() => {
    if (!id) return;
    const active =
      generationStatus.status === 'pending' ||
      generationStatus.status === 'processing' ||
      assignment?.status === 'pending' ||
      assignment?.status === 'processing';
    if (!active) return;

    const poll = async () => {
      try {
        const res = await api.assignments.get(id as string);
        const data = res.data as Assignment;
        setAssignment(data);
        if (data.status === 'completed' && data.generatedPaper) {
          setGeneratedPaper(data.generatedPaper);
          updateGenerationStatus({ status: 'completed', message: 'Paper generated!', progress: 100 });
        } else if (data.status === 'failed') {
          updateGenerationStatus({
            status: 'failed',
            message: data.errorMessage || 'Generation failed',
            progress: 0,
          });
        } else if (data.status === 'processing') {
          updateGenerationStatus({
            status: 'processing',
            message: 'AI is generating your question paper...',
            progress: 50,
          });
        }
      } catch {
        /* ignore poll errors */
      }
    };

    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, [
    id,
    assignment?.status,
    generationStatus.status,
    setGeneratedPaper,
    updateGenerationStatus,
  ]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  const showPaper = generatedPaper || (assignment?.status === 'completed' && assignment?.generatedPaper);
  const paper = generatedPaper || assignment?.generatedPaper;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 no-print">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ChevronLeft size={18} className="text-gray-500" />
        </button>
        <span className="text-sm text-gray-400">Create Now</span>
      </div>

      {showPaper && paper ? (
        <QuestionPaper paper={paper} assignmentId={id as string} />
      ) : (
        <GenerationProgress status={generationStatus} />
      )}
    </div>
  );
}
