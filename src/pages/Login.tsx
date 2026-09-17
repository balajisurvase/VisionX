import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { loginWithUserId } from '../services/authService';
import { OfficerUser } from '../types/auth';

interface LoginProps {
  onLoginSuccess: (user: OfficerUser) => void;
  onViewLanding?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [userId, setUserId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUserId = userId.trim();
    const cleanPassword = password.trim();

    if (!cleanUserId || !cleanPassword) {
      setErrorMessage('Invalid User ID or password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginWithUserId(cleanUserId, cleanPassword);
      if (result.success && result.user) {
        setIsSuccess(true);
        setTimeout(() => {
          onLoginSuccess(result.user);
        }, 350);
      } else {
        setErrorMessage('Invalid User ID or password.');
      }
    } catch {
      setErrorMessage('Invalid User ID or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen min-h-screen bg-[#F2F3F4] text-[#171717] flex flex-col lg:flex-row font-sans overflow-hidden select-none">
      {/* LEFT BRANDING PANEL (~35% width, Solid Dark Charcoal #171717) */}
      <div className="w-full lg:w-[36%] xl:w-[34%] bg-[#171717] text-white p-8 sm:p-10 lg:p-12 flex flex-col justify-between shrink-0 border-r border-[#262626] relative overflow-hidden">
        {/* Top Branding Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1769FF] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-sm shrink-0">
              IG
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
                IdentityGuard
              </h1>
              <span className="text-[10px] font-bold text-[#888888] tracking-widest uppercase block mt-0.5">
                IDENTITY & DOCUMENT VERIFICATION
              </span>
            </div>
          </div>
        </div>

        {/* Center Visual Content: Abstract Identity Document Schematic */}
        <div className="my-auto py-8 space-y-4">
          <div className="bg-[#202020] border border-[#2e2e2e] rounded-xl p-5 space-y-4 max-w-xs shadow-inner">
            <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-2 text-[10px] font-mono text-[#888888] uppercase tracking-wider">
              <span>IDENTITY DOCUMENT</span>
              <span className="w-2 h-2 rounded-full bg-[#1769FF]" />
            </div>

            <div className="flex gap-3">
              <div className="w-16 h-20 rounded-md bg-[#2a2a2a] border border-[#383838] flex flex-col items-center justify-center shrink-0">
                <div className="w-6 h-6 rounded-full bg-[#383838] mb-1" />
                <div className="w-8 h-2 rounded bg-[#383838]" />
              </div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-2.5 w-3/4 rounded bg-[#383838]" />
                <div className="h-2 w-1/2 rounded bg-[#2a2a2a]" />
                <div className="h-2 w-2/3 rounded bg-[#2a2a2a]" />
                <div className="h-2 w-1/3 rounded bg-[#2a2a2a]" />
              </div>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-[#2e2e2e]">
              <div className="h-1.5 w-full bg-[#2a2a2a] rounded-xs" />
              <div className="h-1.5 w-5/6 bg-[#2a2a2a] rounded-xs" />
            </div>
          </div>

          {/* Technical UI Labels */}
          <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono text-[#888888]">
            <span className="px-2.5 py-1 rounded bg-[#202020] border border-[#2e2e2e]">DOCUMENT</span>
            <span className="px-2.5 py-1 rounded bg-[#202020] border border-[#2e2e2e]">OCR</span>
            <span className="px-2.5 py-1 rounded bg-[#202020] border border-[#2e2e2e]">MRZ</span>
            <span className="px-2.5 py-1 rounded bg-[#202020] border border-[#2e2e2e]">IDENTITY</span>
          </div>
        </div>

        {/* Left Bottom Label */}
        <div className="pt-4 border-t border-[#262626] space-y-0.5">
          <span className="text-xs font-bold tracking-wider text-white uppercase block">
            SECURE VERIFICATION TERMINAL
          </span>
          <span className="text-xs text-[#888888] font-normal block">
            Authorized officer access
          </span>
        </div>
      </div>

      {/* RIGHT LOGIN AREA (Light Gray #F2F3F4 Canvas + White Dashboard Card) */}
      <div className="flex-1 bg-[#F2F3F4] text-[#171717] flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative h-full overflow-y-auto">
        {/* Top System Status */}
        <div className="flex items-center justify-end gap-2 text-xs font-mono text-[#777777] font-medium tracking-wide">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>SYSTEM ONLINE</span>
          <span className="text-[#cccccc]">|</span>
          <span>TERMINAL 01</span>
        </div>

        {/* Center White Login Card */}
        <div className="w-full max-w-[440px] mx-auto my-auto py-4">
          <div className="bg-white border border-[#E3E5E8] rounded-2xl p-8 sm:p-10 shadow-xs space-y-6">
            {/* Header */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#777777] uppercase tracking-wider block">
                OFFICER ACCESS
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#171717] tracking-tight">
                Welcome back
              </h2>
              <p className="text-xs text-[#777777] font-normal leading-relaxed mt-1">
                Sign in to continue to the IdentityGuard verification terminal.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Officer ID Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="input-officer-id"
                  className="block text-xs font-semibold text-[#171717] uppercase tracking-wider"
                >
                  OFFICER ID
                </label>
                <input
                  id="input-officer-id"
                  type="text"
                  required
                  autoComplete="username"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter Officer ID"
                  className="w-full h-12 bg-white border border-[#E3E5E8] rounded-xl text-xs text-[#171717] placeholder:text-[#999999] focus:outline-none focus:border-[#1769FF] focus:ring-2 focus:ring-[#1769FF]/20 px-4 transition-all font-mono"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="input-password"
                  className="block text-xs font-semibold text-[#171717] uppercase tracking-wider"
                >
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    id="input-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full h-12 pl-4 pr-11 bg-white border border-[#E3E5E8] rounded-xl text-xs text-[#171717] placeholder:text-[#999999] focus:outline-none focus:border-[#1769FF] focus:ring-2 focus:ring-[#1769FF]/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#999999] hover:text-[#171717] transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-login-submit"
                  disabled={isLoading || isSuccess}
                  className="w-full h-12 bg-[#1769FF] hover:bg-[#1255d4] active:bg-[#0e43a8] text-white text-xs font-semibold tracking-wide rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>AUTHENTICATED</span>
                    </>
                  ) : isLoading ? (
                    <span>SIGNING IN...</span>
                  ) : (
                    <>
                      <span>SIGN IN</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Small Terminal Information Notice */}
            <div className="pt-2 border-t border-[#F0F1F2] flex items-center justify-between text-[11px] text-[#777777] font-mono">
              <span>Secure Verification Terminal</span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                System Online
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Right Footer */}
        <div className="text-right text-[11px] text-[#777777] font-mono tracking-wide">
          IdentityGuard • Secure Verification Terminal v2.4
        </div>
      </div>
    </div>
  );
};
