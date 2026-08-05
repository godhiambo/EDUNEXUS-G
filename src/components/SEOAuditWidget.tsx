import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Globe, 
  Search, 
  Check, 
  Activity,
  FileCheck,
  Zap
} from 'lucide-react';
import { runSEOAudit, SEOAuditReport, SEOAuditItem } from '../utils/seoAuditor';

export interface SEOAuditWidgetProps {
  autoScanIntervalSeconds?: number;
  onAuditComplete?: (report: SEOAuditReport) => void;
  compact?: boolean;
}

export default function SEOAuditWidget({ 
  autoScanIntervalSeconds = 60,
  onAuditComplete,
  compact = false 
}: SEOAuditWidgetProps) {
  const [report, setReport] = useState<SEOAuditReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lastScanTime, setLastScanTime] = useState<string>('');

  const executeAudit = async () => {
    setIsScanning(true);
    try {
      const res = await runSEOAudit();
      setReport(res);
      setLastScanTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      if (onAuditComplete) {
        onAuditComplete(res);
      }
    } catch (err) {
      console.error('SEO Audit failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    // Initial scan on mount
    executeAudit();

    // Periodic interval scan
    if (autoScanIntervalSeconds > 0) {
      const timer = setInterval(() => {
        executeAudit();
      }, autoScanIntervalSeconds * 1000);
      return () => clearInterval(timer);
    }
  }, [autoScanIntervalSeconds]);

  const filteredItems = report?.items.filter(item => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  }) || [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 text-slate-100">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 rounded-full text-[11px] font-black uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Lightweight Automated SEO Auditor</span>
          </div>
          <h3 className="text-xl font-serif font-black text-white flex items-center gap-2">
            Search Engine Indexing & Compliance Monitor
          </h3>
          <p className="text-xs text-slate-400">
            Periodically scans public links, meta tags, Schema JSON-LD graphs, and domain assets to verify 100% crawlability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Periodic Interval</span>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              Auto-scan ({autoScanIntervalSeconds}s)
            </span>
          </div>

          <button
            onClick={executeAudit}
            disabled={isScanning}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white text-xs font-extrabold rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Run SEO Scan'}</span>
          </button>
        </div>
      </div>

      {/* Summary Score Metric Bar */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Health Score Box */}
          <div className="col-span-2 md:col-span-1 p-4 bg-gradient-to-br from-slate-950 to-emerald-950/40 border border-emerald-500/30 rounded-2xl flex flex-col justify-center items-center text-center">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">SEO Health Score</span>
            <div className="text-3xl font-black font-mono text-emerald-400 mt-1 flex items-baseline gap-1">
              {report.score}
              <span className="text-xs text-slate-400 font-normal">/100</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 font-medium">
              {report.score >= 90 ? '✓ Excellent Search Ready' : report.score >= 70 ? '⚠️ Good, minor warnings' : '❌ Needs Attention'}
            </span>
          </div>

          {/* Checks Count */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Checks</span>
            <span className="text-2xl font-black font-mono text-white mt-1">{report.totalChecks}</span>
            <span className="text-[10px] text-slate-500">Requirements Scanned</span>
          </div>

          {/* Passed Count */}
          <div className="p-3.5 bg-slate-950 border border-emerald-900/50 rounded-2xl flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase text-emerald-400">Passed</span>
            <span className="text-2xl font-black font-mono text-emerald-400 mt-1 flex items-center gap-1.5">
              {report.passedCount}
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            </span>
            <span className="text-[10px] text-emerald-500/80">100% Compliant</span>
          </div>

          {/* Warning Count */}
          <div className="p-3.5 bg-slate-950 border border-amber-900/50 rounded-2xl flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase text-amber-400">Warnings</span>
            <span className="text-2xl font-black font-mono text-amber-400 mt-1 flex items-center gap-1.5">
              {report.warningCount}
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            </span>
            <span className="text-[10px] text-amber-500/80">Minor Enhancements</span>
          </div>

          {/* Failed Count */}
          <div className="p-3.5 bg-slate-950 border border-rose-900/50 rounded-2xl flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase text-rose-400">Failed</span>
            <span className="text-2xl font-black font-mono text-rose-400 mt-1 flex items-center gap-1.5">
              {report.failedCount}
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            </span>
            <span className="text-[10px] text-rose-500/80">Critical Fixes</span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
        {[
          { id: 'all', label: 'All Checks' },
          { id: 'Meta Tags', label: 'Meta Tags' },
          { id: 'Internal Public Links', label: 'Public Links & Endpoints' },
          { id: 'Structured Data Schema', label: 'JSON-LD Schemas' },
          { id: 'Favicon & Assets', label: 'Favicons & Assets' },
          { id: 'Security & Crawlability', label: 'Robots & Security' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Audit List Stream */}
      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {filteredItems.length === 0 ? (
          <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
            No audit items match the selected category filter.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isPassed = item.status === 'passed';
            const isWarning = item.status === 'warning';
            const isFailed = item.status === 'failed';

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isPassed
                    ? 'bg-slate-950/80 border-slate-800/80 hover:border-emerald-500/30'
                    : isWarning
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-rose-950/30 border-rose-500/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {isPassed && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                    {isFailed && <XCircle className="w-4 h-4 text-rose-400" />}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">{item.target}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                        {item.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">{item.message}</p>

                    {item.recommendation && (
                      <p className="text-[11px] text-amber-300/90 font-medium flex items-center gap-1 mt-1">
                        <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>Recommendation: {item.recommendation}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 self-end sm:self-center">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                      isPassed
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : isWarning
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="text-[9px] text-slate-500 block mt-1 font-mono">
                    Last scan {item.lastChecked}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {lastScanTime && (
        <div className="pt-2 text-[10px] text-slate-500 flex items-center justify-between font-mono">
          <span>Periodic scan active ({autoScanIntervalSeconds}s loop)</span>
          <span>Last full SEO scan completed at {lastScanTime}</span>
        </div>
      )}
    </div>
  );
}
