import React from 'react';
import { FileCheck, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { VisibleVsMrzField } from '../../types/verification';

interface VisibleVsMrzTableProps {
  fields?: VisibleVsMrzField[];
}

export const VisibleVsMrzTable: React.FC<VisibleVsMrzTableProps> = ({ fields = [] }) => {
  if (!fields || fields.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Visible Data vs MRZ Consistency Check
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Cross-checking Visual Inspection Zone (VIZ) vs Machine Readable Zone (MRZ)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <th className="py-2.5 px-3">Field Name</th>
              <th className="py-2.5 px-3">Visible Value (VIZ)</th>
              <th className="py-2.5 px-3">MRZ Extracted Value</th>
              <th className="py-2.5 px-3 text-right">Consistency Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fields.map((field, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-3 font-semibold text-slate-800">
                  {field.field_name}
                </td>
                <td className="py-3 px-3 font-mono text-slate-700">
                  {field.visible_value || 'NOT DETECTED'}
                </td>
                <td className="py-3 px-3 font-mono text-slate-700">
                  {field.mrz_value || 'NOT DETECTED'}
                </td>
                <td className="py-3 px-3 text-right">
                  {field.status === 'MATCH' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>MATCH</span>
                    </span>
                  ) : field.status === 'MISMATCH' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                      <XCircle className="w-3.5 h-3.5 text-red-600" />
                      <span>MISMATCH</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                      <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>NOT AVAILABLE</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
