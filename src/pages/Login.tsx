import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUserId = userId.trim();
    const cleanPassword = password.trim();

    if (!cleanUserId || !cleanPassword) {
      setErrorMessage('Invalid Officer ID or password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginWithUserId(cleanUserId, cleanPassword);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage('Invalid Officer ID or password.');
      }
    } catch {
      setErrorMessage('Invalid Officer ID or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setUserId('A001');
    setPassword('admin123');

    try {
      const result = await loginWithUserId('A001', 'admin123');
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage('Demo login failed.');
      }
    } catch {
      setErrorMessage('Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className="w-screen h-screen min-h-screen bg-[#EAF2FF] text-[#10233F] flex flex-col md:flex-row overflow-x-hidden overflow-y-auto md:overflow-hidden select-none"
    >
      {/* LEFT SECTION (~45% width on desktop) */}
      <div className="w-full md:w-[45%] bg-[#102A56] text-white p-8 md:p-12 lg:p-16 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#C9DCF8]">
        {/* Brand Header */}
        <div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-[#2563EB] inline-block" />
            <h1 className="text-[44px] lg:text-[52px] font-bold text-white uppercase tracking-tight leading-none">
              VISIONX
            </h1>
          </div>
          <h2 className="text-[20px] lg:text-[24px] font-bold text-[#DCEBFF] leading-snug mt-4 uppercase">
            IDENTITY & DOCUMENT VERIFICATION
          </h2>
          <p className="text-[16px] text-[#93C5FD] mt-3 font-normal max-w-md leading-relaxed">
            Secure document screening and identity verification for authorized officers.
          </p>
        </div>

        {/* Abstract Geometric CSS Composition (No images/photos/illustrations) */}
        <div className="my-10 my-auto py-6">
          <div className="w-full max-w-sm border border-[#2563EB]/40 bg-[#102A56]/60 p-6 rounded-[8px] space-y-4 relative">
            <div className="flex items-center justify-between border-b border-[#2563EB]/30 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#2563EB]" />
                <div className="w-12 h-2 bg-[#DCEBFF]/30" />
              </div>
              <div className="w-16 h-2 bg-[#DCEBFF]/20" />
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="col-span-1 h-20 border border-[#2563EB]/40 rounded-[4px] bg-[#2563EB]/10 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border border-[#DCEBFF]/40" />
              </div>
              <div className="col-span-2 space-y-2 py-1">
                <div className="h-2.5 w-full bg-[#DCEBFF]/40 rounded-xs" />
                <div className="h-2.5 w-3/4 bg-[#DCEBFF]/20 rounded-xs" />
                <div className="h-2.5 w-1/2 bg-[#DCEBFF]/20 rounded-xs" />
              </div>
            </div>
            <div className="border-t border-[#2563EB]/30 pt-3 space-y-1">
              <div className="h-2 w-full bg-[#DCEBFF]/20" />
              <div className="h-2 w-5/6 bg-[#DCEBFF]/20" />
            </div>
          </div>
        </div>

        {/* Bottom Left System Reference */}
        <div className="text-[13px] text-[#93C5FD] uppercase tracking-wide">
          VISIONX VERIFICATION TERMINAL &nbsp;•&nbsp; SYSTEM ONLINE
        </div>
      </div>

      {/* RIGHT SECTION (~55% width on desktop) */}
      <div className="w-full md:w-[55%] bg-[#EAF2FF] p-8 md:p-12 lg:p-16 flex flex-col justify-between items-center">
        <div className="w-full text-right text-[13px] text-[#64748B] uppercase font-bold tracking-wide border-b border-[#C9DCF8] pb-4">
          AUTHORIZED OFFICER TERMINAL
        </div>

        {/* Centered Login Form Container */}
        <div className="max-w-[430px] w-full my-auto py-6">
          <div className="mb-6">
            <span className="text-[15px] font-bold text-[#2563EB] uppercase tracking-wider block mb-1">
              OFFICER ACCESS
            </span>
            <h2 className="text-[42px] font-bold text-[#10233F] leading-tight">
              Welcome Back
            </h2>
            <p className="text-[17px] text-[#64748B] font-normal mt-2 leading-normal">
              Sign in to access the VisionX verification system.
            </p>
          </div>

          {/* Quick Demo Login Box */}
          <div className="mb-6 p-4 bg-white border border-[#C9DCF8] rounded-[8px] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
                <span className="text-[15px] font-bold text-[#10233F] uppercase">Demo Account</span>
              </div>
              <span className="text-[12px] font-bold text-[#2563EB] bg-[#EAF2FF] px-2 py-0.5 rounded-[4px] uppercase border border-[#C9DCF8]">
                Instant Access
              </span>
            </div>
            <p className="text-[14px] text-[#64748B]">
              Officer ID: <strong className="text-[#10233F]">A001</strong> &nbsp;|&nbsp; Password: <strong className="text-[#10233F]">admin123</strong>
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="w-full py-2.5 bg-[#102A56] hover:bg-[#0d2247] text-white text-[15px] font-bold uppercase rounded-[6px] cursor-pointer transition-none flex items-center justify-center gap-2"
            >
              <span>Quick Demo Login</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-[#B91C1C] text-[15px] rounded-[8px] font-normal flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#B91C1C]" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* FIELD 1: OFFICER ID */}
            <div>
              <label
                htmlFor="input-officer-id"
                className="block text-[15px] font-bold text-[#10233F] uppercase mb-2"
              >
                OFFICER ID
              </label>
              <input
                id="input-officer-id"
                type="text"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter Officer ID"
                className="w-full h-[52px] bg-[#FFFFFF] border border-[#C9DCF8] focus:border-[#2563EB] rounded-[8px] px-4 text-[17px] text-[#10233F] placeholder:text-[#64748B] outline-none font-normal"
              />
            </div>

            {/* FIELD 2: PASSWORD */}
            <div>
              <label
                htmlFor="input-password"
                className="block text-[15px] font-bold text-[#10233F] uppercase mb-2"
              >
                PASSWORD
              </label>
              <div className="relative">
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full h-[52px] pl-4 pr-12 bg-[#FFFFFF] border border-[#C9DCF8] focus:border-[#2563EB] rounded-[8px] text-[17px] text-[#10233F] placeholder:text-[#64748B] outline-none font-normal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#64748B] hover:text-[#10233F] cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* SIGN IN BUTTON */}
            <button
              type="submit"
              id="btn-login-submit"
              disabled={isLoading}
              className="w-full h-[52px] bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white text-[18px] font-bold uppercase rounded-[8px] cursor-pointer flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="w-full text-center text-[13px] text-[#64748B] uppercase pt-4 border-t border-[#C9DCF8]">
          VISIONX VERIFICATION TERMINAL &nbsp;•&nbsp; AUTHORIZED ACCESS ONLY
        </div>
      </div>
    </div>
  );
};
