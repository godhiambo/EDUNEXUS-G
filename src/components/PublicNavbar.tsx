import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PublicNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="h-20 border-b border-slate-800/80 bg-[#06121a]/95 backdrop-blur-xl sticky top-0 z-50 px-4 sm:px-8 flex items-center justify-between font-sans">
      {/* Brand Logo */}
      <Link 
        to="/" 
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)] group-hover:scale-105 transition">
          <Sparkles className="w-5 h-5 fill-emerald-400" />
        </div>
        <div>
          <span className="font-extrabold text-xl text-white tracking-tight group-hover:text-emerald-400 transition">EduNexus</span>
        </div>
      </Link>

      {/* Desktop Links */}
      <div className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-semibold text-slate-300">
        <Link to="/" className="hover:text-emerald-400 transition">Home</Link>
        <Link to="/about" className="hover:text-emerald-400 transition">About</Link>
        <Link to="/privacy" className="hover:text-emerald-400 transition">Privacy</Link>
        <Link to="/terms" className="hover:text-emerald-400 transition">Terms</Link>
        <Link to="/contact" className="hover:text-emerald-400 transition">Contact</Link>
        <Link to="/cookies" className="hover:text-emerald-400 transition">Cookies</Link>
        <Link to="/data-deletion" className="hover:text-emerald-400 transition">Data Deletion</Link>
        <Link to="/accessibility" className="hover:text-emerald-400 transition">Accessibility</Link>
      </div>

      {/* Desktop Right Action Buttons */}
      <div className="hidden sm:flex items-center gap-3">
        <Link
          to="/"
          className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-200 hover:text-white hover:bg-slate-800/80 border border-slate-700/60 transition cursor-pointer"
        >
          Sign In
        </Link>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition cursor-pointer flex items-center gap-1.5"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Mobile Hamburger Toggle */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800/80 transition"
        aria-label="Toggle Navigation Menu"
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 bg-[#081722] border-b border-slate-800 p-6 flex flex-col gap-3 text-sm font-semibold text-slate-200 shadow-2xl lg:hidden z-50"
          >
            <Link 
              to="/" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-emerald-400 transition"
            >
              Home
            </Link>
            <Link 
              to="/about" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-emerald-400 transition"
            >
              About EduNexus
            </Link>
            <Link 
              to="/privacy" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-emerald-400 transition"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/terms" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-emerald-400 transition"
            >
              Terms of Service
            </Link>
            <Link 
              to="/contact" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-emerald-400 transition"
            >
              Contact Support
            </Link>
            <Link 
              to="/cookies" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-emerald-400 transition"
            >
              Cookie Policy
            </Link>
            <Link 
              to="/data-deletion" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-emerald-400 transition"
            >
              Data Deletion Policy
            </Link>
            <Link 
              to="/accessibility" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-emerald-400 transition"
            >
              Accessibility Statement
            </Link>
            <Link 
              to="/delete-account" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-rose-400 hover:text-rose-300 transition"
            >
              Delete Account
            </Link>

            <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-extrabold text-xs shadow-md"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default PublicNavbar;
