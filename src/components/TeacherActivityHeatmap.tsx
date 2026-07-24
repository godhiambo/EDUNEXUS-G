import { useMemo, useState } from 'react';
import { ActivityLog, UserRole } from '../types';
import { 
  Calendar, 
  Flame, 
  TrendingUp, 
  FileText, 
  Users, 
  Award,
  Sparkles,
  Info
} from 'lucide-react';

interface TeacherActivityHeatmapProps {
  logs: ActivityLog[];
}

interface HeatmapDay {
  date: Date;
  dateStr: string;
  count: number;
  dayOfWeek: number;
  label: string;
  details: {
    teacherName: string;
    teacherEmail: string;
    docTitle: string;
    docType: string;
    timestamp: string;
  }[];
}

export default function TeacherActivityHeatmap({ logs }: TeacherActivityHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  const stats = useMemo(() => {
    // 1. Get the last 30 days dates starting from today
    const daysList: HeatmapDay[] = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const past30DaysDate = new Date(today);
    past30DaysDate.setDate(today.getDate() - 29); // 30 days including today
    past30DaysDate.setHours(0, 0, 0, 0);

    // Filter teacher generation logs within the last 30 days
    const teacherGenLogs = logs.filter(log => {
      if (!log.timestamp) return false;
      const logDate = new Date(log.timestamp);
      const isTeacher = log.userRole === 'Teacher' || (log.userRole as string) === 'teacher';
      const isGenerateAction = log.action === 'generate';
      const isWithin30Days = logDate >= past30DaysDate && logDate <= today;
      return isTeacher && isGenerateAction && isWithin30Days;
    });

    // Group logs by YYYY-MM-DD
    const logsByDateStr = new Map<string, typeof teacherGenLogs>();
    teacherGenLogs.forEach(log => {
      const d = new Date(log.timestamp);
      const dStr = d.getFullYear() + '-' + 
        String(d.getMonth() + 1).padStart(2, '0') + '-' + 
        String(d.getDate()).padStart(2, '0');
      
      const current = logsByDateStr.get(dStr) || [];
      current.push(log);
      logsByDateStr.set(dStr, current);
    });

    // Populate all 30 days
    for (let i = 0; i < 30; i++) {
      const currentDayDate = new Date(past30DaysDate);
      currentDayDate.setDate(past30DaysDate.getDate() + i);

      const dStr = currentDayDate.getFullYear() + '-' + 
        String(currentDayDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(currentDayDate.getDate()).padStart(2, '0');

      const dayLogs = logsByDateStr.get(dStr) || [];

      daysList.push({
        date: currentDayDate,
        dateStr: dStr,
        count: dayLogs.length,
        dayOfWeek: currentDayDate.getDay(),
        label: currentDayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' }),
        details: dayLogs.map(l => ({
          teacherName: l.userName || 'Anonymous Teacher',
          teacherEmail: l.userEmail || '',
          docTitle: l.documentTitle || l.details || 'Unnamed Document',
          docType: l.details.split('generated a')[1]?.trim() || 'Lesson Plan',
          timestamp: new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }))
      });
    }

    // Calculations for Stats
    const totalGenerated = teacherGenLogs.length;

    // Peak active day
    let peakCount = 0;
    let peakDateLabel = 'N/A';
    daysList.forEach(day => {
      if (day.count > peakCount) {
        peakCount = day.count;
        peakDateLabel = day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      }
    });

    // Most active teacher
    const teacherCounts = new Map<string, { count: number; email: string }>();
    teacherGenLogs.forEach(log => {
      const name = log.userName || 'Anonymous Teacher';
      const current = teacherCounts.get(name) || { count: 0, email: log.userEmail };
      current.count += 1;
      teacherCounts.set(name, current);
    });

    let topTeacherName = 'N/A';
    let topTeacherCount = 0;
    let topTeacherEmail = '';
    teacherCounts.forEach((info, name) => {
      if (info.count > topTeacherCount) {
        topTeacherCount = info.count;
        topTeacherName = name;
        topTeacherEmail = info.email;
      }
    });

    // Active days out of 30
    const activeDaysCount = daysList.filter(d => d.count > 0).length;

    // Document types breakdown
    const docTypesBreakdown = new Map<string, number>();
    teacherGenLogs.forEach(log => {
      let type = 'Other';
      const detailsLower = log.details.toLowerCase();
      if (detailsLower.includes('lesson plan')) type = 'Lesson Plan';
      else if (detailsLower.includes('scheme of work') || detailsLower.includes('scheme')) type = 'Scheme of Work';
      else if (detailsLower.includes('notes')) type = 'Lesson Notes';
      else if (detailsLower.includes('worksheet')) type = 'Worksheet';
      else if (detailsLower.includes('assessment')) type = 'Assessment';
      
      docTypesBreakdown.set(type, (docTypesBreakdown.get(type) || 0) + 1);
    });

    const docBreakdownList = Array.from(docTypesBreakdown.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    return {
      daysList,
      totalGenerated,
      peakCount,
      peakDateLabel,
      topTeacherName,
      topTeacherCount,
      topTeacherEmail,
      activeDaysCount,
      docBreakdownList
    };
  }, [logs]);

  const {
    daysList,
    totalGenerated,
    peakCount,
    peakDateLabel,
    topTeacherName,
    topTeacherCount,
    topTeacherEmail,
    activeDaysCount,
    docBreakdownList
  } = stats;

  // Theme color scale for Teacher Heatmap (Vibrant Emerald/Sage Theme)
  const getCellColor = (count: number) => {
    if (count === 0) return 'bg-[#f4f1ea] hover:bg-slate-200'; // Soft ivory empty
    if (count === 1) return 'bg-[#a9b388]/30 hover:bg-[#a9b388]/55'; // Pale green
    if (count === 2) return 'bg-[#a9b388]/60 hover:bg-[#a9b388]/80'; // Minty green
    if (count === 3) return 'bg-[#5f6f52]/60 hover:bg-[#5f6f52]/80'; // Solid Sage
    if (count <= 5) return 'bg-[#5f6f52] hover:bg-[#4a573e]'; // Deep Sage
    return 'bg-[#2d3a22] hover:bg-[#1a2414]'; // Deepest forest green
  };

  const getBorderColor = (count: number) => {
    if (count === 0) return 'border-[#e5e1da]/50';
    if (count === 1) return 'border-[#a9b388]/40';
    if (count === 2) return 'border-[#a9b388]/60';
    return 'border-transparent';
  };

  return (
    <div className="bg-[#faf9f5] border border-[#e5e1da] rounded-2xl p-6 space-y-6 shadow-sm">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700">
            <Calendar className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Teacher Activity Heatmap (Last 30 Days)</h3>
            <p className="text-xs text-slate-500">Track professional document generation frequency, collaboration speed, and curriculum material output by school faculty.</p>
          </div>
        </div>

        {/* Color Key/Legend */}
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-white border border-[#e5e1da]/60 px-3.5 py-2 rounded-xl self-start sm:self-center">
          <span>0 docs</span>
          <div className="w-3.5 h-3.5 rounded-md bg-[#f4f1ea] border border-[#e5e1da]/50" />
          <div className="w-3.5 h-3.5 rounded-md bg-[#a9b388]/30 border border-[#a9b388]/20" />
          <div className="w-3.5 h-3.5 rounded-md bg-[#a9b388]/60" />
          <div className="w-3.5 h-3.5 rounded-md bg-[#5f6f52]/60" />
          <div className="w-3.5 h-3.5 rounded-md bg-[#5f6f52]" />
          <div className="w-3.5 h-3.5 rounded-md bg-[#2d3a22]" />
          <span>6+ docs</span>
        </div>
      </div>

      {/* Analytics Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents Card */}
        <div className="bg-white border border-[#e5e1da]/70 rounded-2xl p-4 flex items-center gap-4 transition-all hover:shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Faculty Output</span>
            <span className="text-xl font-black text-slate-800 leading-none">{totalGenerated}</span>
            <span className="block text-[9px] text-slate-500">docs generated</span>
          </div>
        </div>

        {/* Active Days Card */}
        <div className="bg-white border border-[#e5e1da]/70 rounded-2xl p-4 flex items-center gap-4 transition-all hover:shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center animate-pulse">
            <Flame className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Active Days</span>
            <span className="text-xl font-black text-slate-800 leading-none">{activeDaysCount} / 30</span>
            <span className="block text-[9px] text-slate-500">days of generation</span>
          </div>
        </div>

        {/* Peak Generation Card */}
        <div className="bg-white border border-[#e5e1da]/70 rounded-2xl p-4 flex items-center gap-4 transition-all hover:shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Peak Daily Peak</span>
            <span className="text-lg font-black text-slate-800 leading-none">
              {peakCount > 0 ? `${peakCount} docs` : 'N/A'}
            </span>
            <span className="block text-[9px] text-slate-500 truncate max-w-[130px]" title={peakDateLabel}>
              on {peakDateLabel}
            </span>
          </div>
        </div>

        {/* Star Teacher Contributor Card */}
        <div className="bg-white border border-[#e5e1da]/70 rounded-2xl p-4 flex items-center gap-4 transition-all hover:shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Star Contributor</span>
            <span className="text-sm font-black text-slate-800 leading-none block truncate max-w-[140px]" title={topTeacherName}>
              {topTeacherName}
            </span>
            <span className="block text-[9px] text-slate-500">
              {topTeacherCount > 0 ? `${topTeacherCount} documents` : 'No teacher actions'}
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid container */}
      <div className="relative">
        {/* Heatmap Grid */}
        <div className="bg-white border border-[#e5e1da]/60 rounded-2xl p-5 overflow-x-auto scrollbar-thin">
          <div className="min-w-[760px] flex flex-col space-y-4">
            {/* Heatmap Days of Month Row */}
            <div className="grid grid-cols-10 gap-3">
              {daysList.map((day, idx) => {
                const isHovered = hoveredDay?.dateStr === day.dateStr;
                const formattedDayNum = day.date.getDate();
                const formattedMonth = day.date.toLocaleDateString(undefined, { month: 'short' });

                return (
                  <div
                    key={`day-key-${day.dateStr}`}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`relative p-3 rounded-xl border flex flex-col justify-between items-center h-20 transition-all duration-150 cursor-pointer ${getCellColor(day.count)} ${getBorderColor(day.count)} ${
                      isHovered ? 'ring-2 ring-[#5f6f52] scale-105 shadow-md z-10' : 'shadow-3xs'
                    }`}
                  >
                    {/* Day number & month text */}
                    <div className="flex justify-between w-full items-start">
                      <span className={`text-[10px] font-mono font-extrabold ${day.count > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                        {formattedDayNum}
                      </span>
                      <span className={`text-[8px] font-black uppercase tracking-wider ${day.count > 0 ? 'text-slate-700/60' : 'text-slate-400/50'}`}>
                        {formattedMonth}
                      </span>
                    </div>

                    {/* Dot indicators or large number */}
                    {day.count > 0 ? (
                      <span className="text-sm font-serif font-black text-slate-900 animate-fadeIn">
                        {day.count}
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-300 font-bold">-</span>
                    )}

                    {/* Weekday indicator on bottom */}
                    <span className={`text-[7px] font-bold uppercase tracking-widest ${day.count > 0 ? 'text-slate-700/70' : 'text-slate-300'}`}>
                      {day.label.split(',')[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Empty check */}
            {totalGenerated === 0 && (
              <div className="py-6 flex items-center justify-center gap-2 bg-amber-50/40 border border-amber-200/50 rounded-xl text-xs text-amber-800">
                <Info className="w-4 h-4 shrink-0" />
                <span>No document generations recorded by teachers in the past 30 days. Active simulations or logs created under alternative roles are excluded.</span>
              </div>
            )}
          </div>
        </div>

        {/* Real-time details sidebar or tooltip below */}
        {hoveredDay && (
          <div className="mt-4 bg-slate-900 border border-slate-800 text-white rounded-2xl p-4.5 shadow-xl animate-fadeIn space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-serif font-bold text-emerald-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {hoveredDay.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-wider">
                {hoveredDay.count} {hoveredDay.count === 1 ? 'generation' : 'generations'}
              </span>
            </div>

            {hoveredDay.details.length > 0 ? (
              <div className="max-h-40 overflow-y-auto space-y-2.5 pr-2 divide-y divide-slate-800/50">
                {hoveredDay.details.map((item, idx) => (
                  <div key={idx} className={`pt-2.5 ${idx === 0 ? 'pt-0' : ''} flex justify-between items-start text-xs`}>
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-200 block">{item.docTitle}</span>
                      <span className="text-[10px] text-slate-400 block">
                        Generated by <strong className="text-slate-300">{item.teacherName}</strong> ({item.teacherEmail})
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-md block">
                        {item.docType}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono mt-1 block">{item.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No document generation actions were logged by teachers on this calendar date.</p>
            )}
          </div>
        )}
      </div>

      {/* Document Types Pie/Breakdown Bar */}
      {docBreakdownList.length > 0 && (
        <div className="border-t border-[#e5e1da]/50 pt-5 space-y-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#5f6f52]" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Curriculum Materials Breakdown (Last 30 Days)</h4>
          </div>
          
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-3xs border border-[#e5e1da]/30">
            {docBreakdownList.map((item, idx) => {
              const percent = ((item.count / totalGenerated) * 100).toFixed(1);
              const colors = [
                'bg-[#5f6f52]', // primary sage
                'bg-[#a9b388]', // light sage
                'bg-[#d4a373]', // sandy amber
                'bg-[#ccd5ae]', // soft mint
                'bg-[#e9edc9]', // light yellow-green
                'bg-slate-400'   // slate grey
              ];
              const colorClass = colors[idx % colors.length];

              return (
                <div 
                  key={item.type} 
                  className={`${colorClass} h-full transition-all`} 
                  style={{ width: `${percent}%` }}
                  title={`${item.type}: ${item.count} docs (${percent}%)`}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {docBreakdownList.map((item, idx) => {
              const percent = ((item.count / totalGenerated) * 100).toFixed(1);
              const bulletColors = [
                'bg-[#5f6f52]',
                'bg-[#a9b388]',
                'bg-[#d4a373]',
                'bg-[#ccd5ae]',
                'bg-[#e9edc9]',
                'bg-slate-400'
              ];
              const bulletClass = bulletColors[idx % bulletColors.length];

              return (
                <div key={item.type} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                  <div className={`w-2.5 h-2.5 rounded-xs ${bulletClass}`} />
                  <span>{item.type}</span>
                  <span className="text-slate-400">({item.count} • {percent}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
