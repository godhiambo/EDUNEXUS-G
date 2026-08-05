import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { deleteUser as deleteFirebaseAuthUser } from 'firebase/auth';
import { 
  Trash2, 
  AlertTriangle, 
  Mail, 
  CheckCircle2, 
  ShieldAlert, 
  X, 
  Loader2, 
  UserX,
  Info
} from 'lucide-react';

export const DeleteAccountPage: React.FC = () => {
  const { user, profile, deleteUserAccount, logout } = useAuth();
  const navigate = useNavigate();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      setErrorMsg('Please type "DELETE" to confirm account deletion.');
      return;
    }

    if (!user) return;

    setIsDeleting(true);
    setErrorMsg('');

    try {
      // 1. Delete user profile from Firestore
      await deleteUserAccount(user.uid);

      // 2. Attempt to delete Firebase Auth user
      try {
        if (!user.uid.startsWith('offline-sandbox-')) {
          await deleteFirebaseAuthUser(user);
        }
      } catch (authErr: any) {
        console.warn('Firebase auth user deletion notice:', authErr);
        if (authErr?.code === 'auth/requires-recent-login') {
          // If recent login required, logout user after profile deletion
          await logout();
          setSuccessMsg('Profile data deleted. Re-authentication required for complete Auth deletion. You have been logged out.');
          setIsDeleting(false);
          setShowConfirmModal(false);
          return;
        }
      }

      // 3. Clear local offline data & logout
      await logout();
      setSuccessMsg('Your account and associated profile data have been permanently deleted.');
      setShowConfirmModal(false);

      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (err: any) {
      console.error('Error during account deletion:', err);
      setErrorMsg(err.message || 'An error occurred while deleting your account. Please try again or contact support.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500/30 selection:text-rose-200">
      <SEO 
        title="Delete Account" 
        description="Permanently delete your EduNexus account and personal data."
        canonicalPath="/delete-account"
      />

      <PublicNavbar />

      {/* Header Banner */}
      <section className="relative pt-16 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-4xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-extrabold uppercase tracking-wider">
            <Trash2 className="w-4 h-4" />
            <span>Account Management</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-black text-white">Delete Your Account</h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Manage your account status and permanent data removal settings.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-10 flex-1">

        {successMsg && (
          <div className="p-6 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 space-y-2 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
            <h3 className="font-serif font-bold text-lg text-white">Account Deletion Complete</h3>
            <p className="text-xs text-emerald-200">{successMsg}</p>
          </div>
        )}

        {/* Data Removal Summary Box */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-serif font-bold text-white">Permanent Account Deletion Notice</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                When you delete your EduNexus account, all personal profile records and associated learning data will be permanently removed.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-800/80 text-xs">
            {/* Deleted Data */}
            <div className="space-y-2">
              <h3 className="font-bold text-rose-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" />
                <span>What Will Be Deleted</span>
              </h3>
              <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                <li>Personal user profile and authentication credentials</li>
                <li>Saved AI Tutor chat logs and conversation histories</li>
                <li>Created lesson plans, worksheets, and study resources</li>
                <li>Assessment results, quizzes, and grading rubrics</li>
                <li>Saved favorites and custom learning pathways</li>
              </ul>
            </div>

            {/* Retained Data */}
            <div className="space-y-2">
              <h3 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>What May Be Retained</span>
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Anonymized system error logs, aggregate performance metrics, or financial transaction records may be retained temporarily where required by law, audit compliance, or fraud prevention.
              </p>
            </div>
          </div>
        </div>

        {/* Action Section based on Auth state */}
        {user ? (
          /* SIGNED IN USER VIEW */
          <div className="p-6 sm:p-8 rounded-3xl bg-rose-950/20 border border-rose-500/30 space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-serif font-bold text-white">Signed in Account</h2>
              <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
                <div>
                  <p className="text-white font-bold">{profile?.displayName || user.displayName || 'Educator'}</p>
                  <p className="text-slate-400">{user.email}</p>
                </div>
                {profile?.role && (
                  <span className="ml-auto px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-[10px]">
                    Role: {profile.role}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setShowConfirmModal(true);
                  setErrorMsg('');
                  setConfirmText('');
                }}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete My Account</span>
              </button>
            </div>
          </div>
        ) : (
          /* NOT SIGNED IN USER VIEW */
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-serif font-bold text-white">Not Signed In?</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                If you are not currently signed into your EduNexus account, or need manual assistance deleting an account, please send an account deletion request to our support team from your registered email address.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                <Mail className="w-3.5 h-3.5" />
                <span>Manual Deletion Request Email</span>
              </div>
              <a 
                href="mailto:support@joinedunexus.app?subject=Account%20Deletion%20Request" 
                className="text-white font-extrabold text-sm hover:text-emerald-300 transition block"
              >
                support@joinedunexus.app
              </a>
              <p className="text-[11px] text-slate-400 pt-1">
                Include your full name, registered email address, and reason for request. Account deletion requests are processed within 48 hours.
              </p>
            </div>
          </div>
        )}

      </section>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-8 h-8" />
              <h3 className="text-xl font-serif font-bold text-white">Confirm Account Deletion</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This action is <strong className="text-rose-400">permanent and cannot be undone</strong>. To proceed, please type <strong className="text-white">&quot;DELETE&quot;</strong> in the box below.
            </p>

            <div className="space-y-2">
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder='Type "DELETE"'
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 font-bold focus:outline-none focus:border-rose-500 text-xs"
              />

              {errorMsg && (
                <p className="text-[11px] text-rose-400 font-bold">{errorMsg}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <UserX className="w-4 h-4" />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default DeleteAccountPage;
