import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageOption } from '../context/LanguageContext';
import { 
  Globe, 
  Bot, 
  Monitor, 
  Check, 
  Sparkles, 
  Search, 
  Languages,
  Info,
  ChevronRight
} from 'lucide-react';

interface LanguageSwitcherProps {
  compact?: boolean;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { language, aiLanguage, setLanguage, setAiLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'ui' | 'ai'>('ai');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'All' | 'International' | 'Local & Regional'>('All');

  const selectedUiLangObj = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
  const selectedAiLangObj = SUPPORTED_LANGUAGES.find(l => l.code === aiLanguage) || SUPPORTED_LANGUAGES[0];

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(lang => {
    const matchesSearch = 
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'All' || lang.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories: ('All' | 'International' | 'Local & Regional')[] = ['All', 'International', 'Local & Regional'];

  return (
    <div className="bg-white border border-[#e5e1da] rounded-2xl shadow-xs p-5 md:p-6 space-y-6" id="language-switcher-component">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-[#5f6f52] shrink-0">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Multilingual & AI Response Preferences
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Select local or international languages for AI Tutor responses, quizzes, and app interface.
            </p>
          </div>
        </div>

        {/* Current Active Language Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Monitor className="w-3.5 h-3.5 text-slate-400" />
            <span>UI: {selectedUiLangObj.flag} {selectedUiLangObj.nativeName}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black text-[#5f6f52]">
            <Bot className="w-3.5 h-3.5 text-[#5f6f52]" />
            <span>AI: {selectedAiLangObj.flag} {selectedAiLangObj.nativeName}</span>
          </div>
        </div>
      </div>

      {/* Target Selector Selector Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-100/80 p-1.5 rounded-xl">
        <div className="grid grid-cols-2 gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Bot className="w-4 h-4 text-[#5f6f52]" />
            <span>AI Response & Tutor Language</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ui')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'ui'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Monitor className="w-4 h-4 text-slate-500" />
            <span>App Interface Language</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-500 font-semibold px-2 text-center sm:text-right">
          Editing: <strong className="text-slate-800">{activeTab === 'ai' ? 'AI Generator & Tutor Target' : 'App UI Workspace'}</strong>
        </span>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search language (e.g., Swahili, Luganda, French, Sheng)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition shadow-2xs"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                filterCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Language Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
        {filteredLanguages.map((langOpt: LanguageOption) => {
          const isSelected = activeTab === 'ai' ? aiLanguage === langOpt.code : language === langOpt.code;

          return (
            <div
              key={langOpt.code}
              onClick={() => {
                if (activeTab === 'ai') {
                  setAiLanguage(langOpt.code);
                } else {
                  setLanguage(langOpt.code);
                }
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-2 group ${
                isSelected
                  ? 'bg-emerald-50/70 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl leading-none">{langOpt.flag}</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-950 flex items-center gap-1">
                      {langOpt.name}
                    </h4>
                    <p className="text-[11px] font-bold text-[#5f6f52]">
                      {langOpt.nativeName}
                    </p>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 shrink-0">
                    {langOpt.category === 'Local & Regional' ? 'Local' : 'Global'}
                  </span>
                )}
              </div>

              <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                {langOpt.description}
              </p>

              {isSelected && (
                <div className="pt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Active for {activeTab === 'ai' ? 'AI Tutor & Generators' : 'Interface'}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredLanguages.length === 0 && (
        <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-1">
          <p className="text-xs font-bold text-slate-700">No matching languages found</p>
          <p className="text-[11px] text-slate-500">Try searching for a different language name or clear the filter.</p>
        </div>
      )}

      {/* Informational Guidance Box for Parents & Students */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900/90 leading-relaxed font-medium space-y-1">
          <p className="font-bold text-amber-950">
            💡 Did you know? Students & Parents can ask in ANY language!
          </p>
          <p className="text-[11px]">
            Even if your prompt is typed in Swahili, Luganda, French, Sheng, or English, the EduNexus AI Tutor will automatically detect your question and respond in your selected AI target language (<strong className="text-amber-950">{selectedAiLangObj.name}</strong>).
          </p>
        </div>
      </div>
    </div>
  );
}
