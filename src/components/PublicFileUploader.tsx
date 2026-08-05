import React, { useState, useEffect, useRef } from 'react';
import {
  FileCode,
  Upload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Trash2,
  RefreshCw,
  Globe,
  ShieldCheck,
  Check,
  Loader2,
  FileText,
  Code
} from 'lucide-react';

export interface PublicVerificationFile {
  filename: string;
  size: number;
  url: string;
  publicUrl: string;
  updatedAt: string;
}

interface PublicFileUploaderProps {
  compact?: boolean;
}

export const PublicFileUploader: React.FC<PublicFileUploaderProps> = ({ compact = false }) => {
  const [files, setFiles] = useState<PublicVerificationFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedFilename, setCopiedFilename] = useState<string | null>(null);
  const [verifyingFilename, setVerifyingFilename] = useState<string | null>(null);
  const [verificationResults, setVerificationResults] = useState<Record<string, { status: number; ok: boolean }>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPublicFiles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/public-verification-files');
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error('Failed to load public directory files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicFiles();
  }, []);

  const handleUploadFiles = async (fileList: FileList | File[]) => {
    const selectedFiles = Array.from(fileList);
    if (selectedFiles.length === 0) return;

    // Validate extensions
    const invalidFile = selectedFiles.find(f => {
      const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
      return !['.html', '.htm', '.xml', '.txt', '.json', '.svg'].includes(ext);
    });

    if (invalidFile) {
      setMessage({
        type: 'error',
        text: `File '${invalidFile.name}' is not allowed. Only .html, .htm, .xml, .txt, .json, .svg files are supported for domain verification.`
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);
    setMessage(null);

    const formData = new FormData();
    selectedFiles.forEach(f => formData.append('files', f));

    try {
      setUploadProgress(60);
      const res = await fetch('/api/upload-public-verification', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setUploadProgress(100);

      if (res.ok && data.success) {
        setMessage({
          type: 'success',
          text: data.message || 'File(s) uploaded successfully into the /public directory.'
        });
        await fetchPublicFiles();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to upload verification file.'
        });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.message || 'Network error during upload.'
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm(`Are you sure you want to remove '${filename}' from the public directory?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/public-verification-files/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: 'success', text: `'${filename}' was removed from /public directory.` });
        setFiles(prev => prev.filter(f => f.filename !== filename));
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete file.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Delete operation failed.' });
    }
  };

  const handleCopyUrl = (url: string, filename: string) => {
    const absoluteUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(absoluteUrl);
    setCopiedFilename(filename);
    setTimeout(() => setCopiedFilename(null), 2000);
  };

  const handleTestVerification = async (url: string, filename: string) => {
    setVerifyingFilename(filename);
    try {
      const absoluteUrl = `${window.location.origin}${url}?t=${Date.now()}`;
      const res = await fetch(absoluteUrl, { method: 'GET', cache: 'no-store' });
      setVerificationResults(prev => ({
        ...prev,
        [filename]: { status: res.status, ok: res.ok }
      }));
    } catch (err) {
      setVerificationResults(prev => ({
        ...prev,
        [filename]: { status: 0, ok: false }
      }));
    } finally {
      setVerifyingFilename(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-emerald-50/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#5f6f52] text-white rounded-xl shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              HTML & Domain Verification Uploader
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase rounded-full">
                Public Root
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Upload Google Search Console, Bing Webmaster, or custom verification HTML files directly into <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">/public</code>
            </p>
          </div>
        </div>

        <button
          onClick={fetchPublicFiles}
          disabled={isLoading}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          title="Refresh Public Files"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Upload Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files) handleUploadFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer ${
            dragActive
              ? 'border-[#5f6f52] bg-[#5f6f52]/5'
              : 'border-slate-200 hover:border-[#5f6f52] hover:bg-slate-50/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".html,.htm,.xml,.txt,.json,.svg"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleUploadFiles(e.target.files);
            }}
          />

          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-emerald-50 text-[#5f6f52] rounded-2xl">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Click to upload or drag & drop HTML verification files
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Supports <span className="font-mono font-bold text-slate-600">.html</span>, <span className="font-mono font-bold text-slate-600">.htm</span>, <span className="font-mono font-bold text-slate-600">.xml</span>, <span className="font-mono font-bold text-slate-600">.txt</span> files (e.g. <code className="bg-slate-100 px-1 rounded">google123456789.html</code>)
              </p>
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5f6f52]" />
                Uploading to /public directory...
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5f6f52] transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Status Message */}
        {message && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 font-medium ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">{message.text}</div>
            <button
              onClick={() => setMessage(null)}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Uploaded Verification Files List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              Public Verification Files ({files.length})
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">
              Served statically at root /
            </span>
          </div>

          {isLoading ? (
            <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#5f6f52]" />
              Loading public verification files...
            </div>
          ) : files.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-1">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">No public verification files uploaded yet</p>
              <p className="text-[11px] text-slate-400">
                Upload your Google Search Console or Bing verification HTML files above to serve them at root <code className="font-mono bg-white px-1 py-0.5 border border-slate-200 rounded text-slate-600">domain.com/filename.html</code>.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {files.map((file) => {
                const absoluteUrl = `${window.location.origin}${file.url}`;
                const isCopied = copiedFilename === file.filename;
                const isVerifying = verifyingFilename === file.filename;
                const result = verificationResults[file.filename];

                return (
                  <div
                    key={file.filename}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg shrink-0">
                        <Code className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-800 truncate">
                            {file.filename}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            ({formatFileSize(file.size)})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#5f6f52] font-semibold hover:underline flex items-center gap-1 font-mono truncate"
                          >
                            {file.url}
                            <ExternalLink className="w-3 h-3" />
                          </a>

                          {result && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold font-mono ${
                                result.ok
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              HTTP {result.status} {result.ok ? 'OK' : 'FAIL'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleTestVerification(file.url, file.filename)}
                        disabled={isVerifying}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                        title="Test static HTTP endpoint response"
                      >
                        {isVerifying ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        Test URL
                      </button>

                      <button
                        onClick={() => handleCopyUrl(file.url, file.filename)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                        title="Copy direct absolute URL"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-500" />
                            Copy URL
                          </>
                        )}
                      </button>

                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-[#5f6f52] hover:bg-[#4d5c41] text-white text-[11px] font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                      >
                        Open
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => handleDelete(file.filename)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Delete file from public directory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicFileUploader;
