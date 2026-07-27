import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OpenBook, OpenBookChapter } from '../data/openBooksData';
import ConversationalPodcastModal from './ConversationalPodcastModal';
import {
  X,
  BookOpen,
  Volume2,
  VolumeX,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Type,
  Sun,
  Moon,
  Sparkles,
  Check,
  Share2,
  FileText,
  Radio,
  Send,
  MessageSquare,
  Bot,
  User,
  Trash2,
  Loader2,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

interface OpenBookReaderModalProps {
  book: OpenBook | null;
  onClose: () => void;
  onImportToLibrary: (book: OpenBook) => void;
}

export default function OpenBookReaderModal({
  book,
  onClose,
  onImportToLibrary
}: OpenBookReaderModalProps) {
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [fontSize, setFontSize] = useState<number>(16); // in px
  const [readerTheme, setReaderTheme] = useState<'light' | 'sepia' | 'dark'>('sepia');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [importedStatus, setImportedStatus] = useState<boolean>(false);
  const [useDyslexicFont, setUseDyslexicFont] = useState<boolean>(false);

  // Chapter Podcast Modal State
  const [isPodcastOpen, setIsPodcastOpen] = useState<boolean>(false);

  // AI Q&A Panel State
  const [isAiPanelOpen, setIsAiPanelOpen] = useState<boolean>(false);
  const [aiQuestion, setAiQuestion] = useState<string>('');
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([]);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentChapterIndex(0);
    setIsSpeaking(false);
    setImportedStatus(false);
    setAiChatMessages([]);
    setIsAiPanelOpen(false);
    setIsPodcastOpen(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [book]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiChatMessages, isAiThinking]);

  if (!book) return null;

  const currentChapter: OpenBookChapter = book.chapters[currentChapterIndex] || {
    title: 'Content Overview',
    content: book.summary
  };

  // Text to Speech Handler
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech narration is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const textToRead = `${currentChapter.title}. ${currentChapter.content}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.95; // Clear natural reading speed
      utterance.pitch = 1.0;
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleImport = () => {
    onImportToLibrary(book);
    setImportedStatus(true);
  };

  // Handle AI Question Submission
  const handleAskAi = async (customPrompt?: string) => {
    const queryToAsk = (customPrompt || aiQuestion).trim();
    if (!queryToAsk || isAiThinking) return;

    const newUserMessage = { role: 'user' as const, text: queryToAsk };
    const updatedMessages = [...aiChatMessages, newUserMessage];
    setAiChatMessages(updatedMessages);
    setAiQuestion('');
    setIsAiThinking(true);
    setAiError(null);
    if (!isAiPanelOpen) setIsAiPanelOpen(true);

    try {
      const res = await fetch('/api/ask-book-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: book.title,
          author: book.author,
          chapterTitle: currentChapter.title,
          chapterContent: currentChapter.content,
          question: queryToAsk,
          chatHistory: updatedMessages
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to get answer from AI Book Tutor.');
      }

      const data = await res.json();
      setAiChatMessages(prev => [...prev, { role: 'model', text: data.answer }]);
    } catch (err: any) {
      console.error("AI Ask error:", err);
      setAiError(err.message || 'Error communicating with AI Assistant.');
    } finally {
      setIsAiThinking(false);
    }
  };

  // Theme styling helpers
  const getThemeClasses = () => {
    switch (readerTheme) {
      case 'dark':
        return 'bg-zinc-900 text-zinc-100 border-zinc-800';
      case 'sepia':
        return 'bg-[#fbf0d9] text-[#433422] border-[#e8d7be]';
      case 'light':
      default:
        return 'bg-white text-slate-800 border-slate-200';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`w-full max-w-6xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border ${getThemeClasses()}`}
        >
          {/* Header Bar */}
          <div className="px-4 py-3 border-b flex items-center justify-between gap-3 shrink-0 bg-black/5 dark:bg-white/5 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${book.coverBg} flex items-center justify-center text-lg shadow-sm shrink-0`}>
                {book.coverEmoji}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-extrabold truncate">{book.title}</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30">
                    {book.category}
                  </span>
                </div>
                <p className="text-[11px] opacity-75 truncate">
                  By {book.author} • {book.language} • {book.license}
                </p>
              </div>
            </div>

            {/* Top Action Controls */}
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              {/* AI Study Guide Button */}
              <button
                type="button"
                onClick={() => handleAskAi("Generate a comprehensive AI Study Guide for this chapter including:\n1. 📌 Executive Summary\n2. 🔑 Key Discussion Points & Essential Questions\n3. 💡 Core Vocabulary & Key Terms\n4. 📝 Classroom / Self-Study Activity Suggestions")}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs shrink-0"
                title="Generate an AI Study Guide with summary, key terms, and discussion points"
              >
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span className="hidden sm:inline">AI Study Guide</span>
              </button>

              {/* Podcast Modal Button */}
              <button
                type="button"
                onClick={() => setIsPodcastOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-xs shrink-0"
                title="Listen to an interactive AI Chapter Podcast discussion (Alex & Dr. Sarah) breaking down this chapter!"
              >
                <Radio className="w-4 h-4 text-amber-200" />
                <span className="hidden sm:inline">Chapter Podcast</span>
              </button>

              {/* Ask AI Toggle Button */}
              <button
                type="button"
                onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0 ${
                  isAiPanelOpen
                    ? 'bg-purple-700 text-white ring-2 ring-purple-300'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
                title="Ask AI questions about this chapter"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span className="hidden sm:inline">Ask AI</span>
              </button>

              <button
                type="button"
                onClick={toggleSpeech}
                className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isSpeaking
                    ? 'bg-rose-500 text-white shadow-md animate-pulse'
                    : 'bg-black/5 dark:bg-white/10 hover:bg-black/10'
                }`}
                title={isSpeaking ? "Pause Narration" : "Listen / Read Aloud"}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span className="hidden md:inline">{isSpeaking ? 'Stop Audio' : 'Read Aloud'}</span>
              </button>

              <button
                type="button"
                onClick={handleImport}
                disabled={importedStatus}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                  importedStatus
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-[#5f6f52] hover:bg-[#4d5b42] text-white'
                }`}
                title="Save this digital book to your local curriculum library so AI can generate flashcards & podcasts"
              >
                {importedStatus ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                <span className="hidden md:inline">{importedStatus ? 'In Library' : 'Import'}</span>
              </button>

              <a
                href={book.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 transition text-xs font-bold"
                title="Open Official Gutenberg / OpenStax Source"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => {
                  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                  onClose();
                }}
                className="p-2 rounded-xl hover:bg-black/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Reader Preferences Bar */}
          <div className="px-4 py-2 border-b flex items-center justify-between gap-3 text-xs shrink-0 bg-black/5 dark:bg-white/5 flex-wrap">
            {/* Font Size Adjusters */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold opacity-70 flex items-center gap-1">
                <Type className="w-3.5 h-3.5" /> Text Size:
              </span>
              <button
                type="button"
                onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
                className="p-1 rounded bg-black/10 dark:bg-white/10 hover:opacity-80 cursor-pointer"
                title="Smaller Font"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] font-bold w-6 text-center">{fontSize}px</span>
              <button
                type="button"
                onClick={() => setFontSize(prev => Math.min(28, prev + 2))}
                className="p-1 rounded bg-black/10 dark:bg-white/10 hover:opacity-80 cursor-pointer"
                title="Larger Font"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setUseDyslexicFont(!useDyslexicFont)}
                className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                  useDyslexicFont ? 'bg-indigo-600 text-white' : 'bg-black/10 dark:bg-white/10'
                }`}
                title="Toggle Dyslexia-Friendly Spacing"
              >
                Dyslexia Font: {useDyslexicFont ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Reader Theme Toggles */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold opacity-70">Theme:</span>
              <button
                type="button"
                onClick={() => setReaderTheme('sepia')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border cursor-pointer ${
                  readerTheme === 'sepia' ? 'bg-[#fbf0d9] text-[#433422] border-[#d8c3a5] ring-2 ring-[#8c6d46]' : 'bg-black/5'
                }`}
              >
                📜 Sepia
              </button>
              <button
                type="button"
                onClick={() => setReaderTheme('light')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border cursor-pointer ${
                  readerTheme === 'light' ? 'bg-white text-slate-800 border-slate-300 ring-2 ring-slate-400' : 'bg-black/5'
                }`}
              >
                ☀️ Light
              </button>
              <button
                type="button"
                onClick={() => setReaderTheme('dark')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border cursor-pointer ${
                  readerTheme === 'dark' ? 'bg-zinc-900 text-white border-zinc-700 ring-2 ring-zinc-500' : 'bg-black/5'
                }`}
              >
                🌙 Dark
              </button>
            </div>
          </div>

          {/* Main Workspace Body (Chapter View + AI Panel) */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            
            {/* Book Chapter Content Area */}
            <motion.div
              key={currentChapterIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6"
            >
              {/* Chapter Header */}
              <div className="border-b pb-4 mb-4 border-current/10 flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-widest opacity-60">
                    Chapter {currentChapterIndex + 1} of {book.chapters.length}
                  </span>
                  <h1 className="text-xl sm:text-2xl font-extrabold mt-1">{currentChapter.title}</h1>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAskAi("Generate a comprehensive AI Study Guide for this chapter including:\n1. 📌 Executive Summary\n2. 🔑 Key Discussion Points & Essential Questions\n3. 💡 Core Vocabulary & Key Terms\n4. 📝 Classroom / Self-Study Activity Suggestions")}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                    <span>AI Study Guide</span>
                  </button>
                  {!isAiPanelOpen && (
                    <button
                      onClick={() => setIsAiPanelOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Bot className="w-3.5 h-3.5 text-purple-600" />
                      <span>Ask AI</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Readable Chapter Text */}
              <div
                className={`leading-relaxed whitespace-pre-wrap transition-all ${
                  useDyslexicFont ? 'tracking-wider font-sans leading-loose' : 'font-serif'
                }`}
                style={{ fontSize: `${fontSize}px` }}
              >
                {currentChapter.content}
              </div>
            </motion.div>

            {/* AI Q&A Side Panel */}
            <AnimatePresence>
              {isAiPanelOpen && (
                <motion.div
                  initial={{ opacity: 0, x: 300 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 300 }}
                  className="w-full md:w-96 border-t md:border-t-0 md:border-l border-current/15 bg-purple-50/40 dark:bg-zinc-900/90 flex flex-col h-full shrink-0 shadow-lg"
                >
                  {/* Panel Header */}
                  <div className="p-3 border-b border-current/10 flex items-center justify-between bg-purple-100/50 dark:bg-purple-950/40">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold text-purple-950 dark:text-purple-100">AI Book Tutor</h3>
                        <p className="text-[10px] text-purple-700 dark:text-purple-300 truncate max-w-[180px]">
                          Grounded in {currentChapter.title}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {aiChatMessages.length > 0 && (
                        <button
                          onClick={() => setAiChatMessages([])}
                          className="p-1 rounded text-purple-700 hover:bg-purple-200/50 cursor-pointer text-[10px] font-bold"
                          title="Clear chat history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setIsAiPanelOpen(false)}
                        className="p-1 rounded text-purple-700 hover:bg-purple-200/50 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Quick Prompts */}
                  <div className="p-2 border-b border-current/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-purple-50/80 dark:bg-zinc-800/50 shrink-0">
                    <button
                      onClick={() => handleAskAi("Generate a comprehensive AI Study Guide for this chapter including:\n1. 📌 Executive Summary\n2. 🔑 Key Discussion Points & Essential Questions\n3. 💡 Core Vocabulary & Key Terms\n4. 📝 Classroom / Self-Study Activity Suggestions")}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-600 text-white border border-indigo-500 shrink-0 hover:bg-indigo-700 cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-200" />
                      <span>📘 AI Study Guide</span>
                    </button>
                    <button
                      onClick={() => handleAskAi("Explain this chapter simply in 3 key sentences.")}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white dark:bg-zinc-800 text-purple-900 dark:text-purple-200 border border-purple-200 shrink-0 hover:bg-purple-100 cursor-pointer"
                    >
                      💡 Explain Simply
                    </button>
                    <button
                      onClick={() => handleAskAi("What are the core takeaways and main concepts of this chapter?")}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white dark:bg-zinc-800 text-purple-900 dark:text-purple-200 border border-purple-200 shrink-0 hover:bg-purple-100 cursor-pointer"
                    >
                      🎯 Key Takeaways
                    </button>
                    <button
                      onClick={() => handleAskAi("Generate 3 thought-provoking discussion questions based on this chapter.")}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white dark:bg-zinc-800 text-purple-900 dark:text-purple-200 border border-purple-200 shrink-0 hover:bg-purple-100 cursor-pointer"
                    >
                      ❓ 3 Questions
                    </button>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
                    {aiChatMessages.length === 0 && (
                      <div className="text-center py-8 space-y-2 text-purple-800 dark:text-purple-300">
                        <HelpCircle className="w-8 h-8 text-purple-400 mx-auto" />
                        <p className="font-bold">Ask anything about this chapter!</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                          Get instant explanations, summary breakdowns, or classroom activity suggestions.
                        </p>
                      </div>
                    )}

                    {aiChatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'model' && (
                          <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                            🤖
                          </div>
                        )}
                        <div
                          className={`p-2.5 rounded-2xl max-w-[85%] leading-relaxed whitespace-pre-wrap ${
                            msg.role === 'user'
                              ? 'bg-purple-600 text-white font-medium rounded-tr-none'
                              : 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 border border-purple-100 dark:border-zinc-700 shadow-2xs rounded-tl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}

                    {isAiThinking && (
                      <div className="flex gap-2 items-center text-purple-700 dark:text-purple-300 font-medium text-xs">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                        <span>AI Tutor is analyzing chapter text...</span>
                      </div>
                    )}

                    {aiError && (
                      <div className="p-2 rounded-xl bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200">
                        {aiError}
                      </div>
                    )}

                    <div ref={chatBottomRef} />
                  </div>

                  {/* Chat Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAskAi();
                    }}
                    className="p-3 border-t border-current/10 bg-white dark:bg-zinc-800 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      placeholder="Ask a question about this chapter..."
                      className="flex-1 bg-purple-50/50 dark:bg-zinc-900 border border-purple-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={isAiThinking || !aiQuestion.trim()}
                      className="p-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white transition cursor-pointer shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Chapter Navigation Bar */}
          <div className="p-3 border-t flex items-center justify-between gap-3 shrink-0 bg-black/5 dark:bg-white/5">
            <button
              type="button"
              onClick={() => {
                if (currentChapterIndex > 0) {
                  setCurrentChapterIndex(prev => prev - 1);
                  if (isSpeaking && 'speechSynthesis' in window) window.speechSynthesis.cancel();
                  setIsSpeaking(false);
                }
              }}
              disabled={currentChapterIndex === 0}
              className="px-3 py-1.5 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 text-xs font-bold cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Chapter</span>
            </button>

            <span className="text-xs font-mono font-bold opacity-70">
              {currentChapterIndex + 1} / {book.chapters.length}
            </span>

            <button
              type="button"
              onClick={() => {
                if (currentChapterIndex < book.chapters.length - 1) {
                  setCurrentChapterIndex(prev => prev + 1);
                  if (isSpeaking && 'speechSynthesis' in window) window.speechSynthesis.cancel();
                  setIsSpeaking(false);
                }
              }}
              disabled={currentChapterIndex === book.chapters.length - 1}
              className="px-3 py-1.5 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 text-xs font-bold cursor-pointer"
            >
              <span>Next Chapter</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Chapter-by-Chapter Conversational Podcast Modal */}
      <ConversationalPodcastModal
        isOpen={isPodcastOpen}
        onClose={() => setIsPodcastOpen(false)}
        materialsText={currentChapter.content}
        materialTitle={`${book.title} - Chapter ${currentChapterIndex + 1}: ${currentChapter.title}`}
        initialConfidence="low"
      />
    </AnimatePresence>
  );
}

