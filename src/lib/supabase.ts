/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import {
  DbUser,
  DbVerificationRequest,
  DbVerificationMedia,
  DbExtractedData,
  DbVerificationCheck,
  DbVerificationResult,
  DbVerificationLog,
  SUPABASE_STORAGE_BUCKETS,
} from '../types/supabase';

// Read from Vite environment variables
const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

// Support local storage configuration for live app testing
const localUrl = typeof window !== 'undefined' ? localStorage.getItem('VERIDOC_SUPABASE_URL') || '' : '';
const localKey = typeof window !== 'undefined' ? localStorage.getItem('VERIDOC_SUPABASE_ANON_KEY') || '' : '';

export const supabaseUrl = envUrl || localUrl;
export const supabaseAnonKey = envKey || localKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
    },
  }
);

export async function saveSupabaseCredentials(url: string, key: string) {
  const cleanUrl = url.trim();
  const cleanKey = key.trim();
  if (typeof window !== 'undefined') {
    localStorage.setItem('VERIDOC_SUPABASE_URL', cleanUrl);
    localStorage.setItem('VERIDOC_SUPABASE_ANON_KEY', cleanKey);
  }
  // Sync with backend
  try {
    await fetch('/api/settings/supabase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: cleanUrl, key: cleanKey }),
    });
  } catch (err) {
    console.warn('Backend sync failed:', err);
  }
  window.location.reload();
}

export async function clearSupabaseCredentials() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('VERIDOC_SUPABASE_URL');
    localStorage.removeItem('VERIDOC_SUPABASE_ANON_KEY');
  }
  try {
    await fetch('/api/settings/supabase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: '', key: '' }),
    });
  } catch (err) {
    console.warn('Backend sync failed:', err);
  }
  window.location.reload();
}

/**
 * 7 Tables Metadata
 */
export const SUPABASE_TABLES = [
  { name: 'users', description: 'Officers and System Users', icon: 'Shield' },
  { name: 'verification_requests', description: 'Document Screening Requests', icon: 'FileText' },
  { name: 'verification_media', description: 'Uploaded Document & Biometric Media', icon: 'Image' },
  { name: 'extracted_data', description: 'PaddleOCR Extracted Identity Fields', icon: 'ScanLine' },
  { name: 'verification_checks', description: 'Individual Forensic & Biometric Checks', icon: 'CheckCircle2' },
  { name: 'verification_results', description: 'Final Risk Scores, Status & Rationale', icon: 'Award' },
  { name: 'verification_logs', description: 'Audit & Stage Processing Progress', icon: 'Activity' },
] as const;

export { SUPABASE_STORAGE_BUCKETS };
