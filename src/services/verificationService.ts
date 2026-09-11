import {
  VerificationRecord,
  VerificationStats,
  RegisteredDocument,
  DemoScenario,
  AuditLogRecord,
} from '../types/verification';
import {
  getDashboardStats,
  getDocuments,
  getHistory,
  getHistoryDetail,
  getAuditLogs,
  verifyAuditChain as verifyAuditChainApi,
  getDemoScenarios as fetchDemoScenariosApi,
} from './api';

/**
 * Empty default arrays. NO hardcoded sample data.
 * Real data is queried from Supabase backend or seeded using supabase_demo_data.sql.
 */
export const INITIAL_VERIFICATION_RECORDS: VerificationRecord[] = [];
export const INITIAL_REGISTERED_DOCUMENTS: RegisteredDocument[] = [];
export const DEMO_SCENARIOS: DemoScenario[] = [];

export async function fetchVerificationRecords(): Promise<VerificationRecord[]> {
  try {
    return await getHistory();
  } catch (err) {
    console.warn('Failed to fetch verification records:', err);
    return [];
  }
}

export async function getDashboardMetrics(): Promise<VerificationStats> {
  try {
    const data = await getDashboardStats();
    return data.stats;
  } catch (err) {
    console.warn('Failed to fetch dashboard metrics:', err);
    return {
      totalChecked: 0,
      verified: 0,
      suspicious: 0,
      failed: 0,
      avgRiskScore: 0,
    };
  }
}

export async function fetchRegisteredDocuments(
  type?: string,
  status?: string,
  search?: string
): Promise<RegisteredDocument[]> {
  try {
    return await getDocuments(type, status, search);
  } catch (err) {
    console.warn('Failed to fetch registered documents:', err);
    return [];
  }
}

export async function fetchAuditLogs(): Promise<AuditLogRecord[]> {
  try {
    return await getAuditLogs();
  } catch (err) {
    console.warn('Failed to fetch audit logs:', err);
    return [];
  }
}

export async function verifyAuditChain(): Promise<{
  isValid: boolean;
  totalBlocks: number;
  corruptedBlock: number | null;
  message: string;
  algorithm: string;
}> {
  return await verifyAuditChainApi();
}

export async function fetchDemoScenarios(): Promise<DemoScenario[]> {
  try {
    return await fetchDemoScenariosApi();
  } catch (err) {
    console.warn('Failed to fetch demo scenarios:', err);
    return [];
  }
}

export async function getVerificationRecordById(
  verificationId: string
): Promise<VerificationRecord | null> {
  try {
    return await getHistoryDetail(verificationId);
  } catch (err) {
    console.warn(`Failed to fetch record ${verificationId}:`, err);
    return null;
  }
}

export async function saveScreeningResult(record: VerificationRecord): Promise<void> {
  // Verification is automatically saved on backend in /api/verification/screen
}
