import React, { useState } from 'react';
import {
  Shield,
  Database,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Key,
  Globe,
  Lock,
  FileText,
  Users,
  Calendar,
  Sparkles,
  CreditCard,
  AlertCircle,
  Image as ImageIcon,
  UserCheck,
  DollarSign,
  Bell,
  MessageSquare,
} from 'lucide-react';
import {
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
  SOCIETY_TABLES,
} from '../lib/supabase';
import { supabase } from '../lib/supabase';

export const SocietySettings: React.FC = () => {
  const [urlInput, setUrlInput] = useState<string>(supabaseUrl || '');
  const [keyInput, setKeyInput] = useState<string>(supabaseAnonKey || '');
  const [testing, setTesting] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<Record<string, 'ok' | 'error' | 'testing'>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const testAll12Tables = async () => {
    setTesting(true);
    setStatusMessage('Querying all 12 Supabase tables...');
    const results: Record<string, 'ok' | 'error' | 'testing'> = {};

    for (const table of SOCIETY_TABLES) {
      try {
        const { error } = await supabase.from(table.name).select('*').limit(1);
        results[table.name] = error ? 'error' : 'ok';
      } catch {
        results[table.name] = 'error';
      }
    }

    setTestResults(results);
    setTesting(false);
    setStatusMessage('Database connectivity audit completed across all 12 tables.');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !keyInput.trim()) {
      alert('Please enter both Supabase URL and Anon Public Key.');
      return;
    }
    await saveSupabaseCredentials(urlInput.trim(), keyInput.trim());
  };

  const handleReset = async () => {
    if (window.confirm('Reset connection to defaults?')) {
      await clearSupabaseCredentials();
    }
  };

  return (
    <div
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 text-[#212121]"
    >
      {/* 1. Header */}
      <div className="bg-white border border-[#E1BEE7] rounded-[6px] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[12px] font-bold text-[#6A1B9A] uppercase tracking-wider px-2.5 py-0.5 bg-[#F3E5F5] rounded-[4px] border border-[#E1BEE7]">
              Supabase Infrastructure
            </span>
          </div>
          <h1 className="text-[30px] font-bold text-[#4A148C] uppercase tracking-tight leading-tight">
            Supabase Project & 12-Table Connection Status
          </h1>
          <p className="text-[15px] text-[#616161] font-normal">
            PostgreSQL relational database schema audit and real-time operational status
          </p>
        </div>

        <button
          onClick={testAll12Tables}
          disabled={testing}
          className="px-5 py-2.5 bg-[#4A148C] hover:bg-[#310C61] text-white text-[14px] font-bold uppercase rounded-[4px] shadow-xs cursor-pointer flex items-center gap-2 transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
          <span>Audit 12 Tables</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 bg-[#E8F5E9] border border-[#A5D6A7] rounded-[4px] text-[#2E7D32] text-[14px] font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 2. 12 Database Tables Grid */}
      <div className="bg-white border border-[#E1BEE7] rounded-[6px] p-6 shadow-xs space-y-4">
        <h2 className="text-[20px] font-bold text-[#310C61] uppercase border-b border-[#E1BEE7] pb-3">
          12 Integrated Supabase Database Tables
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SOCIETY_TABLES.map((tbl) => {
            const status = testResults[tbl.name];
            return (
              <div
                key={tbl.name}
                className="p-4 bg-[#FAF8FC] border border-[#E1BEE7] rounded-[6px] flex items-center justify-between"
              >
                <div>
                  <span className="font-mono font-bold text-[16px] text-[#4A148C] block">
                    public.{tbl.name}
                  </span>
                  <span className="text-[13px] text-[#616161]">{tbl.description}</span>
                </div>

                <div>
                  {status === 'ok' ? (
                    <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-[3px] border border-[#A5D6A7] uppercase">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Connected</span>
                    </span>
                  ) : status === 'error' ? (
                    <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#C62828] bg-[#FFEBEE] px-2 py-0.5 rounded-[3px] border border-[#EF9A9A] uppercase">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Fallback / Err</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#6A1B9A] bg-[#F3E5F5] px-2 py-0.5 rounded-[3px] border border-[#CE93D8] uppercase">
                      <span>Ready</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Credentials Configuration Form */}
      <div className="bg-white border border-[#E1BEE7] rounded-[6px] p-6 shadow-xs space-y-4">
        <h2 className="text-[20px] font-bold text-[#310C61] uppercase border-b border-[#E1BEE7] pb-3">
          Supabase Credentials Configuration
        </h2>

        <form onSubmit={handleSave} className="space-y-4 max-w-2xl text-[14px]">
          <div>
            <label className="block font-bold text-[#212121] mb-1">
              Supabase Project URL (`VITE_SUPABASE_URL`)
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-[#6A1B9A] absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                required
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full pl-9 pr-3 py-2 bg-[#FAF8FC] border border-[#CE93D8] focus:border-[#4A148C] focus:bg-white rounded-[4px] font-mono text-[14px] text-[#212121] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#212121] mb-1">
              Supabase Anon Public API Key (`VITE_SUPABASE_ANON_KEY`)
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-[#6A1B9A] absolute left-3 top-3 pointer-events-none" />
              <input
                type="password"
                required
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full pl-9 pr-3 py-2 bg-[#FAF8FC] border border-[#CE93D8] focus:border-[#4A148C] focus:bg-white rounded-[4px] font-mono text-[14px] text-[#212121] outline-none"
              />
            </div>
            <p className="text-[12px] text-[#757575] mt-1">
              🔒 Safe client-side anonymous key. Never expose your Service Role Key in frontend code.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#4A148C] hover:bg-[#310C61] text-white font-bold text-[14px] uppercase rounded-[4px] shadow-xs cursor-pointer transition-colors"
            >
              Save Credentials & Connect
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 border border-[#CE93D8] hover:bg-[#FAF8FC] text-[#4A148C] font-bold text-[14px] uppercase rounded-[4px] cursor-pointer"
            >
              Clear Stored Keys
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
