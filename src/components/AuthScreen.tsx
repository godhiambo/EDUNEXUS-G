import { useState, FormEvent, useEffect } from 'react';
import { useAuth, extractNameFromEmail } from '../context/AuthContext';
import { firebaseAuthDomain, firebaseProjectId } from '../firebase';
import { UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { AuthBackgroundPattern, GeometricPatternType } from './AuthBackgroundPattern';
import PasswordResetModal from './PasswordResetModal';
import LandingPage from './public/LandingPage';
import CurriculumShowcasePage from './public/CurriculumShowcasePage';
import WorkspaceSelection from './public/WorkspaceSelection';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  User, 
  ShieldCheck, 
  Users, 
  ArrowRight,
  AlertCircle,
  QrCode,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  BookOpen,
  Home,
  Globe,
  LogIn
} from 'lucide-react';

export default function AuthScreen() {
  const [publicPage, setPublicPage] = useState<'home' | 'workspaces' | 'showcase' | 'login'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('showcase')) return 'showcase';
      if (hash.includes('workspaces') || hash.includes('roles')) return 'workspaces';
      if (hash.includes('login') || hash.includes('auth')) return 'login';
    }
    return 'home';
  });
  const { 
    loginWithEmail, 
    registerWithEmail, 
    loginWithProvider, 
    loginOffline,
    sendPasswordReset,
    loading: authLoading 
  } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Teacher');
  
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasInteractedForm, setHasInteractedForm] = useState(false);

  // Forgot password states
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'your-domain.com';
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';

  // Background geometric pattern selection state
  const [selectedPattern, setSelectedPattern] = useState<GeometricPatternType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('edunexus_auth_pattern_v2') as GeometricPatternType;
      if (saved) return saved;
    }
    return 'sacred-astrolabe';
  });

  const [showFloatingBadges, setShowFloatingBadges] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('edunexus_auth_badges');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  const handlePatternChange = (pattern: GeometricPatternType) => {
    setSelectedPattern(pattern);
    if (typeof window !== 'undefined') {
      localStorage.setItem('edunexus_auth_pattern_v2', pattern);
    }
  };

  const handleToggleBadges = () => {
    setShowFloatingBadges(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('edunexus_auth_badges', String(next));
      }
      return next;
    });
  };

  // Google login role selection states
  const [showGoogleRoleModal, setShowGoogleRoleModal] = useState(false);
  const [googleSelectedRole, setGoogleSelectedRole] = useState<UserRole>('Teacher');

  const handleGoogleClick = () => {
    setShowGoogleRoleModal(true);
  };

  const handleConfirmGoogleRole = async () => {
    setShowGoogleRoleModal(false);
    setError(null);
    setErrorCode(null);
    setLoading(true);
    try {
      const googleRegName = (name && name.trim() && name !== 'Google User') 
        ? name.trim() 
        : (email ? extractNameFromEmail(email) : '');
      sessionStorage.setItem('pending_demo_role', googleSelectedRole);
      sessionStorage.setItem('pending_google_reg_role', googleSelectedRole);
      sessionStorage.setItem('pending_google_reg_name', googleRegName);
      
      await loginWithProvider('google');
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        // User closed popup window, do not display error message
        setError(null);
        setErrorCode(null);
        return;
      }
      console.error(err);
      setError(getFriendlyErrorMessage(err));
      setErrorCode(err.code || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedError = sessionStorage.getItem('auth_error_msg');
    if (savedError) {
      setError(savedError);
      if (savedError.toLowerCase().includes('register') || savedError.toLowerCase().includes('sign up')) {
        setErrorCode('auth/unregistered');
      }
      sessionStorage.removeItem('auth_error_msg');
    }
  }, [authLoading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorCode(null);
    setLoading(true);

    try {
      if (isRegistering) {
        if (!name.trim()) throw new Error('Please enter your full name.');
        await registerWithEmail(email, password, name, role);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err));
      setErrorCode(err.code || null);
    } finally {
      setLoading(false);
    }
  };

  const getFriendlyErrorMessage = (err: any): string => {
    if (!err) return 'An unknown error occurred.';
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
      return '';
    }
    if (err.code === 'auth/operation-not-allowed') {
      return 'Email/Password authentication is disabled in your Firebase console. Please go to your Firebase Console -> Authentication -> Sign-in method, select "Email/Password", and click "Enable".';
    }
    if (err.code === 'auth/invalid-credential') return 'Invalid email or password.';
    if (err.code === 'auth/email-already-in-use') return 'This email is already registered.';
    if (err.code === 'auth/weak-password') return 'Password must be at least 6 characters.';
    if (err.code === 'auth/user-not-found') return 'No registered account found with this email address. Please check your spelling or create a new account.';
    if (err.code === 'auth/invalid-email') return 'Please enter a valid email address.';
    if (err.code === 'auth/too-many-requests') return 'Too many password reset requests. Please wait a few minutes before trying again.';
    if (err.code === 'auth/network-request-failed' || (err.message && err.message.toLowerCase().includes('network-request-failed'))) {
      return 'Network connection error: Unable to reach authentication services. Please verify your internet connection or use Offline Demo / Guest mode below.';
    }
    if (err.code === 'auth/unauthorized-domain' || (err.message && err.message.toLowerCase().includes('unauthorized-domain'))) {
      return `The active domain ${currentHost} is not yet authorized in your Firebase project. Please authorize this domain in both the Firebase Console and Google Cloud Console OAuth credentials.`;
    }
    return err.message || String(err);
  };

  const handleDemoLogin = async (targetRole: UserRole) => {
    setError(null);
    setErrorCode(null);
    setLoading(true);
    
    try {
      await loginOffline(targetRole);
    } catch (err: any) {
      console.error(err);
      setErrorCode(err.code || null);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col font-sans select-none">
      
      {/* PUBLIC PERSISTENT TOP NAVIGATION BAR */}
      <nav className="h-16 border-b border-slate-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between shadow-xs">
        <div 
          onClick={() => setPublicPage('home')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <img src="/icon.svg" className="w-8 h-8 rounded-xl shadow-xs group-hover:scale-105 transition" alt="EduNexus" referrerPolicy="no-referrer" />
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight block leading-none group-hover:text-[#5f6f52] transition">EduNexus</span>
            <span className="text-[10px] text-amber-800 font-extrabold uppercase tracking-wider block mt-0.5">Competency-Based AI Platform</span>
          </div>
        </div>

        {/* Public Page Links */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={() => setPublicPage('home')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              publicPage === 'home' 
                ? 'bg-[#5f6f52]/10 text-[#5f6f52]' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home & Overview</span>
          </button>

          <button
            onClick={() => setPublicPage('workspaces')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              publicPage === 'workspaces' 
                ? 'bg-[#5f6f52]/10 text-[#5f6f52]' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-700" />
            <span>Choose Workspace</span>
          </button>

          <button
            onClick={() => setPublicPage('showcase')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              publicPage === 'showcase' 
                ? 'bg-[#5f6f52]/10 text-[#5f6f52]' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline">OER Showcase</span>
          </button>

          <button
            onClick={() => setPublicPage('login')}
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
              publicPage === 'login' 
                ? 'bg-[#5f6f52] text-white shadow-xs' 
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Portal Sign In</span>
          </button>
        </div>
      </nav>

      {/* PUBLIC PAGE CONTENT ROUTING */}
      {publicPage === 'home' && (
        <LandingPage
          onChooseWorkspace={() => setPublicPage('workspaces')}
          onOpenAuth={(selectedRole) => {
            if (selectedRole) setRole(selectedRole);
            setPublicPage('login');
          }}
          onNavigateToShowcase={() => setPublicPage('showcase')}
          onOpenDemoSandbox={() => handleDemoLogin('Teacher')}
        />
      )}

      {publicPage === 'workspaces' && (
        <WorkspaceSelection
          onSelectRole={(selectedRole) => {
            setRole(selectedRole);
            setPublicPage('login');
          }}
          onBackToHome={() => setPublicPage('home')}
        />
      )}

      {publicPage === 'showcase' && (
        <CurriculumShowcasePage
          onOpenAuth={(selectedRole) => {
            if (selectedRole) setRole(selectedRole);
            setPublicPage('login');
          }}
          onNavigateToHome={() => setPublicPage('home')}
        />
      )}

      {publicPage === 'login' && (
        <div className="flex-1 bg-gradient-to-br from-[#06151a] via-[#0b222a] to-[#040e13] flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden">
          
          {/* Rich Dynamic Academic & Geometric Background Pattern */}
          <AuthBackgroundPattern 
            currentPattern={selectedPattern}
            onPatternChange={handlePatternChange}
            showFloatingBadges={showFloatingBadges}
            onToggleBadges={handleToggleBadges}
          />

          {/* Main Glassmorphic Auth Card */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md bg-white/70 backdrop-blur-2xl border border-white/70 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.5)] rounded-[32px] overflow-hidden p-7 md:p-9 space-y-6 relative z-10 my-auto"
          >
        {/* Entrance Shimmer Beam Overlay */}
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: '220%', opacity: [0, 0.65, 0] }}
          transition={{ delay: 0.1, duration: 0.6, ease: 'easeInOut' }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none z-20 -skew-x-12"
        />
        
        {/* Top Logo and Brand Header */}
        <div className="text-center space-y-2.5">
          <motion.div 
            initial={{ scale: 0.6, y: -10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22, delay: 0.05 }}
            className="w-20 h-20 mx-auto relative flex items-center justify-center mb-1 group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/30 to-amber-500/30 rounded-2xl blur-md group-hover:blur-lg transition-all animate-pulse" />
            <img 
              src="/icon.svg" 
              className="w-20 h-20 rounded-2xl shadow-lg border border-slate-200/80 relative z-10 transition-transform duration-300 group-hover:scale-105" 
              alt="EduNexus App Icon" 
              referrerPolicy="no-referrer" 
            />
          </motion.div>
          
          <div className="space-y-1">
            <motion.h1 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.25, ease: 'easeOut' }}
              className="text-3xl font-serif font-extrabold text-slate-900 tracking-tight"
            >
              EduNexus
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.2, ease: 'easeOut' }}
              className="text-xs text-slate-500 font-semibold tracking-wide"
            >
              Smart teaching workspace for modern classrooms
            </motion.p>
          </div>
        </div>

        {/* Three Feature Indicator Badges */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.04, delayChildren: 0.12 } }
          }}
          className="grid grid-cols-3 gap-2.5"
        >
          <motion.div 
            variants={{
              hidden: { opacity: 0, scale: 0.9, y: 10 },
              visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 22 } }
            }}
            whileHover={{ y: -3, scale: 1.04 }}
            className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-3 text-center transition-all shadow-2xs cursor-pointer"
          >
            <div className="w-8 h-8 mx-auto rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-700">
              <GraduationCap className="w-4 h-4" />
            </div>
            <p className="mt-1.5 text-[10.5px] font-extrabold text-slate-700 leading-tight">Lesson Design</p>
          </motion.div>

          <motion.div 
            variants={{
              hidden: { opacity: 0, scale: 0.9, y: 10 },
              visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 22 } }
            }}
            whileHover={{ y: -3, scale: 1.04 }}
            className="rounded-2xl border border-purple-200/80 bg-purple-50/70 p-3 text-center transition-all shadow-2xs cursor-pointer"
          >
            <div className="w-8 h-8 mx-auto rounded-xl bg-purple-600/10 flex items-center justify-center text-purple-700">
              <Users className="w-4 h-4" />
            </div>
            <p className="mt-1.5 text-[10.5px] font-extrabold text-slate-700 leading-tight">Class Insights</p>
          </motion.div>

          <motion.div 
            variants={{
              hidden: { opacity: 0, scale: 0.9, y: 10 },
              visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 22 } }
            }}
            whileHover={{ y: -3, scale: 1.04 }}
            className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3 text-center transition-all shadow-2xs cursor-pointer"
          >
            <div className="w-8 h-8 mx-auto rounded-xl bg-amber-600/10 flex items-center justify-center text-amber-700">
              <BookOpen className="w-4 h-4" />
            </div>
            <p className="mt-1.5 text-[10.5px] font-extrabold text-slate-700 leading-tight">AI Tutor</p>
          </motion.div>
        </motion.div>

        {/* Classroom Share URL Guest Login Bypass */}
        {(window.location.hash.includes('docId=') || window.location.search.includes('docId=')) && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4.5 text-center space-y-3 animate-fadeIn shadow-xs">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white mx-auto shadow-sm">
              <QrCode className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-emerald-950">Shared Lesson Materials</h3>
              <p className="text-[11px] text-emerald-800/80 mt-1 leading-relaxed">
                You have been shared interactive lesson materials. View them instantly in view-only classroom mode as a guest student.
              </p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('Student')}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>🎒</span>
              <span>Open Shared Material as Guest Student</span>
            </button>
          </div>
        )}

        {/* Inset Welcome Panel & Primary Google Sign-in Container */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.25, ease: 'easeOut' }}
          className="bg-gradient-to-br from-slate-50/70 to-slate-100/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4.5 text-center space-y-3 shadow-inner relative overflow-hidden group"
        >
          <div className="space-y-1">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center justify-center gap-1.5">
              <span>Welcome to EduNexus.</span>
            </h2>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed max-w-xs mx-auto">
              Use Email + Password or Google. Both connect to the same EduNexus workspace.
            </p>
          </div>

          <motion.button
            type="button"
            disabled={loading}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleClick}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-white border border-slate-300 hover:border-emerald-500 hover:shadow-md text-slate-800 rounded-xl text-xs font-extrabold transition-all cursor-pointer disabled:opacity-50 group/btn"
          >
            <svg className="w-4 h-4 shrink-0 transition-transform group-hover/btn:scale-110" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-slate-800 font-extrabold text-xs">Continue with Google</span>
          </motion.button>
        </motion.div>

        {/* Interactive Tabs: Sign In vs Create Account & Form Wrapper */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.25, ease: 'easeOut' }}
          className="space-y-4"
        >
          <div className="flex p-1 bg-slate-100/70 backdrop-blur-md border border-slate-200/80 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(false);
                setError(null);
                setErrorCode(null);
              }}
              className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all duration-200 cursor-pointer ${
                !isRegistering
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegistering(true);
                setError(null);
                setErrorCode(null);
              }}
              className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all duration-200 cursor-pointer ${
                isRegistering
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
            >
              Create Account
            </button>
          </div>

        {/* Error Feedback Messages */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              {errorCode === 'auth/operation-not-allowed' ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex flex-col gap-3 text-xs shadow-xs">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5 animate-bounce" />
                    <div>
                      <h4 className="font-extrabold text-amber-950 text-[13px]">Firebase Setup Required</h4>
                      <p className="mt-1 text-amber-900/90 leading-relaxed font-semibold">
                        {error}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white/90 border border-amber-200 rounded-xl p-3.5 space-y-2 text-[11px] text-amber-950 font-medium">
                    <p className="font-bold text-amber-950">🛠️ Step-by-Step Resolution Guide:</p>
                    <ol className="list-decimal list-inside space-y-1.5 pl-1 text-amber-900 leading-relaxed">
                      <li>
                        Go to your <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold text-[#5f6f52] hover:text-[#4d5a42] inline-flex items-center gap-0.5">Firebase Console</a>.
                      </li>
                      <li>
                        Select your active Firebase Project: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-950 select-all">{firebaseProjectId}</code>.
                      </li>
                      <li>
                        On the left sidebar, click on <span className="font-bold text-amber-950">Build</span> &gt; <span className="font-bold text-amber-950">Authentication</span>.
                      </li>
                      <li>
                        Click on the <span className="font-bold text-amber-950">Sign-in method</span> tab.
                      </li>
                      <li>
                        Click <span className="font-bold text-amber-950">Add new provider</span> and enable both <span className="font-bold text-amber-950">Email/Password</span> and <span className="font-bold text-amber-950">Google</span>.
                      </li>
                    </ol>
                  </div>
                </div>
              ) : errorCode === 'auth/unauthorized-domain' ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex flex-col gap-3 text-xs shadow-xs">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5 animate-bounce" />
                    <div>
                      <h4 className="font-extrabold text-[#5f6f52] text-[13px]">Custom Domain Authorization Required</h4>
                      <p className="mt-1 text-amber-900/95 leading-relaxed font-semibold">
                        {error}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white/95 border border-amber-200 rounded-xl p-3.5 space-y-2 text-[11px] text-amber-950 font-semibold leading-relaxed">
                    <p className="font-black text-[#5f6f52] flex items-center gap-1">🛠️ Step-by-Step Resolution Guide:</p>
                    <ol className="list-decimal list-inside space-y-2 pl-0.5 font-medium text-slate-700">
                      <li>
                        Open the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-extrabold text-[#5f6f52] hover:text-[#4d5a42]">Firebase Console</a>.
                      </li>
                      <li>
                        Select your project: <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono font-bold text-amber-950 select-all">{firebaseProjectId}</code>.
                      </li>
                      <li>
                        Click <span className="font-bold text-slate-900">Authentication</span> &gt; <span className="font-bold text-slate-900">Settings</span> &gt; <span className="font-bold text-slate-900">Authorized Domains</span>.
                      </li>
                      <li>
                        Click <span className="font-bold text-slate-900">Add domain</span> and enter: <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono font-bold text-amber-950 select-all">{currentHost}</code>.
                      </li>
                      <li>
                        Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline font-extrabold text-[#5f6f52] hover:text-[#4d5a42]">Google Cloud Credentials Console</a>.
                      </li>
                      <li>
                        Edit your <span className="font-bold text-slate-900">OAuth 2.0 Client ID</span> and add <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono font-bold text-amber-950 select-all">{currentOrigin}</code> to <span className="font-bold text-slate-900">Authorized JavaScript origins</span>. Also add <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono font-bold text-amber-950 select-all">{`https://${firebaseAuthDomain}/__/auth/handler`}</code> to <span className="font-bold text-slate-900">Authorized redirect URIs</span>.
                      </li>
                    </ol>
                  </div>
                </div>
              ) : errorCode === 'auth/email-already-in-use' ? (
                <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl p-4 flex flex-col gap-3 text-xs shadow-xs">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-blue-950 text-[13px]">Account Already Exists</h4>
                      <p className="mt-1 text-blue-900/90 leading-relaxed font-semibold">
                        This email address is already registered. If this is you, switch to the login tab to sign in.
                      </p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(false);
                      setError(null);
                      setErrorCode(null);
                    }}
                    className="w-full py-2 bg-[#5f6f52] hover:bg-[#4d5a42] text-white font-bold rounded-xl transition shadow-xs cursor-pointer text-center text-[11px]"
                  >
                    Switch to Sign In Instead
                  </button>
                </div>
              ) : errorCode === 'auth/unregistered' ? (
                <div className="bg-rose-50 border border-rose-200 text-rose-950 rounded-2xl p-4 flex flex-col gap-3 text-xs shadow-xs">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-rose-950 text-[13px]">Sign-Up Profile Required</h4>
                      <p className="mt-1 text-rose-900/90 leading-relaxed font-semibold">
                        {error}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(true);
                      setError(null);
                      setErrorCode(null);
                    }}
                    className="w-full py-2 bg-[#5f6f52] hover:bg-[#4d5a42] text-white font-bold rounded-xl transition shadow-xs cursor-pointer text-center text-[11px]"
                  >
                    Go to Register Page
                  </button>
                </div>
              ) : (errorCode === 'auth/network-request-failed' || (error && error.toLowerCase().includes('network-request-failed'))) ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-950 rounded-2xl p-4 flex flex-col gap-3 text-xs shadow-xs">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5 animate-bounce" />
                    <div>
                      <h4 className="font-extrabold text-amber-950 text-[13px]">Network Connection Error</h4>
                      <p className="mt-1 text-amber-900/90 leading-relaxed font-semibold">
                        Unable to reach authentication services. You can continue using EduNexus in Sandbox Mode without internet authentication.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin(role || 'Teacher')}
                    className="w-full py-2 bg-amber-700 hover:bg-amber-800 text-white font-extrabold rounded-xl transition shadow-xs cursor-pointer text-center text-[11px]"
                  >
                    Enter Sandbox Mode ({role || 'Teacher'})
                  </button>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-100 text-red-900 rounded-xl p-3 flex gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <p className="font-semibold leading-relaxed text-red-800">{error}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {isRegistering && (
              <motion.div
                key="register-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-4 overflow-hidden"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">
                    Full Name
                  </label>
                  <div className="relative group">
                    <User className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jane Adhiambo"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setHasInteractedForm(true);
                      }}
                      onFocus={() => setHasInteractedForm(true)}
                      className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">
                    Choose Workspace Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Teacher', 'Student', 'Parent'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setRole(r);
                          setHasInteractedForm(true);
                        }}
                        className={`py-2 px-1 border text-[11px] font-extrabold rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer ${
                          role === r
                            ? 'border-emerald-500 bg-emerald-50/80 text-emerald-800 shadow-xs ring-2 ring-emerald-500/20'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                      >
                        <span className="text-base">
                          {r === 'Teacher' && '🍎'}
                          {r === 'Student' && '🎒'}
                          {r === 'Parent' && '👪'}
                        </span>
                        <span>{r}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">
              EMAIL ADDRESS
            </label>
            <div className="relative group">
              <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
              <input
                type="email"
                required
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setHasInteractedForm(true);
                }}
                onFocus={() => setHasInteractedForm(true)}
                className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all shadow-2xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">
                PASSWORD
              </label>
              {!isRegistering && (
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email || '');
                    setShowForgotPasswordModal(true);
                  }}
                  className="text-[10.5px] font-extrabold text-[#5f6f52] hover:text-[#4d5a42] hover:underline cursor-pointer transition-colors"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative group">
              <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setHasInteractedForm(true);
                }}
                onFocus={() => setHasInteractedForm(true)}
                className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded cursor-pointer transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4 border border-slate-900 shadow-md shadow-slate-900/10"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{isRegistering ? 'Register with Email & Password' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>
        </motion.div>
      </motion.div>
    </div>
  )}

      {/* Google Role Selector Modal */}
      <AnimatePresence>
        {showGoogleRoleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" id="google-role-modal">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-2xl p-6 space-y-6 relative overflow-hidden"
            >
              {/* Ambient Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="text-center space-y-1">
                <div className="inline-flex p-2 bg-emerald-50 rounded-2xl border border-emerald-100 mb-1">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 animate-pulse" />
                </div>
                <h3 className="text-base font-black text-slate-800 tracking-tight">Select Workspace Role</h3>
                <p className="text-[11px] text-slate-500">
                  Please specify your default workspace role before continuing with Google:
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Teacher */}
                <button
                  type="button"
                  onClick={() => setGoogleSelectedRole('Teacher')}
                  className={`p-3 border rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition-all duration-200 cursor-pointer ${
                    googleSelectedRole === 'Teacher'
                      ? 'border-emerald-500 bg-emerald-50/20 text-emerald-700 ring-2 ring-emerald-300'
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-2xl">🍎</span>
                  <span className="text-xs font-black">Teacher</span>
                  <span className="text-[9px] text-slate-400 font-medium">Curriculums & Plans</span>
                </button>

                {/* Student */}
                <button
                  type="button"
                  onClick={() => setGoogleSelectedRole('Student')}
                  className={`p-3 border rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition-all duration-200 cursor-pointer ${
                    googleSelectedRole === 'Student'
                      ? 'border-emerald-500 bg-emerald-50/20 text-emerald-700 ring-2 ring-emerald-300'
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-2xl">🎒</span>
                  <span className="text-xs font-black">Student</span>
                  <span className="text-[9px] text-slate-400 font-medium">Socratic Tutor</span>
                </button>

                {/* Parent */}
                <button
                  type="button"
                  onClick={() => setGoogleSelectedRole('Parent')}
                  className={`p-3 border rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition-all duration-200 cursor-pointer ${
                    googleSelectedRole === 'Parent'
                      ? 'border-emerald-500 bg-emerald-50/20 text-emerald-700 ring-2 ring-emerald-300'
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-2xl">👪</span>
                  <span className="text-xs font-black">Parent</span>
                  <span className="text-[9px] text-slate-400 font-medium">Performance Tracking</span>
                </button>

                {/* Administrator */}
                <button
                  type="button"
                  onClick={() => setGoogleSelectedRole('Administrator')}
                  className={`p-3 border-2 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition-all duration-200 cursor-pointer relative overflow-hidden ${
                    googleSelectedRole === 'Administrator'
                      ? 'border-rose-500 bg-rose-50/20 text-rose-700 ring-2 ring-rose-300'
                      : 'border-slate-100 hover:border-rose-200 bg-slate-50/40 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="absolute top-1 right-1 bg-rose-600 text-[8px] text-white font-extrabold px-1 py-0.5 rounded-md scale-90 uppercase">
                    Lock
                  </div>
                  <span className="text-2xl">🛡️</span>
                  <span className="text-xs font-black">Admin</span>
                  <span className="text-[9px] text-slate-400 font-medium">Global Control</span>
                </button>
              </div>

              {/* Admin Verification Disclaimer message */}
              {googleSelectedRole === 'Administrator' && (
                <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3.5 text-center space-y-1.5 animate-slideUp">
                  <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider flex items-center justify-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                    <span>Authorized Personnel Only</span>
                  </span>
                  <p className="text-[10px] text-rose-950 font-semibold leading-normal">
                    Administrator privileges are strictly locked to <span className="font-extrabold text-rose-700 text-[10.5px]">ojiambo.godfry@gmail.com</span> and <span className="font-extrabold text-rose-700 text-[10.5px]">godfreynexused@gmail.com</span>. Any other account will be automatically registered with a Teacher profile.
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleRoleModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 rounded-xl cursor-pointer transition-all border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmGoogleRole}
                  className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-100 border border-emerald-500"
                >
                  <span>Confirm & Google Sign-In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Reset Modal Component */}
      <PasswordResetModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        initialEmail={resetEmail}
      />

    </div>
  );
}
