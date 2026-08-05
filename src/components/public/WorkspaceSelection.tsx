import React from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Compass, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  CheckCircle,
  GraduationCap
} from 'lucide-react';

export type UserRole = 'Teacher' | 'Student' | 'Parent' | 'Administrator';

interface WorkspaceSelectionProps {
  onSelectRole: (role: UserRole) => void;
  onBackToHome: () => void;
}

export default function WorkspaceSelection({ onSelectRole, onBackToHome }: WorkspaceSelectionProps) {
  const workspaces = [
    {
      role: 'Teacher' as UserRole,
      title: 'Teacher Workspace',
      badge: 'Lesson Architect & Assessment Studio',
      description: 'Generate 5E KICD lesson plans, auto-grade assessments, print QR scavenger hunts, and track learner performance.',
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50/80 hover:bg-amber-100/80 border-amber-200/80',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      btnColor: 'bg-amber-600 hover:bg-amber-700 text-white',
      icon: BookOpen,
      iconColor: 'text-amber-600',
      highlights: ['KICD 5E Lesson Architect', 'AI Assessment Diagnostic', 'QR Scavenger Hunt Studio']
    },
    {
      role: 'Student' as UserRole,
      title: 'Student Workspace',
      badge: 'Interactive Explorer & Learning Realm',
      description: 'Embark on 3D virtual field trips, practice visual phonetics, earn XP milestone badges, and consult your Socratic AI Tutor.',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50/80 hover:bg-emerald-100/80 border-emerald-200/80',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      icon: Compass,
      iconColor: 'text-emerald-600',
      highlights: ['3D 360° Virtual Expeditions', 'Visual Phonetics Studio', 'Student XP Badges & Leaderboard']
    },
    {
      role: 'Parent' as UserRole,
      title: 'Parent Workspace',
      badge: 'Home Learning & Growth Portal',
      description: 'Track your child’s CBC competency milestones, view teacher feedback, and support home learning extension activities.',
      color: 'from-purple-500 to-indigo-600',
      bgColor: 'bg-purple-50/80 hover:bg-purple-100/80 border-purple-200/80',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      btnColor: 'bg-purple-600 hover:bg-purple-700 text-white',
      icon: Users,
      iconColor: 'text-purple-600',
      highlights: ['Competency Progress Digest', 'Teacher Messaging & Alerts', 'Multilingual Home Activities']
    },
    {
      role: 'Administrator' as UserRole,
      title: 'Administrator Workspace',
      badge: 'Institutional Governance & System Audit',
      description: 'Monitor school-wide curriculum alignment, track resource utilization, audit teacher logs, and review system compliance.',
      color: 'from-rose-500 to-pink-600',
      bgColor: 'bg-rose-50/80 hover:bg-rose-100/80 border-rose-200/80',
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
      btnColor: 'bg-rose-600 hover:bg-rose-700 text-white',
      icon: ShieldCheck,
      iconColor: 'text-rose-600',
      highlights: ['Curriculum Coverage Audit', 'School Resource Analytics', 'UDL Compliance Export']
    }
  ];

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#fdfbf7] text-slate-800 py-12 px-4 sm:px-6 lg:px-12 flex flex-col justify-center">
      <div className="max-w-6xl mx-auto w-full space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-extrabold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
            <span>EduNexus Multi-Persona Portal</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-serif font-black text-slate-900 tracking-tight">
            Choose Your Workspace
          </h1>
          
          <p className="text-sm sm:text-base text-slate-600 font-medium">
            Select your role in the EduNexus educational ecosystem to open your dedicated login portal.
          </p>
        </div>

        {/* 4 Workspace Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workspaces.map((ws) => {
            const Icon = ws.icon;
            return (
              <motion.div
                key={ws.role}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ duration: 0.2 }}
                className={`p-6 sm:p-8 rounded-3xl border shadow-sm transition-all flex flex-col justify-between space-y-6 ${ws.bgColor} cursor-pointer group`}
                onClick={() => onSelectRole(ws.role)}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-xs flex items-center justify-center border border-slate-200/80">
                      <Icon className={`w-6 h-6 ${ws.iconColor}`} />
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${ws.badgeColor}`}>
                      {ws.badge}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif font-extrabold text-slate-900 group-hover:text-slate-950">
                      {ws.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2 font-medium">
                      {ws.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200/60">
                    {ws.highlights.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRole(ws.role);
                  }}
                  className={`w-full py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm shadow-sm transition duration-200 flex items-center justify-center gap-2 cursor-pointer ${ws.btnColor}`}
                >
                  <span>Continue to {ws.role} Login</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Back Link */}
        <div className="text-center pt-2">
          <button
            onClick={onBackToHome}
            className="text-xs font-extrabold text-slate-500 hover:text-slate-800 transition underline cursor-pointer"
          >
            ← Back to Landing Page & Overview
          </button>
        </div>

      </div>
    </div>
  );
}
