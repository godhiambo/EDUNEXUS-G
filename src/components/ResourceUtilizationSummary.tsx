import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Flame, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  QrCode, 
  ExternalLink, 
  Filter, 
  MapPin, 
  Brain, 
  Route, 
  Eye, 
  Users,
  Search,
  CheckCircle2,
  Ban,
  BookOpen,
  ArrowUpRight,
  Info,
  Sparkles
} from 'lucide-react';
import { QRCodeMapping } from '../types/qrMapping';
import { SavedDocument } from '../types';
import { QRMappingService } from '../services/qrMappingService';

interface ResourceUtilizationSummaryProps {
  mappings: QRCodeMapping[];
  documents?: SavedDocument[];
  onSelectMapping?: (mapping: QRCodeMapping) => void;
  onLaunchMapping?: (mapping: QRCodeMapping) => void;
  onEditMapping?: (mapping: QRCodeMapping) => void;
  onSelectDocForReader?: (doc: SavedDocument) => void;
}

export type UtilizationCategory = 'ALL' | 'FREQUENTLY_ACCESSED' | 'MODERATE' | 'UNDER_UTILIZED';

export const ResourceUtilizationSummary: React.FC<ResourceUtilizationSummaryProps> = ({
  mappings,
  documents = [],
  onSelectMapping,
  onLaunchMapping,
  onEditMapping,
  onSelectDocForReader
}) => {
  const [filterCategory, setFilterCategory] = useState<UtilizationCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'scans_desc' | 'scans_asc' | 'title'>('scans_desc');

  // Calculate scan statistics and thresholds
  const totalScans = mappings.reduce((acc, curr) => acc + (curr.scanCount || 0), 0);
  const avgScans = mappings.length > 0 ? totalScans / mappings.length : 0;
  
  // Benchmark thresholds for classification
  const highThreshold = Math.max(5, Math.ceil(avgScans * 1.15));
  const lowThreshold = Math.max(2, Math.floor(avgScans * 0.45));

  // Compute status for each resource
  const evaluatedResources = mappings.map(mapping => {
    const scans = mapping.scanCount || 0;
    const isExpired = QRMappingService.isExpired(mapping);

    let category: 'FREQUENTLY_ACCESSED' | 'MODERATE' | 'UNDER_UTILIZED';
    if (scans >= highThreshold) {
      category = 'FREQUENTLY_ACCESSED';
    } else if (scans <= lowThreshold || scans === 0) {
      category = 'UNDER_UTILIZED';
    } else {
      category = 'MODERATE';
    }

    // Pedagogical recommendations based on engagement category
    let recommendation = '';
    if (category === 'FREQUENTLY_ACCESSED') {
      recommendation = 'Top student engagement point. Consider expanding this topic into a multi-node adaptive pathway.';
    } else if (category === 'UNDER_UTILIZED') {
      if (scans === 0) {
        recommendation = 'Zero scans recorded. Check if physical QR code poster is visible or verify link expiration.';
      } else {
        recommendation = 'Under-utilized resource. Try repositioning physical poster or announcing link in next warm-up activity.';
      }
    } else {
      recommendation = 'Consistent steady access during classroom guided practice.';
    }

    // Matching document if present
    const linkedDocTitle = mapping.targetPayload.socratic?.documentTitle;
    const matchingDoc = documents.find(d => 
      d.title.toLowerCase() === linkedDocTitle?.toLowerCase() || 
      d.id === mapping.targetPayload.socratic?.documentId
    );

    return {
      mapping,
      scans,
      category,
      isExpired,
      recommendation,
      matchingDoc
    };
  });

  // Filter & Sort
  const filteredResources = evaluatedResources.filter(item => {
    if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const titleMatch = item.mapping.title.toLowerCase().includes(q);
      const touchpointMatch = item.mapping.physicalTouchpoint.toLowerCase().includes(q);
      const shortIdMatch = item.mapping.shortId.toLowerCase().includes(q);
      return titleMatch || touchpointMatch || shortIdMatch;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'scans_desc') return b.scans - a.scans;
    if (sortBy === 'scans_asc') return a.scans - b.scans;
    return a.mapping.title.localeCompare(b.mapping.title);
  });

  // Category counts
  const countFrequentlyAccessed = evaluatedResources.filter(r => r.category === 'FREQUENTLY_ACCESSED').length;
  const countModerate = evaluatedResources.filter(r => r.category === 'MODERATE').length;
  const countUnderUtilized = evaluatedResources.filter(r => r.category === 'UNDER_UTILIZED').length;

  return (
    <div className="bg-white border border-[#e5e1da] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-800 font-serif">Resource Utilization Summary</h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Analyze classroom engagement with physical learning materials. Easily identify under-utilized posters or frequently accessed textbook touchpoints to optimize classroom placement.
          </p>
        </div>

        {/* Global Overview Pill Stats */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-2xl flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Frequently Accessed</span>
              <span className="text-sm font-black text-emerald-950">{countFrequentlyAccessed} Resources</span>
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-200/80 px-3.5 py-1.5 rounded-2xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">Under-Utilized</span>
              <span className="text-sm font-black text-rose-950">{countUnderUtilized} Resources</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200/70">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterCategory('ALL')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filterCategory === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>All Resources</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {evaluatedResources.length}
            </span>
          </button>

          <button
            onClick={() => setFilterCategory('FREQUENTLY_ACCESSED')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filterCategory === 'FREQUENTLY_ACCESSED'
                ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                : 'text-emerald-700 hover:bg-emerald-100/60'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Frequently Accessed</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              filterCategory === 'FREQUENTLY_ACCESSED' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {countFrequentlyAccessed}
            </span>
          </button>

          <button
            onClick={() => setFilterCategory('UNDER_UTILIZED')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filterCategory === 'UNDER_UTILIZED'
                ? 'bg-rose-600 text-white shadow-2xs font-extrabold'
                : 'text-rose-700 hover:bg-rose-100/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Under-Utilized</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              filterCategory === 'UNDER_UTILIZED' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-800'
            }`}>
              {countUnderUtilized}
            </span>
          </button>

          <button
            onClick={() => setFilterCategory('MODERATE')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filterCategory === 'MODERATE'
                ? 'bg-sky-600 text-white shadow-2xs font-extrabold'
                : 'text-sky-700 hover:bg-sky-100/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Moderate Access</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              filterCategory === 'MODERATE' ? 'bg-sky-700 text-white' : 'bg-sky-100 text-sky-800'
            }`}>
              {countModerate}
            </span>
          </button>
        </div>

        {/* Search Input & Sort Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by title or touchpoint..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#5f6f52] outline-none min-h-[36px]"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#5f6f52] outline-none min-h-[36px]"
          >
            <option value="scans_desc">Highest Scans</option>
            <option value="scans_asc">Lowest Scans</option>
            <option value="title">Resource Title</option>
          </select>
        </div>
      </div>

      {/* Resource Summary Cards Grid */}
      {filteredResources.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <QrCode className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No classroom resources match the selected filter category.</p>
          <button
            onClick={() => {
              setFilterCategory('ALL');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-[#5f6f52] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer inline-block"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResources.map(({ mapping, scans, category, isExpired, recommendation, matchingDoc }) => {
            const isHigh = category === 'FREQUENTLY_ACCESSED';
            const isLow = category === 'UNDER_UTILIZED';

            // Icon mapping for payload target
            const iconMap: Record<string, any> = {
              SOCRATIC_TUTOR: Brain,
              ADAPTIVE_PATHWAY: Route,
              PRECONFIGURED_UDL: Eye,
              PARENT_PLAYBOOK: Users
            };
            const TargetIcon = iconMap[mapping.targetType] || QrCode;

            return (
              <div
                key={mapping.qrCodeId}
                className={`bg-white border rounded-3xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative ${
                  isHigh 
                    ? 'border-emerald-300 ring-1 ring-emerald-200/60' 
                    : isLow 
                    ? 'border-rose-200 bg-rose-50/10' 
                    : 'border-slate-200'
                }`}
              >
                <div className="space-y-3">
                  {/* Category Status Ribbon & Scans Counter */}
                  <div className="flex items-center justify-between gap-2">
                    {isHigh && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                        <Flame className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Frequently Accessed</span>
                      </span>
                    )}

                    {isLow && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1 shadow-2xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Under-Utilized</span>
                      </span>
                    )}

                    {!isHigh && !isLow && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-900 border border-sky-300 flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-sky-600" />
                        <span>Moderate Access</span>
                      </span>
                    )}

                    <div className="text-right">
                      <span className="text-base font-black text-slate-900 block font-mono">{scans} Scans</span>
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">
                        {avgScans > 0 ? `${Math.round((scans / Math.max(1, avgScans)) * 100)}% of avg` : 'Baseline'}
                      </span>
                    </div>
                  </div>

                  {/* Resource Title & Touchpoint */}
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        /{mapping.shortId}
                      </span>
                      {isExpired && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-0.5">
                          <Ban className="w-3 h-3 text-rose-600" />
                          <span>Expired Link</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 font-serif leading-snug">
                      {mapping.title}
                    </h3>
                  </div>

                  {/* Physical Touchpoint Location */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-1 text-xs text-slate-700">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-[#5f6f52] shrink-0" />
                      <span>{mapping.physicalTouchpoint}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {mapping.description}
                    </p>
                  </div>

                  {/* Pedagogical Recommendation Box */}
                  <div className={`rounded-2xl p-3 text-xs space-y-1 border ${
                    isHigh 
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
                      : isLow 
                      ? 'bg-amber-50/80 border-amber-200 text-amber-950' 
                      : 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-serif">Pedagogical Insight:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {recommendation}
                    </p>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                  {onLaunchMapping && (
                    <button
                      onClick={() => onLaunchMapping(mapping)}
                      className={`flex-1 min-h-[38px] px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer ${
                        isExpired
                          ? 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                          : 'bg-[#5f6f52] text-white hover:bg-[#4a5840] shadow-2xs'
                      }`}
                    >
                      {isExpired ? <Ban className="w-3.5 h-3.5 text-rose-600" /> : <ExternalLink className="w-3.5 h-3.5" />}
                      <span>{isExpired ? 'Expired Link' : 'Test Redirection'}</span>
                    </button>
                  )}

                  {onSelectMapping && (
                    <button
                      onClick={() => onSelectMapping(mapping)}
                      className="px-3 py-1.5 min-h-[38px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                      title="Focus card on dashboard grid"
                    >
                      <QrCode className="w-3.5 h-3.5 text-slate-500" />
                      <span>Focus</span>
                    </button>
                  )}

                  {matchingDoc && onSelectDocForReader && (
                    <button
                      onClick={() => onSelectDocForReader(matchingDoc)}
                      className="px-3 py-1.5 min-h-[38px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                      title="Open linked textbook document"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Open Doc</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
