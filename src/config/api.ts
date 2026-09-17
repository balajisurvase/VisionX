/**
 * Centralized API Configuration for IdentityGuard AI.
 * 
 * Allows switching between the integrated Node.js gateway and an external
 * Python FastAPI backend simply by configuring VITE_API_BASE_URL.
 * 
 * Example:
 *   VITE_API_BASE_URL=https://identityguard-api.onrender.com
 * When left empty, requests default to the same-origin reverse-proxy or local server.
 */

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';
export const API_BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

export const API_ENDPOINTS = {
  // Core Authentication
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    me: `${API_BASE_URL}/api/auth/me`,
  },
  // Health & Diagnostics
  health: `${API_BASE_URL}/api/health`,
  // Gemini Multimodal AI Service (Server-side proxy)
  gemini: {
    status: `${API_BASE_URL}/api/gemini/status`,
    explain: `${API_BASE_URL}/api/gemini/explain`,
  },
  // Verification Pipeline (OpenCV + PaddleOCR + MRZ + Face + Risk Engine)
  verify: `${API_BASE_URL}/api/verify`,
  verification: {
    screen: `${API_BASE_URL}/api/verification/screen`,
    history: `${API_BASE_URL}/api/verification/history`,
    detail: (id: string | number) => `${API_BASE_URL}/api/verification/${encodeURIComponent(id)}`,
  },
  // Dashboard & Metrics
  dashboard: `${API_BASE_URL}/api/dashboard`,
  documents: `${API_BASE_URL}/api/documents`,
  demoScenarios: `${API_BASE_URL}/api/demo/scenarios`,
  // Registered Persons & Identity Database
  persons: {
    list: `${API_BASE_URL}/api/persons`,
    detail: (id: string | number) => `${API_BASE_URL}/api/persons/${encodeURIComponent(id)}`,
    create: `${API_BASE_URL}/api/persons`,
    delete: (id: string | number) => `${API_BASE_URL}/api/persons/${encodeURIComponent(id)}`,
    match: `${API_BASE_URL}/api/persons/match`,
  },
  // Audit Chain
  audit: {
    logs: `${API_BASE_URL}/api/audit/logs`,
    verify: `${API_BASE_URL}/api/audit/verify`,
  },
  // Supabase Database & Table Synchronization
  database: {
    status: `${API_BASE_URL}/api/database/status`,
    sync: `${API_BASE_URL}/api/database/sync`,
  },
  settings: {
    supabase: `${API_BASE_URL}/api/settings/supabase`,
  },
} as const;
