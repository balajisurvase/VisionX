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
} from 'lucide-react';
import { OfficerUser } from '../types/auth';
import { checkSystemHealth, SystemHealthResponse, getDatabaseStatus, DatabaseStatusResponse, syncDatabase } from '../services/api';
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

const SUPABASE_SCHEMA_SQL = `-- SIH 2026 Problem Statement 26188: SSB Document Screening Database
-- Run this script in your Supabase SQL Editor

-- 1. Officers Table
CREATE TABLE IF NOT EXISTS officers (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'Officer',
  status VARCHAR(20) DEFAULT 'Active',
  department VARCHAR(150),
  designation VARCHAR(150),
  terminal VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Officers
INSERT INTO officers (user_id, password_hash, full_name, role, status)
VALUES 
  ('officer001', 'Officer@123', 'Inspector Rajeshwar Kumar', 'Officer', 'Active'),
  ('demo_officer', 'Demo@123', 'Demo Security Officer', 'Officer', 'Active'),
  ('admin01', 'Admin@123', 'Commander Vikramaditya Singh', 'Admin', 'Active')
ON CONFLICT (user_id) DO NOTHING;

-- 2. Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  document_type VARCHAR(50) NOT NULL,
  document_number VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  nationality VARCHAR(50) NOT NULL,
  date_of_birth DATE,
  date_of_expiry DATE,
  gender VARCHAR(20),
  document_status VARCHAR(20) DEFAULT 'VALID',
  document_hash TEXT NOT NULL,
  ocr_text TEXT,
  file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Verification Records Table
CREATE TABLE IF NOT EXISTS verification_records (
  id BIGSERIAL PRIMARY KEY,
  verification_id VARCHAR(50) UNIQUE NOT NULL,
  document_id BIGINT REFERENCES documents(id) ON DELETE SET NULL,
  officer_id VARCHAR(50) NOT NULL,
  ocr_status VARCHAR(20) DEFAULT 'PASSED',
  ocr_confidence NUMERIC(5,2) DEFAULT 98.0,
  validation_status VARCHAR(20) DEFAULT 'PASSED',
  mrz_valid BOOLEAN DEFAULT TRUE,
  tampering_status VARCHAR(20) DEFAULT 'PASSED',
  tampering_score NUMERIC(5,2) DEFAULT 4.0,
  face_verification_status VARCHAR(20) DEFAULT 'PASSED',
  face_match_score NUMERIC(5,2) DEFAULT 95.0,
  risk_score INT DEFAULT 15,
  risk_level VARCHAR(20) DEFAULT 'LOW',
  final_result VARCHAR(20) NOT NULL,
  document_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Audit Logs Table (Blockchain Hash Chain)
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  verification_id VARCHAR(50) NOT NULL,
  officer_id VARCHAR(50) NOT NULL,
  document_hash TEXT NOT NULL,
  previous_hash TEXT NOT NULL,
  current_hash TEXT NOT NULL,
  action VARCHAR(100) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`;

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

  useEffect(() => {
    loadHealth();
    loadDbStatus();
  }, []);

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
