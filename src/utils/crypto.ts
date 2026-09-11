import { AuditLogRecord } from '../types/verification';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Generate SHA-256 hash string from input text using native Web Crypto API
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Computes deterministic document content hash
 */
export async function computeDocumentHash(
  documentType: string,
  documentNumber: string,
  name: string,
  timestamp: string
): Promise<string> {
  const rawPayload = `DOC:${documentType}:${documentNumber}:${name}:${timestamp}`;
  return sha256(rawPayload);
}

/**
 * Computes audit record block hash
 */
export async function computeBlockHash(
  previousHash: string,
  verificationId: string,
  documentHash: string,
  officerId: string,
  createdAt: string
): Promise<string> {
  const blockPayload = `${previousHash}|${verificationId}|${documentHash}|${officerId}|${createdAt}`;
  return sha256(blockPayload);
}

export interface HashChainVerificationResult {
  isValid: boolean;
  totalBlocks: number;
  tamperedIndex?: number;
  tamperedBlockId?: string;
  message: string;
}

/**
 * Validates the entire blockchain audit log chain
 */
export async function verifyAuditChain(
  logs: AuditLogRecord[]
): Promise<HashChainVerificationResult> {
  if (!logs || logs.length === 0) {
    return {
      isValid: true,
      totalBlocks: 0,
      message: 'No audit records in ledger.',
    };
  }

  // Sort chronologically ascending to follow chain
  const sorted = [...logs].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  for (let i = 0; i < sorted.length; i++) {
    const block = sorted[i];
    const expectedPrevious = i === 0 ? GENESIS_HASH : sorted[i - 1].current_hash;

    if (block.previous_hash !== expectedPrevious) {
      return {
        isValid: false,
        totalBlocks: sorted.length,
        tamperedIndex: i,
        tamperedBlockId: block.verification_id,
        message: `Broken link at index ${i} (${block.verification_id}). Previous hash mismatch.`,
      };
    }

    const recomputedCurrent = await computeBlockHash(
      block.previous_hash,
      block.verification_id,
      block.document_hash,
      block.officer_id,
      block.created_at
    );

    if (block.current_hash !== recomputedCurrent) {
      return {
        isValid: false,
        totalBlocks: sorted.length,
        tamperedIndex: i,
        tamperedBlockId: block.verification_id,
        message: `Tampered payload detected at record ${block.verification_id}. Block hash invalid.`,
      };
    }
  }

  return {
    isValid: true,
    totalBlocks: sorted.length,
    message: '✓ AUDIT RECORD INTACT — No modification detected. Cryptographic hash chain verified.',
  };
}
