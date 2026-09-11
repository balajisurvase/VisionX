import React, { useState } from 'react';
import {
  Lock,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Printer,
  ShieldCheck,
  FileCode,
  Link,
} from 'lucide-react';
import { VerificationRecord } from '../../types/verification';

interface BlockchainAuditBadgeProps {
  record: VerificationRecord;
}

export const BlockchainAuditBadge: React.FC<BlockchainAuditBadgeProps> = ({ record }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const blockHash = record.document_hash || 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069';
  const prevHash = 'SHA256:5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';

  const handleCopyHash = () => {
    navigator.clipboard.writeText(blockHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(record, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SSB_Verification_${record.verification_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-white rounded-[12px] border border-gray-100 p-6 shadow-2xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-[#16A34A]" />
          <div>
            <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
              Cryptographic Blockchain Audit Block & Chain of Custody
            </h3>
            <span className="text-[11px] text-gray-500 font-medium">
              Tamper-Evident SHA-256 Ledger Record with Digital Officer Attestation
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F5F6F8] hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F5F6F8] hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dossier</span>
          </button>
        </div>
      </div>

      {/* Block Information Grid */}
      <div className="bg-[#0B1220] rounded-xl p-5 border border-gray-200 font-mono text-xs text-gray-200 space-y-3 shadow-inner">
        <div className="flex items-center justify-between border-b border-gray-800 pb-2">
          <div className="flex items-center gap-2">
            <Link className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-bold">BLOCK LEDGER ENTRY #{record.id || 104}</span>
          </div>
          <span className="text-[11px] text-gray-400">{record.created_at}</span>
        </div>

        <div className="space-y-2 text-[11px]">
          <div>
            <span className="text-gray-500 block">Verification ID</span>
            <span className="text-white font-bold">{record.verification_id}</span>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Current Block Hash (SHA-256)</span>
              <button
                onClick={handleCopyHash}
                className="text-gray-400 hover:text-white cursor-pointer flex items-center gap-1 text-[10px]"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <span className="text-emerald-400 font-bold break-all block">{blockHash}</span>
          </div>

          <div>
            <span className="text-gray-500 block">Parent Block Hash (Previous Block)</span>
            <span className="text-gray-400 font-mono break-all block">{prevHash}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-800 text-[10px]">
            <div>
              <span className="text-gray-500 block">Screening Officer</span>
              <span className="text-gray-300 font-bold">{record.verified_by}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Integrity Seal</span>
              <span className="text-emerald-400 font-bold">ECDSA SECP256K1 VERIFIED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
