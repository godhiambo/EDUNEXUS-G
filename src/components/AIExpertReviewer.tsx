import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Printer, 
  X as XIcon, 
  Cpu, 
  ListChecks, 
  ThumbsUp, 
  ChevronRight, 
  Target, 
  Compass, 
  GraduationCap, 
  RefreshCw,
  Clock,
  ArrowRight,
  Columns,
  History,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { SavedDocument, DocumentAIReview, DocumentVersion } from '../types';
import { handleResponseJson } from '../utils/api';
import { db, cleanUndefined, compressObject } from '../firebase';
import { doc, setDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface AIExpertReviewerProps {
  document: SavedDocument;
  onClose: () => void;
  onUpdate: (updatedDoc: SavedDocument) => void;
  docVersions?: DocumentVersion[];
  onCompareVersions?: (leftVersionId: string, rightVersionId: string) => void;
}

const CYCLING_AUDIT_MESSAGES = [
  "Reading document text and structures...",
  "Analyzing clarity and measurability of learning objectives...",
  "Auditing alignment with specified curriculum frameworks...",
  "Verifying appropriateness of formative & summative assessments...",
  "Identifying areas of strengths and student scaffolding gaps...",
  "Formulating professional, actionable pedagogical recommendations...",
  "Polishing compliance report metrics..."
];

export default function AIExpertReviewer({
  document: docItem,
  onClose,
  onUpdate,
  docVersions = [],
  onCompareVersions
}: AIExpertReviewerProps) {
  const { profile } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [sloganIdx, setSloganIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  
  const [selectedLeftVer, setSelectedLeftVer] = useState<string>('');
  const [selectedRightVer, setSelectedRightVer] = useState<string>('current');

  // Auto-select oldest version as base comparison
  useEffect(() => {
    if (docVersions && docVersions.length > 0) {
      const oldest = docVersions[docVersions.length - 1];
      setSelectedLeftVer(oldest.id);
    }
  }, [docVersions]);

  // Cycle through messages while auditing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAuditing) {
      interval = setInterval(() => {
        setSloganIdx((prev) => (prev + 1) % CYCLING_AUDIT_MESSAGES.length);
      }, 3000);
    } else {
      setSloganIdx(0);
    }
    return () => clearInterval(interval);
  }, [isAuditing]);

  // Load unchecked/checked action plan state from localStorage to let teachers interact with the plan dynamically
  useEffect(() => {
    if (docItem.aiReview) {
      const stored = localStorage.getItem(`review-steps-${docItem.id}`);
      if (stored) {
        try {
          setCompletedSteps(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      } else {
        setCompletedSteps({});
      }
    }
  }, [docItem.id, docItem.aiReview]);

  const toggleStep = (stepText: string) => {
    const updated = { ...completedSteps, [stepText]: !completedSteps[stepText] };
    setCompletedSteps(updated);
    localStorage.setItem(`review-steps-${docItem.id}`, JSON.stringify(updated));
  };

  const savePreAuditVersion = async () => {
    if (!docItem.id) return;
    try {
      const versionsCol = collection(db, 'documents', docItem.id, 'versions');
      const q = query(versionsCol, orderBy('versionNumber', 'desc'));
      const snapshot = await getDocs(q);
      
      let maxVer = 0;
      let alreadyExists = false;
      
      snapshot.forEach((snap) => {
        const d = snap.data();
        if (d.versionNumber && d.versionNumber > maxVer) {
          maxVer = d.versionNumber;
        }
        if (d.content === docItem.content && d.title === docItem.title) {
          alreadyExists = true;
        }
      });
      
      if (alreadyExists) {
        console.log("Pre-audit version checkpoint already exists.");
        return;
      }
      
      const nextVer = maxVer + 1;
      const vId = `v-${nextVer}-${Date.now()}`;
      
      const newVersion = {
        id: vId,
        docId: docItem.id,
        title: docItem.title,
        content: docItem.content,
        lastModified: new Date().toISOString(),
        modifiedByUid: profile?.uid || 'system',
        modifiedByName: profile?.displayName || profile?.email || 'Anonymous Teacher',
        modifiedByEmail: profile?.email || '',
        versionNumber: nextVer,
        label: `Pre-Audit Original`
      };
      
      await setDoc(doc(db, 'documents', docItem.id, 'versions', vId), cleanUndefined(compressObject(newVersion)));
      console.log(`Pre-audit version checkpoint saved: Version ${nextVer}`);
    } catch (err) {
      console.error('Error saving pre-audit version:', err);
    }
  };

  const runPedagogicalAudit = async () => {
    setIsAuditing(true);
    setErrorMsg(null);
    try {
      // Auto-save a version checkpoint before requesting feedback so user has the pre-audit original
      await savePreAuditVersion();

      const response = await fetch('/api/review-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          docTitle: docItem.title,
          docType: docItem.docType,
          curriculum: docItem.curriculum,
          subject: docItem.subject,
          classLevel: docItem.classLevel,
          topic: docItem.topic,
          content: docItem.content,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const reviewData: DocumentAIReview = await response.json();
      reviewData.reviewedAt = new Date().toISOString();

      // Update the parent document with the generated AI review structure
      onUpdate({
        ...docItem,
        aiReview: reviewData,
        lastModified: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Audit execution failed:', err);
      setErrorMsg(err.message || 'An unexpected error occurred during the pedagogical audit. Please verify your connection.');
    } finally {
      setIsAuditing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-600', ring: 'stroke-emerald-500' };
    if (score >= 60) return { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-600', ring: 'stroke-amber-500' };
    return { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-600', ring: 'stroke-rose-500' };
  };

  const handlePrint = () => {
    window.print();
  };

  const review = docItem.aiReview;

  return (
    <div className={`fixed inset-0 z-50 bg-[#1a1c18]/40 backdrop-blur-md flex items-center justify-end font-sans select-none overflow-hidden no-print animate-fadeIn ${isFullscreen ? 'p-0' : 'p-0 md:p-4'}`}>
      <motion.div 
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className={`bg-[#fcfbf9] text-slate-800 flex flex-col border border-[#e5e1da]/60 overflow-hidden ${
          isFullscreen 
            ? 'w-full h-full rounded-none' 
            : 'w-full md:max-w-4xl h-full md:h-[calc(100vh-2rem)] md:rounded-3xl shadow-2xl'
        }`}
      >
        {/* Header Bar */}
        <div className="px-6 py-4.5 bg-[#5f6f52] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#fefae0]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold tracking-wide">AI Pedagogical Review</h2>
              <p className="text-[10px] text-[#fefae0]/80 uppercase tracking-widest font-extrabold">Quality Assurance & Objectives Auditor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {review && (
              <button
                onClick={handlePrint}
                className="p-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl transition text-white cursor-pointer"
                title="Print Audit Report"
              >
                <Printer className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl transition text-white cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Maximize to Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition text-white cursor-pointer"
              title="Close Panel"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-4.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-900">Audit Error</h4>
                <p className="text-sm font-medium">{errorMsg}</p>
                <button
                  onClick={runPedagogicalAudit}
                  className="mt-2 text-xs font-bold text-rose-700 hover:text-rose-900 underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Audit
                </button>
              </div>
            </div>
          )}

          {isAuditing ? (
            <div className="h-full flex flex-col items-center justify-center py-20 space-y-6 text-center">
              <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Pulsing ring outer */}
                <div className="absolute inset-0 rounded-full border-4 border-[#5f6f52]/20 animate-ping opacity-75"></div>
                {/* Rotating gear/spinner inside */}
                <div className="w-16 h-16 rounded-full border-4 border-[#5f6f52] border-t-transparent animate-spin flex items-center justify-center"></div>
                <Sparkles className="absolute w-6 h-6 text-[#a9b388] animate-pulse" />
              </div>

              <div className="space-y-2 max-w-sm">
                <h3 className="text-lg font-serif font-bold text-slate-800">Pedagogical Evaluation in Progress</h3>
                <p className="text-xs font-semibold text-[#5f6f52] animate-pulse">
                  {CYCLING_AUDIT_MESSAGES[sloganIdx]}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">This deep compliance scan checks 15+ educational metrics regarding syllabus alignment, student assessments, and SMART goals.</p>
              </div>
            </div>
          ) : !review ? (
            /* Blank Slate */
            <div className="h-full flex flex-col items-center justify-center py-12 max-w-lg mx-auto text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-[#5f6f52]/5 border border-[#5f6f52]/10 flex items-center justify-center text-[#5f6f52]">
                <Cpu className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-serif font-bold text-slate-800">No AI Review Found</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Submit this generated lesson plan, worksheet, or assessment item to our Pedagogical Review engine. An expert agent will analyze your document content, objectives, curriculum standards, and assessment appropriateness, and return detailed, actionable feedback.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left pt-2">
                <div className="p-3.5 bg-white border border-[#e5e1da] rounded-xl space-y-1 shadow-xs">
                  <div className="text-base">🎯</div>
                  <h4 className="text-xs font-black uppercase text-slate-700">SMART Objectives</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Verifies if learning outcomes are measurable, pupil-centered, and clear.</p>
                </div>
                <div className="p-3.5 bg-white border border-[#e5e1da] rounded-xl space-y-1 shadow-xs">
                  <div className="text-base">📚</div>
                  <h4 className="text-xs font-black uppercase text-slate-700">Curriculum Fit</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Maps content relevance against target curriculum directives.</p>
                </div>
                <div className="p-3.5 bg-white border border-[#e5e1da] rounded-xl space-y-1 shadow-xs">
                  <div className="text-base">✏️</div>
                  <h4 className="text-xs font-black uppercase text-slate-700">Assessments</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Reviews if assessment methods effectively gauge student competency levels.</p>
                </div>
              </div>

              <button
                onClick={runPedagogicalAudit}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#5f6f52] hover:bg-[#4d5a42] text-white rounded-2xl font-bold transition flex items-center justify-center gap-2.5 shadow-lg cursor-pointer"
              >
                <Sparkles className="w-4.5 h-4.5" />
                <span>Submit for AI Pedagogical Audit</span>
              </button>
            </div>
          ) : (
            /* Active Report View */
            <div className="space-y-6">
              {/* Overall Slogan Card */}
              <div className="bg-white border border-[#e5e1da] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-center gap-6">
                {/* Gauge Meter */}
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-slate-100 fill-none"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className={`fill-none transition-all duration-1000 ease-linear ${getScoreColor(review.overallScore).ring}`}
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - review.overallScore / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center flex flex-col justify-center items-center">
                    <span className="text-2xl font-serif font-black text-slate-800 leading-none">{review.overallScore}</span>
                    <span className="text-[8px] uppercase font-extrabold text-slate-400 mt-0.5 tracking-wider">Score</span>
                  </div>
                </div>

                {/* Summary Info */}
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Executive QA Report</span>
                      <h3 className="text-lg font-serif font-bold text-slate-800">{docItem.title}</h3>
                    </div>
                    <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border shrink-0 mx-auto md:mx-0 ${getScoreColor(review.overallScore).bg}`}>
                      {review.overallScore >= 85 ? 'Pedagogically Outstanding' : review.overallScore >= 60 ? 'Ready with Improvements' : 'Requires Critical Revision'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {review.summary}
                  </p>
                  <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 justify-center md:justify-start">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Audited on {new Date(review.reviewedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Notable Strengths */}
              <div className="bg-emerald-50/20 border border-emerald-100 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                  <ThumbsUp className="w-4 h-4 text-emerald-600" /> Key Material Strengths
                </h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {review.strengths.map((str, i) => (
                    <li key={i} className="text-xs font-semibold text-slate-700 flex items-start gap-2 bg-white/65 p-3 rounded-xl border border-emerald-100/50">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sub-Section Scores / Detailed Areas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Clarity of Objectives */}
                <div className="bg-white border border-[#e5e1da]/60 rounded-2xl p-4.5 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-[#5f6f52]" /> Objectives
                      </h4>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-lg border ${getScoreColor(review.objectivesReview.score).bg}`}>
                        {review.objectivesReview.score}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {review.objectivesReview.feedback}
                    </p>
                  </div>
                  {review.objectivesReview.suggestions.length > 0 && (
                    <div className="pt-3.5 border-t border-slate-100 space-y-2">
                      <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Tactical Recommendations</p>
                      <ul className="space-y-1.5">
                        {review.objectivesReview.suggestions.map((sug, idx) => (
                          <li key={idx} className="text-[11px] text-slate-600 leading-relaxed font-semibold flex items-start gap-1.5">
                            <ChevronRight className="w-3.5 h-3.5 text-[#a9b388] shrink-0 mt-0.5" />
                            <span>{sug}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 2. Standards Alignment */}
                <div className="bg-white border border-[#e5e1da]/60 rounded-2xl p-4.5 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-indigo-600" /> Syllabus Fit
                      </h4>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-lg border ${getScoreColor(review.curriculumReview.score).bg}`}>
                        {review.curriculumReview.score}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {review.curriculumReview.feedback}
                    </p>
                  </div>
                  {review.curriculumReview.suggestions.length > 0 && (
                    <div className="pt-3.5 border-t border-slate-100 space-y-2">
                      <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Syllabus Optimizations</p>
                      <ul className="space-y-1.5">
                        {review.curriculumReview.suggestions.map((sug, idx) => (
                          <li key={idx} className="text-[11px] text-slate-600 leading-relaxed font-semibold flex items-start gap-1.5">
                            <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                            <span>{sug}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 3. Assessment Methods */}
                <div className="bg-white border border-[#e5e1da]/60 rounded-2xl p-4.5 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-amber-600" /> Assessment
                      </h4>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-lg border ${getScoreColor(review.assessmentReview.score).bg}`}>
                        {review.assessmentReview.score}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {review.assessmentReview.feedback}
                    </p>
                  </div>
                  {review.assessmentReview.suggestions.length > 0 && (
                    <div className="pt-3.5 border-t border-slate-100 space-y-2">
                      <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Evaluation Upgrades</p>
                      <ul className="space-y-1.5">
                        {review.assessmentReview.suggestions.map((sug, idx) => (
                          <li key={idx} className="text-[11px] text-slate-600 leading-relaxed font-semibold flex items-start gap-1.5">
                            <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>{sug}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Plan Checklist */}
              <div className="bg-white border border-[#e5e1da] rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-[#5f6f52] tracking-wider flex items-center gap-1.5">
                    <ListChecks className="w-4 h-4 text-[#5f6f52]" /> Actionable Lesson Revision Plan
                  </h4>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase">
                    {Object.values(completedSteps).filter(Boolean).length} / {review.actionPlan.length} Tasks Met
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Go through this customized pedagogical improvement list to optimize your lesson plan or worksheets. You can mark steps off as you implement them.
                </p>

                <div className="space-y-2.5">
                  {review.actionPlan.map((step, idx) => {
                    const isCompleted = !!completedSteps[step];
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleStep(step)}
                        className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer select-none ${
                          isCompleted
                            ? 'bg-slate-50/80 border-slate-200 text-slate-400 line-through decoration-slate-300'
                            : 'bg-[#fdfbf7] border-[#e5e1da]/60 hover:bg-[#f5f2ea] text-slate-700'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 bg-white'
                        }`}>
                          {isCompleted && <span className="text-xs font-black">✓</span>}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className={`text-xs font-semibold leading-relaxed ${isCompleted ? 'text-slate-400' : 'text-slate-700'}`}>
                            {step}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Version Comparison Section */}
              {docVersions && docVersions.length > 0 && onCompareVersions && (
                <div className="bg-[#f5f7f2] border border-[#e2e8dd] rounded-2xl p-5 space-y-4 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Columns className="w-4 h-4 text-[#5f6f52]" />
                    <h4 className="text-xs font-bold uppercase text-[#5f6f52] tracking-wider">
                      Side-by-Side Revision Comparison
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Compare what's been changed in the document after receiving AI pedagogical feedback and revising the material.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="compare-left-select" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Base Version (Pre-Revision)
                      </label>
                      <select
                        id="compare-left-select"
                        value={selectedLeftVer}
                        onChange={(e) => setSelectedLeftVer(e.target.value)}
                        className="w-full bg-white border border-[#e5e1da] rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#5f6f52]"
                      >
                        {docVersions.map((v) => (
                          <option key={`left-${v.id}`} value={v.id}>
                            Version {v.versionNumber} &bull; {v.label || 'Checkpoint'} ({new Date(v.lastModified).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="compare-right-select" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Compare Target (Revised Document)
                      </label>
                      <select
                        id="compare-right-select"
                        value={selectedRightVer}
                        onChange={(e) => setSelectedRightVer(e.target.value)}
                        className="w-full bg-white border border-[#e5e1da] rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#5f6f52]"
                      >
                        <option value="current">Current Draft (Revised)</option>
                        {docVersions.map((v) => (
                          <option key={`right-${v.id}`} value={v.id}>
                            Version {v.versionNumber} ({new Date(v.lastModified).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        onCompareVersions(selectedLeftVer, selectedRightVer);
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 bg-[#5f6f52] hover:bg-[#4d5a42] text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer text-xs"
                    >
                      <Columns className="w-3.5 h-3.5" />
                      <span>Compare Selected Versions Side-by-Side</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Re-Audit Button Row */}
              <div className="pt-4 border-t border-slate-150 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-400 font-medium">Have you updated the document? Run a fresh audit to recalculate compliance indicators.</p>
                <button
                  onClick={runPedagogicalAudit}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition flex items-center justify-center gap-2 border border-slate-200 cursor-pointer text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Run Fresh Pedagogical Scan</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Styled print block style */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          /* Only display the report content in printed page */
          #print-preview-root, #print-preview-root * {
            visibility: visible;
          }
          #print-preview-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
