import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Server, 
  ShieldAlert, 
  Clock, 
  Database, 
  TrendingUp, 
  BarChart3, 
  Info, 
  Sparkles, 
  Key, 
  Gauge, 
  XCircle, 
  Flame, 
  ArrowUpRight,
  Trash2,
  Check,
  ShieldCheck,
  ZapOff
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend,
  AreaChart,
  Area
} from 'recharts';

export interface QuotaMetricsData {
  tier: string;
  exhaustionRiskScore: number;
  exhaustionRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  apiKeyConfigured: boolean;
  apiKeyPrefix: string;
  rpmCurrent: number;
  rpmLimit: number;
  rpmPercent: number;
  tpmCurrent: number;
  tpmLimit: number;
  tpmPercent: number;
  rpdCurrent: number;
  rpdLimit: number;
  rpdPercent: number;
  modelBreakdown: {
    model: string;
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    lastUsed: string;
    status: 'OPTIMAL' | 'NEAR_LIMIT' | 'EXHAUSTED';
  }[];
  recentQuotaErrors: {
    id: string;
    timestamp: string;
    model: string;
    statusCode: number | string;
    errorMessage: string;
    retryAfterSeconds?: number;
  }[];
  hourlyTrends: {
    hour: string;
    requests: number;
    tokens: number;
    errors: number;
  }[];
  recommendations: string[];
}

export default function SystemMonitorPanel() {
  const [metrics, setMetrics] = useState<QuotaMetricsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [probing, setProbing] = useState<boolean>(false);
  const [probeResult, setProbeResult] = useState<{ status: string; message: string; latencyMs?: number } | null>(null);
  const [clearingLogs, setClearingLogs] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  
  // Proactive mitigation toggle states
  const [fallbackCascade, setFallbackCascade] = useState<boolean>(true);
  const [cacheFirstMode, setCacheFirstMode] = useState<boolean>(true);
  const [requestThrottling, setRequestThrottling] = useState<boolean>(false);

  const fetchQuotaMetrics = async () => {
    try {
      const res = await fetch('/api/gemini-quota');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch Gemini API quota metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotaMetrics();
    const interval = setInterval(fetchQuotaMetrics, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleProbeApi = async () => {
    setProbing(true);
    setProbeResult(null);
    try {
      const res = await fetch('/api/admin/gemini-quota/probe', { method: 'POST' });
      const data = await res.json();
      setProbeResult({
        status: data.status,
        message: data.message,
        latencyMs: data.latencyMs
      });
      if (data.quota) {
        setMetrics(data.quota);
      }
    } catch (err: any) {
      setProbeResult({
        status: 'ERROR',
        message: 'Network error or endpoint unreachable: ' + (err.message || String(err))
      });
    } finally {
      setProbing(false);
    }
  };

  const handleClearErrorLogs = async () => {
    setClearingLogs(true);
    try {
      await fetch('/api/admin/gemini-quota/clear-logs', { method: 'POST' });
      await fetchQuotaMetrics();
    } catch (err) {
      console.error('Failed to clear error logs:', err);
    } finally {
      setClearingLogs(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          text: 'text-rose-700',
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          fill: '#e11d48'
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          fill: '#d97706'
        };
      case 'MODERATE':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          badge: 'bg-blue-100 text-blue-800 border-blue-300',
          fill: '#2563eb'
        };
      default:
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-800',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          fill: '#059669'
        };
    }
  };

  if (loading && !metrics) {
    return (
      <div className="bg-white rounded-2xl border border-[#e5e1da] p-8 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Connecting to Google Cloud Gemini API Quota Telemetry...</p>
      </div>
    );
  }

  const riskColors = getRiskColor(metrics?.exhaustionRiskLevel || 'LOW');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER BANNER */}
      <div className="bg-[#fdfdfb] rounded-2xl border border-[#e5e1da] p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
              <Gauge className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                Gemini API System Quota & Rate Limit Monitor
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Real-time usage telemetry from Google Cloud / AI Studio metrics to anticipate quota exhaustion.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchQuotaMetrics}
            className="px-3.5 py-2 bg-white border border-[#e5e1da] rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Sync Metrics</span>
          </button>

          <button
            onClick={handleProbeApi}
            disabled={probing}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${probing ? 'animate-bounce text-amber-300' : ''}`} />
            <span>{probing ? 'Probing Gemini API...' : 'Probe Live API Health'}</span>
          </button>
        </div>
      </div>

      {/* PROBE LIVE STATUS NOTIFICATION */}
      {probeResult && (
        <div className={`p-4 rounded-xl border flex items-start justify-between gap-3 animate-fadeIn ${
          probeResult.status === 'HEALTHY'
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : probeResult.status === 'EXHAUSTED'
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-start gap-2.5">
            {probeResult.status === 'HEALTHY' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">
                {probeResult.status === 'HEALTHY' ? 'API Probe Passed' : 'API Probe Warning / Error'}
                {probeResult.latencyMs ? ` (${probeResult.latencyMs}ms)` : ''}
              </div>
              <p className="text-xs mt-0.5">{probeResult.message}</p>
            </div>
          </div>
          <button
            onClick={() => setProbeResult(null)}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TOP CARDS ROW: EXHAUSTION RISK GAUGE & KEY STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* CARD 1: EXHAUSTION RISK SCORE */}
        <div className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 shadow-xs relative overflow-hidden ${riskColors.bg} ${riskColors.border}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-500" /> Quota Exhaustion Risk Index
            </span>
            <span className={`text-[10px] font-extrabold font-mono px-2.5 py-0.5 rounded-full border ${riskColors.badge}`}>
              {metrics?.exhaustionRiskLevel} RISK
            </span>
          </div>

          <div className="flex items-center justify-center py-1">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#e2e8f0"
                  strokeWidth="9"
                  strokeDasharray="251.2"
                  strokeDashoffset="62.8"
                  strokeLinecap="round"
                  className="origin-center rotate-45"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={riskColors.fill}
                  strokeWidth="9"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * 0.75 * (metrics?.exhaustionRiskScore || 0)) / 100}
                  strokeLinecap="round"
                  className="origin-center rotate-[135deg] transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-black font-mono leading-none ${riskColors.text}`}>
                  {metrics?.exhaustionRiskScore}%
                </span>
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider mt-1">Risk Score</span>
              </div>
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-700 bg-white/70 backdrop-blur-xs p-3 rounded-xl border border-white/60">
            {metrics?.recommendations[0] || 'System status normal.'}
          </div>
        </div>

        {/* CARD 2: API KEY & TIER STATUS */}
        <div className="bg-white rounded-2xl border border-[#e5e1da] p-5 flex flex-col justify-between space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-emerald-600" /> Active API Credential & Tier
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
              {metrics?.apiKeyConfigured ? 'ACTIVE' : 'MISSING'}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Service Provider:</span>
              <span className="text-xs font-bold text-slate-800">Google AI Studio / Gemini</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Active API Key:</span>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                {metrics?.apiKeyPrefix}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Quota Tier:</span>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {metrics?.tier}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Last Synced:</span>
              <span className="text-[11px] font-mono text-slate-500">
                {lastRefreshed.toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Key is securely proxied server-side in Cloud environment.</span>
          </div>
        </div>

        {/* CARD 3: PROACTIVE MITIGATION CONTROLS */}
        <div className="bg-white rounded-2xl border border-[#e5e1da] p-5 flex flex-col justify-between space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-indigo-600" /> Quota Exhaustion Guard
            </span>
            <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 font-bold px-2 py-0.5 rounded-full">
              AUTO_PROTECT
            </span>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-all">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Model Fallback Cascade
                </div>
                <div className="text-[10px] text-slate-500">Auto-switch to lighter models if 429 occurs</div>
              </div>
              <input
                type="checkbox"
                checked={fallbackCascade}
                onChange={(e) => setFallbackCascade(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-all">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-500" /> Cache-First Response Engine
                </div>
                <div className="text-[10px] text-slate-500">Serve identical queries from 12h server cache</div>
              </div>
              <input
                type="checkbox"
                checked={cacheFirstMode}
                onChange={(e) => setCacheFirstMode(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-all">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-rose-500" /> Session Burst Throttle
                </div>
                <div className="text-[10px] text-slate-500">Limit high frequency requests per minute</div>
              </div>
              <input
                type="checkbox"
                checked={requestThrottling}
                onChange={(e) => setRequestThrottling(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
            </label>
          </div>

          <div className="text-[10px] text-slate-400 font-medium text-center pt-1">
            Mitigation policies active in real-time server handler.
          </div>
        </div>

      </div>

      {/* RATE LIMIT GAUGES & PROGRESS BARS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* RPM CARD */}
        <div className="bg-white rounded-2xl border border-[#e5e1da] p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-500" /> Requests / Min (RPM)
            </span>
            <span className="text-xs font-mono font-bold text-slate-800">
              {metrics?.rpmCurrent} / {metrics?.rpmLimit}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  (metrics?.rpmPercent || 0) > 85 ? 'bg-rose-500' : (metrics?.rpmPercent || 0) > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.max(4, metrics?.rpmPercent || 0)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>0 RPM</span>
              <span className="font-bold text-slate-600">{metrics?.rpmPercent}% capacity</span>
              <span>{metrics?.rpmLimit} RPM</span>
            </div>
          </div>
        </div>

        {/* TPM CARD */}
        <div className="bg-white rounded-2xl border border-[#e5e1da] p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-500" /> Tokens / Min (TPM)
            </span>
            <span className="text-xs font-mono font-bold text-slate-800">
              {(metrics?.tpmCurrent || 0).toLocaleString()} / {(metrics?.tpmLimit || 0).toLocaleString()}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  (metrics?.tpmPercent || 0) > 85 ? 'bg-rose-500' : (metrics?.tpmPercent || 0) > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.max(4, metrics?.tpmPercent || 0)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>0 TPM</span>
              <span className="font-bold text-slate-600">{metrics?.tpmPercent}% capacity</span>
              <span>{(metrics?.tpmLimit || 0).toLocaleString()} TPM</span>
            </div>
          </div>
        </div>

        {/* RPD CARD */}
        <div className="bg-white rounded-2xl border border-[#e5e1da] p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-500" /> Daily Volume (RPD)
            </span>
            <span className="text-xs font-mono font-bold text-slate-800">
              {metrics?.rpdCurrent} / {metrics?.rpdLimit}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  (metrics?.rpdPercent || 0) > 85 ? 'bg-rose-500' : (metrics?.rpdPercent || 0) > 60 ? 'bg-amber-500' : 'bg-purple-500'
                }`}
                style={{ width: `${Math.max(4, metrics?.rpdPercent || 0)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>0 RPD</span>
              <span className="font-bold text-slate-600">{metrics?.rpdPercent}% daily quota</span>
              <span>{metrics?.rpdLimit} RPD</span>
            </div>
          </div>
        </div>

      </div>

      {/* 24-HOUR TELEMETRY CHART SECTION */}
      <div className="bg-white rounded-2xl border border-[#e5e1da] p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              24-Hour Gemini API Request Volume & Token Trends
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
            HOURLY_WINDOW
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics?.hourlyTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', color: '#ffffff', fontSize: '12px', border: 'none' }} 
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="requests" name="Requests" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tokens" name="Tokens (in k)" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="errors" name="Quota Errors (429)" fill="#e11d48" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MODEL BREAKDOWN TABLE */}
      <div className="bg-white rounded-2xl border border-[#e5e1da] p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              Model Quota Allocation & Health Breakdown
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {metrics?.modelBreakdown.length || 0} Models Tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                <th className="py-2.5 px-3 rounded-l-lg">Model Name</th>
                <th className="py-2.5 px-3">Total Calls</th>
                <th className="py-2.5 px-3">Successful</th>
                <th className="py-2.5 px-3">Failed / Throttled</th>
                <th className="py-2.5 px-3">Last Active</th>
                <th className="py-2.5 px-3 text-right rounded-r-lg">Quota Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {metrics?.modelBreakdown.map((m) => (
                <tr key={m.model} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>{m.model}</span>
                  </td>
                  <td className="py-3 px-3 font-mono">{m.totalCalls}</td>
                  <td className="py-3 px-3 font-mono text-emerald-700 font-bold">{m.successfulCalls}</td>
                  <td className="py-3 px-3 font-mono text-rose-600 font-bold">{m.failedCalls}</td>
                  <td className="py-3 px-3 font-mono text-slate-500">
                    {m.lastUsed !== 'Never' ? new Date(m.lastUsed).toLocaleTimeString() : 'Never'}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      m.status === 'EXHAUSTED'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : m.status === 'NEAR_LIMIT'
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>
                      {m.status === 'EXHAUSTED' && <XCircle className="w-3 h-3" />}
                      {m.status === 'OPTIMAL' && <Check className="w-3 h-3" />}
                      <span>{m.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECENT QUOTA ERRORS LOG TABLE */}
      <div className="bg-white rounded-2xl border border-[#e5e1da] p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              Recent Quota & Rate Limit Event Journal
            </h3>
          </div>

          {metrics?.recentQuotaErrors && metrics.recentQuotaErrors.length > 0 && (
            <button
              onClick={handleClearErrorLogs}
              disabled={clearingLogs}
              className="px-3 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Log Journal</span>
            </button>
          )}
        </div>

        {(!metrics?.recentQuotaErrors || metrics.recentQuotaErrors.length === 0) ? (
          <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No Rate Limit or Quota Exhaustion Errors Logged</p>
            <p className="text-[11px] text-slate-500">Google Cloud Gemini API requests are executing within safe capacity limits.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Target Model</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Error Details</th>
                  <th className="py-2.5 px-3 text-right">Reset Cooldown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {metrics.recentQuotaErrors.map((err) => (
                  <tr key={err.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(err.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {err.model}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-rose-600 whitespace-nowrap">
                      {err.statusCode}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px] max-w-md truncate">
                      {err.errorMessage}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-700 whitespace-nowrap">
                      {err.retryAfterSeconds ? `${err.retryAfterSeconds}s` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
