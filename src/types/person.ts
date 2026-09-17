import { DocumentType } from './verification';

export type PersonStatus = 'ACTIVE' | 'SUSPENDED' | 'UNDER_REVIEW' | 'FLAGGED';
export type RegisteredDocStatus = 'VALID' | 'EXPIRED' | 'REVOKED' | 'TAMPERED';

export interface RegisteredDocumentItem {
  id: string | number;
  person_id: string | number;
  document_type: DocumentType;
  document_number: string;
  issue_date: string;
  expiry_date: string;
  issuing_country: string;
  issuing_authority?: string;
  storage_path?: string;
  document_hash: string;
  status: RegisteredDocStatus;
  created_at?: string;
  notes?: string;
}

export interface RegisteredPerson {
  id: string | number;
  person_code: string; // e.g., P001, P002
  full_name: string;
  date_of_birth: string; // YYYY-MM-DD
  nationality: string;
  gender: string; // Male | Female | Other
  status: PersonStatus;
  photo_url?: string;
  email?: string;
  phone?: string;
  address?: string;
  documents: RegisteredDocumentItem[];
  created_at: string;
  updated_at?: string;
  notes?: string;
}

export interface FieldMatchDetail {
  field_name: string;
  label: string;
  uploaded_value: string;
  database_value: string;
  is_match: boolean;
  similarity_score: number; // 0 to 100
  notes?: string;
}

export interface RegisteredBiometricMatch {
  status: 'MATCH' | 'MISMATCH' | 'NOT_AVAILABLE' | 'UNABLE_TO_COMPARE';
  score: number | null;
  reference_available: boolean;
  reference_bucket?: string;
  reference_path?: string;
  comparison_notes?: string;
}

export interface RegisteredDocumentMatch {
  status: 'MATCH' | 'PARTIAL_MATCH' | 'MISMATCH' | 'NOT_AVAILABLE';
  score: number;
  matched_fields: string[];
  mismatched_fields: string[];
  unavailable_fields: string[];
  field_comparisons?: FieldMatchDetail[];
}

export interface RegisteredIdentityResult {
  record_found: boolean;
  person_id?: string | null;
  person_code?: string | null;
  person_name?: string | null;
  document_id?: string | null;
  document_match: RegisteredDocumentMatch;
  biometric_match: RegisteredBiometricMatch;
  recommendation?: string;
  mismatch_reasons?: string[];
}

export interface DatabaseMatchResult {
  match_status: 'EXACT_MATCH' | 'PARTIAL_MATCH' | 'MISMATCH' | 'NOT_FOUND';
  overall_match_score: number; // 0 to 100
  matched_person?: RegisteredPerson | null;
  matched_document?: RegisteredDocumentItem | null;
  field_comparisons: FieldMatchDetail[];
  mismatch_reasons: string[];
  recommendation: string;
  searched_query: {
    document_number?: string;
    full_name?: string;
    nationality?: string;
  };
  registered_identity?: RegisteredIdentityResult;
}

