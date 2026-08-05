import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';
import { 
  Trash2, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  Info, 
  Mail, 
  Building, 
  Wrench,
  Phone,
  ArrowRight,
  UserX
} from 'lucide-react';

export const DataDeletionPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500/30 selection:text-rose-200">
      <SEO 
        title="Data Deletion Policy" 
        description="Learn what data is deleted when you remove your EduNexus account, timeline for deletion, retention obligations, and how to request deletion."
        canonicalPath="/data-deletion"
      />

      <PublicNavbar />

      {/* Header Banner */}
      <section className="relative pt-16 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-4xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-extrabold uppercase tracking-wider">
            <Trash2 className="w-4 h-4" />
            <span>User Data Rights & Removal</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-black text-white">Data Deletion Policy</h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Comprehensive transparency on personal data purging, timelines, retained records, and request procedures.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-10 leading-relaxed text-slate-300 text-sm flex-1">

        {/* Action Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-lg font-serif font-bold text-white flex items-center justify-center sm:justify-start gap-2">
              <UserX className="w-5 h-5 text-rose-400" />
              <span>Looking to Delete Your Account Now?</span>
            </h2>
            <p className="text-xs text-slate-300">
              You can perform an instant automated deletion directly from your signed-in account dashboard.
            </p>
          </div>
          <Link
            to="/delete-account"
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition shadow-lg shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Go to Delete Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 1. What Data Is Permanently Deleted */}
        <div className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span>1. What Data Is Deleted</span>
          </h2>
          <p>
            When an account deletion request is processed, EduNexus permanently purges all associated personal documents and database entries from our Cloud Firestore storage servers, including:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {[
              { title: 'Profile & Credentials', desc: 'Full name, email address, role (teacher/student), profile avatar, and Firebase Auth UID.' },
              { title: 'AI Conversation Logs', desc: 'All saved AI Tutor chat histories, Socratic step-by-step guidance prompts, and interactive Q&A logs.' },
              { title: 'Generated Curriculum Content', desc: 'Custom lesson plans, worksheets, rubrics, quizzes, and OER textbook drafts created by you.' },
              { title: 'Assessment & Progress Records', desc: 'Student evaluation scores, grading rubrics, CBC competency trackers, and diagnostic charts.' },
              { title: 'Favorites & Saved Pathways', desc: 'Personalized learning pathways, saved resource bookmarks, and custom workspace preferences.' }
            ].map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{item.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 pl-6">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Timeline for Deletion */}
        <div className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>2. How Long Deletion Takes</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>In-App Automated Deletion</span>
              </div>
              <p className="text-xs text-slate-300">
                <strong>Immediate (Instant):</strong> Deleting your account via the <Link to="/delete-account" className="text-emerald-400 hover:underline">Delete Account page</Link> removes your user document from Firestore instantly and signs out your active session.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>Manual Support Requests</span>
              </div>
              <p className="text-xs text-slate-300">
                <strong>24 to 48 Hours:</strong> Deletion requests submitted via email to <a href="mailto:support@joinedunexus.app" className="text-teal-400 hover:underline">support@joinedunexus.app</a> or <a href="mailto:admin@joinedunexus.app" className="text-teal-400 hover:underline">admin@joinedunexus.app</a> are manually processed within 48 business hours.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Retained Data Obligations */}
        <div className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span>3. What Information May Be Retained</span>
          </h2>
          <p>
            In accordance with international data protection standards (such as GDPR and local educational privacy mandates), certain limited data may be retained temporarily after account deletion for the following specific purposes:
          </p>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-2 text-slate-300">
                <p>
                  <strong className="text-white">Legal & Compliance Audits:</strong> Financial transactions, billing records, or tax receipts are retained for up to 7 years where required by tax or statutory compliance laws.
                </p>
                <p>
                  <strong className="text-white">Security & Abuse Prevention:</strong> Anonymized system crash logs, rate-limit violation logs, and firewall event security records may be kept to prevent platform abuse and ensure system safety.
                </p>
                <p>
                  <strong className="text-white">Aggregated Diagnostics:</strong> Fully de-identified, non-personal metrics (e.g., total AI queries processed, system uptime statistics) that cannot be linked back to any individual identity.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. How to Submit Manual Deletion Requests */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-400" />
            <span>4. Submitting Manual Deletion Requests</span>
          </h2>
          <p className="text-xs text-slate-300">
            If you are unable to log into your account or prefer to submit a manual data erasure request, please email our administration or technical support departments from your registered email address:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-400" />
                <span>Administration & Privacy Requests</span>
              </span>
              <a href="mailto:admin@joinedunexus.app?subject=Manual%20Data%20Deletion%20Request" className="text-indigo-400 font-extrabold hover:underline block text-sm">
                admin@joinedunexus.app
              </a>
              <p className="text-[11px] text-slate-400">Subject: Manual Data Deletion Request</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                <span>Technical Support Helpdesk</span>
              </span>
              <a href="mailto:support@joinedunexus.app?subject=Account%20Deletion%20Assistance" className="text-emerald-400 font-extrabold hover:underline block text-sm">
                support@joinedunexus.app
              </a>
              <p className="text-[11px] text-slate-400">Subject: Account Deletion Assistance</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 bg-amber-500/5 space-y-1.5">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Direct Phone Assistance</span>
              </span>
              <a href="tel:+254740183394" className="text-amber-400 font-extrabold hover:underline block text-sm">
                +254 740 183394
              </a>
              <p className="text-[11px] text-slate-400">Mon–Fri 8AM–5PM EAT Support Hotline</p>
            </div>
          </div>
        </div>

      </section>

      <Footer />
    </div>
  );
};

export default DataDeletionPolicyPage;
