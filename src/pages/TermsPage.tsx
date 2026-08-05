import React from 'react';
import { SEO } from '../components/SEO';
import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';
import { Mail, Scale, Building, Wrench, Phone } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <SEO 
        title="Terms of Service" 
        description="EduNexus Terms of Service governing platform usage, account responsibilities, intellectual property, and service availability."
        canonicalPath="/terms"
      />

      <PublicNavbar />

      {/* Header Banner */}
      <section className="relative pt-16 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-4xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
            <Scale className="w-4 h-4" />
            <span>Terms & Conditions</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-black text-white">Terms of Service</h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Effective Date: <span className="text-emerald-400 font-bold">August 2, 2026</span>
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-10 leading-relaxed text-slate-300 text-sm flex-1">
        
        {/* Welcome Box */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <p className="text-slate-300 text-sm leading-relaxed">
            Welcome to EduNexus. By accessing or using our website, AI tools, or mobile/web applications, you agree to be bound by these Terms of Service. Please read them carefully before using the platform.
          </p>
        </div>

        {/* 1. Eligibility */}
        <div className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>1. Eligibility</span>
          </h2>
          <p>
            You must be at least 13 years of age, or have the consent of a parent, legal guardian, or educational institution, to register an account and use EduNexus. Schools and teachers creating accounts for students warrant that they have the requisite authority to do so.
          </p>
        </div>

        {/* 2. Acceptable Use */}
        <div className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>2. Acceptable Use</span>
          </h2>
          <p>
            EduNexus provides AI-assisted tutoring, curriculum drafting, assessments, and educational collaboration. Users agree to use the platform solely for lawful educational, teaching, and learning purposes.
          </p>
        </div>

        {/* 3. Prohibited Activities */}
        <div className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>3. Prohibited Activities</span>
          </h2>
          <p>Users shall not:</p>
          <ul className="space-y-2 list-disc list-inside text-slate-300 pl-2">
            <li>Attempt to reverse-engineer, decompile, or extract source code or underlying AI models.</li>
            <li>Submit malicious, abusive, defamatory, or unlawful content.</li>
            <li>Bypass rate limits, security barriers, or Firestore authorization rules.</li>
            <li>Impersonate administrators, teachers, or other registered users.</li>
            <li>Automate scraping or unauthorized data harvesting from the platform.</li>
          </ul>
        </div>

        {/* 4. Educational Disclaimer */}
        <div className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>4. Educational Disclaimer</span>
          </h2>
          <p>
            EduNexus provides supplementary AI tools designed to support learning and teaching. The platform does not replace official accredited school instruction, certified teaching credentials, or institutional grading bodies.
          </p>
        </div>

        {/* 5. Accuracy Disclaimer */}
        <div className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>5. Accuracy Disclaimer</span>
          </h2>
          <p>
            While our AI models strive for high fidelity and alignment with educational standards (e.g., KICD CBC), AI-generated outputs may occasionally contain inaccuracies. Teachers and educators are encouraged to review AI-generated materials prior to classroom distribution.
          </p>
        </div>

        {/* 6. Account Responsibilities */}
        <div className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>6. Account Responsibilities</span>
          </h2>
          <p>
            You are responsible for maintaining the confidentiality of your credentials and account session. Notify support immediately if you suspect unauthorized access to your account.
          </p>
        </div>

        {/* 7. Intellectual Property */}
        <div className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>7. Intellectual Property</span>
          </h2>
          <p>
            All platform software, designs, logos, and proprietary algorithms remain the property of EduNexus. Users retain ownership of original educational content uploaded to or generated by them on the platform.
          </p>
        </div>

        {/* 8. Termination */}
        <div className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>8. Termination</span>
          </h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate these Terms of Service or pose a threat to platform security or other users. Users may also delete their accounts at any time via the Delete Account page.
          </p>
        </div>

        {/* 9. Service Availability */}
        <div className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>9. Service Availability</span>
          </h2>
          <p>
            We strive to maintain high uptime through Google Cloud infrastructure; however, service availability may be subject to scheduled maintenance or unforeseen downtime.
          </p>
        </div>

        {/* 10. Limitation of Liability */}
        <div className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>10. Limitation of Liability</span>
          </h2>
          <p>
            To the maximum extent permitted by applicable law, EduNexus shall not be liable for any indirect, incidental, or consequential damages resulting from platform usage or inability to access services.
          </p>
        </div>

        {/* 11. Changes to Terms */}
        <div className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>11. Changes to Terms</span>
          </h2>
          <p>
            We may update these Terms of Service periodically. Continued use of the platform after updates constitutes acceptance of the revised terms.
          </p>
        </div>

        {/* 12. Contact */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-400" />
            <span>Contact</span>
          </h2>
          <p className="text-xs text-slate-300">
            Questions about these Terms should be directed to:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 bg-amber-500/5 space-y-1">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Phone Helpline</span>
              </span>
              <a href="tel:+254740183394" className="text-amber-400 font-extrabold hover:underline block truncate">
                +254 740 183394
              </a>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-400" />
                <span>Legal & Administration</span>
              </span>
              <a href="mailto:admin@joinedunexus.app" className="text-indigo-400 font-extrabold hover:underline block">
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
                <span>General Enquiries</span>
              </span>
              <a href="mailto:info@joinedunexus.app" className="text-teal-400 font-extrabold hover:underline block">
                info@joinedunexus.app
              </a>
            </div>
          </div>
        </div>

      </section>

      <Footer />
    </div>
  );
};

export default TermsPage;
