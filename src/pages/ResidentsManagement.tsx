import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Building2,
  Phone,
  Mail,
  Home,
} from 'lucide-react';
import { fetchResidents, createResident, updateResident, deleteResident } from '../services/societyService';
import { DbResident, AuthSessionUser } from '../types/society';

interface ResidentsProps {
  currentUser: AuthSessionUser | null;
}

export const ResidentsManagement: React.FC<ResidentsProps> = ({ currentUser }) => {
  const [residents, setResidents] = useState<DbResident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [towerFilter, setTowerFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingResident, setEditingResident] = useState<DbResident | null>(null);
  const [formData, setFormData] = useState<Partial<DbResident>>({
    resident_id: '',
    name: '',
    tower: 'A',
    floor: 1,
    flat: '',
    email: '',
    phone: '',
    role: 'Owner',
    status: 'Active',
    society_id: currentUser?.society_id || 'SOC-PUNE-01',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchResidents();
      setResidents(data || []);
    } catch (err) {
      console.error('Failed to load residents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingResident(null);
    setFormData({
      resident_id: `RES-${Date.now().toString().slice(-6)}`,
      name: '',
      tower: 'A',
      floor: 1,
      flat: '',
      email: '',
      phone: '',
      role: 'Owner',
      status: 'Active',
      society_id: currentUser?.society_id || 'SOC-PUNE-01',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (res: DbResident) => {
    setEditingResident(res);
    setFormData({ ...res });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.resident_id || !formData.name) {
      alert('Please enter resident ID and name.');
      return;
    }

    try {
      if (editingResident) {
        await updateResident(editingResident.resident_id, formData);
      } else {
        await createResident(formData as DbResident);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete resident ${id}?`)) {
      await deleteResident(id);
      loadData();
    }
  };

  const filteredResidents = residents.filter((r) => {
    const matchesSearch =
      !searchTerm ||
      (r.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.flat || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.resident_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.phone || '').includes(searchTerm);

    const matchesTower = towerFilter === 'ALL' || r.tower === towerFilter;
    const matchesRole = roleFilter === 'ALL' || r.role === roleFilter;

    return matchesSearch && matchesTower && matchesRole;
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
              Supabase Table: `resident`
            </span>
          </div>
          <h1 className="text-[30px] font-bold text-[#4A148C] uppercase tracking-tight leading-tight">
            Resident & Ownership Directory
          </h1>
          <p className="text-[15px] text-[#616161] font-normal">
            Official records of registered apartment owners, tenants, and unit allocations
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

          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={handleOpenAdd}
              className="px-5 py-2.5 bg-[#4A148C] hover:bg-[#310C61] text-white text-[14px] font-bold uppercase rounded-[4px] shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register Resident</span>
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
            placeholder="Search by resident name, flat number, phone, or resident ID..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8FC] border border-[#CE93D8] focus:border-[#4A148C] focus:bg-white rounded-[4px] text-[15px] text-[#212121] outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto text-[14px]">
          <div className="flex items-center gap-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] px-3 py-2 text-[#212121]">
            <Filter className="w-3.5 h-3.5 text-[#6A1B9A]" />
            <select
              value={towerFilter}
              onChange={(e) => setTowerFilter(e.target.value)}
              className="bg-transparent border-none text-[14px] text-[#212121] font-bold outline-none cursor-pointer"
            >
              <option value="ALL">All Towers</option>
              <option value="A">Tower A</option>
              <option value="B">Tower B</option>
              <option value="C">Tower C</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] px-3 py-2 text-[#212121]">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent border-none text-[14px] text-[#212121] font-bold outline-none cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="Owner">Owner</option>
              <option value="Tenant">Tenant</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Table */}
      <div className="bg-white border border-[#E1BEE7] rounded-[6px] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[15px]">
            <thead className="bg-[#4A148C] text-white uppercase font-bold text-[13px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Resident ID</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Flat / Tower</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                {currentUser?.role === 'ADMIN' && <th className="py-3.5 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1BEE7]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#757575]">
                    Loading resident directory from Supabase...
                  </td>
                </tr>
              ) : filteredResidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#757575]">
                    No resident records found in `resident` table.
                  </td>
                </tr>
              ) : (
                filteredResidents.map((res) => (
                  <tr key={res.resident_id} className="hover:bg-[#FAF8FC]">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#4A148C]">
                      {res.resident_id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#212121]">
                      {res.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#310C61]">Flat {res.flat || 'N/A'}</span>
                      <span className="block text-[12px] text-[#616161]">
                        Tower {res.tower || '-'} • Floor {res.floor || '-'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[13px]">
                      <div className="flex items-center gap-1.5 text-[#212121]">
                        <Phone className="w-3.5 h-3.5 text-[#6A1B9A]" />
                        <span>{res.phone || 'N/A'}</span>
                      </div>
                      {res.email && (
                        <div className="flex items-center gap-1.5 text-[#616161] mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-[#6A1B9A]" />
                          <span>{res.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-[3px] text-[12px] font-bold uppercase ${
                          res.role === 'Owner'
                            ? 'bg-[#F3E5F5] text-[#4A148C] border border-[#CE93D8]'
                            : 'bg-[#E3F2FD] text-[#1565C0] border border-[#90CAF9]'
                        }`}
                      >
                        {res.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-0.5 rounded-[3px] border border-[#A5D6A7] uppercase">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{res.status || 'Active'}</span>
                      </span>
                    </td>
                    {currentUser?.role === 'ADMIN' && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(res)}
                            className="p-1.5 bg-[#FAF8FC] hover:bg-[#F3E5F5] text-[#4A148C] border border-[#CE93D8] rounded-[3px] cursor-pointer"
                            title="Edit Resident"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(res.resident_id)}
                            className="p-1.5 bg-[#FFEBEE] hover:bg-[#FFCDD2] text-[#C62828] border border-[#EF9A9A] rounded-[3px] cursor-pointer"
                            title="Delete Resident"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT RESIDENT */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E1BEE7] rounded-[6px] max-w-lg w-full p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#E1BEE7] pb-3">
              <h3 className="text-[20px] font-bold text-[#4A148C] uppercase">
                {editingResident ? 'Edit Resident Record' : 'Register New Resident'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#757575] hover:text-[#212121] font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-[14px]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Resident ID</label>
                  <input
                    type="text"
                    required
                    value={formData.resident_id || ''}
                    onChange={(e) => setFormData({ ...formData, resident_id: e.target.value })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Tower</label>
                  <input
                    type="text"
                    value={formData.tower || 'A'}
                    onChange={(e) => setFormData({ ...formData, tower: e.target.value })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Floor</label>
                  <input
                    type="number"
                    value={formData.floor || 1}
                    onChange={(e) => setFormData({ ...formData, floor: Number(e.target.value) })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Flat No</label>
                  <input
                    type="text"
                    required
                    value={formData.flat || ''}
                    onChange={(e) => setFormData({ ...formData, flat: e.target.value })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Ownership Role</label>
                  <select
                    value={formData.role || 'Owner'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'Owner' | 'Tenant' })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Tenant">Tenant</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Account Status</label>
                  <select
                    value={formData.status || 'Active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E1BEE7]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[#CE93D8] text-[#4A148C] font-bold rounded-[4px] uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4A148C] hover:bg-[#310C61] text-white font-bold rounded-[4px] uppercase cursor-pointer"
                >
                  Save to Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
