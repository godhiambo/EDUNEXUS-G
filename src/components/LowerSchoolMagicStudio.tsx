import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Printer,
  Save,
  CheckCircle2,
  HelpCircle,
  Star,
  Award,
  BookOpen,
  Music,
  Smile,
  Zap,
  Flame,
  Globe,
  Compass,
  Layers,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Heart,
  Palette,
  Sun,
  ShieldAlert,
  Info,
  X,
  Move,
  Activity,
  Gauge,
  Wind,
  Sliders,
  CheckSquare,
  Square,
  FolderOutput,
  MousePointerClick,
  Wand2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SavedDocument } from '../types';
import MagicObjectShortVideoPlayer from './MagicObjectShortVideoPlayer';

export type GenerationPromptMode = 'lesson' | 'rhyme' | 'game' | 'story';

export interface PreConfiguredPromptMode {
  id: GenerationPromptMode;
  label: string;
  emoji: string;
  badge: string;
  description: string;
  promptInstruction: string;
}

export const PRECONFIGURED_PROMPT_MODES: PreConfiguredPromptMode[] = [
  {
    id: 'lesson',
    label: 'All-In-One Lesson',
    emoji: '📖',
    badge: 'Full Discovery',
    description: 'Complete story, 3 fun facts, teacher circle-time guide, and interactive quiz.',
    promptInstruction: 'Generate a complete Lower Primary discovery story, fun facts, teacher circle-time guide, phonics vocabulary, and a 3-question quiz.'
  },
  {
    id: 'rhyme',
    label: 'Action Rhyme & Song',
    emoji: '🎵',
    badge: 'Sing-Along Chant',
    description: 'Catchy classroom sing-along song with physical clapping and movement breaks.',
    promptInstruction: 'Focus heavily on creating a vibrant, catchy sing-along poem with physical clapping and movement actions for lower primary children.'
  },
  {
    id: 'game',
    label: 'Picture Quiz & Game',
    emoji: '🎮',
    badge: 'Kid Game',
    description: 'Interactive choice game, brain-teaser riddles, and instant star rewards.',
    promptInstruction: 'Focus heavily on creating an interactive choice game, fun brain-teaser riddles, and a 3-question picture quiz for young learners.'
  },
  {
    id: 'story',
    label: 'Adventure Story',
    emoji: '✨',
    badge: 'Magic Story',
    description: 'Enchanting story starring the animated object, rich with character values.',
    promptInstruction: 'Focus on crafting an enchanting classroom story starring the animated object, filled with imagination and moral lessons.'
  }
];

export interface MagicObjectItem {
  id: string;
  name: string;
  emoji: string;
  category: 'nutrition' | 'animals' | 'science' | 'math' | 'phonics' | 'art';
  gradeLevel: 'Pre-K & Kindergarten' | 'Grade 1-2 (Lower Primary)' | 'Grade 3-4';
  description: string;
  colorGradient: string;
  borderColor: string;
  animationType: 'bounce' | 'pulse' | 'spin' | 'float' | 'wiggle' | 'orbit';
  defaultPromptConfig: {
    subject: string;
    learningOutcome: string;
    topic: string;
  };
}

export const MAGIC_OBJECTS: MagicObjectItem[] = [
  // Nutrition & Body
  {
    id: 'apple',
    name: 'Dancing Apple',
    emoji: '🍎',
    category: 'nutrition',
    gradeLevel: 'Grade 1-2 (Lower Primary)',
    description: 'Learn about healthy eating, red colors, and fruit seeds!',
    colorGradient: 'from-rose-500/20 via-red-500/10 to-amber-500/20',
    borderColor: 'border-red-500/40',
    animationType: 'bounce',
    defaultPromptConfig: {
      subject: 'Health & Nutrition',
      learningOutcome: 'Identify healthy fruits and how seeds grow',
      topic: 'The Red Crunchy Apple'
    }
  },
  {
    id: 'carrot',
    name: 'Crunchy Carrot',
    emoji: '🥕',
    category: 'nutrition',
    gradeLevel: 'Pre-K & Kindergarten',
    description: 'Discover crunchy vegetables that make our eyes shine bright!',
    colorGradient: 'from-orange-500/20 via-amber-500/10 to-yellow-500/20',
    borderColor: 'border-orange-500/40',
    animationType: 'wiggle',
    defaultPromptConfig: {
      subject: 'Health & Nutrition',
      learningOutcome: 'Learn about orange vegetables and eye health',
      topic: 'The Crunchy Bunny Carrot'
    }
  },
  {
    id: 'milk',
    name: 'Super Milk',
    emoji: '🥛',
    category: 'nutrition',
    gradeLevel: 'Grade 1-2 (Lower Primary)',
    description: 'Strong bones and teeth powered by fresh milk and calcium!',
    colorGradient: 'from-cyan-500/20 via-sky-500/10 to-blue-500/20',
    borderColor: 'border-cyan-400/40',
    animationType: 'pulse',
    defaultPromptConfig: {
      subject: 'Health & Movement',
      learningOutcome: 'Understand how calcium helps build strong bones',
      topic: 'Super Calcium Milk'
    }
  },

  // Animals & Nature
  {
    id: 'lion',
    name: 'Roaring Lion',
    emoji: '🦁',
    category: 'animals',
    gradeLevel: 'Grade 1-2 (Lower Primary)',
    description: 'King of the Savanna! Explore fur, roars, and animal families.',
    colorGradient: 'from-amber-500/20 via-yellow-500/10 to-orange-500/20',
    borderColor: 'border-amber-500/40',
    animationType: 'pulse',
    defaultPromptConfig: {
      subject: 'Environmental Activities',
      learningOutcome: 'Identify wild animals, habitats, and sounds',
      topic: 'The Brave King Lion'
    }
  },
  {
    id: 'butterfly',
    name: 'Flutter Butterfly',
    emoji: '🦋',
    category: 'animals',
    gradeLevel: 'Pre-K & Kindergarten',
    description: 'Watch the caterpillar transform into a colorful butterfly!',
    colorGradient: 'from-purple-500/20 via-fuchsia-500/10 to-pink-500/20',
    borderColor: 'border-purple-400/40',
    animationType: 'float',
    defaultPromptConfig: {
      subject: 'Science & Nature',
      learningOutcome: 'Understand the metamorphosis of a caterpillar to butterfly',
      topic: 'The Fluttering Rainbow Butterfly'
    }
  },
  {
    id: 'frog',
    name: 'Hop-Hop Frog',
    emoji: '🐸',
    category: 'animals',
    gradeLevel: 'Grade 1-2 (Lower Primary)',
    description: 'Leap across lily pads! Amphibians, tadpoles, and croaks.',
    colorGradient: 'from-emerald-500/20 via-green-500/10 to-teal-500/20',
    borderColor: 'border-emerald-500/40',
    animationType: 'bounce',
    defaultPromptConfig: {
      subject: 'Science & Nature',
      learningOutcome: 'Explore tadpole growth and frog jumping habits',
      topic: 'The Jumping Pond Frog'
    }
  },

  // Science & Space
  {
    id: 'sun',
    name: 'Smiling Sun',
    emoji: '☀️',
    category: 'science',
    gradeLevel: 'Pre-K & Kindergarten',
    description: 'Warm light, solar energy, daytime, and plant growth!',
    colorGradient: 'from-yellow-400/20 via-amber-400/10 to-orange-400/20',
    borderColor: 'border-yellow-400/50',
    animationType: 'spin',
    defaultPromptConfig: {
      subject: 'Environmental Science',
      learningOutcome: 'Understand day vs night and sunshine benefits',
      topic: 'The Bright Sunshine'
    }
  },
  {
    id: 'volcano',
    name: 'Erupting Volcano',
    emoji: '🌋',
    category: 'science',
    gradeLevel: 'Grade 3-4',
    description: 'Magma, lava, ash, and earth science wonders in action!',
    colorGradient: 'from-red-600/20 via-orange-600/10 to-amber-600/20',
    borderColor: 'border-red-500/50',
    animationType: 'pulse',
    defaultPromptConfig: {
      subject: 'Science & Geography',
      learningOutcome: 'Learn how pressure causes volcanic eruptions',
      topic: 'The Mighty Volcano'
    }
  },
  {
    id: 'seed',
    name: 'Growing Seed',
    emoji: '🌱',
    category: 'science',
    gradeLevel: 'Grade 1-2 (Lower Primary)',
    description: 'Soil, water, and sunlight turn tiny seeds into green trees!',
    colorGradient: 'from-lime-500/20 via-emerald-500/10 to-teal-500/20',
    borderColor: 'border-lime-500/40',
    animationType: 'wiggle',
    defaultPromptConfig: {
      subject: 'Botany & Environment',
      learningOutcome: 'Identify parts of a plant and how seeds sprout',
      topic: 'The Magic Garden Seed'
    }
  },

  // Math & Shapes
  {
    id: 'pizza-fraction',
    name: 'Pizza Fractions',
    emoji: '🍕',
    category: 'math',
    gradeLevel: 'Grade 1-2 (Lower Primary)',
    description: 'Slice halves, quarters, and equal parts with yummy pizza!',
    colorGradient: 'from-amber-500/20 via-red-500/10 to-yellow-500/20',
    borderColor: 'border-amber-400/40',
    animationType: 'pulse',
    defaultPromptConfig: {
      subject: 'Early Mathematics',
      learningOutcome: 'Understand 1/2 and 1/4 fractions using food sharing',
      topic: 'Pizza Fraction Party'
    }
  },
  {
    id: 'clock',
    name: 'Tick-Tock Clock',
    emoji: '⏰',
    category: 'math',
    gradeLevel: 'Grade 1-2 (Lower Primary)',
    description: 'Tell time, hour hands, minute hands, and daily routines!',
    colorGradient: 'from-blue-500/20 via-indigo-500/10 to-cyan-500/20',
    borderColor: 'border-blue-400/40',
    animationType: 'wiggle',
    defaultPromptConfig: {
      subject: 'Mathematics & Time',
      learningOutcome: 'Read analog clock hours and sequence daily activities',
      topic: 'Tick-Tock Daily Clock'
    }
  },
  {
    id: 'shapes',
    name: 'Magic Shapes',
    emoji: '📐',
    category: 'math',
    gradeLevel: 'Pre-K & Kindergarten',
    description: 'Circles, triangles, squares, and stars all around us!',
    colorGradient: 'from-teal-500/20 via-emerald-500/10 to-cyan-500/20',
    borderColor: 'border-teal-400/40',
    animationType: 'float',
    defaultPromptConfig: {
      subject: 'Early Mathematics',
      learningOutcome: 'Identify 2D geometric shapes and count corners',
      topic: 'Shape Detective Hunt'
    }
  },

  // Language & Phonics
  {
    id: 'alphabet-train',
    name: 'Phonics Train',
    emoji: '🚂',
    category: 'phonics',
    gradeLevel: 'Pre-K & Kindergarten',
    description: 'Chug-chug! Letter sounds, blends, and rhyming words on track!',
    colorGradient: 'from-purple-500/20 via-indigo-500/10 to-blue-500/20',
    borderColor: 'border-purple-400/40',
    animationType: 'wiggle',
    defaultPromptConfig: {
      subject: 'Language & Literacy',
      learningOutcome: 'Practice letter sound blending and CVC words',
      topic: 'The Chugging Phonics Train'
    }
  },
  {
    id: 'storybook',
    name: 'Talking Storybook',
    emoji: '📖',
    category: 'phonics',
    gradeLevel: 'Grade 1-2 (Lower Primary)',
    description: 'Open magic pages filled with adventure, vocabulary, and moral lessons!',
    colorGradient: 'from-pink-500/20 via-rose-500/10 to-fuchsia-500/20',
    borderColor: 'border-pink-400/40',
    animationType: 'float',
    defaultPromptConfig: {
      subject: 'English & Storytelling',
      learningOutcome: 'Develop reading comprehension and character analysis',
      topic: 'The Magic Enchanted Book'
    }
  },

  // Art & Music
  {
    id: 'rainbow-palette',
    name: 'Rainbow Palette',
    emoji: '🎨',
    category: 'art',
    gradeLevel: 'Pre-K & Kindergarten',
    description: 'Mix primary colors red, blue, and yellow to create magic secondary colors!',
    colorGradient: 'from-violet-500/20 via-pink-500/10 to-amber-500/20',
    borderColor: 'border-violet-400/40',
    animationType: 'spin',
    defaultPromptConfig: {
      subject: 'Creative Arts & Expression',
      learningOutcome: 'Identify primary colors and mix secondary colors',
      topic: 'The Rainbow Color Painter'
    }
  },
  {
    id: 'piano',
    name: 'Singing Piano',
    emoji: '🎹',
    category: 'art',
    gradeLevel: 'Grade 1-2 (Lower Primary)',
    description: 'High notes, low notes, rhythm, and melody for little musicians!',
    colorGradient: 'from-slate-500/20 via-cyan-500/10 to-teal-500/20',
    borderColor: 'border-slate-400/40',
    animationType: 'bounce',
    defaultPromptConfig: {
      subject: 'Music & Rhythm',
      learningOutcome: 'Distinguish pitch high vs low and clap musical beats',
      topic: 'The Playful Singing Piano'
    }
  },
  {
    id: 'rocket',
    name: 'Space Rocket',
    emoji: '🚀',
    category: 'science',
    gradeLevel: 'Grade 3-4',
    description: '3-2-1 Blast off into space! Planets, gravity, and starlight adventures.',
    colorGradient: 'from-blue-600/20 via-indigo-600/10 to-purple-600/20',
    borderColor: 'border-blue-500/40',
    animationType: 'orbit',
    defaultPromptConfig: {
      subject: 'Space Science',
      learningOutcome: 'Learn about planets, astronaut suits, and rocket propulsion',
      topic: 'The Cosmic Rocket Explorer'
    }
  },
  {
    id: 'dino',
    name: 'Friendly Dino',
    emoji: '🦖',
    category: 'animals',
    gradeLevel: 'Pre-K & Kindergarten',
    description: 'Stomp and roar with prehistoric dinosaurs and fossil discoveries!',
    colorGradient: 'from-emerald-600/20 via-teal-600/10 to-green-600/20',
    borderColor: 'border-emerald-500/40',
    animationType: 'bounce',
    defaultPromptConfig: {
      subject: 'Prehistoric Science',
      learningOutcome: 'Explore plant-eating vs meat-eating dinosaurs and footprints',
      topic: 'The Friendly Stomping T-Rex'
    }
  },
  {
    id: 'wizard-hat',
    name: 'Wizard Hat',
    emoji: '🧙‍♂️',
    category: 'art',
    gradeLevel: 'Grade 1-2 (Lower Primary)',
    description: 'Magic spells, imagination, and creative problem solving tricks!',
    colorGradient: 'from-purple-600/20 via-fuchsia-600/10 to-pink-600/20',
    borderColor: 'border-purple-400/40',
    animationType: 'spin',
    defaultPromptConfig: {
      subject: 'Creative Expression',
      learningOutcome: 'Develop imaginative thinking and story building skills',
      topic: 'The Magic Spell Hat'
    }
  },
  {
    id: 'magnet',
    name: 'Magic Magnet',
    emoji: '🧲',
    category: 'science',
    gradeLevel: 'Grade 1-2 (Lower Primary)',
    description: 'North pole, south pole, magnetic attraction and invisible pull forces!',
    colorGradient: 'from-red-600/20 via-rose-600/10 to-cyan-600/20',
    borderColor: 'border-rose-400/40',
    animationType: 'pulse',
    defaultPromptConfig: {
      subject: 'Physical Science',
      learningOutcome: 'Identify magnetic vs non-magnetic materials around classroom',
      topic: 'The Pulling Magic Magnet'
    }
  },
  {
    id: 'drum',
    name: 'Rhythm Drum',
    emoji: '🥁',
    category: 'art',
    gradeLevel: 'Pre-K & Kindergarten',
    description: 'Boom-chaka-boom! Tap fast and slow beats with traditional drums!',
    colorGradient: 'from-amber-600/20 via-orange-600/10 to-yellow-600/20',
    borderColor: 'border-amber-500/40',
    animationType: 'wiggle',
    defaultPromptConfig: {
      subject: 'Music & Movement',
      learningOutcome: 'Clap rhythmic sequences and explore percussion sounds',
      topic: 'The Beating African Drum'
    }
  }
];

export interface GeneratedMagicContent {
  objectId: string;
  title: string;
  emoji: string;
  gradeLevel: string;
  story: string;
  funFacts: string[];
  rhymePoem: string;
  teacherCircleGuide: {
    hook: string;
    movementBreak: string;
    discussionQuestion: string;
  };
  quizQuestions: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
  wordPower: {
    word: string;
    syllables: string;
    meaning: string;
  }[];
}

interface LowerSchoolMagicStudioProps {
  onSaveToDocuments?: (doc: SavedDocument) => void;
  onNavigateToViewer?: (doc: SavedDocument) => void;
  onOpenVideoStudio?: (prompt?: string) => void;
}

// ANIMATED MAGIC OBJECT EMOJI ICON COMPONENT
function AnimatedMagicObjectIcon({
  obj,
  isSelected,
  isGenerating,
  globalMotionStyle,
  globalMotionSpeed,
  enablePhysicsDrag,
  onClick,
  triggerSparkleBurst
}: {
  obj: MagicObjectItem;
  isSelected: boolean;
  isGenerating: boolean;
  globalMotionStyle: 'preset' | 'bounce' | 'float' | 'spin' | 'wiggle' | 'pulse' | 'orbit' | 'paused';
  globalMotionSpeed: number;
  enablePhysicsDrag: boolean;
  onClick: (e: React.MouseEvent) => void;
  triggerSparkleBurst: (x?: number, y?: number, label?: string) => void;
}) {
  const activeAnimType = globalMotionStyle === 'preset' ? obj.animationType : globalMotionStyle;

  // Keyframes for Framer Motion based on animation style
  let animateProps: any = {};
  let transitionProps: any = {
    duration: 2 / globalMotionSpeed,
    repeat: Infinity,
    ease: 'easeInOut'
  };

  if (activeAnimType === 'paused') {
    animateProps = { y: 0, x: 0, rotate: 0, scale: 1 };
    transitionProps = { duration: 0.3 };
  } else if (isGenerating) {
    // Supercharged AI casting magic state
    animateProps = {
      rotate: [0, 180, 360],
      scale: [1, 1.28, 0.88, 1.2, 1],
      y: [0, -14, 0]
    };
    transitionProps = {
      duration: 1.1 / globalMotionSpeed,
      repeat: Infinity,
      ease: 'linear'
    };
  } else if (activeAnimType === 'bounce') {
    animateProps = {
      y: [0, -22, 0, -8, 0],
      scaleY: [1, 1.18, 0.85, 1.05, 1],
      scaleX: [1, 0.85, 1.12, 0.98, 1]
    };
    transitionProps = {
      duration: 1.4 / globalMotionSpeed,
      repeat: Infinity,
      ease: 'easeInOut'
    };
  } else if (activeAnimType === 'float') {
    animateProps = {
      y: [0, -16, 0],
      x: [0, 8, -8, 0],
      rotate: [-6, 6, -6],
      scale: [1, 1.06, 1]
    };
    transitionProps = {
      duration: 2.8 / globalMotionSpeed,
      repeat: Infinity,
      ease: 'easeInOut'
    };
  } else if (activeAnimType === 'spin') {
    animateProps = {
      rotate: [0, 180, 360],
      scale: [1, 1.08, 1],
      rotateY: [0, 180, 360]
    };
    transitionProps = {
      duration: 3.5 / globalMotionSpeed,
      repeat: Infinity,
      ease: 'linear'
    };
  } else if (activeAnimType === 'wiggle') {
    animateProps = {
      rotate: [0, -18, 18, -14, 14, -8, 8, 0],
      scale: [1, 1.12, 0.92, 1.06, 1]
    };
    transitionProps = {
      duration: 1.5 / globalMotionSpeed,
      repeat: Infinity,
      ease: 'easeInOut'
    };
  } else if (activeAnimType === 'pulse') {
    animateProps = {
      scale: [1, 1.2, 1],
      rotate: [0, 4, -4, 0]
    };
    transitionProps = {
      duration: 1.8 / globalMotionSpeed,
      repeat: Infinity,
      ease: 'easeInOut'
    };
  } else if (activeAnimType === 'orbit') {
    animateProps = {
      y: [0, -12, 0],
      scale: [1, 1.08, 1]
    };
    transitionProps = {
      duration: 2.2 / globalMotionSpeed,
      repeat: Infinity,
      ease: 'easeInOut'
    };
  }

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX || (rect.left + rect.width / 2);
    const clickY = e.clientY || (rect.top + rect.height / 2);
    triggerSparkleBurst(clickX, clickY, `✨ ${obj.name}!`);
    onClick(e);
  };

  return (
    <div className="relative my-3 text-center group cursor-pointer select-none" onClick={handleClick}>
      {/* Background Radial Glow Aura */}
      <div className={`absolute inset-0 m-auto w-24 h-24 rounded-full blur-xl pointer-events-none transition-all duration-500 ${
        isGenerating
          ? 'bg-amber-400/60 scale-130 animate-pulse'
          : isSelected
          ? 'bg-cyan-400/50 scale-120'
          : 'bg-white/10 dark:bg-cyan-500/10 group-hover:bg-cyan-400/40 group-hover:scale-130 group-hover:blur-2xl'
      }`} />

      {/* Hover Sparkle Orbiters */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="absolute -top-3 right-4 text-base animate-bounce">✨</span>
        <span className="absolute -bottom-2 left-4 text-base animate-pulse">🌟</span>
        <span className="absolute top-1/2 -left-4 text-sm animate-spin">💫</span>
        <span className="absolute top-1/2 -right-4 text-sm animate-bounce">💎</span>
      </div>

      {/* Orbiting Stars Animation Overlay */}
      {activeAnimType === 'orbit' && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4 / globalMotionSpeed, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-sm">✨</span>
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-sm">⭐</span>
          <span className="absolute top-1/2 -left-3 -translate-y-1/2 text-sm">🌟</span>
          <span className="absolute top-1/2 -right-3 -translate-y-1/2 text-sm">💫</span>
        </motion.div>
      )}

      {/* Animated Emoji Element */}
      <motion.div
        drag={enablePhysicsDrag}
        dragConstraints={{ left: -35, right: 35, top: -35, bottom: -35 }}
        dragElastic={0.25}
        whileDrag={{ scale: 1.3, zIndex: 40 }}
        whileHover={{
          scale: 1.25,
          rotate: [0, -12, 12, -6, 6, 0],
          y: -10,
          filter: 'drop-shadow(0 15px 25px rgba(56, 189, 248, 0.6))'
        }}
        whileTap={{ scale: 0.88 }}
        animate={animateProps}
        transition={transitionProps}
        className="text-6xl md:text-7xl inline-block drop-shadow-xl relative z-10 cursor-grab active:cursor-grabbing transition-shadow duration-300"
        title={enablePhysicsDrag ? "Drag and fling me around!" : "Click to generate lesson!"}
      >
        {obj.emoji}
      </motion.div>

      {/* Helper Click Label */}
      <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-extrabold mt-1 transition-all opacity-80 group-hover:opacity-100 group-hover:scale-110 group-hover:text-amber-400">
        ✨ Click icon to launch!
      </p>
    </div>
  );
}

export default function LowerSchoolMagicStudio({
  onSaveToDocuments,
  onNavigateToViewer,
  onOpenVideoStudio
}: LowerSchoolMagicStudioProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activePromptMode, setActivePromptMode] = useState<GenerationPromptMode>('lesson');
  const [activeObject, setActiveObject] = useState<MagicObjectItem | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<GeneratedMagicContent | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechPitch, setSpeechPitch] = useState<number>(1.1); // Slightly higher pitch for kid narrator voice
  const [speechRate, setSpeechRate] = useState<number>(0.9); // Slightly slower rate for early learners
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  // Multi-Object Selection & Batch Actions State
  const [objectsList, setObjectsList] = useState<MagicObjectItem[]>(MAGIC_OBJECTS);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
  const [showBatchMoveModal, setShowBatchMoveModal] = useState<boolean>(false);
  const [showBatchMotionModal, setShowBatchMotionModal] = useState<boolean>(false);
  const [isGroupGenerating, setIsGroupGenerating] = useState<boolean>(false);

  // Audio Feedback Customization State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [clickSoundEnabled, setClickSoundEnabled] = useState<boolean>(true);
  const [completionSoundEnabled, setCompletionSoundEnabled] = useState<boolean>(true);
  const [soundPreset, setSoundPreset] = useState<'magic' | 'playful' | 'gentle'>('magic');
  const [showAudioSettings, setShowAudioSettings] = useState<boolean>(false);

  // Musical Spelling & Smooth Phonics State
  const [currentlySpellingWord, setCurrentlySpellingWord] = useState<string | null>(null);
  const [currentlySpellingCharIndex, setCurrentlySpellingCharIndex] = useState<number | null>(null);

  // Magic Object Animation & Motion Control State
  const [globalMotionStyle, setGlobalMotionStyle] = useState<'preset' | 'bounce' | 'float' | 'spin' | 'wiggle' | 'pulse' | 'orbit' | 'paused'>('preset');
  const [globalMotionSpeed, setGlobalMotionSpeed] = useState<number>(1);
  const [enablePhysicsDrag, setEnablePhysicsDrag] = useState<boolean>(true);
  const [showMotionStudio, setShowMotionStudio] = useState<boolean>(false);
  const [sparkleParticles, setSparkleParticles] = useState<Array<{ id: string; startX: number; startY: number; targetX: number; targetY: number; emoji: string; scale: number; rotation: number }>>([]);
  const [sparkleShockwaves, setSparkleShockwaves] = useState<Array<{ id: string; x: number; y: number }>>([]);
  const [floatingTexts, setFloatingTexts] = useState<Array<{ id: string; x: number; y: number; text: string }>>([]);

  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Sparkle Burst Effects Engine (360-Degree Click Explosion)
  const triggerSparkleBurst = (xPos?: number, yPos?: number, label?: string) => {
    let x = xPos;
    let y = yPos;
    if (x === undefined || y === undefined || (x === 0 && y === 0)) {
      if (typeof window !== 'undefined') {
        x = window.innerWidth / 2;
        y = window.innerHeight / 3;
      } else {
        x = 300;
        y = 300;
      }
    }

    const particleEmojis = ['✨', '⭐', '🌟', '💫', '⚡', '🎉', '🌸', '🎈', '💎', '🌈', '🔥'];
    
    // 14 360-degree radial particles
    const newParticles = Array.from({ length: 14 }).map((_, i) => {
      const angle = (i / 14) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const distance = 55 + Math.random() * 85;
      return {
        id: `${Date.now()}-${i}-${Math.random()}`,
        startX: x!,
        startY: y!,
        targetX: Math.cos(angle) * distance,
        targetY: Math.sin(angle) * distance,
        emoji: particleEmojis[Math.floor(Math.random() * particleEmojis.length)],
        scale: 0.8 + Math.random() * 0.8,
        rotation: (Math.random() - 0.5) * 360
      };
    });

    // Expanding shockwave ring
    const newShockwave = {
      id: `wave-${Date.now()}-${Math.random()}`,
      x: x!,
      y: y!
    };

    // Floating praise text badge
    const praiseWords = ['✨ Magic Cast!', '🌟 Abracadabra!', '🎉 Woohoo!', '⚡ Power Up!', '💫 Super Sparkle!', '🌈 Spell Cast!'];
    const newFloatingText = {
      id: `text-${Date.now()}-${Math.random()}`,
      x: x!,
      y: y! - 15,
      text: label || praiseWords[Math.floor(Math.random() * praiseWords.length)]
    };

    setSparkleParticles(prev => [...prev.slice(-18), ...newParticles]);
    setSparkleShockwaves(prev => [...prev.slice(-4), newShockwave]);
    setFloatingTexts(prev => [...prev.slice(-3), newFloatingText]);

    setTimeout(() => {
      setSparkleParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
      setSparkleShockwaves(prev => prev.filter(sw => sw.id !== newShockwave.id));
      setFloatingTexts(prev => prev.filter(ft => ft.id !== newFloatingText.id));
    }, 1100);
  };

  const handlePartyMotionBlast = () => {
    confetti({
      particleCount: 110,
      spread: 90,
      origin: { y: 0.55 }
    });
    playCompletionChime('magic');
    setGlobalMotionStyle('bounce');
    setGlobalMotionSpeed(1.5);
    triggerSparkleBurst(undefined, undefined, '🎉 Party Blast!');
  };

  // Filter objects based on active category
  const filteredObjects = selectedCategory === 'all'
    ? objectsList
    : objectsList.filter(obj => obj.category === selectedCategory);

  // Multi-Object Selection & Batch Action Handlers
  const toggleObjectSelection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedBatchIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
    playClickChime();
  };

  const selectAllVisible = () => {
    const visibleIds = filteredObjects.map(o => o.id);
    const newSet = new Set([...selectedBatchIds, ...visibleIds]);
    setSelectedBatchIds(Array.from(newSet));
    playClickChime();
  };

  const deselectAllBatch = () => {
    setSelectedBatchIds([]);
    playClickChime();
  };

  const handleBatchMoveCategory = (targetCat: string) => {
    if (selectedBatchIds.length === 0) return;
    setObjectsList(prev =>
      prev.map(obj =>
        selectedBatchIds.includes(obj.id) ? { ...obj, category: targetCat as any } : obj
      )
    );
    const catLabels: Record<string, string> = {
      nutrition: 'Healthy Foods',
      animals: 'Animals & Safari',
      science: 'Space & Nature',
      math: 'Math & Shapes',
      phonics: 'Phonics & Books',
      art: 'Art & Music'
    };
    setSavedSuccessMsg(`📁 Batch moved ${selectedBatchIds.length} object(s) to ${catLabels[targetCat] || targetCat}!`);
    setShowBatchMoveModal(false);
    playCompletionChime();
    triggerMagicConfetti();
  };

  const handleBatchApplyMotion = (motionType: 'bounce' | 'pulse' | 'spin' | 'float' | 'wiggle' | 'orbit') => {
    if (selectedBatchIds.length === 0) return;
    setObjectsList(prev =>
      prev.map(obj =>
        selectedBatchIds.includes(obj.id) ? { ...obj, animationType: motionType } : obj
      )
    );
    setSavedSuccessMsg(`✨ Applied '${motionType.toUpperCase()}' motion to ${selectedBatchIds.length} object(s)!`);
    setShowBatchMotionModal(false);
    playCompletionChime();
    triggerMagicConfetti();
  };

  // Synthesized Sound Effects Engine
  const playClickChime = (presetOverride?: 'magic' | 'playful' | 'gentle') => {
    if (!soundEnabled || !clickSoundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const currentPreset = presetOverride || soundPreset;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (currentPreset === 'playful') {
        // Pop sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      } else if (currentPreset === 'gentle') {
        // Soft bell note
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      } else {
        // Magic sparkle shimmer
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.12); // E6
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn('Audio click effect unsupported:', e);
    }
  };

  const playCompletionChime = (presetOverride?: 'magic' | 'playful' | 'gentle') => {
    if (!soundEnabled || !completionSoundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const currentPreset = presetOverride || soundPreset;

      let freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      if (currentPreset === 'playful') {
        freqs = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      } else if (currentPreset === 'gentle') {
        freqs = [392.00, 493.88, 587.33, 783.99]; // G4, B4, D5, G5
      }

      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = currentPreset === 'playful' ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.35);
      });
    } catch (e) {
      console.warn('Audio completion chime unsupported:', e);
    }
  };

  const playMagicChime = () => playCompletionChime();

  // Trigger celebration confetti
  const triggerMagicConfetti = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // Fallback if confetti fails
    }
  };

  // Group Generation for Multi-Selected Magic Objects
  const handleGroupGenerate = async (modeOverride?: GenerationPromptMode) => {
    if (selectedBatchIds.length === 0) return;
    const selectedObjs = objectsList.filter(o => selectedBatchIds.includes(o.id));
    const mode = modeOverride || activePromptMode;
    const modeInfo = PRECONFIGURED_PROMPT_MODES.find(m => m.id === mode) || PRECONFIGURED_PROMPT_MODES[0];

    setIsGenerating(true);
    setIsGroupGenerating(true);
    setGeneratedResult(null);
    setSelectedAnswers({});
    setShowExplanation({});
    stopSpeech();

    playClickChime();
    triggerMagicConfetti();

    const combinedNames = selectedObjs.map(o => `${o.emoji} ${o.name}`).join(', ');
    const combinedSubjects = Array.from(new Set(selectedObjs.map(o => o.defaultPromptConfig.subject))).join(' & ');
    const primaryGrade = selectedObjs[0]?.gradeLevel || 'Grade 1-2 (Lower Primary)';

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType: 'lesson-plan',
          curriculum: 'cbc',
          subject: combinedSubjects,
          classLevel: primaryGrade,
          topic: `Group Adventure: ${combinedNames}`,
          subTopic: `Multi-Object Inquiry & Cross-Curricular Discovery`,
          duration: '45 Minutes',
          content: `LOWER_SCHOOL_MAGIC_OBJECT_GROUP_GENERATION:
Selected Objects: ${combinedNames}
Count of Objects: ${selectedObjs.length}
Target Grade Level: ${primaryGrade}
Curriculum Subjects: ${combinedSubjects}
System Mode: ${modeInfo.label} [${modeInfo.badge}]
Prompt Directive: ${modeInfo.promptInstruction}. Synthesize an integrated cross-curricular lesson, group adventure story, rhyming chant, and multi-object quiz that connects all ${selectedObjs.length} selected objects together seamlessly!`,
          explainLikeMasterTeacher: true,
          generateVocabulary: true,
          generateDiagram: true
        })
      });

      if (!response.ok) throw new Error('API Error');

      const data = await response.json();
      const rawContent = data.content || '';

      const firstObj = selectedObjs[0];
      const combinedEmojis = selectedObjs.map(o => o.emoji).join(' ');

      const groupContent: GeneratedMagicContent = {
        objectId: 'group-' + selectedBatchIds.join('-'),
        title: `${combinedEmojis} Group Adventure - ${selectedObjs.length} Magic Objects (${modeInfo.label})`,
        emoji: combinedEmojis,
        gradeLevel: primaryGrade,
        story: extractOrFallbackStory(rawContent, firstObj),
        funFacts: selectedObjs.flatMap(o => [
          `✨ ${o.emoji} ${o.name}: ${o.description}`,
          `🌟 Learning Goal: ${o.defaultPromptConfig.learningOutcome}`
        ]),
        rhymePoem: extractOrFallbackRhyme(rawContent, firstObj),
        teacherCircleGuide: {
          hook: `Gather students in a circle with ${combinedNames}! Ask: "How do these ${selectedObjs.length} magical items connect in our world?"`,
          movementBreak: `Group Physical Challenge: Perform the signature moves of all ${selectedObjs.length} items in a row!`,
          discussionQuestion: `Which object is your favorite and why do they make a great team?`
        },
        quizQuestions: selectedObjs.map((o, idx) => ({
          id: idx + 1,
          question: `Which magic object helps us learn about ${o.defaultPromptConfig.subject.toLowerCase()}?`,
          options: [o.name, 'Magic Wand', 'Mystery Box', 'Flying Cloud'],
          correctIndex: 0,
          explanation: `${o.name} (${o.emoji}) focuses on ${o.defaultPromptConfig.learningOutcome}.`
        })),
        wordPower: selectedObjs.map((o) => ({
          word: o.name.split(' ')[1] || o.name,
          syllables: o.name,
          meaning: o.description
        }))
      };

      setGeneratedResult(groupContent);
      playCompletionChime();
      setSavedSuccessMsg(`✨ Group Lesson generated for ${selectedObjs.length} objects!`);
    } catch (err) {
      console.warn('Group AI generation fallback:', err);
      const combinedEmojis = selectedObjs.map(o => o.emoji).join(' ');
      const fallbackGroup: GeneratedMagicContent = {
        objectId: 'group-' + selectedBatchIds.join('-'),
        title: `${combinedEmojis} Multi-Object Magic Adventure`,
        emoji: combinedEmojis,
        gradeLevel: primaryGrade,
        story: `Once upon a time in the Magic Classroom, ${combinedNames} went on an extraordinary adventure together! They discovered that when they work together, learning is 100 times more fun!`,
        funFacts: selectedObjs.map(o => `${o.emoji} ${o.name}: ${o.description}`),
        rhymePoem: `Clap your hands and count with me,\nOne, two, three, magic as can be!\n${selectedObjs.map(o => o.name).join(' and ')} are here today,\nTo teach, to sparkle, and to play!`,
        teacherCircleGuide: {
          hook: `Show students ${combinedNames} and invite them to name each item!`,
          movementBreak: `Do the group magic dance for 30 seconds!`,
          discussionQuestion: `How do these items help us every day?`
        },
        quizQuestions: selectedObjs.map((o, i) => ({
          id: i + 1,
          question: `What is special about ${o.emoji} ${o.name}?`,
          options: [o.description, 'It flies to Mars', 'It vanishes', 'Nothing'],
          correctIndex: 0,
          explanation: `${o.name} is key to ${o.defaultPromptConfig.learningOutcome}.`
        })),
        wordPower: selectedObjs.map(o => ({
          word: o.name,
          syllables: o.name,
          meaning: o.description
        }))
      };
      setGeneratedResult(fallbackGroup);
      playCompletionChime();
    } finally {
      setIsGenerating(false);
      setIsGroupGenerating(false);
    }
  };

  // Handle direct click on any animated object or pre-configured trigger -> Immediate Zero Prompt AI Generation!
  const handleObjectClick = async (item: MagicObjectItem, modeOverride?: GenerationPromptMode, e?: React.MouseEvent) => {
    const selectedMode = modeOverride || activePromptMode;
    const modeInfo = PRECONFIGURED_PROMPT_MODES.find(m => m.id === selectedMode) || PRECONFIGURED_PROMPT_MODES[0];

    setActiveObject(item);
    setIsGenerating(true);
    setGeneratedResult(null);
    setSelectedAnswers({});
    setShowExplanation({});
    stopSpeech();

    // Trigger click sparkle burst at click location if mouse event present
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX || (rect.left + rect.width / 2);
      const clickY = e.clientY || (rect.top + rect.height / 2);
      triggerSparkleBurst(clickX, clickY, `✨ ${item.name}!`);
    }
    
    // Play subtle tap sound on click
    playClickChime();
    triggerMagicConfetti();

    try {
      // Fetch AI generated magic content from backend with mapped pre-configured system prompt
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType: 'lesson-plan',
          curriculum: 'cbc',
          subject: item.defaultPromptConfig.subject,
          classLevel: item.gradeLevel,
          topic: item.defaultPromptConfig.topic,
          subTopic: item.defaultPromptConfig.learningOutcome,
          duration: '30 Minutes',
          content: `LOWER_SCHOOL_MAGIC_OBJECT_GENERATION:
Object Name: ${item.name} (${item.emoji})
Target Grade Level: ${item.gradeLevel}
Curriculum Subject: ${item.defaultPromptConfig.subject}
Learning Topic: ${item.defaultPromptConfig.topic}
System Generation Mode: ${modeInfo.label} [${modeInfo.badge}]
Object System Prompt Directive: ${modeInfo.promptInstruction}`,
          explainLikeMasterTeacher: true,
          generateVocabulary: true,
          generateDiagram: true
        })
      });

      if (!response.ok) {
        throw new Error('Server response error');
      }

      const data = await response.json();
      const rawContent = data.content || '';

      // Fallback constructed result if markdown format needs fallback extraction
      const magicContent: GeneratedMagicContent = {
        objectId: item.id,
        title: `${item.emoji} ${item.name} - ${modeInfo.label}`,
        emoji: item.emoji,
        gradeLevel: item.gradeLevel,
        story: extractOrFallbackStory(rawContent, item),
        funFacts: extractOrFallbackFacts(rawContent, item),
        rhymePoem: extractOrFallbackRhyme(rawContent, item),
        teacherCircleGuide: {
          hook: `Show students a real or pictured ${item.name.toLowerCase()} and ask: "Who can tell me what color this is and where we can find it?"`,
          movementBreak: `Stretches & Actions: Everyone stand up and imitate the movement of a ${item.name.toLowerCase()} for 30 seconds!`,
          discussionQuestion: `Why is the ${item.name.toLowerCase()} important in our daily lives?`
        },
        quizQuestions: extractOrFallbackQuiz(item),
        wordPower: extractOrFallbackWords(item)
      };

      setGeneratedResult(magicContent);
      // Play celebratory completion chime
      playCompletionChime();
    } catch (err) {
      console.warn('AI API call error, using local magic engine:', err);
      // Instant graceful fallback generation
      setGeneratedResult(generateLocalMagicContent(item, modeInfo));
      playCompletionChime();
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper Fallbacks
  const generateLocalMagicContent = (item: MagicObjectItem, modeInfo: PreConfiguredPromptMode): GeneratedMagicContent => {
    return {
      objectId: item.id,
      title: `${item.emoji} Magic ${item.name} - ${modeInfo.label}`,
      emoji: item.emoji,
      gradeLevel: item.gradeLevel,
      story: `Once upon a time in a bright sunny classroom, a happy ${item.name.toLowerCase()} named Sparky loved helping children learn new things. Whenever boys and girls looked closely at Sparky, they discovered wonderful secrets about science, shapes, and nature! Sparky taught everyone that learning is like playing a fun game with friends!`,
      funFacts: [
        `Fact 1: The ${item.name.toLowerCase()} is super important in our ${item.defaultPromptConfig.subject} lessons!`,
        `Fact 2: You can find or see examples of ${item.name.toLowerCase()} in your home, school garden, or community.`,
        `Fact 3: Learning about the ${item.name.toLowerCase()} builds our vocabulary and observation skills!`
      ],
      rhymePoem: `Bounce and play throughout the day,\nLearning about ${item.name.toLowerCase()} in a happy way!\nListen close and shout out loud,\nMaking our teacher and parents proud!`,
      teacherCircleGuide: {
        hook: `Gather children in a circle. Hold up the ${item.emoji} icon and ask students to make the sound or gesture of a ${item.name.toLowerCase()}.`,
        movementBreak: `Do 5 big star jumps and clap your hands 3 times every time the teacher says "${item.name}"!`,
        discussionQuestion: `Where did you see a ${item.name.toLowerCase()} before? What was it doing?`
      },
      quizQuestions: extractOrFallbackQuiz(item),
      wordPower: extractOrFallbackWords(item)
    };
  };

  const extractOrFallbackStory = (text: string, item: MagicObjectItem) => {
    if (text.includes('Story') || text.includes('STORY')) {
      const match = text.match(/(?:Story|STORY)[:\n]+([\s\S]{100,400})/i);
      if (match && match[1]) return match[1].trim();
    }
    return `Once upon a time in our primary class, we met the magical ${item.name.toLowerCase()} ${item.emoji}. It showed us how ${item.defaultPromptConfig.learningOutcome.toLowerCase()}! Every student cheered because learning with magic objects is so easy and fun!`;
  };

  const extractOrFallbackFacts = (text: string, item: MagicObjectItem) => {
    return [
      `🌟 ${item.name} helps us learn ${item.defaultPromptConfig.subject}!`,
      `🎨 It has bright colors, unique shapes, and interesting textures to explore.`,
      `💡 Working with ${item.name.toLowerCase()} makes our brain smarter and happier everyday!`
    ];
  };

  const extractOrFallbackRhyme = (text: string, item: MagicObjectItem) => {
    return `Clap your hands and stamp your feet,\nLearning with ${item.name.toLowerCase()} is such a treat!\nLook and listen, smile real wide,\nWith magic learning by your side!`;
  };

  const extractOrFallbackQuiz = (item: MagicObjectItem) => {
    return [
      {
        question: `What object did we learn about today?`,
        options: [item.name, 'A Flying Carpet', 'A Monster Truck'],
        correctIndex: 0,
        explanation: `Correct! We learned all about the ${item.name}!`
      },
      {
        question: `Which subject area does this magic object belong to?`,
        options: [item.defaultPromptConfig.subject, 'Deep Space Mechanics', 'Underwater Scuba'],
        correctIndex: 0,
        explanation: `Great job! It belongs to ${item.defaultPromptConfig.subject}.`
      },
      {
        question: `How should we feel when discovering new magic objects in class?`,
        options: ['Excited & Curious! ⭐', 'Sleepy', 'Bored'],
        correctIndex: 0,
        explanation: `Bingo! Learning is always exciting and curious!`
      }
    ];
  };

  const extractOrFallbackWords = (item: MagicObjectItem) => {
    return [
      {
        word: item.name.split(' ')[0] || item.name,
        syllables: '2 Syllables',
        meaning: `A key object in ${item.defaultPromptConfig.subject}.`
      },
      {
        word: 'Discover',
        syllables: 'Dis-cov-er (3 Syllables)',
        meaning: 'To find or learn something new for the first time!'
      }
    ];
  };

  // Text-To-Speech (Audio Narrator for Lower Primary Students)
  const speakText = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech Synthesis is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel(); // Stop current speech

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.pitch = speechPitch;
    utterance.rate = speechRate;

    // Pick a friendly English voice if available
    const voices = window.speechSynthesis.getVoices();
    const friendlyVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Female') || v.name.includes('Samantha')));
    if (friendlyVoice) {
      utterance.voice = friendlyVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setCurrentlySpellingWord(null);
    setCurrentlySpellingCharIndex(null);
  };

  // Accurate, Smooth & Musical Letter-By-Letter Spelling & Phonics Engine
  const playMusicalSpelling = async (wordToSpell: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const cleanWord = wordToSpell.trim().toUpperCase();
    const letters = cleanWord.split('').filter(char => /[A-Z0-9]/.test(char));
    if (letters.length === 0) return;

    setCurrentlySpellingWord(cleanWord);
    setIsSpeaking(true);

    // C-Major Pentatonic harmonic musical pitch frequencies
    const pentatonicNotes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    let audioCtx: AudioContext | null = null;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }

    for (let i = 0; i < letters.length; i++) {
      const char = letters[i];
      setCurrentlySpellingCharIndex(i);

      // Play harmonic musical tone per letter
      if (audioCtx && soundEnabled) {
        try {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const noteFreq = pentatonicNotes[i % pentatonicNotes.length];
          osc.type = 'sine';
          osc.frequency.setValueAtTime(noteFreq, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.38);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.38);
        } catch (e) {
          // ignore
        }
      }

      // Speak letter with melodic pitch shift
      const letterUtterance = new SpeechSynthesisUtterance(char);
      letterUtterance.rate = 0.85;
      letterUtterance.pitch = Math.min(1.5, 1.05 + (i * 0.05));
      const voices = window.speechSynthesis.getVoices();
      const friendlyVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Female') || v.name.includes('Samantha')));
      if (friendlyVoice) letterUtterance.voice = friendlyVoice;

      window.speechSynthesis.speak(letterUtterance);
      await new Promise(resolve => setTimeout(resolve, 450));
    }

    // Finale word chime and full smooth word pronunciation
    setCurrentlySpellingCharIndex(null);

    if (audioCtx && soundEnabled) {
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.3); // C6
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch (e) {
        // ignore
      }
    }

    const wordUtterance = new SpeechSynthesisUtterance(`${cleanWord}!`);
    wordUtterance.rate = speechRate;
    wordUtterance.pitch = speechPitch;
    const voices = window.speechSynthesis.getVoices();
    const friendlyVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Female') || v.name.includes('Samantha')));
    if (friendlyVoice) wordUtterance.voice = friendlyVoice;

    wordUtterance.onend = () => {
      setCurrentlySpellingWord(null);
      setIsSpeaking(false);
    };
    wordUtterance.onerror = () => {
      setCurrentlySpellingWord(null);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(wordUtterance);
  };

  const playSingleLetterSound = (char: string, index: number = 0) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (soundEnabled) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        try {
          const ctx = new AudioCtx();
          const pentatonicNotes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteFreq = pentatonicNotes[index % pentatonicNotes.length];
          osc.type = 'sine';
          osc.frequency.setValueAtTime(noteFreq, ctx.currentTime);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        } catch (e) {
          // ignore
        }
      }
    }

    const letterUtterance = new SpeechSynthesisUtterance(char.toUpperCase());
    letterUtterance.rate = 0.85;
    letterUtterance.pitch = 1.1 + (index * 0.04);
    const voices = window.speechSynthesis.getVoices();
    const friendlyVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Female') || v.name.includes('Samantha')));
    if (friendlyVoice) letterUtterance.voice = friendlyVoice;

    window.speechSynthesis.speak(letterUtterance);
  };

  // Save generated object to teacher documents
  const handleSaveToDocs = () => {
    if (!generatedResult || !activeObject) return;

    const docTitle = `Lower Primary Magic Object: ${activeObject.name} (${activeObject.emoji})`;
    const formattedContent = `# ${docTitle}
**Grade Target**: ${activeObject.gradeLevel}  
**Subject**: ${activeObject.defaultPromptConfig.subject}  
**Topic**: ${activeObject.defaultPromptConfig.topic}  

---

## 📖 Children's Discovery Story
${generatedResult.story}

---

## 🌟 Fun Facts for Little Explorers
${generatedResult.funFacts.map(fact => `- ${fact}`).join('\n')}

---

## 🎵 Action Rhyme & Classroom Song
> ${generatedResult.rhymePoem.replace(/\n/g, '\n> ')}

---

## 👩‍🏫 Teacher Circle Time Guide
- **Classroom Hook**: ${generatedResult.teacherCircleGuide.hook}
- **5-Min Movement Break**: ${generatedResult.teacherCircleGuide.movementBreak}
- **Circle Discussion**: ${generatedResult.teacherCircleGuide.discussionQuestion}

---

## 🔤 Word Power & Phonics
${generatedResult.wordPower.map(w => `- **${w.word}** (${w.syllables}): ${w.meaning}`).join('\n')}

---

## 🧩 3-Question Picture Quiz
${generatedResult.quizQuestions.map((q, idx) => `
### Question ${idx + 1}: ${q.question}
Options: ${q.options.map(o => `[ ${o} ]`).join(' ')}
*Answer Explanation*: ${q.explanation}
`).join('\n')}
`;

    const newDoc: SavedDocument = {
      id: `magic-doc-${Date.now()}`,
      title: docTitle,
      docType: 'lesson-plan',
      curriculum: 'cbc',
      subject: activeObject.defaultPromptConfig.subject,
      classLevel: activeObject.gradeLevel,
      topic: activeObject.defaultPromptConfig.topic,
      subTopic: activeObject.defaultPromptConfig.learningOutcome,
      duration: '30 Minutes',
      content: formattedContent,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      category: 'Lower Primary Magic Objects',
      tags: ['Lower Primary', 'Click-To-Generate', 'Early Childhood', activeObject.name]
    };

    if (onSaveToDocuments) {
      onSaveToDocuments(newDoc);
    }

    setSavedSuccessMsg(`Saved "${docTitle}" to your Class Library!`);
    setTimeout(() => setSavedSuccessMsg(null), 4000);
  };

  // Random wheel surprise selector
  const handleRandomSurprise = () => {
    const randomIndex = Math.floor(Math.random() * MAGIC_OBJECTS.length);
    const randomObject = MAGIC_OBJECTS[randomIndex];
    handleObjectClick(randomObject);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ONBOARDING HERO BANNER FOR LOWER SCHOOL TEACHERS & STUDENTS */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 p-6 md:p-8 text-white shadow-2xl border border-white/20">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-yellow-300/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider border border-white/30">
              <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
              <span>Lower Primary AI Magic Studio • Zero-Prompt Mode</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
              Click Any Animated Object to Generate Instant AI Lessons!
            </h1>
            <p className="text-white/90 text-xs md:text-sm leading-relaxed font-medium">
              Designed specifically for Lower School (Grade 1-3 & Early Years) teachers and students! <br className="hidden sm:inline" />
              <strong className="text-yellow-200">No prompt typing needed!</strong> Just tap any bouncing object below to auto-generate stories, rhymes, audio narrations, and teacher circle-time guides.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowMotionStudio(!showMotionStudio)}
              className={`px-4 py-3 rounded-2xl font-black text-xs md:text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer border ${
                showMotionStudio
                  ? 'bg-yellow-400 text-slate-950 border-yellow-300'
                  : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
              }`}
              title="Customize object animation styles, motion tempo, and physics drag"
            >
              <Activity className="w-4 h-4 text-yellow-300" />
              <span>Motion Studio 💫</span>
            </button>

            <button
              onClick={() => setShowAudioSettings(!showAudioSettings)}
              className={`px-4 py-3 rounded-2xl font-black text-xs md:text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer border ${
                soundEnabled
                  ? 'bg-white/20 hover:bg-white/30 text-white border-white/30'
                  : 'bg-black/30 hover:bg-black/40 text-slate-300 border-white/10'
              }`}
              title="Customize audio feedback sound effects"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-yellow-300" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span>{soundEnabled ? 'Audio On' : 'Audio Muted'}</span>
            </button>

            <button
              onClick={handlePartyMotionBlast}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-yellow-300 to-amber-400 text-purple-950 font-black text-xs md:text-sm hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-900 fill-purple-900 animate-spin" />
              <span>Party Blast! 🎉</span>
            </button>

            <button
              onClick={handleRandomSurprise}
              className="px-4 py-3 rounded-2xl bg-white text-purple-950 font-black text-xs md:text-sm hover:bg-yellow-300 hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-purple-600 fill-purple-600" />
              <span>Surprise Wheel! 🎲</span>
            </button>
          </div>
        </div>

        {/* CUSTOMIZABLE OBJECT ANIMATION & PHYSICS STUDIO PANEL */}
        <AnimatePresence>
          {showMotionStudio && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-white/20 space-y-4 text-xs text-white"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-yellow-400 animate-pulse" />
                  <div>
                    <h3 className="font-extrabold text-sm text-yellow-300 flex items-center gap-2">
                      <span>✨ Magic Object Animation & Physics Studio</span>
                      <span className="px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-[9px]">
                        Live Engine
                      </span>
                    </h3>
                    <p className="text-[11px] text-white/80">
                      Customize animation movement styles, speed tempo, and toggle interactive grab-and-fling physics!
                    </p>
                  </div>
                </div>

                <button
                  onClick={handlePartyMotionBlast}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-yellow-300 to-amber-400 text-slate-950 font-black text-xs hover:scale-105 active:scale-95 transition shadow-sm cursor-pointer self-start sm:self-auto"
                >
                  🎉 Launch Mega Party Motion!
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Animation Motion Mode Selector */}
                <div className="p-3.5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 space-y-2">
                  <div className="font-extrabold text-cyan-300 flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-cyan-300" />
                    <span>Global Motion Effect</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'preset', label: '🪄 Auto Preset' },
                      { id: 'bounce', label: '🦘 Bounce & Pop' },
                      { id: 'float', label: '☁️ Wave Float' },
                      { id: 'spin', label: '🌀 3D Spin' },
                      { id: 'wiggle', label: '💃 Jiggle & Wiggle' },
                      { id: 'pulse', label: '💓 Radiant Pulse' },
                      { id: 'orbit', label: '🪐 Orbiting Stars' },
                      { id: 'paused', label: '⏸️ Freeze Motion' }
                    ].map(style => (
                      <button
                        key={style.id}
                        onClick={() => {
                          setGlobalMotionStyle(style.id as any);
                          playClickChime('magic');
                          triggerSparkleBurst();
                        }}
                        className={`px-2 py-1.5 rounded-xl text-[10px] font-black transition cursor-pointer text-left ${
                          globalMotionStyle === style.id
                            ? 'bg-yellow-400 text-slate-950 shadow-md font-black scale-105'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Animation Speed Control */}
                <div className="p-3.5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 space-y-2">
                  <div className="font-extrabold text-amber-300 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-amber-300" />
                    <span>Animation Speed Tempo</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { speed: 0.5, label: '🐢 Chill (0.5x)' },
                      { speed: 1.0, label: '🐇 Normal (1x)' },
                      { speed: 1.5, label: '🚀 Party (1.5x)' }
                    ].map(s => (
                      <button
                        key={s.speed}
                        onClick={() => {
                          setGlobalMotionSpeed(s.speed);
                          playClickChime();
                        }}
                        className={`px-2 py-2 rounded-xl text-[10px] font-black transition cursor-pointer text-center ${
                          globalMotionSpeed === s.speed
                            ? 'bg-cyan-400 text-slate-950 shadow-md scale-105'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/70">Controls the rhythm and velocity of all magic objects.</p>
                </div>

                {/* Physics Touch & Drag Toggle */}
                <div className="p-3.5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 space-y-2">
                  <div className="font-extrabold text-emerald-300 flex items-center gap-1.5">
                    <Move className="w-4 h-4 text-emerald-300" />
                    <span>Interactive Physics Drag</span>
                  </div>
                  <button
                    onClick={() => {
                      setEnablePhysicsDrag(!enablePhysicsDrag);
                      playClickChime();
                    }}
                    className={`w-full p-2.5 rounded-xl text-xs font-black transition flex items-center justify-between border cursor-pointer ${
                      enablePhysicsDrag
                        ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-md'
                        : 'bg-white/10 text-white border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">✋</span>
                      <span>Grab & Drag Objects</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-black ${
                      enablePhysicsDrag ? 'bg-slate-950 text-emerald-300' : 'bg-white/20 text-white'
                    }`}>
                      {enablePhysicsDrag ? 'ON' : 'OFF'}
                    </span>
                  </button>
                  <p className="text-[10px] text-white/70">
                    When active, children can drag, throw, and fling magic objects across the screen!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CUSTOMIZABLE AUDIO FEEDBACK SETTINGS PANEL */}
        <AnimatePresence>
          {showAudioSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-white/20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-white"
            >
              {/* Master Toggle */}
              <div className="p-3.5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 space-y-2">
                <div className="font-extrabold text-yellow-300 flex items-center justify-between">
                  <span>🔊 Master Sound</span>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="w-4 h-4 accent-yellow-400 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-white/80">Enable or disable all interactive chime effects.</p>
              </div>

              {/* Click Sound Toggle */}
              <div className="p-3.5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 space-y-2">
                <div className="font-extrabold text-cyan-300 flex items-center justify-between">
                  <span>👇 Object Click Chime</span>
                  <input
                    type="checkbox"
                    checked={clickSoundEnabled}
                    disabled={!soundEnabled}
                    onChange={(e) => {
                      setClickSoundEnabled(e.target.checked);
                      if (e.target.checked) playClickChime();
                    }}
                    className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-white/80">Sound played when tapping an animated object.</p>
              </div>

              {/* Completion Sound Toggle */}
              <div className="p-3.5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 space-y-2">
                <div className="font-extrabold text-emerald-300 flex items-center justify-between">
                  <span>🎉 Completion Fanfare</span>
                  <input
                    type="checkbox"
                    checked={completionSoundEnabled}
                    disabled={!soundEnabled}
                    onChange={(e) => {
                      setCompletionSoundEnabled(e.target.checked);
                      if (e.target.checked) playCompletionChime();
                    }}
                    className="w-4 h-4 accent-emerald-400 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-white/80">Celebratory chime when AI lesson generation finishes.</p>
              </div>

              {/* Sound Preset Selector */}
              <div className="p-3.5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 space-y-2">
                <div className="font-extrabold text-purple-300">🎵 Sound Preset</div>
                <div className="flex gap-1.5">
                  {(['magic', 'playful', 'gentle'] as const).map(p => (
                    <button
                      key={p}
                      disabled={!soundEnabled}
                      onClick={() => {
                        setSoundPreset(p);
                        playClickChime(p);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black capitalize transition cursor-pointer ${
                        soundPreset === p
                          ? 'bg-yellow-400 text-slate-950 shadow-md'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PRECONFIGURED SYSTEM PROMPT MODE BAR */}
      <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-200">
              Pre-Configured System Prompt Focus Modes (Zero Prompt Typing Required)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Click any animated icon below or choose a focus mode trigger to launch AI generation!
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRECONFIGURED_PROMPT_MODES.map(mode => {
            const isActive = activePromptMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  setActivePromptMode(mode.id);
                  playClickChime();
                }}
                className={`p-3 rounded-2xl text-left transition-all cursor-pointer border flex flex-col justify-between space-y-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500/20 via-cyan-500/20 to-blue-500/20 border-cyan-400 text-white ring-2 ring-cyan-400/50 shadow-md scale-[1.02]'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">{mode.emoji}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    isActive ? 'bg-cyan-400 text-slate-950' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {mode.badge}
                  </span>
                </div>
                <div>
                  <div className="font-extrabold text-xs text-white flex items-center justify-between">
                    <span>{mode.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {mode.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CATEGORY FILTER TABS & MULTI-SELECT TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 max-w-full">
          {[
            { id: 'all', label: 'All Magic Objects', icon: '✨' },
            { id: 'nutrition', label: 'Healthy Foods', icon: '🍎' },
            { id: 'animals', label: 'Animals & Safari', icon: '🦁' },
            { id: 'science', label: 'Space & Nature', icon: '🪐' },
            { id: 'math', label: 'Math & Shapes', icon: '🍕' },
            { id: 'phonics', label: 'Phonics & Books', icon: '🚂' },
            { id: 'art', label: 'Art & Music', icon: '🎨' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md scale-105'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Multi-Select Toolbar Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
            className={`px-3 py-1.5 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 border cursor-pointer ${
              isMultiSelectMode || selectedBatchIds.length > 0
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-amber-500/10'
            }`}
            title="Toggle multi-select mode to select multiple objects simultaneously"
          >
            <CheckSquare className="w-4 h-4 text-amber-950 dark:text-amber-300" />
            <span>Multi-Select {selectedBatchIds.length > 0 && `(${selectedBatchIds.length})`}</span>
          </button>

          {(isMultiSelectMode || selectedBatchIds.length > 0) && (
            <>
              <button
                onClick={selectAllVisible}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer"
                title="Select all visible items in this category"
              >
                <span>Select All</span>
              </button>
              {selectedBatchIds.length > 0 && (
                <button
                  onClick={deselectAllBatch}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition border border-rose-500/20 flex items-center gap-1 cursor-pointer"
                  title="Clear all selections"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* DYNAMIC CLICK SPARKLE BURST & SHOCKWAVE OVERLAY */}
      <AnimatePresence>
        {/* Shockwave Rings */}
        {sparkleShockwaves.map(wave => (
          <motion.div
            key={wave.id}
            initial={{ opacity: 0.9, scale: 0.2 }}
            animate={{ opacity: 0, scale: 2.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="fixed z-50 rounded-full border-4 border-amber-300 pointer-events-none shadow-[0_0_25px_rgba(251,191,36,0.8)]"
            style={{
              left: wave.x - 40,
              top: wave.y - 40,
              width: 80,
              height: 80
            }}
          />
        ))}

        {/* 360-Degree Radial Sparkle Burst Particles */}
        {sparkleParticles.map(particle => (
          <motion.div
            key={particle.id}
            initial={{ opacity: 1, scale: 0.2, x: 0, y: 0, rotate: 0 }}
            animate={{
              opacity: [1, 1, 0],
              scale: [0.4, particle.scale, 0.1],
              x: particle.targetX,
              y: particle.targetY,
              rotate: particle.rotation
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
            className="fixed z-50 text-2xl md:text-3xl pointer-events-none drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]"
            style={{ left: particle.startX, top: particle.startY }}
          >
            {particle.emoji}
          </motion.div>
        ))}

        {/* Floating Magical Praise Badge */}
        {floatingTexts.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 1, y: 0, scale: 0.6 }}
            animate={{ opacity: [1, 1, 0], y: -70, scale: [0.8, 1.25, 0.9] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            className="fixed z-50 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 text-slate-950 font-black text-xs shadow-2xl border-2 border-white pointer-events-none -translate-x-1/2"
            style={{ left: item.x, top: item.y }}
          >
            {item.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* SAVED TO CLASSROOM NOTIFICATION TOAST */}
      <AnimatePresence>
        {savedSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{savedSuccessMsg}</span>
            </div>
            <button onClick={() => setSavedSuccessMsg(null)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN GRID: ANIMATED OBJECTS INTERACTIVE SELECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredObjects.map(obj => {
          const isSelected = activeObject?.id === obj.id;
          const isBatchSelected = selectedBatchIds.includes(obj.id);

          return (
            <motion.div
              key={obj.id}
              whileHover={{
                y: -8,
                scale: 1.03,
                boxShadow: isBatchSelected
                  ? '0 20px 35px -10px rgba(245, 158, 11, 0.4)'
                  : '0 20px 35px -10px rgba(56, 189, 248, 0.35)'
              }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
              onClick={(e) => {
                if (isMultiSelectMode || e.shiftKey || e.ctrlKey || e.metaKey) {
                  toggleObjectSelection(obj.id, e);
                } else {
                  handleObjectClick(obj, undefined, e);
                }
              }}
              className={`group relative rounded-3xl p-5 border transition-all duration-300 overflow-hidden shadow-lg flex flex-col justify-between cursor-pointer ${
                isBatchSelected
                  ? 'ring-4 ring-amber-400 border-amber-400 bg-gradient-to-br from-amber-500/20 via-amber-400/10 to-yellow-500/20 shadow-amber-500/30'
                  : isSelected
                  ? 'ring-4 ring-cyan-400 border-cyan-400 shadow-cyan-500/40'
                  : `${obj.borderColor} hover:border-cyan-400`
              } bg-gradient-to-br ${obj.colorGradient} bg-white/80 dark:bg-slate-900/90 backdrop-blur-md`}
            >
              {/* Shimmer Sheen Light Sweep Effect on Hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 dark:via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

              {/* Multi-Select Checkbox Overlay (Top-Left) */}
              <button
                type="button"
                onClick={(e) => toggleObjectSelection(obj.id, e)}
                className={`absolute top-3 left-3 z-30 p-1 rounded-xl transition-all shadow-md cursor-pointer border ${
                  isBatchSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-300 scale-110 shadow-amber-500/50'
                    : 'bg-white/90 dark:bg-slate-800/90 text-slate-400 hover:text-amber-500 border-slate-200 dark:border-slate-700 opacity-80 group-hover:opacity-100'
                }`}
                title={isBatchSelected ? "Deselect object" : "Select object for batch actions"}
              >
                {isBatchSelected ? (
                  <CheckSquare className="w-4 h-4 stroke-[3]" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>

              {/* Badge */}
              <div className="flex items-center justify-between gap-2 mb-2 relative z-10 pl-7">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs">
                  {obj.gradeLevel}
                </span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 group-hover:border-amber-400 transition-colors flex items-center gap-1">
                  🎬 Short Video
                </span>
              </div>

              {/* Animated Giant Emoji / Icon (Interactive Direct Trigger) */}
              <AnimatedMagicObjectIcon
                obj={obj}
                isSelected={isSelected}
                isGenerating={isSelected && isGenerating}
                globalMotionStyle={globalMotionStyle}
                globalMotionSpeed={globalMotionSpeed}
                enablePhysicsDrag={enablePhysicsDrag}
                onClick={(e) => {
                  e.stopPropagation();
                  handleObjectClick(obj, undefined, e);
                }}
                triggerSparkleBurst={triggerSparkleBurst}
              />

              {/* Object Details */}
              <div className="space-y-1 text-center mt-1 relative z-10">
                <h3 className="font-extrabold text-base md:text-lg text-slate-900 dark:text-white tracking-tight group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                  {obj.name}
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
                  {obj.description}
                </p>
              </div>

              {/* OBJECT-SPECIFIC PRECONFIGURED ACTION BUTTONS */}
              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 space-y-2 relative z-10">
                <div className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                  Select System Mode:
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {PRECONFIGURED_PROMPT_MODES.map(mode => (
                    <button
                      key={mode.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleObjectClick(obj, mode.id, e);
                      }}
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                        activePromptMode === mode.id
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-xs'
                          : 'bg-white/60 dark:bg-slate-800/80 hover:bg-cyan-500/20 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}
                      title={`Generate ${mode.label} for ${obj.name}`}
                    >
                      <span>{mode.emoji}</span>
                      <span>{mode.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>

                {/* Primary Launch Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleObjectClick(obj, undefined, e);
                  }}
                  className={`w-full py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer mt-1 ${
                    isSelected && isGenerating
                      ? 'bg-amber-500 text-slate-950 animate-pulse'
                      : 'bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>{isSelected && isGenerating ? 'Casting AI Magic...' : `Generate ${activePromptMode.toUpperCase()}! ✨`}</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* GENERATION SPINNER DISPLAY */}
      {isGenerating && activeObject && (
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-cyan-500/30 text-white text-center space-y-4 shadow-2xl animate-pulse">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center text-3xl shadow-xl animate-bounce">
            {activeObject.emoji}
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-white">Generating Lower School Lesson for {activeObject.name}...</h3>
            <p className="text-xs text-slate-400">Zero-prompt AI engine is crafting stories, rhymes, audio narrations, and teacher circle time guides!</p>
          </div>
        </div>
      )}

      {/* GENERATED RESULT DISPLAY CARD */}
      {!isGenerating && generatedResult && activeObject && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 space-y-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-500 via-cyan-400 to-purple-500" />

          {/* Result Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-purple-500/20 border border-amber-400/30 flex items-center justify-center text-4xl shadow-inner shrink-0">
                {generatedResult.emoji}
              </div>
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {generatedResult.gradeLevel}
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {generatedResult.title}
                </h2>
              </div>
            </div>

            {/* Top Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  const fullTextToRead = `${generatedResult.title}. ${generatedResult.story}. Fun Facts: ${generatedResult.funFacts.join('. ')}. Classroom Song: ${generatedResult.rhymePoem}`;
                  if (isSpeaking) {
                    stopSpeech();
                  } else {
                    speakText(fullTextToRead);
                  }
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                  isSpeaking
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:brightness-110'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isSpeaking ? 'Stop Narration' : '🔊 Read Aloud to Class'}</span>
              </button>

              <button
                onClick={handleSaveToDocs}
                className="px-4 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Save to Class Library</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer border border-slate-700"
              >
                <Printer className="w-4 h-4" />
                <span>Print Worksheet</span>
              </button>
            </div>
          </div>

          {/* FEATURED SHORT ANIMATED VIDEO LESSON PLAYER */}
          <div className="p-2 md:p-4 rounded-3xl bg-slate-950/90 border border-amber-400/40 shadow-2xl">
            <MagicObjectShortVideoPlayer
              object={activeObject}
              autoPlay={true}
              onOpenVideoStudio={onOpenVideoStudio}
            />
          </div>

          {/* 1. DISCOVERY STORY SECTION */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-sm uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              <span>Children's Discovery Story</span>
            </div>
            <p className="text-slate-200 text-sm md:text-base leading-relaxed font-medium">
              {generatedResult.story}
            </p>
          </div>

          {/* 2. FUN FACTS & CLASSROOM SONG */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fun Facts */}
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm uppercase tracking-wider">
                <Star className="w-4 h-4" />
                <span>3 Fun Facts for Little Explorers</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300">
                {generatedResult.funFacts.map((fact, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                    <span className="text-amber-400 font-black text-sm">⭐</span>
                    <span className="leading-normal">{fact}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Rhyme & Poem */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-950/40 to-slate-950 border border-purple-500/20 space-y-3">
              <div className="flex items-center gap-2 text-purple-300 font-extrabold text-sm uppercase tracking-wider">
                <Music className="w-4 h-4" />
                <span>Action Rhyme & Song</span>
              </div>
              <div className="p-4 rounded-2xl bg-purple-900/20 border border-purple-500/30 text-purple-200 text-xs md:text-sm font-semibold whitespace-pre-line leading-relaxed italic">
                "{generatedResult.rhymePoem}"
              </div>
            </div>
          </div>

          {/* 3. TEACHER CIRCLE TIME GUIDE */}
          <div className="p-6 rounded-3xl bg-teal-950/30 border border-teal-500/30 space-y-4">
            <div className="flex items-center gap-2 text-teal-300 font-extrabold text-sm uppercase tracking-wider">
              <Award className="w-4 h-4" />
              <span>Lower Primary Teacher Circle-Time Guide</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="font-extrabold text-teal-400">🎣 1. Lesson Hook</div>
                <div className="text-slate-300">{generatedResult.teacherCircleGuide.hook}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="font-extrabold text-amber-400">🏃 2. Movement Break</div>
                <div className="text-slate-300">{generatedResult.teacherCircleGuide.movementBreak}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="font-extrabold text-cyan-400">💬 3. Circle Question</div>
                <div className="text-slate-300">{generatedResult.teacherCircleGuide.discussionQuestion}</div>
              </div>
            </div>
          </div>

          {/* 3.5. ACCURATE, SMOOTH & MUSICAL PHONICS & SPELLING STUDIO */}
          {generatedResult.wordPower && generatedResult.wordPower.length > 0 && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-950 to-purple-950/60 border border-indigo-500/30 space-y-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
                <div className="flex items-center gap-2 text-indigo-300 font-extrabold text-sm uppercase tracking-wider">
                  <Music className="w-5 h-5 text-amber-400 animate-bounce" />
                  <span>Accurate, Smooth & Musical Phonics & Spelling Studio</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-indigo-200">
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 font-bold text-[11px] flex items-center gap-1">
                    <span>🎶 Harmonic Scale C-Major</span>
                  </span>
                </div>
              </div>

              <p className="text-xs text-indigo-200/90 leading-relaxed">
                Tap <strong className="text-amber-300">"Sing & Spell Musically"</strong> or tap any individual letter tile to hear its accurate phonetic voice & smooth musical note pitch!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedResult.wordPower.map((item, wIdx) => {
                  const upperWord = item.word.trim().toUpperCase();
                  const isThisSpelling = currentlySpellingWord === upperWord;
                  const chars = upperWord.split('');

                  return (
                    <div
                      key={wIdx}
                      className={`p-4 rounded-2xl transition-all border ${
                        isThisSpelling
                          ? 'bg-indigo-900/60 border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.02]'
                          : 'bg-slate-900/80 hover:bg-slate-900 border-indigo-500/20 hover:border-indigo-400/50'
                      } flex flex-col justify-between space-y-3`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-black text-base text-white tracking-wide">{item.word}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                            {item.syllables || item.word}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2 italic">{item.meaning}</p>
                      </div>

                      {/* Interactive Musical Letter Tiles */}
                      <div className="flex flex-wrap items-center gap-1.5 py-1">
                        {chars.map((char, cIdx) => {
                          const isCharActive = isThisSpelling && currentlySpellingCharIndex === cIdx;

                          return (
                            <motion.button
                              key={cIdx}
                              whileHover={{ scale: 1.15, y: -2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => playSingleLetterSound(char, cIdx)}
                              className={`w-7 h-8 rounded-lg font-black text-xs flex items-center justify-center transition-all cursor-pointer border ${
                                isCharActive
                                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/50 scale-125 z-10'
                                  : 'bg-indigo-950/90 text-indigo-200 border-indigo-500/40 hover:bg-indigo-500 hover:text-white'
                              }`}
                              title={`Click to hear '${char}' with musical tone`}
                            >
                              {char}
                            </motion.button>
                          );
                        })}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => playMusicalSpelling(item.word)}
                        disabled={isSpeaking}
                        className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                          isThisSpelling
                            ? 'bg-amber-400 text-slate-950 font-black animate-pulse'
                            : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white'
                        } disabled:opacity-50`}
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>{isThisSpelling ? 'Singing Spelling...' : '🎵 Sing & Spell Musically'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. INTERACTIVE 3-QUESTION PICTURE QUIZ FOR KIDS */}
          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-yellow-400 font-extrabold text-sm uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>Interactive Student Quiz • Tap Your Answer!</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Instant Star Rewards ⭐</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {generatedResult.quizQuestions.map((q, qIdx) => {
                const userChoice = selectedAnswers[qIdx];
                const isAnswered = userChoice !== undefined;
                const isCorrect = userChoice === q.correctIndex;

                return (
                  <div key={qIdx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-cyan-400">Question {qIdx + 1}</span>
                      <p className="text-xs font-bold text-white leading-snug">{q.question}</p>
                    </div>

                    <div className="space-y-2 my-2">
                      {q.options.map((opt, optIdx) => {
                        const isThisSelected = userChoice === optIdx;
                        const isThisCorrect = q.correctIndex === optIdx;

                        let btnStyle = 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700';
                        if (isAnswered) {
                          if (isThisCorrect) {
                            btnStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold';
                          } else if (isThisSelected) {
                            btnStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/50';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => {
                              setSelectedAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
                              setShowExplanation(prev => ({ ...prev, [qIdx]: true }));
                              if (optIdx === q.correctIndex) {
                                playMagicChime();
                              }
                            }}
                            className={`w-full text-left p-2.5 rounded-xl text-xs border transition cursor-pointer flex items-center justify-between ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {isAnswered && isThisCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>

                    {showExplanation[qIdx] && (
                      <div className={`p-2.5 rounded-xl text-[11px] font-medium leading-tight ${
                        isCorrect ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                      }`}>
                        {isCorrect ? '🌟 Awesome! ' : '💡 Tip: '} {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* FLOATING STICKY BATCH ACTIONS DOCK */}
      <AnimatePresence>
        {selectedBatchIds.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-4xl p-3.5 md:p-4 rounded-3xl bg-slate-900/95 border-2 border-amber-400/80 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl text-white flex flex-col md:flex-row items-center justify-between gap-3"
          >
            {/* Selected items count & preview avatars */}
            <div className="flex items-center gap-3 overflow-x-auto max-w-full">
              <div className="px-3 py-1.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shrink-0 shadow-sm">
                <Sparkles className="w-4 h-4" />
                <span>{selectedBatchIds.length} Selected</span>
              </div>

              {/* Emoji Stack */}
              <div className="flex items-center -space-x-2 shrink-0 py-1">
                {objectsList
                  .filter(o => selectedBatchIds.includes(o.id))
                  .slice(0, 7)
                  .map(o => (
                    <span
                      key={o.id}
                      className="w-8 h-8 rounded-full bg-slate-800 border-2 border-amber-400/60 flex items-center justify-center text-base shadow-sm"
                      title={o.name}
                    >
                      {o.emoji}
                    </span>
                  ))}
                {selectedBatchIds.length > 7 && (
                  <span className="w-8 h-8 rounded-full bg-slate-800 text-amber-300 font-bold text-xs border-2 border-amber-400/60 flex items-center justify-center">
                    +{selectedBatchIds.length - 7}
                  </span>
                )}
              </div>
            </div>

            {/* Batch Actions Buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
              <button
                onClick={() => handleGroupGenerate()}
                disabled={isGenerating}
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 hover:from-amber-300 hover:to-pink-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Group Generate AI</span>
              </button>

              <button
                onClick={() => setShowBatchMoveModal(true)}
                className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <FolderOutput className="w-4 h-4 text-cyan-400" />
                <span>Move Category</span>
              </button>

              <button
                onClick={() => setShowBatchMotionModal(true)}
                className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Move className="w-4 h-4 text-amber-400" />
                <span>Batch Motion</span>
              </button>

              {onOpenVideoStudio && (
                <button
                  onClick={() => {
                    const selectedNames = objectsList.filter(o => selectedBatchIds.includes(o.id)).map(o => o.name).join(', ');
                    onOpenVideoStudio(`Group Video Short featuring: ${selectedNames}`);
                  }}
                  className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  🎬 Video
                </button>
              )}

              <button
                onClick={deselectAllBatch}
                className="p-2 rounded-2xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 transition cursor-pointer"
                title="Deselect all items"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BATCH MOVE CATEGORY MODAL */}
      <AnimatePresence>
        {showBatchMoveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border-2 border-cyan-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOutput className="w-6 h-6 text-cyan-400" />
                  <h3 className="font-extrabold text-lg text-white">Batch Move Objects</h3>
                </div>
                <button onClick={() => setShowBatchMoveModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Move <strong className="text-amber-400">{selectedBatchIds.length} selected objects</strong> to a new curriculum category studio:
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'nutrition', label: 'Healthy Foods', icon: '🍎' },
                  { id: 'animals', label: 'Animals & Safari', icon: '🦁' },
                  { id: 'science', label: 'Space & Nature', icon: '🪐' },
                  { id: 'math', label: 'Math & Shapes', icon: '🍕' },
                  { id: 'phonics', label: 'Phonics & Books', icon: '🚂' },
                  { id: 'art', label: 'Art & Music', icon: '🎨' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleBatchMoveCategory(cat.id)}
                    className="p-3 rounded-2xl bg-slate-800 hover:bg-cyan-600/30 border border-slate-700 hover:border-cyan-400 transition text-left flex items-center gap-2 cursor-pointer group"
                  >
                    <span className="text-xl group-hover:scale-125 transition-transform">{cat.icon}</span>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white">{cat.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BATCH MOTION STYLE MODAL */}
      <AnimatePresence>
        {showBatchMotionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Move className="w-6 h-6 text-amber-400" />
                  <h3 className="font-extrabold text-lg text-white">Batch Motion Animation</h3>
                </div>
                <button onClick={() => setShowBatchMotionModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Apply animation motion dynamics to <strong className="text-amber-400">{selectedBatchIds.length} selected objects</strong> simultaneously:
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'bounce', label: 'Jumping Bounce', emoji: '🏀', desc: 'Up & down bounce' },
                  { id: 'float', label: 'Floating Cloud', emoji: '☁️', desc: 'Smooth floating drift' },
                  { id: 'spin', label: 'Magic Spin', emoji: '🌀', desc: '360 degree 3D spin' },
                  { id: 'wiggle', label: 'Playful Wiggle', emoji: '💃', desc: 'Fun side-to-side dance' },
                  { id: 'pulse', label: 'Heartbeat Pulse', emoji: '💓', desc: 'Rhythmic pulse scale' },
                  { id: 'orbit', label: 'Star Orbit', emoji: '✨', desc: 'Orbiting sparkle halo' }
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleBatchApplyMotion(m.id as any)}
                    className="p-3 rounded-2xl bg-slate-800 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-400 transition text-left flex flex-col justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg group-hover:scale-125 transition-transform">{m.emoji}</span>
                      <span className="text-xs font-bold text-amber-300">{m.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{m.desc}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
