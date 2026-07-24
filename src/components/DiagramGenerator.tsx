import React, { useState, useEffect, useRef } from 'react';
import { handleResponseJson } from '../utils/api';
import {
  X,
  Sparkles,
  Image,
  Wand2,
  Sliders,
  Check,
  AlertCircle,
  RefreshCw,
  Play,
  ArrowRight,
  Settings,
  Layout,
  Plus,
  Trash2,
  Download,
  Palette,
  Eye,
  Type,
  Grid,
  Info,
  ArrowRightLeft,
  Undo2,
  Redo2,
  Save,
  History,
  Maximize2,
  Minimize2
} from 'lucide-react';

// Interfaces
interface DiagramPlaceholder {
  id: string;
  originalText: string;
  prompt: string;
  isCustom?: boolean;
}

export interface DiagramNode {
  id: string;
  label: string;
  x: number;
  y: number;
  description: string;
  type: 'circle' | 'rect' | 'capsule' | 'rhombus';
}

export interface DiagramConnection {
  id: string;
  fromId: string;
  toId: string;
  label: string;
  description: string;
}

interface DiagramGeneratorProps {
  content: string;
  onClose: () => void;
  onApplyDiagram: (placeholderText: string, imageUrl: string) => void;
}

type ArtStyle = 'textbook-vector' | 'slate-chalkboard' | 'pencil-sketch' | 'crayon-drawing' | 'isometric-schematic' | 'watercolor';

// Presets mapping
const THEME_PRESETS: Record<ArtStyle, { bg: string; stroke: string; text: string; accent: string; font: string; rounding: number; dashed: boolean }> = {
  'textbook-vector': { bg: '#ffffff', stroke: '#1e293b', text: '#0f172a', accent: '#0d9488', font: 'sans-serif', rounding: 8, dashed: false },
  'slate-chalkboard': { bg: '#1e293b', stroke: '#f8fafc', text: '#f1f5f9', accent: '#facc15', font: 'monospace', rounding: 4, dashed: true },
  'pencil-sketch': { bg: '#faf9f6', stroke: '#4a5568', text: '#1a202c', accent: '#4f46e5', font: 'serif', rounding: 12, dashed: false },
  'crayon-drawing': { bg: '#fffdf5', stroke: '#dc2626', text: '#1e293b', accent: '#ea580c', font: 'sans-serif', rounding: 16, dashed: false },
  'isometric-schematic': { bg: '#fafafa', stroke: '#0f172a', text: '#334155', accent: '#2563eb', font: 'sans-serif', rounding: 4, dashed: false },
  'watercolor': { bg: '#fdfbf7', stroke: '#1e3a8a', text: '#1e293b', accent: '#ec4899', font: 'sans-serif', rounding: 8, dashed: false }
};

export default function DiagramGenerator({ content, onClose, onApplyDiagram }: DiagramGeneratorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [placeholders, setPlaceholders] = useState<DiagramPlaceholder[]>([]);
  const [selectedItem, setSelectedItem] = useState<DiagramPlaceholder | null>(null);
  const [sandboxPrompt, setSandboxPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<ArtStyle>('textbook-vector');
  const [useRealApi, setUseRealApi] = useState(true);

  // Core diagram model state
  const [diagramTitle, setDiagramTitle] = useState('');
  const [diagramSubtitle, setDiagramSubtitle] = useState('');
  const [figureNumber, setFigureNumber] = useState('FIGURE 1.1');
  const [nodes, setNodes] = useState<DiagramNode[]>([]);
  const [connections, setConnections] = useState<DiagramConnection[]>([]);

  // Individual Style States
  const [customBgColor, setCustomBgColor] = useState('#ffffff');
  const [customStrokeColor, setCustomStrokeColor] = useState('#1e293b');
  const [customTextColor, setCustomTextColor] = useState('#0f172a');
  const [customAccentColor, setCustomAccentColor] = useState('#0d9488');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [showGrid, setShowGrid] = useState(true);
  const [fontFamily, setFontFamily] = useState('sans-serif');
  const [nodeRounding, setNodeRounding] = useState(8);
  const [dashedLines, setDashedLines] = useState(false);

  // Interactive UI
  const [activeTab, setActiveTab] = useState<'prompt' | 'nodes' | 'connections' | 'styling' | 'legend' | 'versions'>('prompt');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingConnId, setEditingConnId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Drag and Drop State
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Versioning State
  const [history, setHistory] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const [customVersionName, setCustomVersionName] = useState('');
  const [showLegend, setShowLegend] = useState(true);

  // Pipeline simulation
  const [isProcessing, setIsProcessing] = useState(false);
  const [generationStep, setGenerationStep] = useState(-1);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [generatedResultUrl, setGeneratedResultUrl] = useState<string | null>(null);

  // Scan curriculum content on load
  useEffect(() => {
    const list: DiagramPlaceholder[] = [];
    const insertRegex = /(?<!\!)(\*\*|")?\[Insert\s+(.*?)\]\1?/gi;
    let match;
    let index = 0;

    while ((match = insertRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const promptText = match[2]?.trim();
      if (promptText && !list.some(item => item.prompt.toLowerCase() === promptText.toLowerCase())) {
        list.push({ id: `insert-${index++}`, originalText: fullMatch, prompt: promptText });
      }
    }

    const diagramRegex = /(?<!\!)\[DIAGRAM:\s*(.*?)\]/gi;
    while ((match = diagramRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const promptText = match[1]?.trim();
      if (promptText && !list.some(item => item.prompt.toLowerCase() === promptText.toLowerCase())) {
        list.push({ id: `diag-${index++}`, originalText: fullMatch, prompt: promptText });
      }
    }

    setPlaceholders(list);
    if (list.length > 0) {
      setSelectedItem(list[0]);
    }
  }, [content]);

  // Load style preset when Art Style changes
  useEffect(() => {
    const preset = THEME_PRESETS[selectedStyle];
    if (preset) {
      setCustomBgColor(preset.bg);
      setCustomStrokeColor(preset.stroke);
      setCustomTextColor(preset.text);
      setCustomAccentColor(preset.accent);
      setFontFamily(preset.font);
      setNodeRounding(preset.rounding);
      setDashedLines(preset.dashed);
    }
  }, [selectedStyle]);

  // Intelligent context-aware model parsing (Curriculum Auto-generation)
  const autoParseCurriculumContext = (prompt: string) => {
    const p = prompt.toLowerCase();
    let title = prompt;
    let sub = "Interactive classroom textbook visualization.";
    let parsedNodes: DiagramNode[] = [];
    let parsedConns: DiagramConnection[] = [];

    if (p.includes('chloroplast') || p.includes('cell') || p.includes('organelle') || p.includes('plant')) {
      title = "Anatomy of a Chloroplast Organelle";
      sub = "Essential double-membrane organelle responsible for photosynthetic pathways.";
      parsedNodes = [
        { id: 'n1', label: 'Outer Membrane', x: 300, y: 70, description: 'Sieves nutrients and regulates organelle boundary.', type: 'capsule' },
        { id: 'n2', label: 'Inner Membrane', x: 300, y: 140, description: 'Regulates specific transport proteins into the matrix.', type: 'capsule' },
        { id: 'n3', label: 'Thylakoids', x: 170, y: 240, description: 'Flat membranous sacs containing chlorophyll pigment molecules.', type: 'rect' },
        { id: 'n4', label: 'Grana Stacks', x: 170, y: 320, description: 'Dense stacks of thylakoids which maximize light-dependent capture.', type: 'rect' },
        { id: 'n5', label: 'Stroma Matrix', x: 430, y: 280, description: 'Gel-like matrix containing soluble enzymes for the Calvin cycle.', type: 'circle' }
      ];
      parsedConns = [
        { id: 'c1', fromId: 'n1', toId: 'n2', label: 'Protects', description: 'Surrounds and limits fluid volume.' },
        { id: 'c2', fromId: 'n3', toId: 'n4', label: 'Clusters', description: 'Flat membranes pile up to construct individual granum.' },
        { id: 'c3', fromId: 'n4', toId: 'n5', label: 'Bathed In', description: 'Grana are suspended inside the alkaline stroma solution.' }
      ];
    } else if (p.includes('balance') || p.includes('algebra') || p.includes('equation') || p.includes('scale')) {
      title = "Algebraic Equality Balance Model";
      sub = "Visual conceptual scale representing left-hand and right-hand side algebraic weight equivalence.";
      parsedNodes = [
        { id: 'n1', label: 'Left Pan (LHS)', x: 160, y: 220, description: 'Carries variables and constant terms (e.g. 3x + 4).', type: 'rect' },
        { id: 'n2', label: 'Right Pan (RHS)', x: 440, y: 220, description: 'Carries constant weights representing equation outputs.', type: 'rect' },
        { id: 'n3', label: 'Central Pivot', x: 300, y: 310, description: 'The stable fulcrum representing equivalent algebraic equations.', type: 'rhombus' },
        { id: 'n4', label: 'Variable (x)', x: 160, y: 130, description: 'Unknown boxes to solve using deductive balance operations.', type: 'circle' }
      ];
      parsedConns = [
        { id: 'c1', fromId: 'n1', toId: 'n3', label: 'Balances', description: 'Supports algebraic LHS variables.' },
        { id: 'c2', fromId: 'n2', toId: 'n3', label: 'Balances', description: 'Supports numeric RHS integers.' },
        { id: 'c3', fromId: 'n4', toId: 'n1', label: 'Loads', description: 'Places unknown variable masses on the LHS pan.' }
      ];
    } else if (p.includes('water') || p.includes('cycle') || p.includes('hydrology') || p.includes('rain')) {
      title = "Hydrological Cycle Mechanics";
      sub = "Global water transport diagram outlining standard thermodynamic state transitions.";
      parsedNodes = [
        { id: 'n1', label: 'Evaporation', x: 140, y: 290, description: 'Solar energy heats surface water into ascending vapor.', type: 'circle' },
        { id: 'n2', label: 'Condensation', x: 300, y: 100, description: 'Atmospheric cooling compresses vapor into liquid cloud particles.', type: 'capsule' },
        { id: 'n3', label: 'Precipitation', x: 460, y: 190, description: 'Saturated clouds release moisture as water rain or snow.', type: 'circle' },
        { id: 'n4', label: 'Surface Runoff', x: 300, y: 330, description: 'Gravity drives surface water back to oceans and reservoirs.', type: 'rect' }
      ];
      parsedConns = [
        { id: 'c1', fromId: 'n1', toId: 'n2', label: 'Ascends', description: 'Ascending vapor reaches the colder upper troposphere.' },
        { id: 'c2', fromId: 'n2', toId: 'n3', label: 'Saturates', description: 'Condensation yields clouds that eventually discharge.' },
        { id: 'c3', fromId: 'n3', toId: 'n4', label: 'Feeds', description: 'Rainwater deposits on slopes and structures.' },
        { id: 'c4', fromId: 'n4', toId: 'n1', label: 'Accumulates', description: 'Water collections supply next-round vapor pathways.' }
      ];
    } else {
      title = prompt;
      sub = "General curriculum conceptual system layout.";
      parsedNodes = [
        { id: 'n1', label: 'Input Node', x: 150, y: 220, description: 'Initiation signal or reactant element entering the system loop.', type: 'capsule' },
        { id: 'n2', label: 'Process State', x: 300, y: 220, description: 'Transformation mechanism modifying system parameters.', type: 'rhombus' },
        { id: 'n3', label: 'Output Result', x: 450, y: 220, description: 'Final compound or outcome of system reactions.', type: 'capsule' }
      ];
      parsedConns = [
        { id: 'c1', fromId: 'n1', toId: 'n2', label: 'Triggers', description: 'Input initiates process action.' },
        { id: 'c2', fromId: 'n2', toId: 'n3', label: 'Produces', description: 'Process yields the output result.' }
      ];
    }

    setDiagramTitle(title);
    setDiagramSubtitle(sub);
    setNodes(parsedNodes);
    setConnections(parsedConns);
    // Auto-save initial state as version 0
    setTimeout(() => {
      saveCheckpoint(parsedNodes, parsedConns, `Initial ${title}`);
    }, 100);
  };

  // Checkpoint/Versioning System Helpers
  const saveCheckpoint = (customNodes = nodes, customConns = connections, label?: string) => {
    const snapshot = {
      id: `ver-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      label: label || `Snapshot (${customNodes.length} nodes, ${customConns.length} connections)`,
      nodes: JSON.parse(JSON.stringify(customNodes)),
      connections: JSON.parse(JSON.stringify(customConns)),
      title: diagramTitle,
      subtitle: diagramSubtitle,
      figureNumber: figureNumber,
      customBgColor,
      customStrokeColor,
      customTextColor,
      customAccentColor,
      strokeWidth,
      showGrid,
      fontFamily,
      nodeRounding,
      dashedLines,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setHistory(prev => [...prev, snapshot]);
    setRedoStack([]); // clear redo stack on new actions
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const currentSnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      connections: JSON.parse(JSON.stringify(connections)),
      title: diagramTitle,
      subtitle: diagramSubtitle,
      figureNumber: figureNumber,
      customBgColor,
      customStrokeColor,
      customTextColor,
      customAccentColor,
      strokeWidth,
      showGrid,
      fontFamily,
      nodeRounding,
      dashedLines,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setRedoStack(prev => [...prev, currentSnapshot]);

    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));

    setNodes(previous.nodes);
    setConnections(previous.connections);
    setDiagramTitle(previous.title);
    setDiagramSubtitle(previous.subtitle);
    setFigureNumber(previous.figureNumber);
    setCustomBgColor(previous.customBgColor);
    setCustomStrokeColor(previous.customStrokeColor);
    setCustomTextColor(previous.customTextColor);
    setCustomAccentColor(previous.customAccentColor);
    setStrokeWidth(previous.strokeWidth);
    setShowGrid(previous.showGrid);
    setFontFamily(previous.fontFamily);
    setNodeRounding(previous.nodeRounding);
    setDashedLines(previous.dashedLines);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextSnapshot = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));

    // Save current to history
    const currentSnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      connections: JSON.parse(JSON.stringify(connections)),
      title: diagramTitle,
      subtitle: diagramSubtitle,
      figureNumber: figureNumber,
      customBgColor,
      customStrokeColor,
      customTextColor,
      customAccentColor,
      strokeWidth,
      showGrid,
      fontFamily,
      nodeRounding,
      dashedLines,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setHistory(prev => [...prev, currentSnapshot]);

    setNodes(nextSnapshot.nodes);
    setConnections(nextSnapshot.connections);
    setDiagramTitle(nextSnapshot.title);
    setDiagramSubtitle(nextSnapshot.subtitle);
    setFigureNumber(nextSnapshot.figureNumber);
    setCustomBgColor(nextSnapshot.customBgColor);
    setCustomStrokeColor(nextSnapshot.customStrokeColor);
    setCustomTextColor(nextSnapshot.customTextColor);
    setCustomAccentColor(nextSnapshot.customAccentColor);
    setStrokeWidth(nextSnapshot.strokeWidth);
    setShowGrid(nextSnapshot.showGrid);
    setFontFamily(nextSnapshot.fontFamily);
    setNodeRounding(nextSnapshot.nodeRounding);
    setDashedLines(nextSnapshot.dashedLines);
  };

  // AI-Powered Document Scanner for automated Legend Tool
  const runAILegendScan = async () => {
    if (!content) return;
    setIsProcessing(true);
    setGenerationStep(0);
    setPipelineLogs([
      `[AI DISCOVERY] Contacting server curriculum scanning module...`,
      `[AI DISCOVERY] Sending lesson notes for NLP extraction (${content.substring(0, 100)}...)`
    ]);

    try {
      const res = await fetch('/api/generate-document-legend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (!res.ok) {
        throw new Error(`AI Scan returned a status code ${res.status}`);
      }

      const result = await res.json();
      
      setGenerationStep(2);
      setPipelineLogs(prev => [...prev, 
        `[CURRICULUM MAPPING] Identified system: "${result.title}"`,
        `[CURRICULUM MAPPING] Extracted ${result.nodes?.length || 0} vocabulary terms`,
        `[CURRICULUM MAPPING] Mapped ${result.connections?.length || 0} relational processes`
      ]);

      setGenerationStep(3);
      setPipelineLogs(prev => [...prev, `[VECTOR COMPILER] Rendering aesthetic textbook vector alignment...`]);

      setTimeout(() => {
        setGenerationStep(4);
        setDiagramTitle(result.title || 'Dynamic Lesson System');
        setDiagramSubtitle(result.subtitle || 'Auto-generated legend definitions.');
        setFigureNumber(result.figureNumber || 'FIGURE 1.2');
        setNodes(result.nodes || []);
        setConnections(result.connections || []);

        // Save AI scan into history checkpoint
        saveCheckpoint(result.nodes || [], result.connections || [], `AI Scan: ${result.title}`);

        const compiledUrl = getCompiledSvgUrl();
        setGeneratedResultUrl(compiledUrl);
        setPipelineLogs(prev => [...prev, `[SUCCESS] Reference Diagram and descriptive Legend compiled!`]);
        setIsProcessing(false);
      }, 1000);

    } catch (err: any) {
      console.error('[AI Legend Scan Error]:', err);
      setPipelineLogs(prev => [...prev, 
        `[FALLBACK WARNING] Server-side AI model query failed or offline.`,
        `[FALLBACK WARNING] Error details: ${err.message || err}`,
        `[FALLBACK WARNING] Reverting to procedural local grammar templates...`
      ]);
      
      setTimeout(() => {
        autoParseCurriculumContext(selectedItem?.prompt || 'System');
        const compiledUrl = getCompiledSvgUrl();
        setGeneratedResultUrl(compiledUrl);
        setIsProcessing(false);
      }, 1500);
    }
  };

  // Drag and Drop Mouse Handlers
  const handleNodeMouseDown = (e: React.MouseEvent, nid: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedNodeId(nid);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedNodeId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    
    // ViewBox width is 600. Project the click to viewBox coordinates
    const scaleX = 600 / rect.width;
    const svgX = Math.round((e.clientX - rect.left) * scaleX);

    // Dynamic height calculation:
    const maxItems = Math.max(nodes.length, connections.length);
    const legendH = (maxItems > 0 && showLegend) ? 50 + (maxItems * 26) : 0;
    const totalHeight = 440 + legendH;
    const scaleY = totalHeight / rect.height;
    const svgY = Math.round((e.clientY - rect.top) * scaleY);

    // Clamp coordinates inside the main diagram box
    const clampedX = Math.max(45, Math.min(555, svgX));
    const clampedY = Math.max(45, Math.min(375, svgY));

    setNodes(prev => prev.map(node => 
      node.id === draggedNodeId ? { ...node, x: clampedX, y: clampedY } : node
    ));
  };

  const handleMouseUp = () => {
    if (draggedNodeId) {
      setDraggedNodeId(null);
      saveCheckpoint();
    }
  };

  // Toolbar Element Addition Handlers
  const handleAddNodeOfShape = (shape: 'circle' | 'rect' | 'capsule' | 'rhombus') => {
    const nextId = `n-${Date.now()}`;
    const labels = {
      circle: 'Sub-system',
      rect: 'Concept State',
      capsule: 'Entity Block',
      rhombus: 'Condition'
    };
    const newNode: DiagramNode = {
      id: nextId,
      label: labels[shape],
      x: 200 + Math.floor(Math.random() * 200),
      y: 150 + Math.floor(Math.random() * 100),
      type: shape,
      description: 'Newly added pedagogical element of our curriculum diagram.'
    };
    const updated = [...nodes, newNode];
    setNodes(updated);
    saveCheckpoint(updated, connections);
    setEditingNodeId(nextId);
    setActiveTab('nodes');
  };

  const handleAddConnection = () => {
    if (nodes.length < 2) return;
    const from = nodes[0].id;
    const to = nodes[1].id;
    const nextId = `c-${Date.now()}`;
    const newConn: DiagramConnection = {
      id: nextId,
      fromId: from,
      toId: to,
      label: 'relates',
      description: 'Describes the pedagogical interaction or flow between these elements.'
    };
    const updated = [...connections, newConn];
    setConnections(updated);
    saveCheckpoint(nodes, updated);
    setEditingConnId(nextId);
    setActiveTab('connections');
  };

  const handleClearCanvas = () => {
    if (window.confirm('Are you sure you want to clear the diagram canvas?')) {
      setNodes([]);
      setConnections([]);
      setDiagramTitle('Cleared Diagram');
      setDiagramSubtitle('Add elements using the toolbar to build your layout.');
      saveCheckpoint([], [], 'Cleared Canvas');
    }
  };

  // Run generation pipeline
  const runGenerationPipeline = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    setGenerationStep(0);
    setPipelineLogs([`[INFO] Booting context analyzer for prompt: "${selectedItem.prompt}"`]);
    
    setTimeout(() => {
      setGenerationStep(1);
      setPipelineLogs(prev => [...prev, `[PEDAGOGY] Scanning curriculum keywords...`, `[PEDAGOGY] Mapping curriculum structures...`]);
      autoParseCurriculumContext(selectedItem.prompt);
      
      setTimeout(() => {
        setGenerationStep(2);
        setPipelineLogs(prev => [...prev, `[STYLE] Framing with "${selectedStyle.toUpperCase()}" constraints...`]);
        
        setTimeout(() => {
          setGenerationStep(3);
          setPipelineLogs(prev => [...prev, `[COMPILE] Rendering high-contrast dynamic textbook layers...`]);
          
          setTimeout(() => {
            setGenerationStep(4);
            const compiledUrl = getCompiledSvgUrl();
            setGeneratedResultUrl(compiledUrl);
            setPipelineLogs(prev => [...prev, `[SUCCESS] Interactive vector diagram generated successfully!`]);
            setIsProcessing(false);
          }, 600);
        }, 600);
      }, 500);
    }, 500);
  };

  // Compile SVG string dynamically
  const buildSvgString = (isClean = false) => {
    const maxItems = Math.max(nodes.length, connections.length);
    const legendHeight = maxItems > 0 ? 50 + (maxItems * 26) : 0;
    const svgHeight = 440 + legendHeight;

    let gridPattern = '';
    if (showGrid) {
      const strokeCol = (customBgColor === '#1e293b' || customBgColor === '#090d16') ? '#334155' : '#e2e8f0';
      gridPattern = `<path d="M 40 0 L 40 40 M 0 40 L 40 40" fill="none" stroke="${strokeCol}" stroke-width="0.5" stroke-opacity="0.5"/>`;
    }

    // Nodes
    let nodesSvg = '';
    nodes.forEach(node => {
      const isHovered = !isClean && hoveredNodeId === node.id;
      const isSelected = !isClean && editingNodeId === node.id;
      const strokeW = isSelected ? strokeWidth + 2 : isHovered ? strokeWidth + 1 : strokeWidth;
      const strokeColor = (isSelected || isHovered) ? customAccentColor : customStrokeColor;
      const fillOpacity = isHovered ? '0.2' : '0.06';

      let shapeSvg = '';
      if (node.type === 'circle') {
        shapeSvg = `<circle cx="${node.x}" cy="${node.y}" r="28" fill="${customAccentColor}" fill-opacity="${fillOpacity}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-dasharray="${dashedLines ? '3,3' : 'none'}"/>`;
      } else if (node.type === 'capsule') {
        shapeSvg = `<rect x="${node.x - 65}" y="${node.y - 18}" width="130" height="36" rx="18" fill="${customAccentColor}" fill-opacity="${fillOpacity}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-dasharray="${dashedLines ? '3,3' : 'none'}"/>`;
      } else if (node.type === 'rhombus') {
        shapeSvg = `<polygon points="${node.x},${node.y - 25} ${node.x + 45},${node.y} ${node.x},${node.y + 25} ${node.x - 45},${node.y}" fill="${customAccentColor}" fill-opacity="${fillOpacity}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-dasharray="${dashedLines ? '3,3' : 'none'}"/>`;
      } else {
        shapeSvg = `<rect x="${node.x - 60}" y="${node.y - 18}" width="120" height="36" rx="${nodeRounding}" fill="${customAccentColor}" fill-opacity="${fillOpacity}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-dasharray="${dashedLines ? '3,3' : 'none'}"/>`;
      }

      nodesSvg += `
        <g id="g-${node.id}" style="cursor: pointer;">
          ${shapeSvg}
          <text x="${node.x}" y="${node.y + 4}" font-family="${fontFamily}" font-size="11" font-weight="bold" fill="${customTextColor}" text-anchor="middle">${node.label}</text>
        </g>
      `;
    });

    // Connections
    let connsSvg = '';
    connections.forEach(conn => {
      const from = nodes.find(n => n.id === conn.fromId);
      const to = nodes.find(n => n.id === conn.toId);
      if (!from || !to) return;

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      const offsetStart = from.type === 'circle' ? 30 : from.type === 'rhombus' ? 42 : 55;
      const offsetEnd = to.type === 'circle' ? 32 : to.type === 'rhombus' ? 44 : 58;

      const startX = from.x + (dx / dist) * offsetStart;
      const startY = from.y + (dy / dist) * offsetStart;
      const endX = to.x - (dx / dist) * offsetEnd;
      const endY = to.y - (dy / dist) * offsetEnd;

      const isHovered = !isClean && (hoveredNodeId === conn.fromId || hoveredNodeId === conn.toId);
      const strokeW = isHovered ? strokeWidth + 1 : strokeWidth - 0.5 || 1.5;
      const strokeCol = isHovered ? customAccentColor : customStrokeColor;

      connsSvg += `<line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" stroke="${strokeCol}" stroke-width="${strokeW}" marker-end="url(#arrowhead)" stroke-dasharray="${dashedLines ? '3,3' : 'none'}"/>`;

      if (conn.label) {
        const cx = (startX + endX) / 2;
        const cy = (startY + endY) / 2;
        const labelW = conn.label.length * 6 + 12;
        connsSvg += `
          <g>
            <rect x="${cx - labelW / 2}" y="${cy - 8}" width="${labelW}" height="16" rx="3" fill="${customBgColor}" stroke="${strokeCol}" stroke-width="0.5" opacity="0.9"/>
            <text x="${cx}" y="${cy + 3}" font-family="${fontFamily}" font-size="9" fill="${customTextColor}" text-anchor="middle" font-weight="600">${conn.label}</text>
          </g>
        `;
      }
    });

    // Legend
    let legendSvg = '';
    if (legendHeight > 0) {
      let legendRows = '';
      
      // Node legend entries (Left column)
      nodes.forEach((node, idx) => {
        const rowY = 485 + (idx * 26);
        const isHovered = !isClean && hoveredNodeId === node.id;
        const col = isHovered ? customAccentColor : customTextColor;
        
        let miniSym = '';
        if (node.type === 'circle') {
          miniSym = `<circle cx="45" cy="${rowY - 3}" r="5" fill="${customAccentColor}" fill-opacity="0.2" stroke="${customStrokeColor}" stroke-width="1" />`;
        } else if (node.type === 'rhombus') {
          miniSym = `<polygon points="45,${rowY - 8} 50,${rowY - 3} 45,${rowY + 2} 40,${rowY - 3}" fill="${customAccentColor}" fill-opacity="0.2" stroke="${customStrokeColor}" stroke-width="1" />`;
        } else {
          miniSym = `<rect x="40" y="${rowY - 8}" width="10" height="10" rx="2" fill="${customAccentColor}" fill-opacity="0.2" stroke="${customStrokeColor}" stroke-width="1" />`;
        }

        legendRows += `
          <g id="leg-node-${node.id}" opacity="${isHovered ? '1' : '0.85'}">
            ${miniSym}
            <text x="58" y="${rowY}" font-family="${fontFamily}" font-size="9" font-weight="bold" fill="${col}">${node.label}:</text>
            <text x="145" y="${rowY}" font-family="${fontFamily}" font-size="8.5" fill="${col}">${node.description.substring(0, 42)}${node.description.length > 42 ? '...' : ''}</text>
          </g>
        `;
      });

      // Connections legend entries (Right column)
      connections.forEach((conn, idx) => {
        const rowY = 485 + (idx * 26);
        const from = nodes.find(n => n.id === conn.fromId);
        const to = nodes.find(n => n.id === conn.toId);
        if (from && to) {
          const isHovered = !isClean && (hoveredNodeId === conn.fromId || hoveredNodeId === conn.toId);
          const col = isHovered ? customAccentColor : customTextColor;
          legendRows += `
            <g id="leg-conn-${conn.id}" opacity="${isHovered ? '1' : '0.85'}">
              <path d="M 320,${rowY - 3} L 332,${rowY - 3}" stroke="${customStrokeColor}" stroke-width="1" marker-end="url(#arrowhead)" />
              <text x="342" y="${rowY}" font-family="${fontFamily}" font-size="9" font-weight="bold" fill="${col}">${from.label} ➔ ${to.label}:</text>
              <text x="445" y="${rowY}" font-family="${fontFamily}" font-size="8.5" fill="${col}">${conn.description.substring(0, 26)}${conn.description.length > 26 ? '...' : ''}</text>
            </g>
          `;
        }
      });

      legendSvg = `
        <rect x="20" y="430" width="560" height="${legendHeight}" fill="${customBgColor}" stroke="${customStrokeColor}" stroke-width="1.5" stroke-dasharray="${dashedLines ? '4,4' : 'none'}" />
        <rect x="25" y="440" width="550" height="22" rx="4" fill="${customAccentColor}" fill-opacity="0.1" stroke="${customStrokeColor}" stroke-width="0.5" />
        <text x="35" y="455" font-family="${fontFamily}" font-size="10" font-weight="bold" fill="${customTextColor}">📋 CURRICULUM REFERENCE MAP & KEY</text>
        ${legendRows}
      `;
    }

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 ${svgHeight}" width="100%" height="100%" id="preview-svg-canvas">
        <defs>
          <pattern id="canvas-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            ${gridPattern || '<rect width="40" height="40" fill="none"/>'}
          </pattern>
          <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="${customStrokeColor}"/>
          </marker>
        </defs>
        
        <rect width="100%" height="100%" fill="${customBgColor}"/>
        ${showGrid ? '<rect width="100%" height="420" fill="url(#canvas-grid)"/>' : ''}
        <rect x="20" y="20" width="560" height="400" fill="none" stroke="${customStrokeColor}" stroke-width="2" stroke-dasharray="${dashedLines ? '5,5' : 'none'}"/>
        
        ${connsSvg}
        ${nodesSvg}
        
        <rect x="25" y="360" width="550" height="52" fill="${customBgColor}" fill-opacity="0.95" stroke="${customStrokeColor}" stroke-width="1"/>
        <text x="40" y="382" font-family="${fontFamily}" font-size="13" font-weight="bold" fill="${customTextColor}">${diagramTitle || 'Untitled Educational Model'}</text>
        <text x="40" y="399" font-family="${fontFamily}" font-size="10" font-weight="normal" fill="${customTextColor}" opacity="0.8">${diagramSubtitle || 'Interactive school textbook aid.'}</text>
        
        <rect x="490" y="35" width="75" height="20" rx="3" fill="${customAccentColor}" fill-opacity="0.1" stroke="${customAccentColor}" stroke-width="1"/>
        <text x="527" y="48" font-family="${fontFamily}" font-size="9" font-weight="bold" fill="${customAccentColor}" text-anchor="middle">${figureNumber || 'FIGURE 1.1'}</text>

        ${legendSvg}
      </svg>
    `.trim();
  };

  const getCompiledSvgUrl = () => {
    const rawSvg = buildSvgString(true);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(rawSvg).replace(/\(/g, '%28').replace(/\)/g, '%29')}`;
  };

  // Live Sync
  useEffect(() => {
    if (nodes.length > 0) {
      setGeneratedResultUrl(getCompiledSvgUrl());
    }
  }, [nodes, connections, diagramTitle, diagramSubtitle, figureNumber, customBgColor, customStrokeColor, customTextColor, customAccentColor, strokeWidth, showGrid, fontFamily, nodeRounding, dashedLines]);

  const handleApplyToDocument = () => {
    if (!selectedItem) return;
    const finalUrl = getCompiledSvgUrl();
    onApplyDiagram(selectedItem.originalText, finalUrl);
  };

  const handleAddCustomPrompt = () => {
    if (!sandboxPrompt.trim()) return;
    const newItem: DiagramPlaceholder = {
      id: `custom-${Date.now()}`,
      originalText: `[Insert custom: ${sandboxPrompt.trim()}]`,
      prompt: sandboxPrompt.trim(),
      isCustom: true
    };
    setPlaceholders(prev => [newItem, ...prev]);
    setSelectedItem(newItem);
    setSandboxPrompt('');
    setGeneratedResultUrl(null);
    setGenerationStep(-1);
    setPipelineLogs([]);
  };

  // Node editing
  const handleUpdateNode = (id: string, field: keyof DiagramNode, val: any) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, [field]: val } : n));
  };

  const handleAddNode = () => {
    const nextId = `node-${Date.now()}`;
    const newNode: DiagramNode = {
      id: nextId,
      label: 'New Node',
      x: 300,
      y: 200,
      description: 'Educational explanation for this new curriculum state.',
      type: 'rect'
    };
    setNodes(prev => [...prev, newNode]);
    setEditingNodeId(nextId);
  };

  const handleRemoveNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c => c.fromId !== id && c.toId !== id));
    if (editingNodeId === id) setEditingNodeId(null);
  };

  // Connection editing

  const handleUpdateConnection = (id: string, field: keyof DiagramConnection, val: any) => {
    setConnections(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
  };

  const handleRemoveConnection = (id: string) => {
    setConnections(prev => prev.filter(c => c.id !== id));
    if (editingConnId === id) setEditingConnId(null);
  };

  // Image Downloads
  const triggerDownloadSvg = () => {
    const rawSvg = buildSvgString(true);
    const blob = new Blob([rawSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(diagramTitle || 'diagram').toLowerCase().replace(/\s+/g, '_')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const triggerDownloadPng = () => {
    const rawSvg = buildSvgString(true);
    const blob = new Blob([rawSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const image = window.document.createElement('img');
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      const maxItems = Math.max(nodes.length, connections.length);
      const computedHeight = 440 + (maxItems > 0 ? 50 + (maxItems * 26) : 0);
      canvas.height = computedHeight * 2; // high res scale

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = customBgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2); // scaling for high-res draw
        ctx.drawImage(image, 0, 0, 600, computedHeight);
        
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `${(diagramTitle || 'diagram').toLowerCase().replace(/\s+/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    };
    image.src = url;
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-2 sm:p-4'}`}>
      <div id="diagram-generator-modal" className={`bg-[#fcfbf9] border border-[#e5e1da] overflow-hidden flex flex-col animate-fadeIn ${
        isFullscreen ? 'w-full h-full max-h-none rounded-none' : 'max-w-6xl w-full shadow-2xl h-[92vh] max-h-[92vh]'
      }`}>
        
        {/* Modal Header */}
        <div className="bg-[#5f6f52] p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-md leading-none sm:text-lg">Classroom Diagram Studio</h2>
              <p className="text-[11px] text-emerald-100 font-normal mt-0.5">Synthesize, style, and edit standard-aligned curriculum visuals</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 hover:bg-white/10 rounded-lg transition text-emerald-100 hover:text-white"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition text-emerald-100 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Studio Grid Workspace */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
          
          {/* Left Column: Sidebar Suite (5 cols) */}
          <div className="lg:col-span-5 border-r border-[#e5e1da] flex flex-col min-h-0 bg-[#faf8f5]">
            
            {/* Sidebar Navigation Tabs */}
            <div className="flex border-b border-[#e5e1da] bg-white text-xs shrink-0 overflow-x-auto">
              <button onClick={() => setActiveTab('prompt')} className={`flex-1 min-w-[70px] py-2.5 text-center font-bold border-b-2 transition ${activeTab === 'prompt' ? 'border-[#5f6f52] text-[#5f6f52] bg-slate-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                1. Prompts
              </button>
              <button onClick={() => { setActiveTab('nodes'); if (nodes.length === 0) autoParseCurriculumContext(selectedItem?.prompt || 'System'); }} className={`flex-1 min-w-[70px] py-2.5 text-center font-bold border-b-2 transition ${activeTab === 'nodes' ? 'border-[#5f6f52] text-[#5f6f52] bg-slate-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                2. Nodes
              </button>
              <button onClick={() => { setActiveTab('connections'); if (nodes.length === 0) autoParseCurriculumContext(selectedItem?.prompt || 'System'); }} className={`flex-1 min-w-[80px] py-2.5 text-center font-bold border-b-2 transition ${activeTab === 'connections' ? 'border-[#5f6f52] text-[#5f6f52] bg-slate-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                3. Flows
              </button>
              <button onClick={() => setActiveTab('styling')} className={`flex-1 min-w-[70px] py-2.5 text-center font-bold border-b-2 transition ${activeTab === 'styling' ? 'border-[#5f6f52] text-[#5f6f52] bg-slate-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                4. Style
              </button>
              <button onClick={() => setActiveTab('legend')} className={`flex-1 min-w-[70px] py-2.5 text-center font-bold border-b-2 transition ${activeTab === 'legend' ? 'border-[#5f6f52] text-[#5f6f52] bg-slate-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                5. Legend
              </button>
              <button onClick={() => setActiveTab('versions')} className={`flex-1 min-w-[70px] py-2.5 text-center font-bold border-b-2 transition ${activeTab === 'versions' ? 'border-[#5f6f52] text-[#5f6f52] bg-slate-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                6. Versions
              </button>
            </div>

            {/* Sidebar Content Area (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* Tab 1: Prompts & Sandbox */}
              {activeTab === 'prompt' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Layout className="w-3.5 h-3.5 text-[#5f6f52]" />
                      Scanned Placeholders
                    </span>
                    {placeholders.length === 0 ? (
                      <div className="p-3 border border-dashed border-[#e5e1da] rounded-xl text-center bg-white text-xs text-slate-400">
                        No [Insert ...] placeholder blocks detected in document.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {placeholders.map((item) => {
                          const isSelected = selectedItem?.id === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => { setSelectedItem(item); setGeneratedResultUrl(null); setGenerationStep(-1); }}
                              className={`w-full text-left p-2.5 rounded-xl border transition flex items-start gap-2.5 ${isSelected ? 'bg-[#5f6f52]/10 border-[#5f6f52]' : 'bg-white border-[#e5e1da] hover:border-slate-300'}`}
                            >
                              <Image className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isSelected ? 'text-[#5f6f52]' : 'text-slate-400'}`} />
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-bold truncate ${isSelected ? 'text-[#5f6f52]' : 'text-slate-700'}`}>{item.prompt}</p>
                                <p className="text-[9px] font-mono text-slate-400 truncate mt-0.5">{item.originalText}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-amber-50/50 border border-amber-200/50 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                      <Wand2 className="w-3.5 h-3.5 text-amber-700" />
                      Add Custom Prompt Sandbox
                    </span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={sandboxPrompt}
                        onChange={(e) => setSandboxPrompt(e.target.value)}
                        placeholder="e.g. Nitrogen Atom molecular structures"
                        className="flex-1 bg-white border border-[#e5e1da] rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-[#5f6f52]"
                      />
                      <button
                        onClick={handleAddCustomPrompt}
                        disabled={!sandboxPrompt.trim()}
                        className="bg-[#d4a373] hover:bg-[#b07e4d] disabled:opacity-50 text-white px-3 py-1 rounded-lg text-xs font-bold shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#5f6f52]/10 border border-[#5f6f52]/30 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-[#5f6f52] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 animate-pulse text-[#5f6f52]" />
                      AI-Powered Legend Extractor
                    </span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Scans the active document curriculum text to automatically extract nodes, flows, titles, and build a descriptive map legend.
                    </p>
                    <button
                      onClick={runAILegendScan}
                      disabled={isProcessing || !content}
                      className="w-full flex items-center justify-center gap-1.5 bg-[#5f6f52] hover:bg-[#4d5a42] disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} /> Scan Lesson for Legend Keys
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Palette className="w-3.5 h-3.5 text-[#5f6f52]" />
                      Base Theme Template
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(Object.keys(THEME_PRESETS) as ArtStyle[]).map((style) => (
                        <button
                          key={style}
                          onClick={() => setSelectedStyle(style)}
                          className={`p-2 rounded-lg border text-left text-xs transition ${selectedStyle === style ? 'bg-white border-[#5f6f52] ring-1 ring-[#5f6f52] text-[#5f6f52] font-bold' : 'bg-white border-[#e5e1da] text-slate-600 hover:border-slate-300'}`}
                        >
                          {style.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Nodes Editor */}
              {activeTab === 'nodes' && (
                <div className="space-y-3 animate-fadeIn text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Diagram Nodes & Coordinates</span>
                    <button onClick={handleAddNode} className="flex items-center gap-1 px-2.5 py-1 bg-[#5f6f52] text-white rounded-lg hover:bg-[#4d5a42] font-bold text-[11px]">
                      <Plus className="w-3.5 h-3.5" /> Add Node
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {nodes.map((node) => {
                      const isEditing = editingNodeId === node.id;
                      return (
                        <div key={node.id} className={`p-3 rounded-xl border bg-white transition space-y-2 ${isEditing ? 'border-[#5f6f52] shadow-sm' : 'border-[#e5e1da]'}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{node.id}</span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => setEditingNodeId(isEditing ? null : node.id)} className="px-2 py-0.5 bg-slate-100 hover:bg-[#5f6f52]/10 hover:text-[#5f6f52] rounded text-[10px] font-bold">
                                {isEditing ? 'Done' : 'Edit'}
                              </button>
                              <button onClick={() => handleRemoveNode(node.id)} className="p-1 hover:text-red-600 text-slate-400">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400">Node Label</label>
                              <input
                                type="text"
                                value={node.label}
                                onChange={(e) => handleUpdateNode(node.id, 'label', e.target.value)}
                                className="w-full border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400">Shape Type</label>
                              <select
                                value={node.type}
                                onChange={(e) => handleUpdateNode(node.id, 'type', e.target.value)}
                                className="w-full border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 bg-white"
                              >
                                <option value="rect">Rectangle</option>
                                <option value="circle">Circle</option>
                                <option value="capsule">Capsule</option>
                                <option value="rhombus">Rhombus</option>
                              </select>
                            </div>
                          </div>

                          {isEditing && (
                            <div className="space-y-2 pt-2 border-t border-slate-100 animate-fadeIn">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400">Pos X ({node.x}px)</label>
                                  <input
                                    type="range"
                                    min="40"
                                    max="560"
                                    value={node.x}
                                    onChange={(e) => handleUpdateNode(node.id, 'x', parseInt(e.target.value))}
                                    className="w-full accent-[#5f6f52]"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400">Pos Y ({node.y}px)</label>
                                  <input
                                    type="range"
                                    min="40"
                                    max="380"
                                    value={node.y}
                                    onChange={(e) => handleUpdateNode(node.id, 'y', parseInt(e.target.value))}
                                    className="w-full accent-[#5f6f52]"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-400">Curriculum Explanation</label>
                                <textarea
                                  value={node.description}
                                  onChange={(e) => handleUpdateNode(node.id, 'description', e.target.value)}
                                  className="w-full border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-700 h-12 resize-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 3: Connections Editor */}
              {activeTab === 'connections' && (
                <div className="space-y-3 animate-fadeIn text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Relational Connection Flows</span>
                    <button onClick={handleAddConnection} className="flex items-center gap-1 px-2.5 py-1 bg-[#5f6f52] text-white rounded-lg hover:bg-[#4d5a42] font-bold text-[11px]">
                      <Plus className="w-3.5 h-3.5" /> Add Flow
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {connections.map((conn) => {
                      const isEditing = editingConnId === conn.id;
                      return (
                        <div key={conn.id} className={`p-3 rounded-xl border bg-white transition space-y-2 ${isEditing ? 'border-[#5f6f52] shadow-sm' : 'border-[#e5e1da]'}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{conn.id}</span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => setEditingConnId(isEditing ? null : conn.id)} className="px-2 py-0.5 bg-slate-100 hover:bg-[#5f6f52]/10 hover:text-[#5f6f52] rounded text-[10px] font-bold">
                                {isEditing ? 'Done' : 'Edit'}
                              </button>
                              <button onClick={() => handleRemoveConnection(conn.id)} className="p-1 hover:text-red-600 text-slate-400">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400">From Node</label>
                              <select
                                value={conn.fromId}
                                onChange={(e) => handleUpdateConnection(conn.id, 'fromId', e.target.value)}
                                className="w-full border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 bg-white"
                              >
                                {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400">To Node</label>
                              <select
                                value={conn.toId}
                                onChange={(e) => handleUpdateConnection(conn.id, 'toId', e.target.value)}
                                className="w-full border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 bg-white"
                              >
                                {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400">Flow Action Label</label>
                            <input
                              type="text"
                              value={conn.label}
                              onChange={(e) => handleUpdateConnection(conn.id, 'label', e.target.value)}
                              className="w-full border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700"
                            />
                          </div>

                          {isEditing && (
                            <div className="pt-2 border-t border-slate-100 animate-fadeIn">
                              <label className="text-[10px] font-bold text-slate-400">Flow Relationship Description</label>
                              <textarea
                                value={conn.description}
                                onChange={(e) => handleUpdateConnection(conn.id, 'description', e.target.value)}
                                className="w-full border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-700 h-12 resize-none"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 4: Styling Panel */}
              {activeTab === 'styling' && (
                <div className="space-y-4 animate-fadeIn text-xs">
                  <span className="font-bold text-slate-700 block">Custom Diagram Styling Controls</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Canvas Background</label>
                      <div className="flex gap-1.5 items-center">
                        <input type="color" value={customBgColor} onChange={(e) => setCustomBgColor(e.target.value)} className="w-6 h-6 border-0 cursor-pointer rounded" />
                        <input type="text" value={customBgColor} onChange={(e) => setCustomBgColor(e.target.value)} className="flex-1 text-[10px] border border-slate-200 rounded px-1" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Stroke / Border Color</label>
                      <div className="flex gap-1.5 items-center">
                        <input type="color" value={customStrokeColor} onChange={(e) => setCustomStrokeColor(e.target.value)} className="w-6 h-6 border-0 cursor-pointer rounded" />
                        <input type="text" value={customStrokeColor} onChange={(e) => setCustomStrokeColor(e.target.value)} className="flex-1 text-[10px] border border-slate-200 rounded px-1" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Node Text Color</label>
                      <div className="flex gap-1.5 items-center">
                        <input type="color" value={customTextColor} onChange={(e) => setCustomTextColor(e.target.value)} className="w-6 h-6 border-0 cursor-pointer rounded" />
                        <input type="text" value={customTextColor} onChange={(e) => setCustomTextColor(e.target.value)} className="flex-1 text-[10px] border border-slate-200 rounded px-1" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Theme Accent Color</label>
                      <div className="flex gap-1.5 items-center">
                        <input type="color" value={customAccentColor} onChange={(e) => setCustomAccentColor(e.target.value)} className="w-6 h-6 border-0 cursor-pointer rounded" />
                        <input type="text" value={customAccentColor} onChange={(e) => setCustomAccentColor(e.target.value)} className="flex-1 text-[10px] border border-slate-200 rounded px-1" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-600 flex items-center gap-1"><Grid className="w-3.5 h-3.5 text-[#5f6f52]" /> Display Helper Grid</span>
                      <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="w-4 h-4 cursor-pointer accent-[#5f6f52]" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-600 flex items-center gap-1"><ArrowRightLeft className="w-3.5 h-3.5 text-[#5f6f52]" /> Dashed Outlines</span>
                      <input type="checkbox" checked={dashedLines} onChange={(e) => setDashedLines(e.target.checked)} className="w-4 h-4 cursor-pointer accent-[#5f6f52]" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Font Family</label>
                      <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 bg-white">
                        <option value="sans-serif">📚 Sans Serif Standard</option>
                        <option value="serif">📐 Serif Historical</option>
                        <option value="monospace">💻 Monospace Scientific</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400">Stroke Thickness ({strokeWidth}px)</label>
                        <input type="range" min="1" max="4" step="0.5" value={strokeWidth} onChange={(e) => setStrokeWidth(parseFloat(e.target.value))} className="w-full accent-[#5f6f52]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400">Node Corner Radius ({nodeRounding}px)</label>
                        <input type="range" min="0" max="20" value={nodeRounding} onChange={(e) => setNodeRounding(parseInt(e.target.value))} className="w-full accent-[#5f6f52]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Legend Editor */}
              {activeTab === 'legend' && (
                <div className="space-y-3 animate-fadeIn text-xs">
                  <span className="font-bold text-slate-700 block">Legend & Curriculum Text Alignment</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Auto-generated from document context. These definitions print inside the SVG legend panel automatically.
                  </p>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Main Diagram Title</label>
                      <input type="text" value={diagramTitle} onChange={(e) => setDiagramTitle(e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1 text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Sub-academic Caption</label>
                      <input type="text" value={diagramSubtitle} onChange={(e) => setDiagramSubtitle(e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1 text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Figure Stamp Label</label>
                      <input type="text" value={figureNumber} onChange={(e) => setFigureNumber(e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1 text-xs" />
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <span className="font-semibold text-[10px] text-slate-400 uppercase">Interactive Elements Explanation Keys</span>
                      {nodes.map(n => (
                        <div key={n.id} className="space-y-1">
                          <label className="font-bold text-[#5f6f52] block">{n.label}</label>
                          <input
                            type="text"
                            value={n.description}
                            onChange={(e) => handleUpdateNode(n.id, 'description', e.target.value)}
                            className="w-full border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-600"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: Versions Tab inside Sidebar */}
              {activeTab === 'versions' && (
                <div className="space-y-4 animate-fadeIn text-xs">
                  <span className="font-bold text-slate-700 block">Lesson Diagram Versions</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Capture state checkpoints of your active canvas layout and custom styles to easily restore or compare diagram phases.
                  </p>

                  {/* Save manual checkpoint */}
                  <div className="bg-[#faf8f5] p-3 rounded-xl border border-[#e5e1da] space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Save Current Checkpoint</span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={customVersionName}
                        onChange={(e) => setCustomVersionName(e.target.value)}
                        placeholder="e.g. Relocated organelles"
                        className="flex-1 bg-white border border-[#e5e1da] rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-[#5f6f52]"
                      />
                      <button
                        onClick={() => {
                          if (!customVersionName.trim()) return;
                          saveCheckpoint(nodes, connections, customVersionName.trim());
                          setCustomVersionName('');
                        }}
                        className="bg-[#5f6f52] hover:bg-[#4d5a42] text-white px-3.5 py-1 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 shadow-xs"
                      >
                        <Save className="w-3 h-3" /> Save
                      </button>
                    </div>
                  </div>

                  {/* History List */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Version Registry ({history.length} Saved)</span>
                    {history.length === 0 ? (
                      <div className="p-3 border border-dashed border-[#e5e1da] rounded-xl text-center bg-white text-xs text-slate-400">
                        No previous checkpoints recorded yet. Changes will auto-save as you edit elements!
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                        {history.map((ver, idx) => (
                          <div
                            key={ver.id || idx}
                            className="p-2.5 rounded-xl border border-[#e5e1da] bg-white hover:border-slate-300 transition flex items-center justify-between"
                          >
                            <div className="flex items-start gap-2 min-w-0">
                              <History className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="font-bold text-slate-700 truncate">{ver.label}</p>
                                <p className="text-[9px] text-slate-400 font-mono mt-0.5">Recorded at {ver.timestamp}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                // Restore this specific version
                                setNodes(ver.nodes);
                                setConnections(ver.connections);
                                setDiagramTitle(ver.title);
                                setDiagramSubtitle(ver.subtitle);
                                setFigureNumber(ver.figureNumber);
                                setCustomBgColor(ver.customBgColor);
                                setCustomStrokeColor(ver.customStrokeColor);
                                setCustomTextColor(ver.customTextColor);
                                setCustomAccentColor(ver.customAccentColor);
                                setStrokeWidth(ver.strokeWidth);
                                setShowGrid(ver.showGrid);
                                setFontFamily(ver.fontFamily);
                                setNodeRounding(ver.nodeRounding);
                                setDashedLines(ver.dashedLines);
                              }}
                              className="px-2 py-0.5 bg-slate-100 hover:bg-[#5f6f52]/10 hover:text-[#5f6f52] rounded text-[10px] font-bold"
                            >
                              Restore
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Right Column: Execution Logs & Preview Area (7 cols) */}
          <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col min-h-0 bg-white">
            
            {/* Context Header */}
            {selectedItem && (
              <div className="bg-[#faf8f5] p-3 rounded-xl border border-[#e5e1da] space-y-1 mb-3 shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Selected Lesson Slot:</span>
                <h3 className="text-xs sm:text-sm font-bold text-[#5f6f52] truncate">{selectedItem.prompt}</h3>
              </div>
            )}

            {/* Dynamic Preview Workspace */}
            <div className="flex-1 border border-[#e5e1da] rounded-xl overflow-hidden bg-[#fafafa] flex flex-col min-h-0 shadow-inner relative">
              
              {generationStep === -1 && !generatedResultUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="p-3 bg-white rounded-full border border-slate-200 text-[#5f6f52]">
                    <Image className="w-8 h-8 animate-pulse" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <p className="text-xs font-bold text-slate-700">Synthesize Classroom Textbook Graphic</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Initialize our dynamic alignment algorithm to match target curriculum elements and compile style-coherent diagrams.
                    </p>
                  </div>
                  <button
                    onClick={runGenerationPipeline}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 bg-[#5f6f52] hover:bg-[#4d5a42] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Compile Visual Asset
                  </button>
                </div>
              )}

              {/* Step Logs */}
              {isProcessing && (
                <div className="absolute inset-0 flex flex-col p-4 bg-slate-950 text-slate-200 font-mono text-[10px] space-y-3 overflow-y-auto">
                  <div className="flex justify-between items-center text-amber-400 font-bold border-b border-slate-800 pb-2">
                    <span>⚙️ Diagram Synthesizer Engine running...</span>
                    <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
                  </div>
                  <div className="flex-1 space-y-1.5 max-h-[250px] overflow-y-auto">
                    {pipelineLogs.map((log, i) => (
                      <div key={i} className="pl-2 border-l border-slate-700">{log}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Canvas View */}
              {!isProcessing && generatedResultUrl && (
                <div className="flex-1 flex flex-col min-h-0 p-3 space-y-3">
                  
                  {/* Action Bar */}
                  <div className="flex items-center justify-between shrink-0 bg-white p-2 rounded-lg border border-slate-100 text-xs shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 text-[10px]">
                        <Check className="w-3 h-3 text-emerald-600" /> Vector Rendered
                      </span>
                      <div className="flex items-center border border-slate-200 rounded overflow-hidden">
                        <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} className="px-1.5 py-0.5 hover:bg-slate-100 text-slate-500 font-bold">-</button>
                        <span className="px-2 text-[10px] font-bold text-slate-600 bg-slate-50">{zoomLevel}%</span>
                        <button onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))} className="px-1.5 py-0.5 hover:bg-slate-100 text-slate-500 font-bold">+</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={triggerDownloadSvg} className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded font-bold text-[10px]">
                        <Download className="w-3.5 h-3.5" /> SVG
                      </button>
                      <button onClick={triggerDownloadPng} className="flex items-center gap-1 px-2 py-1 bg-[#d4a373] hover:bg-[#b07e4d] text-white rounded font-bold text-[10px]">
                        <Download className="w-3.5 h-3.5" /> PNG
                      </button>
                    </div>
                          {/* Editor Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs shrink-0 select-none">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Add Element:</span>
                      <button 
                        onClick={() => handleAddNodeOfShape('rect')}
                        className="flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold transition"
                        title="Add Rectangle Node"
                      >
                        <Plus className="w-2.5 h-2.5 text-emerald-600" /> Rect
                      </button>
                      <button 
                        onClick={() => handleAddNodeOfShape('circle')}
                        className="flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold transition"
                        title="Add Circle Node"
                      >
                        <Plus className="w-2.5 h-2.5 text-emerald-600" /> Circle
                      </button>
                      <button 
                        onClick={() => handleAddNodeOfShape('capsule')}
                        className="flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold transition"
                        title="Add Capsule Node"
                      >
                        <Plus className="w-2.5 h-2.5 text-emerald-600" /> Capsule
                      </button>
                      <button 
                        onClick={() => handleAddNodeOfShape('rhombus')}
                        className="flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold transition"
                        title="Add Rhombus Node"
                      >
                        <Plus className="w-2.5 h-2.5 text-emerald-600" /> Decision
                      </button>

                      <div className="h-4 w-px bg-slate-200 mx-1"></div>

                      <button 
                        onClick={handleAddConnection}
                        disabled={nodes.length < 2}
                        className="flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 disabled:opacity-50 disabled:hover:bg-white rounded-lg text-slate-700 font-bold transition"
                        title="Add Flow Line"
                      >
                        <ArrowRight className="w-2.5 h-2.5 text-blue-600" /> + Flow
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => { setShowGrid(!showGrid); saveCheckpoint(); }}
                        className={`p-1 rounded-lg border transition ${showGrid ? 'bg-[#5f6f52]/10 border-[#5f6f52] text-[#5f6f52]' : 'bg-white border-slate-200 text-slate-500'}`}
                        title="Toggle Background Grid"
                      >
                        <Grid className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => { setDashedLines(!dashedLines); saveCheckpoint(); }}
                        className={`p-1 rounded-lg border transition ${dashedLines ? 'bg-[#5f6f52]/10 border-[#5f6f52] text-[#5f6f52]' : 'bg-white border-slate-200 text-slate-500'}`}
                        title="Toggle Dashed Flow Lines"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => setShowLegend(!showLegend)}
                        className={`p-1 rounded-lg border transition ${showLegend ? 'bg-[#5f6f52]/10 border-[#5f6f52] text-[#5f6f52]' : 'bg-white border-slate-200 text-slate-500'}`}
                        title="Toggle Reference Legend"
                      >
                        <Info className="w-3 h-3" />
                      </button>

                      <div className="h-4 w-px bg-slate-200 mx-1"></div>

                      <button 
                        onClick={handleUndo}
                        disabled={history.length === 0}
                        className="p-1 rounded-lg border bg-white border-slate-200 disabled:opacity-40 text-slate-600 hover:text-slate-900 transition"
                        title="Undo Move"
                      >
                        <Undo2 className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={handleRedo}
                        disabled={redoStack.length === 0}
                        className="p-1 rounded-lg border bg-white border-slate-200 disabled:opacity-40 text-slate-600 hover:text-slate-900 transition"
                        title="Redo Move"
                      >
                        <Redo2 className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={handleClearCanvas}
                        className="p-1 rounded-lg border bg-white hover:bg-red-50 border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600 transition"
                        title="Clear Canvas"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* SVG Canvas Box */}
                  <div className="flex-1 bg-[#121212]/5 border border-slate-200 rounded-xl overflow-auto flex items-center justify-center p-2 relative">
                    <div style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }} className="max-h-full max-w-full">
                      <div className="shadow-md rounded-lg overflow-hidden bg-white min-w-[500px] max-w-[500px]">
                        <svg 
                          ref={svgRef}
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox={`0 0 600 ${440 + ((Math.max(nodes.length, connections.length) > 0 && showLegend) ? 50 + (Math.max(nodes.length, connections.length) * 26) : 0)}`} 
                          width="100%" 
                          height="100%" 
                          id="preview-svg-canvas"
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseUp}
                          style={{ userSelect: 'none' }}
                        >
                          <defs>
                            <pattern id="canvas-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                              {showGrid && (
                                <path 
                                  d="M 40 0 L 40 40 M 0 40 L 40 40" 
                                  fill="none" 
                                  stroke={(customBgColor === '#1e293b' || customBgColor === '#090d16') ? '#334155' : '#e2e8f0'} 
                                  strokeWidth="0.5" 
                                  strokeOpacity="0.5" 
                                />
                              )}
                            </pattern>
                            <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={customStrokeColor} />
                            </marker>
                          </defs>

                          {/* Background */}
                          <rect width="100%" height="100%" fill={customBgColor} />
                          {showGrid && <rect width="100%" height="420" fill="url(#canvas-grid)" />}
                          <rect x="20" y="20" width="560" height="400" fill="none" stroke={customStrokeColor} strokeWidth="2" strokeDasharray={dashedLines ? "5,5" : "none"} />

                          {/* Connections */}
                          {connections.map(conn => {
                            const from = nodes.find(n => n.id === conn.fromId);
                            const to = nodes.find(n => n.id === conn.toId);
                            if (!from || !to) return null;

                            const dx = to.x - from.x;
                            const dy = to.y - from.y;
                            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

                            const offsetStart = from.type === 'circle' ? 30 : from.type === 'rhombus' ? 42 : 55;
                            const offsetEnd = to.type === 'circle' ? 32 : to.type === 'rhombus' ? 44 : 58;

                            const startX = from.x + (dx / dist) * offsetStart;
                            const startY = from.y + (dy / dist) * offsetStart;
                            const endX = to.x - (dx / dist) * offsetEnd;
                            const endY = to.y - (dy / dist) * offsetEnd;

                            const isHovered = hoveredNodeId === conn.fromId || hoveredNodeId === conn.toId;
                            const strokeW = isHovered ? strokeWidth + 1 : strokeWidth - 0.5 || 1.5;
                            const strokeCol = isHovered ? customAccentColor : customStrokeColor;

                            const cx = (startX + endX) / 2;
                            const cy = (startY + endY) / 2;
                            const labelW = conn.label ? conn.label.length * 6 + 12 : 0;

                            return (
                              <g key={conn.id}>
                                <line 
                                  x1={startX} 
                                  y1={startY} 
                                  x2={endX} 
                                  y2={endY} 
                                  stroke={strokeCol} 
                                  strokeWidth={strokeW} 
                                  markerEnd="url(#arrowhead)" 
                                  strokeDasharray={dashedLines ? "3,3" : "none"} 
                                />
                                {conn.label && (
                                  <g>
                                    <rect 
                                      x={cx - labelW / 2} 
                                      y={cy - 8} 
                                      width={labelW} 
                                      height={16} 
                                      rx={3} 
                                      fill={customBgColor} 
                                      stroke={strokeCol} 
                                      strokeWidth="0.5" 
                                      opacity="0.9" 
                                    />
                                    <text 
                                      x={cx} 
                                      y={cy + 3} 
                                      fontFamily={fontFamily} 
                                      fontSize="9" 
                                      fill={customTextColor} 
                                      textAnchor="middle" 
                                      fontWeight="600"
                                    >
                                      {conn.label}
                                    </text>
                                  </g>
                                )}
                              </g>
                            );
                          })}

                          {/* Nodes */}
                          {nodes.map(node => {
                            const isHovered = hoveredNodeId === node.id;
                            const isSelected = editingNodeId === node.id;
                            const isDragged = draggedNodeId === node.id;
                            const strokeW = isSelected ? strokeWidth + 2 : isHovered ? strokeWidth + 1 : strokeWidth;
                            const strokeColor = (isSelected || isHovered || isDragged) ? customAccentColor : customStrokeColor;
                            const fillOpacity = (isHovered || isDragged) ? '0.2' : '0.06';

                            let shapeNode = null;
                            if (node.type === 'circle') {
                              shapeNode = (
                                <circle 
                                  cx={node.x} 
                                  cy={node.y} 
                                  r="28" 
                                  fill={customAccentColor} 
                                  fillOpacity={fillOpacity} 
                                  stroke={strokeColor} 
                                  strokeWidth={strokeW} 
                                  strokeDasharray={dashedLines ? "3,3" : "none"} 
                                />
                              );
                            } else if (node.type === 'capsule') {
                              shapeNode = (
                                <rect 
                                  x={node.x - 65} 
                                  y={node.y - 18} 
                                  width="130" 
                                  height="36" 
                                  rx="18" 
                                  fill={customAccentColor} 
                                  fillOpacity={fillOpacity} 
                                  stroke={strokeColor} 
                                  strokeWidth={strokeW} 
                                  strokeDasharray={dashedLines ? "3,3" : "none"} 
                                />
                              );
                            } else if (node.type === 'rhombus') {
                              const points = `${node.x},${node.y - 25} ${node.x + 45},${node.y} ${node.x},${node.y + 25} ${node.x - 45},${node.y}`;
                              shapeNode = (
                                <polygon 
                                  points={points} 
                                  fill={customAccentColor} 
                                  fillOpacity={fillOpacity} 
                                  stroke={strokeColor} 
                                  strokeWidth={strokeW} 
                                  strokeDasharray={dashedLines ? "3,3" : "none"} 
                                />
                              );
                            } else {
                              shapeNode = (
                                <rect 
                                  x={node.x - 60} 
                                  y={node.y - 18} 
                                  width="120" 
                                  height="36" 
                                  rx={nodeRounding} 
                                  fill={customAccentColor} 
                                  fillOpacity={fillOpacity} 
                                  stroke={strokeColor} 
                                  strokeWidth={strokeW} 
                                  strokeDasharray={dashedLines ? "3,3" : "none"} 
                                />
                              );
                            }

                            return (
                              <g 
                                key={node.id} 
                                style={{ cursor: isDragged ? 'grabbing' : 'grab' }}
                                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                                onMouseEnter={() => setHoveredNodeId(node.id)}
                                onMouseLeave={() => setHoveredNodeId(null)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingNodeId(node.id);
                                  setActiveTab('nodes');
                                }}
                              >
                                {shapeNode}
                                <text 
                                  x={node.x} 
                                  y={node.y + 4} 
                                  fontFamily={fontFamily} 
                                  fontSize="11" 
                                  fontWeight="bold" 
                                  fill={customTextColor} 
                                  textAnchor="middle"
                                >
                                  {node.label}
                                </text>
                              </g>
                            );
                          })}

                          {/* Text labels at the bottom */}
                          <rect x="25" y="360" width="550" height="52" fill={customBgColor} fillOpacity="0.95" stroke={customStrokeColor} strokeWidth="1" />
                          <text x="40" y="382" fontFamily={fontFamily} fontSize="13" fontWeight="bold" fill={customTextColor}>
                            {diagramTitle || 'Untitled Educational Model'}
                          </text>
                          <text x="40" y="399" fontFamily={fontFamily} fontSize="10" fontWeight="normal" fill={customTextColor} opacity="0.8">
                            {diagramSubtitle || 'Interactive school textbook aid.'}
                          </text>

                          {/* Figure stamp */}
                          <rect x="490" y="35" width="75" height="20" rx="3" fill={customAccentColor} fillOpacity="0.1" stroke={customAccentColor} strokeWidth="1" />
                          <text x="527" y="48" fontFamily={fontFamily} fontSize="9" fontWeight="bold" fill={customAccentColor} textAnchor="middle">
                            {figureNumber || 'FIGURE 1.1'}
                          </text>

                          {/* Legend map */}
                          {showLegend && Math.max(nodes.length, connections.length) > 0 && (
                            <g>
                              <rect x="20" y="430" width="560" height={50 + (Math.max(nodes.length, connections.length) * 26)} fill={customBgColor} stroke={customStrokeColor} strokeWidth="1.5" strokeDasharray={dashedLines ? "4,4" : "none"} />
                              <rect x="25" y="440" width="550" height="22" rx="4" fill={customAccentColor} fillOpacity="0.1" stroke={customStrokeColor} strokeWidth="0.5" />
                              <text x="35" y="455" fontFamily={fontFamily} fontSize="10" fontWeight="bold" fill={customTextColor}>
                                📋 CURRICULUM REFERENCE MAP & KEY
                              </text>

                              {/* Nodes Legend */}
                              {nodes.map((node, idx) => {
                                const rowY = 485 + (idx * 26);
                                const isHovered = hoveredNodeId === node.id;
                                const col = isHovered ? customAccentColor : customTextColor;

                                let miniSym = null;
                                if (node.type === 'circle') {
                                  miniSym = <circle cx="45" cy={rowY - 3} r="5" fill={customAccentColor} fillOpacity="0.2" stroke={customStrokeColor} strokeWidth="1" />;
                                } else if (node.type === 'rhombus') {
                                  const miniPoints = `45,${rowY - 8} 50,${rowY - 3} 45,${rowY + 2} 40,${rowY - 3}`;
                                  miniSym = <polygon points={miniPoints} fill={customAccentColor} fillOpacity="0.2" stroke={customStrokeColor} strokeWidth="1" />;
                                } else {
                                  miniSym = <rect x="40" y={rowY - 8} width="10" height="10" rx="2" fill={customAccentColor} fillOpacity="0.2" stroke={customStrokeColor} strokeWidth="1" />;
                                }

                                return (
                                  <g key={`leg-node-${node.id}`} opacity={isHovered ? 1 : 0.85}>
                                    {miniSym}
                                    <text x="58" y={rowY} fontFamily={fontFamily} fontSize="9" fontWeight="bold" fill={col}>
                                      {node.label}:
                                    </text>
                                    <text x="145" y={rowY} fontFamily={fontFamily} fontSize="8.5" fill={col}>
                                      {node.description.substring(0, 42)}{node.description.length > 42 ? '...' : ''}
                                    </text>
                                  </g>
                                );
                              })}

                              {/* Connections Legend */}
                              {connections.map((conn, idx) => {
                                const rowY = 485 + (idx * 26);
                                const from = nodes.find(n => n.id === conn.fromId);
                                const to = nodes.find(n => n.id === conn.toId);
                                if (!from || !to) return null;

                                const isHovered = hoveredNodeId === conn.fromId || hoveredNodeId === conn.toId;
                                const col = isHovered ? customAccentColor : customTextColor;

                                return (
                                  <g key={`leg-conn-${conn.id}`} opacity={isHovered ? 1 : 0.85}>
                                    <path d={`M 320,${rowY - 3} L 332,${rowY - 3}`} stroke={customStrokeColor} strokeWidth="1" markerEnd="url(#arrowhead)" />
                                    <text x="342" y={rowY} fontFamily={fontFamily} fontSize="9" fontWeight="bold" fill={col}>
                                      {from.label} ➔ {to.label}:
                                    </text>
                                    <text x="445" y={rowY} fontFamily={fontFamily} fontSize="8.5" fill={col}>
                                      {conn.description.substring(0, 26)}{conn.description.length > 26 ? '...' : ''}
                                    </text>
                                  </g>
                                );
                              })}
                            </g>
                          )}
                        </svg>
                      </div>
                    </div>
                  </div>            </div>

                  {/* Curriculum Guide Notice */}
                  <div className="bg-[#5f6f52]/5 p-2 rounded-lg border border-[#5f6f52]/10 flex items-start gap-2 text-[10px] text-slate-500">
                    <Info className="w-4 h-4 text-[#5f6f52] shrink-0 mt-0.5" />
                    <span><strong>Legend Attached:</strong> Elements and flow definitions are packaged directly inside the vector diagram to guarantee readability during lesson exports or offline classroom distribution.</span>
                  </div>

                </div>
              )}

            </div>

          </div>

        </div>

        {/* Modal Action Footer */}
        <div className="bg-[#faf8f5] border-t border-[#e5e1da] p-3.5 flex justify-between items-center shrink-0 text-xs">
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            diagram-generator-module • v1.2.0 • dynamic legend integrated
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-[#e5e1da] rounded-xl font-bold transition"
            >
              Dismiss
            </button>
            {generatedResultUrl && (
              <button
                onClick={handleApplyToDocument}
                className="flex items-center gap-1.5 px-4.5 py-2 bg-[#5f6f52] hover:bg-[#4d5a42] text-white rounded-xl font-bold transition shadow"
              >
                Apply Diagram & Key to Lesson <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
