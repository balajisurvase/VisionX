import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  Bell,
  MessageSquare,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Building2,
  FileText,
} from 'lucide-react';
import {
  fetchResidents,
  fetchBookings,
  fetchMaintenance,
  fetchComplaints,
  fetchVisitors,
  fetchFinance,
  fetchNotices,
  fetchAmenities,
} from '../services/societyService';
import {
  DbResident,
  DbBooking,
  DbMaintenance,
  DbComplaint,
  DbVisitor,
  DbFinance,
  DbNotice,
  AuthSessionUser,
} from '../types/society';

interface DashboardProps {
  currentUser: AuthSessionUser | null;
  onNavigate: (path: string) => void;
}

export const SocietyDashboard: React.FC<DashboardProps> = ({ currentUser, onNavigate }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [residents, setResidents] = useState<DbResident[]>([]);
  const [bookings, setBookings] = useState<DbBooking[]>([]);
  const [maintenance, setMaintenance] = useState<DbMaintenance[]>([]);
  const [complaints, setComplaints] = useState<DbComplaint[]>([]);
  const [visitors, setVisitors] = useState<DbVisitor[]>([]);
  const [finance, setFinance] = useState<DbFinance[]>([]);
  const [notices, setNotices] = useState<DbNotice[]>([]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [r, b, m, c, v, f, n] = await Promise.all([
        fetchResidents(),
        fetchBookings(currentUser?.role === 'RESIDENT' ? currentUser.id : undefined),
        fetchMaintenance(currentUser?.role === 'RESIDENT' ? currentUser.id : undefined),
        fetchComplaints(currentUser?.role === 'RESIDENT' ? currentUser.id : undefined),
        fetchVisitors(currentUser?.role === 'RESIDENT' ? currentUser.id : undefined),
        fetchFinance(),
        fetchNotices(),
      ]);
      setResidents(r);
      setBookings(b);
      setMaintenance(m);
      setComplaints(c);
      setVisitors(v);
      setFinance(f);
      setNotices(n);
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [currentUser]);

  // Derived Metrics
  const activeResidentsCount = residents.filter((r) => (r.status || 'Active').toLowerCase() === 'active').length;
  const pendingComplaintsCount = complaints.filter((c) => c.status !== 'Resolved').length;
  const activeVisitorsInside = visitors.filter((v) => v.status === 'Inside Campus' || !v.exit_time).length;
  const pendingMaintenanceTotal = maintenance
    .filter((m) => m.status !== 'Paid')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const totalIncome = finance
    .filter((f) => f.finance_type === 'INCOME')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalExpense = finance
    .filter((f) => f.finance_type === 'EXPENSE')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const netBalance = totalIncome - totalExpense;

  return (
    <div
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 text-[#212121]"
    >
      {/* 1. Page Header */}
      <div className="bg-white border border-[#E1BEE7] rounded-[6px] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[12px] font-bold text-[#6A1B9A] uppercase tracking-wider px-2.5 py-0.5 bg-[#F3E5F5] rounded-[4px] border border-[#E1BEE7]">
              {currentUser?.role || 'ADMIN'} PORTAL
            </span>
            <span className="text-[13px] text-[#757575]">
              • Society ID: <strong>{currentUser?.society_id || 'SOC-PUNE-01'}</strong>
            </span>
          </div>
          <h1 className="text-[30px] font-bold text-[#4A148C] uppercase tracking-tight leading-tight">
            Society Command & Operations Dashboard
          </h1>
          <p className="text-[15px] text-[#616161] font-normal">
            Real-time synchronization across 12 integrated Supabase database tables
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="px-4 py-2.5 rounded-[4px] text-[14px] font-bold bg-white hover:bg-[#FAF8FC] text-[#4A148C] border border-[#CE93D8] shadow-xs cursor-pointer flex items-center gap-2 uppercase transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Supabase</span>
          </button>

          {currentUser?.role === 'ADMIN' ? (
            <button
              onClick={() => onNavigate('/maintenance')}
              className="px-5 py-2.5 bg-[#4A148C] hover:bg-[#310C61] text-white text-[14px] font-bold uppercase rounded-[4px] shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Generate Dues</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('/complaints')}
              className="px-5 py-2.5 bg-[#4A148C] hover:bg-[#310C61] text-white text-[14px] font-bold uppercase rounded-[4px] shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Grievance</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Residents */}
        <div
          onClick={() => onNavigate('/residents')}
          className="bg-white border border-[#E1BEE7] rounded-[6px] p-5 shadow-xs hover:border-[#BA68C8] cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-[#616161] uppercase tracking-wider">
              Total Residents
            </span>
            <div className="w-9 h-9 rounded-[4px] bg-[#F3E5F5] text-[#4A148C] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[32px] font-bold text-[#4A148C] mt-2 leading-none">
            {activeResidentsCount}
          </div>
          <p className="text-[12px] text-[#2E7D32] font-bold mt-2">
            ✓ Verified in `resident` table
          </p>
        </div>

        {/* Card 2: Active Visitors */}
        <div
          onClick={() => onNavigate('/visitors')}
          className="bg-white border border-[#E1BEE7] rounded-[6px] p-5 shadow-xs hover:border-[#BA68C8] cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-[#616161] uppercase tracking-wider">
              Visitors In Campus
            </span>
            <div className="w-9 h-9 rounded-[4px] bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[32px] font-bold text-[#2E7D32] mt-2 leading-none">
            {activeVisitorsInside}
          </div>
          <p className="text-[12px] text-[#616161] mt-2">
            Gate logs in `visitors` table
          </p>
        </div>

        {/* Card 3: Pending Complaints */}
        <div
          onClick={() => onNavigate('/complaints')}
          className="bg-white border border-[#E1BEE7] rounded-[6px] p-5 shadow-xs hover:border-[#BA68C8] cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-[#616161] uppercase tracking-wider">
              Open Grievances
            </span>
            <div className="w-9 h-9 rounded-[4px] bg-[#FFF8E1] text-[#F57F17] flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[32px] font-bold text-[#F57F17] mt-2 leading-none">
            {pendingComplaintsCount}
          </div>
          <p className="text-[12px] text-[#616161] mt-2">
            Tracked in `complaint` table
          </p>
        </div>

        {/* Card 4: Maintenance Outstanding */}
        <div
          onClick={() => onNavigate('/maintenance')}
          className="bg-white border border-[#E1BEE7] rounded-[6px] p-5 shadow-xs hover:border-[#BA68C8] cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-[#616161] uppercase tracking-wider">
              Maintenance Dues
            </span>
            <div className="w-9 h-9 rounded-[4px] bg-[#FFEBEE] text-[#C62828] flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[28px] font-bold text-[#C62828] mt-2 leading-none">
            ₹{pendingMaintenanceTotal.toLocaleString()}
          </div>
          <p className="text-[12px] text-[#616161] mt-2">
            Pending in `maintenance` table
          </p>
        </div>
      </div>

      {/* 3. Mid Section: Quick Activity Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Gate Visitors */}
        <div className="lg:col-span-7 bg-white border border-[#E1BEE7] rounded-[6px] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E1BEE7] pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#4A148C]" />
              <h3 className="text-[18px] font-bold text-[#310C61] uppercase">
                Recent Gate Visitor Logs (`visitors`)
              </h3>
            </div>
            <button
              onClick={() => onNavigate('/visitors')}
              className="text-[13px] font-bold text-[#6A1B9A] hover:underline uppercase cursor-pointer"
            >
              View All Logs →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#FAF8FC] text-[#4A148C] font-bold uppercase text-[12px] border-b border-[#E1BEE7]">
                <tr>
                  <th className="py-2.5 px-3">Visitor Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Resident Ref</th>
                  <th className="py-2.5 px-3">Entry Time</th>
                  <th className="py-2.5 px-3 text-right">Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1BEE7]">
                {visitors.slice(0, 5).map((v) => (
                  <tr key={v.visitor_id} className="hover:bg-[#FAF8FC]">
                    <td className="py-2.5 px-3 font-bold text-[#212121]">
                      {v.visitor_name}
                      {v.vehicle_number && (
                        <span className="block text-[11px] text-[#757575] font-mono">
                          {v.vehicle_number}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-normal">{v.visitor_type || 'Guest'}</td>
                    <td className="py-2.5 px-3 font-mono text-[#4A148C] text-[13px]">
                      {v.resident_id}
                    </td>
                    <td className="py-2.5 px-3 text-[#616161] text-[12px]">
                      {v.entry_time ? new Date(v.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-[3px] text-[11px] font-bold uppercase ${
                          v.approval_status === 'Approved'
                            ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]'
                            : 'bg-[#FFF8E1] text-[#F57F17] border border-[#FFE082]'
                        }`}
                      >
                        {v.approval_status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Published Notices (`notices`) */}
        <div className="lg:col-span-5 bg-white border border-[#E1BEE7] rounded-[6px] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E1BEE7] pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#4A148C]" />
              <h3 className="text-[18px] font-bold text-[#310C61] uppercase">
                Active Bulletins (`notices`)
              </h3>
            </div>
            <button
              onClick={() => onNavigate('/notices')}
              className="text-[13px] font-bold text-[#6A1B9A] hover:underline uppercase cursor-pointer"
            >
              Notice Board →
            </button>
          </div>

          <div className="space-y-3">
            {notices.length === 0 ? (
              <p className="text-[14px] text-[#757575] py-4 text-center">No active notices published.</p>
            ) : (
              notices.slice(0, 3).map((n) => (
                <div key={n.notice_id} className="p-3 bg-[#FAF8FC] border border-[#E1BEE7] rounded-[4px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[14px] text-[#4A148C]">{n.title}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-[2px] uppercase ${
                        n.priority === 'High' ? 'bg-[#FFEBEE] text-[#C62828]' : 'bg-[#E8F5E9] text-[#2E7D32]'
                      }`}
                    >
                      {n.priority || 'Normal'}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#616161] line-clamp-2">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Financial Health & Facility Bookings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Finance Snapshot */}
        <div className="bg-white border border-[#E1BEE7] rounded-[6px] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E1BEE7] pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#4A148C]" />
              <h3 className="text-[18px] font-bold text-[#310C61] uppercase">
                Financial Overview (`finance`)
              </h3>
            </div>
            <button
              onClick={() => onNavigate('/finance')}
              className="text-[13px] font-bold text-[#6A1B9A] hover:underline uppercase cursor-pointer"
            >
              Full Ledger →
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-[#E8F5E9] rounded-[4px] border border-[#A5D6A7]">
              <span className="text-[11px] font-bold text-[#2E7D32] uppercase block">Income</span>
              <span className="text-[18px] font-bold text-[#2E7D32]">₹{totalIncome.toLocaleString()}</span>
            </div>
            <div className="p-3 bg-[#FFEBEE] rounded-[4px] border border-[#EF9A9A]">
              <span className="text-[11px] font-bold text-[#C62828] uppercase block">Expense</span>
              <span className="text-[18px] font-bold text-[#C62828]">₹{totalExpense.toLocaleString()}</span>
            </div>
            <div className="p-3 bg-[#F3E5F5] rounded-[4px] border border-[#CE93D8]">
              <span className="text-[11px] font-bold text-[#4A148C] uppercase block">Net Balance</span>
              <span className="text-[18px] font-bold text-[#4A148C]">₹{netBalance.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Facility Bookings */}
        <div className="bg-white border border-[#E1BEE7] rounded-[6px] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E1BEE7] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#4A148C]" />
              <h3 className="text-[18px] font-bold text-[#310C61] uppercase">
                Amenity Bookings (`booking`)
              </h3>
            </div>
            <button
              onClick={() => onNavigate('/bookings')}
              className="text-[13px] font-bold text-[#6A1B9A] hover:underline uppercase cursor-pointer"
            >
              Reserve Slot →
            </button>
          </div>

          <div className="space-y-2">
            {bookings.length === 0 ? (
              <p className="text-[14px] text-[#757575] py-4 text-center">No amenity reservations booked.</p>
            ) : (
              bookings.slice(0, 3).map((b) => (
                <div key={b.id} className="p-2.5 bg-[#FAF8FC] border border-[#E1BEE7] rounded-[4px] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[14px] text-[#212121]">{b.amenity_name}</span>
                    <span className="block text-[12px] text-[#616161]">
                      {b.event_name || 'Event'} • {b.booking_date} ({b.start_time} - {b.end_time})
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] rounded-[3px] text-[11px] font-bold uppercase">
                    {b.status || 'Confirmed'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
