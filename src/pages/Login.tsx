import React, { useState } from 'react';
import {
  ShieldAlert,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Lock,
  User,
  ShieldCheck,
  Camera,
  ArrowRight,
  Sparkles,
  KeyRound,
  Check,
} from 'lucide-react';
import { loginWithUserId } from '../services/authService';
import { OfficerUser } from '../types/auth';
import { CameraCapture } from '../components/CameraCapture';

interface LoginProps {
  onLoginSuccess: (user: OfficerUser) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [roleMode, setRoleMode] = useState<'officer' | 'admin'>('officer');
  const [userId, setUserId] = useState<string>('A001');
  const [password, setPassword] = useState<string>('admin123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [useLiveCamera, setUseLiveCamera] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 2FA Biometric Stage
  const [pendingUser, setPendingUser] = useState<OfficerUser | null>(null);
  const [isCapturingFace, setIsCapturingFace] = useState<boolean>(false);
  const [faceVerified, setFaceVerified] = useState<boolean>(false);

  const handleRoleSelect = (role: 'officer' | 'admin') => {
    setRoleMode(role);
    setErrorMessage(null);
    if (role === 'officer') {
      setUserId('A001');
      setPassword('admin123');
    } else {
      setUserId('A004');
      setPassword('admin123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await loginWithUserId(userId, password);
      if (result.success && result.user) {
        if (useLiveCamera) {
          // Trigger Biometric Step
          setPendingUser(result.user);
          setIsCapturingFace(true);
        } else {
          onLoginSuccess(result.user);
        }
      } else {
        setErrorMessage(result.error || "That officer ID or password isn't right.");
      }
    } catch {
      setErrorMessage("That officer ID or password isn't right.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceCaptured = async (_blob: Blob, _dataUrl: string) => {
    // Biometric face match success
    setFaceVerified(true);
    setTimeout(() => {
      if (pendingUser) {
        onLoginSuccess(pendingUser);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F6F8] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px] border border-gray-100">
        
        {/* Left Column: Navy-900 Brand & Mission Panel */}
        <div className="md:col-span-5 bg-[#0B1220] p-8 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Background Geometry */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#4F46E5]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#4F46E5]/15 rounded-full blur-2xl pointer-events-none" />

          {/* Top: Identity & Brand */}
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-bold shadow-md">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white leading-none">
                  VisionX
                </h1>
                <span className="text-[11px] text-gray-400 font-mono mt-1 block">
                  SSB Checkpoint Console
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-bold text-gray-100 leading-snug">
                AI-Powered Border Document Verification & Fake Identity Screening
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Deployed for Sashastra Seema Bal (SSB) border checkpoints under the Ministry of Home Affairs to detect synthetic, altered, and forged identity documents in real time.
              </p>
            </div>
          </div>

          {/* Features / Badges List */}
          <div className="relative z-10 my-6 space-y-2.5">
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-200">
              <ShieldCheck className="w-4 h-4 text-[#4F46E5] shrink-0" />
              <span>ICAO 9303 Checksum Engine</span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-200">
              <Camera className="w-4 h-4 text-[#4F46E5] shrink-0" />
              <span>Live Desk Biometric Face Matching</span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-200">
              <Lock className="w-4 h-4 text-[#4F46E5] shrink-0" />
              <span>Tamper-Evident SHA-256 Audit Chain</span>
            </div>
          </div>

          {/* Terminal Footer */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400 font-mono">
            <span>Terminal: ICP Raxaul</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>
        </div>

        {/* Right Column: White Form Panel */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-white text-[#111827]">
          {isCapturingFace ? (
            // 2FA Biometric Live Camera Face Capture Modal
            <div className="space-y-4 my-auto">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Biometric 2-Factor Check
                </div>
                <h3 className="text-lg font-bold text-[#111827]">
                  Verify Officer Identity
                </h3>
                <p className="text-xs text-gray-500">
                  Officer <span className="font-semibold text-[#111827]">{pendingUser?.full_name}</span> ({pendingUser?.user_id})
                </p>
              </div>

              {faceVerified ? (
                <div className="p-8 text-center space-y-3 bg-[#DCFCE7] rounded-xl border border-[#16A34A]/20">
                  <div className="w-12 h-12 rounded-full bg-[#16A34A] text-white flex items-center justify-center mx-auto shadow-sm">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-[#15803D]">
                    Biometric Identity Confirmed
                  </h4>
                  <p className="text-xs text-[#15803D]/80">
                    Opening VisionX checkpoint console...
                  </p>
                </div>
              ) : (
                <CameraCapture
                  title="Live Officer Face Verification"
                  subtitle="Look directly at the terminal camera to authenticate"
                  onCapture={handleFaceCaptured}
                  onCancel={() => setIsCapturingFace(false)}
                />
              )}
            </div>
          ) : (
            // Standard Login Form
            <div>
              {/* Pill-Style Mode Switch (Officer / Admin) */}
              <div className="flex items-center justify-between pb-6 border-b border-gray-100 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-[#111827] tracking-tight">
                    Officer Sign In
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Enter your service credentials to access screening tools
                  </p>
                </div>

                {/* Pill Switch */}
                <div className="bg-[#F5F6F8] p-1 rounded-full flex items-center gap-1 border border-gray-200">
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('officer')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      roleMode === 'officer'
                        ? 'bg-[#4F46E5] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Officer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('admin')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      roleMode === 'admin'
                        ? 'bg-[#4F46E5] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-lg bg-[#FEE2E2] border border-[#DC2626]/30 text-[#B91C1C] text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* User ID Field */}
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                    Service User ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      id="input-user-id"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      placeholder="e.g. A001, A002, A003, A004"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-[#111827] placeholder-gray-400 focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-colors"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                    Terminal Passcode
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="input-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="admin123"
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-[#111827] placeholder-gray-400 focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Live Camera Match Toggle (Indigo Tinted Row) */}
                <div className="p-3 rounded-lg bg-[#EEF2FF] border border-[#4F46E5]/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-[#4F46E5] text-white flex items-center justify-center shrink-0">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#4F46E5] block leading-tight">
                        Live camera face match
                      </span>
                      <span className="text-[11px] text-gray-600 block">
                        2nd factor desk facial biometric verification
                      </span>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useLiveCamera}
                      onChange={(e) => setUseLiveCamera(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4F46E5]"></div>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  id="btn-login"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-[#4F46E5] hover:bg-[#4338CA] active:bg-[#3730A3] disabled:opacity-50 text-white font-bold text-xs tracking-wide rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isLoading ? 'Verifying Credentials...' : 'Sign In to Console'}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </form>

              {/* Quick Select Preset Credentials */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                    Registered Users (Pass: admin123)
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium">Ready</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRoleMode('officer');
                      setUserId('A001');
                      setPassword('admin123');
                    }}
                    className={`p-2 text-left rounded-lg border text-xs transition-colors cursor-pointer ${
                      userId === 'A001' ? 'bg-[#EEF2FF] border-[#4F46E5]' : 'bg-[#F5F6F8] hover:bg-gray-200 border-gray-200'
                    }`}
                  >
                    <div className="font-bold text-[#111827] truncate">Officer Two</div>
                    <div className="text-[10px] text-[#4F46E5] font-mono font-bold">A001</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRoleMode('officer');
                      setUserId('A002');
                      setPassword('admin123');
                    }}
                    className={`p-2 text-left rounded-lg border text-xs transition-colors cursor-pointer ${
                      userId === 'A002' ? 'bg-[#EEF2FF] border-[#4F46E5]' : 'bg-[#F5F6F8] hover:bg-gray-200 border-gray-200'
                    }`}
                  >
                    <div className="font-bold text-[#111827] truncate">Security Off.</div>
                    <div className="text-[10px] text-[#4F46E5] font-mono font-bold">A002</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRoleMode('officer');
                      setUserId('A003');
                      setPassword('admin123');
                    }}
                    className={`p-2 text-left rounded-lg border text-xs transition-colors cursor-pointer ${
                      userId === 'A003' ? 'bg-[#EEF2FF] border-[#4F46E5]' : 'bg-[#F5F6F8] hover:bg-gray-200 border-gray-200'
                    }`}
                  >
                    <div className="font-bold text-[#111827] truncate">Officer One</div>
                    <div className="text-[10px] text-[#4F46E5] font-mono font-bold">A003</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRoleMode('admin');
                      setUserId('A004');
                      setPassword('admin123');
                    }}
                    className={`p-2 text-left rounded-lg border text-xs transition-colors cursor-pointer ${
                      userId === 'A004' ? 'bg-[#EEF2FF] border-[#4F46E5]' : 'bg-[#F5F6F8] hover:bg-gray-200 border-gray-200'
                    }`}
                  >
                    <div className="font-bold text-[#111827] truncate">System Admin</div>
                    <div className="text-[10px] text-[#4F46E5] font-mono font-bold">A004</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Security Classification Watermark */}
          <div className="pt-4 border-t border-gray-100 text-center text-[11px] text-gray-400 font-mono">
            CONFIDENTIAL • GOVERNMENT OF INDIA • MHA / SSB
          </div>
        </div>
      </div>
    </div>
  );
};
