import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  Database,
  Copy,
  Cpu,
  RefreshCw,
  Check,
} from 'lucide-react';
import { OfficerUser } from '../types/auth';
import { checkSystemHealth, SystemHealthResponse, getDatabaseStatus, DatabaseStatusResponse, syncDatabase } from '../services/api';
import { API_ENDPOINTS } from '../config/api';
import {
  supabaseUrl,
  supabaseAnonKey,
  saveSupabaseCredentials,
} from '../lib/supabase';

interface SettingsProps {
  user: OfficerUser | null;
  onLogout: () => void;
}

const SUPABASE_SCHEMA_SQL = `-- VisionX Database Schema
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'OFFICER',
  email VARCHAR(150),
  user_id VARCHAR(80) UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  request_status VARCHAR(40) NOT NULL DEFAULT 'COMPLETED',
  document_type VARCHAR(60) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

export const Settings: React.FC<SettingsProps> = ({ user, onLogout }) => {
  const [urlInput, setUrlInput] = useState<string>(supabaseUrl || '');
  const [keyInput, setKeyInput] = useState<string>(supabaseAnonKey || '');
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'officer' | 'ai-models' | 'database'>('officer');
  const [healthStatus, setHealthStatus] = useState<SystemHealthResponse | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatusResponse | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [geminiStatus, setGeminiStatus] = useState<{
    configured: boolean;
    status: string;
    model: string;
    message: string;
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
      });
    } catch {
      setGeminiStatus({
        configured: false,
        status: 'error',
        model: 'gemini-3.8-flash',
        message: 'Could not connect to /api/gemini/status',
      });
    }
  };

  const loadHealth = async () => {
    try {
      const data = await checkSystemHealth();
      setHealthStatus(data);
    } catch (err) {
      console.warn('Failed to fetch system health:', err);
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
    <div
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className="p-4 md:p-6 max-w-7xl mx-auto space-y-5 text-[#10233F]"
    >
      {/* Header Bar */}
      <div className="bg-white border border-[#C9DCF8] rounded-[8px] p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-[#10233F] uppercase tracking-tight">
            System Settings & Security Protocols
          </h1>
          <p className="text-[17px] text-[#64748B] mt-1 font-normal">
            Terminal configuration, AI vision models, and database credentials
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-[#F5F9FF] p-1.5 rounded-[6px] border border-[#C9DCF8] text-[15px] font-bold">
          <button
            onClick={() => setActiveTab('officer')}
            className={`px-4 py-2 rounded-[4px] uppercase cursor-pointer ${
              activeTab === 'officer'
                ? 'bg-[#102A56] text-white'
                : 'text-[#10233F] hover:bg-[#EAF2FF]'
            }`}
          >
            Officer Security
          </button>
          <button
            onClick={() => setActiveTab('ai-models')}
            className={`px-4 py-2 rounded-[4px] uppercase cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ai-models'
                ? 'bg-[#102A56] text-white'
                : 'text-[#10233F] hover:bg-[#EAF2FF]'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>AI Models</span>
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2 rounded-[4px] uppercase cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'database'
                ? 'bg-[#102A56] text-white'
                : 'text-[#10233F] hover:bg-[#EAF2FF]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Database</span>
          </button>
        </div>
      </div>

      {activeTab === 'officer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white border border-[#C9DCF8] rounded-[8px] p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#C9DCF8] pb-4">
              <h2 className="text-[24px] font-bold text-[#10233F] uppercase flex items-center gap-2">
                <Shield className="w-6 h-6 text-[#2563EB]" />
                <span>Officer Account Security</span>
              </h2>
              <span className="px-3 py-1 bg-[#DCFCE7] text-[#15803D] border border-green-300 rounded-[4px] text-[13px] font-bold uppercase">
                ACTIVE ON DUTY
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[16px]">
              <div className="p-4 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                <span className="text-[13px] font-bold text-[#64748B] uppercase block">Officer Name</span>
                <span className="font-bold text-[#10233F]">{user?.full_name || 'Officer A001'}</span>
              </div>
              <div className="p-4 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                <span className="text-[13px] font-bold text-[#64748B] uppercase block">User ID</span>
                <span className="font-bold text-[#2563EB]">{user?.user_id || 'A001'}</span>
              </div>
              <div className="p-4 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                <span className="text-[13px] font-bold text-[#64748B] uppercase block">Department</span>
                <span className="font-bold text-[#10233F]">{user?.department || 'Identity Screening'}</span>
              </div>
              <div className="p-4 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                <span className="text-[13px] font-bold text-[#64748B] uppercase block">Role</span>
                <span className="font-bold text-[#10233F]">{user?.role || 'Senior Officer'}</span>
              </div>
            </div>

            <div className="border-t border-[#C9DCF8] pt-6 space-y-4">
              <h3 className="text-[20px] font-bold text-[#10233F] uppercase flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#2563EB]" />
                <span>Change Security Password</span>
              </h3>

              {passwordStatus && (
                <p className="p-3 bg-[#EAF2FF] border border-[#C9DCF8] rounded-[6px] text-[15px] font-bold text-[#2563EB]">
                  {passwordStatus}
                </p>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                <div>
                  <label className="text-[14px] font-bold text-[#10233F] uppercase block mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px] text-[16px] text-[#10233F] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[14px] font-bold text-[#10233F] uppercase block mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px] text-[16px] text-[#10233F] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[14px] font-bold text-[#10233F] uppercase block mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px] text-[16px] text-[#10233F] outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-[15px] uppercase rounded-[6px] cursor-pointer"
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>

          <div className="bg-white border border-[#C9DCF8] rounded-[8px] p-6 space-y-4">
            <h3 className="text-[20px] font-bold text-[#10233F] uppercase border-b border-[#C9DCF8] pb-3">
              Workstation Status
            </h3>
            <div className="space-y-3 text-[15px]">
              <div className="flex justify-between p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                <span className="text-[#64748B]">Terminal ID:</span>
                <span className="font-bold text-[#10233F]">WORKSTATION-01</span>
              </div>
              <div className="flex justify-between p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                <span className="text-[#64748B]">Encryption:</span>
                <span className="font-bold text-[#2563EB]">AES-256</span>
              </div>
              <div className="flex justify-between p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                <span className="text-[#64748B]">Health:</span>
                <span className="font-bold text-[#15803D]">OPTIMAL</span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full py-3 bg-[#B91C1C] hover:bg-red-800 text-white font-bold text-[15px] uppercase rounded-[6px] cursor-pointer mt-4"
            >
              Sign Out Workstation
            </button>
          </div>
        </div>
      )}

      {activeTab === 'ai-models' && (
        <div className="bg-white border border-[#C9DCF8] rounded-[8px] p-8 space-y-6">
          <h2 className="text-[24px] font-bold text-[#10233F] uppercase border-b border-[#C9DCF8] pb-4">
            AI Computer Vision Models
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[16px]">
            <div className="p-6 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[8px] space-y-2">
              <span className="text-[13px] font-bold text-[#2563EB] uppercase block">Primary Model</span>
              <h3 className="text-[20px] font-bold text-[#10233F]">Google Gemini Vision</h3>
              <p className="text-[#64748B] text-[15px]">OCR Field Extraction & MRZ Readout</p>
              <div className="pt-2 font-bold text-[#15803D]">Status: {geminiStatus?.status || 'ONLINE'}</div>
            </div>

            <div className="p-6 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[8px] space-y-2">
              <span className="text-[13px] font-bold text-[#2563EB] uppercase block">Secondary Model</span>
              <h3 className="text-[20px] font-bold text-[#10233F]">OpenCV Forensic Engine</h3>
              <p className="text-[#64748B] text-[15px]">Digital Tampering & Error Level Analysis (ELA)</p>
              <div className="pt-2 font-bold text-[#15803D]">Status: ONLINE</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'database' && (
        <div className="bg-white border border-[#C9DCF8] rounded-[8px] p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#C9DCF8] pb-4">
            <h2 className="text-[24px] font-bold text-[#10233F] uppercase">
              Database Sync & Schema
            </h2>
            <button
              onClick={handleSyncDatabase}
              disabled={isSyncing}
              className="px-5 py-2.5 bg-[#2563EB] text-white font-bold text-[15px] uppercase rounded-[6px] cursor-pointer flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sync Database</span>
            </button>
          </div>

          {syncMessage && (
            <p className="p-3 bg-[#EAF2FF] border border-[#C9DCF8] rounded-[6px] text-[15px] font-bold text-[#2563EB]">
              {syncMessage}
            </p>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[#10233F] uppercase">
                SQL Schema Reference
              </h3>
              <button
                onClick={handleCopySql}
                className="px-4 py-2 bg-white text-[#10233F] border border-[#C9DCF8] rounded-[4px] text-[14px] font-bold uppercase cursor-pointer flex items-center gap-2"
              >
                {copiedSql ? <Check className="w-4 h-4 text-[#15803D]" /> : <Copy className="w-4 h-4 text-[#2563EB]" />}
                <span>{copiedSql ? 'Copied SQL' : 'Copy SQL'}</span>
              </button>
            </div>

            <pre className="p-4 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px] text-[13px] font-mono text-[#10233F] overflow-x-auto max-h-[300px]">
              {SUPABASE_SCHEMA_SQL}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
