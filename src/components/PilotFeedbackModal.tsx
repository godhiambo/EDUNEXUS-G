import React, { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { logActivity } from '../lib/activityLogger';
import { 
  X, 
  Sparkles, 
  Star, 
  Send, 
  Check, 
  HelpCircle,
  ClipboardList,
  AlertCircle
} from 'lucide-react';

interface PilotFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PilotFeedbackModal({ isOpen, onClose, onSuccess }: PilotFeedbackModalProps) {
  const { user, profile } = useAuth();
  
  // Rating States
  const [easeOfUse, setEaseOfUse] = useState<number>(0);
  const [qualityOfAI, setQualityOfAI] = useState<number>(0);
  const [standardsRelevance, setStandardsRelevance] = useState<number>(0);
  const [recommendationLikelihood, setRecommendationLikelihood] = useState<number>(0);
  
  // Qualitative Text States
  const [whatWorkedWell, setWhatWorkedWell] = useState('');
  const [areasOfImprovement, setAreasOfImprovement] = useState('');
  const [futureFeaturesRequested, setFutureFeaturesRequested] = useState('');
  const [freeTextFeedback, setFreeTextFeedback] = useState('');
  
  // Form Status States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen || !user || !profile) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setError(null);

    // Validate quantitative ratings
    if (easeOfUse === 0 || qualityOfAI === 0 || standardsRelevance === 0 || recommendationLikelihood === 0) {
      setValidationError("Please provide a rating for all 4 multiple-choice assessment metrics.");
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackId = `pilot_${user.uid}_${Date.now()}`;
      const feedbackRef = doc(db, 'pilotFeedbacks', feedbackId);
      
      const payload = {
        id: feedbackId,
        userUid: user.uid,
        userName: profile.displayName || 'Teacher Participant',
        userEmail: user.email || '',
        userRole: profile.role || 'Teacher',
        createdAt: new Date().toISOString(),
        easeOfUse: Number(easeOfUse),
        qualityOfAI: Number(qualityOfAI),
        standardsRelevance: Number(standardsRelevance),
        recommendationLikelihood: Number(recommendationLikelihood),
        whatWorkedWell: whatWorkedWell.trim(),
        areasOfImprovement: areasOfImprovement.trim(),
        futureFeaturesRequested: futureFeaturesRequested.trim(),
        freeTextFeedback: freeTextFeedback.trim()
      };

      // 1. Save response to pilotFeedbacks collection
      await setDoc(feedbackRef, payload);

      // 2. Log activity
      logActivity('feedback', `Submitted pilot program feedback (Score: ${Math.round((easeOfUse + qualityOfAI + standardsRelevance + recommendationLikelihood) / 4)}/5)`, profile);

      // 3. Mark in User Profile document so it never reappears
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { hasSubmittedPilotFeedback: true }, { merge: true });

      // 4. Save to local storage as fallback safety
      localStorage.setItem(`pilot_feedback_submitted_${user.uid}`, 'true');

      setIsSubmittedSuccessfully(true);
      setTimeout(() => {
        onSuccess();
      }, 1800);
    } catch (err: any) {
      console.error("Error saving pilot feedback:", err);
      setError("Failed to save your feedback. Please try again. Connection error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRatingGroup = (
    value: number,
    onChange: (val: number) => void,
    label: string,
    description: string,
    lowLabel: string,
    highLabel: string
  ) => {
    return (
      <div className="bg-white border border-[#e5e1da] rounded-2xl p-6 shadow-xs relative overflow-hidden transition hover:shadow-sm">
        <div className="space-y-1 mb-4">
          <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            {label}
            <span className="text-rose-500 font-black text-xs">*</span>
          </label>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">{description}</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{lowLabel}</span>
          
          <div className="flex items-center gap-2.5">
            {[1, 2, 3, 4, 5].map((num) => {
              const isActive = value === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => onChange(num)}
                  className={`w-11 h-11 rounded-xl font-bold text-xs transition duration-150 flex items-center justify-center border shadow-3xs cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 border-indigo-700 text-white font-extrabold scale-105 ring-4 ring-indigo-100'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>

          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide text-right">{highLabel}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#f0ebf8] rounded-3xl max-w-2xl w-full border border-indigo-200 shadow-2xl overflow-hidden my-8 animate-fadeIn flex flex-col max-h-[90vh]">
        
        {/* Google Forms Iconic Top Header Accent */}
        <div className="h-2.5 bg-indigo-700 w-full shrink-0" />

        {/* Content Area */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
          
          {isSubmittedSuccessfully ? (
            <div className="bg-white border border-[#e5e1da] rounded-2xl p-10 text-center space-y-6 animate-scaleIn shadow-sm">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-8 h-8 font-black animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-serif font-bold text-slate-800">Pilot Feedback Submitted!</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                  Your pedagogical assessment form responses have been successfully recorded and sent to the administrator. 
                  Thank you for participating in the pilot!
                </p>
              </div>
              <div className="font-mono text-[10px] text-slate-400">
                Finalizing session closure...
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Form Header Card */}
              <div className="bg-white border-t-[8px] border-indigo-700 border-x border-b border-[#e5e1da] rounded-2xl p-6 md:p-8 shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-serif font-black text-slate-800">EduNexus App Pilot Evaluation</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Teacher & Administrator Pilot Survey</p>
                  </div>
                  <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-700">
                    <ClipboardList className="w-5.5 h-5.5" />
                  </div>
                </div>

                <div className="text-xs text-slate-600 leading-relaxed space-y-2.5 border-t border-slate-100 pt-4 font-medium">
                  <p>
                    Thank you for trialing **EduNexus** for your classroom preparation! This pilot evaluation form assesses ease of use, standards-alignment precision, and AI pedagogical output quality. 
                  </p>
                  <p className="text-slate-500 text-[11px] italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                    Once submitted, this pilot questionnaire is analyzed by the school administrator and will not reappear on your next login.
                  </p>
                </div>

                {/* Pre-filled User Profile block */}
                <div className="bg-indigo-50/40 border border-indigo-100/50 p-3.5 rounded-xl text-xs space-y-1 font-medium">
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Responding Profile</p>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-slate-700">
                    <span>Name: <strong className="font-bold text-slate-800">{profile.displayName}</strong></span>
                    <span>Email: <strong className="font-bold text-[#5f6f52]">{user.email}</strong></span>
                    <span>Role: <strong className="font-bold text-rose-700">{profile.role}</strong></span>
                  </div>
                </div>
              </div>

              {/* Validation / Submission Error Banners */}
              {validationError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl p-4 flex gap-3 text-xs font-bold animate-fadeIn">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-600" />
                  <span>{validationError}</span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-900 rounded-2xl p-4 flex gap-3 text-xs font-bold animate-fadeIn">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Assessment metric 1: Ease of Use */}
              {renderRatingGroup(
                easeOfUse,
                setEaseOfUse,
                "1. Ease of App Navigation & Content Access",
                "How easy is it to navigate the pedagogical library, create standards-aligned sheets, and work with collaborative tools?",
                "Extremely Hard",
                "Frictionless"
              )}

              {/* Assessment metric 2: Quality of AI output */}
              {renderRatingGroup(
                qualityOfAI,
                setQualityOfAI,
                "2. Quality and Completeness of AI-Generated Content",
                "Rate the depth, pedagogical soundness, and structure of the lesson plans, worksheets, and syllabus rubrics generated.",
                "Poor / Needs rewrite",
                "Ready for class"
              )}

              {/* Assessment metric 3: Standards Relevance */}
              {renderRatingGroup(
                standardsRelevance,
                setStandardsRelevance,
                "3. Relevance to Local Curriculum Standards",
                "How accurately does the system map, suggest, and align document topics to official school curriculum boards?",
                "Not Aligned",
                "Perfectly Aligned"
              )}

              {/* Assessment metric 4: Recommendation likelihood */}
              {renderRatingGroup(
                recommendationLikelihood,
                setRecommendationLikelihood,
                "4. Likelihood to Recommend to Faculty Colleagues",
                "How likely are you to recommend EduNexus to other teaching staff and educational administrators?",
                "Not Likelihood",
                "Highly Likely"
              )}

              {/* Qualitative feedback text fields */}
              <div className="bg-white border border-[#e5e1da] rounded-2xl p-6 shadow-xs space-y-4 transition hover:shadow-sm">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">5. Qualitative Evaluation (Optional feedback)</h4>
                  <p className="text-xs text-slate-400 font-medium">Please provide specific insights to improve the applet's capabilities.</p>
                </div>

                <div className="space-y-4">
                  {/* Q1 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">What worked well during your app pilot?</label>
                    <textarea
                      value={whatWorkedWell}
                      onChange={(e) => setWhatWorkedWell(e.target.value)}
                      placeholder="e.g. AI auto-tagging, collaborative live standard mapping..."
                      className="w-full bg-[#fdfbf7] border border-slate-250 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 min-h-[70px] resize-y"
                    />
                  </div>

                  {/* Q2 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">What areas of the application need improvement?</label>
                    <textarea
                      value={areasOfImprovement}
                      onChange={(e) => setAreasOfImprovement(e.target.value)}
                      placeholder="e.g. PDF print preview layouts, model response speeds..."
                      className="w-full bg-[#fdfbf7] border border-slate-250 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 min-h-[70px] resize-y"
                    />
                  </div>

                  {/* Q3 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">What specific future features would you request?</label>
                    <textarea
                      value={futureFeaturesRequested}
                      onChange={(e) => setFutureFeaturesRequested(e.target.value)}
                      placeholder="e.g. Google Classroom syncing, interactive student quiz scoring..."
                      className="w-full bg-[#fdfbf7] border border-slate-250 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 min-h-[70px] resize-y"
                    />
                  </div>

                  {/* Q4 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Any other feedback, comments, or general recommendations?</label>
                    <textarea
                      value={freeTextFeedback}
                      onChange={(e) => setFreeTextFeedback(e.target.value)}
                      placeholder="Enter other pilot assessment feedback here..."
                      className="w-full bg-[#fdfbf7] border border-slate-250 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 min-h-[75px] resize-y"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-slate-200/50 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer disabled:opacity-50"
                >
                  Skip Feedback
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Response</span>
                    </>
                  )}
                </button>
              </div>
              
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

export default PilotFeedbackModal;
