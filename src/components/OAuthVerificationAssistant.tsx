import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Video,
  FileText,
  AlertTriangle,
  HelpCircle,
  Key,
  Globe,
  Trash2,
  Sparkles
} from 'lucide-react';

export const OAuthVerificationAssistant: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const scopeJustifications = [
    {
      scope: '.../auth/calendar.acls.readonly & calendar.events.public.readonly',
      category: 'Google Calendar API',
      justification:
        'EduNexus uses read-only Calendar permissions to display relevant public and academic schedule events on the student and teacher dashboard, allowing users to align lesson plans and study timers with their existing Google Calendar events.',
      dataUsage: 'Event metadata (titles, times) is rendered in the user session dashboard. It is never sold, shared, or retained beyond active session display.'
    },
    {
      scope: '.../auth/spreadsheets & spreadsheets.readonly',
      category: 'Google Sheets API',
      justification:
        'EduNexus enables educators to export generated assessment rubrics, student performance analytics, and activity gradebooks directly to Google Sheets for classroom administration.',
      dataUsage: 'Data is written directly to the user\'s personal Google Drive/Sheets upon explicit user export command. No spreadsheet contents are mined or shared.'
    },
    {
      scope: '.../auth/documents & documents.readonly',
      category: 'Google Docs API',
      justification:
        'EduNexus allows educators and students to save AI-generated lesson plans, curriculum guides, and study materials straight to a Google Doc in their personal Google Drive.',
      dataUsage: 'Created documents are stored directly in the user\'s own Google Drive. EduNexus accesses created files only to insert generated text upon request.'
    },
    {
      scope: '.../auth/gmail.addons.* (Gmail Scopes)',
      category: 'Gmail API / Add-ons',
      justification:
        'If your app does not require a standalone Gmail add-on or email drafting, we recommend REMOVING these scopes in Google Cloud Console. Removing Gmail scopes eliminates the mandatory YouTube video demo requirement and speeds up verification.',
      dataUsage: 'N/A if removed. If used, enables automated notification sending upon user action.'
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden font-sans text-slate-800">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Google OAuth Consent Verification Guide
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold uppercase rounded-full">
                Compliance Helper
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Address Google Cloud Console verification flags, copy scope justifications, and review required legal links.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 text-xs leading-relaxed">
        {/* Verification Checkup Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/80 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Privacy Policy Updated</span>
            </div>
            <p className="text-[11px] text-emerald-800">
              Includes mandatory Google Limited Use Disclosure at <code className="font-mono font-bold bg-emerald-100 px-1 py-0.5 rounded">/privacy</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/80 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Terms of Service Live</span>
            </div>
            <p className="text-[11px] text-emerald-800">
              Published on domain at <code className="font-mono font-bold bg-emerald-100 px-1 py-0.5 rounded">/terms</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Console Action Needed</span>
            </div>
            <p className="text-[11px] text-amber-800">
              Paste Scope Justifications below & option to remove unused Gmail scopes in Google Cloud Console.
            </p>
          </div>
        </div>

        {/* Action 1: Pruning Unnecessary Scopes to Skip Video Demo */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              Pro-Tip: How to Skip the YouTube Demo Video Requirement
            </h3>
          </div>
          <p className="text-slate-600 text-xs">
            Google requires a YouTube demo video and rigorous security assessments for <strong>restricted/sensitive scopes</strong> like Gmail add-ons (<code className="font-mono bg-white px-1 border border-slate-200 rounded">gmail.addons.*</code>) or full account control.
          </p>
          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
            <p className="font-semibold text-slate-800">Recommendation:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-700">
              <li>In Google Cloud Console, navigate to <strong>OAuth Consent Screen &gt; Scopes</strong>.</li>
              <li>Click <strong>Add or Remove Scopes</strong> and uncheck unused Gmail or ACL scopes (keep only Google Docs, Sheets, or Drive if exporting lesson plans).</li>
              <li>Save changes. Removing unnecessary restricted scopes removes the demo video requirement!</li>
            </ol>
          </div>
        </div>

        {/* Action 2: Copy Scope Justifications for Google Cloud Console */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#5f6f52]" />
              Ready-to-Paste Scope Justifications
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Copy & paste into Google Cloud Console fields
            </span>
          </div>

          <div className="space-y-3">
            {scopeJustifications.map((item, index) => (
              <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-mono font-bold text-slate-800 text-xs">{item.scope}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold">
                    {item.category}
                  </span>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-slate-700 text-xs bg-white p-2.5 rounded-lg border border-slate-200 font-sans flex-1">
                      <strong className="text-slate-900 block text-[11px] mb-0.5">Scope Justification:</strong>
                      {item.justification}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.justification, `just_${index}`)}
                      className="px-2.5 py-1.5 bg-[#5f6f52] hover:bg-[#4a573e] text-white rounded-md transition font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === `just_${index}` ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Justification
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-start justify-between gap-2 pt-1">
                    <p className="text-slate-600 text-[11px] bg-white p-2 rounded-lg border border-slate-100 font-sans flex-1">
                      <strong className="text-slate-800 block text-[10px] mb-0.5">Intended Data Usage:</strong>
                      {item.dataUsage}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.dataUsage, `usage_${index}`)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === `usage_${index}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" /> Copy Usage
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action 3: Live Verification Links */}
        <div className="p-4 bg-emerald-50/50 border border-emerald-200/60 rounded-xl space-y-2">
          <h3 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-emerald-600" />
            Verified Application Public Legal Links
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <a
              href="https://www.joinedunexus.app/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 text-emerald-900 font-semibold flex items-center justify-between"
            >
              <span>Privacy Policy (Limited Use Clause)</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
            </a>
            <a
              href="https://www.joinedunexus.app/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 text-emerald-900 font-semibold flex items-center justify-between"
            >
              <span>Terms of Service</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OAuthVerificationAssistant;
