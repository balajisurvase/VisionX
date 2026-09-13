/**
 * Supabase 7-Table Schema Types for IdentityGuard AI
 * Smart India Hackathon (SIH 2026) - Problem Statement 26188
 */

export interface DbUser {
  id: string; // UUID
  username: string;
  full_name: string;
  role: 'ADMIN' | 'OFFICER' | 'ANALYST' | string;
  email: string;
  avatar_url?: string | null;
  is_active: boolean;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
  user_id: string; // 'A001', 'A002', 'A003'
  password: string; // 'admin123'
}

export interface DbVerificationRequest {
  id: string; // UUID
  verification_code: string; // 'VER-DEMO001'
  user_id: string; // references users.id
  document_type: 'PASSPORT' | 'NATIONAL_ID' | 'DRIVING_LICENSE' | 'VISA' | string;
  status: 'COMPLETED' | 'SUSPICIOUS' | 'REJECTED' | 'PROCESSING' | string;
  demo_mode: boolean;
  original_filename: string;
  mime_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface DbVerificationMedia {
  id: string; // UUID
  verification_id: string; // references verification_requests.id
  uploaded_by: string; // references users.id
  media_type: 'DOCUMENT_FRONT' | 'DOCUMENT_BACK' | 'FACE_PHOTO' | string;
  bucket_name: 'verification-documents' | string;
  storage_path: string; // `${user_id}/${verification_id}/${filename}`
  original_filename: string;
  mime_type: string;
  file_size: number;
  checksum?: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface DbExtractedData {
  id: string; // UUID
  verification_id: string; // references verification_requests.id
  document_number: string;
  full_name: string;
  date_of_birth: string;
  nationality: string;
  gender: string;
  issue_date?: string | null;
  expiry_date?: string | null;
  issuing_country: string;
  mrz_line_1?: string | null;
  mrz_line_2?: string | null;
  mrz_line_3?: string | null;
  raw_text: string;
  ocr_confidence: number | string;
  mrz_valid: boolean;
  created_at: string;
}

export interface DbVerificationCheck {
  id: string; // UUID
  verification_id: string; // references verification_requests.id
  check_type: 'OCR' | 'MRZ' | 'DOCUMENT_AUTHENTICITY' | 'TAMPERING' | 'FACE_MATCH' | string;
  status: 'PASSED' | 'WARNING' | 'FAILED';
  score: number | string;
  confidence: number | string;
  message: string;
  details: string | Record<string, any>;
  is_demo_result: boolean;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export interface DbVerificationResult {
  id: string; // UUID
  verification_id: string; // references verification_requests.id
  ocr_score: number | string;
  mrz_score: number | string;
  authenticity_score: number | string;
  tampering_score: number | string;
  face_match_score: number | string;
  liveness_score: number | string;
  image_quality_score: number | string;
  risk_score: number | string;
  confidence_score: number | string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  final_status: 'VERIFIED' | 'SUSPICIOUS' | 'REJECTED';
  explanation: string;
  recommendation: string;
  is_demo_result: boolean;
  created_at: string;
}

export interface DbVerificationLog {
  id: string; // UUID
  verification_id: string; // references verification_requests.id
  step_name: 'UPLOAD' | 'OCR' | 'MRZ_VALIDATION' | 'TAMPERING_ANALYSIS' | 'FACE_VERIFICATION' | 'RISK_ANALYSIS' | string;
  status: 'COMPLETED' | 'PENDING' | 'PROCESSING' | 'FAILED';
  message: string;
  progress: number;
  metadata: string | Record<string, any>;
  created_at: string;
}

export const SUPABASE_STORAGE_BUCKETS = {
  DOCUMENTS: 'verification-documents',
  REPORTS: 'verification-reports',
} as const;
