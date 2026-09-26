import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Shield, Lock, UserCheck, Building2 } from 'lucide-react';
import { authenticateUser } from '../services/societyService';
import { AuthSessionUser } from '../types/society';

interface LoginProps {
  onLoginSuccess: (user: AuthSessionUser) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [userId, setUserId] = useState<string>('admin@visi0nx.gov.in');
  const [password, setPassword] = useState<string>('password123');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUserId = userId.trim();
    const cleanPassword = password.trim();

    if (!cleanUserId || !cleanPassword) {
      setErrorMessage('Please enter your User ID / Email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authenticateUser(cleanUserId, cleanPassword);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Invalid credentials. Please verify your User ID and password.');
      }
    } catch {
      setErrorMessage('Authentication service temporarily unavailable. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (role: 'ADMIN' | 'RESIDENT' | 'SECURITY') => {
    if (role === 'ADMIN') {
      setUserId('admin@visi0nx.gov.in');
      setPassword('password123');
    } else if (role === 'RESIDENT') {
      setUserId('RES-A101');
      setPassword('password123');
    } else {
      setUserId('SEC-GATE-01');
      setPassword('password123');
    }
  };

  return (
    <div
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className="w-full h-screen h-[100vh] bg-[#FAF8FC] text-[#212121] flex flex-col justify-between overflow-hidden select-none"
    >
      {/* 1. HEADER */}
      <header className="bg-white border-b border-[#E1BEE7] shrink-0 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between">
          {/* Left: Visi0nx Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[4px] bg-[#4A148C] text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[22px] font-bold text-[#4A148C] leading-none tracking-tight">
                Visi0nx
              </div>
              <div className="text-[12px] text-[#616161] font-normal mt-0.5">
                AI-Powered Identity & Document Verification
              </div>
            </div>
          </div>

          {/* Right: भारत सरकार / Government of India */}
          <div className="text-right">
            <div className="text-[16px] font-bold text-[#310C61] leading-tight">
              भारत सरकार
            </div>
            <div className="text-[13px] font-bold text-[#616161] leading-tight">
              Government of India
            </div>
          </div>
        </div>

        {/* Thin Purple Navigation / Header Strip */}
        <div className="h-[3px] w-full bg-[#4A148C]" />
      </header>

      {/* 2. LOGIN AREA (Centered Vertically and Horizontally) */}
      <main className="flex-1 flex items-center justify-center px-4 py-2 overflow-hidden">
        <div className="w-full max-w-md bg-white border border-[#CE93D8] rounded-[6px] shadow-md p-6 sm:p-7 space-y-4">
          {/* Card Heading & Subtitle */}
          <div className="text-center space-y-1">
            <h1 className="text-[26px] font-bold text-[#4A148C] uppercase tracking-tight">
              Officer Login
            </h1>
            <p className="text-[14px] text-[#616161] leading-snug">
              Sign in to access the Visi0nx Identity Verification Portal
            </p>
          </div>

          {/* Quick Prototype Role Switcher */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleQuickFill('ADMIN')}
              className="px-2.5 py-1 bg-[#F3E5F5] hover:bg-[#E1BEE7] text-[#4A148C] text-[11px] font-bold rounded-[3px] border border-[#CE93D8] cursor-pointer"
            >
              Admin (admin)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('RESIDENT')}
              className="px-2.5 py-1 bg-[#FAF8FC] hover:bg-[#F3E5F5] text-[#310C61] text-[11px] font-bold rounded-[3px] border border-[#CE93D8] cursor-pointer"
            >
              Resident (resident)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('SECURITY')}
              className="px-2.5 py-1 bg-[#FAF8FC] hover:bg-[#F3E5F5] text-[#310C61] text-[11px] font-bold rounded-[3px] border border-[#CE93D8] cursor-pointer"
            >
              Security (security)
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-2.5 bg-[#FFEBEE] border border-[#EF9A9A] text-[#C62828] text-[13px] rounded-[4px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#C62828]" />
              <span className="font-normal">{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Field 1: User ID */}
            <div className="space-y-1">
              <label
                htmlFor="input-user-id"
                className="block text-[14px] font-bold text-[#212121]"
              >
                User ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6A1B9A]">
                  <UserCheck className="w-4 h-4" />
                </div>
                <input
                  id="input-user-id"
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter your User ID"
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF8FC] border border-[#CE93D8] focus:border-[#4A148C] focus:bg-white rounded-[4px] text-[15px] text-[#212121] placeholder-[#9E9E9E] outline-none shadow-2xs transition-colors"
                />
              </div>
            </div>

            {/* Field 2: Password */}
            <div className="space-y-1">
              <label
                htmlFor="input-password"
                className="block text-[14px] font-bold text-[#212121]"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6A1B9A]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-10 py-2 bg-[#FAF8FC] border border-[#CE93D8] focus:border-[#4A148C] focus:bg-white rounded-[4px] text-[15px] text-[#212121] placeholder-[#9E9E9E] outline-none shadow-2xs transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#757575] hover:text-[#4A148C] cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-[13px] pt-0.5">
              <label className="flex items-center gap-2 text-[#424242] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-[2px] text-[#4A148C] focus:ring-[#4A148C] border-[#CE93D8] accent-[#4A148C] cursor-pointer"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() =>
                  alert(
                    'For password recovery, please contact your Divisional Security Administrator.'
                  )
                }
                className="text-[#6A1B9A] hover:text-[#310C61] hover:underline font-bold cursor-pointer transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {/* Primary Purple Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#4A148C] hover:bg-[#310C61] active:bg-[#1A0033] text-white font-bold text-[16px] uppercase tracking-wider rounded-[4px] shadow-xs cursor-pointer disabled:opacity-70 transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <span>LOGIN</span>
              )}
            </button>

            {/* Authorized personnel only */}
            <div className="text-center text-[12px] font-bold text-[#757575] uppercase tracking-wider pt-0.5">
              Authorized personnel only
            </div>
          </form>

          {/* 3. SECURITY NOTICE */}
          <div className="pt-3 border-t border-[#E1BEE7] text-center space-y-0.5">
            <div className="text-[13px] font-bold text-[#310C61] flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#6A1B9A]" />
              <span>Secure Government Identity Verification Portal</span>
            </div>
            <p className="text-[12px] text-[#757575]">
              Access is restricted to authorized officers.
            </p>
          </div>
        </div>
      </main>

      {/* 4. FOOTER */}
      <footer className="bg-white border-t border-[#E1BEE7] py-2 shrink-0 text-center text-[12px] text-[#616161]">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span>© 2026 Visi0nx</span>
          <span>|</span>
          <button
            onClick={() => alert('Visi0nx National Security Privacy Policy')}
            className="hover:text-[#4A148C] hover:underline cursor-pointer"
          >
            Privacy Policy
          </button>
          <span>|</span>
          <button
            onClick={() => alert('Visi0nx Portal Terms of Use')}
            className="hover:text-[#4A148C] hover:underline cursor-pointer"
          >
            Terms of Use
          </button>
          <span>|</span>
          <button
            onClick={() => alert('Visi0nx Officer Support Helpline: 1800-VISI0NX')}
            className="hover:text-[#4A148C] hover:underline cursor-pointer"
          >
            Help
          </button>
        </div>
      </footer>
    </div>
  );
};
