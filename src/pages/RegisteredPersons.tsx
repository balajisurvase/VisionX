import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ExternalLink,
  Plus,
  Trash2,
  Edit2,
  Eye,
  RefreshCw,
  UserCheck,
  Calendar,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Fingerprint,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';
import { RegisteredPerson, RegisteredDocumentItem, PersonStatus } from '../types/person';
import { DocumentType } from '../types/verification';
import {
  fetchRegisteredPersons,
  createRegisteredPerson,
  deleteRegisteredPerson,
} from '../services/personService';

interface RegisteredPersonsProps {
  onNavigateToVerify?: (prefill?: { personCode: string; documentNumber: string; name: string }) => void;
}

export const RegisteredPersons: React.FC<RegisteredPersonsProps> = ({ onNavigateToVerify }) => {
  const [persons, setPersons] = useState<RegisteredPerson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedPerson, setSelectedPerson] = useState<RegisteredPerson | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    person_code: '',
    full_name: '',
    date_of_birth: '2000-01-01',
    nationality: 'Indian',
    gender: 'Male',
    status: 'ACTIVE' as PersonStatus,
    email: '',
    phone: '',
    address: '',
    notes: '',
    // Document
    document_type: 'Passport' as DocumentType,
    document_number: '',
    issue_date: '2022-01-01',
    expiry_date: '2032-01-01',
    issuing_country: 'India',
    issuing_authority: 'Regional Passport Office',
  });

  const loadPersons = async () => {
    setLoading(true);
    try {
      const data = await fetchRegisteredPersons(
        searchTerm.trim() || undefined,
        statusFilter === 'ALL' ? undefined : statusFilter
      );
      setPersons(data);
    } catch (err) {
      console.error('Failed to load registered persons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersons();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPersons();
  };

  const handleOpenRegisterModal = () => {
    const nextCode = `P${String(persons.length + 1).padStart(3, '0')}`;
    setFormData({
      person_code: nextCode,
      full_name: '',
      date_of_birth: '2000-01-01',
      nationality: 'Indian',
      gender: 'Male',
      status: 'ACTIVE',
      email: '',
      phone: '',
      address: '',
      notes: '',
      document_type: 'Passport',
      document_number: '',
      issue_date: '2022-01-01',
      expiry_date: '2032-01-01',
      issuing_country: 'India',
      issuing_authority: 'Regional Passport Office',
    });
    setShowRegisterModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.document_number) {
      alert('Please provide full name and document number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newPerson = await createRegisteredPerson(
        {
          person_code: formData.person_code,
          full_name: formData.full_name,
          date_of_birth: formData.date_of_birth,
          nationality: formData.nationality,
          gender: formData.gender,
          status: formData.status,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          notes: formData.notes,
        },
        {
          document_type: formData.document_type,
          document_number: formData.document_number,
          issue_date: formData.issue_date,
          expiry_date: formData.expiry_date,
          issuing_country: formData.issuing_country,
          issuing_authority: formData.issuing_authority,
        }
      );

      setShowRegisterModal(false);
      await loadPersons();
      setSelectedPerson(newPerson);
    } catch (err) {
      console.error('Failed to create person:', err);
      alert('Failed to register person.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to remove this person from the registry?')) return;
    await deleteRegisteredPerson(id);
    if (selectedPerson && selectedPerson.id === id) {
      setSelectedPerson(null);
    }
    await loadPersons();
  };

  const totalPersons = persons.length;
  const activePassports = persons.reduce(
    (acc, p) => acc + p.documents.filter((d) => d.document_type === 'Passport' && d.status === 'VALID').length,
    0
  );
  const flaggedCount = persons.filter((p) => p.status === 'FLAGGED').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span>Registered Persons Database</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-950/80 border border-cyan-800/80 text-cyan-300">
              {totalPersons} Profiles
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Central identity registry linked with registered passports, biometrics, and baseline credential records for automated matching.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadPersons}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
          </button>
          <button
            id="btn-register-person"
            onClick={handleOpenRegisterModal}
            className="px-4 py-2.5 rounded-xl bg-[#0B3D91] hover:bg-[#082d6c] text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Register Person</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Registered Citizens & Travelers
            </span>
            <span className="text-xl font-mono font-bold text-slate-100">
              {totalPersons}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Registered Passports
            </span>
            <span className="text-xl font-mono font-bold text-emerald-400">
              {activePassports}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Flagged Watchlist Profiles
            </span>
            <span className="text-xl font-mono font-bold text-red-400">
              {flaggedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Person ID (e.g. P001), Name (e.g. Rahul Sharma), Passport No. (e.g. P1234567)..."
            className="w-full pl-10 pr-24 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/50"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-medium text-slate-400">
            {['ALL', 'ACTIVE', 'FLAGGED', 'SUSPENDED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-800 text-cyan-400 font-bold'
                    : 'hover:text-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Status' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid + Profile Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Persons Grid / Table */}
        <div className={selectedPerson ? 'lg:col-span-7 space-y-3' : 'lg:col-span-12 space-y-3'}>
          {loading ? (
            <div className="text-center py-16 bg-slate-900/60 rounded-2xl border border-slate-800">
              <RefreshCw className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">Loading registered person records...</p>
            </div>
          ) : persons.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/60 rounded-2xl border border-slate-800 p-8 space-y-3">
              <Users className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">No registered persons found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No records match your search criteria. You can register a new person using the button above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {persons.map((person) => {
                const isSelected = selectedPerson?.id === person.id;
                const primaryDoc = person.documents[0];
                return (
                  <div
                    key={person.id}
                    onClick={() => setSelectedPerson(person)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer bg-slate-900/60 space-y-3 relative overflow-hidden ${
                      isSelected
                        ? 'border-cyan-500/80 ring-2 ring-cyan-500/20 bg-slate-900'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 flex items-center justify-center font-bold text-xs font-mono shrink-0 shadow-2xs">
                          {person.person_code}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-100">
                              {person.full_name}
                            </h4>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                person.status === 'ACTIVE'
                                  ? 'bg-emerald-950/80 border border-emerald-800/80 text-emerald-400'
                                  : person.status === 'FLAGGED'
                                  ? 'bg-red-950/80 border border-red-800/80 text-red-400'
                                  : 'bg-amber-950/80 border border-amber-800/80 text-amber-400'
                              }`}
                            >
                              {person.status}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block">
                            {person.nationality} • {person.gender}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-slate-500">
                        DOB: {person.date_of_birth}
                      </span>
                    </div>

                    {/* Document Details Pill */}
                    {primaryDoc && (
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="font-semibold text-slate-400">{primaryDoc.document_type}:</span>
                          <span className="font-mono font-bold text-slate-100">{primaryDoc.document_number}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Exp: {primaryDoc.expiry_date}
                        </span>
                      </div>
                    )}

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPerson(person);
                        }}
                        className="text-cyan-400 font-semibold text-[11px] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Profile</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      {onNavigateToVerify && primaryDoc && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToVerify({
                              personCode: person.person_code,
                              documentNumber: primaryDoc.document_number,
                              name: person.full_name,
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 hover:bg-cyan-900/60 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verify Passport</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Person Detailed Inspection Drawer */}
        {selectedPerson && (
          <div className="lg:col-span-5 bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xs space-y-5 sticky top-4 self-start">
            {/* Drawer Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-600 text-slate-950 flex items-center justify-center font-bold text-sm font-mono shadow-md shadow-cyan-500/20">
                  {selectedPerson.person_code}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-100">{selectedPerson.full_name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedPerson.status === 'ACTIVE'
                          ? 'bg-emerald-950/80 border border-emerald-800/80 text-emerald-400'
                          : selectedPerson.status === 'FLAGGED'
                          ? 'bg-red-950/80 border border-red-800/80 text-red-400'
                          : 'bg-amber-950/80 border border-amber-800/80 text-amber-400'
                      }`}
                    >
                      {selectedPerson.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    ID: {selectedPerson.person_code} • Registered Person
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedPerson(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Biographic Attributes */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Registered Biographic Information
              </h4>
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Full Legal Name</span>
                  <span className="font-bold text-slate-100">{selectedPerson.full_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Date of Birth</span>
                  <span className="font-mono font-bold text-slate-100">{selectedPerson.date_of_birth}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Nationality</span>
                  <span className="text-slate-200">{selectedPerson.nationality}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Gender</span>
                  <span className="text-slate-200">{selectedPerson.gender}</span>
                </div>
                {selectedPerson.email && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500 block">Email Address</span>
                    <span className="text-slate-200 font-mono text-[11px]">{selectedPerson.email}</span>
                  </div>
                )}
                {selectedPerson.address && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500 block">Registered Address</span>
                    <span className="text-slate-200 text-[11px]">{selectedPerson.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Linked Registered Documents */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Registered Identity Documents ({selectedPerson.documents.length})
                </h4>
              </div>

              <div className="space-y-2">
                {selectedPerson.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-cyan-400" />
                        <span className="font-bold text-xs text-slate-100">{doc.document_type}</span>
                        <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded">
                          {doc.document_number}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          doc.status === 'VALID'
                            ? 'bg-emerald-950/80 border border-emerald-800/80 text-emerald-400'
                            : doc.status === 'TAMPERED'
                            ? 'bg-red-950/80 border border-red-800/80 text-red-400'
                            : 'bg-amber-950/80 border border-amber-800/80 text-amber-400'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Issue Date:</span>
                        <span className="font-mono text-slate-200">{doc.issue_date}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Expiry Date:</span>
                        <span className="font-mono font-semibold text-slate-200">{doc.expiry_date}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 block text-[10px]">Issuing Authority:</span>
                        <span className="text-slate-200">{doc.issuing_authority || doc.issuing_country}</span>
                      </div>
                      {doc.document_hash && (
                        <div className="col-span-2 pt-1 border-t border-slate-800/80 font-mono text-[9px] text-slate-500 truncate">
                          SHA-256: {doc.document_hash}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes / Special Flags */}
            {selectedPerson.notes && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 space-y-1">
                <span className="font-bold block text-[10px] uppercase tracking-wider text-amber-400">
                  Officer Notes / Security Log
                </span>
                <p className="text-[11px] leading-relaxed text-amber-300">{selectedPerson.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              {onNavigateToVerify && selectedPerson.documents[0] && (
                <button
                  onClick={() =>
                    onNavigateToVerify({
                      personCode: selectedPerson.person_code,
                      documentNumber: selectedPerson.documents[0].document_number,
                      name: selectedPerson.full_name,
                    })
                  }
                  className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Start Verification Against This Profile</span>
                </button>
              )}

              <button
                onClick={() => handleDelete(selectedPerson.id)}
                className="w-full py-2 px-3 text-red-400 hover:bg-red-950/50 text-xs font-semibold rounded-xl border border-red-800/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove From Registry</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Register Person Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-600 text-slate-950 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Register New Person & Credential
                  </h3>
                  <p className="text-xs text-slate-400">
                    Add baseline citizen record to central database for automated verification matching
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              {/* Person Biographics Section */}
              <div className="space-y-3">
                <h4 className="font-bold text-cyan-400 uppercase tracking-wider text-[11px]">
                  1. Biographic Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Person ID / Code
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.person_code}
                      onChange={(e) => setFormData({ ...formData, person_code: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-100 focus:ring-2 focus:ring-cyan-500/50 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-100 focus:ring-2 focus:ring-cyan-500/50 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nationality
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-cyan-500/50 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-cyan-500/50 focus:outline-hidden"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Registered Document Section */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <h4 className="font-bold text-cyan-400 uppercase tracking-wider text-[11px]">
                  2. Registered Identity Credential / Passport
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Document Type
                    </label>
                    <select
                      value={formData.document_type}
                      onChange={(e) =>
                        setFormData({ ...formData, document_type: e.target.value as DocumentType })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-cyan-500/50 focus:outline-hidden"
                    >
                      <option value="Passport">Passport</option>
                      <option value="National ID">National ID</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Visa">Visa</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Document / Passport Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. P1234567"
                      value={formData.document_number}
                      onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono uppercase text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Date of Issue
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.issue_date}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-100 focus:ring-2 focus:ring-cyan-500/50 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Date of Expiry
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-100 focus:ring-2 focus:ring-cyan-500/50 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Issuing Country
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.issuing_country}
                      onChange={(e) => setFormData({ ...formData, issuing_country: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-cyan-500/50 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Status and Notes */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <h4 className="font-bold text-cyan-400 uppercase tracking-wider text-[11px]">
                  3. Status & Profile Notes
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Registry Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as PersonStatus })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-cyan-500/50 focus:outline-hidden"
                    >
                      <option value="ACTIVE">ACTIVE (Clear / Standard)</option>
                      <option value="UNDER_REVIEW">UNDER_REVIEW (Requires Manual Check)</option>
                      <option value="FLAGGED">FLAGGED (High Security Concern)</option>
                      <option value="SUSPENDED">SUSPENDED (Expired or Revoked)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Contact Email (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. rahul.sharma@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Officer Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Registered via Passport Seva Kendra / Officer Terminal."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:outline-hidden resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving to Database...' : 'Save Registered Person'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
