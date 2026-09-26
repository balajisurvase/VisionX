/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Read from Vite environment variables
const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

// Support local storage configuration for live app testing
const localUrl = typeof window !== 'undefined' ? localStorage.getItem('SOCIETY_SUPABASE_URL') || '' : '';
const localKey = typeof window !== 'undefined' ? localStorage.getItem('SOCIETY_SUPABASE_ANON_KEY') || '' : '';

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
    localStorage.setItem('SOCIETY_SUPABASE_URL', cleanUrl);
    localStorage.setItem('SOCIETY_SUPABASE_ANON_KEY', cleanKey);
  }
  // Also sync to backend proxy if available
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
    localStorage.removeItem('SOCIETY_SUPABASE_URL');
    localStorage.removeItem('SOCIETY_SUPABASE_ANON_KEY');
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
 * Metadata for all 12 Supabase Tables
 */
export const SOCIETY_TABLES = [
  { name: 'admin', description: 'Admin & Society Management Officers', icon: 'Shield' },
  { name: 'resident', description: 'Resident Directory (Owners & Tenants)', icon: 'Users' },
  { name: 'booking', description: 'Facility & Amenity Bookings', icon: 'Calendar' },
  { name: 'amenities', description: 'Society Amenities & Rates', icon: 'Sparkles' },
  { name: 'maintenance', description: 'Maintenance Dues & Payments', icon: 'Receipt' },
  { name: 'complaint', description: 'Grievances & Helpdesk Complaints', icon: 'AlertCircle' },
  { name: 'media', description: 'Complaint Attachments & Documents', icon: 'Image' },
  { name: 'visitors', description: 'Visitor Entry & Gate Logs', icon: 'UserCheck' },
  { name: 'security', description: 'Security Personnel & Shifts', icon: 'Lock' },
  { name: 'finance', description: 'Society Income & Expense Ledger', icon: 'DollarSign' },
  { name: 'notices', description: 'Broadcast Bulletins & Notices', icon: 'Bell' },
  { name: 'communications', description: 'Instant Messages & Helpdesk Chat', icon: 'MessageSquare' },
] as const;
