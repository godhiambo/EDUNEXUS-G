import React from 'react';
import { SEO } from '../components/SEO';
import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';
import { Shield, CheckCircle2, Mail, Building, Wrench, LifeBuoy, Phone } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <SEO 
        title="Privacy Policy" 
        description="EduNexus Privacy Policy detailing how we collect, use, protect, and manage your personal information and learning data."
        canonicalPath="/privacy"
      />

      <PublicNavbar />

      {/* Header Banner */}
      <section className="relative pt-16 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-4xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Data Protection & Privacy</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-black text-white">Privacy Policy</h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Effective Date: <span className="text-emerald-400 font-bold">August 2, 2026</span>
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-10 leading-relaxed text-slate-300 text-sm flex-1">
        
        {/* Intro Box */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <p className="text-slate-300 text-sm leading-relaxed">
            EduNexus (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is committed to protecting the personal information and learning data collected through our platform. This Privacy Policy describes how we collect, use, store, and safeguard your data when you interact with EduNexus.
          </p>
        </div>

        {/* Section 1: Information We Collect */}
        <div className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Information We Collect</span>
          </h2>
          <p>We collect information to provide, maintain, and enhance our AI educational tools. The information collected includes:</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {[
              'Name',
              'Email address',
              'Profile photo (if available)',
              'Authentication information',
              'Learning history',
              'Chat conversations',
              'Assessment results',
              'Uploaded content',
              'Device information',
              'Browser information',
              'IP address',
              'Cookies',
              'Analytics'
            ].map((item, idx) => (
              <li key={idx} className="flex items-center gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs font-medium text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Section 2: How We Use Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>How We Use Information</span>
          </h2>
          <p>We process collected data for legitimate educational and operational purposes, including:</p>
          <ul className="space-y-2 list-disc list-inside text-slate-300 font-medium pl-2">
            <li>Create user accounts</li>
            <li>Authenticate users</li>
            <li>Provide AI tutoring</li>
            <li>Save learning progress</li>
            <li>Improve educational experiences</li>
            <li>Detect abuse</li>
            <li>Improve security</li>
            <li>Customer support</li>
            <li>Analytics</li>
          </ul>
        </div>

        {/* Section 3: Third-Party Services & Google API Compliance */}
        <div className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Third-Party Services & Google API Compliance</span>
          </h2>
          <p>To deliver our services reliably and securely, EduNexus utilizes trusted cloud infrastructure and authentication providers:</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {[
              { name: 'Firebase Authentication', role: 'Identity management and secure OAuth sign-in' },
              { name: 'Firebase Hosting', role: 'Fast, secure CDN deployment and routing' },
              { name: 'Cloud Firestore', role: 'Encrypted document store and real-time database' },
              { name: 'Google Workspace APIs', role: 'Google Drive, Docs, Sheets, Calendar & Gmail integrations' }
            ].map((srv, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <h3 className="font-bold text-white text-xs">{srv.name}</h3>
                <p className="text-[11px] text-slate-400">{srv.role}</p>
              </div>
            ))}
          </ul>

          {/* Mandatory Google API User Data Disclosure & Limited Use Policy */}
          <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-3">
            <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Google API Services User Data Policy & Limited Use Disclosure</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              EduNexus&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
              <a 
                href="https://developers.google.com/terms/api-services-user-data-policy" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-emerald-400 underline font-semibold"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside pt-1">
              <li>We only request access to Google Workspace data (Drive, Docs, Sheets, Calendar, Gmail) strictly necessary to enable user-initiated features.</li>
              <li>User data obtained through Google APIs is used exclusively to provide and improve educational and productivity tools for the authenticated user.</li>
              <li>Google API data is never transferred to third parties, advertisers, or data brokers.</li>
              <li>Google Workspace data is not used for generalized AI model training without explicit, affirmative user consent.</li>
            </ul>
          </div>
        </div>

        {/* Section 4: Data Protection */}
        <div className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Data Protection</span>
          </h2>
          <p>
            We implement robust technical and organizational security measures to protect user information against unauthorized access, alteration, disclosure, or destruction. All database transactions are encrypted in transit via SSL/TLS and at rest using Google Cloud enterprise security standards.
          </p>
        </div>

        {/* Section 5: Children's Privacy */}
        <div className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Children&apos;s Privacy</span>
          </h2>
          <p>
            EduNexus is designed for educational environments. Schools, parents, or legal guardians should supervise younger users where appropriate and assist in managing account settings or data permissions.
          </p>
        </div>

        {/* Section 6: User Rights */}
        <div className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>User Rights</span>
          </h2>
          <p>Users have full autonomy over their personal data. You may request:</p>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center font-bold text-xs text-emerald-300">
            <li className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">Access</li>
            <li className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">Correction</li>
            <li className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">Deletion</li>
            <li className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">Data Export</li>
          </ul>
        </div>

        {/* Section 7: Contact Us */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-400" />
            <span>Contact Us</span>
          </h2>
          <p className="text-xs text-slate-300">
            If you have any questions regarding this Privacy Policy or your personal data, please contact us:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 bg-amber-500/5 space-y-1 sm:col-span-2">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Direct Phone & WhatsApp Helpline</span>
              </span>
              <a href="tel:+254740183394" className="text-amber-400 font-extrabold text-sm hover:underline block">
                +254 740 183394
              </a>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-400" />
                <span>Privacy & Data Requests</span>
              </span>
              <a href="mailto:admin@joinedunexus.app" className="text-emerald-400 font-extrabold hover:underline block">
                admin@joinedunexus.app
              </a>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                <span>Technical Support</span>
              </span>
              <a href="mailto:support@joinedunexus.app" className="text-emerald-400 font-extrabold hover:underline block">
                support@joinedunexus.app
              </a>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-teal-400" />
                <span>General Information</span>
              </span>
              <a href="mailto:info@joinedunexus.app" className="text-teal-400 font-extrabold hover:underline block">
                info@joinedunexus.app
              </a>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <LifeBuoy className="w-3.5 h-3.5 text-cyan-400" />
                <span>Help Centre</span>
              </span>
              <a href="mailto:help@joinedunexus.app" className="text-cyan-400 font-extrabold hover:underline block">
                help@joinedunexus.app
              </a>
            </div>
          </div>
        </div>

      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPage;
