import React, { useState, useEffect } from 'react';
import { GraduationCap, Sparkles } from 'lucide-react';
import { cbcSubjectsData } from '../data/cbcData';
import { EditableSelect } from './EditableSelect';

interface SetupFormProps {
  onStart: (path: {
    subject: string;
    strand: string;
    subStrand: string;
    concept: string;
    socraticMode: 'guided' | 'direct';
  }) => void;
}

export function SetupForm({ onStart }: SetupFormProps) {
  const [selectedCbcSubjectName, setSelectedCbcSubjectName] = useState<string>('');
  const [selectedCbcStrandName, setSelectedCbcStrandName] = useState<string>('');
  const [selectedCbcSubStrandName, setSelectedCbcSubStrandName] = useState<string>('');
  const [selectedCbcConceptName, setSelectedCbcConceptName] = useState<string>('');
  const [socraticMode, setSocraticMode] = useState<'guided' | 'direct'>('guided');

  // Cascade selections for CBC setup form - reset child fields when parent selection changes
  useEffect(() => {
    setSelectedCbcStrandName('');
    setSelectedCbcSubStrandName('');
    setSelectedCbcConceptName('');
  }, [selectedCbcSubjectName]);

  useEffect(() => {
    setSelectedCbcSubStrandName('');
    setSelectedCbcConceptName('');
  }, [selectedCbcStrandName]);

  useEffect(() => {
    setSelectedCbcConceptName('');
  }, [selectedCbcSubStrandName]);

  // Derived CBC options lookup
  const selectedCbcSubjectObj = cbcSubjectsData.find(s => s.name === selectedCbcSubjectName);
  const selectedCbcStrandObj = selectedCbcSubjectObj?.strands.find(st => st.name === selectedCbcStrandName);
  const selectedCbcSubStrandObj = selectedCbcStrandObj?.subStrands.find(ss => ss.name === selectedCbcSubStrandName);
  const selectedCbcConceptObj = selectedCbcSubStrandObj?.concepts.find(con => con.name === selectedCbcConceptName);

  const isStartDisabled = !selectedCbcSubjectName.trim() ||
                          !selectedCbcStrandName.trim() ||
                          !selectedCbcSubStrandName.trim() ||
                          !selectedCbcConceptName.trim();

  return (
    <div className="w-full max-w-xl bg-white border border-[#e5e1da] rounded-2xl p-6 shadow-xs space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-[#5f6f52]/10 text-[#5f6f52] rounded-2xl">
          <GraduationCap className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="font-serif font-bold text-xl text-slate-800">Kenyan CBC Lesson Designer</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Select your learning area and concept pathway. EduNexus AI Tutor will formulate a custom curriculum-aligned lesson with active Socratic scaffolding.
        </p>
      </div>

      <div className="space-y-4">
        {/* Subject Select */}
        <div className="space-y-1">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">Subject / Learning Area</label>
          <EditableSelect
            value={selectedCbcSubjectName}
            onChange={setSelectedCbcSubjectName}
            options={cbcSubjectsData.map(sub => sub.name)}
            placeholder="Select a Subject / Learning Area"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#5f6f52] transition-colors cursor-pointer"
          />
        </div>

        {/* Topic / Strand Select */}
        <div className="space-y-1">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">Topic / Strand</label>
          <EditableSelect
            value={selectedCbcStrandName}
            onChange={setSelectedCbcStrandName}
            disabled={!selectedCbcSubjectName}
            options={selectedCbcSubjectObj?.strands.map(str => str.name) || []}
            placeholder="Select a Topic / Strand"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#5f6f52] transition-colors cursor-pointer disabled:opacity-50"
          />
        </div>

        {/* Sub-strand Select */}
        <div className="space-y-1">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">Subtopic / Substrand</label>
          <EditableSelect
            value={selectedCbcSubStrandName}
            onChange={setSelectedCbcSubStrandName}
            disabled={!selectedCbcStrandName}
            options={selectedCbcStrandObj?.subStrands.map(subStr => subStr.name) || []}
            placeholder="Select a Subtopic / Substrand"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#5f6f52] transition-colors cursor-pointer disabled:opacity-50"
          />
        </div>

        {/* Concept Select */}
        <div className="space-y-1">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">Specific Concept</label>
          <EditableSelect
            value={selectedCbcConceptName}
            onChange={setSelectedCbcConceptName}
            disabled={!selectedCbcSubStrandName}
            options={selectedCbcSubStrandObj?.concepts.map(con => con.name) || []}
            placeholder="Select a Specific Concept"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#5f6f52] transition-colors cursor-pointer disabled:opacity-50"
          />
          
          {/* Short description of selected concept */}
          {selectedCbcConceptObj && (
            <p className="text-[10px] text-slate-400 leading-normal mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 animate-fadeIn">
              {selectedCbcConceptObj.description}
            </p>
          )}
        </div>

        {/* Socratic Mode / Tutor Dialogue Style Selector */}
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">TUTOR DIALOGUE STYLE</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSocraticMode('guided')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                socraticMode === 'guided'
                  ? 'border-[#5f6f52] bg-[#5f6f52]/5 text-[#5f6f52]'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100/50'
              }`}
            >
              <div>
                <span className="text-xs font-bold block">Guided Discovery</span>
                <span className="text-[10px] leading-relaxed text-slate-400 mt-1 block">
                  Active Socratic prompts with guiding questions to help you discover answers.
                </span>
              </div>
              <span className={`text-[9px] font-bold mt-2.5 px-1.5 py-0.5 rounded-full self-start ${
                socraticMode === 'guided' ? 'bg-[#5f6f52]/20 text-[#5f6f52]' : 'bg-slate-200/60 text-slate-500'
              }`}>
                Guided Socratic
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSocraticMode('direct')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                socraticMode === 'direct'
                  ? 'border-[#5f6f52] bg-[#5f6f52]/5 text-[#5f6f52]'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100/50'
              }`}
            >
              <div>
                <span className="text-xs font-bold block">Direct Explanation</span>
                <span className="text-[10px] leading-relaxed text-slate-400 mt-1 block">
                  Immediate, clear educational answers upfront, followed by comprehension checks.
                </span>
              </div>
              <span className={`text-[9px] font-bold mt-2.5 px-1.5 py-0.5 rounded-full self-start ${
                socraticMode === 'direct' ? 'bg-[#5f6f52]/20 text-[#5f6f52]' : 'bg-slate-200/60 text-slate-500'
              }`}>
                Direct Solutions
              </span>
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={() => onStart({
          subject: selectedCbcSubjectName,
          strand: selectedCbcStrandName,
          subStrand: selectedCbcSubStrandName,
          concept: selectedCbcConceptName,
          socraticMode
        })}
        disabled={isStartDisabled}
        className="w-full py-3 bg-[#5f6f52] hover:bg-[#4d5a42] text-white rounded-xl text-xs font-extrabold tracking-wider transition uppercase flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Sparkles className="w-4 h-4" />
        Start Learning Pathway
      </button>
    </div>
  );
}
