import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  HelpCircle, 
  Check, 
  X as XIcon, 
  Printer, 
  Copy, 
  Edit, 
  ChevronRight, 
  Eye, 
  RefreshCw, 
  BookOpen, 
  Save, 
  Plus, 
  Trash2,
  Award,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { SavedDocument, DocumentQuiz, QuizQuestion, QuestionBankItem } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { handleResponseJson } from '../utils/api';
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

interface InteractiveQuizBuilderProps {
  document: SavedDocument;
  onSaveQuiz: (quiz: DocumentQuiz) => Promise<void>;
  onClose: () => void;
  isStudent?: boolean;
  onLogQuizScore?: (subject: string, subTopic: string, score: number) => void;
}

const CYCLING_TIPS = [
  "Aligning assessment items to Bloom's Taxonomy ensures deep understanding...",
  "Did you know exit tickets help gauge real-time learner retention at the end of class?",
  "Creating distractors that address common student misconceptions boosts quiz validity...",
  "Explanations help self-directed learners master the concepts at their own pace...",
  "Converting lessons into structured quizzes makes for excellent homework assignments..."
];

export default function InteractiveQuizBuilder({
  document,
  onSaveQuiz,
  onClose,
  isStudent = false,
  onLogQuizScore
}: InteractiveQuizBuilderProps) {
  const { aiLanguage } = useLanguage();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'take' | 'review' | 'edit'>('take');
  const [isGenerating, setIsGenerating] = useState(false);
  const [cyclingTip, setCyclingTip] = useState(CYCLING_TIPS[0]);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // Interactive Quiz taking state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Customizable assessment states
  const [topic, setTopic] = useState(document.topic || document.title || '');
  const [gradeLevel, setGradeLevel] = useState(document.classLevel || 'Grade 6');
  const [curriculumType, setCurriculumType] = useState<'cbc' | 'standard'>(document.curriculum || 'cbc');
  const [learningObjectives, setLearningObjectives] = useState('');
  const [questionTypes, setQuestionTypes] = useState<string[]>(['multiple-choice', 'true-false', 'fill-in-blanks', 'short-answer']);

  // Answers for fill-in-blanks and short-answer
  const [fillAnswers, setFillAnswers] = useState<Record<number, string>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<number, string>>({});
  // Self-checked scores for short answers (user marks their own short answer as correct/incorrect)
  const [shortAnswersSelfCheck, setShortAnswersSelfCheck] = useState<Record<number, boolean>>({});

  // Edit State
  const [editedQuiz, setEditedQuiz] = useState<DocumentQuiz | null>(document.quiz || null);
  const [isEditing, setIsEditing] = useState(false);

  // Clipboard copied status
  const [copied, setCopied] = useState(false);

  // Question bank saved status
  const [savedQuestionIndices, setSavedQuestionIndices] = useState<number[]>([]);

  const handleSaveToQuestionBank = async (q: QuizQuestion, index: number) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Please sign in to save questions to your Question Bank.");
        return;
      }

      const itemData: Omit<QuestionBankItem, 'id'> = {
        userId: user.uid,
        type: q.type || 'multiple-choice',
        questionText: q.questionText,
        options: q.options || [],
        correctAnswerIndex: q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : -1,
        correctAnswer: q.correctAnswer || (q.options && q.correctAnswerIndex !== undefined ? q.options[q.correctAnswerIndex] : ''),
        explanation: q.explanation || 'Saved from generated quiz.',
        gradeLevel: document.classLevel || 'Grade 6',
        subject: document.subject || 'General Studies',
        topic: document.topic || document.title || 'General',
        curriculum: document.curriculum || 'cbc',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'questionBank'), itemData);
      setSavedQuestionIndices(prev => [...prev, index]);
    } catch (err) {
      console.error('Error saving question to bank:', err);
      alert('Failed to save to Question Bank.');
    }
  };

  // Cycle the loader tip every few seconds during quiz generation
  useEffect(() => {
    if (!isGenerating) return;
    let tipIndex = 0;
    const interval = setInterval(() => {
      tipIndex = (tipIndex + 1) % CYCLING_TIPS.length;
      setCyclingTip(CYCLING_TIPS[tipIndex]);
    }, 4000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Synchronize internal state with changes to document.quiz
  useEffect(() => {
    if (document.quiz) {
      setEditedQuiz(document.quiz);
    }
  }, [document.quiz]);

  const handleGenerateQuiz = async () => {
    if (questionTypes.length === 0) {
      alert('Please select at least one question type to generate.');
      return;
    }
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: topic,
          content: document.content,
          language: aiLanguage,
          questionTypes,
          gradeLevel,
          learningObjectives,
          curriculumType,
        })
      });

      const data = await handleResponseJson(response, 'Failed to generate quiz.');
      if (data.quiz) {
        const newQuiz: DocumentQuiz = {
          title: data.quiz.title || `Assessment: ${topic}`,
          description: data.quiz.description || 'Test your knowledge on this unit.',
          questions: data.quiz.questions || [],
          generatedAt: new Date().toISOString()
        };
        
        await onSaveQuiz(newQuiz);
        setEditedQuiz(newQuiz);
        setSelectedAnswers({});
        setFillAnswers({});
        setShortAnswers({});
        setShortAnswersSelfCheck({});
        setSubmitted(false);
        setCurrentQuestionIndex(0);
        setActiveTab('take');
      } else {
        throw new Error('No quiz was generated by the model.');
      }
    } catch (err: any) {
      console.error('Quiz Generation Failed:', err);
      setGenerationError(err.message || 'An error occurred during quiz generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (qIdx: number, oIdx: number) => {
    if (submitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [qIdx]: oIdx
    }));
  };

  const handleSubmitQuiz = () => {
    if (!editedQuiz) return;
    let unanswered = 0;
    editedQuiz.questions.forEach((q, idx) => {
      const qType = q.type || 'multiple-choice';
      if (qType === 'multiple-choice' || qType === 'true-false') {
        if (selectedAnswers[idx] === undefined) unanswered++;
      } else if (qType === 'fill-in-blanks') {
        if (!(fillAnswers[idx] || '').trim()) unanswered++;
      } else if (qType === 'short-answer') {
        if (!(shortAnswers[idx] || '').trim()) unanswered++;
      }
    });

    if (unanswered > 0) {
      if (!window.confirm(`You have not answered ${unanswered} question(s). Submit anyway?`)) {
        return;
      }
    }
    setSubmitted(true);
    if (onLogQuizScore) {
      const scoreCount = getScore();
      const totalQuestions = editedQuiz.questions.length;
      const percentage = totalQuestions > 0 ? Math.round((scoreCount / totalQuestions) * 100) : 100;
      onLogQuizScore(document.subject || '', document.subTopic || '', percentage);
    }
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setFillAnswers({});
    setShortAnswers({});
    setShortAnswersSelfCheck({});
    setSubmitted(false);
    setCurrentQuestionIndex(0);
  };

  const handleSaveEditedQuiz = async () => {
    if (!editedQuiz) return;
    try {
      await onSaveQuiz(editedQuiz);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save edited quiz:', err);
      alert('Failed to save your quiz customizations.');
    }
  };

  const handleUpdateQuestion = (index: number, updatedField: Partial<QuizQuestion>) => {
    if (!editedQuiz) return;
    const updatedQuestions = [...editedQuiz.questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      ...updatedField
    };
    setEditedQuiz({
      ...editedQuiz,
      questions: updatedQuestions
    });
  };

  const handleUpdateOption = (qIndex: number, oIndex: number, newValue: string) => {
    if (!editedQuiz) return;
    const updatedQuestions = [...editedQuiz.questions];
    const updatedOptions = [...updatedQuestions[qIndex].options];
    updatedOptions[oIndex] = newValue;
    updatedQuestions[qIndex] = {
      ...updatedQuestions[qIndex],
      options: updatedOptions
    };
    setEditedQuiz({
      ...editedQuiz,
      questions: updatedQuestions
    });
  };

  const handleCopyQuiz = () => {
    if (!editedQuiz) return;
    let text = `=== ${editedQuiz.title.toUpperCase()} ===\n`;
    text += `${editedQuiz.description}\n\n`;
    
    editedQuiz.questions.forEach((q, i) => {
      text += `Q${i + 1}: ${q.questionText}\n`;
      q.options.forEach((opt, oIdx) => {
        const letter = String.fromCharCode(65 + oIdx); // A, B, C, D
        text += `  [ ] ${letter}. ${opt}\n`;
      });
      text += `\n`;
    });

    text += `=== ANSWER KEY & EXPLANATIONS ===\n\n`;
    editedQuiz.questions.forEach((q, i) => {
      const letter = String.fromCharCode(65 + q.correctAnswerIndex);
      text += `Q${i + 1} Correct Answer: ${letter}. ${q.options[q.correctAnswerIndex]}\n`;
      text += `Explanation: ${q.explanation}\n\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintQuiz = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !editedQuiz) return;

    const quizHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Exit Ticket / Homework</title>
        <style>
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: #1e293b;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.6;
          }
          h1 {
            color: #0f172a;
            font-size: 24px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 12px;
            margin-bottom: 8px;
          }
          .desc {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 24px;
            font-style: italic;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            border: 1px solid #cbd5e1;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 30px;
            font-size: 13px;
          }
          .meta-item span {
            font-weight: bold;
          }
          .question {
            margin-bottom: 24px;
            page-break-inside: avoid;
          }
          .q-text {
            font-weight: bold;
            font-size: 15px;
            margin-bottom: 10px;
          }
          .option {
            margin-left: 20px;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
          }
          .checkbox {
            width: 14px;
            height: 14px;
            border: 1px solid #94a3b8;
            border-radius: 3px;
            margin-right: 10px;
            display: inline-block;
          }
          .divider {
            border-top: 2px dashed #94a3b8;
            margin: 50px 0;
            page-break-before: always;
          }
          .key-title {
            color: #0f172a;
            font-size: 20px;
            margin-bottom: 20px;
          }
          .key-item {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .key-q {
            font-weight: bold;
          }
          .key-ans {
            color: #16a34a;
            font-weight: bold;
            margin: 4px 0;
          }
          .key-exp {
            font-size: 13px;
            color: #475569;
            background: #f8fafc;
            padding: 10px;
            border-left: 3px solid #cbd5e1;
            border-radius: 4px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${editedQuiz.title}</h1>
        <p class="desc">${editedQuiz.description}</p>
        
        <div class="meta-row">
          <div class="meta-item"><span>Student Name:</span> ______________________</div>
          <div class="meta-item"><span>Date:</span> __________________</div>
          <div class="meta-item"><span>Score:</span> ________ / ${editedQuiz.questions.length}</div>
        </div>

        <div style="margin-bottom: 40px;">
          ${editedQuiz.questions.map((q, idx) => {
            const qType = q.type || 'multiple-choice';
            let qHtml = `<div class="question"><div class="q-text">${idx + 1}. ${q.questionText} <span style="font-size: 11px; font-weight: normal; color: #64748b; margin-left: 8px;">(${qType.replace('-', ' ')})</span></div>`;
            if (qType === 'multiple-choice' || qType === 'true-false') {
              qHtml += (q.options || []).map((opt, oIdx) => `
                <div class="option">
                  <span class="checkbox"></span>
                  <span>${String.fromCharCode(65 + oIdx)}. ${opt}</span>
                </div>
              `).join('');
            } else if (qType === 'fill-in-blanks') {
              qHtml += `
                <div style="margin-left: 20px; border-bottom: 1px solid #94a3b8; width: 250px; height: 32px; margin-top: 10px;"></div>
              `;
            } else if (qType === 'short-answer') {
              qHtml += `
                <div style="margin-left: 20px; border-bottom: 1px dashed #cbd5e1; width: 100%; height: 28px; margin-top: 10px;"></div>
                <div style="margin-left: 20px; border-bottom: 1px dashed #cbd5e1; width: 100%; height: 28px; margin-top: 10px;"></div>
              `;
            }
            qHtml += `</div>`;
            return qHtml;
          }).join('')}
        </div>

        <div class="divider"></div>

        <h1 class="key-title">Teacher Answer Key & Explanations</h1>
        <p class="desc">For: ${editedQuiz.title}</p>
        
        <div>
          ${editedQuiz.questions.map((q, idx) => {
            const qType = q.type || 'multiple-choice';
            let keyAns = '';
            if (qType === 'multiple-choice' || qType === 'true-false') {
              const letter = q.correctAnswerIndex !== undefined && q.correctAnswerIndex >= 0 ? String.fromCharCode(65 + q.correctAnswerIndex) : '';
              const value = q.options && q.correctAnswerIndex !== undefined && q.correctAnswerIndex >= 0 ? q.options[q.correctAnswerIndex] : '';
              keyAns = `Correct Choice: ${letter}. ${value}`;
            } else {
              keyAns = `Exemplar Answer: ${q.correctAnswer || ''}`;
            }
            return `
              <div class="key-item">
                <div class="key-q">${idx + 1}. ${q.questionText} <span style="font-size: 11px; font-weight: normal; color: #64748b; margin-left: 8px;">(${qType.replace('-', ' ')})</span></div>
                <div class="key-ans">${keyAns}</div>
                <div class="key-exp"><strong>Explanation:</strong> ${q.explanation}</div>
              </div>
            `;
          }).join('')}
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(quizHtml);
    printWindow.document.close();
  };

  const getScore = () => {
    if (!editedQuiz) return 0;
    let score = 0;
    editedQuiz.questions.forEach((q, idx) => {
      const qType = q.type || 'multiple-choice';
      if (qType === 'multiple-choice' || qType === 'true-false') {
        if (selectedAnswers[idx] === q.correctAnswerIndex) {
          score++;
        }
      } else if (qType === 'fill-in-blanks') {
        const userAns = (fillAnswers[idx] || '').trim().toLowerCase();
        const correctAns = (q.correctAnswer || '').trim().toLowerCase();
        if (userAns && userAns === correctAns) {
          score++;
        }
      } else if (qType === 'short-answer') {
        if (shortAnswersSelfCheck[idx] === true) {
          score++;
        }
      }
    });
    return score;
  };

  return (
    <div id="quiz-builder-modal" className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 overflow-y-auto no-print ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <div className={`bg-[#fcfbf9] border border-[#e5e1da] shadow-2xl flex flex-col overflow-hidden animate-fadeIn ${
        isFullscreen ? 'w-full h-full max-h-none rounded-none' : 'w-full max-w-4xl max-h-[90vh] rounded-2xl'
      }`}>
        
        {/* Modal Header */}
        <div className="p-5 border-b border-[#e5e1da] bg-[#f4f1ea]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5f6f52]/10 flex items-center justify-center text-[#5f6f52]">
              <HelpCircle className="w-5.5 h-5.5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Interactive Quiz Builder
                <span className="bg-[#5f6f52] text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">EduNexus AI</span>
              </h2>
              <p className="text-xs text-[#7a7a7a]">Generate student homework, homework aids, or quick exit tickets aligned to your curriculum</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[350px]">
          
          {/* Generation Loader screen */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center h-full space-y-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-[#5f6f52]/20 border-t-[#5f6f52] rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-lg">💡</div>
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="font-bold text-slate-800 text-lg">Converting lesson notes to interactive quiz...</h3>
                <p className="text-slate-500 text-xs leading-relaxed animate-pulse">
                  Gemini is carefully crafting 5 custom multiple-choice items, complete with age-appropriate distractors and instructional feedback.
                </p>
              </div>
              <div className="bg-[#faf6ee] border border-[#eadecd] rounded-xl p-4 max-w-lg text-left shadow-xs flex gap-3">
                <span className="text-lg">💡</span>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teacher Tip</p>
                  <p className="text-xs text-slate-600 font-medium italic mt-0.5">"{cyclingTip}"</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Screen */}
          {generationError && !isGenerating && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 my-4 text-left flex gap-3 items-start animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-3 flex-1">
                <h3 className="font-bold text-red-800 text-sm">Quiz Generation Failed</h3>
                <p className="text-xs text-red-700 leading-relaxed">{generationError}</p>
                <button
                  onClick={handleGenerateQuiz}
                  className="bg-red-600 text-white hover:bg-red-700 font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Generation
                </button>
              </div>
            </div>
          )}

          {/* Un-generated Initial state */}
          {!editedQuiz && !isGenerating && !generationError && (
            <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn text-left">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-12 h-12 bg-[#5f6f52]/10 rounded-xl flex items-center justify-center text-2xl">
                  📋
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Custom Assessment Generator</h3>
                  <p className="text-xs text-slate-500">Draft curriculum-aligned assessments of mixed formats in seconds</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Topic & Objectives Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 block">
                      Target Topic / Subject
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full text-xs font-medium text-slate-800 border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-[#5f6f52]"
                      placeholder="e.g. Photosynthesis, Digestion in Mammals"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 block">
                      Specified Grade Level
                    </label>
                    <input
                      type="text"
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full text-xs font-medium text-slate-800 border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-[#5f6f52]"
                      placeholder="e.g. Grade 4, Grade 7, Form 3"
                    />
                  </div>
                </div>

                {/* Curriculum Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">Educational Curriculum</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurriculumType('cbc')}
                      className={`flex-1 py-2 px-3 border rounded-lg text-xs font-semibold transition cursor-pointer ${
                        curriculumType === 'cbc'
                          ? 'border-[#5f6f52] bg-[#5f6f52]/5 text-[#5f6f52]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Kenyan CBC (Competency-Based Curriculum)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurriculumType('standard')}
                      className={`flex-1 py-2 px-3 border rounded-lg text-xs font-semibold transition cursor-pointer ${
                        curriculumType === 'standard'
                          ? 'border-[#5f6f52] bg-[#5f6f52]/5 text-[#5f6f52]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Kenyan Standard 8-4-4 / KCPE / KCSE
                    </button>
                  </div>
                </div>

                {/* Question Types Checkboxes */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 block">Include Question Formats</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'multiple-choice', label: 'Multiple Choice (MCQ)' },
                      { id: 'true-false', label: 'True / False Statements' },
                      { id: 'fill-in-blanks', label: 'Fill in the Blanks' },
                      { id: 'short-answer', label: 'Short Answer Questions' }
                    ].map((item) => {
                      const checked = questionTypes.includes(item.id);
                      return (
                        <label
                          key={item.id}
                          className={`flex items-center gap-2.5 p-2.5 border rounded-lg text-xs font-medium cursor-pointer transition select-none ${
                            checked ? 'border-[#5f6f52]/40 bg-[#5f6f52]/5 text-slate-800 font-bold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setQuestionTypes(questionTypes.filter(t => t !== item.id));
                              } else {
                                setQuestionTypes([...questionTypes, item.id]);
                              }
                            }}
                            className="accent-[#5f6f52] w-4 h-4 cursor-pointer"
                          />
                          <span>{item.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Learning Objectives */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 flex items-center justify-between">
                    <span>Learning Objectives / Guidelines</span>
                    <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={learningObjectives}
                    onChange={(e) => setLearningObjectives(e.target.value)}
                    className="w-full text-xs font-medium text-slate-800 border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-[#5f6f52] min-h-[70px]"
                    placeholder="e.g. Learners should be able to list parts of a plant, describe functions of a root, etc."
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateQuiz}
                disabled={questionTypes.length === 0}
                className="w-full bg-[#5f6f52] disabled:opacity-50 text-white hover:bg-[#4d5a42] font-bold py-3 px-6 rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <Sparkles className="w-4.5 h-4.5 text-amber-300 fill-amber-300" />
                Generate Assessment with Gemini
              </button>
            </div>
          )}

          {/* Quiz Display State */}
          {editedQuiz && !isGenerating && (
            <div className="space-y-6">
              {/* Header inside display */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-[#faf6ee] rounded-xl border border-[#eadecd]">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-base">{editedQuiz.title}</h4>
                  <p className="text-xs text-slate-500">{editedQuiz.description}</p>
                </div>
                
                {/* Control tabs */}
                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                    <button
                      onClick={() => { setActiveTab('take'); setIsEditing(false); }}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        activeTab === 'take' && !isEditing
                          ? 'bg-[#5f6f52] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" /> Take Quiz
                    </button>
                    <button
                      onClick={() => { setActiveTab('review'); setIsEditing(false); }}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        activeTab === 'review' && !isEditing
                          ? 'bg-[#5f6f52] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" /> Answer Key
                    </button>
                    {!isStudent && (
                      <button
                        onClick={() => { setActiveTab('edit'); setIsEditing(true); }}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isEditing
                            ? 'bg-[#5f6f52] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Edit className="w-3.5 h-3.5" /> Customize
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* TAB 1: Take Interactive Quiz */}
              {activeTab === 'take' && !isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left panel: active question */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                      {/* Progress bar */}
                      <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">
                        <span>Question {currentQuestionIndex + 1} of {editedQuiz.questions.length}</span>
                        <span>{Math.round(((currentQuestionIndex + 1) / editedQuiz.questions.length) * 100)}% Complete</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mb-6">
                        <div 
                          className="bg-[#5f6f52] h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${((currentQuestionIndex + 1) / editedQuiz.questions.length) * 100}%` }}
                        />
                      </div>

                      {/* Question Text */}
                      <h3 className="font-bold text-slate-800 text-lg mb-6 leading-snug">
                        {editedQuiz.questions[currentQuestionIndex].questionText}
                      </h3>

                      {/* Active Question Content Renderer based on Type */}
                      {(() => {
                        const q = editedQuiz.questions[currentQuestionIndex];
                        const qType = q.type || 'multiple-choice';

                        if (qType === 'multiple-choice' || qType === 'true-false') {
                          return (
                            <div className="space-y-3 text-left">
                              {q.options.map((option, oIdx) => {
                                const isSelected = selectedAnswers[currentQuestionIndex] === oIdx;
                                const isCorrect = q.correctAnswerIndex === oIdx;
                                let btnStyle = "border-slate-200 text-slate-700 bg-white hover:bg-slate-50";
                                
                                if (isSelected && !submitted) {
                                  btnStyle = "border-[#5f6f52] bg-[#5f6f52]/5 text-[#5f6f52]";
                                } else if (submitted) {
                                  if (isCorrect) {
                                    btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-800";
                                  } else if (isSelected) {
                                    btnStyle = "border-red-500 bg-red-50 text-red-800";
                                  } else {
                                    btnStyle = "border-slate-100 text-slate-400 bg-white opacity-60";
                                  }
                                }

                                return (
                                  <button
                                    key={oIdx}
                                    onClick={() => handleSelectOption(currentQuestionIndex, oIdx)}
                                    className={`w-full text-left p-4 rounded-xl border text-sm font-semibold transition flex items-center justify-between cursor-pointer ${btnStyle}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                        isSelected ? 'bg-[#5f6f52] text-white border-[#5f6f52]' : 'border-slate-300 text-slate-500'
                                      }`}>
                                        {String.fromCharCode(65 + oIdx)}
                                      </span>
                                      <span>{option}</span>
                                    </div>
                                    {submitted && (
                                      isCorrect ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                      ) : isSelected ? (
                                        <XIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                                      ) : null
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        } else if (qType === 'fill-in-blanks') {
                          const userVal = fillAnswers[currentQuestionIndex] || '';
                          const isCorrect = userVal.trim().toLowerCase() === (q.correctAnswer || '').trim().toLowerCase();
                          return (
                            <div className="space-y-4">
                              <div className="space-y-1.5 text-left">
                                <label className="text-xs font-bold text-slate-500 block">Your Answer</label>
                                <input
                                  type="text"
                                  value={userVal}
                                  onChange={(e) => {
                                    if (submitted) return;
                                    setFillAnswers(prev => ({ ...prev, [currentQuestionIndex]: e.target.value }));
                                  }}
                                  disabled={submitted}
                                  placeholder="Type the correct missing word or phrase..."
                                  className={`w-full border p-3 rounded-xl focus:ring-2 focus:ring-[#5f6f52]/20 text-sm font-medium transition ${
                                    submitted
                                      ? isCorrect
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                                        : 'border-red-400 bg-red-50 text-red-900'
                                      : 'border-slate-200 focus:border-[#5f6f52]'
                                  }`}
                                />
                              </div>
                              {submitted && (
                                <div className={`p-4 rounded-xl text-xs flex items-start gap-2.5 text-left ${
                                  isCorrect ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'
                                }`}>
                                  <span className="text-base">{isCorrect ? '✅' : '❌'}</span>
                                  <div>
                                    <p className="font-bold">{isCorrect ? 'Correct Answer!' : 'Incorrect response'}</p>
                                    <p className="mt-0.5 font-medium">
                                      Expected answer: <span className="font-bold underline">{q.correctAnswer}</span>
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        } else {
                          // short-answer
                          const userVal = shortAnswers[currentQuestionIndex] || '';
                          const isMarkedCorrect = shortAnswersSelfCheck[currentQuestionIndex] === true;
                          const isMarkedIncorrect = shortAnswersSelfCheck[currentQuestionIndex] === false;
                          return (
                            <div className="space-y-4">
                              <div className="space-y-1.5 text-left">
                                <label className="text-xs font-bold text-slate-500 block">Your Written Answer</label>
                                <textarea
                                  value={userVal}
                                  onChange={(e) => {
                                    if (submitted) return;
                                    setShortAnswers(prev => ({ ...prev, [currentQuestionIndex]: e.target.value }));
                                  }}
                                  disabled={submitted}
                                  placeholder="Type your explanation or short response..."
                                  className={`w-full border p-3 rounded-xl focus:ring-2 focus:ring-[#5f6f52]/20 text-sm font-medium transition min-h-[100px] ${
                                    submitted
                                      ? 'border-slate-200 bg-slate-50 text-slate-800'
                                      : 'border-slate-200 focus:border-[#5f6f52]'
                                  }`}
                                />
                              </div>
                              
                              {submitted && (
                                <div className="space-y-4 animate-fadeIn text-left">
                                  {/* Show exemplar */}
                                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left">
                                    <p className="font-bold text-slate-700 text-xs">Exemplar Answer / Rubric:</p>
                                    <p className="text-slate-600 text-xs mt-1.5 font-medium leading-relaxed bg-white border border-slate-100 p-2.5 rounded-lg italic">
                                      "{q.correctAnswer}"
                                    </p>
                                  </div>

                                  {/* Self Assessment / Grading */}
                                  <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                                    <div>
                                      <p className="font-bold text-slate-700 text-xs">Self Assessment Grading</p>
                                      <p className="text-[11px] text-slate-400">Did your answer match the core concepts of the exemplar?</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setShortAnswersSelfCheck(prev => ({ ...prev, [currentQuestionIndex]: true }))}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition ${
                                          isMarkedCorrect 
                                            ? 'bg-emerald-600 text-white shadow-xs' 
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setShortAnswersSelfCheck(prev => ({ ...prev, [currentQuestionIndex]: false }))}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition ${
                                          isMarkedIncorrect 
                                            ? 'bg-red-600 text-white shadow-xs' 
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                      >
                                        <XIcon className="w-3.5 h-3.5" /> Incorrect
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                      })()}

                      {/* Explanation if submitted */}
                      {submitted && (
                        <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-relaxed text-slate-600">
                          <p className="font-bold text-slate-700 mb-1">🔑 Explanatory Feedback:</p>
                          {editedQuiz.questions[currentQuestionIndex].explanation}
                        </div>
                      )}

                      {/* Navigation buttons */}
                      <div className="flex items-center justify-between border-t border-slate-100 mt-8 pt-5">
                        <button
                          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                          disabled={currentQuestionIndex === 0}
                          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                        >
                          Previous
                        </button>
                        
                        {currentQuestionIndex < editedQuiz.questions.length - 1 ? (
                          <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.min(editedQuiz.questions.length - 1, prev + 1))}
                            className="bg-[#5f6f52] text-white hover:bg-[#4d5a42] px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            Next <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          !submitted ? (
                            <button
                              onClick={handleSubmitQuiz}
                              className="bg-amber-500 text-white hover:bg-amber-600 px-5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                            >
                              Submit Assessment
                            </button>
                          ) : (
                            <button
                              onClick={handleResetQuiz}
                              className="border border-[#5f6f52] text-[#5f6f52] hover:bg-[#5f6f52]/5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Reset Quiz
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right panel: summary & progress navigator */}
                  <div className="space-y-4">
                    {submitted && (
                      <div className="bg-gradient-to-br from-[#5f6f52]/10 to-emerald-50 border border-[#5f6f52]/20 rounded-xl p-5 text-center space-y-3 shadow-xs">
                        <Award className="w-12 h-12 text-[#5f6f52] mx-auto" />
                        <div>
                          <h4 className="font-extrabold text-[#5f6f52] text-xl">Score: {getScore()} / {editedQuiz.questions.length}</h4>
                          <p className="text-slate-500 text-xs mt-1">
                            {getScore() === editedQuiz.questions.length ? "🌟 Perfect alignment! Masterful achievement!" : "📋 Excellent exit-ticket check."}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Navigator</p>
                      <div className="grid grid-cols-5 gap-2">
                        {editedQuiz.questions.map((_, idx) => {
                          const isAnswered = selectedAnswers[idx] !== undefined;
                          const isActive = currentQuestionIndex === idx;
                          let navStyle = "border-slate-200 text-slate-500 bg-slate-55";

                          if (isActive) {
                            navStyle = "border-[#5f6f52] text-[#5f6f52] bg-[#5f6f52]/10 font-bold ring-2 ring-[#5f6f52]/25";
                          } else if (isAnswered) {
                            navStyle = "bg-[#5f6f52] text-white border-[#5f6f52]";
                          }

                          return (
                            <button
                              key={idx}
                              onClick={() => setCurrentQuestionIndex(idx)}
                              className={`h-10 rounded-lg border text-xs font-bold transition flex items-center justify-center cursor-pointer ${navStyle}`}
                            >
                              Q{idx + 1}
                            </button>
                          );
                        })}
                      </div>

                      <div className="border-t border-slate-100 pt-4 space-y-2">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Teacher Homework Tools</p>
                        <div className="flex gap-2">
                          <button
                            onClick={handlePrintQuiz}
                            className="flex-1 bg-white border border-[#e5e1da] text-[#5f6f52] hover:bg-slate-50 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" /> Print Sheets
                          </button>
                          <button
                            onClick={handleCopyQuiz}
                            className="flex-1 bg-white border border-[#e5e1da] text-[#5f6f52] hover:bg-slate-50 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" /> {copied ? "Copied!" : "Copy Text"}
                          </button>
                        </div>
                        {!isStudent && (
                          <button
                            onClick={handleGenerateQuiz}
                            className="w-full bg-[#faf6ee] border border-[#eadecd] text-[#5f6f52] hover:bg-[#e9e5db] py-2 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer mt-1"
                          >
                            <RefreshCw className="w-3 h-3 animate-spin-hover" /> Re-generate with AI
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Review Answer Keys */}
              {activeTab === 'review' && !isEditing && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-800 text-sm">Grading Blueprint & Answer Explanations</h5>
                    <div className="flex gap-2">
                      <button
                        onClick={handlePrintQuiz}
                        className="bg-[#5f6f52] text-white hover:bg-[#4d5a42] px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print Assessment
                      </button>
                      <button
                        onClick={handleCopyQuiz}
                        className="bg-white border border-[#e5e1da] text-slate-600 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" /> {copied ? "Copied Plain Text!" : "Copy to Clipboard"}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {editedQuiz.questions.map((q, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 text-left">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <h4 className="font-bold text-slate-800 text-sm">{q.questionText}</h4>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleSaveToQuestionBank(q, idx)}
                            disabled={savedQuestionIndices.includes(idx)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition flex-shrink-0 cursor-pointer ${
                              savedQuestionIndices.includes(idx)
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-[#5f6f52]/5 text-[#5f6f52] hover:bg-[#5f6f52]/15 border border-[#5f6f52]/15'
                            }`}
                          >
                            {savedQuestionIndices.includes(idx) ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" /> Saved
                              </>
                            ) : (
                              <>
                                <Save className="w-3 h-3" /> Save to Bank
                              </>
                            )}
                          </button>
                        </div>
                        
                        {(() => {
                          const qType = q.type || 'multiple-choice';
                          if (qType === 'multiple-choice' || qType === 'true-false') {
                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-8">
                                {q.options.map((opt, oIdx) => {
                                  const isCorrect = q.correctAnswerIndex === oIdx;
                                  return (
                                    <div 
                                      key={oIdx} 
                                      className={`p-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 text-left ${
                                        isCorrect 
                                          ? 'border-emerald-300 bg-emerald-50/55 text-emerald-800 font-semibold' 
                                          : 'border-slate-100 bg-slate-50/30 text-slate-600'
                                      }`}
                                    >
                                      <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                                        isCorrect ? 'bg-emerald-500 border-emerald-500 text-white animate-pulse' : 'border-slate-300 text-slate-400'
                                      }`}>
                                        {String.fromCharCode(65 + oIdx)}
                                      </span>
                                      <span>{opt}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          } else {
                            return (
                              <div className="pl-8 text-left">
                                <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-lg text-xs text-emerald-900 font-medium">
                                  <span className="font-bold text-emerald-800">Correct / Exemplar Response:</span> {q.correctAnswer}
                                </div>
                              </div>
                            );
                          }
                        })()}

                        <div className="pl-8 pt-2">
                          <div className="bg-slate-50 border-l-2 border-slate-300 p-3 rounded-r-lg text-xs text-slate-600 leading-relaxed">
                            <span className="font-bold text-slate-700">Detailed Pedagogy Explanation:</span> {q.explanation}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: Customize / Edit Questions */}
              {activeTab === 'edit' && isEditing && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-2.5">
                      <span className="text-lg">✏️</span>
                      <div>
                        <h5 className="font-bold text-amber-900 text-xs">Custom Assessment Creator Mode</h5>
                        <p className="text-[11px] text-amber-700 mt-0.5">Modify generated questions, rewrite distractors, or alter explanations. Your customized assessment will be stored persistently in the cloud database.</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setIsEditing(false); setActiveTab('take'); }}
                        className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEditedQuiz}
                        className="bg-[#5f6f52] text-white hover:bg-[#4d5a42] px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Assessment
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Top Level Quiz metadata */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Quiz General Settings</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600">Quiz Title</label>
                          <input
                            type="text"
                            value={editedQuiz.title}
                            onChange={(e) => setEditedQuiz({ ...editedQuiz, title: e.target.value })}
                            className="w-full text-xs font-medium text-slate-800 border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-[#5f6f52]"
                            placeholder="Enter quiz title"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600">Quiz Instructions / Subtitle</label>
                          <input
                            type="text"
                            value={editedQuiz.description}
                            onChange={(e) => setEditedQuiz({ ...editedQuiz, description: e.target.value })}
                            className="w-full text-xs font-medium text-slate-800 border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-[#5f6f52]"
                            placeholder="Enter quiz instructions"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Question custom editor cards */}
                    {editedQuiz.questions.map((q, idx) => {
                      const qType = q.type || 'multiple-choice';
                      return (
                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-left">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                {idx + 1}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-slate-700">Type:</span>
                                <select
                                  value={qType}
                                  onChange={(e) => {
                                    const newType = e.target.value;
                                    const updates: any = { type: newType };
                                    if (newType === 'true-false') {
                                      updates.options = ['True', 'False'];
                                      updates.correctAnswerIndex = 0;
                                      updates.correctAnswer = '';
                                    } else if (newType === 'multiple-choice') {
                                      updates.options = ['Option A', 'Option B', 'Option C', 'Option D'];
                                      updates.correctAnswerIndex = 0;
                                      updates.correctAnswer = '';
                                    } else {
                                      updates.options = [];
                                      updates.correctAnswerIndex = -1;
                                      updates.correctAnswer = q.correctAnswer || 'Correct Answer';
                                    }
                                    handleUpdateQuestion(idx, updates);
                                  }}
                                  className="text-xs font-bold text-[#5f6f52] bg-[#5f6f52]/5 border border-[#5f6f52]/10 rounded-lg p-1"
                                >
                                  <option value="multiple-choice">Multiple Choice</option>
                                  <option value="true-false">True / False</option>
                                  <option value="fill-in-blanks">Fill in Blanks</option>
                                  <option value="short-answer">Short Answer</option>
                                </select>
                              </div>
                            </div>
                            
                            {(qType === 'multiple-choice' || qType === 'true-false') && (
                              <div className="flex items-center gap-2">
                                <label className="text-[11px] font-bold text-slate-500">Correct Choice:</label>
                                <select
                                  value={q.correctAnswerIndex}
                                  onChange={(e) => handleUpdateQuestion(idx, { correctAnswerIndex: parseInt(e.target.value) })}
                                  className="text-xs font-semibold text-[#5f6f52] bg-[#5f6f52]/5 border border-[#5f6f52]/20 rounded-lg p-1.5 focus:outline-none cursor-pointer"
                                >
                                  {(q.options || []).map((_, oIdx) => (
                                    <option key={oIdx} value={oIdx}>Option {String.fromCharCode(65 + oIdx)}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>

                          {/* Question Textarea */}
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 block">Question Statement</label>
                            <textarea
                              value={q.questionText}
                              onChange={(e) => handleUpdateQuestion(idx, { questionText: e.target.value })}
                              className="w-full text-xs font-medium text-slate-800 border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-[#5f6f52] min-h-[60px]"
                              placeholder="Enter the question text"
                            />
                          </div>

                          {/* Options Input Block (For MCQ and True/False) */}
                          {(qType === 'multiple-choice' || qType === 'true-false') && (
                            <div className="space-y-2">
                              <label className="text-[11px] font-bold text-slate-500 block">Answer Options / Distractors</label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {(q.options || []).map((opt, oIdx) => (
                                  <div key={oIdx} className="flex items-center gap-2 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50/20">
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                                      q.correctAnswerIndex === oIdx ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                                    }`}>
                                      {String.fromCharCode(65 + oIdx)}
                                    </span>
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => handleUpdateOption(idx, oIdx, e.target.value)}
                                      className="w-full text-xs font-medium text-slate-800 bg-transparent focus:outline-none border-b border-transparent focus:border-slate-300 pb-0.5"
                                      placeholder={`Enter option ${String.fromCharCode(65 + oIdx)}`}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Written correct answer (For Fill-in-Blanks and Short Answer) */}
                          {(qType === 'fill-in-blanks' || qType === 'short-answer') && (
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-500 block">Correct / Exemplar Written Answer</label>
                              <input
                                type="text"
                                value={q.correctAnswer || ''}
                                onChange={(e) => handleUpdateQuestion(idx, { correctAnswer: e.target.value })}
                                className="w-full text-xs font-medium text-slate-800 border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-[#5f6f52]"
                                placeholder={qType === 'fill-in-blanks' ? "Enter the direct blank-fill answer word..." : "Enter exemplar answer sentence..."}
                              />
                            </div>
                          )}

                          {/* Explanation Area */}
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 block">Remedial/Explanatory Feedback</label>
                            <textarea
                              value={q.explanation}
                              onChange={(e) => handleUpdateQuestion(idx, { explanation: e.target.value })}
                              className="w-full text-xs font-medium text-slate-800 border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-[#5f6f52] min-h-[50px]"
                              placeholder="Explain why the correct answer is correct"
                            />
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => { setIsEditing(false); setActiveTab('take'); }}
                        className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEditedQuiz}
                        className="bg-[#5f6f52] text-white hover:bg-[#4d5a42] px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Save className="w-3.5 h-3.5" /> Save & Persist Assessment
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
