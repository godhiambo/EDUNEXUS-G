import React, { useState } from 'react';
import { motion } from 'motion/react';
import { OpenBook } from '../data/openBooksData';
import { BookOpen, Sparkles, Check, Download, Tag, Gauge, User, Award, ExternalLink } from 'lucide-react';

interface Book3DCardProps {
  key?: string | number;
  book: OpenBook;
  onRead: (book: OpenBook) => void;
  onImport?: (book: OpenBook) => void;
  isImported?: boolean;
  recInfo?: { reason: string } | null;
  bookDifficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  searchFilter?: string;
  onSubjectTagClick?: (subject: string) => void;
  variant?: 'grid' | 'compact';
}

const playPageTurnSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.12);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.12);
  } catch (e) {
    // Audio fail safe
  }
};

export default function Book3DCard({
  book,
  onRead,
  onImport,
  isImported = false,
  recInfo,
  bookDifficulty = 'Intermediate',
  searchFilter = '',
  onSubjectTagClick,
  variant = 'grid'
}: Book3DCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const difficultyColors = {
    Beginner: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
    Intermediate: 'bg-amber-50 text-amber-900 border-amber-200/90',
    Advanced: 'bg-purple-50 text-purple-900 border-purple-200/90'
  };

  const handleCardClick = () => {
    playPageTurnSound();
    setIsOpen(true);
    setTimeout(() => {
      onRead(book);
      setIsOpen(false);
    }, 450);
  };

  const handleMouseEnter = () => {
    if (!isHovered) {
      playPageTurnSound();
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  if (variant === 'compact') {
    return (
      <div
        className="bg-white rounded-2xl border border-slate-200 p-3.5 hover:border-amber-400/80 hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-3 group relative perspective-[1000px]"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-start gap-3">
          {/* 3D Compact Book Cover */}
          <div
            onClick={handleCardClick}
            className="w-16 h-22 relative cursor-pointer shrink-0 perspective-[800px] select-none"
            title="Click to open 3D reader view"
          >
            {/* Underneath Paper Page Stack */}
            <div className="absolute inset-0 rounded-xl bg-[#fdfbf7] border border-amber-200 shadow-inner flex flex-col justify-between p-1.5 overflow-hidden border-r-4 border-amber-300/80">
              <div className="space-y-1">
                <div className="h-1 w-full bg-slate-300/50 rounded" />
                <div className="h-1 w-4/5 bg-slate-300/40 rounded" />
                <div className="h-1 w-3/5 bg-slate-300/30 rounded" />
              </div>
              <span className="text-[7px] font-bold text-amber-800 uppercase tracking-tighter">PAGE 1</span>
            </div>

            {/* 3D Folding Cover Flap */}
            <motion.div
              animate={{
                rotateY: isOpen ? -135 : isHovered ? -35 : 0,
                boxShadow: isHovered
                  ? '-8px 10px 18px rgba(0,0,0,0.25)'
                  : '0px 2px 5px rgba(0,0,0,0.15)'
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
              className={`absolute inset-0 rounded-xl bg-gradient-to-br ${book.coverBg} flex flex-col items-center justify-between p-2 text-white border-l-2 border-amber-950/40 border-r border-t border-b border-white/20`}
            >
              <span className="text-xl drop-shadow-sm">{book.coverEmoji}</span>
              <span className="text-[7px] font-extrabold uppercase tracking-widest bg-black/30 px-1.5 py-0.5 rounded backdrop-blur-xs">
                {book.language?.slice(0, 3) || 'ENG'}
              </span>

              {/* Page stack depth ridges on right edge */}
              <div className="absolute right-0 top-1 bottom-1 w-1 bg-gradient-to-r from-amber-100 to-slate-200 opacity-90 rounded-r flex flex-col justify-around py-1">
                <div className="h-0.5 w-full bg-amber-900/20" />
                <div className="h-0.5 w-full bg-amber-900/20" />
              </div>
            </motion.div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
                {book.category}
              </span>
              <span className="text-[9px] font-semibold text-slate-400 font-mono">
                {book.pageCount} pages
              </span>
            </div>

            <h4
              onClick={handleCardClick}
              className="font-extrabold text-xs text-slate-800 mt-1 hover:text-amber-800 transition truncate cursor-pointer"
              title={book.title}
            >
              {book.title}
            </h4>
            <p className="text-[10px] font-semibold text-slate-500 truncate">
              By {book.author}
            </p>
            <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {book.summary}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
              {book.gradeLevel}
            </span>
            <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100">
              {book.license.split('(')[0]}
            </span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={handleCardClick}
              className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-amber-950 rounded-lg text-[10px] font-extrabold transition flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <BookOpen className="w-3 h-3" />
              <span>Read Online</span>
            </button>

            {onImport && (
              <button
                type="button"
                onClick={() => onImport(book)}
                disabled={isImported}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                  isImported
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {isImported ? <Check className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                <span>{isImported ? 'Saved' : 'Import'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white border border-slate-200 hover:border-amber-400 hover:shadow-2xl transition-all duration-300 rounded-3xl p-5 flex flex-col justify-between group relative overflow-hidden perspective-[1200px]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="space-y-3">
        {/* 3D BOOK COVER DISPLAY AREA */}
        <div
          onClick={handleCardClick}
          className="w-full h-36 relative rounded-2xl cursor-pointer perspective-[1000px] select-none"
          title="Click to open 3D interactive book reader"
        >
          {/* UNDERLYING PAPER PAGE STACK */}
          <div className="absolute inset-0 rounded-2xl bg-[#fdfbf7] dark:bg-zinc-800 border border-amber-200/90 shadow-inner p-4 flex flex-col justify-between overflow-hidden border-r-8 border-amber-300/70">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-1.5 text-[10px] font-mono text-amber-900/80 font-extrabold">
              <span>BOOK PREVIEW • CH. 1</span>
              <span className="flex items-center gap-1 text-amber-700">
                <Award className="w-3 h-3" /> +150 XP
              </span>
            </div>

            <div className="space-y-1 my-auto">
              <p className="text-[11px] font-serif text-slate-700 line-clamp-2 leading-relaxed italic">
                “{book.summary.slice(0, 95)}...”
              </p>
            </div>

            <div className="flex items-center justify-between text-[9px] font-extrabold uppercase text-amber-800 pt-1 border-t border-amber-200/50">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-amber-600" /> Tap to Unfold Book
              </span>
              <span>{book.pageCount} Pages</span>
            </div>
          </div>

          {/* 3D FOLDING COVER FLAP */}
          <motion.div
            animate={{
              rotateY: isOpen ? -140 : isHovered ? -38 : 0,
              boxShadow: isHovered
                ? '-12px 14px 24px rgba(0,0,0,0.3)'
                : '0px 4px 10px rgba(0,0,0,0.12)'
            }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
            className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${book.coverBg} text-white p-4 flex flex-col justify-between border-l-4 border-amber-950/50 border-r border-t border-b border-white/20 overflow-hidden`}
          >
            {/* Spine Highlight Groove */}
            <div className="absolute left-1 top-0 bottom-0 w-1 bg-white/20 blur-[1px]" />

            <div className="flex items-center justify-between relative z-10">
              <span className="text-3xl drop-shadow-md">{book.coverEmoji}</span>
              <span className="text-[9px] uppercase font-extrabold tracking-widest bg-black/30 backdrop-blur-xs text-white px-2.5 py-1 rounded-full border border-white/20">
                {book.license.split(' ')[0]}
              </span>
            </div>

            <div className="relative z-10">
              <h5 className="font-extrabold text-xs text-white line-clamp-1 drop-shadow-sm">
                {book.title}
              </h5>
              <p className="text-[10px] opacity-80 font-medium">
                By {book.author}
              </p>
            </div>

            {/* Simulated stacked page ridges on the right edge */}
            <div className="absolute right-0 top-1 bottom-1 w-1.5 bg-gradient-to-r from-amber-100 to-slate-200 opacity-90 rounded-r flex flex-col justify-around py-1">
              <div className="h-0.5 w-full bg-amber-900/25" />
              <div className="h-0.5 w-full bg-amber-900/25" />
              <div className="h-0.5 w-full bg-amber-900/25" />
            </div>
          </motion.div>
        </div>

        {/* AI Recommendation Badge */}
        {recInfo && (
          <div className="bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 p-[1px] rounded-2xl shadow-2xs">
            <div className="bg-gradient-to-r from-amber-50 via-indigo-50/90 to-purple-50 text-indigo-950 px-3 py-1.5 rounded-[15px] flex items-center justify-between gap-1.5 text-xs font-bold border border-indigo-200/60">
              <div className="flex items-center gap-1.5 shrink-0 text-indigo-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400 animate-pulse" />
                <span className="font-extrabold text-[10px] uppercase tracking-wider text-indigo-900">AI Recommended</span>
              </div>
              <span className="text-[10px] text-indigo-700 font-medium truncate max-w-[170px]" title={recInfo.reason}>
                {recInfo.reason}
              </span>
            </div>
          </div>
        )}

        {/* Metadata Badges */}
        <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-slate-500 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {onSubjectTagClick ? (
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => onSubjectTagClick(book.subject)}
                title={`Click to filter resources by "${book.subject}"`}
                className={`px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 group/pill ${
                  searchFilter.trim().toLowerCase() === book.subject.trim().toLowerCase()
                    ? 'bg-amber-700 text-white border-amber-700 shadow-xs ring-2 ring-amber-500/20'
                    : 'bg-amber-50 text-amber-900 border-amber-200/80 hover:bg-amber-100 hover:border-amber-300 hover:shadow-2xs'
                }`}
              >
                <Tag className={`w-3 h-3 text-amber-600 transition-transform ${
                  searchFilter.trim().toLowerCase() === book.subject.trim().toLowerCase()
                    ? 'text-white'
                    : 'group-hover/pill:scale-110'
                }`} />
                <span>{book.subject}</span>
              </motion.button>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 text-[10px] font-bold">
                {book.subject}
              </span>
            )}

            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-extrabold flex items-center gap-1 ${difficultyColors[bookDifficulty]}`}>
              <Gauge className="w-2.5 h-2.5 shrink-0" />
              <span>{bookDifficulty}</span>
            </span>
          </div>
          <span className="text-slate-400 font-mono text-[10px] font-bold">{book.pageCount} pages</span>
        </div>

        {/* Title & Author */}
        <div>
          <h4
            onClick={handleCardClick}
            className="text-base font-bold text-slate-900 leading-snug group-hover:text-amber-800 transition-colors line-clamp-2 cursor-pointer"
          >
            {book.title}
          </h4>
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
            <User className="w-3 h-3 text-slate-400 shrink-0" /> {book.author}
          </p>
        </div>

        {/* Summary */}
        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
          {book.summary}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
        <button
          onClick={handleCardClick}
          className="flex-1 min-w-[110px] bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-amber-950 rounded-xl py-2 px-3 text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:scale-[1.02]"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Open 3D Reader</span>
        </button>

        {onImport && (
          <button
            onClick={() => onImport(book)}
            className={`rounded-xl py-2 px-3 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
              isImported
                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
            }`}
          >
            {isImported ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Import</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
