import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Sparkles, 
  Atom, 
  Compass, 
  Brain, 
  Globe, 
  GraduationCap, 
  Sigma, 
  Lightbulb, 
  Grid,
  Network,
  Hexagon,
  Activity,
  Check,
  Eye,
  EyeOff,
  Palette,
  X
} from 'lucide-react';

export type GeometricPatternType = 
  | 'sacred-astrolabe'
  | 'curriculum-matrix'
  | 'cosmic-constellations'
  | 'hexagonal-honeycomb'
  | 'sine-wave-harmonics';

export interface PatternOption {
  id: GeometricPatternType;
  name: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

export const PATTERN_OPTIONS: PatternOption[] = [
  {
    id: 'sacred-astrolabe',
    name: 'Sacred Astrolabe',
    subtitle: 'Celestial compass & corner rosettes',
    icon: Compass,
    accentColor: 'from-teal-400 to-amber-400'
  },
  {
    id: 'curriculum-matrix',
    name: 'Curriculum Blueprint',
    subtitle: 'CBC matrix & architectural grid',
    icon: Grid,
    accentColor: 'from-emerald-400 to-cyan-400'
  },
  {
    id: 'cosmic-constellations',
    name: 'Quantum Constellations',
    subtitle: 'Interconnected knowledge graph',
    icon: Network,
    accentColor: 'from-cyan-400 to-indigo-400'
  },
  {
    id: 'hexagonal-honeycomb',
    name: 'STEM Molecular Lattice',
    subtitle: 'Hexagonal tessellations & valence bonds',
    icon: Hexagon,
    accentColor: 'from-amber-400 to-emerald-400'
  },
  {
    id: 'sine-wave-harmonics',
    name: 'Harmonic Oscillations',
    subtitle: 'Sine waves & frequency spectra',
    icon: Activity,
    accentColor: 'from-rose-400 to-teal-400'
  }
];

interface FloatingNode {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  top: string;
  left: string;
  delay: number;
  duration: number;
  color: string;
}

const FLOATING_NODES: FloatingNode[] = [
  { id: '1', icon: Atom, label: 'STEM & Physics', top: '10%', left: '7%', delay: 0, duration: 7, color: 'from-cyan-400/30 via-teal-500/40 to-emerald-600/50 text-cyan-100 border-cyan-400/60 shadow-cyan-500/20' },
  { id: '2', icon: Brain, label: 'Cognitive Pedagogy', top: '14%', left: '81%', delay: 1.2, duration: 8.5, color: 'from-amber-400/30 via-orange-500/40 to-emerald-600/50 text-amber-100 border-amber-400/60 shadow-amber-500/20' },
  { id: '3', icon: BookOpen, label: 'Curriculum Standards', top: '78%', left: '8%', delay: 0.6, duration: 6.8, color: 'from-emerald-400/30 via-teal-600/40 to-cyan-600/50 text-emerald-100 border-emerald-400/60 shadow-emerald-500/20' },
  { id: '4', icon: Compass, label: 'Kenyan CBC Matrix', top: '84%', left: '78%', delay: 2.1, duration: 9, color: 'from-indigo-400/30 via-teal-500/40 to-emerald-600/50 text-indigo-100 border-indigo-400/60 shadow-indigo-500/20' },
  { id: '5', icon: Sigma, label: 'Calculus & Logic', top: '42%', left: '4%', delay: 1.8, duration: 7.5, color: 'from-yellow-400/30 via-amber-500/40 to-teal-600/50 text-yellow-100 border-yellow-400/60 shadow-yellow-500/20' },
  { id: '6', icon: Globe, label: 'Global Knowledge', top: '50%', left: '89%', delay: 2.5, duration: 8.2, color: 'from-teal-400/30 via-emerald-600/40 to-cyan-600/50 text-teal-100 border-teal-400/60 shadow-teal-500/20' },
  { id: '7', icon: Lightbulb, label: 'Creative Design', top: '6%', left: '58%', delay: 0.9, duration: 7.8, color: 'from-amber-300/30 via-orange-500/40 to-amber-600/50 text-amber-100 border-amber-300/60 shadow-amber-500/20' },
  { id: '8', icon: GraduationCap, label: 'Form 1-4 Mastery', top: '90%', left: '40%', delay: 1.5, duration: 8.8, color: 'from-emerald-400/30 via-cyan-500/40 to-teal-600/50 text-emerald-100 border-emerald-400/60 shadow-emerald-500/20' }
];

const MATH_SYMBOLS = [
  { symbol: '∫ f(x)dx = F(x) + C', top: '24%', left: '12%', delay: 0.2 },
  { symbol: 'E = mc²', top: '72%', left: '86%', delay: 1.1 },
  { symbol: '∑ (x_i - μ)²', top: '12%', left: '70%', delay: 1.7 },
  { symbol: '∇ × B = μ₀ J', top: '86%', left: '20%', delay: 2.3 },
  { symbol: 'a² + b² = c²', top: '44%', left: '82%', delay: 0.8 },
  { symbol: 'pH = -log[H⁺]', top: '64%', left: '5%', delay: 2.8 },
  { symbol: 'PV = nRT', top: '30%', left: '86%', delay: 1.4 },
];

interface AuthBackgroundPatternProps {
  currentPattern?: GeometricPatternType;
  onPatternChange?: (pattern: GeometricPatternType) => void;
  showFloatingBadges?: boolean;
  onToggleBadges?: () => void;
}

export const AuthBackgroundPattern: React.FC<AuthBackgroundPatternProps> = ({
  currentPattern = 'sacred-astrolabe',
  onPatternChange,
  showFloatingBadges = true,
  onToggleBadges
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  useEffect(() => {
    let rafId: number | null = null;
    let lastX = 0;
    let lastY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const targetX = (e.clientX / innerWidth - 0.5) * 30;
      const targetY = (e.clientY / innerHeight - 0.5) * 30;

      if (Math.abs(targetX - lastX) < 0.8 && Math.abs(targetY - lastY) < 0.8) return;

      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          lastX = targetX;
          lastY = targetY;
          setMousePos({ x: targetX, y: targetY });
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* Outer Ambient Radial Glow Orbs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.25, 1],
          opacity: [0.35, 0.6, 0.35],
          x: [mousePos.x * 0.8, mousePos.x * 0.8 + 25, mousePos.x * 0.8]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[-15%] left-[-15%] w-[700px] h-[700px] bg-gradient-to-br from-teal-500/40 via-emerald-500/30 to-transparent blur-[140px] rounded-full pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          scale: [1.1, 0.9, 1.1],
          opacity: [0.3, 0.55, 0.3],
          y: [mousePos.y * 0.8, mousePos.y * 0.8 - 30, mousePos.y * 0.8]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-[-15%] right-[-15%] w-[750px] h-[750px] bg-gradient-to-tl from-amber-500/35 via-teal-500/25 to-transparent blur-[150px] rounded-full pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          scale: [0.9, 1.2, 0.9],
          opacity: [0.25, 0.5, 0.25],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-[30%] right-[15%] w-[550px] h-[550px] bg-gradient-to-tr from-cyan-500/30 via-emerald-400/20 to-transparent blur-[130px] rounded-full pointer-events-none" 
      />

      {/* SVG Geometric Lattice & Outer Perimeter Pattern Layer */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentPattern}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 0.95, scale: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{
            x: mousePos.x * 0.35,
            y: mousePos.y * 0.35,
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* Continuous Infinite Subtle Pan, Scale & Gentle Floating Drift Layer */}
          <motion.div
            animate={{
              scale: [1, 1.025, 0.985, 1.018, 1],
              rotate: [0, 0.75, -0.75, 0.4, 0],
              x: [0, 16, -12, 8, 0],
              y: [0, -14, 10, -6, 0],
            }}
            transition={{
              duration: 26,
              repeat: Infinity,
              repeatType: 'loop',
              ease: 'easeInOut',
            }}
            className="w-full h-full flex items-center justify-center"
          >
            <svg 
              className="w-full h-full min-w-[1400px] min-h-[1000px] drop-shadow-[0_0_12px_rgba(45,212,191,0.25)]" 
              viewBox="0 0 1400 1000" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
            <defs>
              {/* Vibrant High-Contrast Gradients */}
              <linearGradient id="gold-teal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity="1" />
                <stop offset="50%" stopColor="#34d399" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
              </linearGradient>

              <linearGradient id="cyan-indigo" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="1" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.85" />
              </linearGradient>

              <linearGradient id="rose-teal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="1" />
                <stop offset="50%" stopColor="#2dd4bf" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
              </linearGradient>

              {/* Pattern Definitions with High-Contrast Grid Strokes */}
              {/* 1. Astrolabe Grid Pattern */}
              <pattern id="astrolabe-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1.2" />
                <circle cx="0" cy="0" r="2.5" fill="#2dd4bf" />
                <circle cx="60" cy="0" r="2.5" fill="#fbbf24" />
              </pattern>

              {/* 2. Curriculum Matrix Pattern */}
              <pattern id="blueprint-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(52, 211, 153, 0.3)" strokeWidth="1.2" />
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(45, 212, 191, 0.45)" strokeWidth="1.6" />
                <circle cx="0" cy="0" r="2.5" fill="#34d399" />
              </pattern>

              {/* 3. Cosmic Constellation Pattern */}
              <pattern id="dot-field" width="50" height="50" patternUnits="userSpaceOnUse">
                <circle cx="25" cy="25" r="2.2" fill="rgba(255, 255, 255, 0.45)" />
                <circle cx="0" cy="0" r="1.8" fill="#38bdf8" />
              </pattern>

              {/* 4. Hexagonal Honeycomb Pattern */}
              <pattern id="hex-grid" width="60" height="103.92" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 60 17.32 L 60 51.96 L 30 69.28 L 0 51.96 L 0 17.32 Z" fill="none" stroke="rgba(251, 191, 36, 0.35)" strokeWidth="1.4" />
                <path d="M 30 69.28 L 60 86.6 L 60 121.24 L 30 138.56 L 0 121.24 L 0 86.6 Z" fill="none" stroke="rgba(45, 212, 191, 0.35)" strokeWidth="1.4" />
                <circle cx="30" cy="0" r="2.5" fill="#f59e0b" />
                <circle cx="60" cy="17.32" r="2.5" fill="#2dd4bf" />
              </pattern>

              {/* 5. Wave Grid Pattern */}
              <pattern id="wave-grid" width="80" height="40" patternUnits="userSpaceOnUse">
                <path d="M 0 20 Q 20 0, 40 20 T 80 20" fill="none" stroke="rgba(244, 63, 94, 0.35)" strokeWidth="1.6" />
                <circle cx="40" cy="20" r="2" fill="#2dd4bf" />
              </pattern>

              {/* Decorative Frieze Edge Border Pattern */}
              <pattern id="frieze-pattern" width="40" height="20" patternUnits="userSpaceOnUse">
                <path d="M 0 10 L 10 0 L 20 10 L 30 0 L 40 10 L 30 20 L 20 10 L 10 20 Z" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
              </pattern>
            </defs>

            {/* Pattern Rendering Based on Selected Style */}
            {currentPattern === 'sacred-astrolabe' && (
              <g>
                <rect width="100%" height="100%" fill="url(#astrolabe-grid)" />
                
                {/* Central Concentric Sacred Astrolabe Structure */}
                <g transform="translate(700, 500)" stroke="url(#gold-teal)">
                  <circle r="460" strokeWidth="1.5" strokeDasharray="6 8" opacity="0.8" />
                  <circle r="380" strokeWidth="1.8" strokeDasharray="14 6" opacity="0.85" />
                  <circle r="300" strokeWidth="2" opacity="0.9" />
                  <circle r="210" strokeWidth="1.8" strokeDasharray="4 6" opacity="0.95" />
                  <circle r="130" strokeWidth="2.2" opacity="1" />
                  <polygon points="0,-300 259,-150 259,150 0,300 -259,150 -259,-150" strokeWidth="1.8" opacity="0.75" fill="none" />
                  <polygon points="0,-210 181,-105 181,105 0,210 -181,105 -181,-105" strokeWidth="1.8" opacity="0.85" fill="none" />
                  <line x1="-550" y1="0" x2="550" y2="0" strokeWidth="1.5" strokeDasharray="8 8" opacity="0.7" />
                  <line x1="0" y1="-480" x2="0" y2="480" strokeWidth="1.5" strokeDasharray="8 8" opacity="0.7" />
                </g>

                {/* Outer Perimeter Dark Region Mandalas & Corner Rosettes */}
                {/* Top-Left Rosette */}
                <g transform="translate(160, 160)" stroke="url(#gold-teal)" strokeWidth="2" fill="none">
                  <circle r="100" strokeDasharray="8 6" opacity="0.85" />
                  <circle r="70" opacity="0.9" />
                  <circle r="35" opacity="1" />
                  <polygon points="0,-70 49,-49 70,0 49,49 0,70 -49,49 -70,0 -49,-49" opacity="0.8" />
                  <circle cx="0" cy="0" r="6" fill="#2dd4bf" />
                </g>
                {/* Top-Right Rosette */}
                <g transform="translate(1240, 160)" stroke="url(#gold-teal)" strokeWidth="2" fill="none">
                  <circle r="100" strokeDasharray="8 6" opacity="0.85" />
                  <circle r="70" opacity="0.9" />
                  <circle r="35" opacity="1" />
                  <polygon points="0,-70 49,-49 70,0 49,49 0,70 -49,49 -70,0 -49,-49" opacity="0.8" />
                  <circle cx="0" cy="0" r="6" fill="#f59e0b" />
                </g>
                {/* Bottom-Left Rosette */}
                <g transform="translate(160, 840)" stroke="url(#gold-teal)" strokeWidth="2" fill="none">
                  <circle r="100" strokeDasharray="8 6" opacity="0.85" />
                  <circle r="70" opacity="0.9" />
                  <circle r="35" opacity="1" />
                  <polygon points="0,-70 49,-49 70,0 49,49 0,70 -49,49 -70,0 -49,-49" opacity="0.8" />
                  <circle cx="0" cy="0" r="6" fill="#34d399" />
                </g>
                {/* Bottom-Right Rosette */}
                <g transform="translate(1240, 840)" stroke="url(#gold-teal)" strokeWidth="2" fill="none">
                  <circle r="100" strokeDasharray="8 6" opacity="0.85" />
                  <circle r="70" opacity="0.9" />
                  <circle r="35" opacity="1" />
                  <polygon points="0,-70 49,-49 70,0 49,49 0,70 -49,49 -70,0 -49,-49" opacity="0.8" />
                  <circle cx="0" cy="0" r="6" fill="#38bdf8" />
                </g>
              </g>
            )}

            {currentPattern === 'curriculum-matrix' && (
              <g>
                <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
                <g stroke="url(#gold-teal)" strokeWidth="2" fill="none">
                  {/* Outer Left & Right Perimeter Architectural Cube Wireframes */}
                  <g transform="translate(180, 220)">
                    <path d="M 0 -70 L 60 -35 L 60 35 L 0 70 L -60 35 L -60 -35 Z" strokeWidth="2.2" />
                    <line x1="0" y1="-70" x2="0" y2="70" strokeWidth="1.5" />
                    <line x1="0" y1="0" x2="60" y2="-35" strokeWidth="1.5" />
                    <line x1="0" y1="0" x2="-60" y2="-35" strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="6" fill="#34d399" />
                  </g>
                  <g transform="translate(180, 780)">
                    <path d="M 0 -70 L 60 -35 L 60 35 L 0 70 L -60 35 L -60 -35 Z" strokeWidth="2.2" />
                    <line x1="0" y1="-70" x2="0" y2="70" strokeWidth="1.5" />
                    <line x1="0" y1="0" x2="60" y2="-35" strokeWidth="1.5" />
                    <line x1="0" y1="0" x2="-60" y2="-35" strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="6" fill="#2dd4bf" />
                  </g>
                  <g transform="translate(1220, 220)">
                    <path d="M 0 -70 L 60 -35 L 60 35 L 0 70 L -60 35 L -60 -35 Z" strokeWidth="2.2" />
                    <line x1="0" y1="-70" x2="0" y2="70" strokeWidth="1.5" />
                    <line x1="0" y1="0" x2="60" y2="-35" strokeWidth="1.5" />
                    <line x1="0" y1="0" x2="-60" y2="-35" strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="6" fill="#fbbf24" />
                  </g>
                  <g transform="translate(1220, 780)">
                    <path d="M 0 -70 L 60 -35 L 60 35 L 0 70 L -60 35 L -60 -35 Z" strokeWidth="2.2" />
                    <line x1="0" y1="-70" x2="0" y2="70" strokeWidth="1.5" />
                    <line x1="0" y1="0" x2="60" y2="-35" strokeWidth="1.5" />
                    <line x1="0" y1="0" x2="-60" y2="-35" strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="6" fill="#38bdf8" />
                  </g>

                  {/* CBC Competency Target Crosshairs in Dark Margins */}
                  <g transform="translate(700, 500)">
                    <circle r="340" strokeWidth="1.5" strokeDasharray="8 8" opacity="0.8" />
                    <circle r="220" strokeWidth="2" opacity="0.9" />
                    <circle r="80" strokeWidth="2.5" opacity="1" />
                    <line x1="-500" y1="0" x2="500" y2="0" strokeDasharray="6 6" strokeWidth="1.5" />
                    <line x1="0" y1="-450" x2="0" y2="450" strokeDasharray="6 6" strokeWidth="1.5" />
                    <rect x="-150" y="-150" width="300" height="300" strokeWidth="1.8" strokeDasharray="8 8" />
                  </g>
                </g>
              </g>
            )}

            {currentPattern === 'cosmic-constellations' && (
              <g>
                <rect width="100%" height="100%" fill="url(#dot-field)" />
                <g stroke="url(#cyan-indigo)" strokeWidth="2">
                  {/* Spanning Outer Quantum Network Graphs in Outer Dark Areas */}
                  <path d="M 80 120 L 280 220 L 450 100 L 700 240 L 950 100 L 1150 220 L 1320 120" strokeWidth="2.5" />
                  <path d="M 80 880 L 280 780 L 450 900 L 700 760 L 950 900 L 1150 780 L 1320 880" strokeWidth="2.5" />
                  <path d="M 280 220 L 280 780 M 700 240 L 700 760 M 1150 220 L 1150 780" strokeDasharray="6 6" strokeWidth="1.5" />
                  
                  {/* Glowing Edge Vertex Nodes */}
                  {[
                    { x: 80, y: 120, r: 8, color: '#38bdf8' },
                    { x: 280, y: 220, r: 10, color: '#2dd4bf' },
                    { x: 450, y: 100, r: 7, color: '#fbbf24' },
                    { x: 700, y: 240, r: 12, color: '#818cf8' },
                    { x: 950, y: 100, r: 9, color: '#34d399' },
                    { x: 1150, y: 220, r: 10, color: '#38bdf8' },
                    { x: 1320, y: 120, r: 8, color: '#f59e0b' },
                    { x: 80, y: 880, r: 8, color: '#2dd4bf' },
                    { x: 280, y: 780, r: 10, color: '#f59e0b' },
                    { x: 450, y: 900, r: 7, color: '#818cf8' },
                    { x: 700, y: 760, r: 12, color: '#38bdf8' },
                    { x: 950, y: 900, r: 9, color: '#2dd4bf' },
                    { x: 1150, y: 780, r: 10, color: '#818cf8' },
                    { x: 1320, y: 880, r: 8, color: '#34d399' }
                  ].map((node, i) => (
                    <g key={i}>
                      <circle cx={node.x} cy={node.y} r={node.r * 2.5} fill={node.color} opacity="0.35" />
                      <circle cx={node.x} cy={node.y} r={node.r} fill={node.color} />
                    </g>
                  ))}
                </g>
              </g>
            )}

            {currentPattern === 'hexagonal-honeycomb' && (
              <g>
                <rect width="100%" height="100%" fill="url(#hex-grid)" />
                <g stroke="url(#gold-teal)" strokeWidth="2" fill="none">
                  {/* Central Molecular Core */}
                  <g transform="translate(700, 500)">
                    <polygon points="0,-200 173,-100 173,100 0,200 -173,100 -173,-100" strokeWidth="2.8" />
                    <circle r="140" strokeWidth="1.8" strokeDasharray="8 8" />
                    <polygon points="0,-100 86,-50 86,50 0,100 -86,50 -86,-50" strokeWidth="2" />
                  </g>

                  {/* Outer Perimeter STEM Molecular Structures in Dark Region */}
                  <g transform="translate(180, 300)">
                    <polygon points="0,-80 69,-40 69,40 0,80 -69,40 -69,-40" strokeWidth="2.2" />
                    <circle cx="0" cy="-80" r="10" fill="#f59e0b" />
                    <circle cx="69" cy="40" r="10" fill="#2dd4bf" />
                    <circle cx="-69" cy="40" r="10" fill="#34d399" />
                  </g>
                  <g transform="translate(1220, 300)">
                    <polygon points="0,-80 69,-40 69,40 0,80 -69,40 -69,-40" strokeWidth="2.2" />
                    <circle cx="0" cy="-80" r="10" fill="#38bdf8" />
                    <circle cx="69" cy="40" r="10" fill="#fbbf24" />
                    <circle cx="-69" cy="40" r="10" fill="#2dd4bf" />
                  </g>
                  <g transform="translate(180, 700)">
                    <polygon points="0,-80 69,-40 69,40 0,80 -69,40 -69,-40" strokeWidth="2.2" />
                    <circle cx="0" cy="80" r="10" fill="#2dd4bf" />
                    <circle cx="69" cy="-40" r="10" fill="#34d399" />
                    <circle cx="-69" cy="-40" r="10" fill="#f59e0b" />
                  </g>
                  <g transform="translate(1220, 700)">
                    <polygon points="0,-80 69,-40 69,40 0,80 -69,40 -69,-40" strokeWidth="2.2" />
                    <circle cx="0" cy="80" r="10" fill="#fbbf24" />
                    <circle cx="69" cy="-40" r="10" fill="#38bdf8" />
                    <circle cx="-69" cy="-40" r="10" fill="#2dd4bf" />
                  </g>
                </g>
              </g>
            )}

            {currentPattern === 'sine-wave-harmonics' && (
              <g>
                <rect width="100%" height="100%" fill="url(#wave-grid)" />
                <g stroke="url(#rose-teal)" fill="none">
                  {/* Layered Smooth Mathematical Oscillating Waves Spanning Outer Dark Wings */}
                  <path d="M 0 220 Q 350 40, 700 220 T 1400 220" strokeWidth="3.5" />
                  <path d="M 0 780 Q 350 960, 700 780 T 1400 780" strokeWidth="3.5" />
                  <path d="M 0 320 Q 350 140, 700 320 T 1400 320" strokeWidth="2.2" strokeDasharray="10 8" />
                  <path d="M 0 680 Q 350 860, 700 680 T 1400 680" strokeWidth="2.2" strokeDasharray="10 8" />
                  <path d="M 0 500 Q 350 300, 700 500 T 1400 500" strokeWidth="1.8" strokeDasharray="6 6" />

                  {/* Frequency Spectrum Audio Bars in Top & Bottom Outer Regions */}
                  {[100, 200, 300, 400, 500, 600, 800, 900, 1000, 1100, 1200, 1300].map((x, idx) => (
                    <g key={x}>
                      <line x1={x} y1="60" x2={x} y2={60 + ((idx % 5) + 1) * 22} stroke="#2dd4bf" strokeWidth="3.5" opacity="0.9" />
                      <line x1={x} y1="940" x2={x} y2={940 - ((idx % 5) + 1) * 22} stroke="#fbbf24" strokeWidth="3.5" opacity="0.9" />
                    </g>
                  ))}
                </g>
              </g>
            )}

            {/* High-Contrast Outer Dark Region Frame & Corner Architectural Brackets */}
            <g stroke="url(#gold-teal)" strokeWidth="2.5" fill="none">
              {/* Outer Screen Border Frame Line */}
              <rect x="25" y="25" width="1350" height="950" strokeWidth="1.5" strokeDasharray="14 14" opacity="0.75" />
              
              {/* Top-Left Corner Bracket */}
              <path d="M 25 110 L 25 25 L 110 25" strokeWidth="3" />
              <circle cx="25" cy="25" r="5" fill="#2dd4bf" />
              <path d="M 40 65 L 65 40" strokeWidth="1.8" />

              {/* Top-Right Corner Bracket */}
              <path d="M 1375 110 L 1375 25 L 1290 25" strokeWidth="3" />
              <circle cx="1375" cy="25" r="5" fill="#f59e0b" />
              <path d="M 1360 65 L 1335 40" strokeWidth="1.8" />

              {/* Bottom-Left Corner Bracket */}
              <path d="M 25 890 L 25 975 L 110 975" strokeWidth="3" />
              <circle cx="25" cy="975" r="5" fill="#34d399" />
              <path d="M 40 935 L 65 960" strokeWidth="1.8" />

              {/* Bottom-Right Corner Bracket */}
              <path d="M 1375 890 L 1375 975 L 1290 975" strokeWidth="3" />
              <circle cx="1375" cy="975" r="5" fill="#38bdf8" />
              <path d="M 1360 935 L 1335 960" strokeWidth="1.8" />
            </g>

            {/* Perimeter Frieze Decorative Border Pattern along Outer Dark Edges */}
            <rect x="120" y="22" width="1160" height="18" fill="url(#frieze-pattern)" />
            <rect x="120" y="960" width="1160" height="18" fill="url(#frieze-pattern)" />
          </svg>
        </motion.div>
      </motion.div>
    </AnimatePresence>

      {/* Outer Telemetry Tech Scale Markings in Outer Dark Margins */}
      <div className="absolute top-3.5 left-1/2 -translate-x-1/2 pointer-events-none hidden sm:flex items-center gap-6 text-[11px] font-mono tracking-widest text-teal-200/90 font-bold uppercase drop-shadow-md">
        <span>• KENYAN CURRICULUM BLUEPRINT •</span>
        <span className="hidden md:inline">CBC FORM 1-4 MATRIX</span>
        <span>• NAIROBI 36.8219° E, 1.2921° S •</span>
      </div>

      <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 pointer-events-none hidden sm:flex items-center gap-6 text-[11px] font-mono tracking-widest text-amber-200/90 font-bold uppercase drop-shadow-md">
        <span>• EDUNEXUS QUANTUM PEDAGOGY •</span>
        <span className="hidden md:inline">SYSTEM STATUS: OPTIMAL</span>
        <span>• SECURE AUTHENTICATION MATRIX •</span>
      </div>

      {/* Floating Mathematical & Scientific Formulas in Dark Regions */}
      {showFloatingBadges && (
        <div className="absolute inset-0 pointer-events-none hidden md:block">
          {MATH_SYMBOLS.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: [0.6, 1, 0.6],
                y: [0, -18, 0],
                x: [mousePos.x * (0.1 + (idx % 3) * 0.05), mousePos.x * (0.1 + (idx % 3) * 0.05) + (idx % 2 === 0 ? 10 : -10), mousePos.x * (0.1 + (idx % 3) * 0.05)]
              }}
              transition={{
                duration: 6 + (idx % 4),
                repeat: Infinity,
                ease: 'easeInOut',
                delay: item.delay
              }}
              style={{ top: item.top, left: item.left }}
              className="absolute font-mono text-xs font-extrabold text-teal-100 tracking-wider bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-teal-400/60 shadow-xl shadow-black/50"
            >
              {item.symbol}
            </motion.div>
          ))}
        </div>
      )}

      {/* Floating Glassmorphic Knowledge Node Badges in Outer Dark Region */}
      {showFloatingBadges && (
        <div className="absolute inset-0 pointer-events-none hidden lg:block">
          {FLOATING_NODES.map((node) => {
            const IconComp = node.icon;
            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  y: [0, -20, 0],
                  x: [
                    mousePos.x * 0.45, 
                    mousePos.x * 0.45 + (Number(node.id) % 2 === 0 ? 14 : -14), 
                    mousePos.x * 0.45
                  ]
                }}
                transition={{
                  y: { duration: node.duration, repeat: Infinity, ease: 'easeInOut', delay: node.delay },
                  x: { duration: node.duration * 1.2, repeat: Infinity, ease: 'easeInOut', delay: node.delay },
                  opacity: { duration: 1, delay: node.delay }
                }}
                style={{ top: node.top, left: node.left }}
                className="absolute z-0"
              >
                <div className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r ${node.color} backdrop-blur-md border shadow-xl shadow-black/60 transform hover:scale-105 transition-transform duration-300`}>
                  <div className="p-1.5 rounded-xl bg-white/20 backdrop-blur-sm shadow-xs">
                    <IconComp className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-extrabold tracking-wide whitespace-nowrap drop-shadow-md text-white">
                    {node.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Ambient Micro Particle Stars / Sparkles Layer */}
      <div className="absolute inset-0 pointer-events-none opacity-80">
        {[...Array(32)].map((_, i) => {
          const top = `${(i * 31) % 94}%`;
          const left = `${(i * 47) % 94}%`;
          const size = i % 3 === 0 ? 'w-2.5 h-2.5' : 'w-2 h-2';
          const bg = i % 2 === 0 ? 'bg-teal-300' : 'bg-amber-300';
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0.3 }}
              animate={{ 
                opacity: [0.25, 1, 0.25],
                scale: [0.8, 1.6, 0.8]
              }}
              transition={{
                duration: 2.5 + (i % 4),
                repeat: Infinity,
                delay: (i * 0.25) % 3,
                ease: 'easeInOut'
              }}
              style={{ top, left }}
              className={`absolute rounded-full ${size} ${bg} shadow-[0_0_12px_rgba(255,255,255,1)]`}
            />
          );
        })}
      </div>

      {/* Interactive Pattern Customizer Floating Pill (Top-Right) */}
      <div className="absolute top-4 right-4 z-50 pointer-events-auto">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSelectorOpen(!isSelectorOpen)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/95 hover:bg-slate-900 backdrop-blur-xl border border-teal-400 text-teal-200 hover:text-white text-xs font-bold shadow-2xl transition-all cursor-pointer transform hover:scale-105 active:scale-95 group"
            title="Customise SVG Geometric Pattern Background"
          >
            <Palette className="w-4 h-4 text-teal-400 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Background Theme</span>
            <span className="px-2 py-0.5 rounded-md bg-teal-500/30 text-teal-200 text-[10px] font-extrabold border border-teal-400/60">
              {PATTERN_OPTIONS.find(p => p.id === currentPattern)?.name || 'Pattern'}
            </span>
          </button>

          {/* Pattern Picker Popover Dialog */}
          <AnimatePresence>
            {isSelectorOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute right-0 mt-3 w-80 bg-slate-900/95 backdrop-blur-2xl border border-teal-500/50 shadow-2xl rounded-2xl p-4 text-white space-y-3 z-50 animate-fadeIn"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                      Geometric Outer Patterns
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSelectorOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Pattern List Selection */}
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {PATTERN_OPTIONS.map((pattern) => {
                    const PatternIcon = pattern.icon;
                    const isSelected = currentPattern === pattern.id;

                    return (
                      <button
                        key={pattern.id}
                        type="button"
                        onClick={() => {
                          if (onPatternChange) {
                            onPatternChange(pattern.id);
                          }
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-teal-950/90 to-slate-900 border-teal-400 text-white shadow-md'
                            : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl bg-gradient-to-br ${pattern.accentColor} text-slate-950 shadow-xs`}>
                            <PatternIcon className="w-4 h-4 font-bold" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-100">{pattern.name}</p>
                            <p className="text-[10px] text-slate-400 leading-tight">{pattern.subtitle}</p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center font-bold">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Controls Footer */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">Floating Knowledge Nodes:</span>
                  <button
                    type="button"
                    onClick={onToggleBadges}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition cursor-pointer ${
                      showFloatingBadges
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {showFloatingBadges ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{showFloatingBadges ? 'Visible' : 'Hidden'}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AuthBackgroundPattern;
