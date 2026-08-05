import React from 'react';
import { SEO } from '../components/SEO';
import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';
import { 
  Eye, 
  Keyboard, 
  Sparkles, 
  CheckCircle2, 
  Mail, 
  Volume2, 
  Contrast, 
  Maximize2,
  Building,
  Wrench
} from 'lucide-react';

export const AccessibilityStatementPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <SEO 
        title="Accessibility Statement" 
        description="EduNexus accessibility statement detailing WCAG 2.1 AA compliance, keyboard navigation, screen reader compatibility, and assistive tools."
        canonicalPath="/accessibility"
      />

      <PublicNavbar />

      {/* Header Banner */}
      <section className="relative pt-16 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-4xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
            <Eye className="w-4 h-4" />
            <span>Inclusive Design & Accessibility</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-black text-white">Accessibility Statement</h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            EduNexus is committed to ensuring digital accessibility for all educators, students, and learners regardless of physical ability or device technology.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-10 leading-relaxed text-slate-300 text-sm flex-1">

        {/* Core Commitment Box */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-3 text-emerald-400">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-xl font-serif font-bold text-white">Our Accessibility Standard</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            We continually align our digital platform with the Web Content Accessibility Guidelines (<strong className="text-white">WCAG 2.1 Level AA standards</strong>). These guidelines define requirements for making web content accessible to people with visual, auditory, motor, and cognitive disabilities.
          </p>
        </div>

        {/* WCAG Pillars */}
        <div className="space-y-6">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Key Accessibility Features Implemented</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Keyboard Navigation */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Keyboard className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base font-serif">Keyboard Navigation & Focus Control</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                All interactive controls, buttons, forms, and navigation menus are fully accessible using standard keyboard commands (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`). Visible focus rings guide users effortlessly through page structures.
              </p>
            </div>

            {/* Screen Readers & Semantic HTML */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base font-serif">Screen Reader Compatibility & ARIA</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Structured with semantic HTML5 tags (&lt;header&gt;, &lt;nav&gt;, &lt;main&gt;, &lt;section&gt;, &lt;footer&gt;), explicit form label bindings, and ARIA landmarks (role, aria-label, aria-live) for seamless compatibility with NVDA, JAWS, VoiceOver, and TalkBack.
              </p>
            </div>

            {/* High Contrast & Font Sizing */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Contrast className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base font-serif">Color Contrast & Flexible Scaling</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                All text elements maintain WCAG AA minimum contrast ratios (4.5:1 for body text, 3:1 for large display text). The application scales responsively without visual distortion or clipped text when zoomed up to 200%.
              </p>
            </div>

            {/* Text-to-Speech & Multi-Modal */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Volume2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base font-serif">Assistive Text-to-Speech & Dyslexia Fonts</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                EduNexus incorporates built-in Web Speech API Text-to-Speech audio reading for AI Tutor responses, adjustable font size toggles, and OpenDyslexic typography support in accessibility settings.
              </p>
            </div>

          </div>
        </div>

        {/* Accessibility Checklist Summary */}
        <div className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Technical Compliance Summary</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {[
              'Perceivable: High contrast ratios & text alternatives for media',
              'Operable: Full keyboard navigation & logical tab ordering',
              'Understandable: Clear navigation headers & error validation guidance',
              'Robust: Valid HTML5 & broad screen reader parser support',
              'Responsive: Fluid layouts supporting screen magnification up to 200%',
              'Reduced Motion: Motion preferences respected for animation transitions'
            ].map((check, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-200 font-medium">{check}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback & Barrier Reporting */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="space-y-1">
            <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-400" />
              <span>Feedback & Accessibility Support</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              We welcome your feedback on the accessibility of EduNexus. If you encounter accessibility barriers, difficult navigation, or require content in an alternative format, please notify our accessibility team:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                <span>Technical Support & Accessibility Help</span>
              </span>
              <a href="mailto:support@joinedunexus.app?subject=Accessibility%20Barrier%20Report" className="text-emerald-400 font-extrabold hover:underline block text-sm">
                support@joinedunexus.app
              </a>
              <p className="text-[11px] text-slate-400">Subject: Accessibility Barrier Report</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-400" />
                <span>Administrative & Compliance Team</span>
              </span>
              <a href="mailto:admin@joinedunexus.app?subject=WCAG%20Compliance%20Inquiry" className="text-indigo-400 font-extrabold hover:underline block text-sm">
                admin@joinedunexus.app
              </a>
              <p className="text-[11px] text-slate-400">Subject: WCAG Compliance Inquiry</p>
            </div>
          </div>
        </div>

      </section>

      <Footer />
    </div>
  );
};

export default AccessibilityStatementPage;
