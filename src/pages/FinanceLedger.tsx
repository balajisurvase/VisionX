import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Filter,
  FileText,
  CreditCard,
} from 'lucide-react';
import { fetchFinance, createFinanceRecord } from '../services/societyService';
import { DbFinance, AuthSessionUser } from '../types/society';

interface FinanceProps {
  currentUser: AuthSessionUser | null;
}

export const FinanceLedger: React.FC<FinanceProps> = ({ currentUser }) => {
  const [financeRecords, setFinanceRecords] = useState<DbFinance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form State
  const [financeForm, setFinanceForm] = useState({
    finance_type: 'EXPENSE',
    category: 'Security & Guarding Services',
    description: '',
    amount: 1000,
    payment_mode: 'UPI / Online',
    payment_status: 'PAID',
    transaction_date: new Date().toISOString().split('T')[0],
    party_name: '',
    reference_number: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchFinance();
      setFinanceRecords(data || []);
    } catch (err) {
      console.error('Failed to load finance ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!financeForm.category || !financeForm.amount) return;

    const newRecord: Omit<DbFinance, 'finance_id'> = {
      maintenance_id: null,
      resident_id: null,
      finance_type: financeForm.finance_type,
      category: financeForm.category,
      description: financeForm.description,
      amount: Number(financeForm.amount),
      payment_mode: financeForm.payment_mode,
      payment_status: financeForm.payment_status,
      transaction_date: financeForm.transaction_date,
      party_name: financeForm.party_name || 'General Vendor',
      reference_number: financeForm.reference_number || `REF-${Date.now().toString().slice(-6)}`,
      created_at: new Date().toISOString(),
    };

    try {
      await createFinanceRecord(newRecord);
      setShowAddModal(false);
      loadData();
    } catch (err) {
      console.error('Error creating finance entry:', err);
    }
  };

  const totalIncome = financeRecords
    .filter((f) => f.finance_type === 'INCOME')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalExpense = financeRecords
    .filter((f) => f.finance_type === 'EXPENSE')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const netBalance = totalIncome - totalExpense;

  const filteredRecords = financeRecords.filter((f) => {
    const matchesType = typeFilter === 'ALL' || f.finance_type === typeFilter;
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      !search ||
      f.category.toLowerCase().includes(search) ||
      (f.description || '').toLowerCase().includes(search) ||
      (f.party_name || '').toLowerCase().includes(search) ||
      (f.reference_number || '').toLowerCase().includes(search);

    return matchesType && matchesSearch;
  });

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
              Supabase Table: `finance`
            </span>
          </div>
          <h1 className="text-[30px] font-bold text-[#4A148C] uppercase tracking-tight leading-tight">
            Society Financial Accounts & Treasury Ledger
          </h1>
          <p className="text-[15px] text-[#616161] font-normal">
            Income collections, operational expenditures, vendor disbursements, and balance tracking
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
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-[#4A148C] hover:bg-[#310C61] text-white text-[14px] font-bold uppercase rounded-[4px] shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Transaction</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Treasury Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#A5D6A7] rounded-[6px] p-5 shadow-xs bg-[#E8F5E9]/30 flex items-center justify-between">
          <div>
            <span className="text-[12px] font-bold text-[#2E7D32] uppercase tracking-wider block">
              Total Inward Income
            </span>
            <span className="text-[28px] font-bold text-[#2E7D32]">₹{totalIncome.toLocaleString()}</span>
          </div>
          <TrendingUp className="w-8 h-8 text-[#2E7D32]" />
        </div>

        <div className="bg-white border border-[#EF9A9A] rounded-[6px] p-5 shadow-xs bg-[#FFEBEE]/30 flex items-center justify-between">
          <div>
            <span className="text-[12px] font-bold text-[#C62828] uppercase tracking-wider block">
              Total Outward Expense
            </span>
            <span className="text-[28px] font-bold text-[#C62828]">₹{totalExpense.toLocaleString()}</span>
          </div>
          <TrendingDown className="w-8 h-8 text-[#C62828]" />
        </div>

        <div className="bg-white border border-[#CE93D8] rounded-[6px] p-5 shadow-xs bg-[#F3E5F5]/30 flex items-center justify-between">
          <div>
            <span className="text-[12px] font-bold text-[#4A148C] uppercase tracking-wider block">
              Treasury Net Reserve
            </span>
            <span className="text-[28px] font-bold text-[#4A148C]">₹{netBalance.toLocaleString()}</span>
          </div>
          <DollarSign className="w-8 h-8 text-[#4A148C]" />
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
            placeholder="Search transactions by category, vendor party, reference #..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8FC] border border-[#CE93D8] focus:border-[#4A148C] focus:bg-white rounded-[4px] text-[15px] text-[#212121] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] px-3 py-2 text-[#212121]">
          <Filter className="w-3.5 h-3.5 text-[#6A1B9A]" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-transparent border-none text-[14px] text-[#212121] font-bold outline-none cursor-pointer"
          >
            <option value="ALL">All Flows</option>
            <option value="INCOME">Income Only</option>
            <option value="EXPENSE">Expense Only</option>
          </select>
        </div>
      </div>

      {/* 4. Transactions Table */}
      <div className="bg-white border border-[#E1BEE7] rounded-[6px] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[15px]">
            <thead className="bg-[#4A148C] text-white uppercase font-bold text-[13px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Flow Type</th>
                <th className="py-3.5 px-4">Category / Description</th>
                <th className="py-3.5 px-4">Party / Vendor</th>
                <th className="py-3.5 px-4">Mode / Ref #</th>
                <th className="py-3.5 px-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1BEE7]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#757575]">
                    No transactions found in `finance` table.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((f) => (
                  <tr key={f.finance_id} className="hover:bg-[#FAF8FC]">
                    <td className="py-3.5 px-4 font-bold text-[#310C61]">
                      {f.transaction_date}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-[3px] text-[11px] font-bold uppercase ${
                          f.finance_type === 'INCOME'
                            ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]'
                            : 'bg-[#FFEBEE] text-[#C62828] border border-[#EF9A9A]'
                        }`}
                      >
                        {f.finance_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#212121]">{f.category}</span>
                      {f.description && (
                        <span className="block text-[12px] text-[#616161]">
                          {f.description}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[14px] text-[#212121]">
                      {f.party_name || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-[13px]">
                      <span className="font-bold text-[#6A1B9A]">{f.payment_mode || 'Online'}</span>
                      {f.reference_number && (
                        <span className="block font-mono text-[11px] text-[#757575]">
                          {f.reference_number}
                        </span>
                      )}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-bold text-[16px] ${
                        f.finance_type === 'INCOME' ? 'text-[#2E7D32]' : 'text-[#C62828]'
                      }`}
                    >
                      {f.finance_type === 'INCOME' ? '+' : '-'} ₹{Number(f.amount).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: RECORD TRANSACTION */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E1BEE7] rounded-[6px] max-w-md w-full p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#E1BEE7] pb-3">
              <h3 className="text-[20px] font-bold text-[#4A148C] uppercase">
                Record Financial Entry
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#757575] hover:text-[#212121] font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4 text-[14px]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Flow Type</label>
                  <select
                    value={financeForm.finance_type}
                    onChange={(e) => setFinanceForm({ ...financeForm, finance_type: e.target.value })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                  >
                    <option value="INCOME">INCOME (+)</option>
                    <option value="EXPENSE">EXPENSE (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={financeForm.amount}
                    onChange={(e) => setFinanceForm({ ...financeForm, amount: Number(e.target.value) })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#212121] mb-1">Category</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lift Maintenance, DG Fuel, Security Agency"
                  value={financeForm.category}
                  onChange={(e) => setFinanceForm({ ...financeForm, category: e.target.value })}
                  className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Party / Payee Name</label>
                  <input
                    type="text"
                    placeholder="Vendor / Resident"
                    value={financeForm.party_name}
                    onChange={(e) => setFinanceForm({ ...financeForm, party_name: e.target.value })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Transaction Date</label>
                  <input
                    type="date"
                    required
                    value={financeForm.transaction_date}
                    onChange={(e) => setFinanceForm({ ...financeForm, transaction_date: e.target.value })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Payment Mode</label>
                  <select
                    value={financeForm.payment_mode}
                    onChange={(e) => setFinanceForm({ ...financeForm, payment_mode: e.target.value })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                  >
                    <option value="UPI / Online">UPI / Online</option>
                    <option value="NEFT / RTGS">NEFT / RTGS</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Ref / UTR Number</label>
                  <input
                    type="text"
                    placeholder="UPI-12345 / CHQ-990"
                    value={financeForm.reference_number}
                    onChange={(e) => setFinanceForm({ ...financeForm, reference_number: e.target.value })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E1BEE7]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#CE93D8] text-[#4A148C] font-bold rounded-[4px] uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4A148C] hover:bg-[#310C61] text-white font-bold rounded-[4px] uppercase cursor-pointer"
                >
                  Post Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
