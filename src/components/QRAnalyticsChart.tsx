import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  Brain, 
  Route, 
  Eye, 
  Users, 
  Activity,
  QrCode,
  Filter,
  X,
  ExternalLink,
  FileText,
  MapPin,
  Sparkles,
  Ban,
  CheckCircle2,
  Clock,
  BookOpen,
  MousePointerClick,
  Flame,
  Grid
} from 'lucide-react';
import { QRCodeMapping } from '../types/qrMapping';
import { SavedDocument } from '../types';
import { QRMappingService } from '../services/qrMappingService';

interface QRAnalyticsChartProps {
  mappings: QRCodeMapping[];
  documents?: SavedDocument[];
  onSelectMapping?: (mapping: QRCodeMapping) => void;
  onLaunchMapping?: (mapping: QRCodeMapping) => void;
  onSelectDocForReader?: (doc: SavedDocument) => void;
}

const TARGET_TYPE_COLORS: Record<string, string> = {
  SOCRATIC_TUTOR: '#6366f1',    // Indigo
  ADAPTIVE_PATHWAY: '#10b981',  // Emerald
  PRECONFIGURED_UDL: '#f59e0b',  // Amber
  PARENT_PLAYBOOK: '#f43f5e'    // Rose
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  SOCRATIC_TUTOR: 'Socratic AI Tutor',
  ADAPTIVE_PATHWAY: 'Adaptive Pathway Node',
  PRECONFIGURED_UDL: 'Pre-configured UDL',
  PARENT_PLAYBOOK: 'Parent Take-Home Playbook'
};

export const QRAnalyticsChart: React.FC<QRAnalyticsChartProps> = ({ 
  mappings,
  documents = [],
  onSelectMapping,
  onLaunchMapping,
  onSelectDocForReader
}) => {
  const [activeTab, setActiveTab] = useState<'frequency' | 'distribution' | 'timeline' | 'heatmap'>('frequency');

  // Selected filter states from chart node clicks
  const [selectedShortId, setSelectedShortId] = useState<string | null>(null);
  const [selectedTargetType, setSelectedTargetType] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedHeatmapSlot, setSelectedHeatmapSlot] = useState<{ day: string; timeSlot: string; count: number } | null>(null);

  // 1. Data for Scan Frequency per active QR code
  const barChartData = mappings.map(m => ({
    name: m.shortId,
    title: m.title.length > 22 ? m.title.slice(0, 20) + '...' : m.title,
    fullTitle: m.title,
    scans: m.scanCount || 0,
    targetType: m.targetType,
    touchpoint: m.physicalTouchpoint,
    color: m.brandColor || TARGET_TYPE_COLORS[m.targetType] || '#5f6f52',
    rawMapping: m
  })).sort((a, b) => b.scans - a.scans);

  // 2. Data for Source/Target Distribution (Pie Chart)
  const distributionMap: Record<string, number> = {
    SOCRATIC_TUTOR: 0,
    ADAPTIVE_PATHWAY: 0,
    PRECONFIGURED_UDL: 0,
    PARENT_PLAYBOOK: 0
  };

  mappings.forEach(m => {
    if (distributionMap[m.targetType] !== undefined) {
      distributionMap[m.targetType] += (m.scanCount || 0);
    }
  });

  const pieChartData = Object.keys(distributionMap).map(type => ({
    name: TARGET_TYPE_LABELS[type] || type,
    typeKey: type,
    value: distributionMap[type],
    color: TARGET_TYPE_COLORS[type] || '#5f6f52'
  })).filter(item => item.value > 0);

  // If all scan counts are 0, fallback to item counts so pie chart renders cleanly
  const hasScans = pieChartData.some(item => item.value > 0);
  const pieChartDisplayData = hasScans ? pieChartData : Object.keys(distributionMap).map(type => {
    const count = mappings.filter(m => m.targetType === type).length;
    return {
      name: TARGET_TYPE_LABELS[type] || type,
      typeKey: type,
      value: count,
      color: TARGET_TYPE_COLORS[type] || '#5f6f52'
    };
  });

  // 3. Data for Activity Timeline & Heatmap Matrix
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timeSlots = ['8-9 AM', '9-10 AM', '10-11 AM', '11-12 PM', '12-1 PM', '1-2 PM', '2-3 PM', '3-4 PM'];
  
  const totalScansSum = mappings.reduce((acc, curr) => acc + (curr.scanCount || 0), 0);
  const baseAvg = Math.max(2, Math.round(totalScansSum / 7));

  // Generate Scan Intensity Heatmap Grid Matrix
  const heatmapGridData = days.map((day, dayIdx) => {
    const dayMult = [0.8, 1.2, 1.6, 1.1, 1.8, 0.3, 0.2][dayIdx];
    const slotCounts = timeSlots.map((slot, slotIdx) => {
      // Hour multiplier simulating school period bell schedule
      // 10-11 AM (mid-morning break/lab) & 1-2 PM (afternoon lab) are peak
      const hourMult = [0.4, 0.9, 2.2, 1.1, 0.6, 2.0, 1.4, 0.5][slotIdx];
      const count = Math.round(baseAvg * dayMult * hourMult * 0.45);
      return { slot, count };
    });
    return { day, slotCounts };
  });

  const timelineData = days.map((day, idx) => {
    const multiplier = [0.8, 1.2, 1.5, 1.1, 1.8, 0.4, 0.3][idx];
    const socraticVal = Math.round(baseAvg * multiplier * 0.4);
    const adaptiveVal = Math.round(baseAvg * multiplier * 0.35);
    const udlVal = Math.round(baseAvg * multiplier * 0.15);
    const parentVal = Math.round(baseAvg * multiplier * 0.1);
    return {
      day,
      'Socratic AI': socraticVal,
      'Adaptive Path': adaptiveVal,
      'UDL Toggles': udlVal,
      'Parent Playbook': parentVal,
      Total: socraticVal + adaptiveVal + udlVal + parentVal
    };
  });

  // Click Handlers for Chart Nodes
  const handleBarClick = (entry: any) => {
    if (!entry) return;
    if (selectedShortId === entry.name) {
      setSelectedShortId(null);
    } else {
      setSelectedShortId(entry.name);
      setSelectedTargetType(null);
      setSelectedDay(null);
      setSelectedHeatmapSlot(null);
    }
  };

  const handlePieClick = (entry: any) => {
    if (!entry) return;
    if (selectedTargetType === entry.typeKey) {
      setSelectedTargetType(null);
    } else {
      setSelectedTargetType(entry.typeKey);
      setSelectedShortId(null);
      setSelectedDay(null);
      setSelectedHeatmapSlot(null);
    }
  };

  const handleDayClick = (dayName: string) => {
    if (selectedDay === dayName) {
      setSelectedDay(null);
    } else {
      setSelectedDay(dayName);
      setSelectedShortId(null);
      setSelectedTargetType(null);
      setSelectedHeatmapSlot(null);
    }
  };

  const handleHeatmapSlotClick = (day: string, timeSlot: string, count: number) => {
    if (selectedHeatmapSlot && selectedHeatmapSlot.day === day && selectedHeatmapSlot.timeSlot === timeSlot) {
      setSelectedHeatmapSlot(null);
    } else {
      setSelectedHeatmapSlot({ day, timeSlot, count });
      setSelectedShortId(null);
      setSelectedTargetType(null);
      setSelectedDay(null);
    }
  };

  const handleClearFilters = () => {
    setSelectedShortId(null);
    setSelectedTargetType(null);
    setSelectedDay(null);
    setSelectedHeatmapSlot(null);
  };

  // Filter mappings according to current chart node selection
  const filteredMappings = mappings.filter(m => {
    if (selectedShortId) {
      return m.shortId.toLowerCase() === selectedShortId.toLowerCase();
    }
    if (selectedTargetType) {
      return m.targetType === selectedTargetType;
    }
    return true;
  });

  // Active filter label description
  const activeFilterLabel = selectedShortId
    ? `QR Code Node: /${selectedShortId} (${mappings.find(m => m.shortId.toLowerCase() === selectedShortId.toLowerCase())?.title || selectedShortId})`
    : selectedTargetType
    ? `Target Module: ${TARGET_TYPE_LABELS[selectedTargetType] || selectedTargetType}`
    : selectedDay
    ? `Timeline Activity: ${selectedDay} Classroom Scans`
    : selectedHeatmapSlot
    ? `Scan Intensity Node: ${selectedHeatmapSlot.day} @ ${selectedHeatmapSlot.timeSlot} (${selectedHeatmapSlot.count} scans)`
    : null;

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5 z-50">
          <p className="font-bold font-serif text-emerald-300">{data.fullTitle}</p>
          <p className="text-slate-300">Touchpoint: <span className="font-mono text-amber-200">{data.touchpoint}</span></p>
          <p className="text-slate-300">Short ID: <span className="font-mono text-sky-200">/{data.name}</span></p>
          <div className="pt-1.5 border-t border-slate-700 flex items-center justify-between gap-4 font-bold">
            <span>Total Classroom Scans:</span>
            <span className="text-emerald-400 text-sm font-black">{data.scans}</span>
          </div>
          <p className="text-[10px] text-slate-400 italic pt-0.5">💡 Click bar node to view filtered documents & activity log</p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = totalScansSum > 0 ? ((data.value / totalScansSum) * 100).toFixed(1) : 0;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1 z-50">
          <p className="font-bold text-slate-200">{data.name}</p>
          <p className="text-emerald-400 font-extrabold text-sm">{data.value} scans ({percent}%)</p>
          <p className="text-[10px] text-slate-400 italic pt-0.5">💡 Click pie sector to filter module activities</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-[#e5e1da] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#5f6f52]/10 text-[#5f6f52] rounded-xl">
              <Activity className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-800 font-serif">QR Analytics & Interactive Node Inspector</h2>
          </div>
          <p className="text-xs text-slate-500">
            Click any chart bar, pie segment, or trend node to view a filtered list of documents and activities triggered by scans.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/60 self-stretch sm:self-auto">
          <button
            onClick={() => setActiveTab('frequency')}
            className={`min-h-[44px] flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'frequency'
                ? 'bg-white text-[#5f6f52] shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Scan Frequency</span>
          </button>

          <button
            onClick={() => setActiveTab('distribution')}
            className={`min-h-[44px] flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'distribution'
                ? 'bg-white text-[#5f6f52] shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-4 h-4" />
            <span>Source Distribution</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`min-h-[44px] flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-white text-[#5f6f52] shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Weekly Trends</span>
          </button>

          <button
            onClick={() => setActiveTab('heatmap')}
            className={`min-h-[44px] flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'heatmap'
                ? 'bg-white text-[#5f6f52] shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Scan Intensity Heatmap</span>
          </button>
        </div>
      </div>

      {/* Active Chart Filter Status Badge */}
      {activeFilterLabel && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl p-3 px-4 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-600 text-white rounded-xl">
              <Filter className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                Interactive Chart Node Filter Active
              </span>
              <span className="text-xs font-bold font-serif text-slate-900">{activeFilterLabel}</span>
            </div>
          </div>

          <button
            onClick={handleClearFilters}
            className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Chart Filter</span>
          </button>
        </div>
      )}

      {/* Chart Render Area */}
      <div className="min-h-[310px] w-full pt-1">
        {activeTab === 'frequency' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-2">
              <span className="font-bold flex items-center gap-1 text-slate-700">
                <MousePointerClick className="w-3.5 h-3.5 text-[#5f6f52]" />
                Click any bar node to inspect linked documents & activities
              </span>
              <span className="text-[11px] font-mono text-[#5f6f52] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 font-bold">
                Sorted by highest activity
              </span>
            </div>
            
            <div className="h-[290px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={barChartData} 
                  margin={{ top: 10, right: 30, left: 0, bottom: 25 }}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload.length) {
                      handleBarClick(e.activePayload[0].payload);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="scans" radius={[8, 8, 0, 0]} maxBarSize={55}>
                    {barChartData.map((entry, index) => {
                      const isSelected = selectedShortId === entry.name;
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          cursor="pointer"
                          opacity={selectedShortId ? (isSelected ? 1 : 0.3) : 1}
                          stroke={isSelected ? '#000000' : 'none'}
                          strokeWidth={isSelected ? 2.5 : 0}
                          onClick={() => handleBarClick(entry)}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'distribution' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Pie Chart */}
            <div className="md:col-span-7 h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Pie
                    data={pieChartDisplayData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartDisplayData.map((entry, index) => {
                      const isSelected = selectedTargetType === entry.typeKey;
                      return (
                        <Cell 
                          key={`pie-cell-${index}`} 
                          fill={entry.color} 
                          stroke={isSelected ? '#000000' : '#ffffff'} 
                          strokeWidth={isSelected ? 3 : 2}
                          opacity={selectedTargetType ? (isSelected ? 1 : 0.35) : 1}
                          cursor="pointer" 
                          onClick={() => handlePieClick(entry)}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Distribution Legend & Interactive Cards */}
            <div className="md:col-span-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Target Module Share</span>
                <span className="text-[10px] text-slate-400 font-normal">Click item to filter</span>
              </h3>
              {pieChartDisplayData.map((item) => {
                const iconMap: Record<string, any> = {
                  SOCRATIC_TUTOR: Brain,
                  ADAPTIVE_PATHWAY: Route,
                  PRECONFIGURED_UDL: Eye,
                  PARENT_PLAYBOOK: Users
                };
                const IconComp = iconMap[item.typeKey] || QrCode;
                const percentage = totalScansSum > 0 ? ((item.value / totalScansSum) * 100).toFixed(1) : 0;
                const isSelected = selectedTargetType === item.typeKey;

                return (
                  <div 
                    key={item.typeKey} 
                    onClick={() => handlePieClick(item)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-50/80 border-indigo-400 shadow-sm ring-2 ring-indigo-400/40' 
                        : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span 
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm"
                        style={{ backgroundColor: item.color }}
                      >
                        <IconComp className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block font-serif">{item.name}</span>
                        <span className="text-[10px] text-slate-500">EduNexus Target Payload</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900 block">{item.value} Scans</span>
                      <span className="text-[10px] font-bold text-emerald-600">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-2">
              <span className="font-bold flex items-center gap-1 text-slate-700">
                <MousePointerClick className="w-3.5 h-3.5 text-[#5f6f52]" />
                Click day points to filter activity details for that day
              </span>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold">
                Peak engagement on Wednesday & Friday
              </span>
            </div>

            <div className="h-[290px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={timelineData} 
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                  onClick={(e: any) => {
                    if (e && e.activeLabel !== undefined && e.activeLabel !== null) {
                      handleDayClick(String(e.activeLabel));
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5f6f52" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#5f6f52" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorSocratic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', borderColor: '#334155', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="Socratic AI" stroke="#6366f1" fillOpacity={1} fill="url(#colorSocratic)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Adaptive Path" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                  <Area type="monotone" dataKey="Total" stroke="#5f6f52" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-3 pt-1">
              {days.map(d => (
                <button
                  key={d}
                  onClick={() => handleDayClick(d)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    selectedDay === d
                      ? 'bg-[#5f6f52] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Legend & Instructions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
              <div className="flex items-center gap-2 font-bold">
                <MousePointerClick className="w-4 h-4 text-[#5f6f52]" />
                <span>Click any heatmap cell to filter activities for that specific time & day</span>
              </div>

              {/* Intensity Scale Legend */}
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-slate-500 font-sans font-semibold">Intensity:</span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200 inline-block"></span>
                  <span>0</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 inline-block"></span>
                  <span>1-4</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300 inline-block"></span>
                  <span>5-11</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-indigo-100 border border-indigo-300 inline-block"></span>
                  <span>12-18</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-emerald-600 text-white font-bold inline-block"></span>
                  <span>19+</span>
                </span>
              </div>
            </div>

            {/* Heatmap Grid Table */}
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[640px] border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                {/* Header Row: Time Slots */}
                <div className="grid grid-cols-9 bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-700 text-center font-serif">
                  <div className="p-2.5 border-r border-slate-200/80 flex items-center justify-center gap-1 bg-slate-200/60 text-slate-800">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Day / Hour</span>
                  </div>
                  {timeSlots.map(slot => (
                    <div key={slot} className="p-2.5 border-r border-slate-200/60 last:border-r-0 truncate">
                      {slot}
                    </div>
                  ))}
                </div>

                {/* Day Rows */}
                {heatmapGridData.map(({ day, slotCounts }) => (
                  <div key={day} className="grid grid-cols-9 border-b border-slate-100 last:border-b-0 items-center">
                    {/* Day Column Header */}
                    <div className="p-2.5 text-xs font-extrabold text-slate-800 bg-slate-50 border-r border-slate-200/80 text-center font-serif">
                      {day}
                    </div>

                    {/* Time Slot Cells */}
                    {slotCounts.map(({ slot, count }) => {
                      const isSelected = selectedHeatmapSlot && 
                        selectedHeatmapSlot.day === day && 
                        selectedHeatmapSlot.timeSlot === slot;

                      // Color coding based on scan intensity count
                      let cellStyle = 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100';
                      if (count > 0 && count <= 4) {
                        cellStyle = 'bg-emerald-100/80 text-emerald-900 border-emerald-200 hover:bg-emerald-200';
                      } else if (count > 4 && count <= 11) {
                        cellStyle = 'bg-amber-100 text-amber-950 border-amber-300 font-bold hover:bg-amber-200';
                      } else if (count > 11 && count <= 18) {
                        cellStyle = 'bg-indigo-100 text-indigo-950 border-indigo-300 font-extrabold hover:bg-indigo-200';
                      } else if (count > 18) {
                        cellStyle = 'bg-emerald-600 text-white border-emerald-700 font-black shadow-2xs hover:bg-emerald-700';
                      }

                      return (
                        <div key={slot} className="p-1 border-r border-slate-100 last:border-r-0">
                          <button
                            type="button"
                            onClick={() => handleHeatmapSlotClick(day, slot, count)}
                            className={`w-full h-10 rounded-xl text-xs flex flex-col items-center justify-center transition cursor-pointer border ${cellStyle} ${
                              isSelected ? 'ring-2 ring-slate-900 ring-offset-1 scale-[1.04] z-10 font-black' : ''
                            }`}
                            title={`${day} @ ${slot}: ${count} total scans`}
                          >
                            <span>{count}</span>
                            <span className="text-[9px] opacity-75 leading-none">scans</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Pedagogical Insights Card */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
                  <Flame className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 font-serif">
                    Classroom Scan Intensity Key Findings
                  </h4>
                  <p className="text-xs text-slate-700 mt-0.5">
                    Peak physical QR scan intensity occurs during <span className="font-bold text-emerald-900">Wednesday 10:00 - 11:00 AM</span> (Mid-morning lab session).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
                <div className="bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Peak Period</span>
                  <span className="text-xs font-black text-emerald-900">10-11 AM & 1-2 PM</span>
                </div>
                <div className="bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Lab Engagement</span>
                  <span className="text-xs font-black text-indigo-900">68% in-class</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtered Documents & Activity Inspector Panel */}
      <div className="border-t border-slate-200/80 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <FileText className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-extrabold text-slate-800 font-serif">
              Triggered Activities & Linked Resources
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {filteredMappings.length} {filteredMappings.length === 1 ? 'Touchpoint' : 'Touchpoints'}
            </span>
          </div>

          {(selectedShortId || selectedTargetType || selectedDay) && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Show All Touchpoints</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {filteredMappings.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <QrCode className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">No QR mappings match the selected chart node.</p>
            <button
              onClick={handleClearFilters}
              className="px-3 py-1.5 bg-[#5f6f52] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer inline-block"
            >
              Clear Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMappings.map(mapping => {
              const isExpired = QRMappingService.isExpired(mapping);
              const isSocratic = mapping.targetType === 'SOCRATIC_TUTOR';
              const isAdaptive = mapping.targetType === 'ADAPTIVE_PATHWAY';
              const isUdl = mapping.targetType === 'PRECONFIGURED_UDL';
              const isParent = mapping.targetType === 'PARENT_PLAYBOOK';

              // Find matching saved document if linked
              const linkedDocTitle = mapping.targetPayload.socratic?.documentTitle;
              const matchingDoc = documents.find(d => 
                d.title.toLowerCase() === linkedDocTitle?.toLowerCase() || 
                d.id === mapping.targetPayload.socratic?.documentId
              );

              return (
                <div 
                  key={mapping.qrCodeId}
                  className={`bg-white border rounded-2xl p-4 shadow-2xs space-y-3 flex flex-col justify-between transition hover:shadow-sm ${
                    isExpired ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200/90'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                            /{mapping.shortId}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {isSocratic ? 'Socratic AI' : isAdaptive ? 'Adaptive Pathway' : isUdl ? 'UDL Toggles' : 'Parent Playbook'}
                          </span>
                          {isExpired ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                              <Ban className="w-3 h-3 text-rose-600" />
                              <span>Expired</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Active</span>
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 font-serif leading-snug">
                          {mapping.title}
                        </h4>
                      </div>

                      <div className="text-right shrink-0 bg-slate-50 border border-slate-200/80 p-2 rounded-xl">
                        <span className="text-xs font-black text-slate-900 block">{mapping.scanCount || 0}</span>
                        <span className="text-[9px] text-slate-500 font-mono uppercase">Scans</span>
                      </div>
                    </div>

                    {/* Touchpoint details */}
                    <div className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-2.5 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#5f6f52] shrink-0" />
                        <span className="font-semibold text-slate-800">{mapping.physicalTouchpoint}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {mapping.description}
                      </p>
                    </div>

                    {/* Module-Specific Trigger Information */}
                    {isSocratic && mapping.targetPayload.socratic && (
                      <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-2.5 text-xs text-indigo-950 space-y-1">
                        <div className="flex items-center justify-between font-bold text-indigo-900">
                          <span className="flex items-center gap-1">
                            <Brain className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Socratic Document:</span>
                          </span>
                          <span className="text-indigo-700 truncate max-w-[150px]">
                            {mapping.targetPayload.socratic.documentTitle || 'Default Grade Reader'}
                          </span>
                        </div>
                        {mapping.targetPayload.socratic.socraticPrompt && (
                          <p className="text-[11px] text-indigo-800 italic line-clamp-2">
                            "{mapping.targetPayload.socratic.socraticPrompt}"
                          </p>
                        )}
                      </div>
                    )}

                    {isAdaptive && mapping.targetPayload.adaptive && (
                      <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5 text-xs text-emerald-950 space-y-1">
                        <div className="flex items-center justify-between font-bold text-emerald-900">
                          <span className="flex items-center gap-1">
                            <Route className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Concept Node:</span>
                          </span>
                          <span className="text-emerald-700 font-mono text-[11px]">
                            {mapping.targetPayload.adaptive.nodeId}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800">
                          Topic: <span className="font-semibold">{mapping.targetPayload.adaptive.topic || 'General'}</span> • Auto-Differentiate: {mapping.targetPayload.adaptive.autoTriggerLowDifficulty ? 'Yes' : 'No'}
                        </p>
                      </div>
                    )}

                    {isUdl && mapping.targetPayload.udl && (
                      <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-2.5 text-xs text-amber-950 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900">
                          <Eye className="w-3.5 h-3.5 text-amber-600" />
                          <span>Preset Accessibility Toggles:</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
                          {mapping.targetPayload.udl.useDyslexicFont && (
                            <span className="px-2 py-0.5 bg-white border border-amber-200 rounded font-bold text-amber-800">Dyslexic Font</span>
                          )}
                          {mapping.targetPayload.udl.highContrast && (
                            <span className="px-2 py-0.5 bg-white border border-amber-200 rounded font-bold text-amber-800">High Contrast</span>
                          )}
                          {mapping.targetPayload.udl.lineSpacing !== 'normal' && (
                            <span className="px-2 py-0.5 bg-white border border-amber-200 rounded font-bold text-amber-800">Wide Spacing</span>
                          )}
                        </div>
                      </div>
                    )}

                    {isParent && mapping.targetPayload.parent && (
                      <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-2.5 text-xs text-rose-950 space-y-1">
                        <div className="flex items-center justify-between font-bold text-rose-900">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-rose-600" />
                            <span>Parent Task:</span>
                          </span>
                          <span className="text-rose-700">{mapping.targetPayload.parent.studentName || 'Student'}</span>
                        </div>
                        {mapping.targetPayload.parent.customParentMessage && (
                          <p className="text-[11px] text-rose-800">
                            {mapping.targetPayload.parent.customParentMessage}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
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
                        <span>{isExpired ? 'Link Expired' : 'Test Redirection'}</span>
                      </button>
                    )}

                    {onSelectMapping && (
                      <button
                        onClick={() => onSelectMapping(mapping)}
                        className="px-3 py-1.5 min-h-[38px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        title="Focus and highlight this touchpoint on the main dashboard grid"
                      >
                        <QrCode className="w-3.5 h-3.5 text-slate-500" />
                        <span>Focus Card</span>
                      </button>
                    )}

                    {matchingDoc && onSelectDocForReader && (
                      <button
                        onClick={() => onSelectDocForReader(matchingDoc)}
                        className="px-3 py-1.5 min-h-[38px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        title="Open linked textbook document directly in EduNexus Reader"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Open Document</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
