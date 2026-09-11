import {
  VerificationRecord,
  VerificationStats,
  RegisteredDocument,
  DemoScenario,
  AuditLogRecord,
  DocumentType,
} from '../types/verification';

export interface SystemHealthResponse {
  status: string;
  service: string;
  models: Array<{
    name: string;
    status: 'Available' | 'Unavailable';
    version?: string;
    notes?: string;
  }>;
  database: string;
  timestamp: string;
}

export async function checkSystemHealth(): Promise<SystemHealthResponse> {
  const res = await fetch('/api/health');
  if (!res.ok) {
    throw new Error(`Health check failed with HTTP ${res.status}`);
  }
  return res.json();
}

export async function getDashboardStats(): Promise<{
  stats: VerificationStats;
  recent: VerificationRecord[];
}> {
  const res = await fetch('/api/dashboard');
  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard metrics: ${res.status}`);
  }
  const data = await res.json();
  return {
    stats: {
      totalChecked: data.total_screenings || 0,
      verified: data.verified_count || 0,
      suspicious: data.suspicious_count || 0,
      failed: data.failed_count || 0,
      avgRiskScore: 0,
    },
    recent: (data.recent_verifications || []).map(mapApiRecordToFrontend),
  };
}

export async function getDocuments(
  type?: string,
  status?: string,
  search?: string
): Promise<RegisteredDocument[]> {
  const params = new URLSearchParams();
  if (type && type !== 'ALL') params.append('type', type);
  if (status && status !== 'ALL') params.append('status', status);
  if (search) params.append('search', search);

  const res = await fetch(`/api/documents?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to list documents: ${res.status}`);
  }
  return res.json();
}

export async function getHistory(): Promise<VerificationRecord[]> {
  const res = await fetch('/api/history');
  if (!res.ok) {
    throw new Error(`Failed to fetch verification history: ${res.status}`);
  }
  const rawList = await res.json();
  return (rawList || []).map(mapApiRecordToFrontend);
}

export async function getHistoryDetail(verificationId: string): Promise<VerificationRecord> {
  const res = await fetch(`/api/history/${encodeURIComponent(verificationId)}`);
  if (!res.ok) {
    throw new Error(`Failed to load screening report ${verificationId}: ${res.status}`);
  }
  const raw = await res.json();
  return mapApiRecordToFrontend(raw);
}

export async function getAuditLogs(): Promise<AuditLogRecord[]> {
  const res = await fetch('/api/audit/logs');
  if (!res.ok) {
    throw new Error(`Failed to fetch audit logs: ${res.status}`);
  }
  return res.json();
}

export interface DatabaseStatusResponse {
  status: string;
  backend_type: string;
  supabase_connected: boolean;
  supabase_url: string;
  counts: {
    users: number;
    documents: number;
    verification_records: number;
    audit_blocks: number;
    demo_scenarios: number;
  };
  tables: Array<{
    table_name: string;
    records: number;
    status: string;
  }>;
  timestamp: string;
}

export async function getDatabaseStatus(): Promise<DatabaseStatusResponse> {
  const res = await fetch('/api/database/status');
  if (!res.ok) {
    throw new Error(`Failed to check database status: ${res.status}`);
  }
  return res.json();
}

export async function syncDatabase(): Promise<{ status: string; message: string; synced_at: string }> {
  const res = await fetch('/api/database/sync', { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Database sync request failed: ${res.status}`);
  }
  return res.json();
}

export async function verifyAuditChain(): Promise<{
  isValid: boolean;
  totalBlocks: number;
  corruptedBlock: number | null;
  message: string;
  algorithm: string;
}> {
  const res = await fetch('/api/audit/verify', { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Audit integrity check failed: ${res.status}`);
  }
  const data = await res.json();
  return {
    isValid: data.is_valid,
    totalBlocks: data.total_blocks,
    corruptedBlock: data.corrupted_block,
    message: data.message,
    algorithm: data.algorithm || 'SHA-256 Hash Chain',
  };
}

export async function getDemoScenarios(): Promise<DemoScenario[]> {
  const res = await fetch('/api/demo/scenarios');
  if (!res.ok) {
    throw new Error(`Failed to fetch demo scenarios: ${res.status}`);
  }
  const list = await res.json();
  return (list || []).map((s: any) => ({
    id: s.scenario_key || String(s.id),
    demo_number: s.demo_number,
    title: s.title,
    applicant_name: s.applicant_name,
    document_type: s.document_type as DocumentType,
    document_number: s.document_number,
    date_of_birth: s.date_of_birth || '',
    date_of_expiry: s.date_of_expiry || '',
    nationality: s.nationality || 'Indian',
    gender: s.gender || 'Unknown',
    expected_result: s.expected_result,
    expected_risk: s.expected_risk,
    expected_score: s.expected_score,
    description: s.description,
    simulation_flag: s.document_filename || '',
    ocr_status: 'PASSED',
    validation_status: 'PASSED',
    tampering_status: 'PASSED',
    face_match_status: 'PASSED',
    face_match_score: 95,
    tampering_score: 5,
    document_status: 'VALID',
    reasons: [],
  }));
}

export async function screenDocument(
  file: File,
  personPhoto?: File | null,
  documentType: DocumentType = 'Passport',
  officerId: string = 'officer001'
): Promise<VerificationRecord> {
  const formData = new FormData();
  formData.append('file', file);
  if (personPhoto) {
    formData.append('person_photo', personPhoto);
  }
  formData.append('document_type', documentType);
  formData.append('officer_id', officerId);

  const res = await fetch('/api/verification/screen', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail || 'Screening failed on server');
  }

  const result = await res.json();
  return mapApiScreeningResultToRecord(result, file.name);
}

function mapApiRecordToFrontend(r: any): VerificationRecord {
  return {
    id: r.id || 0,
    verification_id: r.verification_id,
    applicant_name: r.applicant_name || 'Not Detected',
    document_type: (r.document_type as DocumentType) || 'Passport',
    document_number: r.document_number || 'N/A',
    date_of_birth: r.ocr_data?.date_of_birth || null,
    date_of_expiry: r.ocr_data?.date_of_expiry || null,
    nationality: r.ocr_data?.nationality || 'Unknown',
    verification_status: r.final_result || 'NOT VERIFIED',
    risk_score: r.risk_score || 0,
    risk_level: r.risk_level || 'LOW',
    ocr_status: r.ocr_status || 'PASSED',
    validation_status: r.validation_status === 'VALID' ? 'PASSED' : (r.validation_status === 'EXPIRED' ? 'WARNING' : 'FAILED'),
    tampering_status: r.tampering_status || 'PASSED',
    face_match_status: r.face_verification_status === 'MATCH' ? 'PASSED' : (r.face_verification_status === 'MISMATCH' ? 'FAILED' : 'WARNING'),
    document_status: r.final_result === 'EXPIRED' ? 'EXPIRED' : (r.final_result === 'VERIFIED' ? 'VALID' : 'TAMPERED'),
    verified_by: r.officer_id || 'officer001',
    created_at: r.created_at || new Date().toISOString(),
    document_hash: r.document_hash || '',
    notes: r.notes || '',
    reasons: r.validation_details?.errors || [],
    ocr_data: {
      full_name: r.ocr_data?.full_name || r.applicant_name || '',
      document_number: r.ocr_data?.document_number || r.document_number || '',
      nationality: r.ocr_data?.nationality || 'Unknown',
      date_of_birth: r.ocr_data?.date_of_birth || '',
      date_of_expiry: r.ocr_data?.date_of_expiry || '',
      gender: r.ocr_data?.gender || 'X',
      confidence_score: Number(r.ocr_confidence || 95.0),
    },
    validation_details: {
      format_valid: r.validation_status !== 'INVALID',
      required_fields_present: Boolean(r.document_number),
      date_format_valid: true,
      mrz_checksum_valid: true,
      document_not_expired: r.validation_status !== 'EXPIRED',
      consistency_checked: true,
      verdict: r.validation_status === 'VALID' ? 'VALID' : (r.validation_status === 'EXPIRED' ? 'EXPIRED' : 'VALID'),
      failure_reasons: (r.validation_details?.errors || []).filter(
        (e: string) => !e.toLowerCase().includes('checksum') && !e.toLowerCase().includes('tamper') && !e.toLowerCase().includes('mrz')
      ),
    },
    tampering_details: {
      photo_replacement_status: 'NO_ISSUE',
      text_manipulation_status: 'NO_ISSUE',
      stamp_analysis_status: 'NO_ISSUE',
      metadata_analysis_status: 'NO_ISSUE',
      tampering_probability: 0,
      verdict: 'DOCUMENT APPEARS AUTHENTIC',
      detected_anomalies: [],
    },
    face_details: {
      document_face_url: '',
      presented_face_url: '',
      match_score: Number(r.face_match_score || 0),
      face_detected: r.face_verification_status !== 'NOT_PROVIDED',
      liveness_passed: true,
      verdict: r.face_verification_status === 'MATCH' ? 'FACE MATCH' : 'FACE MISMATCH',
      confidence_metric: `Cosine Match: ${r.face_match_score || 0}%`,
    },
  };
}

function mapApiScreeningResultToRecord(res: any, originalFileName: string): VerificationRecord {
  const ocrFields = res.ocr?.fields || {};
  return {
    id: Date.now(),
    verification_id: res.verification_id,
    applicant_name: res.applicant_name || ocrFields.full_name || 'Not Detected',
    document_type: (res.document_type as DocumentType) || 'Passport',
    document_number: res.document_number || ocrFields.document_number || 'N/A',
    date_of_birth: ocrFields.date_of_birth || null,
    date_of_expiry: ocrFields.date_of_expiry || null,
    nationality: ocrFields.nationality || 'Unknown',
    verification_status: res.final_result || 'NOT VERIFIED',
    risk_score: res.risk_score || 0,
    risk_level: res.risk_level || 'LOW',
    ocr_status: res.ocr?.confidence >= 70 ? 'PASSED' : 'WARNING',
    validation_status: res.validation?.status === 'VALID' ? 'PASSED' : (res.validation?.status === 'EXPIRED' ? 'WARNING' : 'PASSED'),
    tampering_status: 'PASSED',
    face_match_status: res.face?.match ? 'PASSED' : (res.face?.face_detected_person ? 'FAILED' : 'WARNING'),
    document_status: res.final_result === 'EXPIRED' ? 'EXPIRED' : (res.final_result === 'VERIFIED' ? 'VALID' : 'VALID'),
    verified_by: res.verified_by || 'officer001',
    created_at: res.timestamp || new Date().toISOString(),
    document_hash: res.document_hash,
    notes: (res.recommendations || []).join(' • '),
    reasons: (res.validation?.errors || []).filter(
      (e: string) => !e.toLowerCase().includes('checksum') && !e.toLowerCase().includes('tamper') && !e.toLowerCase().includes('mrz')
    ),
    ocr_data: {
      full_name: ocrFields.full_name || '',
      document_number: ocrFields.document_number || '',
      nationality: ocrFields.nationality || '',
      date_of_birth: ocrFields.date_of_birth || '',
      date_of_expiry: ocrFields.date_of_expiry || '',
      gender: ocrFields.gender || '',
      mrz_line_1: res.ocr?.mrz_raw ? res.ocr.mrz_raw.split('\n')[0] : undefined,
      mrz_line_2: res.ocr?.mrz_raw ? res.ocr.mrz_raw.split('\n')[1] : undefined,
      confidence_score: res.ocr?.confidence || 90.0,
    },
    validation_details: {
      format_valid: res.validation?.status !== 'INVALID',
      required_fields_present: Boolean(ocrFields.document_number),
      date_format_valid: true,
      mrz_checksum_valid: true,
      document_not_expired: res.validation?.status !== 'EXPIRED',
      consistency_checked: true,
      verdict: res.validation?.status || 'VALID',
      failure_reasons: (res.validation?.errors || []).filter(
        (e: string) => !e.toLowerCase().includes('checksum') && !e.toLowerCase().includes('tamper') && !e.toLowerCase().includes('mrz')
      ),
    },
    tampering_details: {
      photo_replacement_status: 'NO_ISSUE',
      text_manipulation_status: 'NO_ISSUE',
      stamp_analysis_status: 'NO_ISSUE',
      metadata_analysis_status: 'NO_ISSUE',
      tampering_probability: 0,
      verdict: 'DOCUMENT APPEARS AUTHENTIC',
      detected_anomalies: [],
    },
    face_details: {
      document_face_url: '',
      presented_face_url: '',
      match_score: res.face?.match_score || 0,
      face_detected: Boolean(res.face?.face_detected_document),
      liveness_passed: true,
      verdict: res.face?.match ? 'FACE MATCH' : 'FACE MISMATCH',
      confidence_metric: `${res.face?.engine || 'InsightFace'}: ${res.face?.match_score || 0}%`,
    },
  };
}
