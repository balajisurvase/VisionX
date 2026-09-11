export type DocumentType = 'Passport' | 'Visa' | 'National ID' | 'Driving License' | 'Permit';

export type VerificationStatus = 'VERIFIED' | 'SUSPICIOUS' | 'FAILED' | 'EXPIRED' | 'NOT VERIFIED' | 'PENDING';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type CheckStatus = 'PASSED' | 'FAILED' | 'WARNING' | 'SUSPICIOUS';

export type DocStatus = 'VALID' | 'EXPIRED' | 'NOT FOUND' | 'REVOKED' | 'TAMPERED';

export interface OcrExtractedData {
  full_name: string;
  document_number: string;
  nationality: string;
  date_of_birth: string;
  date_of_expiry: string;
  gender: string;
  issue_date?: string;
  address?: string;
  visa_type?: string;
  stay_duration?: string;
  permit_zone?: string;
  mrz_line_1?: string;
  mrz_line_2?: string;
  confidence_score: number;
}

export interface ValidationDetails {
  format_valid: boolean;
  required_fields_present: boolean;
  date_format_valid: boolean;
  mrz_checksum_valid: boolean;
  document_not_expired: boolean;
  consistency_checked: boolean;
  verdict: 'VALID' | 'INVALID' | 'EXPIRED';
  failure_reasons: string[];
}

export interface TamperingDetails {
  photo_replacement_status: 'NO_ISSUE' | 'SUSPICIOUS' | 'DETECTED';
  text_manipulation_status: 'NO_ISSUE' | 'SUSPICIOUS' | 'DETECTED';
  stamp_analysis_status: 'NO_ISSUE' | 'SUSPICIOUS' | 'INCONSISTENT';
  metadata_analysis_status: 'NO_ISSUE' | 'MODIFIED' | 'EXIF_ANOMALY';
  tampering_probability: number; // 0 to 100%
  verdict: 'DOCUMENT APPEARS AUTHENTIC' | 'POTENTIAL TAMPERING' | 'TAMPERING DETECTED';
  detected_anomalies: string[];
}

export interface FaceVerificationDetails {
  document_face_url: string;
  presented_face_url: string;
  match_score: number; // 0 to 100%
  face_detected: boolean;
  liveness_passed: boolean;
  verdict: 'FACE MATCH' | 'FACE MISMATCH';
  confidence_metric: string;
}

export interface VerificationRecord {
  id: number;
  verification_id: string;
  applicant_name: string;
  document_type: DocumentType;
  document_number: string;
  date_of_birth: string | null;
  date_of_expiry?: string | null;
  nationality: string;
  verification_status: VerificationStatus;
  risk_score: number; // 0 to 100
  risk_level: RiskLevel;
  ocr_status: CheckStatus;
  validation_status: CheckStatus;
  tampering_status: CheckStatus;
  face_match_status: CheckStatus;
  document_status: DocStatus;
  verified_by: string;
  created_at: string;
  notes?: string;
  reasons?: string[];
  document_hash: string;
  ocr_data?: OcrExtractedData;
  validation_details?: ValidationDetails;
  tampering_details?: TamperingDetails;
  face_details?: FaceVerificationDetails;
}

export interface AuditLogRecord {
  id: number;
  verification_id: string;
  officer_id: string;
  document_hash: string;
  previous_hash: string;
  current_hash: string;
  action: string;
  created_at: string;
  integrity_status?: 'VALID' | 'COMPROMISED';
}

export interface DemoScenario {
  id: string;
  demo_number: number;
  title: string;
  applicant_name: string;
  document_type: DocumentType;
  document_number: string;
  date_of_birth: string;
  date_of_expiry: string;
  nationality: string;
  gender: string;
  expected_result: VerificationStatus;
  expected_risk: RiskLevel;
  expected_score: number;
  description: string;
  simulation_flag: string;
  ocr_status: CheckStatus;
  validation_status: CheckStatus;
  tampering_status: CheckStatus;
  face_match_status: CheckStatus;
  face_match_score: number;
  tampering_score: number;
  document_status: DocStatus;
  reasons: string[];
}

export interface RegisteredDocument {
  id: number;
  document_type: DocumentType;
  document_number: string;
  full_name: string;
  nationality: string;
  date_of_birth?: string | null;
  date_of_expiry?: string | null;
  gender?: string | null;
  document_status: DocStatus;
  document_hash: string;
  created_at?: string;
  metadata?: Record<string, any>;
}

export interface VerificationStats {
  totalChecked: number;
  verified: number;
  suspicious: number;
  failed: number;
  avgRiskScore: number;
}
