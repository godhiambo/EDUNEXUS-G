import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  X, 
  Sparkles, 
  QrCode, 
  HelpCircle,
  FileText,
  Layers
} from 'lucide-react';
import { QRCodeMapping, QRTargetType } from '../types/qrMapping';
import { QRMappingService } from '../services/qrMappingService';

interface QRBulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newMappings: QRCodeMapping[]) => void;
}

interface ParsedCSVRow {
  id: string;
  title: string;
  physicalTouchpoint: string;
  targetType: QRTargetType;
  labelHeader: string;
  description: string;
  accessibilityNotes?: string;
  expirationDate?: string;
  socraticPrompt?: string;
  subject?: string;
  topic?: string;
  brandColor?: string;
  shortId?: string;
  isValid: boolean;
  validationError?: string;
}

export const QRBulkUploadModal: React.FC<QRBulkUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [parsedRows, setParsedRows] = useState<ParsedCSVRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Robust CSV parser supporting quotes & line breaks
  const parseCSVText = (text: string): ParsedCSVRow[] => {
    const lines: string[] = [];
    let curLine = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuotes = !inQuotes;
        curLine += char;
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (curLine.trim()) {
          lines.push(curLine.trim());
        }
        curLine = '';
        if (char === '\r' && text[i + 1] === '\n') {
          i++;
        }
      } else {
        curLine += char;
      }
    }
    if (curLine.trim()) {
      lines.push(curLine.trim());
    }

    if (lines.length === 0) return [];

    // Helper to split line into comma fields respecting double quotes
    const splitFields = (line: string): string[] => {
      const fields: string[] = [];
      let field = '';
      let inside = false;

      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inside && line[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inside = !inside;
          }
        } else if (c === ',' && !inside) {
          fields.push(field.trim());
          field = '';
        } else {
          field += c;
        }
      }
      fields.push(field.trim());
      return fields;
    };

    const headerFields = splitFields(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    // Header field index mapping
    const getIndex = (keywords: string[]): number => {
      return headerFields.findIndex(h => keywords.some(k => h.includes(k)));
    };

    const idxTitle = getIndex(['title', 'name', 'touchpointtitle', 'heading']);
    const idxTouchpoint = getIndex(['touchpoint', 'location', 'physical', 'station', 'place', 'page']);
    const idxTargetType = getIndex(['targettype', 'type', 'module', 'target']);
    const idxHeader = getIndex(['headerlabel', 'labelheader', 'header', 'label', 'tag']);
    const idxDesc = getIndex(['description', 'desc', 'summary', 'notes']);
    const idxAccess = getIndex(['accessibilitynotes', 'accessibility', 'alttext', 'alt']);
    const idxExp = getIndex(['expirationdate', 'expiration', 'expires', 'expirydate', 'expiry']);
    const idxPrompt = getIndex(['socraticprompt', 'prompt', 'socratic']);
    const idxSubject = getIndex(['subject', 'course', 'discipline']);
    const idxTopic = getIndex(['topic', 'unit', 'chapter', 'subtopic']);
    const idxColor = getIndex(['brandcolor', 'color', 'theme']);
    const idxShort = getIndex(['shortid', 'short', 'codeid']);

    const rows: ParsedCSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const fields = splitFields(lines[i]);
      if (fields.length === 0 || fields.every(f => !f)) continue;

      const rawTitle = idxTitle >= 0 ? fields[idxTitle] : fields[0] || '';
      const rawTouchpoint = idxTouchpoint >= 0 ? fields[idxTouchpoint] : fields[1] || '';
      const rawType = (idxTargetType >= 0 ? fields[idxTargetType] : fields[2] || '').toUpperCase();
      const rawHeader = idxHeader >= 0 ? fields[idxHeader] : fields[3] || '';
      const rawDesc = idxDesc >= 0 ? fields[idxDesc] : fields[4] || '';
      const rawAccess = idxAccess >= 0 ? fields[idxAccess] : '';
      const rawExp = idxExp >= 0 ? fields[idxExp] : '';
      const rawPrompt = idxPrompt >= 0 ? fields[idxPrompt] : '';
      const rawSubject = idxSubject >= 0 ? fields[idxSubject] : '';
      const rawTopic = idxTopic >= 0 ? fields[idxTopic] : '';
      const rawColor = idxColor >= 0 ? fields[idxColor] : '';
      const rawShort = idxShort >= 0 ? fields[idxShort] : '';

      // Map target type
      let targetType: QRTargetType = 'SOCRATIC_TUTOR';
      if (rawType.includes('ADAPT') || rawType.includes('PATHWAY') || rawType.includes('NODE')) {
        targetType = 'ADAPTIVE_PATHWAY';
      } else if (rawType.includes('UDL') || rawType.includes('ACCESS') || rawType.includes('DYSLEX') || rawType.includes('ADHD')) {
        targetType = 'PRECONFIGURED_UDL';
      } else if (rawType.includes('PARENT') || rawType.includes('PLAYBOOK') || rawType.includes('HOME')) {
        targetType = 'PARENT_PLAYBOOK';
      } else {
        targetType = 'SOCRATIC_TUTOR';
      }

      const title = rawTitle || `Unit Touchpoint ${i}`;
      const physicalTouchpoint = rawTouchpoint || `Unit Worksheet / textbook station ${i}`;
      const labelHeader = (rawHeader || `${title.substring(0, 20)} TOUCHPOINT`).toUpperCase();
      const description = rawDesc || `Bulk mapped dynamic QR code for unit of work.`;

      const isValid = Boolean(title.trim() && physicalTouchpoint.trim());

      rows.push({
        id: `row-${i}-${Date.now()}`,
        title,
        physicalTouchpoint,
        targetType,
        labelHeader,
        description,
        accessibilityNotes: rawAccess || `Scannable QR code linking to ${title} at ${physicalTouchpoint} for screen-reader and assistive tech users.`,
        expirationDate: rawExp || undefined,
        socraticPrompt: rawPrompt || 'Guide the student through unit concepts using Socratic questioning.',
        subject: rawSubject || 'General Unit',
        topic: rawTopic || 'Core Concept',
        brandColor: rawColor || (targetType === 'SOCRATIC_TUTOR' ? '#6366f1' : targetType === 'ADAPTIVE_PATHWAY' ? '#10b981' : targetType === 'PRECONFIGURED_UDL' ? '#f59e0b' : '#f43f5e'),
        shortId: rawShort || undefined,
        isValid,
        validationError: isValid ? undefined : 'Title and physical touchpoint required'
      });
    }

    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const rows = parseCSVText(content);
        setParsedRows(rows);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.txt'))) {
      processFile(file);
    }
  };

  const handleDownloadSampleCSV = () => {
    const sampleHeaders = 'Title,Touchpoint,TargetType,HeaderLabel,Description,SocraticPrompt,Subject,Topic,BrandColor\n';
    const sampleRows = [
      '"Grade 8 Algebra Equations Pg 45","Mathematics Textbook - Page 45","SOCRATIC_TUTOR","ALGEBRA PG 45","Scaffolding for multi-step linear equations.","Guide student through inverse operations step-by-step.","Mathematics","Algebra 101","#6366f1"',
      '"Grade 8 Geometry Properties","Lab Station #2 Angle Protractor","ADAPTIVE_PATHWAY","GEOMETRY LAB","Practice worksheet for complementary angles.","","Mathematics","Geometry","#10b981"',
      '"Dyslexia & ADHD Reading Corner","Inclusive Learning Desk #3","PRECONFIGURED_UDL","UDL ACCESSIBILITY","Activates dyslexia font and ADHD micro-milestones.","","English CBC","Literacy","#f59e0b"',
      '"Friday Parent Progress Folder","Take-Home Folder Tag","PARENT_PLAYBOOK","PARENT PLAYBOOK","Weekly progress update and streaks digest for parents.","","CBC Core","Parent Digest","#f43f5e"',
      '"Science Lab Photosynthesis Quiz","Science Station B Microscope","SOCRATIC_TUTOR","LAB STATION B","Guides lab observations on leaf chloroplasts.","Prompt student to identify chloroplast structures.","Biology","Photosynthesis","#8b5cf6"'
    ].join('\n');

    const blob = new Blob([sampleHeaders + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edunexus_unit_qr_mappings_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRemoveRow = (id: string) => {
    setParsedRows(prev => prev.filter(r => r.id !== id));
  };

  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    setIsImporting(true);

    const newMappings: QRCodeMapping[] = validRows.map(row => {
      const shortId = row.shortId || `qr-${Math.random().toString(36).substring(2, 7)}`;
      const qrCodeId = `qr-bulk-${Math.random().toString(36).substring(2, 9)}`;

      const targetPayload: QRCodeMapping['targetPayload'] = {};

      if (row.targetType === 'SOCRATIC_TUTOR') {
        targetPayload.socratic = {
          documentTitle: row.title,
          socraticPrompt: row.socraticPrompt || 'Guide the student through homework scaffolding step-by-step.',
          suggestedQuestions: ['What is the first step?', 'Can you explain your hypothesis?'],
          initialMode: 'chat_tutor'
        };
      } else if (row.targetType === 'ADAPTIVE_PATHWAY') {
        targetPayload.adaptive = {
          subject: row.subject || 'Mathematics',
          topic: row.topic || 'Unit Practice',
          subtopic: 'Unit Subtopic',
          nodeId: `node-${Date.now()}`,
          autoTriggerLowDifficulty: true,
          rootActivitiesCount: 3,
          scaffoldingNotes: 'Bulk mapped unit practice scaffolding node.'
        };
      } else if (row.targetType === 'PRECONFIGURED_UDL') {
        targetPayload.udl = {
          useDyslexicFont: true,
          lineSpacing: 'relaxed',
          fontSize: 'large',
          adhdMilestones: true,
          highContrast: false,
          eslTargetLang: 'en',
          simplifyVocabulary: true
        };
      } else if (row.targetType === 'PARENT_PLAYBOOK') {
        targetPayload.parent = {
          studentName: 'CBC Student',
          targetSection: 'progress_streaks',
          customParentMessage: row.description || 'Scan to view weekly progress report.'
        };
      }

      return {
        qrCodeId,
        shortId,
        title: row.title,
        physicalTouchpoint: row.physicalTouchpoint,
        targetType: row.targetType,
        labelHeader: row.labelHeader,
        description: row.description,
        accessibilityNotes: row.accessibilityNotes,
        expirationDate: row.expirationDate,
        targetPayload,
        scanCount: 0,
        createdByUid: 'teacher-bulk-csv',
        createdByName: 'Unit CSV Bulk Import',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        brandColor: row.brandColor || '#5f6f52'
      };
    });

    const updatedList = await QRMappingService.saveBulkMappings(newMappings);
    setIsImporting(false);
    onSuccess(updatedList);
    onClose();
  };

  const validCount = parsedRows.filter(r => r.isValid).length;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200/80">
              <FileSpreadsheet className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-slate-900 font-serif">
                  Bulk CSV QR Mapping Import
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800">
                  Unit of Work Batch
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload a spreadsheet CSV file containing multiple unit touchpoints to map an entire curriculum unit at once.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Drop Area / Template Download */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`md:col-span-2 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging 
                ? 'border-emerald-500 bg-emerald-50/50' 
                : 'border-slate-300 hover:border-emerald-400 bg-slate-50/60 hover:bg-slate-50'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.txt"
              className="hidden" 
            />
            <div className="p-3 bg-white text-emerald-600 rounded-2xl shadow-xs border border-slate-200 mb-2">
              <Upload className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {fileName ? `File Selected: ${fileName}` : 'Click to select or drag & drop CSV file'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Supports standard UTF-8 .CSV files exported from Excel, Google Sheets, or Numbers.
            </p>
          </div>

          {/* Sample CSV Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">CSV Template</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Need the correct CSV formatting headers? Download our sample unit of work CSV template.
              </p>
            </div>

            <button
              onClick={handleDownloadSampleCSV}
              className="w-full py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Sample CSV</span>
            </button>
          </div>
        </div>

        {/* Parsed Preview Table */}
        {parsedRows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Parsed Unit Touchpoints ({validCount} Valid Items)
                </h4>
              </div>

              <span className="text-xs text-slate-500 font-mono">
                {parsedRows.length} total rows parsed
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs max-h-72 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="p-3">Status</th>
                    <th className="p-3">Touchpoint Title</th>
                    <th className="p-3">Physical Location</th>
                    <th className="p-3">EduNexus Target</th>
                    <th className="p-3">Header Label</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {parsedRows.map((row) => (
                    <tr key={row.id} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/40'}>
                      <td className="p-3">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px] bg-emerald-100 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px] bg-rose-100 px-2 py-0.5 rounded-md" title={row.validationError}>
                            <AlertTriangle className="w-3.5 h-3.5" /> Invalid
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-slate-900 font-serif">{row.title}</td>
                      <td className="p-3 text-slate-600">📍 {row.physicalTouchpoint}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                          {row.targetType}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[10px] text-slate-500 uppercase">{row.labelHeader}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleRemoveRow(row.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                          title="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-500 italic">
            {parsedRows.length === 0 ? 'Select a file to preview unit mappings before import.' : `Ready to generate ${validCount} dynamic QR codes.`}
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl min-h-[44px] cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={validCount === 0 || isImporting}
              onClick={handleConfirmImport}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs min-h-[44px] flex items-center gap-2 shadow-md transition cursor-pointer ${
                validCount > 0 && !isImporting
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Importing Batch...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Import {validCount} Dynamic QR Mappings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
