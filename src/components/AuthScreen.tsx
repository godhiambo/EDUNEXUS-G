import { useState, FormEvent, useEffect } from 'react';
import { useAuth, extractNameFromEmail } from '../context/AuthContext';
import { firebaseAuthDomain, firebaseProjectId } from '../firebase';
import { UserRole } from '../types';
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
  ChevronDown,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  BookOpen
} from 'lucide-react';

export default function AuthScreen() {
  const { 
    loginWithEmail, 
    registerWithEmail, 
    loginWithProvider, 
    loginOffline,
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
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'your-domain.com';
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';

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
      // Store the pending role in sessionStorage so AuthContext listener picks it up!
      const googleRegName = (name && name.trim() && name !== 'Google User') 
        ? name.trim() 
        : (email ? extractNameFromEmail(email) : '');
      sessionStorage.setItem('pending_demo_role', googleSelectedRole);
      sessionStorage.setItem('pending_google_reg_role', googleSelectedRole);
      sessionStorage.setItem('pending_google_reg_name', googleRegName);
      
      await loginWithProvider('google');
    } catch (err: any) {
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
    if (err.code === 'auth/operation-not-allowed') {
      return 'Email/Password authentication is disabled in your Firebase console. Please go to your Firebase Console -> Authentication -> Sign-in method, select "Email/Password", and click "Enable".';
    }
    if (err.code === 'auth/invalid-credential') return 'Invalid email or password.';
    if (err.code === 'auth/email-already-in-use') return 'This email is already registered.';
    if (err.code === 'auth/weak-password') return 'Password must be at least 6 characters.';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50/60 flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden">
      <div className="absolute -top-24 -left-16 w-72 h-72 bg-emerald-200/40 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 -right-12 w-80 h-80 bg-amber-100/45 blur-3xl rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-white/70 shadow-2xl rounded-[28px] overflow-hidden p-8 md:p-9 space-y-6 relative z-10">
        
        {/* Logo and Brand */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto relative flex items-center justify-center mb-1">
            <img src="/icon.svg" className="w-20 h-20 rounded-2xl shadow-md border border-[#e5e1da]" alt="EduNexus App Icon" referrerPolicy="no-referrer" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-serif font-extrabold text-slate-900 tracking-tight">EduNexus</h1>
            <p className="text-[11px] text-slate-500 font-semibold tracking-wide">Smart teaching workspace for modern classrooms</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-slate-200 bg-white p-2.5 text-center">
            <GraduationCap className="w-4 h-4 mx-auto text-emerald-600" />
            <p className="mt-1 text-[10px] font-bold text-slate-600">Lesson Design</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-2.5 text-center">
            <Users className="w-4 h-4 mx-auto text-indigo-600" />
            <p className="mt-1 text-[10px] font-bold text-slate-600">Class Insights</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-2.5 text-center">
            <BookOpen className="w-4 h-4 mx-auto text-amber-600" />
            <p className="mt-1 text-[10px] font-bold text-slate-600">AI Tutor</p>
          </div>
        </div>

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

        {/* Dynamic Authentication Guidance Banner */}
        <div className={`transition-all duration-300 border rounded-2xl p-4 text-center space-y-2 relative overflow-hidden ${
          hasInteractedForm 
            ? 'bg-emerald-50/85 border-emerald-300 scale-[1.01]' 
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-center gap-1.5 text-slate-700">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-wider">Sign-In Options</h3>
          </div>
          <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
            Use <span className="text-slate-900 font-extrabold">Email + Password</span> or <span className="text-emerald-700 font-extrabold">Google</span>. Both connect to the same EduNexus workspace.
          </p>
        </div>

        {/* Interactive Tabs: Sign In vs Register */}
        <div className="flex p-1 bg-slate-100/80 border border-slate-200 rounded-2xl">
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
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
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
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="space-y-3 animate-fadeIn">
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
                      Unable to reach authentication services. Please check your internet connection and try again.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-100 text-red-900 rounded-xl p-3 flex gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <p className="font-semibold leading-relaxed text-red-800">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                    className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">Choose Role</label>
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
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs'
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
            </>
          )}

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">Password</label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4 border border-slate-900 shadow-md"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{isRegistering ? 'Register with Email & Password' : 'Sign In with Password'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider with single-sign-on choice */}
        <div className="relative pt-6 pb-2">
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-[9px] uppercase font-extrabold tracking-widest">or continue with Google</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>
        </div>

        {/* Third Party Auth Options */}
        <div className="space-y-2 relative">

          {/* Google */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleClick}
            className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-white border text-slate-800 rounded-xl text-xs font-black transition-all cursor-pointer disabled:opacity-50 ${
              hasInteractedForm 
                ? 'border-emerald-500 shadow-md ring-2 ring-emerald-100' 
                : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/40'
            }`}
            title="Sign in with Google"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#10B981"
                d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.102C18.23 1.832 15.48 1 12.24 1 6.056 1 1.05 5.944 1.05 12s5.006 11 11.19 11c6.46 0 10.76-4.507 10.76-10.94 0-.737-.08-1.3-.176-1.775H12.24z"
              />
            </svg>
            <span className="text-slate-800 font-black text-sm tracking-tight">Continue with Google</span>
          </button>
        </div>

      </div>

      {showGoogleRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn" id="google-role-modal">
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-2xl p-6 space-y-6 relative overflow-hidden">
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
          </div>
        </div>
      )}

    </div>
  );
}
