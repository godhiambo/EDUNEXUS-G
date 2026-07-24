import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { 
  Maximize2, 
  Minimize2, 
  Upload, 
  Download, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  FileText, 
  Sparkles, 
  TrendingUp, 
  Award, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  Filter, 
  Info,
  RefreshCw,
  HelpCircle,
  Play,
  Layers,
  Brain,
  Zap,
  AlertTriangle,
  TrendingDown,
  Flame,
  Bell,
  Trophy,
  Send,
  Calendar
} from 'lucide-react';

interface PerformanceRecord {
  id: string;
  name: string;
  admissionNumber: string;
  subject: string;
  marks: number;
  date: string;
}

const DEFAULT_SUBJECTS = [
  'Mathematics',
  'English Literature',
  'Kiswahili',
  'Physics',
  'Chemistry',
  'Biology',
  'History & Geography'
];

interface BenchmarkBand {
  id: string;
  label: string;
  shortLabel: string;
  min: number;
  max: number;
  activeColor: string;
  lightColor: string;
  textColor: string;
  hoverClass: string;
}

const BANDS: BenchmarkBand[] = [
  { id: 'remedial', label: 'Remedial / Needs Support (<50%)', shortLabel: 'Remedial (<50%)', min: 0, max: 49, activeColor: '#f43f5e', lightColor: '#fff1f2', textColor: '#991b1b', hoverClass: 'border-red-400' },
  { id: 'approaching', label: 'Approaching Benchmark (50-64%)', shortLabel: 'Approaching (50-64%)', min: 50, max: 64, activeColor: '#f59e0b', lightColor: '#fffbeb', textColor: '#92400e', hoverClass: 'border-amber-400' },
  { id: 'proficient', label: 'Meeting Benchmark (65-79%)', shortLabel: 'Proficient (65-79%)', min: 65, max: 79, activeColor: '#3b82f6', lightColor: '#eff6ff', textColor: '#1e40af', hoverClass: 'border-blue-400' },
  { id: 'exceeding', label: 'Exceeding Benchmark (80-100%)', shortLabel: 'Exceeding (80-100%)', min: 80, max: 100, activeColor: '#10b981', lightColor: '#ecfdf5', textColor: '#065f46', hoverClass: 'border-emerald-400' }
];

export default function LearnersPerformance() {
  const [records, setRecords] = useState<PerformanceRecord[]>(() => {
    const saved = localStorage.getItem('learners_performance_records_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    // Seed default records
    const seed: PerformanceRecord[] = [
      { id: 'perf-l1', name: 'Alamin Yusuf', admissionNumber: 'ADM-2026-0041', subject: 'Mathematics', marks: 84, date: '2026-07-10' },
      { id: 'perf-l2', name: 'Mercy Achieng', admissionNumber: 'ADM-2026-0012', subject: 'Physics', marks: 76, date: '2026-07-11' },
      { id: 'perf-l3', name: 'John Kiprop', admissionNumber: 'ADM-2026-0089', subject: 'Chemistry', marks: 59, date: '2026-07-12' },
      { id: 'perf-l4', name: 'Sarah Mwangi', admissionNumber: 'ADM-2026-0104', subject: 'Biology', marks: 91, date: '2026-07-09' },
      { id: 'perf-l5', name: 'David Omwamba', admissionNumber: 'ADM-2026-0155', subject: 'English Literature', marks: 45, date: '2026-07-13' },
      { id: 'perf-l6', name: 'Purity Cherono', admissionNumber: 'ADM-2026-0077', subject: 'Mathematics', marks: 95, date: '2026-07-14' },
      { id: 'perf-l7', name: 'Brian Omondi', admissionNumber: 'ADM-2026-0094', subject: 'History & Geography', marks: 62, date: '2026-07-12' }
    ];
    localStorage.setItem('learners_performance_records_v2', JSON.stringify(seed));
    return seed;
  });

  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [breakdownTab, setBreakdownTab] = useState<'cards' | 'heatmap'>('heatmap');
  const [hoveredCell, setHoveredCell] = useState<{
    subject: string;
    bandId: string;
    bandLabel: string;
    count: number;
    pct: number;
    students: { name: string; marks: number }[];
    x: number;
    y: number;
  } | null>(null);
  const heatmapContainerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All');
  
  // File upload state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual record form state
  const [isAddingManual, setIsAddingManual] = useState<boolean>(false);
  const [manualName, setManualName] = useState<string>('');
  const [manualAdm, setManualAdm] = useState<string>('');
  const [manualSubject, setManualSubject] = useState<string>('Mathematics');
  const [manualMarks, setManualMarks] = useState<number>(75);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [editingAdm, setEditingAdm] = useState<string>('');
  const [editingSubject, setEditingSubject] = useState<string>('');
  const [editingMarks, setEditingMarks] = useState<number>(0);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('learners_performance_records_v2', JSON.stringify(records));
  }, [records]);

  // Handle manual addition
  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualAdm.trim()) {
      setUploadError('Please fill in both Student Name and Admission Number.');
      return;
    }
    const newRecord: PerformanceRecord = {
      id: `perf-manual-${Date.now()}`,
      name: manualName.trim(),
      admissionNumber: manualAdm.trim().toUpperCase(),
      subject: manualSubject,
      marks: Math.max(0, Math.min(100, manualMarks)),
      date: new Date().toISOString().split('T')[0]
    };
    setRecords(prev => [newRecord, ...prev]);
    setManualName('');
    setManualAdm('');
    setManualMarks(75);
    setIsAddingManual(false);
    setUploadError(null);
    setUploadSuccess('Student performance record added successfully!');
    setTimeout(() => setUploadSuccess(null), 3000);
  };

  // Delete individual record
  const handleDeleteRecord = (id: string) => {
    if (window.confirm('Are you sure you want to delete this performance record?')) {
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  // Bulk clear records
  const handleClearAll = () => {
    if (window.confirm('WARNING: Are you sure you want to delete ALL performance records? This action cannot be undone.')) {
      setRecords([]);
      setUploadSuccess('All records cleared successfully.');
      setTimeout(() => setUploadSuccess(null), 3000);
    }
  };

  // Reset to default seed
  const handleResetDefaults = () => {
    const seed: PerformanceRecord[] = [
      { id: 'perf-l1', name: 'Alamin Yusuf', admissionNumber: 'ADM-2026-0041', subject: 'Mathematics', marks: 84, date: '2026-07-10' },
      { id: 'perf-l2', name: 'Mercy Achieng', admissionNumber: 'ADM-2026-0012', subject: 'Physics', marks: 76, date: '2026-07-11' },
      { id: 'perf-l3', name: 'John Kiprop', admissionNumber: 'ADM-2026-0089', subject: 'Chemistry', marks: 59, date: '2026-07-12' },
      { id: 'perf-l4', name: 'Sarah Mwangi', admissionNumber: 'ADM-2026-0104', subject: 'Biology', marks: 91, date: '2026-07-09' },
      { id: 'perf-l5', name: 'David Omwamba', admissionNumber: 'ADM-2026-0155', subject: 'English Literature', marks: 45, date: '2026-07-13' },
      { id: 'perf-l6', name: 'Purity Cherono', admissionNumber: 'ADM-2026-0077', subject: 'Mathematics', marks: 95, date: '2026-07-14' },
      { id: 'perf-l7', name: 'Brian Omondi', admissionNumber: 'ADM-2026-0094', subject: 'History & Geography', marks: 62, date: '2026-07-12' }
    ];
    setRecords(seed);
    setUploadSuccess('Database reset to original benchmark records.');
    setTimeout(() => setUploadSuccess(null), 3000);
  };

  // Inline editing handoff
  const startEditing = (record: PerformanceRecord) => {
    setEditingId(record.id);
    setEditingName(record.name);
    setEditingAdm(record.admissionNumber);
    setEditingSubject(record.subject);
    setEditingMarks(record.marks);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEditing = (id: string) => {
    if (!editingName.trim() || !editingAdm.trim()) {
      alert('Name and Admission Number cannot be empty!');
      return;
    }
    setRecords(prev => prev.map(r => r.id === id ? {
      ...r,
      name: editingName.trim(),
      admissionNumber: editingAdm.trim().toUpperCase(),
      subject: editingSubject,
      marks: Math.max(0, Math.min(100, editingMarks))
    } : r));
    setEditingId(null);
  };

  // CSV Generator
  const downloadCSVTemplate = () => {
    const headers = 'name,admission_number,subject,marks\n';
    const sampleRows = [
      'Otieno Godfrey,ADM-2026-0111,Mathematics,88',
      'Fatuma Ali,ADM-2026-0090,Physics,72',
      'Naomi Wanjiku,ADM-2026-0145,Chemistry,64',
      'Kamau Kuria,ADM-2026-0210,Biology,49'
    ].join('\n');
    
    const blob = new Blob([headers + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'learners_performance_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV File Upload Parser
  const parseCSVFile = (text: string) => {
    try {
      const lines = text.split(/\r?\n/);
      if (lines.length < 2) {
        throw new Error('CSV file is empty or missing data rows.');
      }

      // Check header row for column mapping
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      
      const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('student'));
      const admIdx = headers.findIndex(h => h.includes('admission') || h.includes('adm') || h.includes('number') || h.includes('id'));
      const subIdx = headers.findIndex(h => h.includes('subject') || h.includes('course'));
      const marksIdx = headers.findIndex(h => h.includes('marks') || h.includes('score') || h.includes('grade'));

      if (nameIdx === -1 || admIdx === -1 || subIdx === -1 || marksIdx === -1) {
        throw new Error('Missing required columns! Template columns must include headings like: name, admission_number, subject, marks');
      }

      const importedRecords: PerformanceRecord[] = [];
      let parsedCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty rows

        // Basic split by comma, respecting quotes if present
        const columns = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        
        if (columns.length < Math.max(nameIdx, admIdx, subIdx, marksIdx) + 1) {
          errorCount++;
          continue;
        }

        const name = columns[nameIdx];
        const admissionNumber = columns[admIdx].toUpperCase();
        const subject = columns[subIdx];
        const marksStr = columns[marksIdx];
        const marks = parseInt(marksStr, 10);

        if (name && admissionNumber && subject && !isNaN(marks)) {
          importedRecords.push({
            id: `perf-uploaded-${Date.now()}-${i}`,
            name,
            admissionNumber,
            subject,
            marks: Math.max(0, Math.min(100, marks)),
            date: new Date().toISOString().split('T')[0]
          });
          parsedCount++;
        } else {
          errorCount++;
        }
      }

      if (importedRecords.length === 0) {
        throw new Error('Could not parse any valid records. Check that marks are integers and columns are non-empty.');
      }

      setRecords(prev => [...importedRecords, ...prev]);
      setUploadError(null);
      setUploadSuccess(`Successfully imported ${parsedCount} learner records! ${errorCount > 0 ? `(${errorCount} rows had errors and were skipped)` : ''}`);
      setTimeout(() => setUploadSuccess(null), 5000);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to parse CSV file. Ensure the template format is valid.');
      setUploadSuccess(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      parseCSVFile(text);
    };
    reader.onerror = () => {
      setUploadError('Failed to read the uploaded file.');
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
  };

  // Drag and Drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setUploadError('Only CSV files are supported for import templates.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      parseCSVFile(text);
    };
    reader.readAsText(file);
  };

  // Filtered List & Stats calculation
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const matchSearch = 
        rec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.subject.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchSubject = selectedSubjectFilter === 'All' || rec.subject === selectedSubjectFilter;
      
      return matchSearch && matchSubject;
    });
  }, [records, searchTerm, selectedSubjectFilter]);

  const stats = useMemo(() => {
    if (filteredRecords.length === 0) {
      return {
        avg: 0,
        topName: 'N/A',
        topMarks: 0,
        passRate: 0,
        total: 0,
        strugglingCount: 0
      };
    }

    const total = filteredRecords.length;
    const sum = filteredRecords.reduce((s, r) => s + r.marks, 0);
    const avg = Math.round(sum / total);

    let topMarks = -1;
    let topName = 'N/A';
    let passingCount = 0;
    let strugglingCount = 0;

    filteredRecords.forEach(r => {
      if (r.marks > topMarks) {
        topMarks = r.marks;
        topName = r.name;
      }
      if (r.marks >= 50) {
        passingCount++;
      } else {
        strugglingCount++;
      }
    });

    const passRate = Math.round((passingCount / total) * 100);

    return {
      avg,
      topName,
      topMarks,
      passRate,
      total,
      strugglingCount
    };
  }, [filteredRecords]);

  // Subject distribution for custom micro visual chart
  const subjectDistribution = useMemo(() => {
    const counts: { [subj: string]: { sum: number; count: number } } = {};
    records.forEach(r => {
      if (!counts[r.subject]) {
        counts[r.subject] = { sum: 0, count: 0 };
      }
      counts[r.subject].sum += r.marks;
      counts[r.subject].count += 1;
    });

    return Object.keys(counts).map(subj => {
      const avg = Math.round(counts[subj].sum / counts[subj].count);
      return {
        subject: subj,
        avg,
        count: counts[subj].count
      };
    }).sort((a, b) => b.avg - a.avg);
  }, [records]);

  const subjects = useMemo(() => {
    const list = Array.from(new Set(records.map(r => r.subject)));
    return list.length > 0 ? list.sort() : DEFAULT_SUBJECTS;
  }, [records]);

  const heatmapData = useMemo(() => {
    return subjects.map(subj => {
      const subjRecords = records.filter(r => r.subject === subj);
      const total = subjRecords.length;
      
      const remedial = subjRecords.filter(r => r.marks < 50);
      const approaching = subjRecords.filter(r => r.marks >= 50 && r.marks <= 64);
      const proficient = subjRecords.filter(r => r.marks >= 65 && r.marks <= 79);
      const exceeding = subjRecords.filter(r => r.marks >= 80);

      return {
        subject: subj,
        total,
        remedial: {
          count: remedial.length,
          pct: total > 0 ? Math.round((remedial.length / total) * 100) : 0,
          students: remedial.map(r => ({ name: r.name, marks: r.marks }))
        },
        approaching: {
          count: approaching.length,
          pct: total > 0 ? Math.round((approaching.length / total) * 100) : 0,
          students: approaching.map(r => ({ name: r.name, marks: r.marks }))
        },
        proficient: {
          count: proficient.length,
          pct: total > 0 ? Math.round((proficient.length / total) * 100) : 0,
          students: proficient.map(r => ({ name: r.name, marks: r.marks }))
        },
        exceeding: {
          count: exceeding.length,
          pct: total > 0 ? Math.round((exceeding.length / total) * 100) : 0,
          students: exceeding.map(r => ({ name: r.name, marks: r.marks }))
        }
      };
    });
  }, [records, subjects]);

  // Flashcard Mastery Telemetry & Trends Data for Recharts
  const [flashcardChartMode, setFlashcardChartMode] = useState<'topics' | 'trends'>('topics');
  const [selectedTopicSubject, setSelectedTopicSubject] = useState<string>('All');

  // Teacher Daily Mastery Goal State
  const [dailyGoalTarget, setDailyGoalTarget] = useState<number>(20);
  const [dailyCompletedCount, setDailyCompletedCount] = useState<number>(14);
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [customGoalInput, setCustomGoalInput] = useState<string>('20');

  // 100% Core Topic Mastery Notification Trigger State
  interface MasteryAlert {
    id: string;
    studentName: string;
    admissionNumber: string;
    topic: string;
    subject: string;
    cardsMastered: number;
    timestamp: string;
    isRead: boolean;
  }

  const [masteryNotifications, setMasteryNotifications] = useState<MasteryAlert[]>([
    {
      id: 'alert-1',
      studentName: 'Amina Abdullahi',
      admissionNumber: 'ADM-2026-0301',
      topic: 'Linear Equations',
      subject: 'Mathematics',
      cardsMastered: 48,
      timestamp: 'Today at 09:15 AM',
      isRead: false
    },
    {
      id: 'alert-2',
      studentName: 'Grace Wambui',
      admissionNumber: 'ADM-2026-0305',
      topic: 'Grammatical Syntax',
      subject: 'English Literature',
      cardsMastered: 35,
      timestamp: 'Yesterday at 04:30 PM',
      isRead: true
    }
  ]);

  const [activeToastAlert, setActiveToastAlert] = useState<MasteryAlert | null>(null);
  const [selectedStudentForAlert, setSelectedStudentForAlert] = useState<string>('Amina Abdullahi');
  const [selectedTopicForAlert, setSelectedTopicForAlert] = useState<string>('Linear Equations');
  const [customCongratulationMsg, setCustomCongratulationMsg] = useState<{ studentName: string; msg: string } | null>(null);

  // Daily Flashcard Activity Consistency Calendar Heatmap State
  const [heatmapSelectedStudent, setHeatmapSelectedStudent] = useState<string>('Alamin Yusuf');
  const [heatmapSubjectFilter, setHeatmapSubjectFilter] = useState<string>('ALL');
  const [hoveredHeatmapDay, setHoveredHeatmapDay] = useState<{
    dateStr: string;
    formattedDate: string;
    count: number;
    accuracy: number;
    subject: string;
    dayName: string;
  } | null>(null);

  const [customHeatmapLogs, setCustomHeatmapLogs] = useState<Record<string, Record<string, number>>>({});

  // Generated 16-week (112 days) daily activity matrix for the selected student
  const studentHeatmapMatrix = useMemo(() => {
    const weeksCount = 16;
    const daysPerWeek = 7;
    const today = new Date();
    
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthLabels: { index: number; name: string }[] = [];

    const totalDays = weeksCount * daysPerWeek;
    
    const getMockCount = (student: string, dateKey: string) => {
      let hash = 0;
      const str = `${student}-${dateKey}-${heatmapSubjectFilter}`;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      const norm = Math.abs(hash) % 100;
      
      const customAdded = customHeatmapLogs[student]?.[dateKey] || 0;

      if (norm < 25) return 0 + customAdded;
      if (norm < 50) return Math.floor(5 + (norm % 8)) + customAdded;
      if (norm < 75) return Math.floor(14 + (norm % 12)) + customAdded;
      if (norm < 90) return Math.floor(26 + (norm % 10)) + customAdded;
      return Math.floor(38 + (norm % 15)) + customAdded;
    };

    const getMockAccuracy = (count: number, dateKey: string) => {
      if (count === 0) return 0;
      let hash = 0;
      for (let i = 0; i < dateKey.length; i++) {
        hash = (hash << 5) - hash + dateKey.charCodeAt(i);
        hash |= 0;
      }
      return 82 + (Math.abs(hash) % 18);
    };

    const grid: {
      dateStr: string;
      formattedDate: string;
      count: number;
      accuracy: number;
      subject: string;
      dayName: string;
      level: number;
    }[][] = [];

    let totalCardsReviewed = 0;
    let activeDaysCount = 0;
    let totalAccuracySum = 0;
    let currentStreak = 0;
    let isStreakActive = true;

    for (let w = 0; w < weeksCount; w++) {
      const weekCol = [];
      for (let d = 0; d < daysPerWeek; d++) {
        const dayOffset = (weeksCount - 1 - w) * 7 + (6 - d);
        const cellDate = new Date(today);
        cellDate.setDate(today.getDate() - dayOffset);

        const dateStr = cellDate.toISOString().split('T')[0];
        const formattedDate = cellDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const dayName = dayLabels[cellDate.getDay()];

        if (d === 0 && cellDate.getDate() <= 7) {
          monthLabels.push({ index: w, name: cellDate.toLocaleDateString('en-US', { month: 'short' }) });
        }

        const count = getMockCount(heatmapSelectedStudent, dateStr);
        const accuracy = getMockAccuracy(count, dateStr);
        const subject = heatmapSubjectFilter === 'ALL' ? (['Mathematics', 'Physics', 'Biology', 'English Literature'][cellDate.getDay() % 4]) : heatmapSubjectFilter;

        let level = 0;
        if (count > 0 && count <= 9) level = 1;
        else if (count >= 10 && count <= 19) level = 2;
        else if (count >= 20 && count <= 34) level = 3;
        else if (count >= 35) level = 4;

        if (count > 0) {
          totalCardsReviewed += count;
          activeDaysCount++;
          totalAccuracySum += accuracy;
        }

        weekCol.push({
          dateStr,
          formattedDate,
          count,
          accuracy,
          subject,
          dayName,
          level
        });
      }
      grid.push(weekCol);
    }

    const flatDays = grid.flat().reverse();
    for (const day of flatDays) {
      if (day.count > 0 && isStreakActive) {
        currentStreak++;
      } else if (day.count === 0) {
        isStreakActive = false;
      }
    }

    const avgAccuracy = activeDaysCount > 0 ? Math.round(totalAccuracySum / activeDaysCount) : 0;
    const consistencyPct = Math.round((activeDaysCount / totalDays) * 100);

    return {
      grid,
      monthLabels,
      totalCardsReviewed,
      activeDaysCount,
      totalDays,
      currentStreak,
      avgAccuracy,
      consistencyPct
    };
  }, [heatmapSelectedStudent, heatmapSubjectFilter, customHeatmapLogs]);

  const handleLogHeatmapSessionToday = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setCustomHeatmapLogs(prev => ({
      ...prev,
      [heatmapSelectedStudent]: {
        ...(prev[heatmapSelectedStudent] || {}),
        [todayStr]: (prev[heatmapSelectedStudent]?.[todayStr] || 0) + 15
      }
    }));
  };

  const handleSimulate100PercentMasteryAlert = () => {
    const student = records.find(r => r.name === selectedStudentForAlert) || { name: selectedStudentForAlert, admission_number: 'ADM-2026-0301' };
    const topicObj = flashcardTopicData.find(t => t.topic === selectedTopicForAlert) || { topic: selectedTopicForAlert, subject: 'Mathematics', totalCards: 40 };

    const newAlert: MasteryAlert = {
      id: `alert-${Date.now()}`,
      studentName: student.name,
      admissionNumber: student.admission_number,
      topic: topicObj.topic,
      subject: topicObj.subject,
      cardsMastered: topicObj.totalCards,
      timestamp: 'Just now',
      isRead: false
    };

    setMasteryNotifications(prev => [newAlert, ...prev]);
    setActiveToastAlert(newAlert);

    setTimeout(() => {
      setActiveToastAlert(null);
    }, 5000);
  };

  const flashcardTopicData = useMemo(() => {
    // Topic-wise flashcard mastery with SM-2 spaced repetition metrics
    const sampleTopicStats = [
      { topic: 'Linear Equations', subject: 'Mathematics', masteredPct: 82, inProgressPct: 12, challengingPct: 6, totalCards: 48, easeFactor: 2.65, avgRepetitions: 3.8 },
      { topic: 'Newtonian Mechanics', subject: 'Physics', masteredPct: 45, inProgressPct: 30, challengingPct: 25, totalCards: 60, easeFactor: 1.85, avgRepetitions: 1.9 },
      { topic: 'Organic Chemistry', subject: 'Chemistry', masteredPct: 38, inProgressPct: 34, challengingPct: 28, totalCards: 55, easeFactor: 1.72, avgRepetitions: 1.6 },
      { topic: 'Cellular Genetics', subject: 'Biology', masteredPct: 76, inProgressPct: 16, challengingPct: 8, totalCards: 42, easeFactor: 2.48, avgRepetitions: 3.2 },
      { topic: 'Grammatical Syntax', subject: 'English Literature', masteredPct: 88, inProgressPct: 9, challengingPct: 3, totalCards: 35, easeFactor: 2.82, avgRepetitions: 4.1 },
      { topic: 'Early Civilizations', subject: 'History & Geography', masteredPct: 64, inProgressPct: 22, challengingPct: 14, totalCards: 50, easeFactor: 2.20, avgRepetitions: 2.7 },
      { topic: 'Quadratic Functions', subject: 'Mathematics', masteredPct: 52, inProgressPct: 28, challengingPct: 20, totalCards: 40, easeFactor: 1.98, avgRepetitions: 2.1 },
      { topic: 'Thermodynamics', subject: 'Physics', masteredPct: 40, inProgressPct: 32, challengingPct: 28, totalCards: 52, easeFactor: 1.68, avgRepetitions: 1.5 }
    ];

    if (selectedTopicSubject === 'All') return sampleTopicStats;
    return sampleTopicStats.filter(item => item.subject === selectedTopicSubject);
  }, [selectedTopicSubject]);

  const flashcardTrendData = useMemo(() => {
    return [
      { week: 'Wk 1', MathMastery: 25, ScienceMastery: 20, HumanitiesMastery: 35, OverallMastery: 27 },
      { week: 'Wk 2', MathMastery: 42, ScienceMastery: 35, HumanitiesMastery: 50, OverallMastery: 42 },
      { week: 'Wk 3', MathMastery: 58, ScienceMastery: 48, HumanitiesMastery: 62, OverallMastery: 56 },
      { week: 'Wk 4', MathMastery: 71, ScienceMastery: 60, HumanitiesMastery: 74, OverallMastery: 68 },
      { week: 'Wk 5', MathMastery: 82, ScienceMastery: 68, HumanitiesMastery: 84, OverallMastery: 78 },
      { week: 'Wk 6 (Current)', MathMastery: 89, ScienceMastery: 75, HumanitiesMastery: 88, OverallMastery: 84 }
    ];
  }, []);

  const mostChallengingTopic = useMemo(() => {
    return [...flashcardTopicData].sort((a, b) => b.challengingPct - a.challengingPct)[0];
  }, [flashcardTopicData]);

  const highestMasteryTopic = useMemo(() => {
    return [...flashcardTopicData].sort((a, b) => b.masteredPct - a.masteredPct)[0];
  }, [flashcardTopicData]);

  // Demo direct load template injection
  const injectSampleData = () => {
    const text = `name,admission_number,subject,marks
Amina Abdullahi,ADM-2026-0301,Mathematics,92
David Kipruto,ADM-2026-0302,Physics,41
Millicent Atieno,ADM-2026-0303,Chemistry,78
Wycliffe Otieno,ADM-2026-0304,Biology,55
Grace Wambui,ADM-2026-0305,English Literature,83
Zuberi Juma,ADM-2026-0306,History & Geography,67
Lydia Cherotich,ADM-2026-0307,Mathematics,38
Daniel Ndambuki,ADM-2026-0308,Physics,89`;
    parseCSVFile(text);
  };

  const handleToggleFullscreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Keyboard shortcut to close fullscreen with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  const containerClasses = isFullScreen 
    ? "fixed inset-0 z-50 bg-[#fdfbf7] p-8 flex flex-col overflow-y-auto"
    : "bg-white border border-[#e5e1da] rounded-2xl p-6 space-y-6 shadow-xs flex flex-col";

  return (
    <div className={containerClasses} id="learners-performance-hub">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700 shrink-0">
            <Award className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-serif font-black text-slate-800">Learners' Performance Registry</h3>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/50 rounded-full text-[9px] font-bold tracking-wider uppercase">
                Active Assessment Tracker
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-xl mt-0.5">
              Securely register student subject scores, evaluate overall progress metrics, and automatically calibrate teaching priorities for the next curriculum interval.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Download CSV Template */}
          <button
            type="button"
            onClick={downloadCSVTemplate}
            title="Download CSV upload spreadsheet template"
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Template</span>
          </button>

          {/* Load Demo Data */}
          <button
            type="button"
            onClick={injectSampleData}
            title="Inject template data to preview instantly"
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Load Demo Template</span>
          </button>

          {/* Toggle Fullscreen Classroom Display */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            title={isFullScreen ? "Exit Fullscreen" : "Expand to Fullscreen Classroom Display"}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl transition flex items-center justify-center cursor-pointer"
          >
            {isFullScreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Overview Analytics Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Registered Students */}
        <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4 flex items-center gap-4 transition hover:shadow-3xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/50 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Roster Count</span>
            <span className="text-xl font-black text-slate-800 leading-none block">{stats.total}</span>
            <span className="block text-[9px] text-slate-500 truncate">active scores</span>
          </div>
        </div>

        {/* Class Marks Average */}
        <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4 flex items-center gap-4 transition hover:shadow-3xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/50 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Class Average</span>
            <span className="text-xl font-black text-slate-800 leading-none block">{stats.avg}%</span>
            <span className="block text-[9px] text-slate-500">of 100 maximum</span>
          </div>
        </div>

        {/* Roster Pass Rate */}
        <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4 flex items-center gap-4 transition hover:shadow-3xs">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            stats.passRate >= 70 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' 
              : stats.passRate >= 50 
                ? 'bg-amber-50 text-amber-600 border-amber-100/50' 
                : 'bg-red-50 text-red-600 border-red-100/50'
          }`}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Pass Rate (≥50)</span>
            <span className="text-xl font-black text-slate-800 leading-none block">{stats.passRate}%</span>
            <span className="block text-[9px] text-slate-500">{stats.total - stats.strugglingCount} passing</span>
          </div>
        </div>

        {/* Top Performer */}
        <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4 flex items-center gap-4 transition hover:shadow-3xs lg:col-span-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/50 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Top Performer</span>
            <span className="text-sm font-black text-slate-800 leading-none block truncate max-w-[170px]" title={stats.topName}>
              {stats.topName}
            </span>
            <span className="block text-[10px] text-slate-500 font-bold">
              {stats.topMarks > 0 ? `${stats.topMarks}% high score` : 'No scores loaded'}
            </span>
          </div>
        </div>
      </div>

      {/* Upload Panel & Form Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Drag and Drop CSV Template Uploader - 7 Columns */}
        <div className="lg:col-span-7 flex flex-col justify-between border border-[#e5e1da]/80 bg-white rounded-2xl p-5 shadow-3xs relative overflow-hidden">
          <div className="space-y-3.5">
            <div className="flex items-center gap-2">
              <Upload className="w-4.5 h-4.5 text-[#5f6f52]" />
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-700">Template Upload Desk</h4>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Drag-and-drop or upload your filled evaluation sheets. Socratic AI instantly imports, maps columns, processes metrics, and charts grade spreads dynamically.
            </p>

            {/* Drag Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer text-center select-none ${
                isDragging 
                  ? 'border-[#5f6f52] bg-[#5f6f52]/5 scale-[0.99] shadow-inner' 
                  : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/50'
              }`}
            >
              <input 
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <FileText className="w-5 h-5 text-slate-400" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">
                  <span className="text-[#5f6f52] underline">Click to choose file</span> or drag spreadsheet here
                </p>
                <p className="text-[10px] text-slate-400">CSV file format with headers: name, admission_number, subject, marks</p>
              </div>
            </div>
          </div>

          {/* Feedback logs */}
          {(uploadError || uploadSuccess) && (
            <div className="mt-4 animate-fadeIn">
              {uploadError && (
                <div className="flex items-start gap-2 bg-rose-50 border border-rose-200/50 text-rose-800 p-3 rounded-xl text-xs">
                  <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}
              {uploadSuccess && (
                <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200/50 text-emerald-800 p-3 rounded-xl text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{uploadSuccess}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Manual Record Registry - 5 Columns */}
        <div className="lg:col-span-5 border border-[#e5e1da]/80 bg-white rounded-2xl p-5 shadow-3xs flex flex-col justify-between">
          <form onSubmit={handleAddManual} className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4.5 h-4.5 text-[#5f6f52]" />
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-700">Manual Entry Register</h4>
              </div>
              <span className="text-[9px] text-slate-400 font-bold">Quick Log</span>
            </div>

            <div className="space-y-3">
              {/* Student Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Student Full Name</label>
                <input 
                  type="text" 
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="e.g. Kiprono Koech"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#5f6f52] focus:bg-white transition"
                />
              </div>

              {/* Admission Number */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Admission Number</label>
                <input 
                  type="text" 
                  value={manualAdm}
                  onChange={(e) => setManualAdm(e.target.value)}
                  placeholder="e.g. ADM-2026-0811"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#5f6f52] focus:bg-white transition uppercase"
                />
              </div>

              {/* Subject & Marks Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subject Area</label>
                  <select
                    value={manualSubject}
                    onChange={(e) => setManualSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#5f6f52] focus:bg-white transition"
                  >
                    {DEFAULT_SUBJECTS.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Marks Obtained (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={manualMarks}
                    onChange={(e) => setManualMarks(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#5f6f52] focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#5f6f52] hover:bg-[#4d5a42] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Register Score Record</span>
            </button>
          </form>
        </div>
      </div>

      {/* Main Table Spreadsheet Registry Grid */}
      <div className="space-y-4">
        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="relative w-full sm:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, ADM number, or subject..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#5f6f52] transition shadow-3xs"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 font-bold focus:outline-none focus:border-[#5f6f52] shadow-3xs cursor-pointer"
            >
              <option value="All">All Subjects ({records.length})</option>
              {DEFAULT_SUBJECTS.map(sub => {
                const count = records.filter(r => r.subject === sub).length;
                return (
                  <option key={`subj-opt-${sub}`} value={sub}>{sub} ({count})</option>
                );
              })}
            </select>

            <button
              type="button"
              onClick={handleResetDefaults}
              title="Reset to sample benchmark records"
              className="px-3 py-2 bg-white text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Benchmark</span>
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              title="Wipe database sheet clean"
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Sheet</span>
            </button>
          </div>
        </div>

        {/* Spreadsheet Data Grid */}
        <div className="bg-white border border-[#e5e1da] rounded-2xl overflow-hidden shadow-3xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-150 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider select-none">
                  <th className="p-3.5 pl-6">Student Name</th>
                  <th className="p-3.5">Admission Number</th>
                  <th className="p-3.5">Subject area</th>
                  <th className="p-3.5">Marks (%)</th>
                  <th className="p-3.5">Performance Tier</th>
                  <th className="p-3.5">Evaluation Date</th>
                  <th className="p-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRecords.map((rec) => {
                  const isEditing = editingId === rec.id;
                  
                  // Score Tier metrics
                  let tierColor = 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
                  let tierLabel = 'Exceeding Expectation';
                  if (rec.marks < 40) {
                    tierColor = 'bg-rose-50 text-rose-700 border-rose-200/50';
                    tierLabel = 'Needs Intervention';
                  } else if (rec.marks < 60) {
                    tierColor = 'bg-amber-50 text-amber-700 border-amber-200/50';
                    tierLabel = 'Approaching Expectation';
                  } else if (rec.marks < 80) {
                    tierColor = 'bg-blue-50 text-blue-700 border-blue-200/50';
                    tierLabel = 'Meeting Expectation';
                  }

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition">
                      {/* Name Column */}
                      <td className="p-3.5 pl-6 font-bold text-slate-800">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-[#5f6f52]"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-extrabold text-[9px] flex items-center justify-center shrink-0">
                              {rec.name.charAt(0)}
                            </span>
                            <span>{rec.name}</span>
                          </div>
                        )}
                      </td>

                      {/* Admission Column */}
                      <td className="p-3.5 font-mono text-slate-600 font-semibold">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={editingAdm}
                            onChange={(e) => setEditingAdm(e.target.value)}
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-[#5f6f52] uppercase"
                          />
                        ) : (
                          rec.admissionNumber
                        )}
                      </td>

                      {/* Subject Column */}
                      <td className="p-3.5 text-slate-500 font-bold">
                        {isEditing ? (
                          <select
                            value={editingSubject}
                            onChange={(e) => setEditingSubject(e.target.value)}
                            className="bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-[#5f6f52]"
                          >
                            {DEFAULT_SUBJECTS.map(sub => (
                              <option key={`edit-${sub}`} value={sub}>{sub}</option>
                            ))}
                          </select>
                        ) : (
                          rec.subject
                        )}
                      </td>

                      {/* Marks Column */}
                      <td className="p-3.5">
                        {isEditing ? (
                          <input 
                            type="number" 
                            min="0"
                            max="100"
                            value={editingMarks}
                            onChange={(e) => setEditingMarks(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 w-16 focus:outline-none focus:border-[#5f6f52]"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{rec.marks}%</span>
                            {/* Horizontal visual indicator inside cell */}
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                              <div 
                                className={`h-full ${
                                  rec.marks >= 80 ? 'bg-emerald-500' : rec.marks >= 60 ? 'bg-blue-500' : rec.marks >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${rec.marks}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Performance Tier Badge */}
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-extrabold tracking-wider uppercase ${tierColor}`}>
                          {tierLabel}
                        </span>
                      </td>

                      {/* Date Column */}
                      <td className="p-3.5 font-mono text-slate-400 text-[10px]">
                        {rec.date}
                      </td>

                      {/* Actions Column */}
                      <td className="p-3.5 pr-6 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => saveEditing(rec.id)}
                              className="p-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 rounded-md transition"
                              title="Save Changes"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="p-1 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-md transition"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEditing(rec)}
                              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-md transition"
                              title="Edit Record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRecord(rec.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400">
                      <Info className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-serif font-bold text-slate-600">No matching performance records found.</p>
                      <p className="text-[10px] text-slate-400 mt-1">Try refining your search terms or upload an evaluation spreadsheet above.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Underlay Info helper */}
      <div className="bg-indigo-50/40 border border-indigo-150/45 rounded-2xl p-4.5 flex gap-3 text-xs leading-relaxed text-indigo-900 shadow-3xs">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-extrabold uppercase tracking-wider text-[10px] text-indigo-800">Pedagogical Calibration Mechanism</p>
          <p className="text-slate-600 text-xs">
            The marks imported into this registry are automatically linked with Socratic AI and Curriculum Generator modules. In low performance subject clusters (e.g. subjects scoring average under 50%), the generator will prioritize generating comprehensive diagnostic questions, simplified multi-step revision rubrics, and scaffolded remedial handouts to quickly shore up comprehension gaps.
          </p>
        </div>
      </div>

      {/* Display Subject Average Breakdown Section */}
      {subjectDistribution.length > 0 && (
        <div className="border-t border-[#e5e1da]/50 pt-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#5f6f52]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Subject-wise Performance Breakdown</h4>
            </div>

            {/* Toggle between Grid Cards and Heatmap View */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/60 self-start">
              <button
                type="button"
                onClick={() => setBreakdownTab('heatmap')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  breakdownTab === 'heatmap'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Benchmark Heatmap
              </button>
              <button
                type="button"
                onClick={() => setBreakdownTab('cards')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  breakdownTab === 'cards'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Subject Cards
              </button>
            </div>
          </div>

          {breakdownTab === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
              {subjectDistribution.map((item, idx) => {
                const score = item.avg;
                let scoreColor = 'bg-emerald-500';
                let textColor = 'text-emerald-700';
                let badgeBg = 'bg-emerald-50 border-emerald-200/50';
                if (score < 40) {
                  scoreColor = 'bg-rose-500';
                  textColor = 'text-rose-700';
                  badgeBg = 'bg-rose-50 border-rose-200/50';
                } else if (score < 60) {
                  scoreColor = 'bg-amber-500';
                  textColor = 'text-amber-700';
                  badgeBg = 'bg-amber-50 border-amber-200/50';
                } else if (score < 80) {
                  scoreColor = 'bg-blue-500';
                  textColor = 'text-blue-700';
                  badgeBg = 'bg-blue-50 border-blue-200/50';
                }

                return (
                  <div key={item.subject} className="bg-slate-50/40 border border-slate-150 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold text-slate-700 truncate" title={item.subject}>
                        {item.subject}
                      </span>
                      <span className={`text-[8px] font-black uppercase tracking-wider border px-1.5 py-0.5 rounded-md shrink-0 ${badgeBg} ${textColor}`}>
                        {score}% avg
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${scoreColor}`} 
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 block font-bold">
                      {item.count} student record{item.count !== 1 ? 's' : ''} loaded
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div 
              ref={heatmapContainerRef} 
              className="relative bg-[#fafaf9] border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs animate-fadeIn overflow-hidden"
              id="performance-benchmark-heatmap"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span>📊 Class-wide Cognitive Benchmark Heatmap</span>
                    <span className="px-1.5 py-0.5 bg-[#5f6f52]/10 text-[#5f6f52] text-[8px] font-extrabold uppercase rounded">
                      Interactive D3 Engine
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-500 max-w-xl">
                    Hover over any cell to inspect individual student grades and pinpoint cognitive remedial gaps or distinction thresholds across subjects.
                  </p>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-3 text-[9px] font-bold text-slate-500 bg-slate-100/50 p-2 rounded-lg border border-slate-200/60">
                  <span className="uppercase text-[8px] text-slate-400 font-extrabold shrink-0">Scale density:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded bg-rose-400 shrink-0" />
                    <span>Remedial (&lt;50%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded bg-amber-400 shrink-0" />
                    <span>Approaching (50-64%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded bg-blue-400 shrink-0" />
                    <span>Proficient (65-79%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded bg-emerald-400 shrink-0" />
                    <span>Exceeding (&ge;80%)</span>
                  </div>
                </div>
              </div>

              {/* D3 SVG Heatmap Grid */}
              {(() => {
                const width = 800;
                const rowHeight = 42;
                const margin = { top: 35, right: 30, bottom: 25, left: 165 };
                const innerHeight = subjects.length * rowHeight;
                const height = innerHeight + margin.top + margin.bottom;
                const innerWidth = width - margin.left - margin.right;

                // D3 Scales
                const xScale = d3.scaleBand<string>()
                  .domain(BANDS.map(b => b.id))
                  .range([0, innerWidth])
                  .padding(0.06);

                const yScale = d3.scaleBand<string>()
                  .domain(subjects)
                  .range([0, innerHeight])
                  .padding(0.08);

                return (
                  <div className="relative">
                    <div className="overflow-x-auto pb-2 scrollbar-thin">
                      <div className="min-w-[680px]">
                        <svg 
                          width="100%" 
                          viewBox={`0 0 ${width} ${height}`}
                          className="overflow-visible font-sans"
                        >
                          {/* Subject Axis Labels (Y-axis) */}
                          <g>
                            {subjects.map((subj) => {
                              const y = margin.top + (yScale(subj) || 0) + yScale.bandwidth() / 2 + 3.5;
                              return (
                                <text
                                  key={`label-subj-${subj}`}
                                  x={margin.left - 12}
                                  y={y}
                                  textAnchor="end"
                                  fontSize="10px"
                                  fontWeight="bold"
                                  fill="#475569"
                                >
                                  {subj}
                                </text>
                              );
                            })}
                          </g>

                          {/* Band Axis Labels (X-axis) */}
                          <g>
                            {BANDS.map((band) => {
                              const x = margin.left + (xScale(band.id) || 0) + xScale.bandwidth() / 2;
                              return (
                                <text
                                  key={`label-band-${band.id}`}
                                  x={x}
                                  y={margin.top - 12}
                                  textAnchor="middle"
                                  fontSize="9px"
                                  fontWeight="extrabold"
                                  fill="#475569"
                                  className="uppercase tracking-wider font-mono"
                                >
                                  {band.shortLabel}
                                </text>
                              );
                            })}
                          </g>

                          {/* Grid cells */}
                          <g>
                            {heatmapData.map((row) => {
                              return BANDS.map((band) => {
                                const bandData = row[band.id as 'remedial' | 'approaching' | 'proficient' | 'exceeding'];
                                const x = margin.left + (xScale(band.id) || 0);
                                const y = margin.top + (yScale(row.subject) || 0);
                                const cellWidth = xScale.bandwidth();
                                const cellHeight = yScale.bandwidth();
                                
                                const textX = x + cellWidth / 2;
                                const textY = y + cellHeight / 2 + 4;

                                // D3 Interpolated Color representation (from light white-ish/grey to dense theme color)
                                const colorScale = d3.scaleLinear()
                                  .domain([0, 100])
                                  .range([band.lightColor as any, band.activeColor as any]);
                                const color = bandData.pct > 0 
                                  ? (colorScale(bandData.pct) as any as string)
                                  : '#f8fafc'; // Default empty neutral light gray

                                const isHovered = hoveredCell && hoveredCell.subject === row.subject && hoveredCell.bandId === band.id;
                                const textColor = bandData.pct > 50 ? '#ffffff' : band.textColor;

                                return (
                                  <g key={`cell-${row.subject}-${band.id}`}>
                                    <rect
                                      x={x}
                                      y={y}
                                      width={cellWidth}
                                      height={cellHeight}
                                      rx={6}
                                      ry={6}
                                      fill={color}
                                      stroke={isHovered ? '#0f172a' : 'rgba(226, 232, 240, 0.5)'}
                                      strokeWidth={isHovered ? 2 : 1}
                                      className="transition-all duration-150 cursor-pointer"
                                      onMouseEnter={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const containerRect = heatmapContainerRef.current?.getBoundingClientRect();
                                        
                                        // Position tooltip
                                        const tooltipX = rect.left - (containerRect?.left || 0) + cellWidth / 2;
                                        const tooltipY = rect.top - (containerRect?.top || 0) - 8;

                                        setHoveredCell({
                                          subject: row.subject,
                                          bandId: band.id,
                                          bandLabel: band.label,
                                          count: bandData.count,
                                          pct: bandData.pct,
                                          students: bandData.students,
                                          x: tooltipX,
                                          y: tooltipY
                                        });
                                      }}
                                      onMouseLeave={() => setHoveredCell(null)}
                                    />
                                    {bandData.pct > 0 && (
                                      <text
                                        x={textX}
                                        y={textY}
                                        textAnchor="middle"
                                        fontSize="10px"
                                        fontWeight="bold"
                                        fill={textColor}
                                        className="pointer-events-none select-none transition-all font-mono"
                                      >
                                        {bandData.pct}%
                                      </text>
                                    )}
                                  </g>
                                );
                              });
                            })}
                          </g>
                        </svg>
                      </div>
                    </div>

                    {/* Interactive Tooltip Overlay */}
                    {hoveredCell && (
                      <div
                        className="absolute z-10 bg-slate-900 text-white rounded-xl p-3.5 shadow-xl max-w-xs text-xs pointer-events-none border border-slate-700/60 transition-all duration-75 space-y-2 animate-fadeIn"
                        style={{
                          left: `${hoveredCell.x}px`,
                          top: `${hoveredCell.y}px`,
                          transform: 'translate(-50%, -100%)',
                        }}
                      >
                        <div className="space-y-0.5 border-b border-slate-700/50 pb-1.5">
                          <p className="font-extrabold text-[#dce4d7] tracking-wide uppercase text-[8px]">
                            {hoveredCell.subject}
                          </p>
                          <p className="font-bold text-[10px] text-white">
                            {hoveredCell.bandLabel}
                          </p>
                        </div>
                        
                        <div className="space-y-1.5">
                          <p className="text-[10px] text-slate-300 font-medium">
                            Density Ratio: <strong className="text-white">{hoveredCell.pct}%</strong> ({hoveredCell.count} of {records.filter(r => r.subject === hoveredCell.subject).length} records)
                          </p>
                          
                          {hoveredCell.students.length > 0 ? (
                            <div className="space-y-1">
                              <p className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Student Roster:</p>
                              <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                                {hoveredCell.students.map((st, i) => (
                                  <div key={i} className="flex items-center justify-between gap-2 text-[10px] bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/40 font-mono">
                                    <span className="text-slate-200 truncate max-w-[120px]">{st.name}</span>
                                    <span className="font-bold text-amber-400">{st.marks}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-[9px] text-slate-400 italic">No student records currently in this category.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Teacher Daily Mastery Goal & Progress Bar Section */}
      <div className="border-t border-[#e5e1da]/50 pt-6 space-y-4">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-md border border-slate-800 space-y-4">
          {/* Header & Goal Settings Control */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Flame className="w-4.5 h-4.5 animate-pulse" />
                </div>
                <h4 className="text-xs font-serif font-black uppercase tracking-wider text-amber-200">
                  Teacher Daily Mastery Goal
                </h4>
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-md text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Target Mastery Benchmark
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Set daily card mastery targets for students to maintain active learning streaks and spaced repetition retention momentum.
              </p>
            </div>

            {/* Target Goal Configuration Controls */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">Set Goal:</span>
              <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
                {[10, 15, 20, 25, 30].map((goalVal) => (
                  <button
                    key={`goal-btn-${goalVal}`}
                    type="button"
                    onClick={() => {
                      setDailyGoalTarget(goalVal);
                      setIsEditingGoal(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                      dailyGoalTarget === goalVal && !isEditingGoal
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                    }`}
                  >
                    {goalVal}
                  </button>
                ))}
              </div>

              {/* Custom Input Toggle */}
              {isEditingGoal ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={customGoalInput}
                    onChange={(e) => setCustomGoalInput(e.target.value)}
                    className="w-14 bg-slate-950 border border-amber-500/50 rounded-lg px-2 py-1 text-xs text-amber-300 font-bold text-center focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const parsed = parseInt(customGoalInput, 10);
                      if (!isNaN(parsed) && parsed > 0) {
                        setDailyGoalTarget(parsed);
                        setIsEditingGoal(false);
                      }
                    }}
                    className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Set
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingGoal(true)}
                  className="px-2.5 py-1 text-xs font-bold text-slate-400 hover:text-amber-300 transition cursor-pointer underline"
                >
                  Custom
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar Visualization */}
          {(() => {
            const goalPct = Math.min(100, Math.round((dailyCompletedCount / dailyGoalTarget) * 100));
            const remaining = Math.max(0, dailyGoalTarget - dailyCompletedCount);
            const isCompleted = dailyCompletedCount >= dailyGoalTarget;

            return (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-sm">
                      {dailyCompletedCount} / {dailyGoalTarget} Cards Mastered Today
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {isCompleted ? '🎉 Goal Achieved!' : `${remaining} cards remaining`}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-serif font-black text-amber-300 text-base">
                      {goalPct}%
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDailyCompletedCount(prev => Math.max(0, prev - 1))}
                        className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black flex items-center justify-center cursor-pointer"
                        title="Simulate card un-mastered"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setDailyCompletedCount(prev => prev + 1)}
                        className="px-2 py-0.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center cursor-pointer shadow-2xs"
                        title="Log card mastery (+1)"
                      >
                        +1 Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setDailyCompletedCount(0)}
                        className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 text-[10px] font-bold cursor-pointer ml-1"
                        title="Reset today's progress count"
                      >
                        Reset Today
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar Track & Bar */}
                <div className="w-full h-4 bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/60 relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 shadow-sm relative ${
                      isCompleted
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400'
                        : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500'
                    }`}
                    style={{ width: `${goalPct}%` }}
                  >
                    {/* Glossy shine effect */}
                    <div className="absolute inset-0 bg-white/20 rounded-full" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>Start of Day (0)</span>
                  <span className="text-amber-200/90 font-bold">
                    {isCompleted ? 'Target 100% Satisfied • Streak Bonus Unlocked (+50 XP)' : `On pace: ${goalPct}% of daily target reached`}
                  </span>
                  <span>Daily Target ({dailyGoalTarget})</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Cumulative Flashcard Mastery Trends & Challenging Topics Visualization (Recharts) */}
      <div className="border-t border-[#e5e1da]/50 pt-6 space-y-5">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-700 shrink-0">
                <Brain className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-xs font-serif font-black text-slate-800 uppercase tracking-wider">
                Cumulative Flashcard Mastery Trends
              </h4>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200/50 rounded-md text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-indigo-600" />
                SM-2 Spaced Repetition Analytics
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl">
              Real-time telemetry tracking student flashcard recall performance, retention curves, and topic difficulty distribution to identify curriculum areas requiring teacher intervention.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Subject Filter */}
            {flashcardChartMode === 'topics' && (
              <select
                value={selectedTopicSubject}
                onChange={(e) => setSelectedTopicSubject(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-indigo-500 shadow-3xs cursor-pointer"
              >
                <option value="All">All Subjects ({flashcardTopicData.length} Topics)</option>
                {DEFAULT_SUBJECTS.map(sub => (
                  <option key={`f-sub-${sub}`} value={sub}>{sub}</option>
                ))}
              </select>
            )}

            {/* Toggle View Mode */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setFlashcardChartMode('topics')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  flashcardChartMode === 'topics'
                    ? 'bg-white text-indigo-800 shadow-3xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Topic Challenge Breakdown</span>
              </button>
              <button
                type="button"
                onClick={() => setFlashcardChartMode('trends')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  flashcardChartMode === 'trends'
                    ? 'bg-white text-indigo-800 shadow-3xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Cumulative Growth Trend</span>
              </button>
            </div>
          </div>
        </div>

        {/* Teacher Callout Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Most Challenging Topic Callout */}
          <div className="bg-rose-50/60 border border-rose-200/70 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[9px] font-extrabold uppercase tracking-wider text-rose-800">
                Primary Intervention Focus
              </span>
              <span className="text-xs font-black text-slate-800 block truncate" title={mostChallengingTopic?.topic}>
                {mostChallengingTopic?.topic || 'N/A'}
              </span>
              <span className="text-[10px] text-rose-700 font-bold">
                {mostChallengingTopic?.challengingPct}% high review frequency
              </span>
            </div>
          </div>

          {/* Highest Retention Topic */}
          <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[9px] font-extrabold uppercase tracking-wider text-emerald-800">
                Top Retention Topic
              </span>
              <span className="text-xs font-black text-slate-800 block truncate" title={highestMasteryTopic?.topic}>
                {highestMasteryTopic?.topic || 'N/A'}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">
                {highestMasteryTopic?.masteredPct}% mastered concept rate
              </span>
            </div>
          </div>

          {/* Average Ease Factor */}
          <div className="bg-indigo-50/60 border border-indigo-200/70 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[9px] font-extrabold uppercase tracking-wider text-indigo-800">
                Class SM-2 Ease Factor
              </span>
              <span className="text-base font-black text-slate-800 block">
                2.15 / 2.50
              </span>
              <span className="text-[10px] text-indigo-700 font-bold">
                Optimal Spaced Repetition Rate
              </span>
            </div>
          </div>

          {/* Practice Engagement */}
          <div className="bg-amber-50/60 border border-amber-200/70 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[9px] font-extrabold uppercase tracking-wider text-amber-800">
                Total Cards Mastered
              </span>
              <span className="text-base font-black text-slate-800 block">
                342 Cards
              </span>
              <span className="text-[10px] text-amber-700 font-bold">
                across 8 core topics
              </span>
            </div>
          </div>
        </div>

        {/* Recharts Main Container */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-3xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                {flashcardChartMode === 'topics' ? 'Topic Challenge & Mastery Distribution (%)' : 'Cumulative Class Mastery Growth Over Weeks (%)'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
              {flashcardChartMode === 'topics' ? (
                <>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                    Mastered
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500 inline-block" />
                    In Review
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
                    Needs Support
                  </span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#5f6f52] inline-block" />
                    Overall Class
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block" />
                    Math
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" />
                    Science
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="w-full h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {flashcardChartMode === 'topics' ? (
                <BarChart
                  data={flashcardTopicData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 45 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="topic"
                    tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    unit="%"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = flashcardTopicData.find(t => t.topic === label);
                      return (
                        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700/60 max-w-xs">
                          <p className="font-extrabold text-amber-300 border-b border-slate-700 pb-1">{label} ({item?.subject})</p>
                          <div className="space-y-1 text-[11px]">
                            <p className="flex items-center justify-between gap-4 text-emerald-300">
                              <span>Mastered:</span>
                              <strong>{item?.masteredPct}%</strong>
                            </p>
                            <p className="flex items-center justify-between gap-4 text-indigo-300">
                              <span>In Review Queue:</span>
                              <strong>{item?.inProgressPct}%</strong>
                            </p>
                            <p className="flex items-center justify-between gap-4 text-rose-300">
                              <span>Challenging / Hard:</span>
                              <strong>{item?.challengingPct}%</strong>
                            </p>
                            <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
                              <span>Cards: {item?.totalCards}</span>
                              <span>Ease Factor: {item?.easeFactor}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="masteredPct" name="Mastered %" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="inProgressPct" name="In Review %" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="challengingPct" name="Needs Support %" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart
                  data={flashcardTrendData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="overallGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5f6f52" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#5f6f52" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="mathGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="sciGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                          <p className="font-extrabold text-[#dce4d7] border-b border-slate-700 pb-1">{label} Cumulative Telemetry</p>
                          {payload.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-4 text-[11px]" style={{ color: p.color }}>
                              <span>{p.name}:</span>
                              <strong>{p.value}%</strong>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Area type="monotone" dataKey="OverallMastery" name="Overall Mastery Rate" stroke="#5f6f52" strokeWidth={3} fillOpacity={1} fill="url(#overallGrad)" />
                  <Area type="monotone" dataKey="MathMastery" name="Mathematics" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#mathGrad)" />
                  <Area type="monotone" dataKey="ScienceMastery" name="Sciences" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#sciGrad)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Student Daily Flashcard Activity Calendar Heatmap */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-3xs">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700 shrink-0">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-serif font-black text-slate-800 uppercase tracking-wider">
                    Student Daily Flashcard Activity Heatmap
                  </h4>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[9px] font-black uppercase">
                    112-Day Consistency Calendar
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Track individual daily flashcard study streaks, recall consistency, and practice volume over time.
                </p>
              </div>
            </div>

            {/* Selectors */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Select Student */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={heatmapSelectedStudent}
                  onChange={(e) => setHeatmapSelectedStudent(e.target.value)}
                  className="bg-transparent text-xs font-black text-slate-800 focus:outline-none cursor-pointer"
                >
                  {records.map((r) => (
                    <option key={`hm-st-${r.id}`} value={r.name}>
                      {r.name} ({r.admission_number || r.admissionNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Subject */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={heatmapSubjectFilter}
                  onChange={(e) => setHeatmapSubjectFilter(e.target.value)}
                  className="bg-transparent text-xs font-black text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Subjects</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="English Literature">English Literature</option>
                </select>
              </div>

              {/* Log Practice Simulator */}
              <button
                type="button"
                onClick={handleLogHeatmapSessionToday}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
                title="Log +15 flashcards for today to update heatmap consistency"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Today's Practice</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Cards for Selected Student */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Flame className="w-4 h-4 fill-white" />
              </div>
              <div>
                <span className="block text-[9px] font-extrabold uppercase text-emerald-800 tracking-wider">
                  Active Practice Streak
                </span>
                <span className="text-sm font-black text-slate-900">
                  {studentHeatmapMatrix.currentStreak} Days 🔥
                </span>
              </div>
            </div>

            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[9px] font-extrabold uppercase text-indigo-800 tracking-wider">
                  Total Cards Reviewed
                </span>
                <span className="text-sm font-black text-slate-900">
                  {studentHeatmapMatrix.totalCardsReviewed} Cards
                </span>
              </div>
            </div>

            <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[9px] font-extrabold uppercase text-blue-800 tracking-wider">
                  Average SM-2 Recall
                </span>
                <span className="text-sm font-black text-slate-900">
                  {studentHeatmapMatrix.avgAccuracy}%
                </span>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[9px] font-extrabold uppercase text-amber-800 tracking-wider">
                  Consistency Rate
                </span>
                <span className="text-sm font-black text-slate-900">
                  {studentHeatmapMatrix.consistencyPct}% Active Days
                </span>
              </div>
            </div>
          </div>

          {/* Heatmap Grid Section */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {heatmapSelectedStudent} — 16-Week Activity Grid ({studentHeatmapMatrix.activeDaysCount} / {studentHeatmapMatrix.totalDays} Days Studied)
              </span>

              {/* Legend */}
              <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-500">
                <span className="text-[9px] text-slate-400">Less</span>
                <div className="w-2.5 h-2.5 rounded-xs bg-slate-200 border border-slate-300" title="0 cards" />
                <div className="w-2.5 h-2.5 rounded-xs bg-emerald-200 border border-emerald-300" title="1-9 cards" />
                <div className="w-2.5 h-2.5 rounded-xs bg-emerald-400 border border-emerald-500" title="10-19 cards" />
                <div className="w-2.5 h-2.5 rounded-xs bg-emerald-600 border border-emerald-700" title="20-34 cards" />
                <div className="w-2.5 h-2.5 rounded-xs bg-emerald-800 border border-emerald-900" title="35+ cards" />
                <span className="text-[9px] text-slate-400">More</span>
              </div>
            </div>

            {/* Heatmap Calendar Scroll Container */}
            <div className="overflow-x-auto pb-2 scrollbar-thin">
              <div className="min-w-[620px] flex gap-2">
                {/* Day Labels Column */}
                <div className="grid grid-rows-7 gap-1.5 text-[9px] font-mono font-bold text-slate-400 pt-0.5 shrink-0 select-none">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                {/* Weeks Columns */}
                <div className="flex gap-1.5">
                  {studentHeatmapMatrix.grid.map((week, wIdx) => (
                    <div key={`wk-col-${wIdx}`} className="grid grid-rows-7 gap-1.5">
                      {week.map((day) => {
                        let colorClass = 'bg-slate-200/80 border-slate-300/60 hover:border-slate-400';
                        if (day.level === 1) colorClass = 'bg-emerald-200 border-emerald-300 hover:scale-110';
                        else if (day.level === 2) colorClass = 'bg-emerald-400 border-emerald-500 hover:scale-110';
                        else if (day.level === 3) colorClass = 'bg-emerald-600 border-emerald-700 hover:scale-110';
                        else if (day.level === 4) colorClass = 'bg-emerald-800 border-emerald-900 hover:scale-110';

                        return (
                          <div
                            key={`cell-${day.dateStr}`}
                            onMouseEnter={() => setHoveredHeatmapDay(day)}
                            onMouseLeave={() => setHoveredHeatmapDay(null)}
                            className={`w-3.5 h-3.5 rounded-xs border transition cursor-pointer relative ${colorClass}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Hover Tooltip Info Banner */}
            <div className="min-h-[38px] bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-between text-xs text-slate-700 shadow-3xs transition-all">
              {hoveredHeatmapDay ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-black text-slate-900">{hoveredHeatmapDay.formattedDate} ({hoveredHeatmapDay.dayName})</span>
                  </div>
                  {hoveredHeatmapDay.count > 0 ? (
                    <div className="flex items-center gap-3 text-xs font-bold">
                      <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {hoveredHeatmapDay.count} Flashcards Reviewed
                      </span>
                      <span className="text-indigo-700 font-extrabold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {hoveredHeatmapDay.accuracy}% SM-2 Recall
                      </span>
                      <span className="text-slate-500 text-[11px] font-mono">
                        {hoveredHeatmapDay.subject}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 font-medium italic">
                      No study activity logged on this date (Rest Day)
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Hover over any calendar cell above to inspect daily flashcard review volume and accuracy.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 100% Core Topic Mastery Notification Trigger Section */}
        <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-3xs">
          {/* Active Toast Banner */}
          {activeToastAlert && (
            <div className="bg-gradient-to-r from-amber-500 via-emerald-600 to-indigo-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-pulse border border-amber-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                  <Trophy className="w-6 h-6 text-amber-200" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-amber-200 block">
                    🏆 100% TOPIC MASTERY MILESTONE DISPATCHED!
                  </span>
                  <p className="text-xs font-bold">
                    <strong className="text-white font-black">{activeToastAlert.studentName}</strong> ({activeToastAlert.admissionNumber}) has achieved <strong className="text-amber-200 font-black">100% Mastery</strong> in <strong className="underline">{activeToastAlert.topic}</strong> ({activeToastAlert.cardsMastered} cards recalled flawlessly)!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveToastAlert(null)}
                className="p-1.5 hover:bg-white/20 rounded-xl text-white cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-serif font-black text-slate-800 uppercase tracking-wider">
                    100% Mastery Alerts & Teacher Notifications
                  </h4>
                  {masteryNotifications.filter(n => !n.isRead).length > 0 && (
                    <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[9px] font-black animate-pulse shadow-xs">
                      {masteryNotifications.filter(n => !n.isRead).length} New
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Automated notification engine alerting teachers when a student achieves 100% flashcard recall across all core curriculum topic cards.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMasteryNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}
                className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition shadow-3xs"
              >
                Mark All Read
              </button>
            </div>
          </div>

          {/* Alert Trigger Simulator Box */}
          <div className="bg-white border border-indigo-100 rounded-xl p-3.5 shadow-3xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-indigo-900 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Simulate Student 100% Mastery Trigger
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                Test real-time alert dispatch
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Select Student */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Student</label>
                <select
                  value={selectedStudentForAlert}
                  onChange={(e) => setSelectedStudentForAlert(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {records.slice(0, 8).map((rec) => (
                    <option key={`st-opt-${rec.id}`} value={rec.name}>
                      {rec.name} ({rec.admission_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Topic */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Curriculum Topic</label>
                <select
                  value={selectedTopicForAlert}
                  onChange={(e) => setSelectedTopicForAlert(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {flashcardTopicData.map((top) => (
                    <option key={`top-opt-${top.topic}`} value={top.topic}>
                      {top.topic} ({top.subject})
                    </option>
                  ))}
                </select>
              </div>

              {/* Trigger Button */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleSimulate100PercentMasteryAlert}
                  className="w-full py-1.5 px-3 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-black text-xs rounded-lg shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-200" />
                  <span>Trigger 100% Mastery Alert</span>
                </button>
              </div>
            </div>
          </div>

          {/* Notifications Feed */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase text-slate-700 tracking-wider block">
              Recent Mastery Notifications ({masteryNotifications.length})
            </span>

            {masteryNotifications.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400">
                No mastery notifications yet. Use the simulator above to trigger an alert!
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {masteryNotifications.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      !alert.isRead
                        ? 'bg-amber-50/70 border-amber-200/90 shadow-3xs'
                        : 'bg-white border-slate-200/80 opacity-85'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        !alert.isRead
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        <Trophy className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800 truncate">
                            {alert.studentName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {alert.admissionNumber}
                          </span>
                          <span className="px-2 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[9px] font-extrabold uppercase">
                            100% Mastered
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">
                          Achieved full recall on <strong className="text-slate-800 font-bold">{alert.topic}</strong> ({alert.subject}) — {alert.cardsMastered} cards completed.
                        </p>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {alert.timestamp}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => setCustomCongratulationMsg({ studentName: alert.studentName, msg: `Fantastic work on achieving 100% mastery in ${alert.topic}! Keep up the incredible momentum!` })}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send Kudos</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMasteryNotifications(prev => prev.map(n => n.id === alert.id ? { ...n, isRead: !n.isRead } : n))}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                        title={alert.isRead ? "Mark Unread" : "Mark Read"}
                      >
                        <CheckCircle2 className={`w-4 h-4 ${alert.isRead ? 'text-emerald-600' : 'text-slate-300'}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setMasteryNotifications(prev => prev.filter(n => n.id !== alert.id))}
                        className="p-1 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Dismiss Alert"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Kudos Modal / Note Composer */}
          {customCongratulationMsg && (
            <div className="bg-indigo-900 text-white p-3.5 rounded-xl space-y-2 border border-indigo-700 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-300 flex items-center gap-1">
                  <Send className="w-3.5 h-3.5" />
                  Kudos Note to {customCongratulationMsg.studentName}
                </span>
                <button
                  type="button"
                  onClick={() => setCustomCongratulationMsg(null)}
                  className="p-1 hover:bg-indigo-800 rounded-md text-indigo-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <textarea
                value={customCongratulationMsg.msg}
                onChange={(e) => setCustomCongratulationMsg({ ...customCongratulationMsg, msg: e.target.value })}
                className="w-full bg-indigo-950/80 border border-indigo-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-400"
                rows={2}
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCustomCongratulationMsg(null)}
                  className="px-2.5 py-1 text-xs font-bold text-indigo-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert(`Congratulatory note dispatched to ${customCongratulationMsg.studentName}!`);
                    setCustomCongratulationMsg(null);
                  }}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-lg transition cursor-pointer shadow-2xs"
                >
                  Dispatch Kudos
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
