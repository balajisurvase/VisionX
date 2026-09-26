import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Download,
} from 'lucide-react';
import {
  fetchMaintenance,
  generateMaintenanceBill,
  markMaintenancePaid,
  fetchResidents,
} from '../services/societyService';
import { DbMaintenance, DbResident, AuthSessionUser } from '../types/society';

interface MaintenanceProps {
  currentUser: AuthSessionUser | null;
}

export const MaintenanceBilling: React.FC<MaintenanceProps> = ({ currentUser }) => {
  const [maintenance, setMaintenance] = useState<DbMaintenance[]>([]);
  const [residents, setResidents] = useState<DbResident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showGenerateModal, setShowGenerateModal] = useState<boolean>(false);

  // Generate Bill Form State
  const [billForm, setBillForm] = useState({
    resident_id: '',
    resident_name: '',
    flat_no: 101,
    tower: 'A',
    month: 'November 2026',
    amount: 4500,
    due_date: '2026-11-10',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [mData, rData] = await Promise.all([
        fetchMaintenance(currentUser?.role === 'RESIDENT' ? currentUser.id : undefined),
        fetchResidents(),
      ]);
      setMaintenance(mData || []);
      setResidents(rData || []);
    } catch (err) {
      console.error('Failed to load maintenance records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleOpenGenerate = () => {
    if (residents.length > 0) {
      const r = residents[0];
      setBillForm({
        resident_id: r.resident_id,
        resident_name: r.name || 'Resident',
        flat_no: typeof r.flat === 'number' ? r.flat : parseInt(r.flat || '101', 10) || 101,
        tower: r.tower || 'A',
        month: 'November 2026',
        amount: 4500,
        due_date: '2026-11-10',
      });
    }
    setShowGenerateModal(true);
  };

  const handleResidentSelect = (resId: string) => {
    const r = residents.find((x) => x.resident_id === resId);
    if (r) {
      setBillForm({
        ...billForm,
        resident_id: r.resident_id,
        resident_name: r.name || 'Resident',
        flat_no: typeof r.flat === 'number' ? r.flat : parseInt(r.flat || '101', 10) || 101,
        tower: r.tower || 'A',
      });
    }
  };

  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const newBill: DbMaintenance = {
      id: `m-${Date.now()}-uuid`,
      maintenance_id: `M-${Math.floor(100000 + Math.random() * 900000)}`,
      resident_id: billForm.resident_id,
      resident_name: billForm.resident_name,
      flat_no: billForm.flat_no,
      tower: billForm.tower,
      month: billForm.month,
      amount: billForm.amount,
      status: 'Pending',
      due_date: billForm.due_date,
      payment_date: null,
      admin_id: currentUser?.id || 'ADM-001',
      generated_by: currentUser?.name || 'Administrator',
      society_id: currentUser?.society_id || 'SOC-PUNE-01',
      created_at: new Date().toISOString().split('T')[0],
    };

    try {
      await generateMaintenanceBill(newBill);
      setShowGenerateModal(false);
      loadData();
    } catch (err) {
      console.error('Error generating bill:', err);
    }
  };

  const handlePay = async (id: string) => {
    if (window.confirm('Mark this maintenance bill as PAID with today’s timestamp?')) {
      await markMaintenancePaid(id, new Date().toISOString().split('T')[0]);
      loadData();
    }
  };

  const filteredMaintenance = maintenance.filter((m) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'Paid' && m.status === 'Paid') ||
      (statusFilter === 'Pending' && m.status !== 'Paid');

    const search = searchTerm.toLowerCase();
    const matchesSearch =
      !search ||
      (m.resident_name || '').toLowerCase().includes(search) ||
      (m.maintenance_id || '').toLowerCase().includes(search) ||
      (m.resident_id || '').toLowerCase().includes(search) ||
      String(m.flat_no || '').includes(search);

    return matchesStatus && matchesSearch;
  });

  const totalCollected = maintenance
    .filter((m) => m.status === 'Paid')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalPending = maintenance
    .filter((m) => m.status !== 'Paid')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 text-[#212121]"
    >
      {/* 1. Header */}
      <div className="bg-white border border-[#E1BEE7] rounded-[6px] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[12px] font-bold text-[#6A1B9A] uppercase tracking-wider px-2.5 py-0.5 bg-[#F3E5F5] rounded-[4px] border border-[#E1BEE7]">
              Supabase Table: `maintenance`
            </span>
          </div>
          <h1 className="text-[30px] font-bold text-[#4A148C] uppercase tracking-tight leading-tight">
            Maintenance Dues & Billing Ledger
          </h1>
          <p className="text-[15px] text-[#616161] font-normal">
            Monthly service dues generation, collection records, and payment tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="px-4 py-2.5 rounded-[4px] text-[14px] font-bold bg-white hover:bg-[#FAF8FC] text-[#4A148C] border border-[#CE93D8] shadow-xs cursor-pointer flex items-center gap-2 uppercase"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Ledger</span>
          </button>

          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={handleOpenGenerate}
              className="px-5 py-2.5 bg-[#4A148C] hover:bg-[#310C61] text-white text-[14px] font-bold uppercase rounded-[4px] shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Generate New Bill</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E1BEE7] rounded-[6px] p-5 shadow-xs">
          <span className="text-[13px] font-bold text-[#616161] uppercase tracking-wider block">
            Total Bills Issued
          </span>
          <span className="text-[28px] font-bold text-[#4A148C]">{maintenance.length}</span>
        </div>

        <div className="bg-white border border-[#A5D6A7] rounded-[6px] p-5 shadow-xs bg-[#E8F5E9]/30">
          <span className="text-[13px] font-bold text-[#2E7D32] uppercase tracking-wider block">
            Collected Dues
          </span>
          <span className="text-[28px] font-bold text-[#2E7D32]">₹{totalCollected.toLocaleString()}</span>
        </div>

        <div className="bg-white border border-[#EF9A9A] rounded-[6px] p-5 shadow-xs bg-[#FFEBEE]/30">
          <span className="text-[13px] font-bold text-[#C62828] uppercase tracking-wider block">
            Outstanding Dues
          </span>
          <span className="text-[28px] font-bold text-[#C62828]">₹{totalPending.toLocaleString()}</span>
        </div>
      </div>

      {/* 3. Filters */}
      <div className="bg-white border border-[#E1BEE7] rounded-[6px] p-4 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#6A1B9A] absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by resident name, bill ID, or flat number..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8FC] border border-[#CE93D8] focus:border-[#4A148C] focus:bg-white rounded-[4px] text-[15px] text-[#212121] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] px-3 py-2 text-[#212121]">
          <Filter className="w-3.5 h-3.5 text-[#6A1B9A]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none text-[14px] text-[#212121] font-bold outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending / Overdue</option>
          </select>
        </div>
      </div>

      {/* 4. Table */}
      <div className="bg-white border border-[#E1BEE7] rounded-[6px] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[15px]">
            <thead className="bg-[#4A148C] text-white uppercase font-bold text-[13px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Bill ID</th>
                <th className="py-3.5 px-4">Resident / Flat</th>
                <th className="py-3.5 px-4">Billing Month</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1BEE7]">
              {filteredMaintenance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#757575]">
                    No maintenance records found in `maintenance` table.
                  </td>
                </tr>
              ) : (
                filteredMaintenance.map((m) => (
                  <tr key={m.id} className="hover:bg-[#FAF8FC]">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#4A148C]">
                      {m.maintenance_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#212121]">{m.resident_name}</span>
                      <span className="block text-[12px] text-[#757575]">
                        Flat {m.flat_no || '-'} (Tower {m.tower || '-'})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#310C61]">
                      {m.month}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[16px] text-[#212121]">
                      ₹{(m.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-[14px] text-[#616161]">
                      {m.due_date}
                    </td>
                    <td className="py-3.5 px-4">
                      {m.status === 'Paid' ? (
                        <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-0.5 rounded-[3px] border border-[#A5D6A7] uppercase">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Paid ({m.payment_date || 'Online'})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#C62828] bg-[#FFEBEE] px-2.5 py-0.5 rounded-[3px] border border-[#EF9A9A] uppercase">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Unpaid</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {m.status !== 'Paid' ? (
                        <button
                          onClick={() => handlePay(m.id)}
                          className="px-3.5 py-1 bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-[12px] font-bold rounded-[3px] uppercase cursor-pointer transition-colors"
                        >
                          Record Payment
                        </button>
                      ) : (
                        <span className="text-[12px] text-[#757575] font-bold">Settled</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: GENERATE BILL */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E1BEE7] rounded-[6px] max-w-md w-full p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#E1BEE7] pb-3">
              <h3 className="text-[20px] font-bold text-[#4A148C] uppercase">
                Generate Maintenance Bill
              </h3>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-[#757575] hover:text-[#212121] font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBill} className="space-y-4 text-[14px]">
              <div>
                <label className="block font-bold text-[#212121] mb-1">Select Target Resident</label>
                <select
                  value={billForm.resident_id}
                  onChange={(e) => handleResidentSelect(e.target.value)}
                  className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                >
                  {residents.map((r) => (
                    <option key={r.resident_id} value={r.resident_id}>
                      {r.name} - Flat {r.flat} (Tower {r.tower})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#212121] mb-1">Billing Month</label>
                <input
                  type="text"
                  required
                  value={billForm.month}
                  onChange={(e) => setBillForm({ ...billForm, month: e.target.value })}
                  className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Dues Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={billForm.amount}
                    onChange={(e) => setBillForm({ ...billForm, amount: Number(e.target.value) })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={billForm.due_date}
                    onChange={(e) => setBillForm({ ...billForm, due_date: e.target.value })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E1BEE7]">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 border border-[#CE93D8] text-[#4A148C] font-bold rounded-[4px] uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4A148C] hover:bg-[#310C61] text-white font-bold rounded-[4px] uppercase cursor-pointer"
                >
                  Generate & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
