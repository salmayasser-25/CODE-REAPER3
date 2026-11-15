import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  ArrowRight,
  AlertTriangle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { SpaceBackground } from './SpaceBackground.js';
import {
  useAuth,
  UserRole,
  getFirebaseAuthErrorMessage,
} from '../contexts/AuthContext.tsx';

export const LoginScreen: React.FC = () => {
  const { login, register, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>('astronaut');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [callsignOrCredential, setCallsignOrCredential] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isSurgeonSignup = mode === 'signup' && selectedRole === 'surgeon';
  const accentText = isSurgeonSignup ? 'text-[#FFB347]' : 'text-[#00E5FF]';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'signup' && !fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const resolvedRole =
        mode === 'signin'
          ? await login(email, password)
          : await register(email, password, {
              name: fullName,
              role: selectedRole,
              callsignOrCredential,
            });

      navigate(resolvedRole === 'surgeon' ? '/surgeon/overview' : '/astronaut/profile', {
        replace: true,
      });
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError('Enter your email address above to receive a password reset link.');
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setNotice(`Password reset email sent to ${email.trim()}. Check your inbox.`);
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen text-slate-100 relative selection:bg-[#00E5FF]/30 selection:text-[#00E5FF] flex flex-col justify-between"
      style={{
        backgroundImage: "url('/assets/aistudio/3d-rendering-dark-earth-space_2c80c4c8.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#050810',
      }}
    >
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ backgroundColor: 'rgba(5, 8, 16, 0.5)' }}
      />
      <SpaceBackground />

      {/* Top Auth Status Strip */}
      <div className="relative z-10 w-full bg-[#00E5FF]/10 border-b border-[#00E5FF]/30 px-4 sm:px-6 py-2 text-xs text-slate-200 flex items-center justify-between font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold tracking-wider uppercase text-white">
            FIREBASE AUTHENTICATION GATEWAY
          </span>
          <span className="hidden sm:inline text-slate-300">
            · ASTROCARE Email & Password Access Control
          </span>
        </div>
        <span className="text-[#00E5FF] font-bold">EXPEDITION-74</span>
      </div>

      {/* Main Auth Panel */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2.5">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#00E5FF]/15 border border-[#00E5FF]/50 text-[#00E5FF] shadow-[0_0_25px_rgba(0,229,255,0.4)] mb-1">
              <Activity className="w-7 h-7" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wider text-white font-['Chakra_Petch',sans-serif]">
              ASTRO<span className="text-[#00E5FF] glow-text-cyan">CARE</span>
            </h1>
            <p className="text-xs sm:text-sm font-mono text-slate-300 max-w-md mx-auto">
              {mode === 'signin'
                ? 'Sign in with your mission email. Your assigned console role is verified via Firestore.'
                : 'Create a mission account and assign your Astronaut or Flight Surgeon role.'}
            </p>
          </div>

          {/* Auth Card */}
          <div className="rounded-2xl border border-[#00E5FF]/35 bg-[#080f24]/92 backdrop-blur-xl shadow-[0_0_50px_rgba(0,229,255,0.16)] overflow-hidden">
            {/* Mode Tabs */}
            <div className="grid grid-cols-2 border-b border-slate-800 bg-[#050a18]/70">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setNotice(null);
                }}
                className={`py-3.5 text-xs sm:text-sm font-mono font-bold tracking-wider transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-[#00E5FF]/15 text-[#00E5FF] border-b-2 border-[#00E5FF]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                SIGN IN
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setNotice(null);
                }}
                className={`py-3.5 text-xs sm:text-sm font-mono font-bold tracking-wider transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-[#00E5FF]/15 text-[#00E5FF] border-b-2 border-[#00E5FF]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                CREATE ACCOUNT
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
              {/* Role Selector (Create Account only — Sign In resolves role from Firestore users/{uid}) */}
              {mode === 'signup' && (
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Account Role
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('astronaut')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        selectedRole === 'astronaut'
                          ? 'bg-[#00E5FF]/15 border-[#00E5FF] text-white shadow-[0_0_18px_rgba(0,229,255,0.22)]'
                          : 'bg-slate-900/60 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          selectedRole === 'astronaut'
                            ? 'bg-[#00E5FF]/20 text-[#00E5FF]'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-bold uppercase">Astronaut</div>
                        <div className="text-[11px] text-slate-400 truncate">Crew Console</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('surgeon')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        selectedRole === 'surgeon'
                          ? 'bg-[#FF8C00]/15 border-[#FF8C00] text-white shadow-[0_0_18px_rgba(255,140,0,0.22)]'
                          : 'bg-slate-900/60 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          selectedRole === 'surgeon'
                            ? 'bg-[#FF8C00]/20 text-[#FF8C00]'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-bold uppercase">Flight Surgeon</div>
                        <div className="text-[11px] text-slate-400 truncate">Medical Oversight</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Sign Up Fields */}
              {mode === 'signup' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="auth-fullname"
                      className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="auth-fullname"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={
                          isSurgeonSignup ? 'Dr. Marcus Vance, M.D.' : 'Dr. Salma Johnson'
                        }
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] focus:outline-none text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="auth-credential"
                      className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                    >
                      {isSurgeonSignup ? 'Credential ID' : 'Callsign'}
                    </label>
                    <div className="relative">
                      <Radio className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="auth-credential"
                        type="text"
                        value={callsignOrCredential}
                        onChange={(e) => setCallsignOrCredential(e.target.value)}
                        placeholder={isSurgeonSignup ? 'NASA-FS-9842' : 'Nova'}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] focus:outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="crew@astrocare.org"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] focus:outline-none text-sm"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300"
                  >
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={isSubmitting}
                      className={`text-xs font-mono ${accentText} hover:underline cursor-pointer disabled:opacity-50`}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] focus:outline-none text-sm"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/45 text-rose-200 text-xs font-mono"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success / Info Notice */}
              {notice && (
                <div
                  role="status"
                  className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/45 text-emerald-200 text-xs font-mono"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{notice}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-xl font-mono font-extrabold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                  isSurgeonSignup
                    ? 'bg-[#FF8C00] text-black hover:bg-[#FF8C00]/90 shadow-[0_0_25px_rgba(255,140,0,0.35)]'
                    : 'bg-[#00E5FF] text-black hover:bg-[#00E5FF]/90 shadow-[0_0_25px_rgba(0,229,255,0.35)]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === 'signin'
                        ? 'SIGN IN TO CONSOLE'
                        : `CREATE ${isSurgeonSignup ? 'SURGEON' : 'ASTRONAUT'} ACCOUNT`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secured by Firebase Authentication & Firestore Role Enforcement</span>
          </div>
        </div>
      </main>
    </div>
  );
};
