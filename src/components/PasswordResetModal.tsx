import React, { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import {
  KeyRound,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  X,
  Loader2
} from 'lucide-react';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export default function PasswordResetModal({
  isOpen,
  onClose,
  initialEmail = ''
}: PasswordResetModalProps) {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
      setSuccessMessage(null);
      setErrorMessage(null);
      setLoading(false);
    }
  }, [isOpen, initialEmail]);

  if (!isOpen) return null;

  const getFriendlyErrorMessage = (err: any): string => {
    const code = err?.code || '';
    if (code === 'auth/user-not-found') {
      return 'No account was found with this email address. Please double check spelling or sign up.';
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Too many password reset requests. Please wait a few minutes before trying again.';
    }
    return err?.message || 'Failed to send password reset email. Please try again.';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(trimmedEmail);
      setSuccessMessage(`Password recovery instructions have been sent to ${trimmedEmail}. Check your inbox and spam folder.`);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-md" id="password-reset-modal-overlay">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-2xl p-6 md:p-7 space-y-5 relative overflow-hidden"
        >
          {/* Top Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Ambient Background Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-1.5 pt-1">
            <div className="w-12 h-12 mx-auto bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center justify-center text-[#5f6f52] shadow-xs">
              <KeyRound className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-serif font-extrabold text-slate-900 tracking-tight">
              Password Recovery
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
              Enter your registered email address to receive a secure password reset link via Firebase Auth.
            </p>
          </div>

          {/* Content Body */}
          {successMessage ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-3 animate-fadeIn">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white mx-auto shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-emerald-950">Email Sent Successfully</h4>
                <p className="text-[11px] text-emerald-900/90 mt-1 leading-relaxed font-semibold">
                  {successMessage}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-[#5f6f52] hover:bg-[#4d5a42] text-white font-extrabold text-xs rounded-xl transition shadow-xs cursor-pointer mt-2"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-xl p-3 flex gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <p className="font-semibold leading-relaxed text-rose-800">{errorMessage}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">
                  Registered Email Address
                </label>
                <div className="relative group">
                  <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                  <input
                    type="email"
                    required
                    placeholder="you@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={onClose}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 rounded-xl cursor-pointer transition-all border border-slate-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white text-xs font-black py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md shadow-slate-900/10 border border-slate-900 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Sending Email...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Recovery Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
