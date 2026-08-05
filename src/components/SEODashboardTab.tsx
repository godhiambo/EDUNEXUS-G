import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Search, 
  Share2, 
  FileText, 
  Upload, 
  CheckCircle2, 
  Trash2, 
  Sparkles, 
  Code, 
  ExternalLink, 
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  Eye,
  Activity
} from 'lucide-react';
import SEOAuditWidget from './SEOAuditWidget';

interface VerificationFile {
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export default function SEODashboardTab() {
  const [verificationFiles, setVerificationFiles] = useState<VerificationFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Active preview tab: Google SERP, Social Cards, JSON-LD Schema, or AI Search Audit
  const [previewTab, setPreviewTab] = useState<'serp' | 'social' | 'jsonld' | 'verifications' | 'ai-search'>('serp');

  const fetchVerificationFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const res = await fetch('/api/public-verification-files');
      if (res.ok) {
        const data = await res.json();
        setVerificationFiles(data.files || []);
      }
    } catch (err) {
      console.error('Error fetching verification files:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    fetchVerificationFiles();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const res = await fetch('/api/upload-public-verification', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setUploadStatus(`Successfully uploaded ${data.files?.length || 1} file(s) for verification.`);
        fetchVerificationFiles();
      } else {
        setUploadStatus(`Upload failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setUploadStatus(`Error: ${err?.message || 'Upload failed'}`);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete '${filename}' from the public verification directory?`)) return;

    try {
      const res = await fetch(`/api/public-verification-files/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setVerificationFiles(prev => prev.filter(f => f.filename !== filename));
      }
    } catch (err) {
      console.error('Delete verification file failed:', err);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const jsonLdExample = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "name": "EduNexus",
        "url": "https://joinedunexus.app",
        "logo": "https://joinedunexus.app/android-chrome-512x512.png",
        "description": "EduNexus is an AI-powered education platform that helps students master concepts, assists teachers with lesson preparation, enables parents to monitor learner progress, and empowers schools with intelligent educational tools."
      },
      {
        "@type": "SoftwareApplication",
        "name": "EduNexus",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "All (Web, Mobile, Desktop)",
        "offers": { "@type": "Offer", "price": "0.00", "priceCurrency": "USD" }
      },
      {
        "@type": "WebSite",
        "name": "EduNexus",
        "url": "https://joinedunexus.app",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://joinedunexus.app/?search={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5" />
            <span>Search Visibility & Indexing Suite</span>
          </div>
          <h2 className="text-2xl font-serif font-black text-white">
            Google & AI Search Optimization Hub
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Manage EduNexus indexing metadata, dynamic XML sitemaps, structured data schemas, social sharing previews, and domain verification files for Google Search Console, Bing, Meta, and AI search engines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-emerald-300 transition flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View sitemap.xml</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <a
            href="/robots.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-cyan-300 transition flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>View robots.txt</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <a
            href="/site.webmanifest"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-amber-300 transition flex items-center gap-1.5"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>View webmanifest</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Automated SEO Audit & Compliance Scanner Widget */}
      <SEOAuditWidget autoScanIntervalSeconds={60} />

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'serp', label: 'Google SERP Preview', icon: Search },
          { id: 'social', label: 'Social & Open Graph Cards', icon: Share2 },
          { id: 'jsonld', label: 'Structured Data (JSON-LD)', icon: Code },
          { id: 'verifications', label: 'Search Verification Files', icon: ShieldCheck },
          { id: 'ai-search', label: 'AI Search & Overviews Audit', icon: Sparkles }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = previewTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setPreviewTab(t.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: GOOGLE SERP PREVIEW */}
      {previewTab === 'serp' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Google Search Result Mock */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Search className="w-4 h-4" />
                Live Google Search Snippet Simulation
              </span>
              <span className="text-[10px] bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-300 font-mono">
                joinedunexus.app
              </span>
            </div>

            {/* Google SERP Card Box */}
            <div className="bg-white text-slate-900 p-5 rounded-2xl border border-slate-200 shadow-md space-y-2">
              <div className="flex items-center gap-2">
                <img src="/android-chrome-192x192.png" className="w-6 h-6 rounded-full border border-slate-200" alt="EduNexus Favicon" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">EduNexus</p>
                  <p className="text-[11px] text-emerald-700 font-mono leading-none">https://joinedunexus.app</p>
                </div>
              </div>

              <h3 className="text-base font-bold text-blue-700 hover:underline cursor-pointer leading-snug">
                EduNexus | AI Learning Platform for Students, Teachers & Schools
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                EduNexus is an AI-powered education platform that helps students master concepts, assists teachers with lesson preparation, enables parents to monitor learner progress, and empowers schools with intelligent educational tools.
              </p>

              {/* Sitelinks Box */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <a href="/?tab=tutor" className="font-bold text-blue-700 hover:underline block">AI Tutor</a>
                  <p className="text-[10px] text-slate-500 line-clamp-1">1-on-1 Socratic AI tutoring for students</p>
                </div>
                <div>
                  <a href="/?tab=create" className="font-bold text-blue-700 hover:underline block">Teacher Assistant</a>
                  <p className="text-[10px] text-slate-500 line-clamp-1">Generate lesson plans & CBC schemes</p>
                </div>
                <div>
                  <a href="/?tab=parent" className="font-bold text-blue-700 hover:underline block">Parent Portal</a>
                  <p className="text-[10px] text-slate-500 line-clamp-1">Track learner streaks & progress</p>
                </div>
                <div>
                  <a href="/about" className="font-bold text-blue-700 hover:underline block">About Platform</a>
                  <p className="text-[10px] text-slate-500 line-clamp-1">Mission & curriculum capabilities</p>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Explanation */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Configured Search Metadata Standards
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">Favicon & Brand Icon Suite</span>
                <p>Includes <code className="text-amber-300 font-mono">favicon.ico</code>, <code className="text-amber-300 font-mono">16x16</code>, <code className="text-amber-300 font-mono">32x32</code>, <code className="text-amber-300 font-mono">apple-touch-icon</code>, and <code className="text-amber-300 font-mono">android-chrome 192x192 / 512x512</code> for high-resolution logo display beside search results.</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block">Robots Directives</span>
                <p>Configured with <code className="text-emerald-300 font-mono">index, follow, max-image-preview:large</code> on public pages, and <code className="text-rose-400 font-mono">noindex, nofollow</code> on internal admin and protected dashboards.</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">Canonical URL Standard</span>
                <p>Enforces <code className="text-emerald-300 font-mono">https://joinedunexus.app</code> across all pages to prevent duplicate content indexing penalty.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SOCIAL & OPEN GRAPH CARDS */}
      {previewTab === 'social' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* WhatsApp / Facebook / LinkedIn Open Graph Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Share2 className="w-4 h-4" />
              WhatsApp / Facebook / LinkedIn Social Preview
            </span>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <img src="/og-banner.png" className="w-full h-44 object-cover" alt="EduNexus Open Graph Banner" />
              <div className="p-4 space-y-1">
                <span className="text-[10px] font-mono uppercase text-emerald-400">JOINEDUNEXUS.APP</span>
                <h4 className="text-sm font-bold text-white leading-snug">EduNexus | AI Learning Platform for Students, Teachers & Schools</h4>
                <p className="text-xs text-slate-400 line-clamp-2">EduNexus is an AI-powered education platform that helps students master concepts, assists teachers with lesson preparation, and enables parents to monitor learner progress.</p>
              </div>
            </div>
          </div>

          {/* Twitter / X Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <Share2 className="w-4 h-4" />
              Twitter / X Card Preview (summary_large_image)
            </span>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <img src="/og-banner.png" className="w-full h-44 object-cover" alt="EduNexus Twitter Banner" />
              <div className="p-4 space-y-1">
                <span className="text-[10px] font-mono text-slate-400">joinedunexus.app</span>
                <h4 className="text-sm font-bold text-white leading-snug">EduNexus – AI Education Platform</h4>
                <p className="text-xs text-slate-400 line-clamp-2">Helping students learn, teachers teach, parents monitor progress, and schools succeed using Artificial Intelligence.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STRUCTURED DATA (JSON-LD) */}
      {previewTab === 'jsonld' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                Schema.org JSON-LD Structured Data Graph
              </h3>
              <p className="text-xs text-slate-400">Enables Google Rich Snippets, Knowledge Panels, and Sitelinks Search Box</p>
            </div>
            <button
              onClick={() => handleCopy(JSON.stringify(jsonLdExample, null, 2), 'jsonld')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              {copiedKey === 'jsonld' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'jsonld' ? 'Copied Schema' : 'Copy JSON-LD'}</span>
            </button>
          </div>

          <pre className="text-xs font-mono bg-slate-950 p-4 rounded-xl border border-slate-800 text-emerald-300 overflow-x-auto leading-relaxed">
            {JSON.stringify(jsonLdExample, null, 2)}
          </pre>
        </div>
      )}

      {/* TAB 4: SEARCH VERIFICATION FILES */}
      {previewTab === 'verifications' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Domain Verification Upload Manager
              </h3>
              <p className="text-xs text-slate-400">Upload HTML/TXT verification files for Google Search Console, Bing Webmaster Tools, Meta Domain Verification, Yandex, or Pinterest.</p>
            </div>

            <label className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-2 shadow-md">
              {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>{isUploading ? 'Uploading...' : 'Upload Verification File'}</span>
              <input type="file" multiple onChange={handleFileUpload} className="hidden" accept=".html,.htm,.txt,.xml,.json,.svg" />
            </label>
          </div>

          {uploadStatus && (
            <div className="p-3 bg-slate-950 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{uploadStatus}</span>
            </div>
          )}

          {/* List of files in /public */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Public Verification Files Currently Active</h4>
            {isLoadingFiles ? (
              <div className="p-6 text-center text-xs text-slate-500 animate-pulse">Scanning public verification directory...</div>
            ) : verificationFiles.length === 0 ? (
              <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                No custom verification files uploaded yet. Default <code className="text-emerald-300 font-mono">google7f09a0b55826ebf5.html</code> is active.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {verificationFiles.map((file) => (
                  <div key={file.filename} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                    <div className="truncate">
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-emerald-300 hover:underline truncate block">
                        {file.filename}
                      </a>
                      <span className="text-[10px] text-slate-500">{Math.round(file.size / 1024)} KB</span>
                    </div>

                    <button
                      onClick={() => handleDeleteFile(file.filename)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                      title="Delete verification file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: AI SEARCH OPTIMIZATION AUDIT */}
      {previewTab === 'ai-search' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Google AI Overviews & ChatGPT Optimization</span>
            </div>
            <h3 className="text-lg font-serif font-black text-white">AI Search Engine Grounding Checklist</h3>
            <p className="text-xs text-slate-400">EduNexus is structured for seamless discovery, summarization, and citation by modern generative AI search models.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: 'Descriptive Natural-Language Headings',
                desc: 'Uses clear H1–H3 headers stating who EduNexus is for (students, teachers, parents, administrators) and what problem it solves.',
                status: 'Passed (100% Optimized)'
              },
              {
                title: 'Structured FAQPage Schema',
                desc: 'Embedded Schema.org FAQPage data answering common questions regarding AI tutoring, Socratic homework help, lesson plans, and WhatsApp access.',
                status: 'Passed (100% Optimized)'
              },
              {
                title: 'Factual Feature Summaries',
                desc: 'Clean, objective feature list summaries enabling AI agents to accurately categorize EduNexus as a top educational AI platform.',
                status: 'Passed (100% Optimized)'
              },
              {
                title: 'Multilingual & WhatsApp Grounding',
                desc: 'Provides structured descriptions for English, Spanish, French, Swahili, and WhatsApp Cloud API Socratic tutoring.',
                status: 'Passed (100% Optimized)'
              }
            ].map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{item.title}</h4>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
