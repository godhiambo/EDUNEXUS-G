import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  Sparkles,
  QrCode,
  GraduationCap,
  Users,
  Building,
  CheckCircle2,
  ArrowRight,
  Zap,
  ShieldCheck,
  Share2
} from 'lucide-react';

interface WhatsAppDashboardWidgetProps {
  userRole?: string;
  onOpenWhatsAppModal?: () => void;
}

export const WhatsAppDashboardWidget: React.FC<WhatsAppDashboardWidgetProps> = ({
  userRole,
  onOpenWhatsAppModal
}) => {
  const [activeRole, setActiveRole] = useState<'Student' | 'Teacher' | 'Parent' | 'Administrator'>(() => {
    if (userRole && ['Student', 'Teacher', 'Parent', 'Administrator'].includes(userRole)) {
      return userRole as any;
    }
    return 'Student';
  });

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [preferredFormat, setPreferredFormat] = useState<'auto' | 'mobile_text' | 'pdf_document' | 'image_document' | 'rich_report'>('auto');
  const [conversationMode, setConversationMode] = useState<'structured' | 'flexible' | 'smart' | 'expert'>('smart');
  const [savingPref, setSavingPref] = useState(false);
  const [prefSavedMessage, setPrefSavedMessage] = useState(false);

  const handleFormatChange = async (newFormat: 'auto' | 'mobile_text' | 'pdf_document' | 'image_document' | 'rich_report') => {
    setPreferredFormat(newFormat);
    setSavingPref(true);
    try {
      await fetch('/api/whatsapp/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredOutputFormat: newFormat, conversationMode })
      });
      setPrefSavedMessage(true);
      setTimeout(() => setPrefSavedMessage(false), 2500);
    } catch (err) {
      console.error('Failed to update WhatsApp output preference:', err);
    } finally {
      setSavingPref(false);
    }
  };

  const handleModeChange = async (newMode: 'structured' | 'flexible' | 'smart' | 'expert') => {
    setConversationMode(newMode);
    setSavingPref(true);
    try {
      await fetch('/api/whatsapp/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredOutputFormat: preferredFormat, conversationMode: newMode })
      });
      setPrefSavedMessage(true);
      setTimeout(() => setPrefSavedMessage(false), 2500);
    } catch (err) {
      console.error('Failed to update WhatsApp mode preference:', err);
    } finally {
      setSavingPref(false);
    }
  };

  const rawPhoneNumber = '254740183934';
  const displayPhoneNumber = '0740 183 934 (+254 740 183 934)';

  const defaultMessages = {
    Student: 'Hello EduNexus AI Tutor! 🎓 I am a Student and I need help with my studies.',
    Teacher: 'Hello EduNexus AI Assistant! 👨‍🏫 I am a Teacher and I would like help with CBC lesson plans & marking schemes.',
    Parent: 'Hello EduNexus AI Assistant! 👨‍👩‍👧 I am a Parent and I would like assistance with my child\'s education & progress.',
    Administrator: 'Hello EduNexus AI Assistant! 🏫 I am a School Leader and I need assistance with institutional management.'
  };

  const currentMessage = selectedPrompt || defaultMessages[activeRole];
  const whatsappUrl = `https://wa.me/${rawPhoneNumber}?text=${encodeURIComponent(currentMessage)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(whatsappUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(displayPhoneNumber);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const roleHighlights = {
    Student: [
      { title: 'Socratic Subject Tutoring', desc: 'Math, Physics, Chemistry, Biology, English & 7 more subjects', icon: '📚' },
      { title: 'Homework Photo Solver', desc: 'Send homework photos or voice notes for instant step-by-step guidance', icon: '📷' },
      { title: 'Revision & Past Papers', desc: 'Interactive practice quizzes, topic summaries & mock exam tips', icon: '📝' },
      { title: 'Career & University Advice', desc: 'Course guidance, subject selection & scholarship insights', icon: '🎓' }
    ],
    Teacher: [
      { title: 'CBC Lesson Plans & Schemes', desc: 'Auto-generate structured lesson plans, notes & daily schemes', icon: '📖' },
      { title: 'CATs & Rubric Generators', desc: 'Create exams, marking schemes & competency assessment grids', icon: '📊' },
      { title: 'Classroom & STEM Activities', desc: 'PhET simulations, group tasks, science experiments & games', icon: '🧪' },
      { title: 'Automated Parent Updates', desc: 'Dispatch progress reports and reminders straight to WhatsApp', icon: '📩' }
    ],
    Parent: [
      { title: 'Academic Progress Insights', desc: 'Track performance reports, exam results & learning goals', icon: '📊' },
      { title: 'Home Learning & Study Tips', desc: 'Simple, engaging activities, reading routines & motivation tips', icon: '🏠' },
      { title: 'Curriculum Breakdowns', desc: 'Clear, jargon-free explanations of what your child is learning', icon: '💡' },
      { title: 'Fee Balances & Notice Alerts', desc: 'Instant WhatsApp updates on school calendar & events', icon: '🔔' }
    ],
    Administrator: [
      { title: 'Institutional Leadership', desc: 'Policy drafting, staff circulars, newsletters & meeting agendas', icon: '🏛️' },
      { title: 'KICD & CBC Compliance', desc: 'Ministry regulations, quality assurance & improvement plans', icon: '📖' },
      { title: 'WhatsApp Broadcast Engine', desc: 'Send emergency alerts & announcements to parents & staff', icon: '📱' },
      { title: 'School Analytics & Records', desc: 'Timetables, teacher appraisals & attendance monitoring', icon: '📈' }
    ]
  };

  const quickPrompts = {
    Student: [
      'Solve this Math algebra step-by-step',
      'Explain Photosynthesis for Form 3 Biology',
      'Give me 5 Physics revision questions'
    ],
    Teacher: [
      'Create Form 2 Physics lesson plan on Motion',
      'Generate CBC marking rubric for Chemistry CAT',
      'Draft a parent update for upcoming exams'
    ],
    Parent: [
      'Explain CBC Grade 7 Science strand',
      'Give me 3 home study habits for my child',
      'How do I interpret my child\'s report comments?'
    ],
    Administrator: [
      'Draft a staff meeting agenda on CBC compliance',
      'Write a parent broadcast circular on term dates',
      'Create a school improvement plan template'
    ]
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 border-2 border-[#25D366]/40 rounded-3xl p-6 sm:p-8 shadow-[0_15px_40px_rgba(7,94,84,0.35)] relative overflow-hidden text-white my-6">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-[#25D366]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -mb-20 w-80 h-80 bg-[#128C7E]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-[#25D366]/20 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#25D366]/20 border border-[#25D366]/50 text-[#25D366] text-xs font-black uppercase tracking-wider mb-2 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#25D366] animate-ping" />
            <MessageSquare className="w-3.5 h-3.5 fill-[#25D366]" />
            <span>EduNexus WhatsApp AI Assistant</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 flex-wrap">
            <span>Chat on WhatsApp</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#25D366] text-slate-950 text-xs font-extrabold shadow-sm">
              Official Channel
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 font-medium mt-1.5 max-w-2xl leading-relaxed">
            Scan the QR code with your phone camera or tap the button below to open a direct 1-on-1 AI tutoring & administrative conversation on WhatsApp.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div 
          role="tablist" 
          aria-label="EduNexus Assistant Role Selector"
          className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950/80 border border-[#25D366]/30 self-stretch sm:self-auto overflow-x-auto shadow-inner"
        >
          {(['Student', 'Teacher', 'Parent', 'Administrator'] as const).map((role) => (
            <button
              key={role}
              role="tab"
              aria-selected={activeRole === role}
              aria-controls={`panel-${role}`}
              onClick={() => {
                setActiveRole(role);
                setSelectedPrompt('');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:outline-none ${
                activeRole === role
                  ? 'bg-[#25D366] text-slate-950 shadow-md font-black scale-[1.02]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <span aria-hidden="true">
                {role === 'Student' && '🎓'}
                {role === 'Teacher' && '👨‍🏫'}
                {role === 'Parent' && '👨‍👩‍👧'}
                {role === 'Administrator' && '🏫'}
              </span>
              <span>{role} Assistant</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Info & Controls Left vs QR Code Centerpiece Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-6">
        
        {/* Left Column (Feature Cards & Quick Starters) */}
        <div id={`panel-${activeRole}`} role="tabpanel" className="lg:col-span-7 space-y-5">
          
          {/* Role Capabilities 2x2 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {roleHighlights[activeRole].map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-950/70 border border-[#25D366]/25 hover:border-[#25D366]/70 transition-all duration-200 shadow-sm group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true">{item.icon}</span>
                  <div>
                    <h4 className="font-extrabold text-xs text-[#25D366] group-hover:text-emerald-300 transition">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-200 leading-snug mt-1 font-medium">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Prompt Starter Chips */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-extrabold text-[#25D366] uppercase tracking-wider block">
              💡 Tap a sample prompt to customize your message:
            </span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Sample WhatsApp prompts">
              {quickPrompts[activeRole].map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  aria-pressed={selectedPrompt === prompt}
                  onClick={() => setSelectedPrompt(prompt)}
                  className={`text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:outline-none ${
                    selectedPrompt === prompt
                      ? 'bg-[#25D366] text-slate-950 border-[#25D366] font-extrabold shadow-md scale-[1.01]'
                      : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-[#25D366]/60 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#25D366] shrink-0" aria-hidden="true" />
                  <span>"{prompt}"</span>
                </button>
              ))}
            </div>
          </div>

          {/* Multi-Mode WhatsApp AI Experience Selector */}
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-[#25D366]/30 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black text-[#25D366] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#25D366]" />
                <span>WhatsApp AI Conversation Mode</span>
              </span>
              {prefSavedMessage && (
                <span className="text-[10px] font-extrabold text-[#25D366] animate-pulse flex items-center gap-1">
                  <Check className="w-3 h-3" /> Preference Saved
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                { id: 'smart', label: '🧠 Smart Mode', tag: 'Adaptive Default', desc: 'Auto-adapts between structured menus and fluid natural conversation based on query intent' },
                { id: 'structured', label: '🧭 Structured Mode', tag: 'Guided Workflows', desc: 'Includes step-by-step breakdowns and numbered interactive action menus with every reply' },
                { id: 'flexible', label: '💬 Flexible Mode', tag: 'Natural Conversation', desc: 'Direct, open-ended conversational AI without visual menus or option lists unless requested' },
                { id: 'expert', label: '🎓 Expert Mode', tag: 'Deep Reasoning & STEM', desc: 'Deep technical reasoning, formulas, equations, structured tables & zero fluff for advanced users' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleModeChange(m.id as any)}
                  className={`p-2.5 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                    conversationMode === m.id
                      ? 'bg-[#25D366]/20 border-[#25D366] text-white shadow-xs'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black truncate text-[#25D366]">{m.label}</span>
                      <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40">{m.tag}</span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-tight mt-1">{m.desc}</p>
                  </div>
                  {conversationMode === m.id && (
                    <span className="text-[9px] font-bold text-[#25D366] mt-1.5 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Selected Mode
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred WhatsApp Delivery Format Setting */}
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-[#25D366]/30 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black text-[#25D366] uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#25D366]" />
                <span>Preferred WhatsApp Delivery Format</span>
              </span>
              {prefSavedMessage && (
                <span className="text-[10px] font-extrabold text-[#25D366] animate-pulse flex items-center gap-1">
                  <Check className="w-3 h-3" /> Preference Saved
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {[
                { id: 'auto', label: '🤖 Auto-Select', desc: 'AI chooses best format' },
                { id: 'mobile_text', label: '📱 Mobile Text', desc: 'Quick reading text' },
                { id: 'pdf_document', label: '📄 PDF Document', desc: 'Printable PDF + preview' },
                { id: 'image_document', label: '🖼️ Image Card', desc: 'Visual PNG cards' },
                { id: 'rich_report', label: '📊 Rich Report', desc: 'Detailed report PDF' }
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => handleFormatChange(fmt.id as any)}
                  className={`p-2 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                    preferredFormat === fmt.id
                      ? 'bg-[#25D366]/20 border-[#25D366] text-white shadow-xs'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="text-xs font-black truncate">{fmt.label}</span>
                  <span className="text-[9px] text-slate-400 leading-tight mt-0.5">{fmt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="pt-3 flex flex-wrap items-center gap-3">
            {/* Primary Branded WhatsApp CTA Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open direct WhatsApp conversation with EduNexus AI Assistant"
              className="px-6 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-sm shadow-[0_6px_25px_rgba(37,211,102,0.45)] hover:shadow-[0_8px_30px_rgba(37,211,102,0.6)] transition-all cursor-pointer flex items-center justify-center gap-2.5 group active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <MessageSquare className="w-5 h-5 fill-slate-950 group-hover:scale-110 transition" aria-hidden="true" />
              <span>Chat on WhatsApp Now</span>
              <ExternalLink className="w-4 h-4 text-slate-950 opacity-80" aria-hidden="true" />
            </a>

            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              aria-label="Copy WhatsApp chat URL to clipboard"
              className="px-4 py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition cursor-pointer flex items-center gap-2 active:scale-95 shadow-sm focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:outline-none"
              title="Copy WhatsApp Chat Link"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-[#25D366]" aria-hidden="true" />
                  <span className="text-[#25D366] font-extrabold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            {/* Official Phone Number Badge */}
            <button
              onClick={handleCopyNumber}
              aria-label={`Copy EduNexus official phone number ${displayPhoneNumber}`}
              className="px-4 py-3.5 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs border border-[#25D366]/40 transition cursor-pointer flex items-center gap-2 hover:border-[#25D366] shadow-sm focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:outline-none"
              title="Click to copy official phone number"
            >
              <Smartphone className="w-4 h-4 text-[#25D366]" aria-hidden="true" />
              <span>{displayPhoneNumber}</span>
              {copiedNumber ? (
                <Check className="w-3.5 h-3.5 text-[#25D366]" aria-hidden="true" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Visually Distinct Scannable QR Code Frame */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="bg-white rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-[#25D366] relative text-slate-900 flex flex-col items-center max-w-xs w-full group transition-transform hover:scale-[1.02]">
            
            {/* Corner Decorative Target Markers */}
            <div className="absolute top-3 left-3 w-3.5 h-3.5 border-t-2 border-l-2 border-[#075E54]" />
            <div className="absolute top-3 right-3 w-3.5 h-3.5 border-t-2 border-r-2 border-[#075E54]" />
            <div className="absolute bottom-3 left-3 w-3.5 h-3.5 border-b-2 border-l-2 border-[#075E54]" />
            <div className="absolute bottom-3 right-3 w-3.5 h-3.5 border-b-2 border-r-2 border-[#075E54]" />

            {/* Badge Above QR */}
            <div className="px-3 py-1 rounded-full bg-[#25D366]/15 text-[#075E54] font-black text-[11px] uppercase tracking-wider mb-3 flex items-center gap-1.5 shadow-xs border border-[#25D366]/30">
              <QrCode className="w-3.5 h-3.5 text-[#075E54]" />
              <span>Official WhatsApp QR Code</span>
            </div>

            {/* High Contrast QR Code Canvas */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-inner relative flex items-center justify-center">
              <QRCodeSVG
                value={whatsappUrl}
                size={180}
                level="H"
                includeMargin={true}
                fgColor="#075E54"
                bgColor="#FFFFFF"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-11 h-11 rounded-full bg-[#25D366] border-2 border-white flex items-center justify-center shadow-lg">
                  <MessageSquare className="w-5 h-5 text-slate-950 fill-slate-950" />
                </div>
              </div>
            </div>

            {/* Phone Scan Instructions */}
            <div className="text-center mt-3.5 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-slate-900">
                <Smartphone className="w-4 h-4 text-[#075E54] animate-bounce" />
                <span>Scan with Phone Camera</span>
              </div>
              <p className="text-[10px] text-slate-600 font-semibold">
                Open WhatsApp or Camera → Point at QR → Tap link to chat
              </p>
            </div>

            {/* Official Business Tag */}
            <div className="mt-3.5 w-full pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-700 font-extrabold px-1">
              <span className="flex items-center gap-1 text-[#075E54]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#25D366]" /> Verified AI Bot
              </span>
              <span className="font-mono text-slate-600 text-[10px]">{displayPhoneNumber}</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default WhatsAppDashboardWidget;
