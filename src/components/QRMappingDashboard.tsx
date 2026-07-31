import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  Camera, 
  ExternalLink, 
  Sparkles, 
  Brain, 
  Route, 
  Eye, 
  Users, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Code2, 
  FileText, 
  RefreshCw,
  Share2,
  Info,
  X,
  Volume2,
  Wand2,
  Download,
  Bookmark,
  FileSpreadsheet,
  Accessibility,
  Calendar,
  Clock,
  Ban,
  Compass
} from 'lucide-react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { QRCodeMapping, QRTargetType, QRTargetPayload, QRTemplate } from '../types/qrMapping';
import { QRMappingService, INITIAL_QR_MAPPINGS } from '../services/qrMappingService';
import { QRTemplateService } from '../services/qrTemplateService';
import { QRAnalyticsChart } from './QRAnalyticsChart';
import { ResourceUtilizationSummary } from './ResourceUtilizationSummary';
import { QRTemplateManager } from './QRTemplateManager';
import { QRBulkUploadModal } from './QRBulkUploadModal';
import { QRScanAlertManager } from './QRScanAlertManager';
import { ClassroomScavengerHuntStudio } from './ClassroomScavengerHuntStudio';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLanguage } from '../context/LanguageContext';
import { SavedDocument } from '../types';

interface QRMappingDashboardProps {
  documents?: SavedDocument[];
  onNavigateToTutor?: (documentId?: string, prompt?: string) => void;
  onNavigateToAdaptivePath?: (subject?: string, topic?: string, lowDifficulty?: boolean) => void;
  onNavigateToParentPlaybook?: (studentName?: string, section?: string) => void;
  onSelectDocForReader?: (doc: SavedDocument) => void;
  onClose?: () => void;
}

export const QRMappingDashboard: React.FC<QRMappingDashboardProps> = ({
  documents = [],
  onNavigateToTutor,
  onNavigateToAdaptivePath,
  onNavigateToParentPlaybook,
  onSelectDocForReader,
  onClose
}) => {
  const { 
    setUseDyslexicFont, 
    setLineSpacing, 
    setFontSize, 
    setHighContrast, 
    setActiveLearnerProfile 
  } = useAccessibility();
  const { setLanguage, setAiLanguage } = useLanguage();

  const [mappings, setMappings] = useState<QRCodeMapping[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingMapping, setEditingMapping] = useState<QRCodeMapping | null>(null);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState<boolean>(false);
  const [isScavengerHuntModalOpen, setIsScavengerHuntModalOpen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // Form State for QR Generation
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAccessibilityNotes, setFormAccessibilityNotes] = useState('');
  const [formPhysicalTouchpoint, setFormPhysicalTouchpoint] = useState('');
  const [formShortId, setFormShortId] = useState('');
  const [formTargetType, setFormTargetType] = useState<QRTargetType>('SOCRATIC_TUTOR');
  const [formBrandColor, setFormBrandColor] = useState('#5f6f52');
  const [formLabelHeader, setFormLabelHeader] = useState('');
  const [formExpirationDate, setFormExpirationDate] = useState('');

  // Socratic Form Fields
  const [socDocTitle, setSocDocTitle] = useState('');
  const [socPrompt, setSocPrompt] = useState('Guide the student through core concepts using Socratic questions without providing direct solutions.');
  
  // Adaptive Pathway Form Fields
  const [adaptSubject, setAdaptSubject] = useState('Mathematics');
  const [adaptTopic, setAdaptTopic] = useState('Algebra & Equations');
  const [adaptSubtopic, setAdaptSubtopic] = useState('Linear Equations');
  const [adaptAutoLowDiff, setAdaptAutoLowDiff] = useState(true);
  const [adaptScaffolding, setAdaptScaffolding] = useState('Automatically presents entry-level visual manipulatives and lower difficulty activities upon scanning.');

  // UDL Accessibility Form Fields
  const [udlDyslexia, setUdlDyslexia] = useState(true);
  const [udlLineSpacing, setUdlLineSpacing] = useState<'normal' | 'relaxed' | 'loose'>('relaxed');
  const [udlFontSize, setUdlFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [udlAdhdMilestones, setUdlAdhdMilestones] = useState(true);
  const [udlEslLang, setUdlEslLang] = useState('sw');
  const [udlSimplifyVocab, setUdlSimplifyVocab] = useState(true);

  // Parent Playbook Form Fields
  const [parentStudentName, setParentStudentName] = useState('Amara Ochieng');
  const [parentTargetSection, setParentTargetSection] = useState<'progress_streaks' | 'milestones' | 'take_home_reports' | 'accessibility_sync'>('progress_streaks');
  const [parentCustomMessage, setParentCustomMessage] = useState('Welcome! Scan this QR code to review weekly learning milestones and sync accessibility preferences.');

  // Scanner Simulator Input
  const [scannerInputId, setScannerInputId] = useState('');

  // Template Management State
  const [templates, setTemplates] = useState<QRTemplate[]>([]);
  const [activeMainTab, setActiveMainTab] = useState<'mappings' | 'templates' | 'analytics' | 'utilization'>('mappings');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);

  // Load initial mappings & templates
  useEffect(() => {
    loadMappings();
    setTemplates(QRTemplateService.getTemplates());
  }, []);

  const handleApplyTemplate = (tmpl: QRTemplate) => {
    setEditingMapping(null);
    const autoShort = `qr-${Math.random().toString(36).substring(2, 7)}`;
    setFormShortId(autoShort);
    setFormTitle(`${tmpl.name} Touchpoint`);
    setFormDescription(tmpl.description);
    setFormAccessibilityNotes(tmpl.accessibilityNotes || '');
    setFormTargetType(tmpl.targetType);
    setFormBrandColor(tmpl.defaultBrandColor || '#5f6f52');
    setFormLabelHeader(tmpl.defaultLabelHeader || '');
    setFormExpirationDate(tmpl.expirationDate || '');

    if (tmpl.targetPayload.socratic) {
      setSocDocTitle(tmpl.targetPayload.socratic.documentTitle || '');
      setSocPrompt(tmpl.targetPayload.socratic.socraticPrompt || '');
    }
    if (tmpl.targetPayload.adaptive) {
      setAdaptSubject(tmpl.targetPayload.adaptive.subject || 'Mathematics');
      setAdaptTopic(tmpl.targetPayload.adaptive.topic || 'Fractions & Decimals');
      setAdaptSubtopic(tmpl.targetPayload.adaptive.subtopic || 'Foundational Review');
      setAdaptAutoLowDiff(tmpl.targetPayload.adaptive.autoTriggerLowDifficulty ?? true);
      setAdaptScaffolding(tmpl.targetPayload.adaptive.scaffoldingNotes || '');
    }
    if (tmpl.targetPayload.udl) {
      setUdlDyslexia(tmpl.targetPayload.udl.useDyslexicFont ?? true);
      setUdlLineSpacing(tmpl.targetPayload.udl.lineSpacing || 'relaxed');
      setUdlFontSize(tmpl.targetPayload.udl.fontSize || 'large');
      setUdlAdhdMilestones(tmpl.targetPayload.udl.adhdMilestones ?? true);
      setUdlEslLang(tmpl.targetPayload.udl.eslTargetLang || 'sw');
      setUdlSimplifyVocab(tmpl.targetPayload.udl.simplifyVocabulary ?? true);
    }
    if (tmpl.targetPayload.parent) {
      setParentStudentName(tmpl.targetPayload.parent.studentName || 'Amara Ochieng');
      setParentTargetSection(tmpl.targetPayload.parent.targetSection || 'progress_streaks');
      setParentCustomMessage(tmpl.targetPayload.parent.customParentMessage || '');
    }

    setIsCreateModalOpen(true);
    triggerToast(`Loaded preset template: ${tmpl.name}`);
  };

  const handleSaveMappingAsTemplate = (mapping: QRCodeMapping) => {
    const newTmpl: QRTemplate = {
      id: `tmpl-user-${Date.now()}`,
      name: `${mapping.title} Preset`,
      category: 'Custom',
      description: mapping.description || `Educator preset derived from ${mapping.physicalTouchpoint}`,
      targetType: mapping.targetType,
      defaultBrandColor: mapping.brandColor || '#5f6f52',
      defaultLabelHeader: mapping.labelHeader || `${mapping.targetType} PRESET`,
      accessibilityNotes: mapping.accessibilityNotes || formAccessibilityNotes,
      targetPayload: JSON.parse(JSON.stringify(mapping.targetPayload)),
      createdAt: new Date().toISOString(),
      isBuiltIn: false
    };

    const updated = QRTemplateService.saveTemplate(newTmpl);
    setTemplates(updated);
    triggerToast(`Saved "${newTmpl.name}" to Template Presets Library!`);
  };

  const loadMappings = async () => {
    setIsLoading(true);
    try {
      const data = await QRMappingService.getMappings();
      setMappings(data);
    } catch (e) {
      console.error('Failed to load QR mappings:', e);
      setMappings(INITIAL_QR_MAPPINGS);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = (mappingToEdit?: QRCodeMapping) => {
    if (mappingToEdit) {
      setEditingMapping(mappingToEdit);
      setFormTitle(mappingToEdit.title);
      setFormDescription(mappingToEdit.description);
      setFormAccessibilityNotes(mappingToEdit.accessibilityNotes || '');
      setFormPhysicalTouchpoint(mappingToEdit.physicalTouchpoint);
      setFormShortId(mappingToEdit.shortId);
      setFormTargetType(mappingToEdit.targetType);
      setFormBrandColor(mappingToEdit.brandColor || '#5f6f52');
      setFormLabelHeader(mappingToEdit.labelHeader || '');
      setFormExpirationDate(mappingToEdit.expirationDate || '');

      if (mappingToEdit.targetPayload.socratic) {
        setSocDocTitle(mappingToEdit.targetPayload.socratic.documentTitle || '');
        setSocPrompt(mappingToEdit.targetPayload.socratic.socraticPrompt || '');
      }
      if (mappingToEdit.targetPayload.adaptive) {
        setAdaptSubject(mappingToEdit.targetPayload.adaptive.subject);
        setAdaptTopic(mappingToEdit.targetPayload.adaptive.topic);
        setAdaptSubtopic(mappingToEdit.targetPayload.adaptive.subtopic);
        setAdaptAutoLowDiff(mappingToEdit.targetPayload.adaptive.autoTriggerLowDifficulty);
        setAdaptScaffolding(mappingToEdit.targetPayload.adaptive.scaffoldingNotes || '');
      }
      if (mappingToEdit.targetPayload.udl) {
        setUdlDyslexia(mappingToEdit.targetPayload.udl.useDyslexicFont);
        setUdlLineSpacing(mappingToEdit.targetPayload.udl.lineSpacing);
        setUdlFontSize(mappingToEdit.targetPayload.udl.fontSize);
        setUdlAdhdMilestones(mappingToEdit.targetPayload.udl.adhdMilestones);
        setUdlEslLang(mappingToEdit.targetPayload.udl.eslTargetLang || 'sw');
        setUdlSimplifyVocab(mappingToEdit.targetPayload.udl.simplifyVocabulary);
      }
      if (mappingToEdit.targetPayload.parent) {
        setParentStudentName(mappingToEdit.targetPayload.parent.studentName || 'Amara Ochieng');
        setParentTargetSection(mappingToEdit.targetPayload.parent.targetSection);
        setParentCustomMessage(mappingToEdit.targetPayload.parent.customParentMessage || '');
      }
    } else {
      setEditingMapping(null);
      const autoShort = `qr-${Math.random().toString(36).substring(2, 7)}`;
      setFormTitle('');
      setFormDescription('');
      setFormAccessibilityNotes('Scannable QR code touchpoint linking to interactive learning materials with auto-injected screen-reader support.');
      setFormPhysicalTouchpoint('');
      setFormShortId(autoShort);
      setFormTargetType('SOCRATIC_TUTOR');
      setFormBrandColor('#5f6f52');
      setFormLabelHeader('PHYSICAL TEXTBOOK TOUCHPOINT');
      setFormExpirationDate('');

      setSocDocTitle(documents[0]?.title || 'Grade 6 Science Reader');
      setSocPrompt('Guide the student through key concepts using scaffolded inquiry rather than direct answers.');

      setAdaptSubject('Mathematics');
      setAdaptTopic('Fractions & Decimals');
      setAdaptSubtopic('Adding Unlike Denominators');
      setAdaptAutoLowDiff(true);
      setAdaptScaffolding('Provides visual fraction strip manipulatives and step-by-step root activities.');

      setUdlDyslexia(true);
      setUdlLineSpacing('relaxed');
      setUdlFontSize('large');
      setUdlAdhdMilestones(true);
      setUdlEslLang('sw');
      setUdlSimplifyVocab(true);

      setParentStudentName('Amara Ochieng');
      setParentTargetSection('progress_streaks');
      setParentCustomMessage('Scan to view learning progress, streak milestones, and home accessibility options.');
    }
    setIsCreateModalOpen(true);
  };

  const handleDownloadQR = (mapping: QRCodeMapping, format: 'png' | 'svg') => {
    const shortId = mapping.shortId;
    const filename = `QR_${shortId.toUpperCase()}_EduNexus.${format}`;

    if (format === 'png') {
      const canvas = document.getElementById(`qr-canvas-${shortId}`) as HTMLCanvasElement;
      if (canvas) {
        // Create high-resolution canvas for crisp printing (scale x4)
        const printCanvas = document.createElement('canvas');
        const scale = 4;
        printCanvas.width = canvas.width * scale;
        printCanvas.height = canvas.height * scale;
        const ctx = printCanvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(canvas, 0, 0, printCanvas.width, printCanvas.height);
          const dataUrl = printCanvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = filename;
          link.href = dataUrl;
          link.click();
          triggerToast(`Downloaded high-res PNG (${printCanvas.width}x${printCanvas.height}px) for /qr/${shortId}`);
        }
      } else {
        alert('QR Canvas instance not ready. Please try again.');
      }
    } else if (format === 'svg') {
      const svgEl = document.getElementById(`qr-svg-${shortId}`);
      if (svgEl) {
        const serializer = new XMLSerializer();
        let svgSrc = serializer.serializeToString(svgEl);
        if (!svgSrc.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
          svgSrc = svgSrc.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        const blob = new Blob([svgSrc], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        triggerToast(`Downloaded scalable vector SVG for /qr/${shortId}`);
      } else {
        const canvas = document.getElementById(`qr-canvas-${shortId}`) as HTMLCanvasElement;
        if (canvas) {
          const dataUrl = canvas.toDataURL('image/png');
          const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"><image href="${dataUrl}" width="500" height="500"/></svg>`;
          const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = filename;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          triggerToast(`Downloaded vector SVG for /qr/${shortId}`);
        }
      }
    }
  };

  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formPhysicalTouchpoint || !formShortId) {
      alert('Please fill in all required fields (Title, Physical Touchpoint, and Short Redirection ID).');
      return;
    }

    const payload: QRTargetPayload = {};

    if (formTargetType === 'SOCRATIC_TUTOR') {
      payload.socratic = {
        documentTitle: socDocTitle,
        socraticPrompt: socPrompt,
        initialMode: 'interactive_reader'
      };
    } else if (formTargetType === 'ADAPTIVE_PATHWAY') {
      payload.adaptive = {
        subject: adaptSubject,
        topic: adaptTopic,
        subtopic: adaptSubtopic,
        nodeId: `node-${Date.now()}`,
        autoTriggerLowDifficulty: adaptAutoLowDiff,
        scaffoldingNotes: adaptScaffolding
      };
    } else if (formTargetType === 'PRECONFIGURED_UDL') {
      payload.udl = {
        useDyslexicFont: udlDyslexia,
        lineSpacing: udlLineSpacing,
        fontSize: udlFontSize,
        adhdMilestones: udlAdhdMilestones,
        highContrast: false,
        eslTargetLang: udlEslLang,
        simplifyVocabulary: udlSimplifyVocab
      };
    } else if (formTargetType === 'PARENT_PLAYBOOK') {
      payload.parent = {
        studentName: parentStudentName,
        targetSection: parentTargetSection,
        customParentMessage: parentCustomMessage
      };
    }

    const newMapping: QRCodeMapping = {
      qrCodeId: editingMapping?.qrCodeId || `qr-id-${Date.now()}`,
      shortId: formShortId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      title: formTitle.trim(),
      description: formDescription.trim(),
      accessibilityNotes: formAccessibilityNotes.trim() || undefined,
      targetType: formTargetType,
      physicalTouchpoint: formPhysicalTouchpoint.trim(),
      targetPayload: payload,
      createdByUid: 'teacher-user',
      createdByName: 'Educator Playbook',
      scanCount: editingMapping?.scanCount || 0,
      createdAt: editingMapping?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      brandColor: formBrandColor,
      labelHeader: formLabelHeader || 'PHYSICAL TEXTBOOK TOUCHPOINT',
      expirationDate: formExpirationDate.trim() ? formExpirationDate.trim() : undefined
    };

    const saved = await QRMappingService.saveMapping(newMapping);
    setMappings(prev => {
      const idx = prev.findIndex(m => m.qrCodeId === saved.qrCodeId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });

    setIsCreateModalOpen(false);
    triggerToast(`Dynamic QR Code "${saved.title}" successfully saved!`);
  };

  const handleDelete = async (qrCodeId: string, title: string) => {
    if (confirm(`Are you sure you want to delete the QR mapping for "${title}"?`)) {
      await QRMappingService.deleteMapping(qrCodeId);
      setMappings(prev => prev.filter(m => m.qrCodeId !== qrCodeId));
      triggerToast(`QR Mapping "${title}" deleted.`);
    }
  };

  const triggerToast = (msg: string) => {
    setActionSuccessToast(msg);
    setTimeout(() => setActionSuccessToast(null), 4000);
  };

  // Test / Scan Handler: Resolves shortId dynamic redirect and activates core feature
  const handleExecuteScanResolution = async (shortIdToResolve: string) => {
    const resolved = await QRMappingService.resolveAndIncrementScan(shortIdToResolve);
    if (!resolved) {
      alert(`No active QR Mapping found for short ID "${shortIdToResolve}".`);
      return;
    }

    if (QRMappingService.isExpired(resolved)) {
      alert(`🚫 REDIRECTION DISABLED FOR EXPIRED TOUCHPOINT\n\nThis QR mapping ("${resolved.title}") expired on ${new Date(resolved.expirationDate!).toLocaleDateString()}.\n\nThe dynamic redirection URL has been disabled. Edit the mapping's expiration date in the dashboard to reactivate it.`);
      return;
    }

    // Refresh list scan count locally
    setMappings(prev => prev.map(m => m.shortId === resolved.shortId ? { ...m, scanCount: m.scanCount + 1 } : m));

    // Handle payload execution
    if (resolved.targetType === 'SOCRATIC_TUTOR') {
      const soc = resolved.targetPayload.socratic;
      triggerToast(`🎯 QR Scan Resolved: Loading Socratic AI Tutor for "${soc?.documentTitle || resolved.title}"`);
      if (onNavigateToTutor) {
        onNavigateToTutor(soc?.documentId, soc?.socraticPrompt);
      } else {
        alert(`Socratic AI Tutor launched with prompt: "${soc?.socraticPrompt}"`);
      }
    } else if (resolved.targetType === 'ADAPTIVE_PATHWAY') {
      const adapt = resolved.targetPayload.adaptive;
      triggerToast(`🚀 QR Scan Resolved: Opening Adaptive Pathway Node "${adapt?.topic}" with low-confidence scaffolding!`);
      if (onNavigateToAdaptivePath) {
        onNavigateToAdaptivePath(adapt?.subject, adapt?.topic, adapt?.autoTriggerLowDifficulty);
      } else {
        alert(`Adaptive Pathway opened for ${adapt?.subject} -> ${adapt?.topic}. Low-difficulty scaffolding active.`);
      }
    } else if (resolved.targetType === 'PRECONFIGURED_UDL') {
      const udl = resolved.targetPayload.udl;
      if (udl) {
        setUseDyslexicFont(udl.useDyslexicFont);
        setLineSpacing(udl.lineSpacing);
        setFontSize(udl.fontSize);
        if (udl.useDyslexicFont) {
          setActiveLearnerProfile('dyslexia');
        } else if (udl.adhdMilestones) {
          setActiveLearnerProfile('adhd');
        }
        if (udl.eslTargetLang) {
          setAiLanguage(udl.eslTargetLang as any);
        }
      }
      triggerToast(`👁️ QR Scan Resolved: Pre-Configured UDL Accessibility Profile applied! (Dyslexia Font: ${udl?.useDyslexicFont ? 'ON' : 'OFF'}, Spacing: ${udl?.lineSpacing})`);
    } else if (resolved.targetType === 'PARENT_PLAYBOOK') {
      const parent = resolved.targetPayload.parent;
      triggerToast(`👨‍👩‍👧 QR Scan Resolved: Opening Parent Take-Home Playbook for ${parent?.studentName || 'Student'}`);
      if (onNavigateToParentPlaybook) {
        onNavigateToParentPlaybook(parent?.studentName, parent?.targetSection);
      } else {
        alert(`Parent Playbook opened for ${parent?.studentName}. ${parent?.customParentMessage}`);
      }
    }

    setIsScannerModalOpen(false);
  };

  const copyShortUrl = (shortId: string) => {
    const fullUrl = `${window.location.origin}/qr/${shortId}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(shortId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredMappings = mappings.filter(m => {
    const isExpired = QRMappingService.isExpired(m);
    if (statusFilter === 'ACTIVE' && isExpired) return false;
    if (statusFilter === 'EXPIRED' && !isExpired) return false;

    const matchesSearch = searchQuery === '' || 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.physicalTouchpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.shortId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'ALL' || m.targetType === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const totalScans = mappings.reduce((acc, curr) => acc + (curr.scanCount || 0), 0);

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {actionSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#5f6f52] text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-400/30 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span className="text-sm font-bold">{actionSuccessToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#5f6f52] via-[#4a5840] to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden border border-[#5f6f52]/30">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 transform origin-top-right pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
                <QrCode className="w-8 h-8 text-emerald-300" />
              </span>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-emerald-300">Educator Playbook Module</span>
                <h1 className="text-3xl font-extrabold font-serif">QR Linkage & Mapping Studio</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setIsScavengerHuntModalOpen(true)}
                className="min-h-[44px] px-4 py-2.5 bg-gradient-to-r from-amber-500/80 to-orange-500/80 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-xl border border-amber-300/40 flex items-center gap-2 transition cursor-pointer focus:ring-2 focus:ring-amber-300 focus:outline-none shadow-md"
                title="Design complete, print-ready Classroom Scavenger Hunts for any subject"
              >
                <Compass className="w-4 h-4 text-amber-200" />
                <span>Scavenger Hunt Studio</span>
              </button>

              <button
                onClick={() => setIsSchemaModalOpen(true)}
                className="min-h-[44px] px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 flex items-center gap-2 transition cursor-pointer focus:ring-2 focus:ring-emerald-300 focus:outline-none"
                title="View Relational SQL Database Schema and Dynamic Redirection Logic"
              >
                <Code2 className="w-4 h-4 text-emerald-300" />
                <span>SQL Schema</span>
              </button>

              <button
                onClick={() => setIsScannerModalOpen(true)}
                className="min-h-[44px] px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 flex items-center gap-2 transition cursor-pointer focus:ring-2 focus:ring-emerald-300 focus:outline-none"
              >
                <Camera className="w-4 h-4 text-amber-300" />
                <span>Scan / Test Code</span>
              </button>

              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="min-h-[44px] px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 flex items-center gap-2 transition cursor-pointer focus:ring-2 focus:ring-emerald-300 focus:outline-none"
              >
                <Printer className="w-4 h-4 text-sky-300" />
                <span>Print Playbook Labels</span>
              </button>

              <button
                onClick={() => setActiveMainTab('templates')}
                className="min-h-[44px] px-4 py-2.5 bg-indigo-500/30 hover:bg-indigo-500/40 text-white font-bold text-xs rounded-xl border border-indigo-300/40 flex items-center gap-2 transition cursor-pointer focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                title="Manage saved educator redirection preset templates"
              >
                <Bookmark className="w-4 h-4 text-indigo-300" />
                <span>Template Library ({templates.length})</span>
              </button>

              <button
                onClick={() => setIsBulkUploadModalOpen(true)}
                className="min-h-[44px] px-4 py-2.5 bg-emerald-500/30 hover:bg-emerald-500/40 text-white font-bold text-xs rounded-xl border border-emerald-300/40 flex items-center gap-2 transition cursor-pointer focus:ring-2 focus:ring-emerald-300 focus:outline-none"
                title="Bulk upload CSV file with multiple QR code mappings for an entire unit of work"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                <span>Bulk CSV Upload</span>
              </button>

              <button
                onClick={() => handleOpenCreateModal()}
                className="min-h-[44px] px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition transform hover:scale-[1.02] cursor-pointer focus:ring-2 focus:ring-emerald-300 focus:outline-none"
              >
                <Plus className="w-4 h-4" />
                <span>Generate Dynamic QR</span>
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="min-h-[44px] w-11 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer"
                  title="Close QR Studio"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <p className="text-sm text-slate-200 max-w-3xl leading-relaxed font-sans">
            Bridge physical textbooks, worksheets, and classroom touchpoints with EduNexus core digital features. 
            All QR codes use dynamic server-side redirection, allowing teachers to change target payloads in the database without reprinting physical codes.
          </p>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Active Physical Codes</span>
              <span className="text-2xl font-black text-white">{mappings.length} Touchpoints</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Total Classroom Scans</span>
              <span className="text-2xl font-black text-emerald-300">{totalScans} Scans</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Socratic AI Links</span>
              <span className="text-2xl font-black text-indigo-300">
                {mappings.filter(m => m.targetType === 'SOCRATIC_TUTOR').length} Readers
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">UDL & Adaptive Presets</span>
              <span className="text-2xl font-black text-amber-300">
                {mappings.filter(m => m.targetType === 'PRECONFIGURED_UDL' || m.targetType === 'ADAPTIVE_PATHWAY').length} Scaffolds
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Scan Alert Toast & Classroom Monitor */}
      <QRScanAlertManager
        mappings={mappings}
        onSelectMapping={(mapping) => {
          setActiveMainTab('mappings');
          const cardEl = document.getElementById(`qr-card-${mapping.shortId}`);
          if (cardEl) {
            cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }}
        onLaunchMapping={(mapping) => {
          handleExecuteScanResolution(mapping.shortId);
        }}
        onScanCountUpdated={() => {
          loadMappings();
        }}
      />

      {/* Studio Navigation Tabs */}
      <div className="flex items-center justify-between bg-white border border-[#e5e1da] rounded-2xl p-2.5 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMainTab('mappings')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeMainTab === 'mappings'
                ? 'bg-[#5f6f52] text-white shadow-sm font-extrabold'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Active Touchpoints</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono font-bold">
              {mappings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab('templates')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeMainTab === 'templates'
                ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Redirection Presets Library</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-900 font-mono font-black">
              {templates.length} Presets
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab('analytics')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeMainTab === 'analytics'
                ? 'bg-slate-900 text-white shadow-sm font-extrabold'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Scan Analytics & Trends</span>
          </button>

          <button
            onClick={() => setActiveMainTab('utilization')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeMainTab === 'utilization'
                ? 'bg-amber-600 text-white shadow-sm font-extrabold'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Resource Utilization Summary</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeMainTab === 'templates' ? (
        <QRTemplateManager 
          templates={templates}
          onTemplatesChange={setTemplates}
          onApplyTemplate={handleApplyTemplate}
        />
      ) : activeMainTab === 'analytics' ? (
        <QRAnalyticsChart 
          mappings={mappings} 
          documents={documents}
          onSelectMapping={(mapping) => {
            setActiveMainTab('mappings');
            setTimeout(() => {
              const cardEl = document.getElementById(`qr-card-${mapping.shortId}`);
              if (cardEl) {
                cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 100);
          }}
          onLaunchMapping={(mapping) => {
            handleExecuteScanResolution(mapping.shortId);
          }}
          onSelectDocForReader={onSelectDocForReader}
        />
      ) : activeMainTab === 'utilization' ? (
        <ResourceUtilizationSummary
          mappings={mappings}
          documents={documents}
          onSelectMapping={(mapping) => {
            setActiveMainTab('mappings');
            setTimeout(() => {
              const cardEl = document.getElementById(`qr-card-${mapping.shortId}`);
              if (cardEl) {
                cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 100);
          }}
          onLaunchMapping={(mapping) => {
            handleExecuteScanResolution(mapping.shortId);
          }}
          onEditMapping={(mapping) => {
            handleOpenCreateModal(mapping);
          }}
          onSelectDocForReader={onSelectDocForReader}
        />
      ) : (
        <>
          {/* QR Analytics Chart Sub-Component */}
          <QRAnalyticsChart 
            mappings={mappings} 
            documents={documents}
            onSelectMapping={(mapping) => {
              setActiveMainTab('mappings');
              setTimeout(() => {
                const cardEl = document.getElementById(`qr-card-${mapping.shortId}`);
                if (cardEl) {
                  cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 100);
            }}
            onLaunchMapping={(mapping) => {
              handleExecuteScanResolution(mapping.shortId);
            }}
            onSelectDocForReader={onSelectDocForReader}
          />

          {/* Control Bar: Search & Mapping Filters */}
          <div className="bg-white border border-[#e5e1da] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search physical touchpoint (e.g. Page 72 Biology), short ID, or title..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#5f6f52] focus:outline-none transition min-h-[44px]"
            />
          </div>

          {/* Target Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'ALL', label: 'All Mappings', icon: Layers },
              { id: 'SOCRATIC_TUTOR', label: 'Socratic AI', icon: Brain, color: 'text-indigo-600' },
              { id: 'ADAPTIVE_PATHWAY', label: 'Adaptive Pathway', icon: Route, color: 'text-emerald-600' },
              { id: 'PRECONFIGURED_UDL', label: 'UDL Accessibility', icon: Eye, color: 'text-amber-600' },
              { id: 'PARENT_PLAYBOOK', label: 'Parent Playbook', icon: Users, color: 'text-rose-600' }
            ].map(filter => {
              const IconComp = filter.icon;
              const isActive = selectedFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition cursor-pointer shrink-0 focus:ring-2 focus:ring-[#5f6f52] focus:outline-none ${
                    isActive
                      ? 'bg-[#5f6f52] text-white border-transparent shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-white' : filter.color || 'text-slate-500'}`} />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Quick-Toggle Filter (Active vs Expired) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-serif">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Redirection Status:</span>
            </span>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer min-h-[36px] ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({mappings.length})
              </button>
              
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active ({mappings.filter(m => !QRMappingService.isExpired(m)).length})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('EXPIRED')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
                  statusFilter === 'EXPIRED'
                    ? 'bg-rose-600 text-white shadow-2xs font-extrabold'
                    : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Expired / Disabled ({mappings.filter(m => QRMappingService.isExpired(m)).length})</span>
              </button>
            </div>
          </div>

          {statusFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline flex items-center gap-1 cursor-pointer"
            >
              Reset status filter
            </button>
          )}
        </div>
      </div>

      {/* QR Mappings Grid */}
      {isLoading ? (
        <div className="bg-white border border-[#e5e1da] rounded-2xl p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#5f6f52] animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading dynamic QR code mappings...</p>
        </div>
      ) : filteredMappings.length === 0 ? (
        <div className="bg-white border border-[#e5e1da] rounded-2xl p-12 text-center space-y-4">
          <QrCode className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">No QR Code Mappings Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No physical touchpoints match your search or selected target filter. Generate your first dynamic QR code to bridge physical textbooks with EduNexus!
            </p>
          </div>
          <button
            onClick={() => handleOpenCreateModal()}
            className="min-h-[44px] px-5 py-2.5 bg-[#5f6f52] text-white font-bold text-xs rounded-xl shadow inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New QR Code</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredMappings.map(mapping => {
            const isSocratic = mapping.targetType === 'SOCRATIC_TUTOR';
            const isAdaptive = mapping.targetType === 'ADAPTIVE_PATHWAY';
            const isUDL = mapping.targetType === 'PRECONFIGURED_UDL';
            const isParent = mapping.targetType === 'PARENT_PLAYBOOK';
            const isExpired = QRMappingService.isExpired(mapping);

            const badgeBg = isSocratic ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : isAdaptive ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : isUDL ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-rose-50 text-rose-700 border-rose-200';

            const typeLabel = isSocratic ? 'Socratic AI Tutor'
              : isAdaptive ? 'Adaptive Pathway Node'
              : isUDL ? 'Pre-Configured UDL'
              : 'Parent Playbook';

            const targetUrl = `${window.location.origin}/qr/${mapping.shortId}`;

            return (
              <div 
                key={mapping.qrCodeId}
                id={`qr-card-${mapping.shortId}`}
                className={`bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all space-y-5 flex flex-col justify-between ${
                  isExpired ? 'border-rose-300 bg-rose-50/10' : 'border-[#e5e1da]'
                }`}
              >
                <div className="space-y-4">
                  {/* Card Top Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeBg}`}>
                          {isSocratic && <Brain className="w-3 h-3" />}
                          {isAdaptive && <Route className="w-3 h-3" />}
                          {isUDL && <Eye className="w-3 h-3" />}
                          {isParent && <Users className="w-3 h-3" />}
                          <span>{typeLabel}</span>
                        </span>

                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                            <Ban className="w-3 h-3 text-rose-600" />
                            <span>Expired</span>
                          </span>
                        ) : mapping.expirationDate ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs" title={`Expires on ${mapping.expirationDate}`}>
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span>Active (Expires {new Date(mapping.expirationDate).toLocaleDateString()})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Active</span>
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-800 font-serif leading-snug">{mapping.title}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenCreateModal(mapping)}
                        className="p-2 text-slate-400 hover:text-[#5f6f52] hover:bg-slate-100 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center focus:ring-2 focus:ring-[#5f6f52] focus:outline-none"
                        title="Edit Dynamic Target Payload & Expiration Date"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(mapping.qrCodeId, mapping.title)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        title="Delete QR Mapping"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* QR Code Canvas & Touchpoint Details */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm shrink-0 flex flex-col items-center justify-center relative group/qr overflow-hidden"
                         title={mapping.accessibilityNotes || `Dynamic QR code for ${mapping.title} (${mapping.physicalTouchpoint})`}
                         aria-label={mapping.accessibilityNotes || `Dynamic QR code for ${mapping.title}`}
                    >
                      <QRCodeCanvas 
                        id={`qr-canvas-${mapping.shortId}`}
                        value={targetUrl}
                        size={110}
                        fgColor={isExpired ? '#94a3b8' : (mapping.brandColor || '#1e293b')}
                        level="H"
                        includeMargin={false}
                        aria-label={mapping.accessibilityNotes || `QR code for ${mapping.title}`}
                      />
                      <div className="hidden">
                        <QRCodeSVG 
                          id={`qr-svg-${mapping.shortId}`}
                          value={targetUrl}
                          size={500}
                          fgColor={mapping.brandColor || '#1e293b'}
                          level="H"
                          includeMargin={true}
                          aria-label={mapping.accessibilityNotes || `QR code for ${mapping.title}`}
                        />
                      </div>
                      
                      {isExpired && (
                        <div className="absolute inset-0 bg-rose-950/80 backdrop-blur-[1px] rounded-xl flex flex-col items-center justify-center text-white text-center p-1 z-10 animate-fadeIn" title="Redirection URL disabled due to expiration date">
                          <Ban className="w-6 h-6 text-rose-300 mb-0.5" />
                          <span className="text-[9px] font-black uppercase tracking-wider text-rose-100">Disabled</span>
                        </div>
                      )}

                      <span className="text-[9px] font-mono font-bold text-slate-500 mt-1 uppercase tracking-wider">
                        /{mapping.shortId}
                      </span>
                    </div>

                    <div className="space-y-2 flex-1 text-center sm:text-left">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Physical Touchpoint</span>
                        <div className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 inline-block font-mono">
                          📍 {mapping.physicalTouchpoint}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {mapping.description}
                      </p>

                      {isExpired && (
                        <div className="text-[11px] text-rose-950 bg-rose-50 border border-rose-200/90 rounded-xl p-2.5 font-medium flex items-center justify-between gap-2 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span><strong>Touchpoint Expired:</strong> Link disabled on {new Date(mapping.expirationDate!).toLocaleDateString()}.</span>
                          </div>
                          <button
                            onClick={() => handleOpenCreateModal(mapping)}
                            className="text-[10px] font-bold text-rose-700 hover:text-rose-900 underline shrink-0 cursor-pointer"
                          >
                            Extend Expiration
                          </button>
                        </div>
                      )}

                      {mapping.accessibilityNotes && (
                        <div className="text-[11px] text-indigo-950 bg-indigo-50/90 border border-indigo-200/90 rounded-lg p-2 font-medium flex items-start gap-2">
                          <Accessibility className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-extrabold text-[10px] uppercase tracking-wider block text-indigo-900">Screen Reader Alt Text</span>
                            <span className="text-slate-700 leading-normal">{mapping.accessibilityNotes}</span>
                          </div>
                        </div>
                      )}

                      {/* Dynamic Target Payload Summary */}
                      <div className="text-[11px] text-slate-500 bg-emerald-50/50 border border-emerald-100 rounded-lg p-2 font-medium">
                        {isSocratic && (
                          <span>Reader Doc: <strong>{mapping.targetPayload.socratic?.documentTitle || 'Default Reader'}</strong></span>
                        )}
                        {isAdaptive && (
                          <span>Topic Node: <strong>{mapping.targetPayload.adaptive?.topic}</strong> (Low-Diff: {mapping.targetPayload.adaptive?.autoTriggerLowDifficulty ? 'Auto' : 'Off'})</span>
                        )}
                        {isUDL && (
                          <span>UDL Profile: <strong>Dyslexia Font ({mapping.targetPayload.udl?.useDyslexicFont ? 'ON' : 'OFF'})</strong>, Spacing: {mapping.targetPayload.udl?.lineSpacing}</span>
                        )}
                        {isParent && (
                          <span>Parent Target: <strong>{mapping.targetPayload.parent?.studentName} ({mapping.targetPayload.parent?.targetSection})</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Analytics & Scan Counter */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span className="font-medium flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                      Total Scans: <strong className="text-slate-800 font-extrabold">{mapping.scanCount}</strong>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Created by {mapping.createdByName || 'Teacher'}
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => copyShortUrl(mapping.shortId)}
                    className="flex-1 min-w-[90px] min-h-[44px] px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer focus:ring-2 focus:ring-slate-400 focus:outline-none"
                    title="Copy short redirection URL to clipboard"
                  >
                    {copiedId === mapping.shortId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-extrabold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  {/* Download QR Code Button with Format Dropdown */}
                  <div className="relative group/dl flex-1 min-w-[110px]">
                    <button
                      type="button"
                      className="w-full min-h-[44px] px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
                      title="Download QR code image for physical printing"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Download QR</span>
                    </button>

                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white rounded-2xl shadow-2xl p-1.5 border border-slate-700 hidden group-hover/dl:block group-focus-within/dl:block z-30 animate-fadeIn">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1 border-b border-slate-800">
                        Export for Printing
                      </div>
                      <button
                        onClick={() => handleDownloadQR(mapping, 'png')}
                        className="w-full text-left px-2.5 py-2 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer text-slate-200 hover:text-white"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span>PNG Image (High-Res 4x)</span>
                      </button>
                      <button
                        onClick={() => handleDownloadQR(mapping, 'svg')}
                        className="w-full text-left px-2.5 py-2 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer text-slate-200 hover:text-white"
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        <span>SVG Vector (Scalable)</span>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleExecuteScanResolution(mapping.shortId)}
                    className={`flex-1 min-w-[100px] min-h-[44px] px-3 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer focus:ring-2 focus:outline-none ${
                      isExpired 
                        ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 focus:ring-rose-400' 
                        : 'bg-[#5f6f52] hover:bg-[#4a5840] text-white focus:ring-[#5f6f52]'
                    }`}
                    title={isExpired ? 'Redirection disabled (Expired touchpoint) - Click to verify status' : 'Simulate scanning this physical QR code directly in EduNexus'}
                  >
                    {isExpired ? (
                      <>
                        <Ban className="w-3.5 h-3.5 text-rose-600" />
                        <span>Link Expired</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Test & Launch</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveMappingAsTemplate(mapping)}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                    title="Save this redirection configuration as a reusable educator template preset"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden sm:inline">Save Template</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}

      {/* MODAL 1: Create / Edit Dynamic QR Code */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-[#5f6f52]/10 text-[#5f6f52] rounded-xl">
                  <QrCode className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 font-serif">
                    {editingMapping ? 'Edit Dynamic QR Mapping' : 'Generate Dynamic QR Code'}
                  </h3>
                  <p className="text-xs text-slate-500">Map a physical textbook or worksheet to EduNexus digital features</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMapping} className="space-y-6">
              {/* Preset Template Quick-Selector Bar */}
              <div className="bg-indigo-50/80 border border-indigo-200/90 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5 font-serif">
                    <Bookmark className="w-4 h-4 text-indigo-600" />
                    <span>Quick-Apply Educator Preset Template</span>
                  </label>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-md border border-indigo-200">
                    {templates.length} Presets Available
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[44px]"
                  >
                    <option value="">-- Select a preset template (e.g., Homework Socratic, Revision Path, Dyslexia UDL) --</option>
                    {templates.map(tmpl => (
                      <option key={tmpl.id} value={tmpl.id}>
                        [{tmpl.category}] {tmpl.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      const found = templates.find(t => t.id === selectedTemplateId);
                      if (found) {
                        handleApplyTemplate(found);
                      }
                    }}
                    disabled={!selectedTemplateId}
                    className={`min-h-[44px] px-4 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 ${
                      selectedTemplateId
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-sm'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                    <span>Load Template</span>
                  </button>
                </div>
              </div>

              {/* Step 1: Touchpoint Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#5f6f52]" /> 1. Physical Touchpoint Metadata
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">QR Touchpoint Title *</label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      placeholder="e.g. Grade 7 Chemistry Page 42"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#5f6f52] min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Physical Touchpoint Tag *</label>
                    <input
                      type="text"
                      required
                      value={formPhysicalTouchpoint}
                      onChange={e => setFormPhysicalTouchpoint(e.target.value)}
                      placeholder="e.g. CBC Science Textbook Pg 42 or Worksheet #3"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#5f6f52] min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Short Redirection Alias *</label>
                    <div className="flex items-center">
                      <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-200 text-slate-500 text-xs font-mono rounded-l-xl min-h-[44px] flex items-center">
                        /qr/
                      </span>
                      <input
                        type="text"
                        required
                        value={formShortId}
                        onChange={e => setFormShortId(e.target.value)}
                        placeholder="chem-page42"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#5f6f52] min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">QR Code Brand Color</label>
                    <div className="flex items-center gap-2">
                      {['#5f6f52', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#1e293b'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormBrandColor(color)}
                          style={{ backgroundColor: color }}
                          className={`w-8 h-8 rounded-full border-2 transition ${
                            formBrandColor === color ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Educator Notes / Description</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    placeholder="Provide additional instructions or context for fellow educators..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#5f6f52]"
                  />
                </div>

                {/* Expiration Date Field & Presets */}
                <div className="space-y-2 p-3.5 bg-rose-50/30 border border-rose-100 rounded-xl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-serif">
                      <Calendar className="w-4 h-4 text-rose-600" />
                      <span>Touchpoint Expiration Date (Optional)</span>
                    </label>
                    {formExpirationDate && (
                      <button
                        type="button"
                        onClick={() => setFormExpirationDate('')}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                      >
                        Clear Expiration
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={formExpirationDate ? formExpirationDate.substring(0, 10) : ''}
                    onChange={e => setFormExpirationDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 min-h-[44px]"
                  />
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-serif">Academic Presets:</span>
                    {QRMappingService.getAcademicCalendarDefaults().map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setFormExpirationDate(preset.date)}
                        title={preset.description}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition cursor-pointer shadow-2xs ${
                          formExpirationDate.substring(0, 10) === preset.date
                            ? 'bg-rose-600 text-white border-rose-700 font-extrabold'
                            : 'bg-white hover:bg-rose-100 text-slate-700 hover:text-rose-900 border-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    When this date is reached, redirection is automatically disabled and an 'Expired' status badge will mark the touchpoint.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 font-serif">
                      <Accessibility className="w-4 h-4 text-indigo-600" />
                      <span>Accessibility Notes & Screen-Reader Alt-Text</span>
                    </label>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                      Auto-Injected Alt-Text & ARIA
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={formAccessibilityNotes}
                    onChange={e => setFormAccessibilityNotes(e.target.value)}
                    placeholder="e.g. Scannable QR code linking Grade 7 Chemistry Page 42 textbook station to interactive Socratic voice tutor with screen-reader audio description..."
                    className="w-full px-3.5 py-2.5 bg-indigo-50/40 border border-indigo-200/80 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-500 italic">
                    This description is automatically embedded into the QR element's ARIA attributes, SVG titles, image alt tags, and screen-reader metadata.
                  </p>
                </div>
              </div>

              {/* Step 2: Select Target Mapping Type */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#5f6f52]" /> 2. Target Digital Mapping Payload
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'SOCRATIC_TUTOR', title: 'Socratic AI', icon: Brain, color: 'border-indigo-500 bg-indigo-50/40 text-indigo-900' },
                    { id: 'ADAPTIVE_PATHWAY', title: 'Adaptive Path', icon: Route, color: 'border-emerald-500 bg-emerald-50/40 text-emerald-900' },
                    { id: 'PRECONFIGURED_UDL', title: 'UDL Toggles', icon: Eye, color: 'border-amber-500 bg-amber-50/40 text-amber-900' },
                    { id: 'PARENT_PLAYBOOK', title: 'Parent Playbook', icon: Users, color: 'border-rose-500 bg-rose-50/40 text-rose-900' }
                  ].map(opt => {
                    const IconComp = opt.icon;
                    const isSelected = formTargetType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFormTargetType(opt.id as QRTargetType)}
                        className={`p-3 rounded-2xl border-2 text-left transition flex flex-col items-start justify-between min-h-[90px] cursor-pointer ${
                          isSelected ? opt.color + ' shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <IconComp className={`w-5 h-5 ${isSelected ? 'text-slate-900' : 'text-slate-500'}`} />
                        <span className="text-xs font-bold font-serif leading-tight">{opt.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Payload Specific Configuration */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                {formTargetType === 'SOCRATIC_TUTOR' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                      <Brain className="w-4 h-4" /> Socratic AI Tutor Configuration
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Target Interactive Reader Document</label>
                      <input
                        type="text"
                        value={socDocTitle}
                        onChange={e => setSocDocTitle(e.target.value)}
                        placeholder="e.g. Grade 7 Photosynthesis & Energy"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 min-h-[44px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Pre-loaded Socratic AI Prompt</label>
                      <textarea
                        rows={3}
                        value={socPrompt}
                        onChange={e => setSocPrompt(e.target.value)}
                        placeholder="Instruct Socratic AI how to tutor the student when scanning this page..."
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                      />
                    </div>
                  </div>
                )}

                {formTargetType === 'ADAPTIVE_PATHWAY' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                      <Route className="w-4 h-4" /> Adaptive Pathway Node Configuration
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Subject</label>
                        <input
                          type="text"
                          value={adaptSubject}
                          onChange={e => setAdaptSubject(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium min-h-[44px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Topic Node</label>
                        <input
                          type="text"
                          value={adaptTopic}
                          onChange={e => setAdaptTopic(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium min-h-[44px]"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adaptAutoLowDiff}
                        onChange={e => setAdaptAutoLowDiff(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Auto-trigger low-difficulty root activities and visual scaffolding on low confidence scan
                      </span>
                    </label>
                  </div>
                )}

                {formTargetType === 'PRECONFIGURED_UDL' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
                      <Eye className="w-4 h-4" /> Pre-Configured UDL Accessibility Options
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={udlDyslexia}
                          onChange={e => setUdlDyslexia(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-xs font-bold text-slate-800">Dyslexia-friendly Comic/Dyslexic Font</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={udlAdhdMilestones}
                          onChange={e => setUdlAdhdMilestones(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-xs font-bold text-slate-800">ADHD Micro-Milestones & Checklists</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Line Spacing</label>
                        <select
                          value={udlLineSpacing}
                          onChange={e => setUdlLineSpacing(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold min-h-[44px]"
                        >
                          <option value="normal">Normal Spacing</option>
                          <option value="relaxed">Relaxed Spacing (1.7x)</option>
                          <option value="loose">Loose Spacing (2.0x)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Automated ESL Translation</label>
                        <select
                          value={udlEslLang}
                          onChange={e => setUdlEslLang(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold min-h-[44px]"
                        >
                          <option value="en">🇬🇧 English</option>
                          <option value="sw">🇰🇪 Swahili (Kiswahili)</option>
                          <option value="fr">🇫🇷 French</option>
                          <option value="es">🇪🇸 Spanish</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {formTargetType === 'PARENT_PLAYBOOK' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
                      <Users className="w-4 h-4" /> Parent Playbook Configuration
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Student Name / ID</label>
                        <input
                          type="text"
                          value={parentStudentName}
                          onChange={e => setParentStudentName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium min-h-[44px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Target Parent Section</label>
                        <select
                          value={parentTargetSection}
                          onChange={e => setParentTargetSection(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold min-h-[44px]"
                        >
                          <option value="progress_streaks">Learning Streaks & Activity</option>
                          <option value="milestones">Milestones & Mastery Badges</option>
                          <option value="take_home_reports">Take-Home Progress Summary</option>
                          <option value="accessibility_sync">Home Accessibility Profile Sync</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Parent Welcome Message</label>
                      <input
                        type="text"
                        value={parentCustomMessage}
                        onChange={e => setParentCustomMessage(e.target.value)}
                        placeholder="Message displayed when parents scan code at home..."
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium min-h-[44px]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (!formTitle.trim()) {
                      triggerToast('Please enter a QR Touchpoint Title first.');
                      return;
                    }
                    const currentPayload: QRTargetPayload = {};
                    if (formTargetType === 'SOCRATIC_TUTOR') {
                      currentPayload.socratic = { documentTitle: socDocTitle, socraticPrompt: socPrompt, initialMode: 'chat_tutor' };
                    } else if (formTargetType === 'ADAPTIVE_PATHWAY') {
                      currentPayload.adaptive = { subject: adaptSubject, topic: adaptTopic, subtopic: adaptSubtopic, nodeId: `node-${Date.now()}`, autoTriggerLowDifficulty: adaptAutoLowDiff, scaffoldingNotes: adaptScaffolding };
                    } else if (formTargetType === 'PRECONFIGURED_UDL') {
                      currentPayload.udl = { useDyslexicFont: udlDyslexia, lineSpacing: udlLineSpacing, fontSize: udlFontSize, adhdMilestones: udlAdhdMilestones, eslTargetLang: udlEslLang, simplifyVocabulary: udlSimplifyVocab, highContrast: false };
                    } else if (formTargetType === 'PARENT_PLAYBOOK') {
                      currentPayload.parent = { studentName: parentStudentName, targetSection: parentTargetSection, customParentMessage: parentCustomMessage };
                    }

                    const newTmpl: QRTemplate = {
                      id: `tmpl-user-${Date.now()}`,
                      name: `${formTitle} Preset`,
                      category: 'Custom',
                      description: formDescription || `Custom educator preset template derived from ${formTitle}`,
                      targetType: formTargetType,
                      defaultBrandColor: formBrandColor,
                      defaultLabelHeader: formLabelHeader || `${formTargetType} PRESET`,
                      targetPayload: currentPayload,
                      createdAt: new Date().toISOString(),
                      isBuiltIn: false
                    };

                    const updated = QRTemplateService.saveTemplate(newTmpl);
                    setTemplates(updated);
                    triggerToast(`Saved "${newTmpl.name}" to Template Library!`);
                  }}
                  className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl font-bold text-xs min-h-[44px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Bookmark className="w-4 h-4 text-indigo-600" />
                  <span>Save Config as Preset Template</span>
                </button>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl min-h-[44px] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#5f6f52] hover:bg-[#4a5840] text-white font-bold text-xs rounded-xl shadow-md min-h-[44px] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingMapping ? 'Update Dynamic QR Mapping' : 'Save & Publish Dynamic QR'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Camera & Redirection Simulator Modal */}
      {isScannerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                  <Camera className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 font-serif">Physical QR Code Scanner</h3>
                  <p className="text-xs text-slate-500">Scan physical code or test short redirection URL</p>
                </div>
              </div>
              <button 
                onClick={() => setIsScannerModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Scanner Viewfinder */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white text-center space-y-4 relative overflow-hidden border border-slate-800">
              <div className="w-48 h-48 mx-auto border-2 border-dashed border-emerald-400 rounded-2xl flex flex-col items-center justify-center space-y-2 relative bg-emerald-950/20">
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                <QrCode className="w-12 h-12 text-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono text-emerald-300 font-bold uppercase tracking-widest">
                  Scanning Touchpoint...
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Position the physical textbook or worksheet QR code inside the viewfinder.
              </p>
            </div>

            {/* Manual Short Link Tester */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Or Test Short Redirection ID
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={scannerInputId}
                  onChange={e => setScannerInputId(e.target.value)}
                  placeholder="e.g. soc-bio72, path-math42, udl-dyslexia"
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#5f6f52] min-h-[44px]"
                />
                <button
                  onClick={() => handleExecuteScanResolution(scannerInputId.trim())}
                  disabled={!scannerInputId.trim()}
                  className="px-5 py-2.5 bg-[#5f6f52] hover:bg-[#4a5840] disabled:opacity-50 text-white text-xs font-bold rounded-xl min-h-[44px] flex items-center gap-1.5"
                >
                  <span>Resolve & Launch</span>
                </button>
              </div>

              {/* Sample Quick Test Buttons */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Quick Sample Touchpoints:
                </span>
                <div className="flex flex-wrap gap-2">
                  {mappings.slice(0, 4).map(m => (
                    <button
                      key={m.shortId}
                      onClick={() => handleExecuteScanResolution(m.shortId)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-mono font-bold transition flex items-center gap-1 min-h-[36px]"
                    >
                      <span>/{m.shortId}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Print Playbook Label Sheet */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-200">
                  <Printer className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 font-serif">Printable Educator Playbook Label Cards</h3>
                  <p className="text-xs text-slate-500">Cut-out label sheet designed for physical placement on textbooks & student desks</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#5f6f52] text-white font-bold text-xs rounded-xl flex items-center gap-2 min-h-[44px]"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Label Sheet</span>
                </button>
                <button 
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Grid View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 print:bg-white print:border-none">
              {mappings.map(mapping => (
                <div 
                  key={mapping.qrCodeId}
                  className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-5 space-y-3 relative flex items-center gap-4 shadow-sm group/printcard"
                >
                  <div className="bg-white p-2 border border-slate-200 rounded-xl shrink-0">
                    <QRCodeCanvas 
                      value={`${window.location.origin}/qr/${mapping.shortId}`}
                      size={96}
                      fgColor={mapping.brandColor || '#1e293b'}
                      level="H"
                    />
                  </div>
                  
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 inline-block font-mono">
                        {mapping.labelHeader || 'EDUNEXUS TOUCHPOINT'}
                      </span>
                      <div className="flex items-center gap-1 print:hidden">
                        <button
                          type="button"
                          onClick={() => handleDownloadQR(mapping, 'png')}
                          className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold border border-emerald-200 flex items-center gap-1 cursor-pointer"
                          title="Download PNG for label"
                        >
                          <Download className="w-2.5 h-2.5" /> PNG
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadQR(mapping, 'svg')}
                          className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[9px] font-bold border border-amber-200 flex items-center gap-1 cursor-pointer"
                          title="Download SVG for label"
                        >
                          <Download className="w-2.5 h-2.5" /> SVG
                        </button>
                      </div>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 font-serif line-clamp-1">{mapping.title}</h4>
                    <p className="text-[10px] text-slate-600 font-medium">📍 {mapping.physicalTouchpoint}</p>
                    <div className="text-[9px] text-slate-400 font-mono">
                      Scan to launch digital feature • edunexus.app/qr/{mapping.shortId}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: SQL Database Schema & Architecture Guide */}
      {isSchemaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                  <Code2 className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 font-serif">Dynamic Redirection & Relational SQL Schema</h3>
                  <p className="text-xs text-slate-500">Backend logic architecture and database representation for dynamic QR codes</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSchemaModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanatory Architecture Note */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 space-y-2 leading-relaxed">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#5f6f52]" /> Dynamic Redirection Paradigm
              </span>
              <p>
                Static QR codes encode fixed URLs directly into the printed matrix. EduNexus uses dynamic QR codes encoding a stable short redirection URL (e.g., <code>/qr/:shortId</code>). When scanned, the system queries the relational database schema below to fetch the active <code>target_payload</code>. Teachers can modify destination documents, Socratic prompts, or UDL toggles anytime without reprinting physical textbook tags.
              </p>
            </div>

            {/* SQL Schema Code Snippet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  PostgreSQL / Relational Database Schema DDL
                </span>
                <button
                  onClick={() => {
                    const schemaSql = `CREATE TABLE qr_code_mappings (
  qr_code_id VARCHAR(64) PRIMARY KEY,
  short_id VARCHAR(32) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_type VARCHAR(50) NOT NULL, -- SOCRATIC_TUTOR, ADAPTIVE_PATHWAY, PRECONFIGURED_UDL, PARENT_PLAYBOOK
  physical_touchpoint VARCHAR(255) NOT NULL,
  target_payload JSONB NOT NULL,
  created_by_uid VARCHAR(128),
  created_by_name VARCHAR(128),
  scan_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_qr_short_id ON qr_code_mappings(short_id);
CREATE INDEX idx_qr_target_type ON qr_code_mappings(target_type);`;
                    navigator.clipboard.writeText(schemaSql);
                    triggerToast('SQL Schema copied to clipboard!');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 min-h-[36px]"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SQL</span>
                </button>
              </div>

              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
{`CREATE TABLE qr_code_mappings (
  qr_code_id VARCHAR(64) PRIMARY KEY,
  short_id VARCHAR(32) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_type VARCHAR(50) NOT NULL, -- 'SOCRATIC_TUTOR', 'ADAPTIVE_PATHWAY', 'PRECONFIGURED_UDL', 'PARENT_PLAYBOOK'
  physical_touchpoint VARCHAR(255) NOT NULL,
  target_payload JSONB NOT NULL,
  created_by_uid VARCHAR(128),
  created_by_name VARCHAR(128),
  scan_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_qr_short_id ON qr_code_mappings(short_id);
CREATE INDEX idx_qr_target_type ON qr_code_mappings(target_type);`}
              </pre>
            </div>

            {/* API Endpoints Summary */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Express Server-Side Endpoints
              </span>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <span><strong className="text-emerald-700">GET</strong> /api/qr/mappings</span>
                  <span className="text-[10px] font-sans text-slate-500">Fetch all dynamic QR mappings</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <span><strong className="text-indigo-700">GET</strong> /api/qr/resolve/:shortId</span>
                  <span className="text-[10px] font-sans text-slate-500">Resolve dynamic target payload & increment scans</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <span><strong className="text-amber-700">POST</strong> /api/qr/manage</span>
                  <span className="text-[10px] font-sans text-slate-500">Create or update dynamic QR target payload</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Bulk CSV Upload */}
      <QRBulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onSuccess={(updatedList) => {
          setMappings(updatedList);
          triggerToast(`Successfully bulk mapped ${updatedList.length} dynamic QR touchpoints!`);
        }}
      />

      {/* MODAL: Classroom Scavenger Hunt Studio */}
      {isScavengerHuntModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm overflow-y-auto p-3 sm:p-6 flex justify-center items-start animate-fadeIn">
          <div className="bg-slate-50 w-full max-w-7xl rounded-3xl p-2 sm:p-4 shadow-2xl relative border border-slate-200 my-auto">
            <ClassroomScavengerHuntStudio
              onClose={() => setIsScavengerHuntModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default QRMappingDashboard;
