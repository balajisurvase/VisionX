import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Phone,
  Car,
  User,
  LogOut,
  UserCheck,
} from 'lucide-react';
import {
  fetchVisitors,
  registerVisitorEntry,
  recordVisitorExit,
  updateVisitorApproval,
  fetchResidents,
  subscribeToVisitors,
} from '../services/societyService';
import { DbVisitor, DbResident, AuthSessionUser } from '../types/society';

interface VisitorsProps {
  currentUser: AuthSessionUser | null;
}

export const VisitorsGate: React.FC<VisitorsProps> = ({ currentUser }) => {
  const [visitors, setVisitors] = useState<DbVisitor[]>([]);
  const [residents, setResidents] = useState<DbResident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showLogModal, setShowLogModal] = useState<boolean>(false);

  // Form State
  const [visitorForm, setVisitorForm] = useState({
    visitor_name: '',
    visitor_mobile: '',
    visitor_type: 'Delivery',
    vehicle_number: '',
    resident_id: '',
    purpose: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [vData, rData] = await Promise.all([
        fetchVisitors(currentUser?.role === 'RESIDENT' ? currentUser.id : undefined),
        fetchResidents(),
      ]);
      setVisitors(vData || []);
      setResidents(rData || []);
    } catch (err) {
      console.error('Failed to load visitors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Supabase Realtime channel for visitor approvals & logs
    const channel = subscribeToVisitors((payload) => {
      console.log('Realtime visitor event received:', payload);
      loadData();
    });

    return () => {
      channel.unsubscribe();
    };
  }, [currentUser]);

  const handleOpenLogModal = () => {
    setVisitorForm({
      visitor_name: '',
      visitor_mobile: '',
      visitor_type: 'Guest',
      vehicle_number: '',
      resident_id: residents.length > 0 ? residents[0].resident_id : 'RES-A101',
      purpose: 'Personal Visit',
    });
    setShowLogModal(true);
  };

  const handleRegisterEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorForm.visitor_name || !visitorForm.visitor_mobile) return;

    const newVisitor: Omit<DbVisitor, 'visitor_id'> = {
      visitor_name: visitorForm.visitor_name,
      visitor_mobile: visitorForm.visitor_mobile,
      visitor_type: visitorForm.visitor_type,
      vehicle_number: visitorForm.vehicle_number || null,
      profile_photo: null,
      resident_id: visitorForm.resident_id,
      purpose: visitorForm.purpose || 'Entry Pass',
      entry_time: new Date().toISOString(),
      exit_time: null,
      status: 'Inside Campus',
      security_user_name: currentUser?.name || 'Gate Officer 1',
      security_user_mobile: '9876543211',
      security_user_email: currentUser?.email || 'security@visi0nx.gov.in',
      security_user_shift: currentUser?.shift || 'General Shift',
      approval_status: 'Approved',
      approval_time: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    try {
      await registerVisitorEntry(newVisitor);
      setShowLogModal(false);
      loadData();
    } catch (err) {
      console.error('Error logging visitor entry:', err);
    }
  };

  const handleMarkExit = async (visitorId: number) => {
    if (window.confirm('Record departure timestamp for this visitor?')) {
      await recordVisitorExit(visitorId);
      loadData();
    }
  };

  const handleApproval = async (visitorId: number, status: 'Approved' | 'Rejected') => {
    await updateVisitorApproval(visitorId, status);
    loadData();
  };

  const filteredVisitors = visitors.filter((v) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'Inside' && (v.status === 'Inside Campus' || !v.exit_time)) ||
      (statusFilter === 'Departed' && v.status === 'Departed');

    const search = searchTerm.toLowerCase();
    const matchesSearch =
      !search ||
      v.visitor_name.toLowerCase().includes(search) ||
      v.visitor_mobile.includes(search) ||
      (v.vehicle_number || '').toLowerCase().includes(search) ||
      v.resident_id.toLowerCase().includes(search);

    return matchesStatus && matchesSearch;
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
              Supabase Tables: `visitors` & `security`
            </span>
          </div>
          <h1 className="text-[30px] font-bold text-[#4A148C] uppercase tracking-tight leading-tight">
            Security Gate & Visitor Management
          </h1>
          <p className="text-[15px] text-[#616161] font-normal">
            Real-time digital inward gate passes, resident digital pre-approvals, and departure audit logs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="px-4 py-2.5 rounded-[4px] text-[14px] font-bold bg-white hover:bg-[#FAF8FC] text-[#4A148C] border border-[#CE93D8] shadow-xs cursor-pointer flex items-center gap-2 uppercase"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Gate Logs</span>
          </button>

          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SECURITY') && (
            <button
              onClick={handleOpenLogModal}
              className="px-5 py-2.5 bg-[#4A148C] hover:bg-[#310C61] text-white text-[14px] font-bold uppercase rounded-[4px] shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Visitor Inward</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Filters */}
      <div className="bg-white border border-[#E1BEE7] rounded-[6px] p-4 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#6A1B9A] absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search visitor name, phone, vehicle number, host flat..."
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
            <option value="Inside">Inside Campus</option>
            <option value="Departed">Departed</option>
          </select>
        </div>
      </div>

      {/* 3. Visitors Table */}
      <div className="bg-white border border-[#E1BEE7] rounded-[6px] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[15px]">
            <thead className="bg-[#4A148C] text-white uppercase font-bold text-[13px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Visitor Details</th>
                <th className="py-3.5 px-4">Type / Vehicle</th>
                <th className="py-3.5 px-4">Host Resident</th>
                <th className="py-3.5 px-4">Entry Timestamp</th>
                <th className="py-3.5 px-4">Exit Status</th>
                <th className="py-3.5 px-4">Resident Approval</th>
                <th className="py-3.5 px-4 text-right">Gate Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1BEE7]">
              {filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#757575]">
                    No visitor entries recorded in `visitors` table.
                  </td>
                </tr>
              ) : (
                filteredVisitors.map((v) => (
                  <tr key={v.visitor_id} className="hover:bg-[#FAF8FC]">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#212121] block">{v.visitor_name}</span>
                      <span className="text-[12px] text-[#616161] flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-[#6A1B9A]" /> {v.visitor_mobile}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-[#F3E5F5] text-[#4A148C] font-bold text-[11px] rounded-[3px] uppercase">
                        {v.visitor_type || 'Guest'}
                      </span>
                      {v.vehicle_number && (
                        <span className="block font-mono text-[12px] text-[#310C61] mt-1">
                          🚗 {v.vehicle_number}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-[#4A148C] text-[13px] block">
                        {v.resident_id}
                      </span>
                      <span className="text-[12px] text-[#757575]">{v.purpose}</span>
                    </td>
                    <td className="py-3.5 px-4 text-[13px] text-[#212121]">
                      <span className="font-bold">
                        {v.entry_time
                          ? new Date(v.entry_time).toLocaleDateString([], {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Recorded'}
                      </span>
                      <span className="block text-[11px] text-[#757575]">
                        Guard: {v.security_user_name || 'Gate 1'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {v.exit_time || v.status === 'Departed' ? (
                        <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#616161] bg-[#EEEEEE] px-2.5 py-0.5 rounded-[3px] uppercase">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Departed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-0.5 rounded-[3px] border border-[#A5D6A7] uppercase">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Inside Campus</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-[3px] text-[11px] font-bold uppercase ${
                          v.approval_status === 'Approved'
                            ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]'
                            : 'bg-[#FFEBEE] text-[#C62828] border border-[#EF9A9A]'
                        }`}
                      >
                        {v.approval_status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!v.exit_time && v.status !== 'Departed' ? (
                        <button
                          onClick={() => handleMarkExit(v.visitor_id)}
                          className="px-3 py-1 bg-[#4A148C] hover:bg-[#310C61] text-white text-[12px] font-bold rounded-[3px] uppercase cursor-pointer transition-colors"
                        >
                          Record Exit
                        </button>
                      ) : (
                        <span className="text-[12px] text-[#757575]">Logged Out</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: LOG VISITOR INWARD */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E1BEE7] rounded-[6px] max-w-md w-full p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#E1BEE7] pb-3">
              <h3 className="text-[20px] font-bold text-[#4A148C] uppercase">
                Gate Entry Registration
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-[#757575] hover:text-[#212121] font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterEntry} className="space-y-4 text-[14px]">
              <div>
                <label className="block font-bold text-[#212121] mb-1">Visitor Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={visitorForm.visitor_name}
                  onChange={(e) => setVisitorForm({ ...visitorForm, visitor_name: e.target.value })}
                  className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Mobile Number</label>
                  <input
                    type="text"
                    required
                    placeholder="98XXXXXXXX"
                    value={visitorForm.visitor_mobile}
                    onChange={(e) => setVisitorForm({ ...visitorForm, visitor_mobile: e.target.value })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Visitor Type</label>
                  <select
                    value={visitorForm.visitor_type}
                    onChange={(e) => setVisitorForm({ ...visitorForm, visitor_type: e.target.value })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                  >
                    <option value="Guest">Guest / Friend</option>
                    <option value="Delivery">Delivery (Amazon/Swiggy)</option>
                    <option value="Service / Repair">Service / Repair</option>
                    <option value="Cab / Driver">Cab / Driver</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Vehicle Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. MH-12-AB-1234"
                    value={visitorForm.vehicle_number}
                    onChange={(e) => setVisitorForm({ ...visitorForm, vehicle_number: e.target.value })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Host Resident</label>
                  <select
                    value={visitorForm.resident_id}
                    onChange={(e) => setVisitorForm({ ...visitorForm, resident_id: e.target.value })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                  >
                    {residents.map((r) => (
                      <option key={r.resident_id} value={r.resident_id}>
                        {r.name} (Flat {r.flat})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#212121] mb-1">Purpose of Visit</label>
                <input
                  type="text"
                  placeholder="e.g. Package delivery, Meeting"
                  value={visitorForm.purpose}
                  onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })}
                  className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E1BEE7]">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 border border-[#CE93D8] text-[#4A148C] font-bold rounded-[4px] uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4A148C] hover:bg-[#310C61] text-white font-bold rounded-[4px] uppercase cursor-pointer"
                >
                  Issue Gate Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
