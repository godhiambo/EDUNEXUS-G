import React, { useState } from 'react';
import { 
  Bookmark, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  Brain, 
  Route, 
  Eye, 
  Users, 
  QrCode, 
  BookOpen, 
  Layers, 
  Filter,
  ArrowRight,
  Sliders,
  X
} from 'lucide-react';
import { QRTemplate, QRTargetType, QRCodeMapping } from '../types/qrMapping';
import { QRTemplateService } from '../services/qrTemplateService';

interface QRTemplateManagerProps {
  templates: QRTemplate[];
  onTemplatesChange: (updated: QRTemplate[]) => void;
  onApplyTemplate: (template: QRTemplate) => void;
  onClose?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Homework: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Revision: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Accessibility: 'bg-amber-100 text-amber-800 border-amber-200',
  'Parent Outreach': 'bg-rose-100 text-rose-800 border-rose-200',
  'Lab Activity': 'bg-purple-100 text-purple-800 border-purple-200',
  Custom: 'bg-slate-100 text-slate-800 border-slate-200'
};

const TARGET_TYPE_ICONS: Record<string, any> = {
  SOCRATIC_TUTOR: Brain,
  ADAPTIVE_PATHWAY: Route,
  PRECONFIGURED_UDL: Eye,
  PARENT_PLAYBOOK: Users
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  SOCRATIC_TUTOR: 'Socratic AI Tutor',
  ADAPTIVE_PATHWAY: 'Adaptive Pathway',
  PRECONFIGURED_UDL: 'Pre-configured UDL',
  PARENT_PLAYBOOK: 'Parent Playbook'
};

export const QRTemplateManager: React.FC<QRTemplateManagerProps> = ({
  templates,
  onTemplatesChange,
  onApplyTemplate,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);

  // Form State for creating custom template
  const [tmplName, setTmplName] = useState('');
  const [tmplCategory, setTmplCategory] = useState<QRTemplate['category']>('Homework');
  const [tmplDesc, setTmplDesc] = useState('');
  const [tmplTargetType, setTmplTargetType] = useState<QRTargetType>('SOCRATIC_TUTOR');
  const [tmplColor, setTmplColor] = useState('#6366f1');
  const [tmplHeader, setTmplHeader] = useState('');
  
  // Socratic fields
  const [socraticPrompt, setSocraticPrompt] = useState('Guide the student through homework scaffolding step-by-step.');
  // Adaptive fields
  const [adaptiveTopic, setAdaptiveTopic] = useState('Fractions & Decimals');
  const [adaptiveSubject, setAdaptiveSubject] = useState('Mathematics');
  // UDL fields
  const [udlDyslexia, setUdlDyslexia] = useState(true);
  const [udlAdhd, setUdlAdhd] = useState(true);
  // Parent fields
  const [parentMessage, setParentMessage] = useState('Scan to view weekly CBC progress report & streaks.');

  const categories = ['All', 'Homework', 'Revision', 'Accessibility', 'Parent Outreach', 'Lab Activity', 'Custom'];

  const filteredTemplates = templates.filter(t => {
    if (selectedCategory === 'All') return true;
    return t.category === selectedCategory;
  });

  const handleApply = (template: QRTemplate) => {
    setAppliedTemplateId(template.id);
    onApplyTemplate(template);
    setTimeout(() => {
      setAppliedTemplateId(null);
    }, 1200);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this custom template preset?')) {
      const updated = QRTemplateService.deleteTemplate(id);
      onTemplatesChange(updated);
    }
  };

  const handleCreateTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmplName.trim()) return;

    const newTemplate: QRTemplate = {
      id: `tmpl-custom-${Date.now()}`,
      name: tmplName.trim(),
      category: tmplCategory,
      description: tmplDesc.trim() || `${tmplCategory} preset redirection template.`,
      targetType: tmplTargetType,
      defaultBrandColor: tmplColor,
      defaultLabelHeader: tmplHeader.toUpperCase() || `${tmplCategory.toUpperCase()} PRESET`,
      createdAt: new Date().toISOString(),
      isBuiltIn: false,
      targetPayload: {}
    };

    if (tmplTargetType === 'SOCRATIC_TUTOR') {
      newTemplate.targetPayload.socratic = {
        socraticPrompt,
        initialMode: 'chat_tutor',
        suggestedQuestions: ['What is the first step?', 'Can you explain your thinking?']
      };
    } else if (tmplTargetType === 'ADAPTIVE_PATHWAY') {
      newTemplate.targetPayload.adaptive = {
        subject: adaptiveSubject,
        topic: adaptiveTopic,
        subtopic: 'Preset Subtopic',
        nodeId: `node-${Date.now()}`,
        autoTriggerLowDifficulty: true,
        rootActivitiesCount: 3
      };
    } else if (tmplTargetType === 'PRECONFIGURED_UDL') {
      newTemplate.targetPayload.udl = {
        useDyslexicFont: udlDyslexia,
        lineSpacing: 'relaxed',
        fontSize: 'large',
        adhdMilestones: udlAdhd,
        highContrast: false,
        simplifyVocabulary: true
      };
    } else if (tmplTargetType === 'PARENT_PLAYBOOK') {
      newTemplate.targetPayload.parent = {
        targetSection: 'progress_streaks',
        customParentMessage: parentMessage
      };
    }

    const updated = QRTemplateService.saveTemplate(newTemplate);
    onTemplatesChange(updated);
    setIsCreateModalOpen(false);
    
    // Reset Form
    setTmplName('');
    setTmplDesc('');
  };

  return (
    <div className="bg-white border border-[#e5e1da] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header & Section Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200/60">
              <Bookmark className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 font-serif">Redirection Template Library</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 text-indigo-800">
              {templates.length} Presets
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Save and reuse standard redirection presets (e.g. Homework Socratic prompts, Revision paths, UDL accessibility configs) to instantly map new QR codes.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="min-h-[44px] px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Template</span>
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
              title="Close templates view"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
          <Filter className="w-3.5 h-3.5" /> Category:
        </span>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer border ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map(tmpl => {
          const IconComp = TARGET_TYPE_ICONS[tmpl.targetType] || QrCode;
          const isApplied = appliedTemplateId === tmpl.id;
          const categoryBadge = CATEGORY_COLORS[tmpl.category] || CATEGORY_COLORS.Custom;

          return (
            <div
              key={tmpl.id}
              className="bg-white border border-slate-200/90 hover:border-indigo-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 group relative"
            >
              <div className="space-y-3">
                {/* Top badges */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${categoryBadge}`}>
                    {tmpl.category}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: tmpl.defaultBrandColor || '#6366f1' }}
                    />
                    <span className="text-[10px] font-bold text-slate-500 font-mono">
                      {TARGET_TYPE_LABELS[tmpl.targetType]}
                    </span>
                  </div>
                </div>

                {/* Template Title & Desc */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif group-hover:text-indigo-600 transition">
                    {tmpl.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>

                {/* Payload Configuration Highlights */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Configured Settings:
                  </span>

                  {tmpl.targetType === 'SOCRATIC_TUTOR' && tmpl.targetPayload.socratic && (
                    <div className="text-slate-700 italic text-[11px] line-clamp-2">
                      "{tmpl.targetPayload.socratic.socraticPrompt}"
                    </div>
                  )}

                  {tmpl.targetType === 'ADAPTIVE_PATHWAY' && tmpl.targetPayload.adaptive && (
                    <div className="flex flex-wrap gap-1 text-[11px]">
                      <span className="bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded border border-emerald-200">
                        {tmpl.targetPayload.adaptive.topic}
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded border border-emerald-200">
                        Auto-Low Scaffolding
                      </span>
                    </div>
                  )}

                  {tmpl.targetType === 'PRECONFIGURED_UDL' && tmpl.targetPayload.udl && (
                    <div className="flex flex-wrap gap-1 text-[11px]">
                      {tmpl.targetPayload.udl.useDyslexicFont && (
                        <span className="bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                          Dyslexic Typography
                        </span>
                      )}
                      {tmpl.targetPayload.udl.adhdMilestones && (
                        <span className="bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                          ADHD Milestones
                        </span>
                      )}
                      {tmpl.targetPayload.udl.lineSpacing && (
                        <span className="bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                          {tmpl.targetPayload.udl.lineSpacing} spacing
                        </span>
                      )}
                    </div>
                  )}

                  {tmpl.targetType === 'PARENT_PLAYBOOK' && tmpl.targetPayload.parent && (
                    <div className="text-slate-700 text-[11px] line-clamp-2">
                      💬 {tmpl.targetPayload.parent.customParentMessage}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleApply(tmpl)}
                  className={`flex-1 min-h-[44px] px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                    isApplied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#5f6f52] hover:bg-[#4a5840] text-white'
                  }`}
                >
                  {isApplied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Template Applied!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      <span>Use Template to Map QR</span>
                    </>
                  )}
                </button>

                {!tmpl.isBuiltIn && (
                  <button
                    onClick={(e) => handleDelete(tmpl.id, e)}
                    className="p-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-xl transition cursor-pointer"
                    title="Delete custom preset template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Creating Custom Template */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <Sliders className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 font-serif">Save New Redirection Preset Template</h3>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Template Name *</label>
                  <input
                    type="text"
                    required
                    value={tmplName}
                    onChange={e => setTmplName(e.target.value)}
                    placeholder="e.g. Science Revision Scaffolding"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={tmplCategory}
                    onChange={e => setTmplCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Homework">Homework</option>
                    <option value="Revision">Revision</option>
                    <option value="Accessibility">Accessibility</option>
                    <option value="Parent Outreach">Parent Outreach</option>
                    <option value="Lab Activity">Lab Activity</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Template Description</label>
                <textarea
                  rows={2}
                  value={tmplDesc}
                  onChange={e => setTmplDesc(e.target.value)}
                  placeholder="Describe when educators should use this preset..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">EduNexus Target Module</label>
                  <select
                    value={tmplTargetType}
                    onChange={e => setTmplTargetType(e.target.value as QRTargetType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-serif font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="SOCRATIC_TUTOR">Socratic AI Tutor</option>
                    <option value="ADAPTIVE_PATHWAY">Adaptive Pathway</option>
                    <option value="PRECONFIGURED_UDL">Pre-configured UDL</option>
                    <option value="PARENT_PLAYBOOK">Parent Playbook</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Default Label Header</label>
                  <input
                    type="text"
                    value={tmplHeader}
                    onChange={e => setTmplHeader(e.target.value)}
                    placeholder="e.g. SCIENCE REVISION TOUCHPOINT"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl uppercase font-mono text-[11px] focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Specific Module Inputs */}
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-3">
                <span className="font-extrabold text-indigo-900 block font-serif">
                  Configure Preset Payload Details
                </span>

                {tmplTargetType === 'SOCRATIC_TUTOR' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Socratic System Prompt</label>
                    <textarea
                      rows={2}
                      value={socraticPrompt}
                      onChange={e => setSocraticPrompt(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                )}

                {tmplTargetType === 'ADAPTIVE_PATHWAY' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Subject</label>
                      <input
                        type="text"
                        value={adaptiveSubject}
                        onChange={e => setAdaptiveSubject(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Topic</label>
                      <input
                        type="text"
                        value={adaptiveTopic}
                        onChange={e => setAdaptiveTopic(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                )}

                {tmplTargetType === 'PRECONFIGURED_UDL' && (
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={udlDyslexia}
                        onChange={e => setUdlDyslexia(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Dyslexic Font</span>
                    </label>
                    <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={udlAdhd}
                        onChange={e => setUdlAdhd(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>ADHD Micro-Milestones</span>
                    </label>
                  </div>
                )}

                {tmplTargetType === 'PARENT_PLAYBOOK' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Parent Message</label>
                    <input
                      type="text"
                      value={parentMessage}
                      onChange={e => setParentMessage(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm cursor-pointer transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Template</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
