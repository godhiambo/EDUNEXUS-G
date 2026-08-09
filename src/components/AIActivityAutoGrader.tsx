import React, { useState } from 'react';
import { 
  Sparkles, Plus, Trash2, CheckCircle2, AlertTriangle, Loader2, 
  RefreshCw, Award, BookOpen, ChevronDown, ChevronUp, AlertCircle, Info, Check,
  Maximize2, Minimize2
} from 'lucide-react';
import { SavedDocument } from '../types';

interface StudentSubmission {
  studentName: string;
  answerText: string;
}

interface GradedSubmission {
  studentName: string;
  answerText: string;
  score: string;
  feedback: string;
  markedCorrect: boolean;
  gapsIdentified: string[];
}

interface ClassAnalytics {
  overallPerformance: string;
  strugglingHotspots: string[];
  strugglingStudentsCount: number;
  remedialActionPlan: string[];
}

interface LessonPlannerUpdates {
  reflectionWorked: string;
  reflectionDidntWork: string;
  reflectionAdjustments: string;
}

interface GradeResponse {
  gradedSubmissions: GradedSubmission[];
  classAnalytics: ClassAnalytics;
  lessonPlannerUpdates: LessonPlannerUpdates;
}

interface AIActivityAutoGraderProps {
  document: SavedDocument;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  onApplyPlannerUpdates: (updates: {
    reflectionWorked: string;
    reflectionDidntWork: string;
    reflectionAdjustments: string;
  }) => void;
}

export default function AIActivityAutoGrader({ 
  document, 
  difficultyLevel,
  onApplyPlannerUpdates 
}: AIActivityAutoGraderProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Custom manual student submissions list
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([
    { studentName: 'Mwangi', answerText: 'I think photosynthesis happens when the plant eats water from the soil and takes in sunlight directly to grow leaves.' },
    { studentName: 'Achieng', answerText: 'Plants use chlorophyll in their leaves to trap sunlight. They combine carbon dioxide and water to produce glucose food and release oxygen.' },
    { studentName: 'Sarah', answerText: 'It is how plants make food. They need sun, oxygen from the air, and dirt. Then they grow.' }
  ]);

  const [newStudentName, setNewStudentName] = useState('');
  const [newAnswerText, setNewAnswerText] = useState('');

  // Results state
  const [gradedResult, setGradedResult] = useState<GradeResponse | null>(null);
  const [appliedUpdates, setAppliedUpdates] = useState(false);

  // Add manual student submission
  const handleAddSubmission = () => {
    if (!newStudentName.trim() || !newAnswerText.trim()) return;
    setSubmissions([
      ...submissions,
      { studentName: newStudentName.trim(), answerText: newAnswerText.trim() }
    ]);
    setNewStudentName('');
    setNewAnswerText('');
  };

  // Remove submission from list
  const handleRemoveSubmission = (index: number) => {
    setSubmissions(submissions.filter((_, i) => i !== index));
  };

  // Call API to grade submissions or simulate and grade
  const handleRunGrading = async (simulate: boolean) => {
    setIsAnalyzing(true);
    setError(null);
    setAppliedUpdates(false);
    try {
      const response = await fetch('/api/grade-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentTopic: document.topic,
          documentContent: document.content,
          difficultyLevel: difficultyLevel,
          submissions: simulate ? [] : submissions,
          simulate: simulate
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to analyze submissions.');
      }

      const data: GradeResponse = await response.json();
      setGradedResult(data);
      
      // If we simulated, let's load the generated submissions into our local sandbox list for interactive editing!
      if (simulate && data.gradedSubmissions) {
        setSubmissions(data.gradedSubmissions.map(s => ({
          studentName: s.studentName,
          answerText: s.answerText
        })));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Inject recommendation into lesson planner reflections
  const handleApplyToPlanner = () => {
    if (!gradedResult) return;
    onApplyPlannerUpdates(gradedResult.lessonPlannerUpdates);
    setAppliedUpdates(true);
    setTimeout(() => {
      // Scroll to reflection section
      const reflectionEl = window.document.getElementById('difficulty-level-label');
      if (reflectionEl) {
        reflectionEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className={`bg-white border-indigo-150 shadow-xs flex flex-col no-print animate-fadeIn ${
      isFullscreen 
        ? 'fixed inset-0 z-50 bg-white w-full h-full p-6 md:p-8 overflow-y-auto rounded-none border-none' 
        : 'rounded-2xl border overflow-hidden'
    }`}>
      {/* Header */}
      <div 
        onClick={() => !isFullscreen && setIsExpanded(!isExpanded)}
        className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between cursor-pointer hover:bg-indigo-50/80 transition"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl">⚡</span>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              AI Cognitive Activity Auto-Grader & Class Analytics
              {isFullscreen && <span className="bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Fullscreen Mode</span>}
            </h3>
            <p className="text-[10px] text-slate-500">Automatically grade student submissions, flag struggling class-wide hotspots, and update the Lesson Planner</p>
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              if (!isExpanded && !isFullscreen) {
                setIsExpanded(true);
              }
              setIsFullscreen(!isFullscreen);
            }}
            className="text-indigo-600 hover:text-indigo-800 font-bold text-[10px] uppercase tracking-wider py-1.5 px-3 bg-white border border-indigo-200 rounded-lg transition shadow-inner-sm flex items-center gap-1 cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
          </button>
          {!isFullscreen && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-indigo-600 hover:text-indigo-800 font-bold text-[10px] uppercase tracking-wider py-1.5 px-3 bg-white border border-indigo-200 rounded-lg transition shadow-inner-sm cursor-pointer"
            >
              {isExpanded ? 'Hide Tool' : 'Open Tool'}
            </button>
          )}
        </div>
      </div>

      {(isExpanded || isFullscreen) && (
        <div className="p-6 space-y-6 bg-gradient-to-b from-white to-indigo-50/10">
          
          {/* Informational Hero Banner */}
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed space-y-1">
            <p className="font-extrabold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" /> Close-Loop AI Classroom Evaluation
            </p>
            <p className="text-slate-600">
              Grade student submissions instantly based on this active lesson plan. Identify collective conceptual roadblocks and automatically apply recommended teaching adaptations straight into your post-lesson reflection records.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Student Submission Sandbox */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                  Student Sandbox
                </h4>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                  {submissions.length} Submissions
                </span>
              </div>

              {/* Submissions List */}
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {submissions.map((sub, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs flex items-start gap-2.5 group relative">
                    <div className="bg-indigo-100 text-indigo-700 font-extrabold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      {sub.studentName.charAt(0)}
                    </div>
                    <div className="space-y-1 pr-6 flex-1">
                      <p className="font-bold text-slate-800">{sub.studentName}</p>
                      <p className="text-slate-600 leading-relaxed italic">"{sub.answerText}"</p>
                    </div>
                    <button
                      onClick={() => handleRemoveSubmission(idx)}
                      className="absolute right-2 top-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1 rounded-md"
                      title="Remove student"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {submissions.length === 0 && (
                  <div className="text-center py-8 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <Info className="w-6 h-6 mx-auto text-slate-300 mb-1.5" />
                    <p className="text-xs">No student submissions added yet.</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Use the inputs below or trigger an AI simulation.</p>
                  </div>
                )}
              </div>

              {/* Add New Submission Form */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Add Manual Student Response</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Student Name"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="col-span-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Response content / worksheet answer..."
                    value={newAnswerText}
                    onChange={(e) => setNewAnswerText(e.target.value)}
                    className="col-span-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddSubmission}
                  disabled={!newStudentName.trim() || !newAnswerText.trim()}
                  className="w-full bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-50 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Student Response
                </button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3.5">
                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => handleRunGrading(true)}
                  className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[11px] font-bold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Simulate realistic student work to test the auto-grading instantly!"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                  Simulate & Grade Class
                </button>

                <button
                  type="button"
                  disabled={isAnalyzing || submissions.length === 0}
                  onClick={() => handleRunGrading(false)}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-bold py-2.5 px-3 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 text-white/90" />
                  )}
                  Grade Sandbox List
                </button>
              </div>
            </div>

            {/* Right Column: AI Analysis Result Display */}
            <div className="lg:col-span-7 bg-slate-50/50 rounded-2xl border border-slate-200 p-5 space-y-5 flex flex-col min-h-[380px]">
              {isAnalyzing ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                  <h5 className="text-sm font-bold text-slate-700">Analyzing Classroom Submissions</h5>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                    EduNexus AI is processing objectives, comparing responses, evaluating correct answers, and diagnosing class struggles...
                  </p>
                </div>
              ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-red-500">
                  <AlertCircle className="w-10 h-10 mb-2" />
                  <h5 className="text-sm font-bold">Analysis Failed</h5>
                  <p className="text-xs mt-1 max-w-sm leading-relaxed text-red-400">{error}</p>
                </div>
              ) : gradedResult ? (
                <div className="space-y-5 animate-fadeIn flex-1 flex flex-col justify-between">
                  
                  {/* Summary Metric Header */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-150">
                      <div>
                        <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">AGGREGATE INSIGHTS</span>
                        <h5 className="text-xs font-black text-slate-800 mt-0.5">
                          {gradedResult.classAnalytics.overallPerformance}
                        </h5>
                      </div>
                      <div className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        <span>{gradedResult.classAnalytics.strugglingStudentsCount} Students Need Support</span>
                      </div>
                    </div>

                    {/* Class Struggles & Action Plan */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* struggles */}
                      <div className="bg-rose-50/40 border border-rose-100 p-4 rounded-xl space-y-2">
                        <h6 className="text-[10px] font-black text-rose-800 uppercase tracking-wider flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Class Struggling Hotspots
                        </h6>
                        <ul className="text-[11px] text-slate-600 leading-relaxed space-y-1.5 list-none">
                          {gradedResult.classAnalytics.strugglingHotspots.map((spot, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-rose-500 font-bold mt-0.5">•</span>
                              <span>{spot}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* remedial plan */}
                      <div className="bg-emerald-50/40 border border-emerald-100 p-4 rounded-xl space-y-2">
                        <h6 className="text-[10px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-emerald-600" /> Scaffolded Remedial Plan
                        </h6>
                        <ul className="text-[11px] text-slate-600 leading-relaxed space-y-1.5 list-none">
                          {gradedResult.classAnalytics.remedialActionPlan.map((act, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>

                    {/* Graded Student Breakdowns */}
                    <div className="space-y-2">
                      <h6 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Individual Student Grading Cards</h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                        {gradedResult.gradedSubmissions.map((stud, i) => (
                          <div key={i} className="bg-white p-3.5 rounded-xl border border-slate-150 space-y-2 text-xs flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 mb-1.5">
                                <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${stud.markedCorrect ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                  {stud.studentName}
                                </span>
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                                  stud.markedCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {stud.score}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 leading-normal italic">"{stud.answerText}"</p>
                              <p className="text-[11px] text-slate-600 leading-relaxed mt-2">{stud.feedback}</p>
                            </div>

                            {stud.gapsIdentified.length > 0 && (
                              <div className="pt-2 flex flex-wrap gap-1 border-t border-dashed border-slate-100 mt-2">
                                {stud.gapsIdentified.map((gap, j) => (
                                  <span key={j} className="bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded text-[9px] font-semibold leading-none">
                                    ⚠️ {gap}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Actions to Update Lesson Planner */}
                  <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[10px] text-slate-500 max-w-xs text-center sm:text-left">
                      Apply the AI feedback directly into your professional CPD reflections to complete the feedback loop!
                    </p>
                    <button
                      type="button"
                      onClick={handleApplyToPlanner}
                      className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
                        appliedUpdates 
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                      } cursor-pointer`}
                    >
                      {appliedUpdates ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Applied to Planner!
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Apply Updates to Lesson Planner
                        </>
                      )}
                    </button>
                  </div>

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <TrendingUpPlaceholder />
                  <h5 className="text-sm font-bold text-slate-600">No Grading Data Yet</h5>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                    Define student answers in the Sandbox or hit "Simulate & Grade Class" to automatically run cognitive evaluation.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  );
}

// Subtle placeholder vector component
function TrendingUpPlaceholder() {
  return (
    <svg className="w-14 h-14 text-slate-300 mb-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}
