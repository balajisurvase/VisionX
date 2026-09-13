import React, { useState } from 'react';
import {
  ShieldAlert,
  Eye,
  EyeOff,
  AlertCircle,
  Lock,
  User,
  ShieldCheck,
  Camera,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { loginWithUserId } from '../services/authService';
import { OfficerUser } from '../types/auth';

interface LoginProps {
  onLoginSuccess: (user: OfficerUser) => void;
  onViewLanding?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onViewLanding }) => {
  const [userId, setUserId] = useState<string>('A001');
  const [password, setPassword] = useState<string>('admin123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await loginWithUserId(userId, password);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || "Invalid officer credentials. Please try again.");
      }
    } catch {
      setErrorMessage("Unable to connect to authentication gateway.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await loginWithUserId('A001', 'admin123');
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        // Fallback demo user
        onLoginSuccess({
          id: 1,
          user_id: 'A001',
          username: 'A001',
          full_name: 'Demo Officer (SIH Evaluator)',
          role: 'Officer',
          terminal: 'ICP Raxaul (Indo-Nepal)',
          department: 'Border Screening Division',
          designation: 'Screening Officer',
        });
      }
    } catch {
      onLoginSuccess({
        id: 1,
        user_id: 'A001',
        username: 'A001',
        full_name: 'Demo Officer (SIH Evaluator)',
        role: 'Officer',
        terminal: 'ICP Raxaul (Indo-Nepal)',
        department: 'Border Screening Division',
        designation: 'Screening Officer',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-slate-900 flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Left Column: Navy Security Brand Panel */}
      <div className="w-full md:w-5/12 lg:w-4/12 bg-[#0B1220] p-8 lg:p-12 text-white flex flex-col justify-between relative overflow-hidden shrink-0 border-r border-slate-800">
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white leading-none">
                  IdentityGuard AI
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  SIH 2026
                </span>
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                AI-Powered Identity & Document Screening
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h2 className="text-base font-bold text-slate-200 leading-snug">
              Smart India Hackathon • Problem Statement 26188
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated screening system designed for border checkpoint officers to inspect passports, national IDs, and travel documents against synthetic alterations, photo splicing, and checksum anomalies.
            </p>
          </div>
        </div>

        {/* Security Highlights */}
        <div className="relative z-10 my-6 space-y-2.5">
          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>8-Stage Computer Vision & Forensic Pipeline</span>
          </div>
          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ICAO 9303 Modulo-10 Checksum Engine</span>
          </div>
          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>PostgreSQL / Supabase Audit Schema</span>
          </div>
        </div>

        {/* Terminal Info & Architecture Link */}
        <div className="relative z-10 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Terminal: ICP Raxaul</span>
          {onViewLanding && (
            <button
              onClick={onViewLanding}
              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
            >
              <span>View Landing & Specs</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Right Column: High-Contrast Login Interface */}
      <div className="flex-1 bg-white flex flex-col justify-center px-8 sm:px-14 lg:px-20 py-8 overflow-y-auto">
        <div className="w-full max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100">
              <Sparkles className="w-3 h-3" />
              <span>Authorized Officer Access</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Identity Screening Login
            </h2>
            <p className="text-xs text-slate-500">
              Sign in with your service credentials or use <strong>Demo Login</strong> for immediate evaluation.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User ID Field */}
            <div className="space-y-1">
              <label
                htmlFor="input-userid"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                User ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="input-userid"
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. A001"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label
                htmlFor="input-password"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action Buttons: Login + Demo Login */}
            <div className="space-y-2.5 pt-2">
              <button
                type="submit"
                id="btn-login-submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <span>{isLoading ? 'Authenticating...' : 'Login'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                id="btn-demo-login"
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Demo Login (Instant Evaluator Access)</span>
              </button>
            </div>
          </form>

          {/* Prototype Notice */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Demo credentials: A001 / admin123</span>
            <span className="text-emerald-600 font-semibold">Ready for SIH</span>
          </div>
        </div>
      </div>
    </div>
  );
};
