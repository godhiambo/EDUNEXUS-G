import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';
import { 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight,
  Globe
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const features = [
    { title: 'AI Tutoring', desc: 'Socratic step-by-step guidance that adapts to individual student pacing and learning styles.' },
    { title: 'Step-by-step Explanations', desc: 'Clear, multi-tiered explanations breaking down complex STEM, language, and humanities topics.' },
    { title: 'Homework Assistance', desc: 'Intelligent hints, guided problem solving, and practice problems without giving away direct answers.' },
    { title: 'Personalized Learning', desc: 'Adaptive difficulty levels and customized learning pathways tailored to each student.' },
    { title: 'Interactive Quizzes', desc: 'Automated assessment generation with real-time feedback, rubrics, and diagnostic reports.' },
    { title: 'Progress Tracking', desc: 'Comprehensive dashboards tracking competency coverage, engagement, and mastery metrics.' },
    { title: 'Secure Cloud Synchronization', desc: 'Real-time synchronization across devices backed by Firestore and Google Cloud security.' },
    { title: 'Modern Responsive Interface', desc: 'Seamlessly works across desktops, tablets, and mobile devices with dark/light mode support.' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <SEO 
        title="About Us" 
        description="EduNexus is an AI-powered educational platform designed to improve learning through personalized tutoring, guided practice, intelligent feedback, and interactive learning experiences."
        canonicalPath="/about"
      />

      <PublicNavbar />

      {/* Header Banner */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Empowering Global Education</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-black tracking-tight text-white leading-tight">
            About <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">EduNexus</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-medium leading-relaxed">
            EduNexus is an AI-powered educational platform designed to improve learning through personalized tutoring, guided practice, intelligent feedback, and interactive learning experiences.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-12 flex-1">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Globe className="w-6 h-6" />
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">Our Mission</h2>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              Our mission is to make quality education accessible, engaging, inclusive, and effective for learners everywhere.
            </p>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              The platform supports students, teachers, schools, and lifelong learners by combining modern AI with evidence-based teaching approaches.
            </p>
          </div>
        </div>

        {/* Core Features Grid */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white">Platform Features</h2>
            <p className="text-slate-400 text-sm">Comprehensive intelligent tools crafted for modern classrooms and learners.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feat, index) => (
              <div 
                key={index}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 transition-all space-y-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="font-bold text-lg text-white font-serif group-hover:text-emerald-300 transition">{feat.title}</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pl-11">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">Ready to Transform Your Learning Journey?</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Join thousands of educators and students leveraging EduNexus for personalized learning and intelligent tutoring.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link 
              to="/"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-sm hover:from-emerald-400 hover:to-teal-400 transition shadow-lg flex items-center gap-2"
            >
              <span>Explore Platform</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/contact"
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
