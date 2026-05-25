'use client';
import Link from 'next/link';
import {
  ClipboardList,
  FileText,
  Sparkles,
  BookOpen,
  BarChart3,
  Wand2,
  ArrowRight,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';

const tools = [
  {
    id: 'assessment',
    title: 'AI Assessment Creator',
    description:
      'Upload reference material, configure question types and marks, and generate structured exam papers with Claude AI.',
    icon: ClipboardList,
    href: '/assignments/create',
    available: true,
    tag: 'Core',
  },
  {
    id: 'regenerate',
    title: 'Regenerate & Refine',
    description:
      'Open any completed assignment to regenerate sections, adjust difficulty, or refine the question paper.',
    icon: Sparkles,
    href: '/assignments',
    available: true,
    tag: 'Core',
  },
  {
    id: 'question-bank',
    title: 'Question Bank',
    description: 'Save and reuse questions from past assessments across subjects and classes.',
    icon: BookOpen,
    href: '/library',
    available: true,
    tag: 'Library',
  },
  {
    id: 'rubric',
    title: 'Rubric Generator',
    description: 'Generate marking rubrics aligned to your question paper and learning outcomes.',
    icon: FileText,
    href: null,
    available: false,
    tag: 'Coming soon',
  },
  {
    id: 'analytics',
    title: 'Class Analytics',
    description: 'Track assignment completion, difficulty distribution, and student performance trends.',
    icon: BarChart3,
    href: null,
    available: false,
    tag: 'Coming soon',
  },
];

export default function ToolkitPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="AI Teacher's Toolkit"
        description="AI-powered tools to create assessments, manage content, and support your classroom."
      />

      <div className="flex-1 p-6">
        <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-2xl p-6 mb-6 flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0"
            style={{ background: 'var(--brand-orange)' }}
          >
            <Wand2 size={22} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
              Powered by Groq AI
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
              VedaAI converts your inputs into structured prompts, generates sections with difficulty
              tags and marks via Groq, and renders exam-ready papers — never raw LLM output.
            </p>
            <Link
              href="/assignments/create"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full text-white text-sm font-medium hover:opacity-90"
              style={{ background: 'var(--brand-dark)' }}
            >
              Start creating
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const card = (
              <div
                className={`bg-white rounded-xl border p-5 h-full flex flex-col transition-shadow ${
                  tool.available
                    ? 'border-gray-200 hover:shadow-md cursor-pointer'
                    : 'border-gray-100 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: tool.available ? '#FFF0EB' : '#F5F5F5',
                      color: tool.available ? 'var(--brand-orange)' : '#9CA3AF',
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      tool.available
                        ? 'bg-orange-50 text-orange-700 border border-orange-100'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {tool.tag}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {tool.title}
                </h3>
                <p className="text-sm text-gray-500 flex-1 leading-relaxed">{tool.description}</p>
                {tool.available && tool.href && (
                  <span
                    className="inline-flex items-center gap-1 mt-4 text-sm font-medium"
                    style={{ color: 'var(--brand-orange)' }}
                  >
                    Open tool
                    <ArrowRight size={14} />
                  </span>
                )}
              </div>
            );

            if (tool.available && tool.href) {
              return (
                <Link key={tool.id} href={tool.href} className="block h-full">
                  {card}
                </Link>
              );
            }
            return <div key={tool.id}>{card}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
