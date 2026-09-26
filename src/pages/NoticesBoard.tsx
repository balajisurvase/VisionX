import React, { useState, useEffect } from 'react';
import {
  Bell,
  PlusCircle,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import {
  fetchNotices,
  createNotice,
  deleteNotice,
  subscribeToNotices,
} from '../services/societyService';
import { DbNotice, AuthSessionUser } from '../types/society';

interface NoticesProps {
  currentUser: AuthSessionUser | null;
}

export const NoticesBoard: React.FC<NoticesProps> = ({ currentUser }) => {
  const [notices, setNotices] = useState<DbNotice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Form State
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    message: '',
    category: 'General',
    priority: 'Normal',
    status: 'Published',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchNotices();
      setNotices(data || []);
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Supabase Realtime channel for notices
    const channel = subscribeToNotices((payload) => {
      console.log('Realtime notice event received:', payload);
      loadData();
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeForm.title || !noticeForm.message) return;

    const newNotice: Omit<DbNotice, 'notice_id'> = {
      title: noticeForm.title,
      message: noticeForm.message,
      category: noticeForm.category,
      priority: noticeForm.priority,
      created_by: currentUser?.name || 'Admin Officer',
      created_at: new Date().toISOString(),
      status: noticeForm.status,
    };

    try {
      await createNotice(newNotice);
      setShowCreateModal(false);
      setNoticeForm({ title: '', message: '', category: 'General', priority: 'Normal', status: 'Published' });
      loadData();
    } catch (err) {
      console.error('Error publishing notice:', err);
    }
  };

  const handleDeleteNotice = async (id: number) => {
    if (window.confirm('Delete this notice bulletin permanently?')) {
      await deleteNotice(id);
      loadData();
    }
  };

  const filteredNotices = notices.filter((n) => {
    const matchesPriority = priorityFilter === 'ALL' || n.priority === priorityFilter;
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      !search ||
      n.title.toLowerCase().includes(search) ||
      n.message.toLowerCase().includes(search) ||
      (n.category || '').toLowerCase().includes(search);

    return matchesPriority && matchesSearch;
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
              Supabase Table: `notices`
            </span>
          </div>
          <h1 className="text-[30px] font-bold text-[#4A148C] uppercase tracking-tight leading-tight">
            Official Society Notice Board
          </h1>
          <p className="text-[15px] text-[#616161] font-normal">
            Digital broadcasts, circulars, maintenance advisories, and emergency bulletins
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="px-4 py-2.5 rounded-[4px] text-[14px] font-bold bg-white hover:bg-[#FAF8FC] text-[#4A148C] border border-[#CE93D8] shadow-xs cursor-pointer flex items-center gap-2 uppercase"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Board</span>
          </button>

          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-[#4A148C] hover:bg-[#310C61] text-white text-[14px] font-bold uppercase rounded-[4px] shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish Notice</span>
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
            placeholder="Search notices by title, contents, category..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8FC] border border-[#CE93D8] focus:border-[#4A148C] focus:bg-white rounded-[4px] text-[15px] text-[#212121] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] px-3 py-2 text-[#212121]">
          <Filter className="w-3.5 h-3.5 text-[#6A1B9A]" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-transparent border-none text-[14px] text-[#212121] font-bold outline-none cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="High">Urgent / High Priority</option>
            <option value="Normal">Normal</option>
          </select>
        </div>
      </div>

      {/* 3. Notices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredNotices.length === 0 ? (
          <div className="col-span-full bg-white border border-[#E1BEE7] rounded-[6px] p-12 text-center text-[#757575]">
            No bulletins published in `notices` table.
          </div>
        ) : (
          filteredNotices.map((n) => (
            <div
              key={n.notice_id}
              className="bg-white border border-[#E1BEE7] rounded-[6px] p-6 shadow-xs flex flex-col justify-between hover:border-[#BA68C8] transition-colors space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-[3px] uppercase tracking-wider ${
                      n.priority === 'High'
                        ? 'bg-[#FFEBEE] text-[#C62828] border border-[#EF9A9A]'
                        : 'bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]'
                    }`}
                  >
                    {n.priority === 'High' ? '⚠️ URGENT ADVISORY' : 'GENERAL NOTICE'}
                  </span>
                  <span className="text-[12px] font-bold text-[#6A1B9A] px-2 py-0.5 bg-[#F3E5F5] rounded-[3px]">
                    {n.category || 'General'}
                  </span>
                </div>

                <h3 className="text-[20px] font-bold text-[#4A148C]">{n.title}</h3>
                <p className="text-[15px] text-[#212121] leading-relaxed whitespace-pre-line">{n.message}</p>
              </div>

              <div className="pt-3 border-t border-[#E1BEE7] flex items-center justify-between text-[12px] text-[#757575]">
                <span>
                  Posted by <strong>{n.created_by || 'Admin'}</strong> on{' '}
                  {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Today'}
                </span>
                {currentUser?.role === 'ADMIN' && (
                  <button
                    onClick={() => handleDeleteNotice(n.notice_id)}
                    className="p-1.5 text-[#C62828] hover:bg-[#FFEBEE] rounded-[3px] cursor-pointer"
                    title="Delete Notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: PUBLISH NOTICE */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E1BEE7] rounded-[6px] max-w-lg w-full p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#E1BEE7] pb-3">
              <h3 className="text-[20px] font-bold text-[#4A148C] uppercase">
                Publish Digital Notice
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#757575] hover:text-[#212121] font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-4 text-[14px]">
              <div>
                <label className="block font-bold text-[#212121] mb-1">Notice Heading</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Water Tank Cleaning Schedule"
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Category</label>
                  <select
                    value={noticeForm.category}
                    onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                  >
                    <option value="General">General Announcement</option>
                    <option value="Maintenance">Maintenance & Utilities</option>
                    <option value="Celebration">Festival & Celebrations</option>
                    <option value="Security">Security & Rules</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Priority Alert</label>
                  <select
                    value={noticeForm.priority}
                    onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">Urgent Advisory</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#212121] mb-1">Detailed Circular Body</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Write the complete notice message here..."
                  value={noticeForm.message}
                  onChange={(e) => setNoticeForm({ ...noticeForm, message: e.target.value })}
                  className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E1BEE7]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[#CE93D8] text-[#4A148C] font-bold rounded-[4px] uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4A148C] hover:bg-[#310C61] text-white font-bold rounded-[4px] uppercase cursor-pointer"
                >
                  Publish Bulletin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
