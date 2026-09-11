/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Read from Vite environment variables
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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

export function saveSupabaseCredentials(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('VERIDOC_SUPABASE_URL', url.trim());
    localStorage.setItem('VERIDOC_SUPABASE_ANON_KEY', key.trim());
  }
  window.location.reload();
}

export function clearSupabaseCredentials() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('VERIDOC_SUPABASE_URL');
    localStorage.removeItem('VERIDOC_SUPABASE_ANON_KEY');
  }
  window.location.reload();
}
