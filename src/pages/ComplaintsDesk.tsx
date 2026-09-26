import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  MessageSquare,
  Upload,
  Image as ImageIcon,
  Paperclip,
} from 'lucide-react';
import {
  fetchComplaints,
  createComplaint,
  updateComplaintStatus,
  fetchMedia,
} from '../services/societyService';
import { DbComplaint, DbMedia, AuthSessionUser } from '../types/society';

interface ComplaintsProps {
  currentUser: AuthSessionUser | null;
}

export const ComplaintsDesk: React.FC<ComplaintsProps> = ({ currentUser }) => {
  const [complaints, setComplaints] = useState<DbComplaint[]>([]);
  const [mediaList, setMediaList] = useState<DbMedia[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [selectedComplaint, setSelectedComplaint] = useState<DbComplaint | null>(null);
  const [adminCommentInput, setAdminCommentInput] = useState<string>('');

  // Log Complaint Form
  const [formData, setFormData] = useState({
    category: 'Plumbing & Civil',
    description: '',
    file: null as File | null,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [cData, mData] = await Promise.all([
        fetchComplaints(currentUser?.role === 'RESIDENT' ? currentUser.id : undefined),
        fetchMedia(),
      ]);
      setComplaints(cData || []);
      setMediaList(mData || []);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description) return;

    const newComplaintId = `CMP-${Date.now().toString().slice(-6)}`;
    const newCmp: DbComplaint = {
      id: newComplaintId,
      complaint_id: newComplaintId,
      resident_id: currentUser?.id || 'RES-A101',
      tower: currentUser?.tower || 'A',
      flat_no: typeof currentUser?.flat === 'number' ? currentUser.flat : 101,
      description: formData.description,
      status: 'Pending',
      category: formData.category,
      complaint_date: new Date().toISOString().split('T')[0],
      admin_comment: null,
      society_id: currentUser?.society_id || 'SOC-PUNE-01',
    };

    try {
      await createComplaint(newCmp, formData.file || undefined);
      setShowLogModal(false);
      setFormData({ category: 'Plumbing & Civil', description: '', file: null });
      loadData();
    } catch (err) {
      console.error('Error logging complaint:', err);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    await updateComplaintStatus(id, newStatus, adminCommentInput || undefined);
    setAdminCommentInput('');
    setSelectedComplaint(null);
    loadData();
  };

  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      !search ||
      (c.description || '').toLowerCase().includes(search) ||
      (c.category || '').toLowerCase().includes(search) ||
      (c.complaint_id || '').toLowerCase().includes(search);
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
              Supabase Tables: `complaint` & `media`
            </span>
          </div>
          <h1 className="text-[30px] font-bold text-[#4A148C] uppercase tracking-tight leading-tight">
            Grievance Redressal & Complaints Desk
          </h1>
          <p className="text-[15px] text-[#616161] font-normal">
            Resident grievance tracking, maintenance technician dispatch, and resolution ledger
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="px-4 py-2.5 rounded-[4px] text-[14px] font-bold bg-white hover:bg-[#FAF8FC] text-[#4A148C] border border-[#CE93D8] shadow-xs cursor-pointer flex items-center gap-2 uppercase"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowLogModal(true)}
            className="px-5 py-2.5 bg-[#4A148C] hover:bg-[#310C61] text-white text-[14px] font-bold uppercase rounded-[4px] shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Grievance</span>
          </button>
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
            placeholder="Search grievances by category, description, ticket ID..."
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
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* 3. Complaints Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredComplaints.length === 0 ? (
          <div className="col-span-full bg-white border border-[#E1BEE7] rounded-[6px] p-12 text-center text-[#757575]">
            No grievances recorded in `complaint` table.
          </div>
        ) : (
          filteredComplaints.map((c) => {
            const complaintMedia = mediaList.filter((m) => m.complaint_id === (c.complaint_id || c.id));

            return (
              <div
                key={c.id}
                className="bg-white border border-[#E1BEE7] rounded-[6px] p-5 shadow-xs flex flex-col justify-between hover:border-[#BA68C8] transition-colors space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[12px] font-bold text-[#4A148C]">
                      {c.complaint_id || c.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-[3px] text-[11px] font-bold uppercase ${
                        c.status === 'Resolved'
                          ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]'
                          : c.status === 'In Progress'
                          ? 'bg-[#FFF8E1] text-[#F57F17] border border-[#FFE082]'
                          : 'bg-[#FFEBEE] text-[#C62828] border border-[#EF9A9A]'
                      }`}
                    >
                      {c.status || 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[13px] text-[#757575]">
                    <span className="font-bold text-[#310C61]">{c.category || 'General'}</span>
                    <span>Flat {c.flat_no || '-'} (Tower {c.tower || '-'})</span>
                  </div>

                  <p className="text-[14px] text-[#212121] leading-relaxed pt-1">{c.description}</p>

                  {/* Complaint Attachments */}
                  {complaintMedia.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-bold text-[#6A1B9A] uppercase block mb-1">
                        Attachments (`media` table)
                      </span>
                      <div className="flex gap-2 overflow-x-auto">
                        {complaintMedia.map((med) => (
                          <a
                            key={med.media_id}
                            href={med.file_url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="w-16 h-16 rounded-[4px] border border-[#CE93D8] overflow-hidden shrink-0 bg-[#FAF8FC] flex items-center justify-center"
                          >
                            <img
                              src={med.file_url || ''}
                              alt="Attachment"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <Paperclip className="w-5 h-5 text-[#6A1B9A]" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Remarks */}
                  {c.admin_comment && (
                    <div className="p-2.5 bg-[#FAF8FC] border-l-3 border-l-[#4A148C] rounded-r-[4px] text-[13px] text-[#4A148C] mt-2">
                      <strong>Admin Remark:</strong> {c.admin_comment}
                    </div>
                  )}
                </div>

                {currentUser?.role === 'ADMIN' && (
                  <div className="pt-3 border-t border-[#E1BEE7] flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedComplaint(c)}
                      className="px-3 py-1 bg-[#F3E5F5] hover:bg-[#E1BEE7] text-[#4A148C] text-[12px] font-bold rounded-[3px] uppercase cursor-pointer"
                    >
                      Update Status
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: LOG GRIEVANCE */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E1BEE7] rounded-[6px] max-w-md w-full p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#E1BEE7] pb-3">
              <h3 className="text-[20px] font-bold text-[#4A148C] uppercase">
                Submit Helpdesk Grievance
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-[#757575] hover:text-[#212121] font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} className="space-y-4 text-[14px]">
              <div>
                <label className="block font-bold text-[#212121] mb-1">Grievance Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                >
                  <option value="Plumbing & Civil">Plumbing & Civil</option>
                  <option value="Electrical & Power">Electrical & Power</option>
                  <option value="Housekeeping & Sanitation">Housekeeping & Sanitation</option>
                  <option value="Security & Gate Management">Security & Gate Management</option>
                  <option value="Elevators & Common Areas">Elevators & Common Areas</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#212121] mb-1">Issue Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe the problem in detail with location..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#212121] mb-1">Attach Photo / Receipt (`media` table)</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files ? e.target.files[0] : null })}
                  className="w-full p-1.5 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] text-[13px] outline-none"
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
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPDATE COMPLAINT STATUS (ADMIN) */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E1BEE7] rounded-[6px] max-w-md w-full p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#E1BEE7] pb-3">
              <h3 className="text-[20px] font-bold text-[#4A148C] uppercase">
                Update Grievance #{selectedComplaint.complaint_id}
              </h3>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-[#757575] hover:text-[#212121] font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-[14px]">
              <div>
                <label className="block font-bold text-[#212121] mb-1">Admin Remark / Resolution Note</label>
                <textarea
                  rows={3}
                  value={adminCommentInput}
                  onChange={(e) => setAdminCommentInput(e.target.value)}
                  placeholder="e.g. Technician deployed, work completed..."
                  className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => handleUpdateStatus(selectedComplaint.id, 'In Progress')}
                  className="w-full py-2 bg-[#FFF8E1] text-[#F57F17] border border-[#FFE082] font-bold rounded-[4px] uppercase cursor-pointer hover:bg-[#FFECB3]"
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedComplaint.id, 'Resolved')}
                  className="w-full py-2 bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] font-bold rounded-[4px] uppercase cursor-pointer hover:bg-[#C8E6C9]"
                >
                  Mark as Resolved & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
