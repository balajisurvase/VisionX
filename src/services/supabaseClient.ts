/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Retrieve Supabase URL and Anon Key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Allow fallback or runtime configuration if env vars are missing
let currentUrl = supabaseUrl;
let currentKey = supabaseAnonKey;

// Check localStorage for user-configured Supabase credentials if not in env
if (!currentUrl && typeof window !== 'undefined') {
  currentUrl = localStorage.getItem('VERIDOC_SUPABASE_URL') || '';
}
if (!currentKey && typeof window !== 'undefined') {
  currentKey = localStorage.getItem('VERIDOC_SUPABASE_ANON_KEY') || '';
}

export const isSupabaseConfigured = Boolean(currentUrl && currentKey);

export const supabase = createClient(
  currentUrl || 'https://placeholder.supabase.co',
  currentKey || 'placeholder-key'
);

export function updateSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('VERIDOC_SUPABASE_URL', url.trim());
    localStorage.setItem('VERIDOC_SUPABASE_ANON_KEY', key.trim());
  }
  window.location.reload();
}
