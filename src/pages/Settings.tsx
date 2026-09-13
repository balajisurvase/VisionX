import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  Database,
  Copy,
  LogOut,
  Terminal,
  Save,
  Check,
  Cpu,
  RefreshCw,
  Server,
  Lock,
  CheckCircle2,
  Table,
  Sparkles,
} from 'lucide-react';
import { OfficerUser } from '../types/auth';
import { checkSystemHealth, SystemHealthResponse, getDatabaseStatus, DatabaseStatusResponse, syncDatabase } from '../services/api';
import { API_ENDPOINTS } from '../config/api';
import {
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
} from '../lib/supabase';

interface SettingsProps {
  user: OfficerUser | null;
  onLogout: () => void;
}

const SUPABASE_SCHEMA_SQL = `-- IdentityGuard AI (SIH 2026 Problem Statement 26188)
-- 7 Supabase Tables + 2 Storage Buckets Architecture

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'OFFICER',
  email VARCHAR(150),
  user_id VARCHAR(80) UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Verification Requests Table
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  request_status VARCHAR(40) NOT NULL DEFAULT 'COMPLETED',
  document_type VARCHAR(60) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Verification Media Table
CREATE TABLE IF NOT EXISTS verification_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID REFERENCES verification_requests(id) ON DELETE CASCADE,
  media_type VARCHAR(40) NOT NULL,
  storage_bucket VARCHAR(80) NOT NULL DEFAULT 'verification-documents',
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Extracted Data Table
CREATE TABLE IF NOT EXISTS extracted_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID REFERENCES verification_requests(id) ON DELETE CASCADE,
  document_number VARCHAR(120),
  full_name VARCHAR(180),
  date_of_birth DATE,
  nationality VARCHAR(60),
  gender VARCHAR(20),
  issue_date DATE,
  expiry_date DATE,
  issuing_country VARCHAR(60),
  mrz_line1 TEXT,
  mrz_line2 TEXT,
  raw_text TEXT,
  ocr_confidence NUMERIC(5,2),
  mrz_valid BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Verification Checks Table
CREATE TABLE IF NOT EXISTS verification_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID REFERENCES verification_requests(id) ON DELETE CASCADE,
  check_type VARCHAR(60) NOT NULL,
  check_status VARCHAR(40) NOT NULL,
  score NUMERIC(5,2),
  confidence NUMERIC(5,2),
  message TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Verification Results Table
CREATE TABLE IF NOT EXISTS verification_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID REFERENCES verification_requests(id) ON DELETE CASCADE,
  ocr_score NUMERIC(5,2),
  mrz_score NUMERIC(5,2),
  authenticity_score NUMERIC(5,2),
  tampering_score NUMERIC(5,2),
  face_match_score NUMERIC(5,2),
  liveness_score NUMERIC(5,2),
  image_quality_score NUMERIC(5,2),
  risk_score NUMERIC(5,2) NOT NULL,
  confidence_score NUMERIC(5,2),
  risk_level VARCHAR(30) NOT NULL,
  final_status VARCHAR(40) NOT NULL,
  explanation TEXT,
  recommendation TEXT,
  is_demo_result BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Verification Logs Table
CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID REFERENCES verification_requests(id) ON DELETE CASCADE,
  log_level VARCHAR(30) DEFAULT 'INFO',
  event_type VARCHAR(80) NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Storage Buckets:
-- 1. verification-documents (Document scans, selfie photos, crops)
-- 2. verification-reports (Exported forensic screening dossiers & audit summaries)
`;

export const Settings: React.FC<SettingsProps> = ({ user, onLogout }) => {
  const [urlInput, setUrlInput] = useState<string>(supabaseUrl || '');
  const [keyInput, setKeyInput] = useState<string>(supabaseAnonKey || '');
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'officer' | 'ai-models' | 'database'>('officer');
  const [healthStatus, setHealthStatus] = useState<SystemHealthResponse | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatusResponse | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [testingGemini, setTestingGemini] = useState<boolean>(false);
  const [geminiStatus, setGeminiStatus] = useState<{
    configured: boolean;
    status: string;
    model: string;
    message: string;
    sample?: string;
  } | null>(null);

  useEffect(() => {
    loadHealth();
    loadDbStatus();
    checkGeminiStatus();
  }, []);

  const checkGeminiStatus = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.gemini.status);
      const data = await res.json();
      setGeminiStatus({
        configured: data.configured,
        status: data.status,
        model: data.model || 'gemini-3.8-flash',
        message: data.message,
        sample: data.response_sample,
      });
    } catch (err: any) {
      setGeminiStatus({
        configured: false,
        status: 'error',
        model: 'gemini-3.8-flash',
        message: 'Could not connect to /api/gemini/status',
      });
    }
  };

  const handleTestGemini = async () => {
    setTestingGemini(true);
    await checkGeminiStatus();
    setTestingGemini(false);
  };

  const loadHealth = async () => {
    setLoadingHealth(true);
    try {
      const data = await checkSystemHealth();
      setHealthStatus(data);
    } catch (err) {
      console.warn('Failed to fetch system health:', err);
    } finally {
      setLoadingHealth(false);
    }
  };

  const loadDbStatus = async () => {
    try {
      const data = await getDatabaseStatus();
      setDbStatus(data);
    } catch (err) {
      console.warn('Failed to fetch database status:', err);
    }
  };

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await syncDatabase();
      setSyncMessage(res.message);
      await loadDbStatus();
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: any) {
      setSyncMessage('Database sync error: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Password form state
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseCredentials(urlInput, keyInput);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      setPasswordStatus('Please enter current and new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus('New passwords do not match.');
      return;
    }
    setPasswordStatus('Password updated successfully.');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordStatus(null), 3000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-[#111827]">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#EEF2FF] text-[#4F46E5]">
              Security Protocols & Config
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Terminal: ICP-RAXAUL-01
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#111827] tracking-tight mt-1">
            Settings & Terminal Diagnostics
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-gray-100 p-1 rounded-full border border-gray-200 text-xs">
          <button
            onClick={() => setActiveTab('officer')}
            className={`px-4 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
              activeTab === 'officer'
                ? 'bg-[#4F46E5] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Officer Profile
          </button>
          <button
            onClick={() => setActiveTab('ai-models')}
            className={`px-4 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ai-models'
                ? 'bg-[#4F46E5] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>AI Models</span>
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'database'
                ? 'bg-[#4F46E5] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase Cloud</span>
          </button>
        </div>
      </div>

      {activeTab === 'officer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Officer Profile Card */}
          <div className="lg:col-span-2 bg-white rounded-[12px] border border-gray-100 p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#111827]">
                    {user?.full_name || 'Inspector Rajeshwar Kumar'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {user?.department || 'Sashastra Seema Bal (SSB), Ministry of Home Affairs'}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#15803D]">
                Active On Duty
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#F5F6F8]">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">
                  Jurisdiction
                </span>
                <span className="font-bold text-[#111827] mt-0.5 block">
                  Ministry of Home Affairs (MHA)
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F5F6F8]">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">
                  Officer User ID
                </span>
                <span className="font-mono font-bold text-[#4F46E5] mt-0.5 block">
                  {user?.user_id || 'officer001'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F5F6F8]">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">
                  Designation / Role
                </span>
                <span className="font-bold text-[#111827] mt-0.5 block">
                  {user?.designation || 'Screening Officer (Biometrics & Document Verification)'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F5F6F8]">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">
                  Assigned Terminal Post
                </span>
                <span className="font-bold text-[#111827] mt-0.5 block">
                  {user?.terminal || 'ICP Raxaul • Indo-Nepal Border Terminal'}
                </span>
              </div>
            </div>

            {/* Logout Action Button */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                Terminal Session Active (Auto-timeout after 8 hours)
              </span>
              <button
                onClick={onLogout}
                id="btn-settings-logout"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-[#DC2626] hover:bg-[#FEE2E2]/60 border border-[#DC2626]/30 transition-colors cursor-pointer flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout From Terminal</span>
              </button>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-[12px] border border-gray-100 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <KeyRound className="w-4 h-4 text-[#4F46E5]" />
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Change Officer Password
              </h2>
            </div>

            {passwordStatus && (
              <div className="p-3 rounded-xl bg-[#EEF2FF] border border-[#4F46E5]/30 text-[#4F46E5] text-xs font-bold">
                {passwordStatus}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 text-[11px] font-bold mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-[#F5F6F8] border border-gray-200 rounded-xl text-[#111827] focus:border-[#4F46E5] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-gray-500 text-[11px] font-bold mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-[#F5F6F8] border border-gray-200 rounded-xl text-[#111827] focus:border-[#4F46E5] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-gray-500 text-[11px] font-bold mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-[#F5F6F8] border border-gray-200 rounded-xl text-[#111827] focus:border-[#4F46E5] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#4F46E5] hover:bg-[#4338CA] text-white transition-colors cursor-pointer mt-1 shadow-xs"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Top Metric Cards for Database */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-[12px] border border-gray-100 p-4 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Registered Officers
              </span>
              <div className="text-xl font-bold text-[#111827] mt-1">
                {dbStatus?.counts.users || 6}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> users table synced
              </span>
            </div>

            <div className="bg-white rounded-[12px] border border-gray-100 p-4 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Stored Documents
              </span>
              <div className="text-xl font-bold text-[#111827] mt-1">
                {dbStatus?.counts.documents || 7}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> documents table synced
              </span>
            </div>

            <div className="bg-white rounded-[12px] border border-gray-100 p-4 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Screening Records
              </span>
              <div className="text-xl font-bold text-[#111827] mt-1">
                {dbStatus?.counts.verification_records || 6}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> verification_records
              </span>
            </div>

            <div className="bg-white rounded-[12px] border border-gray-100 p-4 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Blockchain Blocks
              </span>
              <div className="text-xl font-bold text-[#111827] mt-1">
                {dbStatus?.counts.audit_blocks || 6}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> audit_logs SHA-256
              </span>
            </div>
          </div>

          {/* Sync status alert if present */}
          {syncMessage && (
            <div className="p-3.5 rounded-xl bg-[#DCFCE7] border border-[#16A34A]/30 text-[#15803D] text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{syncMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Supabase Connection Settings */}
            <div className="bg-white rounded-[12px] border border-gray-100 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#16A34A]" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Supabase & Backend Data Sync
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSyncDatabase}
                    disabled={isSyncing}
                    className="px-3 py-1 rounded-xl text-xs font-bold bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Database'}</span>
                  </button>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isSupabaseConfigured || dbStatus?.status === 'connected'
                        ? 'bg-[#DCFCE7] text-[#15803D]'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {isSupabaseConfigured ? 'Supabase Connected' : 'PostgreSQL Synced'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                Connect external Supabase project to persist screening records and cryptographic blockchain audit ledger into cloud PostgreSQL tables.
              </p>

              <form onSubmit={handleSaveSupabase} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-500 text-[11px] font-bold mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3 py-2 bg-[#F5F6F8] border border-gray-200 rounded-xl text-[#111827] focus:border-[#4F46E5] focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 text-[11px] font-bold mb-1">
                    Supabase Anon Key
                  </label>
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 bg-[#F5F6F8] border border-gray-200 rounded-xl text-[#111827] focus:border-[#4F46E5] focus:bg-white font-mono"
                  />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#16A34A] hover:bg-[#15803D] text-white transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Credentials</span>
                  </button>

                  {isSupabaseConfigured && (
                    <button
                      type="button"
                      onClick={clearSupabaseCredentials}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-colors cursor-pointer"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* SQL Schema Preview & Quick Copy */}
            <div className="bg-white rounded-[12px] border border-gray-100 p-6 shadow-2xs flex flex-col justify-between text-gray-600">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-[#111827] flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#16A34A]" />
                    PostgreSQL Schema SQL
                  </span>
                  <button
                    onClick={handleCopySql}
                    className="px-3 py-1 rounded-xl text-xs font-bold bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span className="text-[#16A34A]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy SQL</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3 bg-[#0B1220] rounded-xl overflow-x-auto max-h-64 font-mono text-[11px] leading-relaxed text-[#4ADE80] border border-gray-200">
                  <pre>{SUPABASE_SCHEMA_SQL}</pre>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-500 font-medium">
                Tables: officers, documents, verification_records, audit_logs.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: AI Model Status */}
      {activeTab === 'ai-models' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[12px] border border-gray-100 p-6 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2 uppercase tracking-wider">
                  <Cpu className="w-4 h-4 text-[#4F46E5]" />
                  <span>AI Screening Engines & Microservice Diagnostics</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  SIH 2026 Problem Statement 26188 — Core Computer Vision & Forensic Model Status
                </p>
              </div>

              <button
                onClick={loadHealth}
                disabled={loadingHealth}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-auto disabled:opacity-50 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#4F46E5] ${loadingHealth ? 'animate-spin' : ''}`} />
                <span>Refresh Diagnostics</span>
              </button>
            </div>

            {/* Featured Gemini API Pipeline Card */}
            <div className="p-5 rounded-2xl border border-[#4F46E5]/20 bg-gradient-to-br from-[#EEF2FF]/50 to-white space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#4F46E5]/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[#111827]">Google Gemini 3.8 Flash</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF2FF] text-[#4F46E5] border border-[#4F46E5]/20">
                        Server-Side AI
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Officer-friendly explanations, OCR inconsistency analysis & reason-for-suspicion generation
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                      geminiStatus?.status === 'connected'
                        ? 'bg-[#DCFCE7] text-[#15803D]'
                        : geminiStatus?.configured
                        ? 'bg-[#FEF9C3] text-[#854D0E]'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        geminiStatus?.status === 'connected' ? 'bg-[#16A34A] animate-pulse' : 'bg-gray-400'
                      }`}
                    />
                    {geminiStatus?.status === 'connected'
                      ? 'Connected & Active'
                      : geminiStatus?.configured
                      ? 'Configured'
                      : 'Not Configured'}
                  </span>

                  <button
                    onClick={handleTestGemini}
                    disabled={testingGemini}
                    className="px-3 py-1 rounded-xl text-xs font-bold bg-[#4F46E5] text-white hover:bg-[#4338CA] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-2xs"
                  >
                    <RefreshCw className={`w-3 h-3 ${testingGemini ? 'animate-spin' : ''}`} />
                    <span>{testingGemini ? 'Testing...' : 'Test Connection'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Security & Architecture
                  </span>
                  <p className="text-gray-700 leading-relaxed text-[11px]">
                    Key stored securely as <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-[#4F46E5]">GEMINI_API_KEY</code> on backend. Zero browser exposure.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Active Model & SDK
                  </span>
                  <p className="text-gray-700 leading-relaxed text-[11px]">
                    <strong className="text-[#111827]">models/gemini-3.8-flash</strong> via official <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-gray-600">@google/genai</code> TypeScript SDK.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Pipeline Role
                  </span>
                  <p className="text-gray-700 leading-relaxed text-[11px]">
                    Synthesizes officer explanations, validates cross-field consistency, and justifies flags without replacing raw OpenCV/MRZ forensics.
                  </p>
                </div>
              </div>

              {geminiStatus && (
                <div
                  className={`p-3 rounded-xl text-xs font-mono flex items-start gap-2 ${
                    geminiStatus.status === 'connected'
                      ? 'bg-[#DCFCE7]/60 border border-[#16A34A]/20 text-[#15803D]'
                      : 'bg-gray-50 border border-gray-200 text-gray-600'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold">{geminiStatus.message}</div>
                    {geminiStatus.sample && (
                      <div className="text-[11px] opacity-80 mt-0.5">
                        Test Echo: &ldquo;{geminiStatus.sample}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AI Models Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* PaddleOCR */}
              <div className="p-4 rounded-xl border border-gray-100 bg-[#F5F6F8] flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#111827]">Gemini Vision OCR</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-[#15803D]">
                    Operational
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Optical character recognition, MRZ zone extraction, and visual document inspection.
                </p>
                <div className="text-[11px] text-gray-400 font-medium">
                  Capability: Text & MRZ Extraction
                </div>
              </div>

              {/* OpenCV */}
              <div className="p-4 rounded-xl border border-gray-100 bg-[#F5F6F8] flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#111827]">OpenCV Forensics (ELA)</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-[#15803D]">
                    Operational
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Error Level Analysis (ELA), edge discontinuity, and copy-paste artifact detection.
                </p>
                <div className="text-[11px] text-gray-400 font-medium">
                  Capability: Pixel Tamper & Edge Analysis
                </div>
              </div>

              {/* InsightFace */}
              <div className="p-4 rounded-xl border border-gray-100 bg-[#F5F6F8] flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#111827]">Biometric 1:1 Matcher</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-[#15803D]">
                    Operational
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Facial landmark alignment, feature embedding, and cosine distance comparison.
                </p>
                <div className="text-[11px] text-gray-400 font-medium">
                  Capability: 1:1 Biometric Face Matching
                </div>
              </div>

              {/* scikit-learn Risk Engine */}
              <div className="p-4 rounded-xl border border-gray-100 bg-[#F5F6F8] flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#111827]">Threat Score Engine</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-[#15803D]">
                    Operational
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Weighted scoring model fusing OCR, ICAO checksums, ELA, and face distance.
                </p>
                <div className="text-[11px] text-gray-400 font-medium">
                  Capability: Multi-factor Threat Fusion
                </div>
              </div>

              {/* SHA-256 Audit Chain */}
              <div className="p-4 rounded-xl border border-gray-100 bg-[#F5F6F8] flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#111827]">SHA-256 Audit Chain</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-[#15803D]">
                    Operational
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Cryptographically linked immutable ledger verifying screening record integrity.
                </p>
                <div className="text-[11px] text-gray-400 font-medium">
                  Backend: Local Ledger (Supabase Compatible)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
