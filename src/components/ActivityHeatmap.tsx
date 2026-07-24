import { useMemo, useState } from 'react';
import * as d3 from 'd3';
import { ActivityLog } from '../types';
import { Calendar, Flame, TrendingUp, Sparkles } from 'lucide-react';

interface ActivityHeatmapProps {
  logs: ActivityLog[];
}

interface HeatmapDay {
  date: Date;
  dateStr: string;
  count: number;
  dayOfWeek: number; // 0 (Sun) to 6 (Sat)
  weekIndex: number;
}

export default function ActivityHeatmap({ logs }: ActivityHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  // 1. Process data: filter logs and group by date
  const processedData = useMemo(() => {
    // Filter only "generate" action logs
    const genLogs = logs.filter(l => l.action === 'generate');

    // Group logs by YYYY-MM-DD
    const countsByDay = new Map<string, number>();
    genLogs.forEach(log => {
      if (!log.timestamp) return;
      const date = new Date(log.timestamp);
      // Format to YYYY-MM-DD in local time
      const dateStr = date.getFullYear() + '-' + 
        String(date.getMonth() + 1).padStart(2, '0') + '-' + 
        String(date.getDate()).padStart(2, '0');
      
      countsByDay.set(dateStr, (countsByDay.get(dateStr) || 0) + 1);
    });

    // Determine the calendar window: 20 weeks ending today
    const numWeeks = 22;
    const today = new Date();
    today.setHours(23, 59, 59, 999); // end of today

    // Start of the calendar window (Sunday of 22 weeks ago)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (numWeeks * 7 - 1));
    // Roll back to the previous Sunday to align rows perfectly
    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDay);
    startDate.setHours(0, 0, 0, 0);

    // Generate all calendar days in this window
    const days: HeatmapDay[] = [];
    const tempDate = new Date(startDate);

    while (tempDate <= today) {
      const dateStr = tempDate.getFullYear() + '-' + 
        String(tempDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(tempDate.getDate()).padStart(2, '0');
      
      const diffTime = tempDate.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(diffDays / 7);
      const dayOfWeek = tempDate.getDay();

      days.push({
        date: new Date(tempDate),
        dateStr,
        count: countsByDay.get(dateStr) || 0,
        dayOfWeek,
        weekIndex,
      });

      tempDate.setDate(tempDate.getDate() + 1);
    }

    // Analytics summary calculations
    const totalGenerations = genLogs.length;
    let peakCount = 0;
    let peakDateStr = 'N/A';
    
    countsByDay.forEach((count, dStr) => {
      if (count > peakCount) {
        peakCount = count;
        peakDateStr = dStr;
      }
    });

    // Peak date parsing
    let peakFormatted = 'N/A';
    if (peakDateStr !== 'N/A') {
      const pParts = peakDateStr.split('-');
      const pDate = new Date(Number(pParts[0]), Number(pParts[1]) - 1, Number(pParts[2]));
      peakFormatted = pDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Active days count
    const activeDays = Array.from(countsByDay.values()).filter(c => c > 0).length;

    return {
      days,
      totalGenerations,
      peakCount,
      peakDateFormatted: peakFormatted,
      activeDays,
      numWeeks,
      startDate,
    };
  }, [logs]);

  const { days, totalGenerations, peakCount, peakDateFormatted, activeDays, numWeeks } = processedData;

  // 2. D3 Heatmap Drawing Configuration
  const cellSize = 13;
  const cellGap = 3.5;
  const topMargin = 22;
  const leftMargin = 30;
  const rightMargin = 10;
  const bottomMargin = 15;

  const width = leftMargin + numWeeks * (cellSize + cellGap) + rightMargin;
  const height = topMargin + 7 * (cellSize + cellGap) + bottomMargin;

  // Stable theme color scales aligned with the natural/organic school theme (#5f6f52 - primary sage green)
  const getCellColor = (count: number) => {
    if (count === 0) return '#f4f1ea'; // Soft ivory background
    if (count === 1) return '#dce4d7'; // Soft light sage
    if (count === 2) return '#b9c9b0'; // Light-medium sage
    if (count === 3) return '#8fa881'; // Medium-dark sage
    if (count <= 5) return '#6b825d';  // Dark sage
    return '#46553b';                  // Deep forest sage green for heavy activity
  };

  // Determine month labels based on the first day of each week
  const monthLabels = useMemo(() => {
    const labels: { x: number; text: string }[] = [];
    const seenMonths = new Set<string>();

    days.forEach(day => {
      if (day.dayOfWeek === 0) { // Check only on Sundays (first cell of column)
        const monthName = day.date.toLocaleDateString(undefined, { month: 'short' });
        const yearSuffix = day.date.getFullYear() % 100;
        const fullLabel = `${monthName} '${yearSuffix}`;
        
        if (!seenMonths.has(fullLabel)) {
          seenMonths.add(fullLabel);
          labels.push({
            x: leftMargin + day.weekIndex * (cellSize + cellGap),
            text: monthName,
          });
        }
      }
    });

    // To prevent overlapping on smaller screens, filter or space them
    return labels;
  }, [days, leftMargin, cellSize, cellGap]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-[#fcfbf9] border border-[#e5e1da] rounded-2xl p-5 space-y-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#5f6f52]/10 border border-[#5f6f52]/20 flex items-center justify-center text-[#5f6f52]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Curriculum Generation Heatmap</h3>
            <p className="text-[11px] text-slate-500">Visual representation of materials generated daily across school departments</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 self-end sm:self-center">
          <span>Less</span>
          <div className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: '#f4f1ea' }} />
          <div className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: '#dce4d7' }} />
          <div className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: '#b9c9b0' }} />
          <div className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: '#8fa881' }} />
          <div className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: '#6b825d' }} />
          <div className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: '#46553b' }} />
          <span>More</span>
        </div>
      </div>

      {/* Grid Analytics Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-[#e5e1da]/60 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Generated</span>
            <span className="text-lg font-black text-slate-800 leading-none">{totalGenerations}</span>
          </div>
        </div>

        <div className="bg-white border border-[#e5e1da]/60 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Days</span>
            <span className="text-lg font-black text-slate-800 leading-none">{activeDays} <span className="text-[10px] font-medium text-slate-400">days</span></span>
          </div>
        </div>

        <div className="bg-white border border-[#e5e1da]/60 rounded-xl p-3 flex items-center gap-3 col-span-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Peak Daily Generation</span>
            <span className="text-xs font-bold text-slate-800">
              {peakCount > 0 ? (
                <>
                  <strong className="text-base font-black mr-1">{peakCount}</strong> docs on {peakDateFormatted}
                </>
              ) : (
                'No Generations Yet'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* SVG Heatmap Visualization */}
      <div className="relative overflow-x-auto pb-2 scrollbar-thin">
        <div className="min-w-[420px]">
          <svg 
            width="100%" 
            viewBox={`0 0 ${width} ${height}`}
            className="overflow-visible font-sans"
          >
            {/* Month Labels */}
            <g>
              {monthLabels.map((lbl, idx) => (
                <text
                  key={`month-${idx}`}
                  x={lbl.x}
                  y={12}
                  fontSize="9px"
                  fontWeight="bold"
                  fill="#94a3b8"
                >
                  {lbl.text}
                </text>
              ))}
            </g>

            {/* Day of Week Labels (Mon, Wed, Fri for standard clean layout) */}
            <g>
              {[1, 3, 5].map((dayIdx) => (
                <text
                  key={`day-label-${dayIdx}`}
                  x={8}
                  y={topMargin + dayIdx * (cellSize + cellGap) + cellSize - 2}
                  fontSize="9px"
                  fontWeight="bold"
                  fill="#94a3b8"
                  textAnchor="start"
                >
                  {dayNames[dayIdx]}
                </text>
              ))}
            </g>

            {/* Heatmap Grid Cells */}
            <g>
              {days.map((day) => {
                const x = leftMargin + day.weekIndex * (cellSize + cellGap);
                const y = topMargin + day.dayOfWeek * (cellSize + cellGap);
                const isHovered = hoveredDay?.dateStr === day.dateStr;

                return (
                  <rect
                    key={`day-cell-${day.dateStr}`}
                    x={x}
                    y={y}
                    width={cellSize}
                    height={cellSize}
                    rx={2.5}
                    ry={2.5}
                    fill={getCellColor(day.count)}
                    stroke={isHovered ? '#475569' : 'transparent'}
                    strokeWidth={1}
                    className="transition-all duration-150 cursor-pointer"
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                  />
                );
              })}
            </g>
          </svg>
        </div>

        {/* Dynamic Tooltip */}
        {hoveredDay && (
          <div 
            className="absolute bg-slate-800 text-white text-[10px] py-1.5 px-2.5 rounded-lg shadow-md z-10 pointer-events-none border border-slate-700 animate-fadeIn"
            style={{
              left: `${Math.min(
                leftMargin + hoveredDay.weekIndex * (cellSize + cellGap) + 12,
                width - 120
              )}px`,
              top: `${Math.min(
                topMargin + hoveredDay.dayOfWeek * (cellSize + cellGap) - 35,
                height - 10
              )}px`
            }}
          >
            <p className="font-bold">
              {hoveredDay.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-[#a7f3d0] font-extrabold mt-0.5">
              {hoveredDay.count} {hoveredDay.count === 1 ? 'material' : 'materials'} generated
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
