import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  User, 
  Shield, 
  Info, 
  X, 
  Heart, 
  School, 
  FileText, 
  Download, 
  CheckCircle, 
  ShieldCheck, 
  Star, 
  Layers, 
  HelpCircle,
  BookOpen,
  Compass,
  Accessibility,
  Sparkles,
  BookMarked,
  CheckSquare,
  Volume2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import { useState } from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const { profile } = useAuth();
  const isAuditAllowed = profile?.role === 'Administrator';
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'audit' | 'navigation' | 'accessibility'>(
    profile?.role === 'Administrator' ? 'audit' : 'navigation'
  );

  const exportToPDF = () => {
    setIsDownloading(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let y = 25;

      // Helper for adding lines & controlling page breaks
      const addParagraph = (text: string, fontSize = 10, fontStyle = 'normal', color = [51, 65, 85]) => {
        doc.setFont('helvetica', fontStyle);
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        
        const lines = doc.splitTextToSize(text, 170);
        lines.forEach((line: string) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
            // Header
            doc.setFont('helvetica', 'oblique');
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text("Pedagogical Workspace — System & UDL Documentation Audit", 20, 10);
            doc.line(20, 12, 190, 12);
          }
          doc.setFont('helvetica', fontStyle);
          doc.setFontSize(fontSize);
          doc.setTextColor(color[0], color[1], color[2]);
          doc.text(line, 20, y);
          y += fontSize * 0.45 + 2.5;
        });
      };

      const addSectionHeader = (title: string) => {
        if (y > 240) {
          doc.addPage();
          y = 20;
        } else {
          y += 4;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(95, 111, 82); // Primary Theme Green #5f6f52
        doc.text(title, 20, y);
        y += 4;
        doc.setDrawColor(95, 111, 82);
        doc.setLineWidth(0.4);
        doc.line(20, y, 190, y);
        y += 6;
      };

      // Draw Main Title & Cover details
      doc.setFillColor(95, 111, 82);
      doc.rect(20, 15, 170, 18, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text("PEDAGOGICAL WORKSPACE ARCHITECTURAL AUDIT & USER GUIDE", 25, 26);
      
      y = 42;
      addParagraph("System Classification: Official Educational Platform Audit & Playbook", 9, 'bold', [95, 111, 82]);
      addParagraph(`Audit Generation Timestamp: ${new Date().toLocaleString()} (UTC)`, 9, 'normal', [100, 116, 139]);
      addParagraph(`Auditor Profile: ${profile?.displayName || 'Educator'} (${profile?.email || 'user@nexused.edu'})`, 9, 'normal', [100, 116, 139]);
      y += 4;

      addSectionHeader("1. Executive Platform Overview");
      addParagraph("The Pedagogical Workspace is a modern full-stack web application designed for K-12 and Higher Education. Its primary purpose is to empower learning designers, school instructors, students, and parents to collaborate, architect, and access curriculum-aligned materials. Engineered with persistent offline sync, highly optimized Socratic tutoring sidebars, and real-time database integrations, the application ensures high educational availability and comprehensive accessibility.");

      addSectionHeader("2. Core Features & Functional Modules");
      addParagraph("• Curriculum Lesson Creator & Lesson Planner:");
      addParagraph("Generates dynamic, fully structured lesson schedules, interactive tables of specifications, customized cognitive activities, and teaching notes mapped directly to subject-specific objectives.", 9.5, 'normal', [71, 85, 105]);
      
      addParagraph("• Adaptive Learning Path Workspace:");
      addParagraph("Empowers students with dynamic, confidence-adjusted lesson trails. If a student indicates low confidence in an entry topic, the learning path dynamically positions it at the root with descriptive instructions, low-difficulty supportive activities, and high study hours. For topics with high confidence, the system fast-tracks the syllabus and injects complex real-world project tasks.", 9.5, 'normal', [71, 85, 105]);

      addParagraph("• File Library & Document Archive (Enhanced View):");
      addParagraph("A centralized depository storing resource documents with tags, metadata, and folder paths. The brand-new 'Enhanced View' displays a live text-extract preview snippet and adaptive thumbnails (images render a direct photo view, while PDFs and DOCX files render structured text grids highlighting the extracted file content).", 9.5, 'normal', [71, 85, 105]);

      addParagraph("• Shared Collaborative Documents & Interactive Reader:");
      addParagraph("Allows dual-mode real-time edits, comment pinning, peer/educator assessments, and a Socratic AI sidebar capable of answering contextual document questions using specialized tutoring prompts.", 9.5, 'normal', [71, 85, 105]);

      addParagraph("• Accessibility Customizer & Profiles:");
      addParagraph("Provides deep personalization, including dyslexic-friendly fonts, high-contrast states, line-height scaling, screen reader prompts, and custom-designed learner profiles.", 9.5, 'normal', [71, 85, 105]);

      addSectionHeader("3. Application Navigation Guide");
      addParagraph("To maximize the app's effectiveness, different educational stakeholders should utilize specialized navigation routes:");
      
      addParagraph("• Educator Playbook (Teachers & Admins):", 10, 'bold', [95, 111, 82]);
      addParagraph("1. Generate lesson notes, rubrics, or study guides in the main prompt.\n2. Edit, customize, and tag the material in the Document Viewer.\n3. Track and review historical document versions for revision audits.\n4. Toggle Student Mode to inspect how adaptive pathways scaffold concepts for diverse learner categories.", 9.5, 'normal', [71, 85, 105]);

      addParagraph("• Student Playbook:", 10, 'bold', [95, 111, 82]);
      addParagraph("1. Open assigned lessons or study guides directly from 'My Library'.\n2. Engage with the Socratic AI sidebar to ask context-aware questions.\n3. Navigate the Learning Path, rate topic confidence levels, and complete modular activities to stay motivated.\n4. Apply customized dyslexia font toggles and line height relaxations in user settings to maximize comfort.", 9.5, 'normal', [71, 85, 105]);

      addParagraph("• Parent Playbook:", 10, 'bold', [95, 111, 82]);
      addParagraph("1. Monitor active learning pathways and current streaks to celebrate milestones.\n2. Access educator-distributed study guides or visual rubrics.\n3. Adjust the active Learner Profile (such as ADHD, ESL, or Visual Contrast configurations) to match your child's learning style at home.", 9.5, 'normal', [71, 85, 105]);

      addSectionHeader("4. Comprehensive Disability & Accessibility Guide");
      addParagraph("Constructed using the Universal Design for Learning (UDL) guidelines, the platform removes visual, cognitive, physical, and sensory barriers for all learners:");

      addParagraph("• 1. Cognitive & Learning Disabilities (Dyslexia, ADHD, Dyscalculia):", 10, 'bold', [95, 111, 82]);
      addParagraph("• Dyslexia Accommodation: Employs a dyslexic-friendly Comic Neue typography with heavy stems and asymmetric weights, coupled with relaxed character and paragraph spacing to prevent letter mirroring and crowding.\n• ADHD Focus Scaffolding: Implements structured bullet points, micro-milestone lists, clear checkboxes, active visual indicators, and a gamified daily activity streak tracker to prevent attention fatigue.", 9.5, 'normal', [71, 85, 105]);

      addParagraph("• 2. Language & Auditory Barriers (ESL & Auditory Impairments):", 10, 'bold', [95, 111, 82]);
      addParagraph("• ESL Scaffolding: Features automatic language translation into French, Spanish, Swahili, and more, as well as simplified vocabulary configurations that filter complex structures.\n• Auditory Accommodation: Provides visual confirmation indicators, detailed checklists, and graphical tree-node maps representing learning paths to replace traditional audio triggers.", 9.5, 'normal', [71, 85, 105]);

      addParagraph("• 3. Physical, Visual, & Motor Disabilities (Blindness, Low Vision, Dexterity):", 10, 'bold', [95, 111, 82]);
      addParagraph("• Blindness & Screen Readers: Integrates dedicated, invisible screen-reader metadata prompts (accessible via settings) that provide descriptive text extractions and structured tags tailored for screen-reading engines.\n• Low-Vision Display: Supports X-Large text scaling, deep high-contrast black-and-white visual stylesheets, and colored material type cards for rapid shape recognition.\n• Physical/Motor (Keyboard Navigation): Designed with fully keyboard-accessible action targets, prominent visual focus rings, and touch elements oversized to 44px minimum to ensure reliable operation for users with limited motor dexterity.", 9.5, 'normal', [71, 85, 105]);

      // Footer on the last page
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(95, 111, 82);
      doc.text("END OF OFFICIAL AUDIT REPORT & USER PLAYBOOK — PEDAGOGICAL WORKSPACE", 20, y + 10);

      // Save the PDF
      doc.save('Pedagogical_Workspace_User_and_Accessibility_Guide.pdf');
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-4xl bg-white border border-[#e5e1da] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] transition-all duration-300"
          >
            {/* Header Banner */}
            <div className="relative p-6 bg-gradient-to-br from-[#5f6f52] to-[#46553b] text-white overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-28 h-28 bg-white/5 rounded-full blur-xl" />
              
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold tracking-tight">Pedagogical Workspace & Guide</h3>
                  <p className="text-[11px] text-white/80 font-semibold">
                    {isAuditAllowed 
                      ? "User Navigation Playbook & Universal Design for Learning (UDL) Audit" 
                      : "User Navigation Playbook & Universal Design for Learning (UDL) Guide"}
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Selector */}
            <div className="flex flex-wrap border-b border-slate-100 bg-slate-50/60 p-2 gap-1 px-4 shrink-0">
              {isAuditAllowed && (
                <button
                  type="button"
                  onClick={() => setActiveTab('audit')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase transition cursor-pointer select-none ${
                    activeTab === 'audit' 
                      ? 'bg-[#5f6f52] text-white shadow-sm' 
                      : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Platform Specs & Audit</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('navigation')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase transition cursor-pointer select-none ${
                  activeTab === 'navigation' 
                    ? 'bg-[#5f6f52] text-white shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>User Navigation Guide</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('accessibility')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase transition cursor-pointer select-none ${
                  activeTab === 'accessibility' 
                    ? 'bg-[#5f6f52] text-white shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
                }`}
              >
                <Accessibility className="w-3.5 h-3.5" />
                <span>Disabilities & Accessibility</span>
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0">
              
              {/* TAB 1: Specs & Audit */}
              {isAuditAllowed && activeTab === 'audit' && (
                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 min-h-0">
                  {/* Left Column: Creator and Basic Info */}
                  <div className="flex-1 p-6 space-y-6">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#5f6f52]" /> Developer Profile
                      </h4>
                      
                      <div className="p-4 bg-[#fcfbf9] border border-[#e5e1da] rounded-xl space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h5 className="text-base font-black text-slate-800 leading-tight">Godfrey Ojiambo Odhiambo</h5>
                            <p className="text-[11px] font-bold text-[#5f6f52] uppercase tracking-wider mt-0.5">Learning Designer</p>
                          </div>
                          <span className="px-2.5 py-1 bg-[#5f6f52]/10 text-[#5f6f52] border border-[#5f6f52]/20 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0">
                            Lead Creator
                          </span>
                        </div>

                        <div className="h-[1px] bg-slate-200/60" />

                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-3 text-slate-600">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                              <Mail className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Support & Contact</p>
                              <a 
                                href="mailto:support@joinedunexus.app" 
                                className="font-bold text-[#5f6f52] hover:underline truncate block"
                              >
                                support@joinedunexus.app
                              </a>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-slate-600">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                              <Shield className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Your Account Role</p>
                              <p className="font-bold text-slate-700">{profile?.role || 'Educator'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-[#5f6f52]" /> Platform Specifications
                      </h4>
                      <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed bg-[#fcfbf9]/50 border border-[#e5e1da]/40 p-4 rounded-xl">
                        <p>
                          The <strong>Pedagogical Workspace</strong> is an elite workspace designed to streamline instructional architectures. Operating on dual-engine server-side proxies, it coordinates AI curriculum synthesis with client-side offline persistence.
                        </p>
                        <p>
                          This modal serves as the official administrative audit repository, tracking system compliance, accessibility milestones, and user training standards.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Platform Audit & Downloader */}
                  <div className="flex-1 p-6 bg-slate-50/50 space-y-5 flex flex-col">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#5f6f52]" />
                        <h4 className="text-sm font-bold text-slate-800">System Integration Status</h4>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-full text-[9px] font-black uppercase tracking-wider">
                        Active & Verified
                      </span>
                    </div>

                    <div className="space-y-3.5 text-[11px] text-slate-600 flex-1">
                      <div className="p-3.5 bg-white border border-slate-200/60 rounded-xl space-y-2">
                        <h5 className="font-extrabold text-[#5f6f52] flex items-center gap-1.5 uppercase tracking-wide">
                          <Star className="w-3.5 h-3.5 text-amber-500" /> Key Technical Resiliences
                        </h5>
                        <ul className="list-disc pl-4 space-y-1.5 text-slate-500">
                          <li><strong>Dual-Engine Model Fallback:</strong> Automatically reroutes material synthesis to a secondary AI cluster during high latency, guaranteeing constant classroom uptime.</li>
                          <li><strong>Continuous Offline Persistence:</strong> Synchronizes localized changes with server-side Firestore automatically, preventing data loss.</li>
                          <li><strong>Fuzzy-Matching Indexing:</strong> Features a high-speed predictive search engine allowing lookups across strands, grades, and tags with complete typo tolerance.</li>
                        </ul>
                      </div>

                      <div className="p-3.5 bg-white border border-slate-200/60 rounded-xl space-y-1.5">
                        <h5 className="font-extrabold text-[#5f6f52] flex items-center gap-1.5 uppercase tracking-wide">
                          <FileText className="w-3.5 h-3.5 text-indigo-500" /> Export Options
                        </h5>
                        <p className="text-slate-500 text-[10px]">
                          Download the official, multi-page administrative report containing a comprehensive system audit, stakeholder navigation playbooks, and disability accommodations guides.
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200/80 mt-auto">
                      <button
                        type="button"
                        onClick={exportToPDF}
                        disabled={isDownloading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-[#5f6f52] to-[#4c5b41] hover:from-[#4c5b41] hover:to-[#3b4732] text-white rounded-xl text-xs font-black tracking-wide shadow-md hover:shadow-lg active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none"
                      >
                        {isDownloading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                            <span>Compiling Guide Chapters...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Export Full Guide & Audit Report (PDF)</span>
                          </>
                        )}
                      </button>
                      <p className="text-center text-[9px] text-slate-400 mt-2 flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>PDF includes navigation guides, accessibility profiles, and system audit details</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Navigation & Section-by-Section Guide */}
              {activeTab === 'navigation' && (
                <div className="p-6 space-y-6">
                  <div className="text-slate-600 text-xs bg-slate-50 p-4 border border-slate-200/40 rounded-xl">
                    <h4 className="font-extrabold text-[#5f6f52] flex items-center gap-1.5 text-sm uppercase tracking-wider mb-2">
                      <Compass className="w-4 h-4" /> Comprehensive Navigation Handbook
                    </h4>
                    <p className="leading-relaxed">
                      This playbook guides teachers, students, and parents on how to navigate the main sections of the app and make full use of its advanced tools. Toggle each stakeholder card below to learn role-specific paths.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Educator Playbook */}
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3.5">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <div className="w-7 h-7 rounded-lg bg-[#5f6f52]/10 flex items-center justify-center text-[#5f6f52] shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide">For Teachers & Admins</h5>
                          <p className="text-[9px] text-slate-400 font-bold">Curriculum Design & Audits</p>
                        </div>
                      </div>

                      <div className="space-y-3 text-[11px] text-slate-600">
                        <p className="font-semibold text-slate-700">Primary Core Workflow:</p>
                        <ol className="list-decimal pl-4 space-y-2">
                          <li><strong>Material Synthesis:</strong> Input prompts on the dashboard to generate lesson structures, assessment plans, or classroom study guides.</li>
                          <li><strong>Document Refining:</strong> Open any draft in the viewer. Use editing panels, select curriculum tags, set grading parameters, and save versions.</li>
                          <li><strong>Fuzzy Library Lookup:</strong> Use the typo-tolerant search bar on the dashboard. Type strand codes or subjects to find aligned files.</li>
                          <li><strong>Version Auditing:</strong> View version cards in the right pane to compare edits or roll back to historical drafts.</li>
                        </ol>
                      </div>
                    </div>

                    {/* Student Playbook */}
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3.5">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide">For Students</h5>
                          <p className="text-[9px] text-indigo-400 font-bold">Adaptive Interactive Learning</p>
                        </div>
                      </div>

                      <div className="space-y-3 text-[11px] text-slate-600">
                        <p className="font-semibold text-indigo-900">Primary Core Workflow:</p>
                        <ol className="list-decimal pl-4 space-y-2">
                          <li><strong>My Library Access:</strong> Search or browse items shared by the teacher. Filter by subjects to locate your active syllabus.</li>
                          <li><strong>Interactive Reader:</strong> Open a lesson. Select high-contrast themes or dyslexic layouts to customize reading styles.</li>
                          <li><strong>Socratic Chat Tutoring:</strong> Tap the AI Assistant sidebar. Submit conceptual questions to receive scaffolding, hints, and active dialog.</li>
                          <li><strong>Learning Paths:</strong> Navigate the Adaptive Learning Path. Rate your confidence on topics to let the system adjust difficulties.</li>
                        </ol>
                      </div>
                    </div>

                    {/* Parent Playbook */}
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3.5">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide">For Parents</h5>
                          <p className="text-[9px] text-amber-500 font-bold">Progress Tracking & At-Home Scaffolds</p>
                        </div>
                      </div>

                      <div className="space-y-3 text-[11px] text-slate-600">
                        <p className="font-semibold text-amber-900">Primary Core Workflow:</p>
                        <ol className="list-decimal pl-4 space-y-2">
                          <li><strong>Streaks & Achievements:</strong> Check the student progress bar and streak counts on the Dashboard to maintain positive momentum.</li>
                          <li><strong>Study Guide Reviews:</strong> Retrieve condensed student-friendly Study Guides, directly generated by teachers for home review.</li>
                          <li><strong>Accommodation Setup:</strong> Navigate to Settings, edit child profile rules, and choose an ADHD or low-vision profile to apply global visuals.</li>
                          <li><strong>Resource Downloads:</strong> Export materials to PDF in print-friendly lined formats for offline handwriting work.</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Section-by-Section Functionality List */}
                  <div className="space-y-3 border-t border-slate-100 pt-5">
                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#5f6f52]" /> Full Section Functionality Guide
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
                      <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1">
                        <span className="font-extrabold text-slate-800">1. Dashboard Prompt & Library:</span>
                        <p className="text-slate-500 text-[11px]">The launcher tab. Type standard prompts or use templates. It lists files inside "My Library" with robust tag clouds and category summaries.</p>
                      </div>
                      <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1">
                        <span className="font-extrabold text-slate-800">2. Predictive Search Bar:</span>
                        <p className="text-slate-500 text-[11px]">Located inside "My Library". Powered by Levenshtein fuzzy matching, it matches queries with subjects, grades, and specific curriculum strands dynamically.</p>
                      </div>
                      <div className="p-3 bg-[#5f6f52]/5 border border-[#5f6f52]/10 rounded-xl space-y-1">
                        <span className="font-extrabold text-[#5f6f52]">3. Adaptive Learning Path Panel:</span>
                        <p className="text-slate-500 text-[11px]">A tree view with progress percentages and milestone paths. Tracks active learning paths, self-evaluation matrices, and custom study timelines.</p>
                      </div>
                      <div className="p-3 bg-indigo-50/30 border border-indigo-100/50 rounded-xl space-y-1">
                        <span className="font-extrabold text-indigo-900">4. Document Workspace (Editor):</span>
                        <p className="text-slate-500 text-[11px]">Double pane split screen. Edit contents, analyze reading scores (SMOG index), inspect version lists, and translate content across 5+ languages.</p>
                      </div>
                      <div className="p-3 bg-amber-50/30 border border-amber-100/50 rounded-xl space-y-1">
                        <span className="font-extrabold text-amber-900">5. Global Curriculum Resources:</span>
                        <p className="text-slate-500 text-[11px]">Integrates external curricula, providing sample rubrics, active learning materials, and diagnostic tasks ready to import instantly.</p>
                      </div>
                      <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1">
                        <span className="font-extrabold text-slate-800">6. Settings & Profile Controls:</span>
                        <p className="text-slate-500 text-[11px]">Toggle screen reader hints, customize font heights, and manage specific profiles (dyslexia, ESL, visual contrast) applied instantly app-wide.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Disabilities & Accessibility (UDL Framework) */}
              {activeTab === 'accessibility' && (
                <div className="p-6 space-y-6">
                  <div className="text-slate-600 text-xs bg-slate-50 p-4 border border-slate-200/40 rounded-xl">
                    <h4 className="font-extrabold text-[#5f6f52] flex items-center gap-1.5 text-sm uppercase tracking-wider mb-2">
                      <Accessibility className="w-4 h-4" /> Universal Design for Learning (UDL) & Accommodations
                    </h4>
                    <p className="leading-relaxed">
                      Our platform removes visual, cognitive, physical, and sensory barriers for all learners. It adheres directly to UDL principles to cater to diverse and inclusive classrooms.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Learning & Cognitive Disabilities */}
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                      <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
                        <BookMarked className="w-4 h-4 text-[#5f6f52]" />
                        <span>Cognitive & Learning Disabilities (Dyslexia, ADHD, Cognitive Scaffolds)</span>
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
                        <div className="space-y-1.5 border-l-2 border-amber-500 pl-3">
                          <span className="font-extrabold text-slate-800">Dyslexia Support:</span>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Includes a dedicated <strong>Dyslexia Font Mode</strong> utilizing Comic Neue with heavy asymmetrical weights, asymmetric stems, and wide spacing. It breaks up walls of text and aligns material into high-legibility layout structures to prevent character rotation and crowding.
                          </p>
                        </div>
                        <div className="space-y-1.5 border-l-2 border-indigo-500 pl-3">
                          <span className="font-extrabold text-indigo-950">ADHD & Focus Scaffolds:</span>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Incorporates interactive checkboxes, clear summaries, daily milestones, and gamified streak counters. This chunked content model prevents cognitive fatigue and sustains student motivation.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Language & Auditory Scaffolds */}
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                      <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
                        <Volume2 className="w-4 h-4 text-[#5f6f52]" />
                        <span>Language & Auditory Impairments (ESL / Subtitles / Visual Clues)</span>
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
                        <div className="space-y-1.5 border-l-2 border-emerald-500 pl-3">
                          <span className="font-extrabold text-emerald-950">ESL & Translation:</span>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Supports instant overlays in French, Swahili, Spanish, and standard English. Features a simplified vocabulary profile that swaps complex jargon for simplified alternative phrasing.
                          </p>
                        </div>
                        <div className="space-y-1.5 border-l-2 border-blue-500 pl-3">
                          <span className="font-extrabold text-blue-950">Auditory Accommodations:</span>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Replaces complex audio feedback with high-visibility icon badges, checklist validations, and graphical tree-node maps. Guides students through steps without relying on acoustic cues.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Visual & Physical/Motor Disabilities */}
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                      <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
                        <Layers className="w-4 h-4 text-[#5f6f52]" />
                        <span>Visual & Physical Disabilities (Blindness, Low Vision, Limited Dexterity)</span>
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
                        <div className="space-y-1.5 border-l-2 border-rose-500 pl-3">
                          <span className="font-extrabold text-rose-950">Blindness & Low-Vision:</span>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Equipped with <strong>Screen Reader Helpers</strong> that supply descriptive tags for graphics and structural code frameworks. Offers X-Large font options (up to 24px) and deep dark high-contrast mode panels to reduce eye strain.
                          </p>
                        </div>
                        <div className="space-y-1.5 border-l-2 border-slate-700 pl-3">
                          <span className="font-extrabold text-slate-850">Motor & Physical Dexterity:</span>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            The keyboard-accessible layout is fully navigable via standard Tab/Enter flows, backed by bright active focus rings. Touch target sizes are strictly set to 44px minimum for reliable mobile use.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Credits */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium shrink-0">
              <div className="flex items-center gap-1">
                <span>© 2026 Pedagogical Workspace</span>
              </div>
              <div className="flex items-center gap-1 font-bold text-[#5f6f52]">
                <span>Crafted with</span>
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500 animate-pulse" />
                <span>for Inclusive Classrooms</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
