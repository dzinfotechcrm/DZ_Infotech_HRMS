import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { syncAuthenticatedUser } from '../../firebase/auth';

export default function Login() {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    try {
      const firebaseUser = await signInWithGoogle();
      const profile = await syncAuthenticatedUser(firebaseUser);
      if (!profile) {
        toast.error('Access denied. Your account is not registered in HRMS.');
        navigate('/access-denied', { replace: true });
        return;
      }
      if (!profile.isActive || profile.status !== 'active') {
        toast.error('Your account is inactive. Please contact your administrator.');
        navigate('/access-denied', { replace: true });
        return;
      }
      toast.success('Welcome back');
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (error) {
      toast.error(error?.message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-neutral-900">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-80"
        style={{ backgroundImage: 'url(/dz_bg.png)' }}
      />

      {/* Overlay gradient for better readability */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-neutral-900/60 via-primary-900/40 to-neutral-900/80" />

      {/* Glassmorphic Login Container */}
      <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col md:flex-row items-stretch justify-center gap-6 lg:gap-10">

        {/* Left Branding Area */}
        <div className="flex-1 rounded-[2rem] border border-white/10 bg-black/30 p-10 lg:p-12 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] text-white flex flex-col justify-between animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div>
            <div className="mb-8 inline-flex items-center rounded-full border border-primary-400/30 bg-primary-500/20 px-5 py-2 text-xs font-bold uppercase tracking-[0.3em] text-primary-200 backdrop-blur-md">
              DZ Infotech · Bhavnagar
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
              Enterprise <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-cyan-300">HR Platform</span>
            </h1>
            <p className="mt-8 text-lg leading-relaxed text-neutral-300 max-w-md font-medium">
              A secure, comprehensive ecosystem for employee records, attendance tracking, and streamlined payroll management.
            </p>
          </div>

          <div className="mt-16 flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-white/20 p-2">
              <img src="/DZ_Infotech_Logo.png" alt="DZ Infotech" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-widest uppercase">Secure Portal</p>
              <p className="text-sm text-primary-200 font-medium">Restricted access only</p>
            </div>
          </div>
        </div>

        {/* Right Login Area */}
        <div className="w-full md:w-[420px] rounded-[2rem] border border-white/20 bg-white/10 p-10 lg:p-12 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col justify-center transition-all duration-500 hover:bg-white/15 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-150">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Welcome Back</h2>
            <p className="text-base text-neutral-300 font-medium">Sign in with your workspace account</p>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-4 rounded-2xl bg-white px-6 py-4 text-base font-bold text-neutral-900 transition-all duration-300 hover:bg-neutral-100 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Spinner className="h-6 w-6 border-neutral-900" />
            ) : (
              <svg className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {loading ? 'Authenticating...' : 'Continue with Google'}
          </button>

          <div className="mt-10 rounded-2xl border border-white/10 bg-black/20 p-5 text-center backdrop-blur-sm">
            <p className="text-sm leading-relaxed text-neutral-300">
              Only verified <span className="font-semibold text-white">DZ Infotech</span> members can access this portal. Unrecognized accounts are automatically blocked.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
