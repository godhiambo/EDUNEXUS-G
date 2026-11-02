import React, { useState } from 'react';
import DemoVideoModal from './DemoVideoModal';
import Footer from '../Footer';
import { BRAND } from '../brand/Brand';
import {
  ArrowRight,
  BookOpen,
  Compass,
  Users,
  Play,
  FileText,
  ClipboardCheck,
  MessageCircleQuestion,
  Calculator,
  Map,
  WifiOff,
  CheckCircle2,
  Layers,
  Wand2,
  Share2,
} from 'lucide-react';

type Role = 'Teacher' | 'Student' | 'Parent' | 'Administrator';

interface LandingPageProps {
  onChooseWorkspace: () => void;
  onOpenAuth: (role?: Role) => void;
  onNavigateToShowcase: () => void;
  onOpenDemoSandbox: () => void;
  youtubeUrl?: string;
}

const WORKSPACES: {
  role: Role;
  title: string;
  icon: React.ElementType;
  accent: string;
  summary: string;
  features: string[];
}[] = [
  {
    role: 'Teacher',
    title: 'Teachers',
    icon: BookOpen,
    accent: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/30',
    summary: 'Prepare CBC lessons, schemes of work and assessments in minutes.',
    features: ['5E lesson plans & lesson notes', 'Schemes of work', 'Quizzes, CATs & marking keys', 'Class mastery reports'],
  },
  {
    role: 'Student',
    title: 'Learners',
    icon: Compass,
    accent: 'text-violet-300 bg-violet-400/10 border-violet-400/30',
    summary: 'Get unstuck with a tutor that asks guiding questions instead of giving answers.',
    features: ['Socratic AI tutor', 'Flashcards & practice quizzes', 'Interactive Math Studio', 'Progress & badges'],
  },
  {
    role: 'Parent',
    title: 'Parents',
    icon: Users,
    accent: 'text-amber-300 bg-amber-400/10 border-amber-400/30',
    summary: "See how your child is progressing and stay in touch with their teacher.",
    features: ['Competency progress by strand', 'Teacher messages', 'Upcoming work & schedule', 'Downloadable reports'],
  },
];

const STEPS = [
  { icon: Layers, title: 'Pick grade, subject and strand', desc: 'Choose from the KICD CBC structure, PP1 to Grade 12.' },
  { icon: Wand2, title: 'Generate a draft', desc: 'Lesson plan, notes, worksheet or assessment — following the 5E model.' },
  { icon: Share2, title: 'Edit, print or share', desc: 'Adjust it to your class, then print, export or share by QR code or WhatsApp.' },
];

const FEATURES = [
  { icon: FileText, title: 'AI lesson planner', desc: '5E lesson plans, lesson notes and schemes of work mapped to CBC strands and sub-strands.' },
  { icon: ClipboardCheck, title: 'Assessment generator', desc: 'Quizzes, CATs and end-term exams with marking keys and rubrics.' },
  { icon: MessageCircleQuestion, title: 'Socratic AI tutor', desc: 'Guides learners step by step with questions and hints, in English or Kiswahili.' },
  { icon: Calculator, title: 'Math Studio', desc: 'Interactive graphs and geometry powered by GeoGebra.' },
  { icon: Map, title: 'Virtual field trips', desc: '360° explorations with audio guides for Science and Social Studies.' },
  { icon: WifiOff, title: 'Works on low data', desc: 'Installable app with offline mode, plus a WhatsApp assistant.' },
];

/** A small, honest preview of what a generated lesson plan looks like. */
const LessonPreview: React.FC = () => (
  <figure
    aria-label="Example of a generated lesson plan"
    className="w-full max-w-md rounded-2xl border border-line bg-surface shadow-2xl shadow-black/40 overflow-hidden"
  >
    <div className="flex items-center justify-between px-5 py-3 border-b border-line bg-raised">
      <span className="text-xs font-semibold text-ink-soft">Lesson plan · draft</span>
      <span className="text-xs font-semibold text-brand">CBC aligned</span>
    </div>
    <div className="p-5 space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Grade 6 · Science & Technology</p>
        <p className="mt-1 text-lg font-serif font-bold text-ink">Solar energy and how we use it</p>
        <p className="mt-1 text-sm text-ink-muted">Strand: Energy · 40 minutes · 5E model</p>
      </div>
      <ol className="space-y-2.5">
        {[
          ['Engage', 'How does a solar calculator work without a battery?'],
          ['Explore', 'Groups test a small solar panel in sun and shade.'],
          ['Explain', 'Light energy → electrical energy.'],
          ['Elaborate', 'Where is solar used in our community?'],
          ['Evaluate', '5-question exit quiz with marking key.'],
        ].map(([phase, text], i) => (
          <li key={phase} className="flex gap-3">
            <span className="mt-0.5 w-6 h-6 shrink-0 rounded-full bg-brand/15 text-brand text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <span className="text-sm text-ink-soft">
              <strong className="text-ink font-semibold">{phase}:</strong> {text}
            </span>
          </li>
        ))}
      </ol>
    </div>
    <figcaption className="sr-only">Sample output for illustration.</figcaption>
  </figure>
);

export default function LandingPage({
  onChooseWorkspace,
  onOpenAuth,
  onNavigateToShowcase,
  onOpenDemoSandbox,
  youtubeUrl = 'https://www.youtube.com/embed/D7cpYYgr-6E',
}: LandingPageProps) {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="brand-page w-full bg-canvas text-ink-soft font-sans overflow-x-hidden">
      <main id="main">
        {/* HERO */}
        <section className="relative px-4 sm:px-8 pt-14 pb-20 md:pt-24 md:pb-28">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_60%_at_30%_20%,rgba(52,211,153,0.12),transparent_70%)]"
          />
          <div className="relative max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/30 bg-brand/10 text-sm font-semibold text-brand">
                <span className="w-2 h-2 rounded-full bg-brand" aria-hidden="true" />
                Now piloting with Kenyan schools
              </p>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-ink leading-[1.1]">
                CBC lesson plans, assessments and an AI tutor —{' '}
                <span className="text-brand">in one place.</span>
              </h1>

              <p className="text-lg text-ink-soft leading-relaxed max-w-xl">
                EduNexus helps teachers prepare CBC-aligned lessons in minutes, gives learners a tutor that guides
                instead of giving answers, and keeps parents in the loop.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={onOpenDemoSandbox}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-strong hover:bg-brand text-brand-ink font-bold text-base transition-colors"
                >
                  Try the demo — no sign-up
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowVideo(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-line hover:bg-raised text-ink font-semibold text-base transition-colors"
                >
                  <Play className="w-4 h-4 text-brand" aria-hidden="true" />
                  Watch the tour
                </button>
              </div>

              <p className="text-sm text-ink-muted">
                Already have an account?{' '}
                <button type="button" onClick={() => onOpenAuth()} className="font-semibold text-brand hover:underline">
                  Sign in
                </button>
              </p>
            </div>

            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <LessonPreview />
            </div>
          </div>
        </section>

        {/* WORKSPACES */}
        <section id="features" aria-labelledby="workspaces-title" className="px-4 sm:px-8 py-20 bg-surface border-y border-line">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="max-w-2xl">
              <h2 id="workspaces-title" className="text-3xl sm:text-4xl font-serif font-bold text-ink tracking-tight">
                A workspace for everyone in the classroom
              </h2>
              <p className="mt-3 text-base text-ink-soft">
                Each role gets its own tools, built around the same CBC curriculum.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {WORKSPACES.map(({ role, title, icon: Icon, accent, summary, features }) => (
                <article key={role} className="flex flex-col rounded-2xl border border-line bg-canvas p-6">
                  <span className={`w-12 h-12 rounded-xl border flex items-center justify-center ${accent}`}>
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-xl font-serif font-bold text-ink">{title}</h3>
                  <p className="mt-2 text-sm text-ink-soft leading-relaxed">{summary}</p>
                  <ul className="mt-5 space-y-2.5 flex-1">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-ink-soft">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-brand" aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => onOpenAuth(role)}
                    className="mt-6 inline-flex items-center gap-1.5 self-start py-2 text-sm font-bold text-brand hover:underline"
                  >
                    Start as {role === 'Student' ? 'a learner' : `a ${role.toLowerCase()}`}
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section aria-labelledby="how-title" className="px-4 sm:px-8 py-20">
          <div className="max-w-7xl mx-auto space-y-12">
            <h2 id="how-title" className="text-3xl sm:text-4xl font-serif font-bold text-ink tracking-tight">
              From strand to lesson in three steps
            </h2>
            <ol className="grid md:grid-cols-3 gap-6">
              {STEPS.map(({ icon: Icon, title, desc }, i) => (
                <li key={title} className="rounded-2xl border border-line bg-surface p-6">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-brand text-brand-ink text-sm font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <Icon className="w-5 h-5 text-brand" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
                  <p className="mt-2 text-sm text-ink-soft leading-relaxed">{desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FEATURES */}
        <section aria-labelledby="features-title" className="px-4 sm:px-8 py-20 bg-surface border-y border-line">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="max-w-2xl">
              <h2 id="features-title" className="text-3xl sm:text-4xl font-serif font-bold text-ink tracking-tight">
                What's included
              </h2>
              <p className="mt-3 text-base text-ink-soft">
                Built around the KICD Competency-Based Curriculum, with Cambridge, IB and other syllabi also supported.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-2xl border border-line bg-canvas p-6">
                  <Icon className="w-6 h-6 text-brand" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
                  <p className="mt-2 text-sm text-ink-soft leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onNavigateToShowcase}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-line hover:bg-raised text-ink font-semibold text-sm transition-colors"
              >
                Browse sample lessons in the OER Library
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        {/* PILOT CTA — honest pre-launch positioning, no invented testimonials */}
        <section aria-labelledby="pilot-title" className="px-4 sm:px-8 py-20">
          <div className="max-w-4xl mx-auto rounded-3xl border border-brand/30 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(12,23,32,0.6))] p-8 sm:p-12 text-center">
            <h2 id="pilot-title" className="text-3xl sm:text-4xl font-serif font-bold text-ink tracking-tight">
              Help shape EduNexus
            </h2>
            <p className="mt-4 text-base text-ink-soft max-w-2xl mx-auto leading-relaxed">
              We're piloting with teachers and schools in Kenya. Join free, use it in your classroom, and tell us what
              to improve.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={onChooseWorkspace}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-strong hover:bg-brand text-brand-ink font-bold transition-colors"
              >
                Create a free account
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </button>
              <a
                href={`mailto:${BRAND.supportEmail}?subject=EduNexus%20school%20pilot`}
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl border border-line hover:bg-raised text-ink font-semibold transition-colors"
              >
                Bring EduNexus to your school
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <DemoVideoModal
        isOpen={showVideo}
        onClose={() => setShowVideo(false)}
        onOpenSandbox={onOpenDemoSandbox}
        initialTab="video"
        youtubeUrl={youtubeUrl}
      />
    </div>
  );
}
