import React, { useRef, useState, useEffect } from 'react';
import { 
  Paintbrush, 
  Eraser, 
  Undo, 
  Redo, 
  Trash2, 
  Save, 
  X, 
  Sparkles, 
  Download,
  Grid,
  Square,
  HelpCircle,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface Point {
  x: number; // 0 to 1000
  y: number; // 0 to 1000
}

interface Line {
  points: Point[];
  color: string;
  width: number;
  isEraser: boolean;
}

interface WhiteboardProps {
  initialData?: string; // stringified JSON
  onSave: (data: string) => Promise<void>;
  onClose: () => void;
  isStudent?: boolean;
  documentTitle: string;
}

const COLORS = [
  { value: '#1e293b', label: 'Slate' },
  { value: '#dc2626', label: 'Red' },
  { value: '#2563eb', label: 'Blue' },
  { value: '#16a34a', label: 'Green' },
  { value: '#7c3aed', label: 'Purple' },
  { value: '#ea580c', label: 'Orange' },
];

const WIDTHS = [
  { value: 2, label: 'Thin' },
  { value: 5, label: 'Medium' },
  { value: 10, label: 'Thick' },
  { value: 20, label: 'Marker' },
];

export default function Whiteboard({
  initialData,
  onSave,
  onClose,
  isStudent = false,
  documentTitle
}: WhiteboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // State for lines
  const [lines, setLines] = useState<Line[]>([]);
  const [redoStack, setRedoStack] = useState<Line[]>([]);
  
  // Current drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#1e293b');
  const [currentWidth, setCurrentWidth] = useState(5);
  const [tool, setTool] = useState<'draw' | 'erase'>('draw');
  const [paperStyle, setPaperStyle] = useState<'blank' | 'grid' | 'ruled'>('grid');

  // Canvas size
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize lines from initialData
  useEffect(() => {
    if (initialData) {
      try {
        const parsed = JSON.parse(initialData);
        if (parsed.lines && Array.isArray(parsed.lines)) {
          setLines(parsed.lines);
        }
        if (parsed.paperStyle) {
          setPaperStyle(parsed.paperStyle);
        }
      } catch (err) {
        console.error('Failed to parse initial whiteboard data:', err);
      }
    }
  }, [initialData]);

  // Handle ResizeObserver as per React Setup Guidelines
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      // Subtract UI bar heights if necessary, but bounding rect is best
      const targetWidth = Math.max(width, 300);
      const targetHeight = Math.max(height - 80, 250); // reserve space for bottom/top controls
      setCanvasSize({ width: targetWidth, height: targetHeight });
    });

    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Redraw the canvas whenever lines, tool, paperStyle, or canvasSize changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and support high-DPI
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background paper style
    drawPaperBackground(ctx, canvas.width, canvas.height, paperStyle);

    // Draw all lines
    lines.forEach((line) => {
      if (line.points.length < 1) return;

      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (line.isEraser) {
        // Since we draw on a custom paper background, standard destination-out is best for a true erase,
        // or we can draw with background color, but destination-out preserves the grid lines beautifully if we do it right!
        // Wait, to keep grid lines, we can draw grid lines, then draw drawings, but a standard whiteboard eraser
        // usually clears the drawing. Let's use 'destination-out' to erase drawings cleanly!
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = line.width;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.width;
      }

      // Map coordinate from 0-1000 scale to canvas coordinates
      const startPoint = line.points[0];
      const startX = (startPoint.x / 1000) * canvas.width;
      const startY = (startPoint.y / 1000) * canvas.height;
      ctx.moveTo(startX, startY);

      if (line.points.length === 1) {
        ctx.lineTo(startX, startY);
      } else {
        for (let i = 1; i < line.points.length; i++) {
          const pt = line.points[i];
          const currX = (pt.x / 1000) * canvas.width;
          const currY = (pt.y / 1000) * canvas.height;
          ctx.lineTo(currX, currY);
        }
      }

      ctx.stroke();
    });

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  }, [lines, paperStyle, canvasSize]);

  // Helper to draw grid or ruled paper
  const drawPaperBackground = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    style: 'blank' | 'grid' | 'ruled'
  ) => {
    ctx.save();
    
    // Set background color
    ctx.fillStyle = '#fdfdfc';
    ctx.fillRect(0, 0, width, height);

    if (style === 'grid') {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      const gridSize = 25;

      // Vertical lines
      for (let x = gridSize; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = gridSize; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    } else if (style === 'ruled') {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      const lineSpacing = 24;

      // Horizontal writing lines
      for (let y = lineSpacing * 2; y < height; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Red vertical margin line
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(60, 0);
      ctx.lineTo(60, height);
      ctx.stroke();
    }

    ctx.restore();
  };

  // Helper to convert screen mouse/touch event to relative 0-1000 point
  const getRelativePoint = (clientX: number, clientY: number): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 1000;
    const y = ((clientY - rect.top) / rect.height) * 1000;

    return {
      x: Math.max(0, Math.min(1000, x)),
      y: Math.max(0, Math.min(1000, y))
    };
  };

  // Start Drawing / Erasing
  const handleStart = (clientX: number, clientY: number) => {
    const point = getRelativePoint(clientX, clientY);
    if (!point) return;

    setIsDrawing(true);
    setRedoStack([]); // Clear redo on new actions

    const newLine: Line = {
      points: [point],
      color: currentColor,
      width: currentWidth,
      isEraser: tool === 'erase'
    };

    setLines((prev) => [...prev, newLine]);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDrawing) return;
    const point = getRelativePoint(clientX, clientY);
    if (!point) return;

    setLines((prev) => {
      if (prev.length === 0) return prev;
      const lastLine = prev[prev.length - 1];
      const updatedLastLine = {
        ...lastLine,
        points: [...lastLine.points, point]
      };
      return [...prev.slice(0, -1), updatedLastLine];
    });
  };

  const handleEnd = () => {
    setIsDrawing(false);
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Only left click
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch Handlers for tablets and mobile devices
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0) return;
    // Prevent scrolling when drawing on touchscreen
    e.preventDefault();
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0) return;
    e.preventDefault();
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleEnd();
  };

  // Undo drawing
  const handleUndo = () => {
    if (lines.length === 0) return;
    const last = lines[lines.length - 1];
    setRedoStack((prev) => [last, ...prev]);
    setLines((prev) => prev.slice(0, -1));
  };

  // Redo drawing
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setRedoStack((prev) => prev.slice(1));
    setLines((prev) => [...prev, next]);
  };

  // Clear canvas
  const handleClear = () => {
    if (lines.length === 0) return;
    if (window.confirm('Are you sure you want to clear the entire whiteboard?')) {
      setRedoStack([]);
      setLines([]);
    }
  };

  // Save changes
  const handleSaveWhiteboard = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const payload = JSON.stringify({
        lines,
        paperStyle,
        savedAt: new Date().toISOString()
      });
      await onSave(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save whiteboard sketch:', err);
      alert('Failed to save sketch to cloud database.');
    } finally {
      setIsSaving(false);
    }
  };

  // Download high-resolution PNG image of the sketch
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // To ensure the grid lines are exported, we can trigger standard canvas conversion.
    // However, canvas.toDataURL() only exports current state, which is exactly what we want!
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `whiteboard-${documentTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div id="whiteboard-modal" className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 overflow-y-auto no-print ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <div className={`bg-[#fcfbf9] border border-[#e5e1da] shadow-2xl flex flex-col overflow-hidden animate-fadeIn ${
        isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[90vh] rounded-2xl'
      }`}>
        
        {/* Header */}
        <div className="p-4 border-b border-[#e5e1da] bg-[#f4f1ea]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <Paintbrush className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                Lesson Sketchpad & Flowcharts
                <span className="bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Whiteboard</span>
              </h2>
              <p className="text-xs text-slate-500">Draw chemistry cycles, math flowcharts, or step diagrams to display with your lesson</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isStudent && (
              <button
                onClick={handleSaveWhiteboard}
                disabled={isSaving}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  saveSuccess 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-[#5f6f52] text-white hover:bg-[#4d5a42]'
                }`}
              >
                <Save className="w-4 h-4" /> 
                {isSaving ? 'Syncing...' : saveSuccess ? 'Saved Sketch!' : 'Save & Share'}
              </button>
            )}

            <button
              onClick={handleDownload}
              className="px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition flex items-center gap-1 cursor-pointer"
              title="Download canvas drawing as PNG"
            >
              <Download className="w-4 h-4" /> Download PNG
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar Section */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Drawing vs Eraser tool selector */}
            <div className="flex bg-slate-200/85 rounded-lg p-0.5 border border-slate-300">
              <button
                onClick={() => setTool('draw')}
                disabled={isStudent}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                  tool === 'draw' 
                    ? 'bg-white text-slate-800 shadow-xs font-extrabold' 
                    : 'text-slate-500 hover:text-slate-800 cursor-pointer'
                } ${isStudent ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Brush Drawing Mode"
              >
                <Paintbrush className="w-3.5 h-3.5 text-indigo-600" /> Draw
              </button>
              <button
                onClick={() => setTool('erase')}
                disabled={isStudent}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                  tool === 'erase' 
                    ? 'bg-white text-slate-800 shadow-xs font-extrabold' 
                    : 'text-slate-500 hover:text-slate-800 cursor-pointer'
                } ${isStudent ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Eraser Mode"
              >
                <Eraser className="w-3.5 h-3.5 text-red-500" /> Eraser
              </button>
            </div>

            <div className="w-px h-6 bg-slate-300" />

            {/* Colors picker (disabled if eraser or student) */}
            <div className="flex items-center gap-1.5">
              {COLORS.map((col) => (
                <button
                  key={col.value}
                  onClick={() => {
                    setCurrentColor(col.value);
                    setTool('draw');
                  }}
                  disabled={isStudent}
                  style={{ backgroundColor: col.value }}
                  className={`w-6.5 h-6.5 rounded-full border-2 transition transform cursor-pointer hover:scale-110 active:scale-95 flex items-center justify-center ${
                    currentColor === col.value && tool === 'draw'
                      ? 'border-slate-800 ring-2 ring-slate-400/50'
                      : 'border-white'
                  } ${isStudent ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={col.label}
                >
                  {currentColor === col.value && tool === 'draw' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </button>
              ))}
            </div>

            <div className="w-px h-6 bg-slate-300" />

            {/* Stroke widths list */}
            <div className="flex items-center gap-1">
              {WIDTHS.map((w) => (
                <button
                  key={w.value}
                  onClick={() => setCurrentWidth(w.value)}
                  disabled={isStudent}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                    currentWidth === w.value
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  } ${isStudent ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Paper style grid / blank background options */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">Paper:</span>
              <button
                onClick={() => setPaperStyle('blank')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                  paperStyle === 'blank'
                    ? 'bg-indigo-100 text-indigo-900 border-indigo-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Blank
              </button>
              <button
                onClick={() => setPaperStyle('grid')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                  paperStyle === 'grid'
                    ? 'bg-indigo-100 text-indigo-900 border-indigo-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setPaperStyle('ruled')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                  paperStyle === 'ruled'
                    ? 'bg-indigo-100 text-indigo-900 border-indigo-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Ruled
              </button>
            </div>

            <div className="w-px h-6 bg-slate-300" />

            {/* Undo, Redo, Clear */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleUndo}
                disabled={lines.length === 0 || isStudent}
                className="p-1.5 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none rounded-lg text-slate-600 bg-white transition cursor-pointer"
                title="Undo (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={redoStack.length === 0 || isStudent}
                className="p-1.5 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none rounded-lg text-slate-600 bg-white transition cursor-pointer"
                title="Redo (Ctrl+Y)"
              >
                <Redo className="w-4 h-4" />
              </button>
              <button
                onClick={handleClear}
                disabled={lines.length === 0 || isStudent}
                className="p-1.5 border border-red-200 hover:bg-red-50 disabled:opacity-40 disabled:pointer-events-none rounded-lg text-red-600 bg-white transition cursor-pointer"
                title="Clear Entire Canvas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Area Container */}
        <div 
          ref={containerRef}
          className="flex-1 bg-slate-100 relative flex items-center justify-center overflow-hidden p-2"
        >
          {isStudent && lines.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10 pointer-events-none bg-slate-50/50 backdrop-blur-xs">
              <span className="text-3xl">🎨</span>
              <h4 className="font-bold text-slate-700 text-sm">No sketch saved by teacher</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                When your instructor draws diagram, flowcharts, or notes, they will appear here.
              </p>
            </div>
          )}

          {!isStudent && lines.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-2 pointer-events-none z-10 opacity-60">
              <span className="text-3xl">✏️</span>
              <h4 className="font-bold text-slate-700 text-sm">Interactive Lesson Sketchpad</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Drag or touch to sketch equations, concept trees, or diagrams. Click "Save & Share" to share with students.
              </p>
            </div>
          )}

          {/* Real Interactive Canvas */}
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onMouseDown={isStudent ? undefined : handleMouseDown}
            onMouseMove={isStudent ? undefined : handleMouseMove}
            onMouseUp={isStudent ? undefined : handleMouseUp}
            onMouseLeave={isStudent ? undefined : handleMouseUp}
            onTouchStart={isStudent ? undefined : handleTouchStart}
            onTouchMove={isStudent ? undefined : handleTouchMove}
            onTouchEnd={isStudent ? undefined : handleTouchEnd}
            className={`bg-[#fdfdfc] rounded-xl border border-slate-300 shadow-sm ${
              isStudent ? 'cursor-default' : 'cursor-crosshair'
            }`}
          />
        </div>

        {/* Bottom Status Row */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <div className="flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-[#5f6f52]" />
            <span>
              {isStudent 
                ? 'Student View Mode (Viewing saved diagram)' 
                : 'Teacher Canvas (Supports multi-touch & standard tablet styluses)'}
            </span>
          </div>
          <span>Points tracked: {lines.reduce((acc, line) => acc + line.points.length, 0)} • Vector elements</span>
        </div>

      </div>
    </div>
  );
}
