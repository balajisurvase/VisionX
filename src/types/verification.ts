import { DatabaseMatchResult } from './person';

export type DocumentType = 'Passport' | 'Visa' | 'National ID' | 'Driving License' | 'Permit';

export type DocumentAuthenticityStatus =
  | 'AUTHENTIC'
  | 'SUSPICIOUS'
  | 'LIKELY_MANIPULATED'
  | 'FAILED'
  | 'INCONCLUSIVE';

export type VerificationStatus =
  | 'AUTHENTIC'
  | 'SUSPICIOUS'
  | 'LIKELY_MANIPULATED'
  | 'FAILED'
  | 'INCONCLUSIVE'
  | 'VERIFIED'
  | 'REVIEW_REQUIRED'
  | 'MISMATCH'
  | 'UNREGISTERED'
  | 'EXPIRED'
  | 'NOT VERIFIED'
  | 'PENDING'
  | 'REJECTED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';

export interface VisibleVsMrzField {
  field_name: string;
  visible_value: string;
  mrz_value: string;
  status: 'MATCH' | 'MISMATCH' | 'NOT AVAILABLE';
}

export type CheckStatus = 'PASSED' | 'FAILED' | 'WARNING' | 'SUSPICIOUS' | 'NOT_PERFORMED' | 'EXPIRED';

export type DocStatus = 'VALID' | 'EXPIRED' | 'NOT FOUND' | 'REVOKED' | 'TAMPERED' | 'INVALID' | 'NOT_PERFORMED';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrRegion {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScanRegions {
  document_bbox: BoundingBox;
  portrait_bbox: BoundingBox;
  mrz_bbox: BoundingBox;
  ocr_regions: OcrRegion[];
}

export interface UploadedDocumentInfo {
  bucket?: string;
  path?: string;
  signed_url: string;
}

export interface DocumentDetectionInfo {
  detected: boolean;
  type: string;
  confidence: number;
  bounding_box: BoundingBox;
  image_quality?: number;
}

export interface UploadedPortraitInfo {
  detected: boolean;
  bucket?: string;
  path?: string;
  signed_url?: string;
  url?: string;
  bounding_box?: BoundingBox;
}

export interface RegisteredBiometricInfo {
  available: boolean;
  bucket?: string;
  path?: string;
  signed_url?: string | null;
  photo_url?: string | null;
  person_code?: string | null;
}

export interface BiometricComparisonInfo {
  uploaded_face_detected: boolean;
  reference_face_detected: boolean;
  similarity: number | null;
  threshold: number;
  match: boolean;
}

export interface MrzDetectionInfo {
  detected: boolean;
  crop_url?: string;
  line_1?: string;
  line_2?: string;
  checksum_valid: boolean;
  valid?: boolean;
}

export interface RegisteredIdentityInfo {
  found: boolean;
  matched?: boolean;
  person_id?: string | null;
  person_code?: string | null;
  full_name?: string | null;
  nationality?: string | null;
  document_id?: string | null;
  status?: string;
  conflicting_fields?: string[];
}

export interface DebugInfo {
  file_received: boolean;
  image_read: boolean;
  document_detected?: boolean;
  image_preprocessed?: boolean;
  ocr_completed?: boolean;
  mrz_detected?: boolean;
  mrz_checksum_valid?: boolean;
  field_extraction_completed?: boolean;
  portrait_detected?: boolean;
  document_structure_analyzed?: boolean;
  tampering_analyzed?: boolean;
  visible_mrz_consistency_checked?: boolean;
  date_validation_completed?: boolean;
  risk_calculated?: boolean;
  final_assessment_completed?: boolean;
  document_number_extracted?: string;
  final_status: string;
  [key: string]: any;
}

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
  mrz_valid?: boolean;
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
  photo_replacement_status: 'NO_ISSUE' | 'SUSPICIOUS' | 'DETECTED' | 'ANOMALY';
  text_manipulation_status: 'NO_ISSUE' | 'SUSPICIOUS' | 'DETECTED' | 'ANOMALY';
  stamp_analysis_status: 'NO_ISSUE' | 'SUSPICIOUS' | 'INCONSISTENT';
  metadata_analysis_status: 'NO_ISSUE' | 'MODIFIED' | 'EXIF_ANOMALY';
  tampering_probability: number; // 0 to 100%
  verdict: 'DOCUMENT APPEARS AUTHENTIC' | 'POTENTIAL TAMPERING' | 'TAMPERING DETECTED' | 'TAMPERING ANOMALY DETECTED';
  detected_anomalies: string[];
}

export interface FaceVerificationDetails {
  document_face_url: string;
  presented_face_url: string;
  match_score: number; // 0 to 100%
  face_detected: boolean;
  liveness_passed: boolean;
  verdict: 'FACE MATCH' | 'FACE MISMATCH' | 'NOT PERFORMED';
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
  database_match?: DatabaseMatchResult;
  scan_regions?: ScanRegions;
  debug?: DebugInfo;
  uploaded_document?: UploadedDocumentInfo;
  document_detection?: DocumentDetectionInfo;
  uploaded_portrait?: UploadedPortraitInfo;
  registered_biometric?: RegisteredBiometricInfo;
  biometric?: BiometricComparisonInfo;
  mrz_info?: MrzDetectionInfo;
  registered_identity_info?: RegisteredIdentityInfo;
  explanation?: string;
  field_consistency?: VisibleVsMrzField[];
  extracted_fields?: Record<string, string>;
  authenticity_status?: string;
  forensic_evidence?: any;
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
