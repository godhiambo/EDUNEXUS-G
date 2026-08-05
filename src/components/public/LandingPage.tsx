import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import DemoVideoModal from './DemoVideoModal';
import { 
  Sparkles, 
  BookOpen, 
  Compass, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Play, 
  Star, 
  Cpu, 
  Shield, 
  Globe, 
  TrendingUp, 
  Lock, 
  Mail, 
  Phone, 
  MapPin, 
  X, 
  ChevronDown,
  Layers,
  FileText,
  Video,
  BarChart3,
  Award,
  Zap,
  Tv,
  Gamepad2,
  Image as ImageIcon
} from 'lucide-react';

interface LandingPageProps {
  onChooseWorkspace: () => void;
  onOpenAuth: (role?: 'Teacher' | 'Student' | 'Parent' | 'Administrator') => void;
  onNavigateToShowcase: () => void;
  onOpenDemoSandbox: () => void;
  youtubeUrl?: string;
}

export default function LandingPage({
  onChooseWorkspace,
  onOpenAuth,
  onNavigateToShowcase,
  onOpenDemoSandbox,
  youtubeUrl = 'https://www.youtube.com/embed/D7cpYYgr-6E'
}: LandingPageProps) {
  const [showDemoVideoModal, setShowDemoVideoModal] = useState<boolean>(false);
  const [demoModalTab, setDemoModalTab] = useState<'video' | 'sandbox'>('video');
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'contact' | null>(null);
  const [solutionsDropdown, setSolutionsDropdown] = useState(false);

  const stats = [
    { value: '10,000+', label: 'Educators' },
    { value: '250K+', label: 'Students' },
    { value: '1M+', label: 'Lessons Created' },
    { value: '50+', label: 'Countries' },
    { value: '99%', label: 'Satisfaction Rate' },
  ];

  const whyChoose = [
    {
      icon: Cpu,
      title: 'AI-Powered Tools',
      desc: 'Save time and create smarter content in seconds with domain-optimized models.',
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      desc: 'Enterprise-grade security, Firestore encryption, and full data privacy protection.',
      color: 'text-teal-400 border-teal-500/30 bg-teal-500/10'
    },
    {
      icon: Globe,
      title: 'Accessible Anywhere',
      desc: 'Works seamlessly on all devices—desktops, tablets, phones, online and offline.',
      color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'
    },
    {
      icon: TrendingUp,
      title: 'Built for Impact',
      desc: 'Measurably improves learning outcomes, student retention, and teacher joy.',
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    }
  ];

  return (
    <div className="w-full bg-[#040a0f] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
      
      {/* PUBLIC TOP NAVIGATION BAR (Matching Left Side Image) */}
      <nav className="h-20 border-b border-slate-800/80 bg-[#06121a]/90 backdrop-blur-xl sticky top-0 z-50 px-4 sm:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)] group-hover:scale-105 transition">
            <Sparkles className="w-5 h-5 fill-emerald-400" />
          </div>
          <div>
            <span className="font-extrabold text-xl text-white tracking-tight group-hover:text-emerald-400 transition">EduNexus</span>
          </div>
        </div>

        {/* Center Nav Links */}
        <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-300">
          <a href="#hero" className="text-white hover:text-emerald-400 transition">Home</a>
          <a href="#features" className="hover:text-white transition">Features</a>
          
          {/* Solutions Dropdown */}
          <div className="relative" onMouseEnter={() => setSolutionsDropdown(true)} onMouseLeave={() => setSolutionsDropdown(false)}>
            <button className="flex items-center gap-1 hover:text-white transition cursor-pointer py-2">
              <span>Solutions</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {solutionsDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 w-64 p-3 bg-[#0a1b26] border border-slate-700/80 rounded-2xl shadow-2xl space-y-1 z-50"
                >
                  <button onClick={() => onOpenAuth('Teacher')} className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span>Teacher Workspace</span>
                  </button>
                  <button onClick={() => onOpenAuth('Student')} className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                    <Compass className="w-4 h-4 text-purple-400" />
                    <span>Student Workspace</span>
                  </button>
                  <button onClick={() => onOpenAuth('Parent')} className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Parent Workspace</span>
                  </button>
                  <button onClick={() => onOpenAuth('Administrator')} className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <span>Administrator Workspace</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={onNavigateToShowcase} className="hover:text-white transition cursor-pointer">OER Books</button>
          <Link to="/about" className="hover:text-white transition">About</Link>
          <Link to="/contact" className="hover:text-white transition">Contact</Link>
        </div>

        {/* Right CTA Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenAuth()}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-200 hover:text-white hover:bg-slate-800/80 border border-slate-700/60 transition cursor-pointer"
          >
            Sign In
          </button>

          <button
            onClick={onChooseWorkspace}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition cursor-pointer flex items-center gap-1.5"
          >
            <span>Get Started Free</span>
          </button>
        </div>
      </nav>

      {/* HERO SECTION WITH AI BOOK GLOWING GRAPHIC */}
      <section id="hero" className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-8 lg:px-16 max-w-7xl mx-auto overflow-hidden">
        
        {/* Background Radial Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Text Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="uppercase tracking-wider">AI Powered Education Ecosystem</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl font-serif font-black tracking-tight text-white leading-[1.1]"
            >
              One AI Platform. <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Four Intelligent Workspaces.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed max-w-xl"
            >
              Empowering teachers, students, parents, and school administrators with AI tools to teach, learn, manage and grow—together.
            </motion.p>

            {/* Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="pt-2 flex flex-wrap items-center gap-3"
            >
              <button
                onClick={onChooseWorkspace}
                className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm sm:text-base rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.35)] transition cursor-pointer flex items-center gap-2 group"
              >
                <span>Explore Workspaces</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => {
                  setDemoModalTab('video');
                  setShowDemoVideoModal(true);
                }}
                className="px-5 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-sm sm:text-base rounded-2xl border border-emerald-500/40 shadow-md transition cursor-pointer flex items-center gap-2 group"
              >
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400 group-hover:scale-110 transition" />
                <span>Watch Video</span>
              </button>

              <button
                onClick={() => {
                  setDemoModalTab('sandbox');
                  setShowDemoVideoModal(true);
                }}
                className="px-5 py-3.5 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white font-semibold text-sm sm:text-base rounded-2xl border border-slate-800 transition cursor-pointer flex items-center gap-2"
              >
                <Gamepad2 className="w-4 h-4 text-teal-400" />
                <span>Interactive Demo</span>
              </button>
            </motion.div>

            {/* Social Proof */}
            <div className="pt-6 flex items-center gap-4 border-t border-slate-800/80">
              <div className="flex -space-x-2 overflow-hidden">
                <img className="inline-block h-9 w-9 rounded-full ring-2 ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=120&q=80" alt="Black Female Educator" title="Amina - Educator" />
                <img className="inline-block h-9 w-9 rounded-full ring-2 ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" alt="Asian Male Administrator" title="David - Administrator" />
                <img className="inline-block h-9 w-9 rounded-full ring-2 ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80" alt="Hispanic Female Teacher" title="Maria - Teacher" />
                <img className="inline-block h-9 w-9 rounded-full ring-2 ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80" alt="South Asian Male STEM Instructor" title="Rahul - STEM Instructor" />
                <img className="inline-block h-9 w-9 rounded-full ring-2 ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" alt="Female Student" title="Sarah - Student" />
                <img className="inline-block h-9 w-9 rounded-full ring-2 ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=120&q=80" alt="African Male Admin" title="Kwame - Administrator" />
              </div>

              <div>
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Trusted by <strong>10,000+</strong> educators and learners globally
                </p>
              </div>
            </div>

          </div>

          {/* Right Visual Graphic (Matching AI Book & Floating Persona Nodes) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-5 relative flex items-center justify-center"
          >
            <div className="relative w-full max-w-md aspect-square rounded-3xl bg-gradient-to-b from-emerald-950/40 via-slate-900/80 to-slate-950 border border-emerald-500/30 p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col items-center justify-center overflow-hidden group">
              
              {/* Glowing Background Ring */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15)_0%,transparent_70%)] pointer-events-none" />

              {/* Floating Orbiting Nodes (Teacher, Student, Parent, Admin) */}
              <div className="absolute top-6 left-8 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 backdrop-blur-md text-emerald-300 shadow-lg animate-bounce" style={{ animationDuration: '4s' }}>
                <BookOpen className="w-6 h-6" />
              </div>

              <div className="absolute top-12 right-8 p-3 rounded-2xl bg-purple-500/20 border border-purple-400/40 backdrop-blur-md text-purple-300 shadow-lg animate-bounce" style={{ animationDuration: '5s' }}>
                <Compass className="w-6 h-6" />
              </div>

              <div className="absolute bottom-12 left-6 p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 backdrop-blur-md text-amber-300 shadow-lg animate-bounce" style={{ animationDuration: '4.5s' }}>
                <Users className="w-6 h-6" />
              </div>

              <div className="absolute bottom-8 right-8 p-3 rounded-2xl bg-blue-500/20 border border-blue-400/40 backdrop-blur-md text-blue-300 shadow-lg animate-bounce" style={{ animationDuration: '5.5s' }}>
                <ShieldCheck className="w-6 h-6" />
              </div>

              {/* Central Glowing AI Neural Brain Icon */}
              <div className="relative z-10 w-28 h-28 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-0.5 shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-emerald-400">
                  <Cpu className="w-14 h-14 animate-pulse" />
                </div>
              </div>

              {/* Open AI Knowledge Book Concept */}
              <div className="mt-8 text-center space-y-2 relative z-10">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-extrabold uppercase tracking-widest">
                  Integrated Knowledge Engine
                </span>
                <h3 className="text-lg font-extrabold text-white font-serif">KICD CBC & Multi-Curriculum AI</h3>
                <p className="text-xs text-slate-400">Instant lesson generation, 3D field trips, & auto-assessments</p>
              </div>

            </div>
          </motion.div>

        </div>
      </section>

      {/* FOUR WORKSPACES SECTION (Matching Left Side Image Layout) */}
      <section id="features" className="py-20 bg-[#06121a] border-t border-slate-800/80 px-4 sm:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-serif font-extrabold text-white tracking-tight">
              Four Workspaces. One Powerful Platform.
            </h2>
            <p className="text-sm sm:text-base text-slate-400 font-medium">
              Each workspace is designed to meet the unique needs of every learner and educator.
            </p>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Teacher Card */}
            <div className="p-6 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 hover:border-emerald-500/60 transition-all flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                  <BookOpen className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-xl font-serif font-extrabold text-white group-hover:text-emerald-300 transition">
                    Teacher Workspace
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Create lessons, assessments and resources in minutes with AI.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  {['AI Lesson Planner', 'Assessment Generator', 'EduNexus AI Tutor', 'Study Notes & Resources', 'Classroom Analytics'].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <button
                  onClick={() => onOpenAuth('Teacher')}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>Learn More</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="h-28 rounded-2xl bg-gradient-to-tr from-emerald-900/40 to-slate-900 border border-emerald-500/20 overflow-hidden relative flex items-end justify-center p-2">
                  <img src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=400&q=80" alt="Teacher Godfrey" className="h-full object-cover rounded-xl w-full" referrerPolicy="no-referrer" />
                </div>
              </div>
            </div>

            {/* Student Card */}
            <div className="p-6 rounded-3xl bg-purple-950/20 border border-purple-500/30 hover:border-purple-500/60 transition-all flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-400">
                  <Compass className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-xl font-serif font-extrabold text-white group-hover:text-purple-300 transition">
                    Student Workspace
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Learn smarter, stay organized and achieve your goals.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  {['Personalized Learning', 'AI Tutor & Flashcards', 'Assignments & Quizzes', 'Progress Tracking', 'Achievements & Badges'].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <button
                  onClick={() => onOpenAuth('Student')}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>Learn More</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="h-28 rounded-2xl bg-gradient-to-tr from-purple-900/40 to-slate-900 border border-purple-500/20 overflow-hidden relative flex items-end justify-center p-2">
                  <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80" alt="Student" className="h-full object-cover rounded-xl" />
                </div>
              </div>
            </div>

            {/* Parent Card */}
            <div className="p-6 rounded-3xl bg-amber-950/20 border border-amber-500/30 hover:border-amber-500/60 transition-all flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <Users className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-xl font-serif font-extrabold text-white group-hover:text-amber-300 transition">
                    Parent Workspace
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Stay informed and support your child's learning journey.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  {['Child Progress Overview', 'Reports & Analytics', 'Teacher Communication', 'Attendance & Schedule', 'Learning Goals'].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <button
                  onClick={() => onOpenAuth('Parent')}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>Learn More</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="h-28 rounded-2xl bg-gradient-to-tr from-amber-900/40 to-slate-900 border border-amber-500/20 overflow-hidden relative flex items-end justify-center p-2">
                  <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80" alt="Parent" className="h-full object-cover rounded-xl" />
                </div>
              </div>
            </div>

            {/* Administrator Card */}
            <div className="p-6 rounded-3xl bg-blue-950/20 border border-blue-500/30 hover:border-blue-500/60 transition-all flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-xl font-serif font-extrabold text-white group-hover:text-blue-300 transition">
                    Administrator Workspace
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Manage your school with powerful insights and control.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  {['School Analytics', 'User & Role Management', 'Curriculum Management', 'Reports & Insights', 'System & Security'].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <button
                  onClick={() => onOpenAuth('Administrator')}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>Learn More</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="h-28 rounded-2xl bg-gradient-to-tr from-blue-900/40 to-slate-900 border border-blue-500/20 overflow-hidden relative flex items-end justify-center p-2">
                  <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80" alt="Administrator" className="h-full object-cover rounded-xl" />
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* WHY SCHOOLS CHOOSE EDUNEXUS */}
      <section id="why-choose" className="py-20 bg-[#040a0f] border-t border-slate-800/80 px-4 sm:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-serif font-extrabold text-white tracking-tight">
              Why Schools Choose EduNexus
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChoose.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-6 rounded-2xl bg-[#081722] border border-slate-800 hover:border-slate-700 transition space-y-4">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${item.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-serif">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Statistics Counter Row */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-5 gap-6 text-center border-t border-slate-800/80">
            {stats.map((s, i) => (
              <div key={i} className="space-y-1">
                <span className="text-3xl sm:text-4xl font-serif font-black text-white">{s.value}</span>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* DIVERSE GLOBAL TESTIMONIALS & COMMUNITY VOICES */}
      <section id="testimonials" className="py-20 bg-[#06121a] border-t border-slate-800/80 px-4 sm:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-extrabold uppercase tracking-widest">
              Community Voices
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-extrabold text-white tracking-tight">
              Loved by Educators & Learners Worldwide
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              See how EduNexus empowers diverse teaching environments, classrooms, and families globally.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Testimonial 1 - Teacher Godfrey */}
            <div className="p-6 rounded-3xl bg-[#0a1b26] border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  &ldquo;EduNexus transformed my Physics, STEM, and PhET simulation lesson planning. The 5E CBC alignment generates differentiated worksheets, rubrics, and virtual lab guides in seconds.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-slate-800/80">
                <img 
                  src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=200&q=80" 
                  alt="Godfrey Ojiambo" 
                  className="w-10 h-10 rounded-full object-cover border border-emerald-400/50 shadow-xs" 
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-xs font-bold text-white">Godfrey Ojiambo</h4>
                  <p className="text-[10px] text-emerald-400 font-medium">STEM & PhET Simulations Lead Educator • Kenya</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="p-6 rounded-3xl bg-[#0a1b26] border border-slate-800 hover:border-teal-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  &ldquo;The institutional management tools give our leadership team crystal-clear visibility into curriculum coverage and UDL compliance across all grades.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-slate-800/80">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80" 
                  alt="David Chen" 
                  className="w-10 h-10 rounded-full object-cover border border-teal-400/50 shadow-xs" 
                />
                <div>
                  <h4 className="text-xs font-bold text-white">David Chen</h4>
                  <p className="text-[10px] text-teal-400 font-medium">School Principal • Singapore</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="p-6 rounded-3xl bg-[#0a1b26] border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  &ldquo;Tracking my daughter's competency progress in real time and receiving teacher voice notes in Spanish has transformed how we support learning at home.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-slate-800/80">
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80" 
                  alt="Elena Rodriguez" 
                  className="w-10 h-10 rounded-full object-cover border border-purple-400/50 shadow-xs" 
                />
                <div>
                  <h4 className="text-xs font-bold text-white">Elena Rodriguez</h4>
                  <p className="text-[10px] text-purple-400 font-medium">Parent & PTA Lead • San Antonio, TX</p>
                </div>
              </div>
            </div>

            {/* Testimonial 4 */}
            <div className="p-6 rounded-3xl bg-[#0a1b26] border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  &ldquo;The 3D Virtual Field Trips and Socratic AI Tutor bring complex science concepts to life. Students who used to struggle are now leading discussions.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-slate-800/80">
                <img 
                  src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80" 
                  alt="Dr. Tariq Al-Hassan" 
                  className="w-10 h-10 rounded-full object-cover border border-cyan-400/50 shadow-xs" 
                />
                <div>
                  <h4 className="text-xs font-bold text-white">Dr. Tariq Al-Hassan</h4>
                  <p className="text-[10px] text-cyan-400 font-medium">STEM Curriculum Director • Cairo, Egypt</p>
                </div>
              </div>
            </div>

            {/* Testimonial 5 */}
            <div className="p-6 rounded-3xl bg-[#0a1b26] border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  &ldquo;Visual Phonetics Studio and dyslexia-friendly font toggles make inclusive learning effortless. Every learner feels seen and supported.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-slate-800/80">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" 
                  alt="Priya Patel" 
                  className="w-10 h-10 rounded-full object-cover border border-amber-400/50 shadow-xs" 
                />
                <div>
                  <h4 className="text-xs font-bold text-white">Priya Patel</h4>
                  <p className="text-[10px] text-amber-400 font-medium">Inclusive Education Specialist • London, UK</p>
                </div>
              </div>
            </div>

            {/* Testimonial 6 */}
            <div className="p-6 rounded-3xl bg-[#0a1b26] border border-slate-800 hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  &ldquo;The QR Scavenger Hunt Studio transformed our physical classroom into an interactive active-learning arena. Students love hunting for clues!&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-slate-800/80">
                <img 
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80" 
                  alt="Marcus Vance" 
                  className="w-10 h-10 rounded-full object-cover border border-blue-400/50 shadow-xs" 
                />
                <div>
                  <h4 className="text-xs font-bold text-white">Marcus Vance</h4>
                  <p className="text-[10px] text-blue-400 font-medium">EdTech Coordinator • Atlanta, GA</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* DARK FOOTER (Matching Left Side Image) */}
      <footer className="bg-[#02060a] text-slate-400 py-16 px-4 sm:px-8 lg:px-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-slate-800">
            
            <div className="md:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-4 h-4 fill-emerald-400" />
                </div>
                <span className="font-extrabold text-xl text-white tracking-tight">EduNexus</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                AI Teaching & Learning Platform for the Future. KICD CBC aligned tools, 3D field trips, & auto-assessments.
              </p>
            </div>

            <div className="md:col-span-2 space-y-3 text-xs">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><button onClick={onChooseWorkspace} className="hover:text-white transition cursor-pointer">Workspaces</button></li>
                <li><button onClick={onNavigateToShowcase} className="hover:text-white transition cursor-pointer">OER Books</button></li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-3 text-xs">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Solutions</h4>
              <ul className="space-y-2">
                <li><button onClick={() => onOpenAuth('Teacher')} className="hover:text-white transition cursor-pointer">Teachers</button></li>
                <li><button onClick={() => onOpenAuth('Student')} className="hover:text-white transition cursor-pointer">Students</button></li>
                <li><button onClick={() => onOpenAuth('Parent')} className="hover:text-white transition cursor-pointer">Parents</button></li>
                <li><button onClick={() => onOpenAuth('Administrator')} className="hover:text-white transition cursor-pointer">Administrators</button></li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-3 text-xs">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Resources</h4>
              <ul className="space-y-2">
                <li><button onClick={onOpenDemoSandbox} className="hover:text-white transition cursor-pointer">Sandbox Demo</button></li>
                <li><button onClick={() => setActiveModal('contact')} className="hover:text-white transition cursor-pointer">Help Center</button></li>
                <li><button onClick={() => setActiveModal('contact')} className="hover:text-white transition cursor-pointer">Guides & Tutorials</button></li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-3 text-xs">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Trust & Compliance</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="hover:text-white transition hover:underline">About EduNexus</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition hover:underline">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition hover:underline">Terms of Service</Link></li>
                <li><Link to="/cookies" className="hover:text-white transition hover:underline">Cookie Policy</Link></li>
                <li><Link to="/data-deletion" className="hover:text-white transition hover:underline">Data Deletion Policy</Link></li>
                <li><Link to="/accessibility" className="hover:text-white transition hover:underline">Accessibility Statement</Link></li>
                <li><Link to="/contact" className="hover:text-white transition hover:underline">Contact Us</Link></li>
                <li><Link to="/delete-account" className="hover:text-rose-400 transition hover:underline">Delete Account</Link></li>
              </ul>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© 2026 EduNexus AI Tutor. All Rights Reserved.</p>
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google OAuth & Firestore Data Security Verified</span>
            </div>
          </div>

        </div>
      </footer>

      {/* DEMO VIDEO MODAL */}
      <DemoVideoModal
        isOpen={showDemoVideoModal}
        onClose={() => setShowDemoVideoModal(false)}
        onOpenSandbox={onOpenDemoSandbox}
        initialTab={demoModalTab}
        youtubeUrl={youtubeUrl}
      />

      {/* PRIVACY / TERMS / CONTACT MODAL */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#081722] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full text-white space-y-4 shadow-2xl relative"
            >
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold font-serif text-emerald-400 capitalize">
                {activeModal === 'privacy' && 'Privacy Policy'}
                {activeModal === 'terms' && 'Terms of Service'}
                {activeModal === 'contact' && 'Contact Support'}
              </h3>

              <div className="text-xs text-slate-300 space-y-2 max-h-80 overflow-y-auto pr-2 leading-relaxed">
                {activeModal === 'privacy' && (
                  <>
                    <p>EduNexus takes user privacy and security seriously. All user authentication and data storage utilize Google Firebase Firestore and standard encryption.</p>
                    <p>We do not sell personal data or share profile information with unauthorized third parties.</p>
                  </>
                )}
                {activeModal === 'terms' && (
                  <>
                    <p>By using EduNexus, you agree to utilize the platform for valid educational, teaching, and learning activities in accordance with local regulations.</p>
                  </>
                )}
                {activeModal === 'contact' && (
                  <>
                    <p>For help, onboarding, or platform support, please contact:</p>
                    <p>Email: <a href="mailto:support@joinedunexus.app" className="font-bold underline hover:text-emerald-600 transition">support@joinedunexus.app</a></p>
                    <p>Phone: <strong>+254740183394</strong></p>
                  </>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
