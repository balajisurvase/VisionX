import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  RefreshCw,
  DollarSign,
  Building,
} from 'lucide-react';
import {
  fetchAmenities,
  fetchBookings,
  createBooking,
  updateBookingStatus,
} from '../services/societyService';
import { DbAmenity, DbBooking, AuthSessionUser } from '../types/society';

interface BookingsProps {
  currentUser: AuthSessionUser | null;
}

export const BookingsAmenities: React.FC<BookingsProps> = ({ currentUser }) => {
  const [amenities, setAmenities] = useState<DbAmenity[]>([]);
  const [bookings, setBookings] = useState<DbBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAmenity, setSelectedAmenity] = useState<DbAmenity | null>(null);
  const [showBookModal, setShowBookModal] = useState<boolean>(false);

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    event_name: '',
    booking_date: new Date().toISOString().split('T')[0],
    start_time: '18:00',
    end_time: '21:00',
    hours: 3,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [aData, bData] = await Promise.all([
        fetchAmenities(),
        fetchBookings(currentUser?.role === 'RESIDENT' ? currentUser.id : undefined),
      ]);
      setAmenities(aData || []);
      setBookings(bData || []);
    } catch (err) {
      console.error('Failed to load bookings data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleOpenBookModal = (amenity: DbAmenity) => {
    setSelectedAmenity(amenity);
    setShowBookModal(true);
  };

  const calculateTotalCharges = () => {
    if (!selectedAmenity) return 0;
    const basePrice = selectedAmenity.price || selectedAmenity.charges || 500;
    return basePrice;
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAmenity) return;

    const newBooking: DbBooking = {
      id: `BKG-${Date.now().toString().slice(-6)}`,
      booking_id: `BKG-${Date.now().toString().slice(-6)}`,
      resident_id: currentUser?.id || 'RES-A101',
      name: currentUser?.name || 'Resident',
      tower: currentUser?.tower || 'A',
      flat: typeof currentUser?.flat === 'number' ? currentUser.flat : 101,
      amenity_name: selectedAmenity.name,
      amenity_type: selectedAmenity.amenity_type,
      event_name: bookingForm.event_name || 'Personal Event',
      booking_date: bookingForm.booking_date,
      start_time: bookingForm.start_time,
      end_time: bookingForm.end_time,
      charges: calculateTotalCharges(),
      status: 'Confirmed',
      created_at: new Date().toISOString(),
      society_id: currentUser?.society_id || 'SOC-PUNE-01',
    };

    try {
      await createBooking(newBooking);
      setShowBookModal(false);
      loadData();
    } catch (err) {
      console.error('Booking error:', err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateBookingStatus(id, newStatus);
    loadData();
  };

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
              Supabase Tables: `amenities` & `booking`
            </span>
          </div>
          <h1 className="text-[30px] font-bold text-[#4A148C] uppercase tracking-tight leading-tight">
            Society Amenities & Slot Bookings
          </h1>
          <p className="text-[15px] text-[#616161] font-normal">
            Real-time availability, schedule management, and instant reservation ledger
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2.5 rounded-[4px] text-[14px] font-bold bg-white hover:bg-[#FAF8FC] text-[#4A148C] border border-[#CE93D8] shadow-xs cursor-pointer flex items-center gap-2 uppercase"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Bookings</span>
        </button>
      </div>

      {/* 2. Amenities Catalog Grid */}
      <div className="space-y-3">
        <h2 className="text-[20px] font-bold text-[#310C61] uppercase">
          Available Society Facilities (`amenities`)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {amenities.map((a) => (
            <div
              key={a.id}
              className="bg-white border border-[#E1BEE7] rounded-[6px] p-5 shadow-xs flex flex-col justify-between hover:border-[#BA68C8] transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#F3E5F5] text-[#4A148C] rounded-[3px] border border-[#E1BEE7]">
                    {a.amenity_type || 'Facility'}
                  </span>
                  <span className="text-[18px] font-bold text-[#2E7D32]">
                    ₹{(a.price || a.charges || 0).toLocaleString()} / session
                  </span>
                </div>
                <h3 className="text-[20px] font-bold text-[#212121]">{a.name}</h3>
                <p className="text-[14px] text-[#616161]">{a.description}</p>
                {a.facilities && (
                  <div className="pt-2 text-[12px] text-[#6A1B9A]">
                    <strong>Included:</strong> {a.facilities}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-[#E1BEE7] flex items-center justify-between">
                <span className="text-[12px] text-[#757575]">
                  Base Hours: <strong>{a.base_hours || 2} hrs</strong>
                </span>
                <button
                  onClick={() => handleOpenBookModal(a)}
                  className="px-4 py-1.5 bg-[#4A148C] hover:bg-[#310C61] text-white text-[13px] font-bold uppercase rounded-[4px] cursor-pointer transition-colors"
                >
                  Reserve Slot
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Bookings Ledger */}
      <div className="bg-white border border-[#E1BEE7] rounded-[6px] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E1BEE7] pb-3">
          <h2 className="text-[20px] font-bold text-[#310C61] uppercase">
            Reservations & Bookings History (`booking`)
          </h2>
          <span className="text-[13px] font-bold text-[#6A1B9A]">
            Total Records: {bookings.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[15px]">
            <thead className="bg-[#4A148C] text-white uppercase font-bold text-[13px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Booking ID</th>
                <th className="py-3.5 px-4">Amenity</th>
                <th className="py-3.5 px-4">Resident</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Charges</th>
                <th className="py-3.5 px-4">Status</th>
                {currentUser?.role === 'ADMIN' && <th className="py-3.5 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1BEE7]">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#757575]">
                    No bookings found in `booking` table.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#FAF8FC]">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#4A148C]">
                      {b.booking_id || b.id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#212121]">
                      {b.amenity_name}
                      {b.event_name && (
                        <span className="block text-[12px] font-normal text-[#616161]">
                          {b.event_name}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#212121]">{b.name}</span>
                      <span className="block text-[12px] text-[#757575]">
                        Flat {b.flat || '-'} (Tower {b.tower || '-'})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[14px]">
                      <span className="font-bold text-[#310C61]">{b.booking_date}</span>
                      <span className="block text-[12px] text-[#616161]">
                        {b.start_time} - {b.end_time}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#2E7D32]">
                      ₹{(b.charges || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-[3px] text-[12px] font-bold uppercase ${
                          b.status === 'Confirmed'
                            ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]'
                            : 'bg-[#FFEBEE] text-[#C62828] border border-[#EF9A9A]'
                        }`}
                      >
                        {b.status || 'Pending'}
                      </span>
                    </td>
                    {currentUser?.role === 'ADMIN' && (
                      <td className="py-3.5 px-4 text-right">
                        {b.status !== 'Cancelled' ? (
                          <button
                            onClick={() => handleStatusChange(b.id, 'Cancelled')}
                            className="px-3 py-1 bg-[#FFEBEE] text-[#C62828] border border-[#EF9A9A] text-[12px] font-bold rounded-[3px] uppercase cursor-pointer hover:bg-[#FFCDD2]"
                          >
                            Cancel
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(b.id, 'Confirmed')}
                            className="px-3 py-1 bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] text-[12px] font-bold rounded-[3px] uppercase cursor-pointer hover:bg-[#C8E6C9]"
                          >
                            Re-Approve
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: BOOK AMENITY */}
      {showBookModal && selectedAmenity && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E1BEE7] rounded-[6px] max-w-md w-full p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#E1BEE7] pb-3">
              <h3 className="text-[20px] font-bold text-[#4A148C] uppercase">
                Book {selectedAmenity.name}
              </h3>
              <button
                onClick={() => setShowBookModal(false)}
                className="text-[#757575] hover:text-[#212121] font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="space-y-4 text-[14px]">
              <div>
                <label className="block font-bold text-[#212121] mb-1">Event / Purpose Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Birthday Celebration, Family Gathering"
                  value={bookingForm.event_name}
                  onChange={(e) => setBookingForm({ ...bookingForm, event_name: e.target.value })}
                  className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#212121] mb-1">Date of Reservation</label>
                <input
                  type="date"
                  required
                  value={bookingForm.booking_date}
                  onChange={(e) => setBookingForm({ ...bookingForm, booking_date: e.target.value })}
                  className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#212121] mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={bookingForm.start_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#212121] mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={bookingForm.end_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
                    className="w-full p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#F3E5F5] border border-[#CE93D8] rounded-[4px] flex items-center justify-between">
                <span className="font-bold text-[#4A148C]">Calculated Slot Charges</span>
                <span className="text-[18px] font-bold text-[#2E7D32]">
                  ₹{calculateTotalCharges().toLocaleString()}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E1BEE7]">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 border border-[#CE93D8] text-[#4A148C] font-bold rounded-[4px] uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4A148C] hover:bg-[#310C61] text-white font-bold rounded-[4px] uppercase cursor-pointer"
                >
                  Confirm & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
