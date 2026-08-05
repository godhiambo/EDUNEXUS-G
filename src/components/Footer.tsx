import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Shield, Lock, Globe, Mail, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 py-12 px-4 sm:px-6 lg:px-8 mt-auto font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-800/80">
          
          {/* Brand Info */}
          <div className="md:col-span-4 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:scale-105 transition">
                <Sparkles className="w-5 h-5 fill-emerald-400" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight group-hover:text-emerald-400 transition">
                EduNexus
              </span>
            </Link>
            
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              An AI-powered educational platform designed to improve learning through personalized tutoring, guided practice, intelligent feedback, and interactive learning experiences.
            </p>

            {/* Direct Contact Emails & Phone */}
            <div className="space-y-1.5 text-xs pt-1">
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Direct Contacts:</p>
              <div className="flex flex-col gap-1 text-slate-400 text-[11px]">
                <a href="tel:+254740183394" className="hover:text-emerald-400 transition flex items-center gap-1.5 font-bold text-amber-400">
                  <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>+254 740 183394</span>
                </a>
                <a href="mailto:support@joinedunexus.app" className="hover:text-emerald-400 transition flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>support@joinedunexus.app</span>
                </a>
                <a href="mailto:info@joinedunexus.app" className="hover:text-emerald-400 transition flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>info@joinedunexus.app</span>
                </a>
                <a href="mailto:help@joinedunexus.app" className="hover:text-emerald-400 transition flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>help@joinedunexus.app</span>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Navigation</h4>
            <ul className="space-y-2 font-medium">
              <li>
                <Link to="/" className="hover:text-emerald-400 transition block py-0.5">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-emerald-400 transition block py-0.5">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-emerald-400 transition block py-0.5">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/delete-account" className="hover:text-rose-400 transition block py-0.5">
                  Delete Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Trust Links */}
          <div className="md:col-span-5 space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Trust & Compliance</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 font-medium">
              <Link to="/privacy" className="hover:text-emerald-400 transition block py-0.5">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-emerald-400 transition block py-0.5">
                Terms of Service
              </Link>
              <Link to="/cookies" className="hover:text-emerald-400 transition block py-0.5">
                Cookie Policy
              </Link>
              <Link to="/data-deletion" className="hover:text-emerald-400 transition block py-0.5">
                Data Deletion Policy
              </Link>
              <Link to="/accessibility" className="hover:text-emerald-400 transition block py-0.5 sm:col-span-2">
                Accessibility Statement
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 EduNexus AI Tutor. All Rights Reserved.</p>
          <div className="flex items-center gap-2 text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Firebase Hosting & Cloud Security Standard</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
