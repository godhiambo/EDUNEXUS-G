import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  History, 
  AlertTriangle, 
  Loader2, 
  BookOpen, 
  ExternalLink, 
  ListTodo, 
  Check, 
  Award, 
  Trash2, 
  Sparkles,
  FileText,
  Globe,
  Plus,
  X,
  Activity,
  LineChart,
  TrendingUp,
  Trophy,
  Star,
  Crown,
  Palette,
  Lock,
  Unlock,
  Cpu,
  CheckCircle2,
  Printer,
  Shield,
  Users,
  UserCheck,
  Heart,
  Layers,
  Flame,
  HelpCircle,
  BookmarkPlus
} from 'lucide-react';
import { motion } from 'motion/react';
import { db, cleanUndefined, compressObject } from '../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { PersonalizedLearningPath, FlashcardDeck, SavedDocument } from '../types';
import FlashcardDeckModal from './FlashcardDeckModal';
import AdaptivePathGenerator from './AdaptivePathGenerator';
import { handleResponseJson } from '../utils/api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 14
    }
  }
};

const AnimatedActivityCheckbox: React.FC<{
  isCompleted: boolean;
  onToggle: () => void;
}> = ({ isCompleted, onToggle }) => {
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    if (isCompleted) {
      setShowBurst(true);
      const timer = setTimeout(() => setShowBurst(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isCompleted]);

  // Spark/particle directions for the celebration burst
  const particles = [
    { id: 1, angle: -45, distance: 20, delay: 0 },
    { id: 2, angle: 45, distance: 20, delay: 0.04 },
    { id: 3, angle: 135, distance: 20, delay: 0.02 },
    { id: 4, angle: 225, distance: 20, delay: 0.06 },
    { id: 5, angle: -90, distance: 18, delay: 0.03 },
    { id: 6, angle: 90, distance: 18, delay: 0.08 },
  ];

  return (
    <div className="relative shrink-0 select-none">
      <motion.button
        type="button"
        onClick={onToggle}
        whileTap={{ scale: 0.82 }}
        animate={{
          scale: isCompleted ? [1, 1.25, 1] : 1,
          backgroundColor: isCompleted ? "rgb(16, 185, 129)" : "rgb(255, 255, 255)",
          borderColor: isCompleted ? "rgb(16, 185, 129)" : "rgb(203, 213, 225)",
        }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="w-5.5 h-5.5 rounded-lg border flex items-center justify-center cursor-pointer shadow-xs focus:outline-none"
      >
        {isCompleted && (
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3.5 h-3.5 text-white"
          >
            <motion.path
              d="M20 6L9 17l-5-5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
          </motion.svg>
        )}
      </motion.button>

      {/* Particle Burst Celebration */}
      {showBurst && particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const x = Math.cos(rad) * p.distance;
        const y = Math.sin(rad) * p.distance;
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 0.6, x: 0, y: 0 }}
            animate={{ 
              opacity: 0, 
              scale: [0.6, 1.2, 0],
              x: x, 
              y: y 
            }}
            transition={{ 
              duration: 0.55, 
              ease: "easeOut",
              delay: p.delay 
            }}
            className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 pointer-events-none"
            style={{ marginTop: "-3px", marginLeft: "-3px" }}
          />
        );
      })}
    </div>
  );
};

const AnimatedStrikeText: React.FC<{
  text: string;
  isCompleted: boolean;
  className?: string;
}> = ({ text, isCompleted, className }) => {
  return (
    <div className="relative inline-block max-w-full">
      <span className={className}>
        {text}
      </span>
      <motion.div
        initial={{ width: "0%" }}
        animate={{ width: isCompleted ? "100%" : "0%" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="absolute top-1/2 left-0 h-[1.5px] bg-slate-400 pointer-events-none opacity-80"
      />
    </div>
  );
};

interface UploadedResource {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  storagePath: string;
  downloadUrl?: string;
  extractedText: string;
  uploadedAt: string;
  subject?: string;
  topic?: string;
  folderId?: string;
}

const SUBJECT_SUBTOPICS: Record<string, string[]> = {
  'Physics': [
    'Kinematics (Velocity & Acceleration)',
    'Newtonian Dynamics & Forces',
    'Work, Energy & Power',
    'Waves & Optics',
    'Electricity & Magnetism'
  ],
  'Mathematics': [
    'Algebra & Equations',
    'Coordinate Geometry',
    'Trigonometry',
    'Calculus (Limits & Derivatives)',
    'Probability & Statistics'
  ],
  'Chemistry': [
    'Atomic Structure & Bonding',
    'Stoichiometry & Chemical Equations',
    'Thermodynamics & Kinetics',
    'Acids, Bases & Salts',
    'Organic Chemistry Basics'
  ],
  'Biology': [
    'Cell Biology & Metabolism',
    'Genetics & DNA',
    'Human Physiology & Systems',
    'Ecology & Ecosystems',
    'Plant Biology & Photosynthesis'
  ],
  'General Science': [
    'Scientific Method & Measurements',
    'States of Matter',
    'Simple Machines & Forces',
    'Solar System & Universe',
    'Earth Science & Resources'
  ],
  'Languages & Literature': [
    'Grammar & Sentence Structure',
    'Essay Writing & Structure',
    'Reading Comprehension & Analysis',
    'Vocabulary & Word Choice',
    'Literary Devices & Poetry'
  ],
  'History & Geography': [
    'Ancient Civilizations',
    'Modern World History',
    'Physical Geography (Landforms, Weather)',
    'Cartography & Map Skills',
    'Human & Cultural Geography'
  ]
};

const isComplexProjectTask = (title: string, description: string) => {
  const t = (title + ' ' + description).toLowerCase();
  return (
    t.includes('project') ||
    t.includes('real-world') ||
    t.includes('challenge') ||
    t.includes('advanced') ||
    t.includes('case study') ||
    t.includes('portfolio') ||
    t.includes('build') ||
    t.includes('design') ||
    t.includes('create a') ||
    t.includes('implement')
  );
};

export const LearningPathWorkspace: React.FC = () => {
  const { profile } = useAuth();
  
  // States
  const [workspaceMode, setWorkspaceMode] = useState<'adaptive' | 'planner'>('adaptive');
  const [userSavedDocs, setUserSavedDocs] = useState<SavedDocument[]>([]);
  const [learningPaths, setLearningPaths] = useState<PersonalizedLearningPath[]>([]);
  const [selectedPathId, setSelectedPathId] = useState<string>('');
  const [pathSubject, setPathSubject] = useState<string>('Physics');
  const [pathKnowledgeLevel, setPathKnowledgeLevel] = useState<string>('Beginner');
  const [pathObjectives, setPathObjectives] = useState<string>('');
  const [pathAdditionalInfo, setPathAdditionalInfo] = useState<string>('');
  const [isGeneratingPath, setIsGeneratingPath] = useState<boolean>(false);
  const [isAdaptingActivePath, setIsAdaptingActivePath] = useState<boolean>(false);
  const [pathError, setPathError] = useState<string | null>(null);
  const [completedActivities, setCompletedActivities] = useState<Record<string, boolean>>({});
  const [subtopicConfidence, setSubtopicConfidence] = useState<Record<string, 'low' | 'medium' | 'high'>>({});
  
  // Adaptive Flashcards & ADHD Focus Scaffolding States
  const [activeFlashcardDeck, setActiveFlashcardDeck] = useState<FlashcardDeck | null>(null);
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState<boolean>(false);
  const [generatingFlashcardSubtopic, setGeneratingFlashcardSubtopic] = useState<string | null>(null);
  const [cachedFlashcardDecks, setCachedFlashcardDecks] = useState<Record<string, FlashcardDeck>>({});
  const [adhdActivityStreak, setAdhdActivityStreak] = useState<number>(() => {
    return parseInt(localStorage.getItem('adhd_activity_streak') || '3', 10);
  });
  const [adhdDailyXP, setAdhdDailyXP] = useState<number>(() => {
    return parseInt(localStorage.getItem('adhd_daily_xp') || '120', 10);
  });

  const handleGenerateOrPracticeSupportiveFlashcards = async (subject: string, topic: string, subtopic: string) => {
    const key = `${subject}-${topic}-${subtopic}`;
    if (cachedFlashcardDecks[key]) {
      setActiveFlashcardDeck(cachedFlashcardDecks[key]);
      setIsFlashcardModalOpen(true);
      return;
    }

    setGeneratingFlashcardSubtopic(subtopic);
    try {
      const res = await fetch('/api/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic,
          subtopic,
          cardCount: 6,
          isLowDifficultySupport: true,
          difficultyLevel: 'low-difficulty-support'
        })
      });
      const data = await handleResponseJson(res);
      if (data.deck) {
        setCachedFlashcardDecks(prev => ({ ...prev, [key]: data.deck }));
        setActiveFlashcardDeck(data.deck);
        setIsFlashcardModalOpen(true);
      }
    } catch (err) {
      console.error("Error generating supportive flashcards:", err);
    } finally {
      setGeneratingFlashcardSubtopic(null);
    }
  };

  const handleSaveFlashcardsToLibrary = async (deck: FlashcardDeck) => {
    if (!profile?.uid || !deck) return;
    const docId = deck.id || `flashcard-${Date.now()}`;
    const cards = deck.cards || [];
    const savedDoc: SavedDocument = {
      id: docId,
      title: deck.title || 'Flashcards',
      docType: 'flashcards',
      curriculum: 'cbc',
      subject: deck.subject || 'General',
      classLevel: 'Upper Primary / Secondary',
      topic: deck.topic || 'Core Concept',
      subTopic: '',
      duration: '15 mins',
      content: cards.map((c, i) => `Card ${i + 1}: Q: ${c?.front || ''}\nA: ${c?.back || ''}`).join('\n\n'),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      tags: ['flashcards', 'supportive-scaffolding', 'low-confidence-support', deck.subject || 'General'],
      category: 'Flashcards',
      lastModifiedByUid: profile.uid,
      lastModifiedByName: profile.displayName,
      flashcardDeck: deck,
    };

    await setDoc(doc(db, 'documents', docId), cleanUndefined(compressObject(savedDoc)));
  };

  const handleFlashcardComplete = (stats: { totalCards: number; masteredCards: number }) => {
    const newStreak = adhdActivityStreak + 1;
    const newXP = adhdDailyXP + 25;
    setAdhdActivityStreak(newStreak);
    setAdhdDailyXP(newXP);
    localStorage.setItem('adhd_activity_streak', newStreak.toString());
    localStorage.setItem('adhd_daily_xp', newXP.toString());
  };
  
  // Premium Gamified Unlocks
  const [cosmicThemeActive, setCosmicThemeActive] = useState<boolean>(() => {
    return localStorage.getItem('gamified_cosmic_theme') === 'true';
  });
  const [socraticCoachActive, setSocraticCoachActive] = useState<boolean>(() => {
    return localStorage.getItem('gamified_socratic_coach') === 'true';
  });
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  
  // Peer-Tutor Community states
  const [allStudentsPaths, setAllStudentsPaths] = useState<PersonalizedLearningPath[]>([]);
  const [tutoringConnections, setTutoringConnections] = useState<any[]>([]);
  const [matchingFilter, setMatchingFilter] = useState<'all' | 'tutors' | 'learners'>('all');
  const [connectionAnonymous, setConnectionAnonymous] = useState<boolean>(false);
  
  const activeLearningPath = learningPaths.find(p => p.id === selectedPathId);

  const peerTutoringMatches = React.useMemo(() => {
    if (!activeLearningPath || !activeLearningPath.subtopicConfidence) return [];
    
    const matches: {
      subtopic: string;
      peerUserId: string;
      peerName: string;
      type: 'tutor' | 'learner';
      peerConfidence: 'low' | 'high';
    }[] = [];

    Object.entries(activeLearningPath.subtopicConfidence).forEach(([sub, conf]) => {
      if (conf === 'low') {
        // Look for other students who are highly confident in this topic
        allStudentsPaths.forEach(path => {
          if (path.subject === activeLearningPath.subject && path.userId !== (profile?.uid || 'offline-sandbox-student-uid')) {
            const peerConf = path.subtopicConfidence?.[sub];
            if (peerConf === 'high') {
              const mockNames: Record<string, string> = {
                'offline-sandbox-student-1': 'Alice Vance',
                'offline-sandbox-student-2': 'David Miller',
                'offline-sandbox-student-3': 'Claire Fontaine'
              };
              const peerName = mockNames[path.userId || ''] || 'Peer Scholar';

              // Prevent duplicates in suggestion list
              if (!matches.some(m => m.peerUserId === path.userId && m.subtopic === sub)) {
                matches.push({
                  subtopic: sub,
                  peerUserId: path.userId || 'anonymous-peer',
                  peerName,
                  type: 'tutor',
                  peerConfidence: 'high'
                });
              }
            }
          }
        });
      } else if (conf === 'high') {
        // Look for other students who have low confidence in this topic
        allStudentsPaths.forEach(path => {
          if (path.subject === activeLearningPath.subject && path.userId !== (profile?.uid || 'offline-sandbox-student-uid')) {
            const peerConf = path.subtopicConfidence?.[sub];
            if (peerConf === 'low') {
              const mockNames: Record<string, string> = {
                'offline-sandbox-student-1': 'Alice Vance',
                'offline-sandbox-student-2': 'David Miller',
                'offline-sandbox-student-3': 'Claire Fontaine'
              };
              const peerName = mockNames[path.userId || ''] || 'Struggling Peer';

              if (!matches.some(m => m.peerUserId === path.userId && m.subtopic === sub)) {
                matches.push({
                  subtopic: sub,
                  peerUserId: path.userId || 'anonymous-peer',
                  peerName,
                  type: 'learner',
                  peerConfidence: 'low'
                });
              }
            }
          }
        });
      }
    });

    return matches;
  }, [activeLearningPath, allStudentsPaths, profile?.uid]);

  const [performanceRecords, setPerformanceRecords] = useState<{
    id: string;
    subtopic: string;
    score: number;
    type: 'Quiz' | 'Assignment' | 'Exam' | 'Homework';
    date: string;
  }[]>(() => {
    const saved = localStorage.getItem('subtopic_performance_records_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    const seed = [
      { id: 'perf-1', subtopic: 'Kinematics (Velocity & Acceleration)', score: 45, type: 'Quiz', date: '2026-07-10' },
      { id: 'perf-2', subtopic: 'Newtonian Dynamics & Forces', score: 82, type: 'Homework', date: '2026-07-12' },
      { id: 'perf-3', subtopic: 'Algebra & Equations', score: 55, type: 'Assignment', date: '2026-07-08' },
      { id: 'perf-4', subtopic: 'Trigonometry', score: 92, type: 'Quiz', date: '2026-07-11' }
    ];
    localStorage.setItem('subtopic_performance_records_v1', JSON.stringify(seed));
    return seed;
  });

  useEffect(() => {
    const handleRecordAdded = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setPerformanceRecords(prev => {
          if (prev.some(r => r.id === customEvent.detail.id)) return prev;
          return [...prev, customEvent.detail];
        });
      }
    };
    window.addEventListener('performanceRecordAdded', handleRecordAdded);
    return () => {
      window.removeEventListener('performanceRecordAdded', handleRecordAdded);
    };
  }, []);

  const [autoAdjustFromPerformance, setAutoAdjustFromPerformance] = useState<boolean>(true);
  const [showAddScoreForSubtopic, setShowAddScoreForSubtopic] = useState<string | null>(null);
  const [newScoreValue, setNewScoreValue] = useState<number>(80);
  const [newScoreType, setNewScoreType] = useState<'Quiz' | 'Assignment' | 'Exam' | 'Homework'>('Quiz');

  const handleAddPerformanceRecord = (subtopic: string) => {
    if (newScoreValue < 0 || newScoreValue > 100) return;
    const newRecord = {
      id: `perf-${Date.now()}`,
      subtopic,
      score: newScoreValue,
      type: newScoreType,
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [...performanceRecords, newRecord];
    setPerformanceRecords(updated);
    localStorage.setItem('subtopic_performance_records_v1', JSON.stringify(updated));
    setShowAddScoreForSubtopic(null);
  };

  const handleDeletePerformanceRecord = (id: string) => {
    const updated = performanceRecords.filter(r => r.id !== id);
    setPerformanceRecords(updated);
    localStorage.setItem('subtopic_performance_records_v1', JSON.stringify(updated));
  };

  // GAMIFICATION CALCULATOR
  const computedStats = React.useMemo(() => {
    let xp = 0;
    
    // 1. Calculate XP from subtopic scores
    // Each subtopic with avgScore >= 80 awards +100 XP
    let masteredCount = 0;
    let loggedScoresCount = performanceRecords.length;
    let highestScore = 0;
    
    const subtopicScores: Record<string, number[]> = {};
    performanceRecords.forEach(rec => {
      if (!subtopicScores[rec.subtopic]) subtopicScores[rec.subtopic] = [];
      subtopicScores[rec.subtopic].push(rec.score);
      if (rec.score > highestScore) highestScore = rec.score;
    });
    
    Object.entries(subtopicScores).forEach(([subtopic, scores]) => {
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      if (avg >= 80) {
        masteredCount++;
        xp += 100; // +100 XP per mastered subtopic
      }
    });

    // 2. Calculate XP from completed activities
    const currentActivePath = learningPaths.find(p => p.id === selectedPathId);
    let completedProjectCount = 0;
    let completedStandardCount = 0;

    Object.entries(completedActivities).forEach(([actId, done]) => {
      if (!done) return;
      
      const act = currentActivePath?.activities?.find(a => a.id === actId);
      if (act) {
        const isProject = isComplexProjectTask(act.title, act.description);
        if (isProject) {
          completedProjectCount++;
          xp += 150; // +150 XP bonus for complex real-world projects
        } else {
          completedStandardCount++;
          xp += 50; // +50 XP for standard activities
        }
      } else {
        // Fallback for older completed activities
        xp += 50;
      }
    });

    // 3. Define the achievement badges
    const badgesList = [
      {
        id: 'first_steps',
        name: 'First Steps',
        desc: 'Log your first quiz score or assignment grade.',
        icon: '🎓',
        unlocked: loggedScoresCount > 0,
        criteria: 'Logged 1+ performance record'
      },
      {
        id: 'fast_tracker',
        name: 'Fast-Tracker',
        desc: 'Unlock the fast-tracked syllabus by earning >= 80% on any subtopic.',
        icon: '🚀',
        unlocked: masteredCount > 0,
        criteria: 'Syllabus Fast-Track triggered (1+ topic mastered)'
      },
      {
        id: 'syllabus_master',
        name: 'Syllabus Master',
        desc: 'Earn a grade of 90% or above in any subtopic test.',
        icon: '🏆',
        unlocked: highestScore >= 90,
        criteria: 'Scored 90%+ in any subtopic test'
      },
      {
        id: 'real_world_builder',
        name: 'Real-World Builder',
        desc: 'Complete an advanced real-world project task from your syllabus.',
        icon: '🛠️',
        unlocked: completedProjectCount > 0,
        criteria: 'Completed 1+ Real-World Project activity'
      },
      {
        id: 'activity_champ',
        name: 'Activity Champ',
        desc: 'Complete 3 or more interactive action activities.',
        icon: '⚡',
        unlocked: (completedStandardCount + completedProjectCount) >= 3,
        criteria: 'Completed 3+ activities'
      },
      {
        id: 'multidisciplinary',
        name: 'Knowledge General',
        desc: 'Generate customized learning paths in 2 or more different subjects.',
        icon: '🔥',
        unlocked: new Set(learningPaths.map(p => p.subject)).size >= 2,
        criteria: 'Created paths in 2+ subjects'
      },
      {
        id: 'elite_scholar',
        name: 'Elite Scholar',
        desc: 'Accumulate over 400 total XP points across your journey.',
        icon: '🌟',
        unlocked: xp >= 400,
        criteria: 'Reached 400+ Total XP'
      }
    ];

    const currentLevel = Math.floor(xp / 200) + 1;
    const nextLevelXP = 200;
    const currentLevelProgress = xp % 200;

    return {
      xp,
      masteredCount,
      completedProjectCount,
      completedStandardCount,
      badges: badgesList,
      currentLevel,
      nextLevelXP,
      currentLevelProgress
    };
  }, [performanceRecords, completedActivities, learningPaths, selectedPathId]);

  const [uploadedResources, setUploadedResources] = useState<UploadedResource[]>([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [integrateGlobalWebResources, setIntegrateGlobalWebResources] = useState<boolean>(true);

  // Sync subtopics state on subject change
  useEffect(() => {
    const subtopics = SUBJECT_SUBTOPICS[pathSubject] || [];
    const initial: Record<string, 'low' | 'medium' | 'high'> = {};
    subtopics.forEach(sub => {
      initial[sub] = 'medium';
    });
    setSubtopicConfidence(initial);
  }, [pathSubject]);

  // Auto-adjust subtopic confidence based on performance grades when enabled
  useEffect(() => {
    if (!autoAdjustFromPerformance) return;

    const subtopics = SUBJECT_SUBTOPICS[pathSubject] || [];
    setSubtopicConfidence(prev => {
      const updated = { ...prev };
      subtopics.forEach(sub => {
        const records = performanceRecords.filter(r => r.subtopic === sub);
        if (records.length > 0) {
          const total = records.reduce((sum, r) => sum + r.score, 0);
          const avg = Math.round(total / records.length);
          if (avg < 60) {
            updated[sub] = 'low';
          } else if (avg < 80) {
            updated[sub] = 'medium';
          } else {
            updated[sub] = 'high';
          }
        }
      });
      return updated;
    });
  }, [performanceRecords, pathSubject, autoAdjustFromPerformance]);

  // Real-time Firestore or LocalStorage sync
  useEffect(() => {
    if (!profile?.uid) {
      // If offline sandbox, load from localStorage
      const saved = localStorage.getItem('offline_personalized_learning_paths');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setLearningPaths(parsed);
          if (parsed.length > 0) {
            setSelectedPathId(parsed[0].id || '');
          }
        } catch (e) {}
      }
      return;
    }

    const q = query(
      collection(db, 'personalizedLearningPaths'),
      where('userId', '==', profile.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const paths: PersonalizedLearningPath[] = [];
        snapshot.forEach((docSnap) => {
          paths.push({
            id: docSnap.id,
            ...docSnap.data()
          } as PersonalizedLearningPath);
        });
        paths.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        setLearningPaths(paths);
        if (paths.length > 0 && !selectedPathId) {
          setSelectedPathId(paths[0].id || '');
        }
      },
      (err) => {
        console.error("Error reading personalized learning paths:", err);
      }
    );

    return () => unsubscribe();
  }, [profile?.uid]);

  // Sync completed activities for interactive checkboxes
  useEffect(() => {
    const saved = localStorage.getItem('completed_activities_v1');
    if (saved) {
      try {
        setCompletedActivities(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const toggleActivityCompletion = (activityId: string) => {
    setCompletedActivities(prev => {
      const updated = { ...prev, [activityId]: !prev[activityId] };
      localStorage.setItem('completed_activities_v1', JSON.stringify(updated));
      return updated;
    });
  };

  // Fetch all students' paths to identify matches
  useEffect(() => {
    if (!profile?.uid) {
      // Simulate some paths for offline sandbox mode so the peer-matcher is immediately useful
      const mockPaths: PersonalizedLearningPath[] = [
        {
          id: 'mock-path-1',
          userId: 'offline-sandbox-student-1',
          subject: 'Physics',
          title: 'Forces & Motion Master',
          description: 'A customized pathway for Physics mechanics',
          knowledgeLevel: 'Advanced',
          objectives: '',
          estimatedDuration: '4 hours',
          skillsTargeted: [],
          topics: [],
          recommendedResources: [],
          activities: [],
          subtopicConfidence: {
            'Kinematics (Velocity & Acceleration)': 'high',
            'Newtonian Dynamics & Forces': 'high',
            'Work, Energy & Power': 'low'
          }
        },
        {
          id: 'mock-path-2',
          userId: 'offline-sandbox-student-2',
          subject: 'Mathematics',
          title: 'Algebra Specialist',
          description: 'Pathway focusing on polynomial equations and algebraic methods',
          knowledgeLevel: 'Advanced',
          objectives: '',
          estimatedDuration: '6 hours',
          skillsTargeted: [],
          topics: [],
          recommendedResources: [],
          activities: [],
          subtopicConfidence: {
            'Algebra & Equations': 'high',
            'Coordinate Geometry': 'low',
            'Probability & Statistics': 'high'
          }
        },
        {
          id: 'mock-path-3',
          userId: 'offline-sandbox-student-3',
          subject: 'Physics',
          title: 'Waves & Electricity Study Path',
          description: 'Personalized curriculum targeting wave theory and optical principles',
          knowledgeLevel: 'Beginner',
          objectives: '',
          estimatedDuration: '5 hours',
          skillsTargeted: [],
          topics: [],
          recommendedResources: [],
          activities: [],
          subtopicConfidence: {
            'Kinematics (Velocity & Acceleration)': 'low',
            'Newtonian Dynamics & Forces': 'low',
            'Work, Energy & Power': 'medium',
            'Waves & Optics': 'high',
            'Electricity & Magnetism': 'low'
          }
        }
      ];
      setAllStudentsPaths(mockPaths);
      return;
    }

    // Real-time listen to ALL paths across all users to find matching tutors or learners
    const qAll = query(collection(db, 'personalizedLearningPaths'));
    const unsubscribe = onSnapshot(qAll, (snapshot) => {
      const paths: PersonalizedLearningPath[] = [];
      snapshot.forEach((docSnap) => {
        paths.push({
          id: docSnap.id,
          ...docSnap.data()
        } as PersonalizedLearningPath);
      });
      setAllStudentsPaths(paths);
    }, (err) => {
      console.warn("Could not query all paths directly. Generating dynamic pool for peer matchmaking.");
      const mockPaths: PersonalizedLearningPath[] = [
        {
          id: 'mock-path-1',
          userId: 'offline-sandbox-student-1',
          subject: 'Physics',
          title: 'Forces & Motion Master',
          description: 'A customized pathway for Physics mechanics',
          knowledgeLevel: 'Advanced',
          objectives: '',
          estimatedDuration: '4 hours',
          skillsTargeted: [],
          topics: [],
          recommendedResources: [],
          activities: [],
          subtopicConfidence: {
            'Kinematics (Velocity & Acceleration)': 'high',
            'Newtonian Dynamics & Forces': 'high',
            'Work, Energy & Power': 'low'
          }
        },
        {
          id: 'mock-path-2',
          userId: 'offline-sandbox-student-2',
          subject: 'Mathematics',
          title: 'Algebra Specialist',
          description: 'Pathway focusing on polynomial equations and algebraic methods',
          knowledgeLevel: 'Advanced',
          objectives: '',
          estimatedDuration: '6 hours',
          skillsTargeted: [],
          topics: [],
          recommendedResources: [],
          activities: [],
          subtopicConfidence: {
            'Algebra & Equations': 'high',
            'Coordinate Geometry': 'low',
            'Probability & Statistics': 'high'
          }
        },
        {
          id: 'mock-path-3',
          userId: 'offline-sandbox-student-3',
          subject: 'Physics',
          title: 'Waves & Electricity Study Path',
          description: 'Personalized curriculum targeting wave theory and optical principles',
          knowledgeLevel: 'Beginner',
          objectives: '',
          estimatedDuration: '5 hours',
          skillsTargeted: [],
          topics: [],
          recommendedResources: [],
          activities: [],
          subtopicConfidence: {
            'Kinematics (Velocity & Acceleration)': 'low',
            'Newtonian Dynamics & Forces': 'low',
            'Work, Energy & Power': 'medium',
            'Waves & Optics': 'high',
            'Electricity & Magnetism': 'low'
          }
        }
      ];
      setAllStudentsPaths(mockPaths);
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  // Sync tutoring connections
  useEffect(() => {
    if (!profile?.uid) {
      const saved = localStorage.getItem('local_peer_tutoring_connections');
      if (saved) {
        try {
          setTutoringConnections(JSON.parse(saved));
        } catch (e) {}
      }
      return;
    }

    const qAll = query(collection(db, 'peerTutoringConnections'));
    const unsubscribe = onSnapshot(qAll, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.senderId === profile.uid || data.receiverId === profile.uid) {
          list.push({ id: docSnap.id, ...data });
        }
      });
      setTutoringConnections(list);
    }, (err) => {
      console.warn("Could not query peer connections directly. Initializing local sandbox storage.", err);
      const saved = localStorage.getItem('local_peer_tutoring_connections');
      if (saved) {
        try {
          setTutoringConnections(JSON.parse(saved));
        } catch (e) {}
      }
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  const handleCreateTutoringConnection = async (targetUserId: string, targetUserName: string, subtopic: string, subject: string, anonymous: boolean) => {
    const newConn = {
      senderId: profile?.uid || 'offline-sandbox-student-uid',
      senderName: profile?.displayName || 'Sandbox Student',
      receiverId: targetUserId,
      receiverName: targetUserName,
      subtopic,
      subject,
      status: 'pending',
      anonymous,
      createdAt: new Date().toISOString()
    };

    if (!profile?.uid) {
      const updated = [ { id: `conn-${Date.now()}`, ...newConn }, ...tutoringConnections ];
      setTutoringConnections(updated);
      localStorage.setItem('local_peer_tutoring_connections', JSON.stringify(updated));
      return;
    }

    try {
      await addDoc(collection(db, 'peerTutoringConnections'), cleanUndefined(newConn));
    } catch (err) {
      console.error("Error creating peer tutoring connection in Firestore:", err);
      const updated = [ { id: `conn-${Date.now()}`, ...newConn }, ...tutoringConnections ];
      setTutoringConnections(updated);
      localStorage.setItem('local_peer_tutoring_connections', JSON.stringify(updated));
    }
  };

  const handleUpdateTutoringConnectionStatus = async (connId: string, nextStatus: 'accepted' | 'completed') => {
    if (!profile?.uid || connId.startsWith('conn-')) {
      const updated = tutoringConnections.map(c => c.id === connId ? { ...c, status: nextStatus } : c);
      setTutoringConnections(updated);
      localStorage.setItem('local_peer_tutoring_connections', JSON.stringify(updated));
      return;
    }

    try {
      await setDoc(doc(db, 'peerTutoringConnections', connId), { status: nextStatus }, { merge: true });
    } catch (err) {
      console.error("Error updating connection status:", err);
      const updated = tutoringConnections.map(c => c.id === connId ? { ...c, status: nextStatus } : c);
      setTutoringConnections(updated);
    }
  };

  // Fetch uploaded resources (File Library documents) in real-time
  useEffect(() => {
    // If we have a uid, we fetch by user. Otherwise we fetch all resources to make sure it works in the preview sandbox!
    const q = profile?.uid 
      ? query(collection(db, 'uploadedResources'), where('userId', '==', profile.uid))
      : query(collection(db, 'uploadedResources'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const resources: UploadedResource[] = [];
        snapshot.forEach((docSnap) => {
          resources.push({
            id: docSnap.id,
            ...docSnap.data()
          } as UploadedResource);
        });
        resources.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        setUploadedResources(resources);
      },
      (err) => {
        console.error("Error reading uploaded resources for learning path:", err);
      }
    );

    return () => unsubscribe();
  }, [profile?.uid]);

  // Auto-select resources whose subject matches the pathSubject
  useEffect(() => {
    if (uploadedResources.length > 0) {
      const matched = uploadedResources
        .filter(r => r.subject?.toLowerCase() === pathSubject.toLowerCase())
        .map(r => r.id);
      setSelectedResourceIds(matched);
    } else {
      setSelectedResourceIds([]);
    }
  }, [pathSubject, uploadedResources]);

  const toggleResourceSelection = (resId: string) => {
    setSelectedResourceIds(prev => 
      prev.includes(resId) 
        ? prev.filter(id => id !== resId) 
        : [...prev, resId]
    );
  };

  const handleGeneratePersonalizedPath = async () => {
    if (!pathSubject || !pathKnowledgeLevel || !pathObjectives.trim()) {
      setPathError("Please specify a subject, your knowledge level, and learning objectives.");
      return;
    }

    setIsGeneratingPath(true);
    setPathError(null);

    const chosenResources = uploadedResources
      .filter(r => selectedResourceIds.includes(r.id))
      .map(r => ({
        id: r.id,
        title: r.fileName,
        type: r.fileType || 'Document',
        url: r.downloadUrl || '#',
        description: r.extractedText ? r.extractedText.slice(0, 300) + '...' : 'Class Library study document.'
      }));

    try {
      const response = await fetch('/api/generate-learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: pathSubject,
          knowledgeLevel: pathKnowledgeLevel,
          objectives: pathObjectives.trim(),
          additionalInfo: pathAdditionalInfo.trim(),
          availableResources: chosenResources,
          integrateGlobalWebResources,
          subtopicConfidence,
          performanceRecords: performanceRecords.filter(r => SUBJECT_SUBTOPICS[pathSubject]?.includes(r.subtopic))
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate your personalized learning path.");
      }

      const generatedData: PersonalizedLearningPath = await response.json();
      const pathId = `path-${Date.now()}`;
      
      const newPath: PersonalizedLearningPath = {
        ...generatedData,
        id: pathId,
        subject: pathSubject,
        knowledgeLevel: pathKnowledgeLevel,
        objectives: pathObjectives.trim(),
        additionalInfo: pathAdditionalInfo.trim(),
        createdAt: new Date().toISOString(),
        userId: profile?.uid || 'anonymous-sandbox',
        subtopicConfidence
      };

      if (profile?.uid) {
        // Save to Firestore
        await setDoc(doc(db, 'personalizedLearningPaths', pathId), newPath);
        setSelectedPathId(pathId);
      } else {
        // Save to LocalStorage for sandbox/offline
        const updatedPaths = [newPath, ...learningPaths];
        setLearningPaths(updatedPaths);
        localStorage.setItem('offline_personalized_learning_paths', JSON.stringify(updatedPaths));
        setSelectedPathId(pathId);
      }

      // Reset form fields
      setPathObjectives('');
      setPathAdditionalInfo('');

    } catch (err: any) {
      console.error("Path generation error:", err);
      setPathError(err.message || "An unexpected error occurred during learning path generation.");
    } finally {
      setIsGeneratingPath(false);
    }
  };

  const handleAdaptActivePath = async (activePath: PersonalizedLearningPath) => {
    if (!activePath.id) return;
    setIsAdaptingActivePath(true);
    setPathError(null);

    const chosenResources = uploadedResources
      .filter(r => selectedResourceIds.includes(r.id))
      .map(r => ({
        id: r.id,
        title: r.fileName,
        type: r.fileType || 'Document',
        url: r.downloadUrl || '#',
        description: r.extractedText ? r.extractedText.slice(0, 300) + '...' : 'Class Library study document.'
      }));

    const recalibrationContext = `DYNAMIC SYLLABUS RE-CALIBRATION: Please preserve the main theme/title of this path: "${activePath.title}". Restructure the difficulty levels, study hours, and specific student activities dynamically. Incorporate remediation guides/hints for weak areas (low scores/confidence) and advanced real-world challenge tasks for strong areas (high scores/confidence). Target: ${activePath.objectives}.`;

    try {
      const response = await fetch('/api/generate-learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: activePath.subject,
          knowledgeLevel: activePath.knowledgeLevel,
          objectives: activePath.objectives,
          additionalInfo: recalibrationContext,
          availableResources: chosenResources,
          integrateGlobalWebResources,
          subtopicConfidence,
          performanceRecords: performanceRecords.filter(r => SUBJECT_SUBTOPICS[activePath.subject]?.includes(r.subtopic))
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to recalibrate active learning path.");
      }

      const generatedData: PersonalizedLearningPath = await response.json();
      
      const updatedPath: PersonalizedLearningPath = {
        ...activePath,
        title: generatedData.title || activePath.title,
        description: generatedData.description || activePath.description,
        estimatedDuration: generatedData.estimatedDuration || activePath.estimatedDuration,
        skillsTargeted: generatedData.skillsTargeted || activePath.skillsTargeted,
        topics: generatedData.topics || activePath.topics,
        recommendedResources: generatedData.recommendedResources || activePath.recommendedResources,
        activities: generatedData.activities || activePath.activities,
        subtopicConfidence: { ...subtopicConfidence }
      };

      if (profile?.uid) {
        await setDoc(doc(db, 'personalizedLearningPaths', activePath.id), updatedPath);
      } else {
        const updatedPaths = learningPaths.map(p => p.id === activePath.id ? updatedPath : p);
        setLearningPaths(updatedPaths);
        localStorage.setItem('offline_personalized_learning_paths', JSON.stringify(updatedPaths));
      }

      alert("Successfully recalibrated and adapted your active learning path based on your latest performance grades!");

    } catch (err: any) {
      console.error("Path adaptation error:", err);
      alert(err.message || "Failed to adapt active learning path.");
    } finally {
      setIsAdaptingActivePath(false);
    }
  };

  const handleDeleteLearningPath = async (pathId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this learning path?")) return;

    try {
      if (profile?.uid) {
        await deleteDoc(doc(db, 'personalizedLearningPaths', pathId));
      } else {
        const updated = learningPaths.filter(p => p.id !== pathId);
        setLearningPaths(updated);
        localStorage.setItem('offline_personalized_learning_paths', JSON.stringify(updated));
      }

      if (selectedPathId === pathId) {
        setSelectedPathId('');
      }
    } catch (err) {
      console.error("Error deleting learning path:", err);
      alert("Failed to delete the learning path.");
    }
  };

  return (
    <div className="flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto pr-1">
      {/* Top Navigation Switcher */}
      <div className="flex items-center justify-between bg-white border border-[#e5e1da] rounded-2xl p-2 shadow-xs shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setWorkspaceMode('adaptive')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
              workspaceMode === 'adaptive'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>AI Adaptive Path Generator</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase">
              SM-2 Active
            </span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceMode('planner')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
              workspaceMode === 'planner'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-500" />
            <span>Custom Journey Planner</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold">
              {learningPaths.length} Saved
            </span>
          </button>
        </div>
      </div>

      {workspaceMode === 'adaptive' && (
        <AdaptivePathGenerator
          flashcardDecks={Object.values(cachedFlashcardDecks)}
          savedDocuments={userSavedDocs}
          onOpenFlashcardModal={(deck) => {
            setActiveFlashcardDeck(deck);
            setIsFlashcardModalOpen(true);
          }}
          onSaveToPersonalizedPaths={(newPath) => {
            setLearningPaths(prev => [newPath, ...prev]);
            if (newPath.id) setSelectedPathId(newPath.id);
            setWorkspaceMode('planner');
          }}
        />
      )}

      {workspaceMode === 'planner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
      {/* Left panel: Form and History list - 4 Columns */}
      <div className="lg:col-span-4 flex flex-col gap-4 bg-white border border-[#e5e1da] rounded-2xl p-5 shadow-xs overflow-y-auto max-h-full">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Compass className="w-5 h-5 text-[#5f6f52]" />
            <h3 className="font-serif font-bold text-sm text-slate-800">Journey Planner</h3>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Provide your level and goals. Socratic AI will formulate a step-by-step roadmap tailored specifically for you.
          </p>
        </div>

        <hr className="border-slate-100" />

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Subject Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">1. Select Subject</label>
            <select
              value={pathSubject}
              onChange={(e) => setPathSubject(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-[#5f6f52] focus:bg-white transition"
            >
              <option value="Physics">Physics</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="General Science">General Science</option>
              <option value="Languages & Literature">Languages & Literature</option>
              <option value="History & Geography">History & Geography</option>
            </select>
          </div>

          {/* Current Knowledge Level Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">2. Current Knowledge Level</label>
            <div className="space-y-1.5">
              {[
                { value: 'Novice', label: 'Novice', desc: 'Completely new to this subject' },
                { value: 'Beginner', label: 'Beginner', desc: 'Familiar with basic terms & definitions' },
                { value: 'Intermediate', label: 'Intermediate', desc: 'Can solve standard problems' },
                { value: 'Proficient', label: 'Proficient', desc: 'Solid conceptual understanding' },
                { value: 'Advanced', label: 'Advanced', desc: 'Seeking ultimate mastery' }
              ].map((lvl) => (
                <label
                  key={lvl.value}
                  onClick={() => setPathKnowledgeLevel(lvl.value)}
                  className={`flex flex-col p-2.5 rounded-xl border transition cursor-pointer text-left ${
                    pathKnowledgeLevel === lvl.value
                      ? 'border-[#5f6f52] bg-[#5f6f52]/5 text-[#5f6f52]'
                      : 'border-slate-150 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span className="text-xs font-bold">{lvl.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{lvl.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sub-topic Performance & Confidence Hub */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-600">3. Performance & Confidence Hub</label>
              
              {/* Auto-tuning Protocol Toggle */}
              <button
                type="button"
                onClick={() => setAutoAdjustFromPerformance(!autoAdjustFromPerformance)}
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition flex items-center gap-1 cursor-pointer select-none ${
                  autoAdjustFromPerformance 
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
                title="When active, the system automatically uses your test grades to set your confidence level."
              >
                <Activity className="w-2.5 h-2.5" />
                <span>{autoAdjustFromPerformance ? 'Auto-Tuned: ON' : 'Auto-Tuned: OFF'}</span>
              </button>
            </div>
            
            <p className="text-[10px] text-slate-400 mb-2.5 leading-tight">
              Log your quiz scores/assignment grades. Socratic AI will prioritize weak performance areas and fast-track high-scoring ones.
            </p>

            <div className="space-y-3.5 border border-slate-100 rounded-xl p-3 bg-slate-50/40">
              {(SUBJECT_SUBTOPICS[pathSubject] || []).map((subtopic) => {
                const currentConfidence = subtopicConfidence[subtopic] || 'medium';
                const relatedRecords = performanceRecords.filter(r => r.subtopic === subtopic);
                const avgScore = relatedRecords.length > 0 
                  ? Math.round(relatedRecords.reduce((sum, r) => sum + r.score, 0) / relatedRecords.length) 
                  : null;

                return (
                  <div key={subtopic} className="flex flex-col gap-1.5 pb-2.5 last:pb-0 last:border-b-0 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-700 leading-tight">{subtopic}</span>
                      
                      {/* Log score button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (showAddScoreForSubtopic === subtopic) {
                            setShowAddScoreForSubtopic(null);
                          } else {
                            setShowAddScoreForSubtopic(subtopic);
                            setNewScoreValue(80);
                            setNewScoreType('Quiz');
                          }
                        }}
                        className="text-[9px] font-bold text-slate-500 hover:text-[#5f6f52] flex items-center gap-0.5 shrink-0 transition"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>Log Grade</span>
                      </button>
                    </div>

                    {/* Inline score log form */}
                    {showAddScoreForSubtopic === subtopic && (
                      <div className="bg-white border border-slate-200 rounded-xl p-2.5 my-1 space-y-2 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase">New Assessment Result</span>
                          <button 
                            type="button" 
                            onClick={() => setShowAddScoreForSubtopic(null)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8px] font-black uppercase text-slate-400 mb-0.5">Score (0-100)</label>
                            <input 
                              type="number"
                              min="0"
                              max="100"
                              value={newScoreValue}
                              onChange={(e) => setNewScoreValue(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-[#5f6f52]"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-black uppercase text-slate-400 mb-0.5">Assessment Type</label>
                            <select
                              value={newScoreType}
                              onChange={(e) => setNewScoreType(e.target.value as any)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-[#5f6f52]"
                            >
                              <option value="Quiz">Quiz</option>
                              <option value="Assignment">Assignment</option>
                              <option value="Exam">Exam</option>
                              <option value="Homework">Homework</option>
                            </select>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddPerformanceRecord(subtopic)}
                          className="w-full py-1 bg-[#5f6f52] hover:bg-[#4d5a42] text-white rounded-lg text-[9px] font-bold transition flex items-center justify-center gap-1"
                        >
                          Save Record
                        </button>
                      </div>
                    )}

                    {/* Logged assessment list */}
                    {relatedRecords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {relatedRecords.map((rec) => {
                          let scoreColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                          if (rec.score < 60) scoreColor = 'bg-red-50 text-red-700 border-red-100';
                          else if (rec.score < 80) scoreColor = 'bg-amber-50 text-amber-700 border-amber-100';
                          return (
                            <span 
                              key={rec.id}
                              className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-1 leading-none ${scoreColor}`}
                            >
                              <span className="opacity-75">{rec.type}:</span>
                              <span>{rec.score}%</span>
                              <button
                                type="button"
                                onClick={() => handleDeletePerformanceRecord(rec.id)}
                                className="opacity-60 hover:opacity-100 text-slate-400 hover:text-rose-600 transition ml-0.5"
                                title="Delete score"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Average & confidence indicator */}
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <div className="flex items-center gap-1 shrink-0">
                        {avgScore !== null ? (
                          <div className="flex items-center gap-1 text-[9px] text-slate-500 font-semibold">
                            <span className="text-[8px] uppercase tracking-wider text-slate-400">Avg Grade:</span>
                            <span className={`font-bold ${avgScore < 60 ? 'text-red-600' : avgScore < 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {avgScore}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-400 italic">No grades logged yet</span>
                        )}
                      </div>

                      {autoAdjustFromPerformance && avgScore !== null && (
                        <div className="flex items-center gap-1 text-[9.5px] text-indigo-600 font-bold bg-indigo-50/50 px-1.5 py-0.2 rounded border border-indigo-100">
                          <Activity className="w-2.5 h-2.5" />
                          <span>Auto-set</span>
                        </div>
                      )}
                    </div>

                    {/* Confidence selector buttons */}
                    <div className="flex gap-1 mt-1">
                      {[
                        { value: 'low', label: 'Low', color: 'text-red-600 border-red-200 bg-red-50/40', activeColor: 'bg-red-500 text-white border-red-500 hover:bg-red-600' },
                        { value: 'medium', label: 'Medium', color: 'text-amber-600 border-amber-200 bg-amber-50/40', activeColor: 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600' },
                        { value: 'high', label: 'High', color: 'text-emerald-600 border-emerald-200 bg-emerald-50/40', activeColor: 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600' }
                      ].map((btn) => {
                        const isActive = currentConfidence === btn.value;
                        return (
                          <button
                            key={btn.value}
                            type="button"
                            disabled={autoAdjustFromPerformance && avgScore !== null}
                            onClick={() => setSubtopicConfidence(prev => ({ ...prev, [subtopic]: btn.value as any }))}
                            className={`flex-1 py-1 text-[9px] font-bold rounded-lg border text-center transition select-none ${
                              isActive 
                                ? btn.activeColor 
                                : `${btn.color} hover:bg-white`
                            } ${
                              autoAdjustFromPerformance && avgScore !== null 
                                ? 'opacity-85 cursor-not-allowed' 
                                : 'cursor-pointer'
                            }`}
                            title={autoAdjustFromPerformance && avgScore !== null ? "Calculated automatically by auto-tune protocol. Toggle ON/OFF to modify." : "Rate confidence"}
                          >
                            {btn.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Low-Difficulty Supportive Flashcard Activity Trigger */}
                    {currentConfidence === 'low' && (
                      <div className="mt-2.5 bg-amber-50/80 border border-amber-200/90 rounded-xl p-2.5 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            Supportive Flashcards
                          </span>
                          <span className="text-[8px] font-extrabold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                            Foundational
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-900/80 leading-tight">
                          Low confidence detected. System dynamically offers low-difficulty recall flashcards to build entry topic confidence.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleGenerateOrPracticeSupportiveFlashcards(pathSubject, 'Entry Topic', subtopic)}
                          disabled={generatingFlashcardSubtopic === subtopic}
                          className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-lg text-[10px] flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                        >
                          {generatingFlashcardSubtopic === subtopic ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Generating Flashcards...</span>
                            </>
                          ) : (
                            <>
                              <Layers className="w-3.5 h-3.5" />
                              <span>Practice Low-Difficulty Flashcards</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Learning Objectives Input */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">4. Desired Learning Objectives</label>
            <textarea
              value={pathObjectives}
              onChange={(e) => setPathObjectives(e.target.value)}
              placeholder="e.g., I want to master Newtonian force balance and draw perfect free-body diagrams to prepare for the term exam."
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#5f6f52] focus:bg-white transition resize-none"
            />
          </div>

          {/* Additional Context Input */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">5. Preferences & Context (Optional)</label>
            <input
              type="text"
              value={pathAdditionalInfo}
              onChange={(e) => setPathAdditionalInfo(e.target.value)}
              placeholder="e.g., Prefer interactive labs, study 2 hours a day"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#5f6f52] focus:bg-white transition"
            />
          </div>

          {/* Teacher-Approved Content Integration */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600">6. Ground with Verified Resources</label>
            <p className="text-[10px] text-slate-400 leading-normal">
              Back your study path with curated, teacher-approved file downloads and global educational databases.
            </p>

            {/* Global Web Resources Integration Toggle */}
            <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-150 bg-slate-50/30 hover:bg-slate-50 transition text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={integrateGlobalWebResources}
                onChange={(e) => setIntegrateGlobalWebResources(e.target.checked)}
                className="rounded text-[#5f6f52] focus:ring-[#5f6f52] border-slate-300 w-3.5 h-3.5 cursor-pointer accent-[#5f6f52]"
              />
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#5f6f52]" />
                <span className="font-semibold text-slate-700">Scan & Suggest Global Web Resources</span>
              </div>
            </label>

            {/* File Library List */}
            <div className="space-y-1.5 border border-slate-150 rounded-xl p-2 bg-slate-50/10">
              <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-500">File Library Documents</span>
                <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-500 font-semibold">
                  {uploadedResources.length} available
                </span>
              </div>

              {uploadedResources.length === 0 ? (
                <div className="p-3 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-[10px] bg-white">
                  No files found in File Library. Switch to Socratic Conversation to upload your course materials.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {uploadedResources.map((res) => {
                    const isSelected = selectedResourceIds.includes(res.id);
                    const isSubjectMatch = res.subject?.toLowerCase() === pathSubject.toLowerCase();
                    return (
                      <div
                        key={res.id}
                        onClick={() => toggleResourceSelection(res.id)}
                        className={`group w-full p-2 rounded-xl border transition text-xs flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'border-[#5f6f52] bg-[#5f6f52]/5 text-[#5f6f52]'
                            : 'border-slate-150 bg-white hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded text-[#5f6f52] focus:ring-[#5f6f52] border-slate-300 w-3.5 h-3.5 cursor-pointer shrink-0 accent-[#5f6f52]"
                          />
                          <div className={`p-1 rounded-lg shrink-0 ${isSelected ? 'bg-[#5f6f52]/10 text-[#5f6f52]' : 'bg-slate-100 text-slate-400'}`}>
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold truncate text-[11px] leading-tight">{res.fileName}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {res.subject && (
                                <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded-sm leading-none ${
                                  isSubjectMatch ? 'bg-[#5f6f52]/10 text-[#5f6f52]' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  {res.subject}
                                </span>
                              )}
                              <span className="text-[8px] text-slate-400">
                                {new Date(res.uploadedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {isSubjectMatch && (
                          <span className="text-[8px] font-bold text-[#5f6f52] bg-[#5f6f52]/10 px-1.5 py-0.5 rounded-md shrink-0">
                            Subject Match
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          {pathError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-[11px] font-semibold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{pathError}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleGeneratePersonalizedPath}
            disabled={isGeneratingPath || !pathObjectives.trim()}
            className="w-full py-3 bg-[#5f6f52] hover:bg-[#4d5a42] text-white rounded-xl text-xs font-bold disabled:opacity-40 shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isGeneratingPath ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Personalizing Your Path...
              </>
            ) : (
              <>
                <Compass className="w-4 h-4" />
                Build My Learning Path
              </>
            )}
          </button>
        </div>

        <hr className="border-slate-100 my-1" />

        {/* Path History list */}
        <div className="flex flex-col gap-2 flex-1 min-h-0">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a9b388] flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-[#a9b388]" />
            Saved Learning Paths
          </span>

          {learningPaths.length === 0 ? (
            <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-[11px] text-slate-400">
              No pathways generated yet.
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[180px] pr-1">
              {learningPaths.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPathId(p.id || '')}
                  className={`group w-full p-2.5 rounded-xl text-left border transition text-xs flex items-center justify-between cursor-pointer ${
                    selectedPathId === p.id
                      ? 'border-[#5f6f52] bg-[#5f6f52]/5 text-[#5f6f52]'
                      : 'border-slate-150 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold truncate pr-1">{p.title}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {p.subject} • {p.knowledgeLevel}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteLearningPath(p.id || '', e)}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-1 transition rounded-md hover:bg-red-50 cursor-pointer shrink-0"
                    title="Delete Pathway"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel: Active Learning Path content display - 8 Columns */}
      <div className="lg:col-span-8 flex flex-col bg-white border border-[#e5e1da] rounded-2xl shadow-xs overflow-y-auto p-6 max-h-full">
        {isGeneratingPath ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 border-4 border-[#5f6f52]/10 rounded-full" />
              <div className="absolute inset-0 border-4 border-[#5f6f52] border-t-transparent rounded-full animate-spin" />
              <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-[#5f6f52] animate-pulse" />
            </div>
            <h4 className="font-serif font-bold text-base text-slate-800 mb-2">Formulating Personalized Learning Path</h4>
            <div className="max-w-md text-xs text-slate-400 space-y-1">
              <p className="animate-pulse">Curating pedagogical sequence based on standards...</p>
              <p className="text-[10px]">Evaluating current knowledge level: <span className="font-bold text-[#5f6f52]">{pathKnowledgeLevel}</span></p>
            </div>
          </div>
        ) : (() => {
          const activePath = learningPaths.find(p => p.id === selectedPathId);
          if (!activePath) {
            return (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-400 mb-4 shadow-sm">
                  <Compass className="w-8 h-8 text-[#a9b388]" />
                </div>
                <h4 className="font-serif font-bold text-base text-slate-800 mb-2">No Learning Path Active</h4>
                <p className="max-w-md text-xs text-slate-500 leading-relaxed">
                  Use the Planner on the left to configure your curriculum goals. Your personalized pathway will be mapped out here with all step-by-step topics, resources, and deliverable metrics.
                </p>
              </div>
            );
          }

          // Completed progress calculation
          const pathActivities = activePath.activities || [];
          const completedCount = pathActivities.filter(act => completedActivities[act.id]).length;
          const progressPercentage = pathActivities.length > 0 
            ? Math.round((completedCount / pathActivities.length) * 100) 
            : 0;

          return (
            <motion.div 
              key={selectedPathId}
              initial="hidden"
              animate="show"
              variants={containerVariants}
              className={`space-y-6 ${
                cosmicThemeActive 
                  ? 'bg-slate-950 text-slate-100 p-6 rounded-3xl border border-purple-500/25 shadow-[0_0_40px_rgba(147,51,234,0.12)] relative transition-all duration-500' 
                  : 'transition-all duration-500'
              }`}
            >
              {/* Header metadata */}
              <motion.div variants={itemVariants} className={`border-b pb-5 ${cosmicThemeActive ? 'border-purple-900/30' : 'border-slate-100'}`}>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[10px] bg-[#5f6f52]/10 text-[#5f6f52] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {activePath.subject}
                  </span>
                  <span className="text-[10px] bg-[#d4a373]/10 text-[#d4a373] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {activePath.knowledgeLevel} Level
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-500 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    ⏱️ {activePath.estimatedDuration}
                  </span>
                </div>
                
                <h2 className={`font-serif font-bold text-xl leading-tight mb-2 ${cosmicThemeActive ? 'text-purple-100' : 'text-slate-800'}`}>
                  {activePath.title}
                </h2>
                <p className={`text-xs leading-relaxed ${cosmicThemeActive ? 'text-purple-300/80' : 'text-slate-500'}`}>
                  {activePath.description}
                </p>
              </motion.div>

              {/* Gamified Mastery & Achievements Dashboard */}
              <motion.div 
                variants={itemVariants}
                className={`p-5 rounded-3xl border transition-all duration-500 relative overflow-hidden ${
                  cosmicThemeActive 
                    ? 'bg-slate-900/90 border-purple-500/40 text-purple-100 shadow-[0_0_20px_rgba(168,85,247,0.15)]' 
                    : 'bg-gradient-to-br from-[#fcfbf9] to-[#faf8f5] border-[#e5e1da] shadow-2xs'
                }`}
              >
                {/* Background ambient light */}
                <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-2xl pointer-events-none ${
                  cosmicThemeActive ? 'bg-purple-600/10' : 'bg-[#5f6f52]/5'
                }`} />

                {/* Top stats row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-5 border-b border-dashed border-slate-200/60 dark:border-purple-900/30">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Trophy className="w-6 h-6 text-amber-500 fill-amber-500/20" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${cosmicThemeActive ? 'text-purple-300' : 'text-slate-400'}`}>
                          Syllabus Mastery Level
                        </span>
                        <span className="flex items-center gap-0.5 text-[10px] font-extrabold bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          Level {computedStats.currentLevel}
                        </span>
                      </div>
                      <h3 className="font-serif font-black text-lg">
                        {profile?.displayName || "Socratic Scholar"}
                      </h3>
                    </div>
                  </div>

                  {/* XP Progress Bar */}
                  <div className="flex-1 max-w-sm space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className={cosmicThemeActive ? 'text-purple-300' : 'text-slate-500'}>
                        Level Progress
                      </span>
                      <span className="text-amber-500 font-extrabold">
                        {computedStats.xp} XP total
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-200 dark:bg-purple-950 rounded-full overflow-hidden p-[2px] border border-slate-300/40">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: `${(computedStats.currentLevelProgress / computedStats.nextLevelXP) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                      <span>Lv {computedStats.currentLevel}</span>
                      <span>{computedStats.currentLevelProgress} / {computedStats.nextLevelXP} XP to Lv {computedStats.currentLevel + 1}</span>
                      <span>Lv {computedStats.currentLevel + 1}</span>
                    </div>
                  </div>
                </div>

                {/* Milestone Badges Section */}
                <div className="pt-5 pb-5 border-b border-dashed border-slate-200/60 dark:border-purple-900/30">
                  <span className={`text-[10px] font-black uppercase tracking-widest block mb-4 ${cosmicThemeActive ? 'text-purple-300' : 'text-slate-400'}`}>
                    🏆 Earned Journey Milestone Badges
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {computedStats.badges.map((badge) => {
                      return (
                        <div 
                          key={badge.id}
                          className={`p-3.5 rounded-2xl border text-center relative flex flex-col items-center justify-between transition-all duration-300 group cursor-help ${
                            badge.unlocked 
                              ? cosmicThemeActive
                                ? 'bg-purple-950/20 border-purple-500/45 text-purple-100 hover:scale-105 shadow-md shadow-purple-500/5'
                                : 'bg-white border-[#e5e1da] hover:scale-105 shadow-2xs hover:shadow-xs'
                              : 'bg-slate-100/50 border-slate-200 text-slate-400 opacity-60'
                          }`}
                          title={`${badge.name}: ${badge.desc}\nStatus: ${badge.unlocked ? 'Unlocked!' : 'Locked'}`}
                        >
                          {/* Locked Indicator */}
                          {!badge.unlocked && (
                            <div className="absolute top-2 right-2 bg-slate-200 dark:bg-slate-800 p-0.5 rounded-full">
                              <Lock className="w-2.5 h-2.5 text-slate-400" />
                            </div>
                          )}
                          {badge.unlocked && (
                            <div className="absolute top-2 right-2 bg-emerald-100 dark:bg-emerald-950/50 p-0.5 rounded-full">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            </div>
                          )}

                          <span className={`text-3xl mb-2 filter transition-transform group-hover:scale-110 ${badge.unlocked ? '' : 'grayscale opacity-75'}`}>
                            {badge.icon}
                          </span>
                          <div>
                            <span className={`text-[11px] font-extrabold block leading-tight ${badge.unlocked ? 'text-slate-800 dark:text-purple-100' : 'text-slate-400'}`}>
                              {badge.name}
                            </span>
                            <span className="text-[8px] text-slate-400 block mt-0.5 leading-tight">
                              {badge.unlocked ? 'Unlocked' : badge.criteria}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Premium Rewards Vault Section */}
                <div className="pt-5">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Shield className="w-4 h-4 text-purple-500" />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${cosmicThemeActive ? 'text-purple-300' : 'text-slate-400'}`}>
                      🎁 Unlocked Premium Rewards & Privileges
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Reward 1: Cosmic Workspace Theme */}
                    <div className={`p-4 rounded-2xl border transition ${
                      computedStats.xp >= 100 
                        ? cosmicThemeActive
                          ? 'bg-purple-950/20 border-purple-500/40 text-purple-100'
                          : 'bg-white border-[#e5e1da]'
                        : 'bg-slate-50 border-slate-200 text-slate-400 opacity-75'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase">
                          <Palette className="w-3.5 h-3.5 text-purple-500" />
                          Cosmic View Theme
                        </span>
                        {computedStats.xp >= 100 ? (
                          <span className="text-[8px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-black uppercase">
                            Active
                          </span>
                        ) : (
                          <span className="text-[8px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                            Requires 100 XP
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight mb-3">
                        Transforms your Learning Workspace with an ultra-premium neon dark-mode cosmic theme.
                      </p>
                      {computedStats.xp >= 100 ? (
                        <button
                          onClick={() => {
                            const next = !cosmicThemeActive;
                            setCosmicThemeActive(next);
                            localStorage.setItem('gamified_cosmic_theme', String(next));
                          }}
                          className={`w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                            cosmicThemeActive 
                              ? 'bg-slate-800 hover:bg-slate-700 text-white border border-purple-500/20' 
                              : 'bg-purple-600 hover:bg-purple-700 text-white'
                          } cursor-pointer`}
                        >
                          {cosmicThemeActive ? 'Disable Theme' : 'Enable Theme'}
                        </button>
                      ) : (
                        <div className="w-full py-1.5 bg-slate-100 text-slate-400 text-center rounded-lg text-[10px] font-bold">
                          🔒 Locked
                        </div>
                      )}
                    </div>

                    {/* Reward 2: Advanced Socratic Coach */}
                    <div className={`p-4 rounded-2xl border transition ${
                      computedStats.xp >= 250 
                        ? cosmicThemeActive
                          ? 'bg-purple-950/20 border-purple-500/40 text-purple-100'
                          : 'bg-white border-[#e5e1da]'
                        : 'bg-slate-50 border-slate-200 text-slate-400 opacity-75'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase">
                          <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                          Socratic Deep-Coach
                        </span>
                        {computedStats.xp >= 250 ? (
                          <span className="text-[8px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-black uppercase">
                            Unlocked
                          </span>
                        ) : (
                          <span className="text-[8px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                            Requires 250 XP
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight mb-3">
                        Injects deep-probing, context-aware pedagogical prompts into Socratic AI interactions.
                      </p>
                      {computedStats.xp >= 250 ? (
                        <button
                          onClick={() => {
                            const next = !socraticCoachActive;
                            setSocraticCoachActive(next);
                            localStorage.setItem('gamified_socratic_coach', String(next));
                          }}
                          className={`w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                            socraticCoachActive 
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          } cursor-pointer`}
                        >
                          {socraticCoachActive ? 'Active Socratic Coach' : 'Enable Socratic Coach'}
                        </button>
                      ) : (
                        <div className="w-full py-1.5 bg-slate-100 text-slate-400 text-center rounded-lg text-[10px] font-bold">
                          🔒 Locked
                        </div>
                      )}
                    </div>

                    {/* Reward 3: Academic Excellence Certificate */}
                    <div className={`p-4 rounded-2xl border transition ${
                      computedStats.xp >= 400 
                        ? cosmicThemeActive
                          ? 'bg-purple-950/20 border-purple-500/40 text-purple-100'
                          : 'bg-white border-[#e5e1da]'
                        : 'bg-slate-50 border-slate-200 text-slate-400 opacity-75'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          Mastery Certificate
                        </span>
                        {computedStats.xp >= 400 ? (
                          <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black uppercase">
                            Available
                          </span>
                        ) : (
                          <span className="text-[8px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                            Requires 400 XP
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight mb-3">
                        Generates a beautiful physical certificate of syllabus mastery with your real scores and badges.
                      </p>
                      {computedStats.xp >= 400 ? (
                        <button
                          onClick={() => setShowCertificateModal(true)}
                          className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition shadow-xs cursor-pointer"
                        >
                          Generate Certificate
                        </button>
                      ) : (
                        <div className="w-full py-1.5 bg-slate-100 text-slate-400 text-center rounded-lg text-[10px] font-bold">
                          🔒 Locked
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
 
              {/* Skills Targeted */}
              {activePath.skillsTargeted && activePath.skillsTargeted.length > 0 && (
                <motion.div variants={itemVariants} className="bg-slate-50/55 border border-slate-150 rounded-2xl p-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-2.5">
                    Target Competencies & Skills
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activePath.skillsTargeted.map((skill, idx) => (
                      <span 
                        key={idx}
                        className="text-xs bg-white border border-slate-200 px-3 py-1 rounded-xl text-slate-600 font-medium shadow-2xs flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        {skill}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Self-Assessed Confidence Starting Point */}
              {activePath.subtopicConfidence && Object.keys(activePath.subtopicConfidence).length > 0 && (
                <motion.div variants={itemVariants} className="bg-slate-50/55 border border-slate-150 rounded-2xl p-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-2.5">
                    Your Self-Assessed Confidence Starting Point
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(activePath.subtopicConfidence).map(([sub, conf]) => {
                      let badgeColor = '';
                      if (conf === 'low') badgeColor = 'bg-red-50 text-red-700 border-red-200';
                      else if (conf === 'medium') badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                      else badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      return (
                        <div key={sub} className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl">
                          <span className="text-[11px] font-medium text-slate-600 truncate mr-2" title={sub}>{sub}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 capitalize ${badgeColor}`}>
                            {conf}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Peer Tutoring & Community Support Panel */}
              <motion.div variants={itemVariants} className="bg-white border border-[#e5e1da] rounded-2xl p-4 shadow-2xs relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl pointer-events-none" />
                
                <div className="flex items-center justify-between gap-4 mb-3 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-serif font-black uppercase tracking-wider text-slate-800">
                      EduNexus Peer-Tutor Matcher
                    </span>
                  </div>
                  <span className="text-[8px] bg-teal-50 text-teal-700 border border-teal-100 font-extrabold px-1.5 py-0.5 rounded-full uppercase leading-none">
                    Community Learning
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-normal mb-4">
                  Boost your grades and solidify your learning by connecting with peer tutors who have mastered complex syllabus topics, or by tutoring fellow classmates.
                </p>

                {/* Match Filter Buttons */}
                <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl mb-4">
                  <button
                    type="button"
                    onClick={() => setMatchingFilter('all')}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      matchingFilter === 'all' ? 'bg-white text-slate-800 shadow-3xs border border-slate-150' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All Matches
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchingFilter('tutors')}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      matchingFilter === 'tutors' ? 'bg-white text-slate-800 shadow-3xs border border-slate-150' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Find Tutors
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchingFilter('learners')}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      matchingFilter === 'learners' ? 'bg-white text-slate-800 shadow-3xs border border-slate-150' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Tutor Others
                  </button>
                </div>

                {/* Privacy & Identity Selection Toggle */}
                <div className="flex items-center justify-between gap-3 bg-slate-50/70 border border-slate-100 p-2.5 rounded-xl mb-4">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-700 flex items-center gap-1">
                      Identity Mode
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Choose whether to connect anonymously or directly.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConnectionAnonymous(!connectionAnonymous)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                      connectionAnonymous 
                        ? 'bg-purple-50 text-purple-700 border-purple-200' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {connectionAnonymous ? '🔒 Anonymous' : '👤 Direct Name'}
                  </button>
                </div>

                {/* Match Suggestions List */}
                <div className="space-y-2.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                    AI Suggested Connections
                  </span>

                  {peerTutoringMatches.length === 0 ? (
                    <div className="text-center py-4 bg-slate-50/40 rounded-xl border border-dashed border-slate-200">
                      <Sparkles className="w-5 h-5 text-slate-300 mx-auto mb-1" />
                      <span className="text-[10px] font-medium text-slate-400 block">
                        No matches found yet. Try adjusting your confidence starting levels!
                      </span>
                    </div>
                  ) : (() => {
                    // Apply filters
                    const filteredMatches = peerTutoringMatches.filter(m => {
                      if (matchingFilter === 'tutors') return m.type === 'tutor';
                      if (matchingFilter === 'learners') return m.type === 'learner';
                      return true;
                    });

                    if (filteredMatches.length === 0) {
                      return (
                        <div className="text-center py-4 bg-slate-50/40 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-medium text-slate-400 block">
                            No connections match the selected filter.
                          </span>
                        </div>
                      );
                    }

                    return filteredMatches.map((match, index) => {
                      const isConnected = tutoringConnections.some(
                        c => c.subtopic === match.subtopic && 
                             (c.senderId === match.peerUserId || c.receiverId === match.peerUserId)
                      );
                      const activeConn = tutoringConnections.find(
                        c => c.subtopic === match.subtopic && 
                             (c.senderId === match.peerUserId || c.receiverId === match.peerUserId)
                      );

                      return (
                        <div key={index} className="bg-slate-50/50 border border-slate-150 p-3 rounded-xl flex flex-col gap-2.5 hover:border-slate-300 transition">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className={`text-[8px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-full border inline-block mb-1.5 ${
                                match.type === 'tutor' 
                                  ? 'bg-blue-50 text-blue-700 border-blue-150' 
                                  : 'bg-orange-50 text-orange-700 border-orange-150'
                              }`}>
                                {match.type === 'tutor' ? '🤝 Potential Tutor Match' : '🎓 Student Needing Tutoring'}
                              </span>
                              <h5 className="text-[11px] font-bold text-slate-800 leading-snug">
                                {match.subtopic}
                              </h5>
                              <p className="text-[10px] text-slate-400">
                                Peer: <span className="font-semibold text-slate-600">
                                  {connectionAnonymous ? 'Anonymous Peer' : match.peerName}
                                </span>
                              </p>
                            </div>

                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border capitalize shrink-0 ${
                              match.peerConfidence === 'high' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                            }`}>
                              Confidence: {match.peerConfidence}
                            </span>
                          </div>

                          {/* Action Button / Status Display */}
                          <div className="flex items-center justify-end mt-1">
                            {isConnected ? (
                              <div className="flex items-center gap-1.5 text-[9px] font-extrabold px-2.5 py-1 rounded bg-teal-50 border border-teal-150 text-teal-700 uppercase tracking-wide">
                                <Check className="w-3 h-3" />
                                <span>Session {activeConn?.status}</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleCreateTutoringConnection(
                                  match.peerUserId,
                                  match.peerName,
                                  match.subtopic,
                                  activePath.subject,
                                  connectionAnonymous
                                )}
                                className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-3xs"
                              >
                                {match.type === 'tutor' ? 'Request Tutoring' : 'Offer Tutoring'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Your Active Connections */}
                {tutoringConnections.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-teal-600 block flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> Your Peer-Tutoring Registry
                    </span>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {tutoringConnections.map((conn) => {
                        const isLearner = conn.senderId === (profile?.uid || 'offline-sandbox-student-uid');
                        const partnerName = isLearner ? conn.receiverName : conn.senderName;
                        const partnerDisplayName = conn.anonymous ? 'Anonymous Peer' : partnerName;

                        return (
                          <div key={conn.id} className="bg-slate-50 border border-slate-150 p-2.5 rounded-xl flex items-center justify-between gap-3">
                            <div className="truncate mr-2">
                              <span className="text-[10px] font-bold text-slate-700 block truncate">
                                {conn.subtopic}
                              </span>
                              <span className="text-[9px] text-slate-400 block leading-none mt-0.5">
                                {isLearner ? `Tutor: ${partnerDisplayName}` : `Learner: ${partnerDisplayName}`}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {conn.status === 'pending' && !isLearner && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateTutoringConnectionStatus(conn.id, 'accepted')}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold rounded-md transition cursor-pointer"
                                >
                                  Accept
                                </button>
                              )}
                              {conn.status === 'accepted' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateTutoringConnectionStatus(conn.id, 'completed')}
                                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-bold rounded-md transition cursor-pointer"
                                >
                                  Complete
                                </button>
                              )}
                              <span className={`text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border leading-none ${
                                conn.status === 'pending' 
                                  ? 'bg-amber-50 text-amber-700 border-amber-100' 
                                  : conn.status === 'accepted' 
                                  ? 'bg-blue-50 text-blue-700 border-blue-100' 
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              }`}>
                                {conn.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Dynamic Adaptive Recalibration Protocol Panel */}
              <motion.div variants={itemVariants} className="bg-gradient-to-br from-indigo-50/40 via-white to-slate-50/30 border border-indigo-100 rounded-2xl p-4 shadow-xs relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2.5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700">
                      Dynamic Adaptive Alignment
                    </span>
                  </div>

                  <span className="text-[8px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-extrabold px-1.5 py-0.5 rounded-full uppercase leading-none">
                    Continuous feedback
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-normal mb-3">
                  Have your test scores or assignment grades updated? Re-align and adapt your active study topics and step-by-step activities dynamically based on your latest logged results.
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/60 border border-slate-100 p-3 rounded-xl mb-3">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block leading-none">Current Subject</span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 leading-none">
                      <span className="w-1.5 h-1.5 bg-[#5f6f52] rounded-full" />
                      {activePath.subject}
                    </span>
                  </div>
                  
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block leading-none">Logged Performance Grades</span>
                    <span className="text-xs font-mono font-bold text-indigo-600 leading-none">
                      {performanceRecords.filter(r => SUBJECT_SUBTOPICS[activePath.subject]?.includes(r.subtopic)).length} assessment records
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAdaptActivePath(activePath)}
                  disabled={isAdaptingActivePath}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold disabled:opacity-40 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs shadow-indigo-100"
                >
                  {isAdaptingActivePath ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Re-tuning sequence...</span>
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4" />
                      <span>Recalibrate & Adapt Active Syllabus</span>
                    </>
                  )}
                </button>
              </motion.div>
 
              {/* Interactive Progress Bar */}
              <motion.div variants={itemVariants} className="bg-slate-50/55 border border-slate-150 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
                    Pathway Progress Track
                  </span>
                  <span className="text-xs text-slate-600 font-semibold">
                     {completedCount} of {pathActivities.length} activities completed
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-1 sm:max-w-xs">
                  <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600 min-w-[35px] text-right">
                    {progressPercentage}%
                  </span>
                </div>
              </motion.div>
 
              {/* Topics breakdown */}
              <div>
                <motion.div variants={itemVariants} className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4.5 h-4.5 text-[#5f6f52]" />
                  <h4 className={`font-serif font-bold text-sm ${cosmicThemeActive ? 'text-purple-200' : 'text-slate-800'}`}>1. Suggested Study Syllabus</h4>
                </motion.div>

                <div className="space-y-3">
                  {activePath.topics && activePath.topics.map((topic, idx) => {
                    const matchedSubtopic = SUBJECT_SUBTOPICS[activePath.subject]?.find(
                      sub => topic.title.toLowerCase().includes(sub.toLowerCase()) || sub.toLowerCase().includes(topic.title.toLowerCase())
                    );
                    const subtopicAvg = matchedSubtopic 
                      ? (() => {
                          const records = performanceRecords.filter(r => r.subtopic === matchedSubtopic);
                          return records.length > 0 
                            ? Math.round(records.reduce((sum, r) => sum + r.score, 0) / records.length) 
                            : null;
                        })()
                      : null;

                    const isMastered = subtopicAvg !== null && subtopicAvg >= 80;

                    return (
                      <motion.div 
                        key={topic.id || idx}
                        variants={itemVariants}
                        className={`p-4 border rounded-2xl transition-all duration-300 shadow-2xs relative ${
                          cosmicThemeActive
                            ? subtopicAvg !== null && subtopicAvg < 60
                              ? 'border-red-500/40 bg-red-950/15 text-slate-100 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                              : isMastered
                              ? 'border-emerald-500/40 bg-emerald-950/15 text-slate-100 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                              : 'border-purple-500/20 bg-slate-900/60 text-slate-100'
                            : subtopicAvg !== null && subtopicAvg < 60 
                            ? 'border-red-200 bg-red-50/10 shadow-red-50/5 text-slate-800' 
                            : isMastered
                            ? 'border-emerald-200 bg-emerald-50/10 shadow-emerald-50/5 text-slate-800'
                            : 'border-[#e5e1da] bg-white text-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <span className={`text-xs font-extrabold leading-tight ${cosmicThemeActive ? 'text-purple-100' : 'text-slate-800'}`}>
                            {topic.title}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isMastered && (
                              <span className="text-[9px] bg-amber-500 text-white font-black px-2 py-0.5 rounded uppercase flex items-center gap-0.5 shadow-xs animate-bounce">
                                <Trophy className="w-2.5 h-2.5 fill-amber-305 text-amber-100" />
                                Mastered (+100 XP)
                              </span>
                            )}
                            {subtopicAvg !== null && (
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                subtopicAvg < 60 
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' 
                                  : subtopicAvg >= 80 
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' 
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                              }`}>
                                Grade: {subtopicAvg}%
                              </span>
                            )}
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                              cosmicThemeActive ? 'bg-purple-950/40 text-purple-300' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {topic.difficulty}
                            </span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                              cosmicThemeActive ? 'bg-purple-950/40 text-purple-300' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {topic.estimatedTime}
                            </span>
                          </div>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${cosmicThemeActive ? 'text-purple-200/80' : 'text-slate-500'}`}>
                          {topic.description}
                        </p>

                        {/* Adaptive Status Message */}
                        {subtopicAvg !== null && subtopicAvg < 60 && (
                          <div className={`rounded-xl p-2.5 flex items-start gap-1.5 mt-2.5 border ${
                            cosmicThemeActive 
                              ? 'bg-red-950/20 border-red-900/40 text-red-200' 
                              : 'bg-red-50 border-red-100 text-red-700'
                          }`}>
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                            <div className="text-[10px] leading-tight">
                              <span className="font-bold">Remediation Mode Engaged:</span> Your average grade of {subtopicAvg}% indicates concept gaps. Socratic AI has scaffolded basic reviews and foundational practice tasks.
                            </div>
                          </div>
                        )}

                        {subtopicAvg !== null && subtopicAvg >= 80 && (
                          <div className={`rounded-xl p-2.5 flex items-start gap-1.5 mt-2.5 border ${
                            cosmicThemeActive 
                              ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200' 
                              : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          }`}>
                            <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <div className="text-[10px] leading-tight">
                              <span className="font-bold">Fast-Track Enabled:</span> Proving high mastery (Avg: {subtopicAvg}%). Content has been streamlined with advanced projects to stretch your understanding.
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
 
              {/* recommendedResources */}
              <div>
                <motion.div variants={itemVariants} className="flex items-center gap-2 mb-3">
                  <Compass className="w-4.5 h-4.5 text-[#5f6f52]" />
                  <h4 className={`font-serif font-bold text-sm ${cosmicThemeActive ? 'text-purple-200' : 'text-slate-800'}`}>2. Hand-Picked Learning Resources</h4>
                </motion.div>
 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {activePath.recommendedResources && activePath.recommendedResources.map((res, idx) => {
                    const isLibraryFile = uploadedResources.some(
                      u => u.id === res.id || u.fileName === res.title || (res.url && u.downloadUrl === res.url)
                    );
                    return (
                      <motion.div 
                        key={res.id || idx}
                        variants={itemVariants}
                        className={`p-3.5 border rounded-2xl hover:border-slate-300 transition shadow-2xs flex flex-col justify-between ${
                          cosmicThemeActive
                            ? isLibraryFile 
                              ? 'bg-amber-950/20 border-amber-500/30' 
                              : 'bg-slate-900/60 border-purple-500/20'
                            : isLibraryFile 
                            ? 'bg-amber-50/15 border-amber-200 shadow-amber-50/10' 
                            : 'bg-white border-slate-150'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            {isLibraryFile ? (
                              <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-100 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <FileText className="w-2.5 h-2.5" />
                                Teacher-Approved File
                              </span>
                            ) : (
                              <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {res.type}
                              </span>
                            )}
                          </div>
                          <span className={`text-xs font-bold block mb-1.5 ${cosmicThemeActive ? 'text-purple-100' : 'text-slate-800'}`}>
                            {res.title}
                          </span>
                          <p className={`text-[11px] leading-relaxed mb-3 ${cosmicThemeActive ? 'text-purple-300/70' : 'text-slate-500'}`}>
                            {res.description}
                          </p>
                        </div>
 
                        <a 
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`self-start text-[10px] font-bold flex items-center gap-1 group/btn cursor-pointer mt-1 ${
                            cosmicThemeActive ? 'text-purple-400 hover:text-purple-300' : 'text-[#5f6f52] hover:text-[#4c5a42]'
                          }`}
                        >
                          <span>{isLibraryFile ? 'Download / View File' : 'Explore Resource'}</span>
                          <ExternalLink className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
                        </a>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
 
              {/* activities */}
              <div>
                <motion.div variants={itemVariants} className="flex items-center gap-2 mb-3">
                  <ListTodo className="w-4.5 h-4.5 text-[#5f6f52]" />
                  <h4 className={`font-serif font-bold text-sm ${cosmicThemeActive ? 'text-purple-200' : 'text-slate-800'}`}>3. Interactive Action Activities</h4>
                </motion.div>
 
                <div className="space-y-3">
                  {activePath.activities && activePath.activities.map((act, idx) => {
                    const isCompleted = completedActivities[act.id];
                    const isProject = isComplexProjectTask(act.title, act.description);
                    
                    return (
                      <motion.div 
                        key={act.id || idx}
                        variants={itemVariants}
                        animate={{
                          backgroundColor: isCompleted 
                            ? (cosmicThemeActive ? "rgba(168, 85, 247, 0.12)" : "rgba(240, 253, 244, 0.45)") 
                            : isProject
                            ? (cosmicThemeActive ? "rgba(245, 158, 11, 0.04)" : "rgba(245, 158, 11, 0.02)")
                            : (cosmicThemeActive ? "rgba(15, 23, 42, 0.4)" : "rgba(255, 255, 255, 1)"),
                          borderColor: isCompleted 
                            ? (cosmicThemeActive ? "rgba(168, 85, 247, 0.4)" : "rgb(167, 243, 208)") 
                            : isProject
                            ? "rgb(245, 158, 11)"
                            : (cosmicThemeActive ? "rgba(139, 92, 246, 0.2)" : "rgb(226, 232, 240)"),
                          scale: isCompleted ? 0.985 : 1,
                        }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className={`p-4 border rounded-2xl shadow-2xs flex gap-3.5 items-start transition-all relative overflow-hidden ${
                          isProject && !isCompleted ? 'ring-1 ring-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.06)]' : ''
                        }`}
                      >
                        {isProject && !isCompleted && (
                          <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/5 rounded-bl-full pointer-events-none flex items-center justify-end p-2.5">
                            <Star className="w-3.5 h-3.5 text-amber-500/20 fill-amber-500/10" />
                          </div>
                        )}

                        <AnimatedActivityCheckbox 
                          isCompleted={!!isCompleted} 
                          onToggle={() => toggleActivityCompletion(act.id)} 
                        />
 
                        <div className="space-y-2 flex-1 min-w-0">
                          <div>
                            {isProject ? (
                              <div className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-500 tracking-wider mb-0.5 animate-pulse">
                                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                                <span>Complex Real-World Project Task (+150 XP Reward)</span>
                              </div>
                            ) : (
                              <span className="text-[9px] font-extrabold uppercase text-[#d4a373] tracking-wider block mb-0.5">
                                Step {act.step} • Practice Task (+50 XP)
                              </span>
                            )}
                            <AnimatedStrikeText 
                              text={act.title} 
                              isCompleted={!!isCompleted} 
                              className={`text-xs font-bold leading-tight block transition-colors duration-300 ${
                                isCompleted 
                                  ? 'text-slate-400 dark:text-purple-300/40 font-medium' 
                                  : (cosmicThemeActive ? 'text-purple-100' : 'text-slate-800')
                              }`}
                            />
                          </div>
                          <p className={`text-[11px] leading-relaxed transition-colors duration-300 ${
                            isCompleted 
                              ? 'text-slate-400/80 dark:text-purple-300/30' 
                              : (cosmicThemeActive ? 'text-purple-200/80' : 'text-slate-500')
                          }`}>
                            {act.description}
                          </p>
                          
                          <div className={`rounded-xl p-2.5 flex items-start gap-2 border ${
                            cosmicThemeActive
                              ? 'bg-purple-950/20 border-purple-900/30 text-purple-300/80'
                              : 'bg-slate-50/80 border-slate-100 text-slate-500'
                          }`}>
                            <Award className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-[10px] leading-normal">
                              <span className={`font-bold block mb-0.5 ${cosmicThemeActive ? 'text-purple-200' : 'text-slate-600'}`}>Deliverable Output Metric:</span>
                              {act.deliverable}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* Dynamic Certificate of Academic Excellence Modal */}
        {showCertificateModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full border-8 border-double border-amber-500 shadow-2xl relative text-center text-slate-800"
            >
              <button 
                onClick={() => setShowCertificateModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Certificate Header Decoration */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Trophy className="w-16 h-16 text-amber-500 fill-amber-100" />
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400 absolute -top-1 -right-1 animate-bounce" />
                </div>
              </div>

              <span className="text-[10px] font-black tracking-widest uppercase text-amber-600 block mb-2">
                Honorary Certificate of Mastery
              </span>
              <h3 className="font-serif font-bold text-3xl text-slate-800 tracking-tight mb-4">
                EduNexus Academic Excellence
              </h3>

              <p className="text-xs text-slate-400 italic mb-6">
                This official certification is proudly presented to the learner
              </p>

              <div className="border-b-2 border-dashed border-slate-300 w-3/4 mx-auto pb-2 mb-6">
                <h4 className="font-serif font-black text-2xl text-slate-900">
                  {profile?.displayName || "Socratic Scholar"}
                </h4>
              </div>

              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed mb-6">
                For completing advanced studies, masterfully aligning with the official curriculum standards, and demonstrating outstanding problem-solving capability in 
                <strong className="text-slate-800"> {activeLearningPath?.subject || 'the Academic Syllabus'}</strong>.
              </p>

              {/* Path Title Badge */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl py-3 px-6 inline-block mb-8">
                <span className="text-[10px] font-black uppercase text-amber-700 tracking-widest block mb-1">
                  Completed Syllabus Pathway
                </span>
                <span className="text-xs font-bold text-slate-800">{activeLearningPath?.title}</span>
              </div>

              {/* Badges Unlocked Section */}
              <div className="mb-8">
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block mb-3">
                  Journey Milestone Badges Earned
                </span>
                <div className="flex justify-center gap-3">
                  {computedStats.badges.filter(b => b.unlocked).map(badge => (
                    <div key={badge.id} className="flex flex-col items-center">
                      <span className="text-2xl mb-1">{badge.icon}</span>
                      <span className="text-[9px] font-bold text-slate-700">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signature Area */}
              <div className="flex justify-between items-end px-12 text-left">
                <div>
                  <div className="border-b border-slate-300 w-32 pb-1 mb-1 font-serif text-xs italic text-slate-700 font-bold">
                    Socratic Tutor AI
                  </div>
                  <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">AI Mentor System</span>
                </div>
                <div className="text-right">
                  <div className="border-b border-slate-300 w-32 pb-1 mb-1 text-xs text-slate-700 font-bold font-mono">
                    {new Date().toLocaleDateString()}
                  </div>
                  <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Issue Date</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-3 mt-8 no-print">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Certificate</span>
                </button>
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  <span>Close</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )}

  {/* Flashcard Modal Player */}
  <FlashcardDeckModal
    deck={activeFlashcardDeck}
    isOpen={isFlashcardModalOpen}
    onClose={() => setIsFlashcardModalOpen(false)}
    onSaveToLibrary={handleSaveFlashcardsToLibrary}
    onComplete={handleFlashcardComplete}
    isLowDifficultySupport={true}
  />
</div>
  );
};
