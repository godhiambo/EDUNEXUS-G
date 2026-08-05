import React, { useState } from 'react';
import { SEO } from '../components/SEO';
import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';
import { Cookie, ShieldCheck, Check, Settings, Trash2, Mail, Info, RefreshCw } from 'lucide-react';

export const CookiePolicyPage: React.FC = () => {
  const [functionalCookies, setFunctionalCookies] = useState(true);
  const [analyticsCookies, setAnalyticsCookies] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSavePreferences = () => {
    localStorage.setItem('cookie_pref_functional', String(functionalCookies));
    localStorage.setItem('cookie_pref_analytics', String(analyticsCookies));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleClearCookies = () => {
    localStorage.clear();
    alert('Local state and cached preferences have been cleared.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <SEO 
        title="Cookie Policy & Preferences" 
        description="Learn how EduNexus uses cookies and manage your cookie preferences for authentication, performance, and personalization."
        canonicalPath="/cookies"
      />

      <PublicNavbar />

      {/* Header Banner */}
      <section className="relative pt-16 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-4xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
            <Cookie className="w-4 h-4" />
            <span>Cookie Management & Transparency</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-black text-white">Cookie Policy</h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Understand how EduNexus uses cookies, browser storage, and local sessions to keep your learning environment secure and personalized.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-10 leading-relaxed text-slate-300 text-sm flex-1">

        {/* Intro */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
            <Info className="w-5 h-5 text-emerald-400" />
            <span>What Are Cookies & Local Storage?</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Cookies and local storage tokens are small data files stored on your device when you visit websites. They enable EduNexus to recognize your login session across tabs, store your dark/light mode preferences, save draft AI lesson plans, and optimize application speed.
          </p>
        </div>

        {/* Cookie Categories */}
        <div className="space-y-6">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Types of Cookies We Use</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Essential */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Essential Cookies</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase">Required</span>
              </div>
              <p className="text-xs text-slate-400">
                Necessary for user authentication via Firebase Auth, secure session tokens, CORS validation, and site navigation.
              </p>
            </div>

            {/* Functional */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Preference Cookies</span>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-extrabold uppercase">Optional</span>
              </div>
              <p className="text-xs text-slate-400">
                Remember your selected language, TTS voice settings, curriculum choices, and font size preferences.
              </p>
            </div>

            {/* Analytics */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Analytics Cookies</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-extrabold uppercase">Optional</span>
              </div>
              <p className="text-xs text-slate-400">
                Help us understand system performance, AI model response speed, and error rates to improve EduNexus for all users.
              </p>
            </div>

          </div>
        </div>

        {/* Interactive Cookie Preference Center */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
          <div className="space-y-1">
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" />
              <span>Manage Your Cookie Preferences</span>
            </h2>
            <p className="text-xs text-slate-400">
              Customize which non-essential cookies and local cache parameters EduNexus uses during your visit.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            
            {/* Toggle 1: Essential */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4 opacity-80">
              <div>
                <p className="font-bold text-white text-xs">Essential Authentication & Security</p>
                <p className="text-[11px] text-slate-400">Strictly necessary for Firebase login sessions and security tokens.</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 font-bold text-[10px]">Always On</div>
            </div>

            {/* Toggle 2: Preference */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-white text-xs">Functional & Personalization Settings</p>
                <p className="text-[11px] text-slate-400">Saves your theme, voice speed, and document drafts locally.</p>
              </div>
              <button
                type="button"
                onClick={() => setFunctionalCookies(!functionalCookies)}
                className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${functionalCookies ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'}`}
              >
                <div className="w-4 h-4 rounded-full bg-slate-950 shadow-md" />
              </button>
            </div>

            {/* Toggle 3: Analytics */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-white text-xs">Anonymized Performance & Diagnostics</p>
                <p className="text-[11px] text-slate-400">Allows us to monitor load times and fix broken AI interactions.</p>
              </div>
              <button
                type="button"
                onClick={() => setAnalyticsCookies(!analyticsCookies)}
                className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${analyticsCookies ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'}`}
              >
                <div className="w-4 h-4 rounded-full bg-slate-950 shadow-md" />
              </button>
            </div>

          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <button
              onClick={handleSavePreferences}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Cookie Preferences</span>
            </button>

            <button
              onClick={handleClearCookies}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear Local Storage</span>
            </button>
          </div>

          {saveSuccess && (
            <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Your cookie preferences have been saved to local storage!</span>
            </p>
          )}

        </div>

        {/* Direct Contact Inquiries */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
          <p className="font-bold text-white flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-emerald-400" />
            <span>Questions Regarding Cookies?</span>
          </p>
          <p className="text-slate-400">
            Reach out to our privacy compliance team at <a href="mailto:admin@joinedunexus.app" className="text-emerald-400 font-bold hover:underline">admin@joinedunexus.app</a> or technical support at <a href="mailto:support@joinedunexus.app" className="text-emerald-400 font-bold hover:underline">support@joinedunexus.app</a>.
          </p>
        </div>

      </section>

      <Footer />
    </div>
  );
};

export default CookiePolicyPage;
