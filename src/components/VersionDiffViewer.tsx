import React, { useState } from 'react';
import { diffWords, DiffPart } from '../utils/diff';
import { ArrowRight, Info, RotateCcw, Columns, AlignLeft } from 'lucide-react';

interface VersionDiffViewerProps {
  leftTitle: string;
  leftContent: string;
  rightTitle: string;
  rightContent: string;
  leftLabel: string;
  rightLabel: string;
  onRestore: () => void;
  onExit: () => void;
  isRestoring?: boolean;
}

export const VersionDiffViewer: React.FC<VersionDiffViewerProps> = ({
  leftTitle,
  leftContent,
  rightTitle,
  rightContent,
  leftLabel,
  rightLabel,
  onRestore,
  onExit,
  isRestoring = false
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  
  const titleDiff = diffWords(leftTitle, rightTitle);
  const contentDiff = diffWords(leftContent, rightContent);

  // Compute quick statistics of changes
  const stats = contentDiff.reduce(
    (acc, part) => {
      if (part.added) {
        acc.addedWords += part.value.trim().split(/\s+/).filter(Boolean).length;
      } else if (part.removed) {
        acc.removedWords += part.value.trim().split(/\s+/).filter(Boolean).length;
      }
      return acc;
    },
    { addedWords: 0, removedWords: 0 }
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Comparison Top Alert/Bar */}
      <div className="p-4 bg-indigo-50/90 border border-indigo-100 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
              Version Comparison Engine
            </h4>
            <p className="text-[11px] text-indigo-800 font-medium mt-0.5">
              Comparing <span className="font-bold underline text-indigo-950">{leftLabel}</span> (Base) <ArrowRight className="inline w-3 h-3 mx-1 text-indigo-600" /> <span className="font-bold underline text-emerald-800">{rightLabel}</span> (Target).
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono">
              <span className="inline-flex items-center gap-1 text-emerald-750 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-100">
                +{stats.addedWords} additions
              </span>
              <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold border border-rose-100">
                -{stats.removedWords} deletions
              </span>
            </div>
          </div>
        </div>

        {/* View mode toggle and main actions */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto">
          {/* Toggle pill segmented control */}
          <div className="flex bg-slate-100 border border-slate-200 p-0.5 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setViewMode('split')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'split'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'unified'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Unified View</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onExit}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              Exit
            </button>
            <button
              onClick={onRestore}
              disabled={isRestoring}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold text-white bg-[#5f6f52] hover:bg-[#4d5a42] rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isRestoring ? 'Restoring...' : 'Restore target'}</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'split' ? (
        /* SIDE BY SIDE / SPLIT VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LEFT COLUMN: BASE / ORIGINAL */}
          <div className="bg-[#fafaf9] border border-[#e5e1da] shadow-sm rounded-2xl overflow-hidden p-6 md:p-8 font-sans flex flex-col">
            <div className="flex items-center justify-between border-b border-dashed border-[#e5e1da] pb-3 mb-5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5f6f52] font-mono">
                Base Version: {leftLabel}
              </span>
              <span className="text-[9px] bg-[#5f6f52]/10 text-[#5f6f52] font-bold px-2 py-0.5 rounded-full uppercase">
                Original state
              </span>
            </div>

            {/* Title */}
            <div className="border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-xl font-bold text-slate-800 leading-tight">
                {titleDiff.map((part, idx) => {
                  if (part.added) return null; // hide added on the left
                  if (part.removed) {
                    return (
                      <del
                        key={`title-left-rem-${idx}`}
                        className="bg-rose-100 text-rose-950 no-underline line-through px-1 py-0.5 rounded mx-0.5 font-bold border border-rose-200"
                      >
                        {part.value}
                      </del>
                    );
                  }
                  return <span key={`title-left-normal-${idx}`}>{part.value}</span>;
                })}
              </h2>
            </div>

            {/* Body content */}
            <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed font-mono text-[12.5px] whitespace-pre-wrap select-text flex-1">
              {contentDiff.map((part, idx) => {
                if (part.added) return null; // hide added on the left
                if (part.removed) {
                  return (
                    <del
                      key={`content-left-rem-${idx}`}
                      className="bg-rose-100 text-rose-950 no-underline line-through px-0.5 py-0.5 rounded font-bold border-b border-rose-250 inline-block"
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {part.value}
                    </del>
                  );
                }
                return (
                  <span key={`content-left-normal-${idx}`} className="text-slate-700" style={{ whiteSpace: 'pre-wrap' }}>
                    {part.value}
                  </span>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: TARGET / COMPARISON */}
          <div className="bg-[#fcfbf9] border border-emerald-150 shadow-sm rounded-2xl overflow-hidden p-6 md:p-8 font-sans flex flex-col">
            <div className="flex items-center justify-between border-b border-dashed border-emerald-150 pb-3 mb-5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 font-mono">
                Target Version: {rightLabel}
              </span>
              <span className="text-[9px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase border border-emerald-100">
                Revision changes
              </span>
            </div>

            {/* Title */}
            <div className="border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-xl font-bold text-slate-800 leading-tight">
                {titleDiff.map((part, idx) => {
                  if (part.removed) return null; // hide removed on the right
                  if (part.added) {
                    return (
                      <ins
                        key={`title-right-add-${idx}`}
                        className="bg-emerald-100 text-emerald-950 no-underline px-1 py-0.5 rounded mx-0.5 font-bold border border-emerald-200"
                      >
                        {part.value}
                      </ins>
                    );
                  }
                  return <span key={`title-right-normal-${idx}`}>{part.value}</span>;
                })}
              </h2>
            </div>

            {/* Body content */}
            <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed font-mono text-[12.5px] whitespace-pre-wrap select-text flex-1">
              {contentDiff.map((part, idx) => {
                if (part.removed) return null; // hide removed on the right
                if (part.added) {
                  return (
                    <ins
                      key={`content-right-add-${idx}`}
                      className="bg-emerald-100 text-emerald-950 no-underline px-0.5 py-0.5 rounded font-bold border-b border-emerald-250 inline-block"
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {part.value}
                    </ins>
                  );
                }
                return (
                  <span key={`content-right-normal-${idx}`} className="text-slate-700" style={{ whiteSpace: 'pre-wrap' }}>
                    {part.value}
                  </span>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        /* UNIFIED INLINE VIEW */
        <div className="bg-white border border-slate-200 shadow-md rounded-2xl overflow-hidden p-6 md:p-8 font-sans">
          {/* Title Diff */}
          <div className="border-b border-slate-150 pb-4 mb-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 font-mono">Title Comparison (Unified)</p>
            <h2 className="text-xl font-bold text-slate-800 leading-tight">
              {titleDiff.map((part, idx) => {
                if (part.added) {
                  return (
                    <ins
                      key={`title-add-${idx}`}
                      className="bg-emerald-100 text-emerald-950 no-underline px-1 py-0.5 rounded mx-0.5 font-bold border border-emerald-200"
                    >
                      {part.value}
                    </ins>
                  );
                }
                if (part.removed) {
                  return (
                    <del
                      key={`title-rem-${idx}`}
                      className="bg-rose-100 text-rose-950 line-through px-1 py-0.5 rounded mx-0.5 font-bold border border-rose-200"
                    >
                      {part.value}
                    </del>
                  );
                }
                return <span key={`title-normal-${idx}`}>{part.value}</span>;
              })}
            </h2>
          </div>

          {/* Content Diff */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 font-mono">Document Body Changes (Unified)</p>
            <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed font-mono text-[12.5px] whitespace-pre-wrap select-text">
              {contentDiff.map((part, idx) => {
                if (part.added) {
                  return (
                    <ins
                      key={`content-add-${idx}`}
                      className="bg-emerald-100 text-emerald-950 no-underline px-0.5 py-0.5 rounded font-bold border-b border-emerald-250 inline-block"
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {part.value}
                    </ins>
                  );
                }
                if (part.removed) {
                  return (
                    <del
                      key={`content-rem-${idx}`}
                      className="bg-rose-100 text-rose-950 line-through px-0.5 py-0.5 rounded font-bold border-b border-rose-250 inline-block"
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {part.value}
                    </del>
                  );
                }
                return (
                  <span key={`content-normal-${idx}`} className="text-slate-700" style={{ whiteSpace: 'pre-wrap' }}>
                    {part.value}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
