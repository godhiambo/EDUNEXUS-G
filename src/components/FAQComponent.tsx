import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  Bot, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  MessageSquare, 
  ArrowRight, 
  BookOpen, 
  Printer, 
  ShieldCheck, 
  WifiOff, 
  Zap, 
  Mail,
  Loader2,
  RefreshCw,
  ThumbsUp
} from 'lucide-react';

export interface FAQItem {
  id: string;
  category: 'Curriculum & CBC' | 'Exports & Printing' | 'Privacy & Account' | 'Offline & Sync' | 'AI Capabilities';
  question: string;
  answer: string;
  tags: string[];
}

const DEFAULT_FAQS: FAQItem[] = [
  {
    id: 'cbc-alignment',
    category: 'Curriculum & CBC',
    question: 'How does EduNexus align lesson plans and schemes with the Kenyan CBC framework?',
    answer: 'EduNexus is built natively around the Kenyan Competency-Based Curriculum (CBC) framework across Lower Primary, Upper Primary, Junior Secondary, and Senior Secondary. When generating lesson plans or schemes of work, our AI automatically maps strands, sub-strands, specific learning outcomes (SLOs), core competencies (e.g., Critical Thinking, Digital Literacy), values, PCIs, and 4-tier assessment rubrics.',
    tags: ['CBC', 'Kenyan Curriculum', 'Schemes of Work', 'SLO']
  },
  {
    id: 'swahili-support',
    category: 'Curriculum & CBC',
    question: 'Can I generate lesson plans, notes, and quizzes in Kiswahili?',
    answer: 'Yes! EduNexus fully supports bilingual generation. Simply select "Kiswahili" in the language dropdown when creating lesson plans, notes, schemes, or interactive quizzes. All headings, instructional stages, activities, and rubrics will be generated in standard academic Kiswahili.',
    tags: ['Kiswahili', 'Swahili', 'Bilingual', 'Language']
  },
  {
    id: '5e-inquiry-models',
    category: 'Curriculum & CBC',
    question: 'What pedagogical models are available for lesson structuring?',
    answer: 'You can choose from multiple established instructional models including the 5E Model (Engage, Explore, Explain, Elaborate, Evaluate), Inquiry-Based Learning, Direct Instruction (I Do, We Do, You Do), Communicative Language Teaching (CLT), Flipped Classroom, Task-Based Language Teaching (TBLT), and Gamified Quest models.',
    tags: ['Pedagogy', '5E Model', 'Inquiry', 'CLT']
  },
  {
    id: 'exports-pdf-word',
    category: 'Exports & Printing',
    question: 'How do I export documents to PDF, Word (.docx), or ZIP archives?',
    answer: 'On any saved or newly generated document, click the top-right export toolbar. You can instantly download print-ready PDFs with clean margins, editable Microsoft Word (.docx) files, or export multiple documents as a bundled ZIP file. You can also customize paper sizes (A4, A3 poster, A5 notebook) before exporting.',
    tags: ['PDF Export', 'Word Download', 'A4', 'Printing']
  },
  {
    id: 'handwritten-notes-style',
    category: 'Exports & Printing',
    question: 'How do the Classic Handwritten Lesson Notes work?',
    answer: 'Classic Lesson Notes utilize AI image synthesis and procedural canvas rendering to simulate organic student/teacher notebook handwriting. You can adjust the handwriting intensity (Level 1 pristine to Level 5 creative chaos), ruled paper style, pen color (blue, black), and paper size before generating.',
    tags: ['Handwritten Notes', 'Notebook Style', 'Diagrams']
  },
  {
    id: 'data-privacy-kdpa',
    category: 'Privacy & Account',
    question: 'Is student data protected under the Kenya Data Protection Act (KDPA) & GDPR?',
    answer: 'Yes. EduNexus adheres strictly to privacy-by-design principles and complies with the Kenya Data Protection Act (KDPA 2019) and GDPR. We do not collect or store unnecessary student personal identifiable information (PII), and all cloud storage is encrypted in transit and at rest.',
    tags: ['Data Protection', 'KDPA', 'GDPR', 'Privacy']
  },
  {
    id: 'account-data-deletion',
    category: 'Privacy & Account',
    question: 'How can I request account deletion or data removal?',
    answer: 'You can delete your account and associated documents directly within the app via Settings -> Account -> Delete Account. Alternatively, visit our public Data Deletion page at /data-deletion or email admin@joinedunexus.app to submit a formal data deletion request.',
    tags: ['Account Deletion', 'Data Removal', 'Settings']
  },
  {
    id: 'offline-functionality',
    category: 'Offline & Sync',
    question: 'Can I use EduNexus in low-connectivity or offline rural classrooms?',
    answer: 'Yes! EduNexus incorporates an offline synchronization engine. Any documents, flashcards, or schemes saved on your device remain accessible locally without an internet connection. When connectivity is restored, local edits automatically sync to your secure cloud database.',
    tags: ['Offline Mode', 'Rural Schools', 'Local Storage', 'Sync']
  },
  {
    id: 'ai-grading-accuracy',
    category: 'AI Capabilities',
    question: 'How does AI grading and assessment analysis work?',
    answer: 'EduNexus uses Gemini 3.5 Flash models to analyze student quiz answers, reading levels, and essay responses against standard rubric criteria. It provides constructive feedback, flags areas needing remediation, and generates adaptive study pathways for individual learners.',
    tags: ['AI Assessment', 'Rubrics', 'Reading Level', 'Adaptive Learning']
  }
];

interface FAQComponentProps {
  onEscalateToSupport?: (department: string, query: string) => void;
}

export const FAQComponent: React.FC<FAQComponentProps> = ({ onEscalateToSupport }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>('cbc-alignment');
  
  // AI Query state
  const [customQuery, setCustomQuery] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<{
    answer: string;
    relatedTopics: string[];
    recommendedDepartment: string;
    contactEmail: string;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);

  const categories = ['All', 'Curriculum & CBC', 'Exports & Printing', 'Privacy & Account', 'Offline & Sync', 'AI Capabilities'];

  const filteredFaqs = DEFAULT_FAQS.filter((faq) => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleAskAI = async (queryToAsk?: string) => {
    const q = queryToAsk || customQuery || searchQuery;
    if (!q || !q.trim()) return;

    setAiLoading(true);
    setAiError(null);
    setAiResponse(null);
    setFeedbackSent(false);

    try {
      const res = await fetch('/api/teacher-faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          category: selectedCategory !== 'All' ? selectedCategory : 'General Support'
        })
      });

      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setAiResponse(data.result);
      if (!customQuery) {
        setCustomQuery(q);
      }
    } catch (err: any) {
      console.error('Failed to get AI FAQ response:', err);
      setAiError(err.message || 'Unable to connect to AI Support Desk. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleEscalate = () => {
    if (onEscalateToSupport) {
      const dept = aiResponse?.recommendedDepartment || 'Technical Support';
      const queryText = customQuery || searchQuery || 'Teacher Inquiry';
      onEscalateToSupport(dept, queryText);
    }
  };

  return (
    <div id="teacher-faq-section" className="w-full space-y-8 my-6">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
            <Bot className="w-4 h-4" />
            <span>Instant AI Teacher Support Desk</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-black text-white">
            Frequently Asked Questions & AI Help Desk
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Find instant answers to common questions regarding CBC curriculum tools, exports, student privacy, and offline sync—or ask our AI Assistant for custom guidance in seconds.
          </p>

          {/* Search & AI Prompt Box */}
          <div className="pt-2">
            <div className="relative flex flex-col sm:flex-row items-stretch gap-2 bg-slate-950/80 p-2 rounded-2xl border border-slate-800 shadow-inner">
              <div className="relative flex-1 flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAskAI();
                    }
                  }}
                  placeholder="Search FAQs or ask AI a custom query (e.g. How to export a 5E lesson plan?)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-transparent text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none"
                />
              </div>

              <button
                onClick={() => handleAskAI()}
                disabled={aiLoading || !searchQuery.trim()}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Asking AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Ask AI Assistant</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Interactive Answer Card (if triggered) */}
      <AnimatePresence>
        {(aiLoading || aiResponse || aiError) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/40 shadow-xl space-y-4 relative overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
                <Bot className="w-4 h-4" />
                <span>EduNexus AI Assistant Answer</span>
              </div>
              <button 
                onClick={() => { setAiResponse(null); setAiError(null); }}
                className="text-xs text-slate-400 hover:text-white transition"
              >
                Close Response
              </button>
            </div>

            {aiLoading && (
              <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-xs text-slate-300 font-medium">Generating instant answer tailored to your query...</p>
              </div>
            )}

            {aiError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
                <p className="font-bold">AI Support Desk Warning</p>
                <p>{aiError}</p>
                <button
                  onClick={() => handleAskAI()}
                  className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 mt-2"
                >
                  <RefreshCw className="w-3 h-3" /> Retry Query
                </button>
              </div>
            )}

            {aiResponse && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Question Analyzed</span>
                  <p className="text-sm font-bold text-white bg-slate-950 p-3 rounded-xl border border-slate-800">
                    "{customQuery || searchQuery}"
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AI Guidance</span>
                  <div className="text-xs sm:text-sm text-slate-200 bg-slate-950/60 p-4 rounded-xl border border-slate-800 leading-relaxed whitespace-pre-wrap">
                    {aiResponse.answer}
                  </div>
                </div>

                {/* Related topics */}
                {aiResponse.relatedTopics && aiResponse.relatedTopics.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Related Educator Questions</span>
                    <div className="flex flex-wrap gap-2">
                      {aiResponse.relatedTopics.map((topic, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setCustomQuery(topic);
                            handleAskAI(topic);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>{topic}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Escalation / Feedback block */}
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span>Did this answer help you?</span>
                    {!feedbackSent ? (
                      <button 
                        onClick={() => setFeedbackSent(true)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <ThumbsUp className="w-3 h-3" /> Yes, resolved!
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Thank you for your feedback!
                      </span>
                    )}
                  </div>

                  {onEscalateToSupport && (
                    <button
                      onClick={handleEscalate}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Still need human help? Contact {aiResponse.recommendedDepartment}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer border ${
              selectedCategory === cat
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-4">
        {filteredFaqs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-300 font-medium">No matching FAQs found for "{searchQuery}".</p>
            <button
              onClick={() => handleAskAI()}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> Ask AI Support Desk Instead
            </button>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition duration-200 overflow-hidden ${
                  isExpanded
                    ? 'bg-slate-900 border-emerald-500/50 shadow-lg'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      isExpanded ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-white leading-snug">
                      {faq.question}
                    </span>
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isExpanded ? 'rotate-180 text-emerald-400' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 space-y-4 border-t border-slate-800/80"
                    >
                      <p className="leading-relaxed text-slate-300 pt-2">
                        {faq.answer}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs">
                        <div className="flex flex-wrap gap-1.5">
                          {faq.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2.5 py-0.5 rounded-md bg-slate-950 text-slate-400 text-[11px] font-medium border border-slate-800"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomQuery(faq.question);
                            handleAskAI(faq.question);
                          }}
                          className="text-xs text-emerald-400 hover:text-emerald-300 font-extrabold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Ask AI for custom details</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default FAQComponent;
