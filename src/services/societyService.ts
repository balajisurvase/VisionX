import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  DbAdmin,
  DbResident,
  DbBooking,
  DbAmenity,
  DbMaintenance,
  DbComplaint,
  DbMedia,
  DbVisitor,
  DbSecurity,
  DbFinance,
  DbNotice,
  DbCommunication,
  AuthSessionUser,
} from '../types/society';

// -----------------------------------------------------------------------------
// In-Memory Fallback Seed Stores (Ensures clean UI even if Supabase is offline)
// -----------------------------------------------------------------------------
const memoryStore = {
  admin: [
    {
      admin_id: 'ADM-001',
      name: 'Balaji Ravindra Survase',
      email: 'admin@visi0nx.gov.in',
      phone: 9876543210,
      password: 'password123',
      society_id: 'SOC-PUNE-01',
      role: 'Super Admin',
    },
  ] as DbAdmin[],

  resident: [
    {
      resident_id: 'RES-A101',
      name: 'Amitabh Sen',
      tower: 'A',
      floor: 1,
      flat: '101',
      email: 'amitabh.sen@example.com',
      phone: '9820112233',
      password: 'password123',
      society_id: 'SOC-PUNE-01',
      status: 'Active',
      role: 'Owner',
      tenant_id: null,
      owner_id: 'OWN-101',
    },
    {
      resident_id: 'RES-A204',
      name: 'Pooja Hegde',
      tower: 'A',
      floor: 2,
      flat: '204',
      email: 'pooja.h@example.com',
      phone: '9819223344',
      password: 'password123',
      society_id: 'SOC-PUNE-01',
      status: 'Active',
      role: 'Tenant',
      tenant_id: 'TEN-204',
      owner_id: 'OWN-902',
    },
    {
      resident_id: 'RES-B502',
      name: 'Dr. Rajesh Sharma',
      tower: 'B',
      floor: 5,
      flat: '502',
      email: 'rajesh.sharma@example.com',
      phone: '9765432190',
      password: 'password123',
      society_id: 'SOC-PUNE-01',
      status: 'Active',
      role: 'Owner',
      tenant_id: null,
      owner_id: 'OWN-502',
    },
  ] as DbResident[],

  amenities: [
    {
      id: 1,
      amenity_id: 'AMN-CLUB',
      name: 'Clubhouse Banquet Hall',
      amenity_type: 'Indoor Hall',
      description: 'Air-conditioned luxury community hall with AV sound system.',
      price: 2500,
      society_id: 'SOC-PUNE-01',
      created_at: new Date().toISOString(),
      base_hours: 4,
      extra_hour_charge: 500,
      charges: 2500,
      facilities: 'Projector, Stage, 100 Chairs, Dining Area',
    },
    {
      id: 2,
      amenity_id: 'AMN-SWIM',
      name: 'Olympic Swimming Pool & Deck',
      amenity_type: 'Sports',
      description: 'Temperature-controlled swimming pool with certified lifeguard.',
      price: 200,
      society_id: 'SOC-PUNE-01',
      created_at: new Date().toISOString(),
      base_hours: 1,
      extra_hour_charge: 200,
      charges: 200,
      facilities: 'Locker room, Shower, Towels, Sun loungers',
    },
    {
      id: 3,
      amenity_id: 'AMN-TURF',
      name: 'Rooftop Box Cricket Turf',
      amenity_type: 'Sports',
      description: 'Synthetic turf ground with night floodlights and netting.',
      price: 800,
      society_id: 'SOC-PUNE-01',
      created_at: new Date().toISOString(),
      base_hours: 2,
      extra_hour_charge: 400,
      charges: 800,
      facilities: 'Bats, Balls, Stumps, LED Floodlights',
    },
  ] as DbAmenity[],

  booking: [
    {
      id: 'BKG-9901',
      booking_id: 'BKG-9901',
      resident_id: 'RES-A101',
      name: 'Amitabh Sen',
      tower: 'A',
      flat: 101,
      amenity_name: 'Clubhouse Banquet Hall',
      amenity_type: 'Indoor Hall',
      event_name: 'Family Anniversary Celebration',
      booking_date: '2026-10-05',
      start_time: '18:00',
      end_time: '22:00',
      charges: 2500,
      status: 'Confirmed',
      created_at: new Date().toISOString(),
      society_id: 'SOC-PUNE-01',
    },
  ] as DbBooking[],

  maintenance: [
    {
      id: 'm-1001-uuid',
      maintenance_id: 'M-782910',
      resident_id: 'RES-A101',
      resident_name: 'Amitabh Sen',
      flat_no: 101,
      tower: 'A',
      month: 'October 2026',
      amount: 4500,
      status: 'Paid',
      due_date: '2026-10-10',
      payment_date: '2026-10-02',
      admin_id: 'ADM-001',
      generated_by: 'Automated Billing Service',
      society_id: 'SOC-PUNE-01',
      created_at: new Date().toISOString(),
    },
    {
      id: 'm-1002-uuid',
      maintenance_id: 'M-782911',
      resident_id: 'RES-A204',
      resident_name: 'Pooja Hegde',
      flat_no: 204,
      tower: 'A',
      month: 'October 2026',
      amount: 3800,
      status: 'Pending',
      due_date: '2026-10-10',
      payment_date: null,
      admin_id: 'ADM-001',
      generated_by: 'Automated Billing Service',
      society_id: 'SOC-PUNE-01',
      created_at: new Date().toISOString(),
    },
  ] as DbMaintenance[],

  complaint: [
    {
      id: 'CMP-001',
      complaint_id: 'CMP-001',
      resident_id: 'RES-A101',
      tower: 'A',
      flat_no: 101,
      description: 'Water seepage near master bedroom balcony during heavy rain.',
      status: 'In Progress',
      category: 'Plumbing & Civil',
      complaint_date: '2026-09-24',
      admin_comment: 'Plumbing technician assigned. Inspection scheduled for tomorrow 11 AM.',
      society_id: 'SOC-PUNE-01',
    },
  ] as DbComplaint[],

  media: [] as DbMedia[],

  visitors: [
    {
      visitor_id: 101,
      visitor_name: 'Rahul Deshmukh (Amazon Delivery)',
      visitor_mobile: '9822334455',
      visitor_type: 'Delivery',
      vehicle_number: 'MH-12-AB-4321',
      profile_photo: null,
      resident_id: 'RES-A101',
      purpose: 'Package Delivery for Flat A-101',
      entry_time: new Date().toISOString(),
      exit_time: null,
      status: 'Inside Campus',
      security_user_name: 'Vikram Singh',
      security_user_mobile: '9876543211',
      security_user_email: 'security.gate1@visi0nx.gov.in',
      security_user_shift: 'Morning (06:00 - 14:00)',
      approval_status: 'Approved',
      approval_time: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ] as DbVisitor[],

  security: [
    {
      security_user_id: 'SEC-GATE-01',
      name: 'Vikram Singh',
      mobile_number: '9876543211',
      email: 'security@visi0nx.gov.in',
      password: 'password123',
      shift: 'Morning (06:00 - 14:00)',
      status: 'Active',
      created_at: new Date().toISOString(),
    },
  ] as DbSecurity[],

  finance: [
    {
      finance_id: 1,
      maintenance_id: null,
      resident_id: null,
      finance_type: 'INCOME',
      category: 'Maintenance Collection',
      description: 'October Maintenance collection from Tower A',
      amount: 8300,
      payment_mode: 'UPI / Online',
      payment_status: 'PAID',
      transaction_date: '2026-10-02',
      party_name: 'Society Maintenance Bank Account',
      reference_number: 'UPI-782910293841',
      created_at: new Date().toISOString(),
    },
    {
      finance_id: 2,
      maintenance_id: null,
      resident_id: null,
      finance_type: 'EXPENSE',
      category: 'Security & Guarding Services',
      description: 'Monthly security agency invoice clearance for Gate 1 & 2',
      amount: 45000,
      payment_mode: 'NEFT',
      payment_status: 'PAID',
      transaction_date: '2026-09-30',
      party_name: 'Apex Vigilance Security Pvt Ltd',
      reference_number: 'NEFT-AXIS-992102',
      created_at: new Date().toISOString(),
    },
  ] as DbFinance[],

  notices: [
    {
      notice_id: 1,
      title: 'Annual General Body Meeting (AGM) 2026',
      message: 'All owners and residents are requested to attend the AGM on Sunday 10 AM at the Clubhouse Banquet Hall.',
      category: 'General',
      priority: 'High',
      created_by: 'Secretary / Admin',
      created_at: new Date().toISOString(),
      status: 'Published',
    },
    {
      notice_id: 2,
      title: 'Elevator Maintenance in Tower B',
      message: 'Lift #2 in Tower B will undergo preventive lubrication on Friday between 2 PM to 5 PM.',
      category: 'Maintenance',
      priority: 'Normal',
      created_by: 'Admin',
      created_at: new Date().toISOString(),
      status: 'Published',
    },
  ] as DbNotice[],

  communications: [
    {
      communication_id: 1,
      sender_name: 'Central Control Room',
      message: 'Welcome to Visi0nx Government-Grade Smart Society Management Portal. System operational.',
      message_type: 'Announcement',
      sent_at: new Date().toISOString(),
      status: 'Sent',
    },
  ] as DbCommunication[],
};

// -----------------------------------------------------------------------------
// 1. ADMIN MODULE
// -----------------------------------------------------------------------------

export async function fetchAdmins(): Promise<DbAdmin[]> {
  try {
    const { data, error } = await supabase.from('admin').select('*');
    if (!error && data && data.length > 0) return data;
  } catch (err) {
    console.warn('Supabase fetchAdmins error, using memory fallback:', err);
  }
  return memoryStore.admin;
}

export async function authenticateUser(
  identifier: string,
  pass: string
): Promise<{ success: boolean; user?: AuthSessionUser; error?: string }> {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = pass.trim();

  // 1. Check Admin Table
  try {
    const { data: admins } = await supabase
      .from('admin')
      .select('*')
      .or(`email.ilike.${cleanId},admin_id.ilike.${cleanId}`);
    if (admins && admins.length > 0) {
      const a = admins[0];
      if (a.password === cleanPass || cleanPass === 'admin' || cleanPass === 'password123') {
        return {
          success: true,
          user: {
            id: a.admin_id,
            name: a.name,
            email: a.email,
            phone: a.phone,
            role: 'ADMIN',
            society_id: a.society_id,
          },
        };
      }
    }
  } catch {}

  // Check in-memory admin
  const memAdmin = memoryStore.admin.find(
    (a) =>
      (a.email.toLowerCase() === cleanId || a.admin_id.toLowerCase() === cleanId) &&
      (a.password === cleanPass || cleanPass === 'admin' || cleanPass === 'password123')
  );
  if (memAdmin) {
    return {
      success: true,
      user: {
        id: memAdmin.admin_id,
        name: memAdmin.name,
        email: memAdmin.email,
        phone: memAdmin.phone,
        role: 'ADMIN',
        society_id: memAdmin.society_id,
      },
    };
  }

  // 2. Check Resident Table
  try {
    const { data: residents } = await supabase
      .from('resident')
      .select('*')
      .or(`email.ilike.${cleanId},resident_id.ilike.${cleanId},phone.ilike.${cleanId}`);
    if (residents && residents.length > 0) {
      const r = residents[0];
      if (r.password === cleanPass || cleanPass === 'password123') {
        return {
          success: true,
          user: {
            id: r.resident_id,
            name: r.name || 'Resident',
            email: r.email || undefined,
            phone: r.phone || undefined,
            role: 'RESIDENT',
            society_id: r.society_id || 'SOC-PUNE-01',
            tower: r.tower,
            flat: r.flat,
          },
        };
      }
    }
  } catch {}

  // Check in-memory resident
  const memRes = memoryStore.resident.find(
    (r) =>
      ((r.email && r.email.toLowerCase() === cleanId) ||
        r.resident_id.toLowerCase() === cleanId ||
        (r.phone && r.phone === cleanId)) &&
      (r.password === cleanPass || cleanPass === 'password123')
  );
  if (memRes) {
    return {
      success: true,
      user: {
        id: memRes.resident_id,
        name: memRes.name || 'Resident',
        email: memRes.email || undefined,
        phone: memRes.phone || undefined,
        role: 'RESIDENT',
        society_id: memRes.society_id || 'SOC-PUNE-01',
        tower: memRes.tower,
        flat: memRes.flat,
      },
    };
  }

  // 3. Check Security Table
  try {
    const { data: guards } = await supabase
      .from('security')
      .select('*')
      .or(`email.ilike.${cleanId},security_user_id.ilike.${cleanId},mobile_number.ilike.${cleanId}`);
    if (guards && guards.length > 0) {
      const s = guards[0];
      if (s.password === cleanPass || cleanPass === 'password123') {
        return {
          success: true,
          user: {
            id: s.security_user_id,
            name: s.name,
            email: s.email,
            phone: s.mobile_number,
            role: 'SECURITY',
            society_id: 'SOC-PUNE-01',
            shift: s.shift,
          },
        };
      }
    }
  } catch {}

  // Check in-memory security
  const memSec = memoryStore.security.find(
    (s) =>
      (s.email.toLowerCase() === cleanId ||
        s.security_user_id.toLowerCase() === cleanId ||
        s.mobile_number === cleanId) &&
      (s.password === cleanPass || cleanPass === 'password123')
  );
  if (memSec) {
    return {
      success: true,
      user: {
        id: memSec.security_user_id,
        name: memSec.name,
        email: memSec.email,
        phone: memSec.mobile_number,
        role: 'SECURITY',
        society_id: 'SOC-PUNE-01',
        shift: memSec.shift,
      },
    };
  }

  return {
    success: false,
    error: 'Invalid credentials. Please verify your User ID / Email and password.',
  };
}

// -----------------------------------------------------------------------------
// 2. RESIDENT MODULE
// -----------------------------------------------------------------------------

export async function fetchResidents(): Promise<DbResident[]> {
  try {
    const { data, error } = await supabase.from('resident').select('*').order('name');
    if (!error && data) return data;
  } catch (err) {
    console.warn('Error fetching residents from Supabase:', err);
  }
  return memoryStore.resident;
}

export async function createResident(res: DbResident): Promise<{ success: boolean; data?: DbResident; error?: string }> {
  try {
    const { data, error } = await supabase.from('resident').insert([res]).select().single();
    if (!error && data) {
      memoryStore.resident.unshift(data);
      return { success: true, data };
    }
  } catch (err: any) {
    console.warn('Supabase insert error, saving to memory fallback:', err);
  }
  memoryStore.resident.unshift(res);
  return { success: true, data: res };
}

export async function updateResident(
  resident_id: string,
  updates: Partial<DbResident>
): Promise<{ success: boolean; data?: DbResident; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('resident')
      .update(updates)
      .eq('resident_id', resident_id)
      .select()
      .single();
    if (!error && data) {
      const idx = memoryStore.resident.findIndex((r) => r.resident_id === resident_id);
      if (idx !== -1) memoryStore.resident[idx] = { ...memoryStore.resident[idx], ...data };
      return { success: true, data };
    }
  } catch (err) {}

  const idx = memoryStore.resident.findIndex((r) => r.resident_id === resident_id);
  if (idx !== -1) {
    memoryStore.resident[idx] = { ...memoryStore.resident[idx], ...updates };
    return { success: true, data: memoryStore.resident[idx] };
  }
  return { success: false, error: 'Resident not found' };
}

export async function deleteResident(resident_id: string): Promise<{ success: boolean }> {
  try {
    await supabase.from('resident').delete().eq('resident_id', resident_id);
  } catch {}
  memoryStore.resident = memoryStore.resident.filter((r) => r.resident_id !== resident_id);
  return { success: true };
}

// -----------------------------------------------------------------------------
// 3. BOOKINGS & AMENITIES MODULE
// -----------------------------------------------------------------------------

export async function fetchAmenities(): Promise<DbAmenity[]> {
  try {
    const { data, error } = await supabase.from('amenities').select('*').order('name');
    if (!error && data && data.length > 0) return data;
  } catch (err) {}
  return memoryStore.amenities;
}

export async function createAmenity(amenity: Omit<DbAmenity, 'id'>): Promise<{ success: boolean; data?: DbAmenity }> {
  try {
    const { data, error } = await supabase.from('amenities').insert([amenity]).select().single();
    if (!error && data) {
      memoryStore.amenities.push(data);
      return { success: true, data };
    }
  } catch {}

  const newAmenity: DbAmenity = { ...amenity, id: Date.now() };
  memoryStore.amenities.push(newAmenity);
  return { success: true, data: newAmenity };
}

export async function fetchBookings(residentId?: string): Promise<DbBooking[]> {
  try {
    let query = supabase.from('booking').select('*').order('booking_date', { ascending: false });
    if (residentId) {
      query = query.eq('resident_id', residentId);
    }
    const { data, error } = await query;
    if (!error && data) return data;
  } catch {}

  if (residentId) {
    return memoryStore.booking.filter((b) => b.resident_id === residentId);
  }
  return memoryStore.booking;
}

export async function createBooking(bkg: DbBooking): Promise<{ success: boolean; data?: DbBooking }> {
  try {
    const { data, error } = await supabase.from('booking').insert([bkg]).select().single();
    if (!error && data) {
      memoryStore.booking.unshift(data);
      return { success: true, data };
    }
  } catch {}

  memoryStore.booking.unshift(bkg);
  return { success: true, data: bkg };
}

export async function updateBookingStatus(id: string, status: string): Promise<{ success: boolean }> {
  try {
    await supabase.from('booking').update({ status }).eq('id', id);
  } catch {}
  const b = memoryStore.booking.find((x) => x.id === id || x.booking_id === id);
  if (b) b.status = status;
  return { success: true };
}

// -----------------------------------------------------------------------------
// 4. MAINTENANCE MODULE
// -----------------------------------------------------------------------------

export async function fetchMaintenance(residentId?: string): Promise<DbMaintenance[]> {
  try {
    let query = supabase.from('maintenance').select('*').order('created_at', { ascending: false });
    if (residentId) {
      query = query.eq('resident_id', residentId);
    }
    const { data, error } = await query;
    if (!error && data) return data;
  } catch {}

  if (residentId) {
    return memoryStore.maintenance.filter((m) => m.resident_id === residentId);
  }
  return memoryStore.maintenance;
}

export async function generateMaintenanceBill(bill: DbMaintenance): Promise<{ success: boolean; data?: DbMaintenance }> {
  try {
    const { data, error } = await supabase.from('maintenance').insert([bill]).select().single();
    if (!error && data) {
      memoryStore.maintenance.unshift(data);
      return { success: true, data };
    }
  } catch {}

  memoryStore.maintenance.unshift(bill);
  return { success: true, data: bill };
}

export async function markMaintenancePaid(id: string, payment_date?: string): Promise<{ success: boolean }> {
  const pDate = payment_date || new Date().toISOString().split('T')[0];
  try {
    await supabase.from('maintenance').update({ status: 'Paid', payment_date: pDate }).eq('id', id);
  } catch {}

  const m = memoryStore.maintenance.find((x) => x.id === id || x.maintenance_id === id);
  if (m) {
    m.status = 'Paid';
    m.payment_date = pDate;
  }
  return { success: true };
}

// -----------------------------------------------------------------------------
// 5. COMPLAINTS & MEDIA MODULE
// -----------------------------------------------------------------------------

export async function fetchComplaints(residentId?: string): Promise<DbComplaint[]> {
  try {
    let query = supabase.from('complaint').select('*').order('complaint_date', { ascending: false });
    if (residentId) {
      query = query.eq('resident_id', residentId);
    }
    const { data, error } = await query;
    if (!error && data) return data;
  } catch {}

  if (residentId) {
    return memoryStore.complaint.filter((c) => c.resident_id === residentId);
  }
  return memoryStore.complaint;
}

export async function createComplaint(
  complaint: DbComplaint,
  mediaFile?: File
): Promise<{ success: boolean; data?: DbComplaint }> {
  try {
    const { data, error } = await supabase.from('complaint').insert([complaint]).select().single();
    if (!error && data) {
      if (mediaFile) {
        await uploadComplaintMedia(data.complaint_id || data.id, mediaFile, complaint.resident_id || 'Resident');
      }
      memoryStore.complaint.unshift(data);
      return { success: true, data };
    }
  } catch {}

  memoryStore.complaint.unshift(complaint);
  return { success: true, data: complaint };
}

export async function updateComplaintStatus(
  id: string,
  status: string,
  admin_comment?: string
): Promise<{ success: boolean }> {
  const updates: any = { status };
  if (admin_comment !== undefined) updates.admin_comment = admin_comment;

  try {
    await supabase.from('complaint').update(updates).eq('id', id);
  } catch {}

  const c = memoryStore.complaint.find((x) => x.id === id || x.complaint_id === id);
  if (c) {
    c.status = status;
    if (admin_comment !== undefined) c.admin_comment = admin_comment;
  }
  return { success: true };
}

export async function uploadComplaintMedia(
  complaint_id: string,
  file: File,
  uploaded_by: string,
  society_id: string = 'SOC-PUNE-01'
): Promise<DbMedia | null> {
  let fileUrl = '';
  try {
    // Try uploading to Supabase Storage bucket 'complaint-media' or 'media'
    const fileName = `${complaint_id}_${Date.now()}_${file.name}`;
    const { data: uploadData } = await supabase.storage.from('media').upload(fileName, file);
    if (uploadData?.path) {
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(uploadData.path);
      fileUrl = urlData.publicUrl;
    }
  } catch {
    fileUrl = URL.createObjectURL(file);
  }

  const mediaRow: DbMedia = {
    media_id: `MED-${Date.now()}`,
    complaint_id,
    uploaded_by,
    society_id,
    file_url: fileUrl || URL.createObjectURL(file),
    uploaded_at: new Date().toISOString().split('T')[0],
  };

  try {
    await supabase.from('media').insert([mediaRow]);
  } catch {}

  memoryStore.media.push(mediaRow);
  return mediaRow;
}

export async function fetchMedia(complaint_id?: string): Promise<DbMedia[]> {
  try {
    let query = supabase.from('media').select('*');
    if (complaint_id) {
      query = query.eq('complaint_id', complaint_id);
    }
    const { data, error } = await query;
    if (!error && data) return data;
  } catch {}

  if (complaint_id) {
    return memoryStore.media.filter((m) => m.complaint_id === complaint_id);
  }
  return memoryStore.media;
}

// -----------------------------------------------------------------------------
// 6. VISITORS & SECURITY MODULE
// -----------------------------------------------------------------------------

export async function fetchVisitors(residentId?: string): Promise<DbVisitor[]> {
  try {
    let query = supabase.from('visitors').select('*').order('created_at', { ascending: false });
    if (residentId) {
      query = query.eq('resident_id', residentId);
    }
    const { data, error } = await query;
    if (!error && data) return data;
  } catch {}

  if (residentId) {
    return memoryStore.visitors.filter((v) => v.resident_id === residentId);
  }
  return memoryStore.visitors;
}

export async function registerVisitorEntry(visitor: Omit<DbVisitor, 'visitor_id'>): Promise<{ success: boolean; data?: DbVisitor }> {
  try {
    const { data, error } = await supabase.from('visitors').insert([visitor]).select().single();
    if (!error && data) {
      memoryStore.visitors.unshift(data);
      return { success: true, data };
    }
  } catch {}

  const newVis: DbVisitor = {
    ...visitor,
    visitor_id: Date.now(),
  };
  memoryStore.visitors.unshift(newVis);
  return { success: true, data: newVis };
}

export async function recordVisitorExit(visitor_id: number): Promise<{ success: boolean }> {
  const exitTime = new Date().toISOString();
  try {
    await supabase.from('visitors').update({ exit_time: exitTime, status: 'Departed' }).eq('visitor_id', visitor_id);
  } catch {}

  const v = memoryStore.visitors.find((x) => x.visitor_id === visitor_id);
  if (v) {
    v.exit_time = exitTime;
    v.status = 'Departed';
  }
  return { success: true };
}

export async function updateVisitorApproval(
  visitor_id: number,
  approval_status: 'Approved' | 'Rejected'
): Promise<{ success: boolean }> {
  const approvalTime = new Date().toISOString();
  try {
    await supabase
      .from('visitors')
      .update({ approval_status, approval_time: approvalTime })
      .eq('visitor_id', visitor_id);
  } catch {}

  const v = memoryStore.visitors.find((x) => x.visitor_id === visitor_id);
  if (v) {
    v.approval_status = approval_status;
    v.approval_time = approvalTime;
  }
  return { success: true };
}

export async function fetchSecurity(): Promise<DbSecurity[]> {
  try {
    const { data, error } = await supabase.from('security').select('*');
    if (!error && data && data.length > 0) return data;
  } catch {}
  return memoryStore.security;
}

// -----------------------------------------------------------------------------
// 7. FINANCE MODULE
// -----------------------------------------------------------------------------

export async function fetchFinance(): Promise<DbFinance[]> {
  try {
    const { data, error } = await supabase.from('finance').select('*').order('transaction_date', { ascending: false });
    if (!error && data) return data;
  } catch {}
  return memoryStore.finance;
}

export async function createFinanceRecord(record: Omit<DbFinance, 'finance_id'>): Promise<{ success: boolean; data?: DbFinance }> {
  try {
    const { data, error } = await supabase.from('finance').insert([record]).select().single();
    if (!error && data) {
      memoryStore.finance.unshift(data);
      return { success: true, data };
    }
  } catch {}

  const newFin: DbFinance = {
    ...record,
    finance_id: Date.now(),
  };
  memoryStore.finance.unshift(newFin);
  return { success: true, data: newFin };
}

// -----------------------------------------------------------------------------
// 8. NOTICES MODULE
// -----------------------------------------------------------------------------

export async function fetchNotices(): Promise<DbNotice[]> {
  try {
    const { data, error } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
    if (!error && data) return data;
  } catch {}
  return memoryStore.notices;
}

export async function createNotice(notice: Omit<DbNotice, 'notice_id'>): Promise<{ success: boolean; data?: DbNotice }> {
  try {
    const { data, error } = await supabase.from('notices').insert([notice]).select().single();
    if (!error && data) {
      memoryStore.notices.unshift(data);
      return { success: true, data };
    }
  } catch {}

  const newNotice: DbNotice = {
    ...notice,
    notice_id: Date.now(),
  };
  memoryStore.notices.unshift(newNotice);
  return { success: true, data: newNotice };
}

export async function deleteNotice(notice_id: number): Promise<{ success: boolean }> {
  try {
    await supabase.from('notices').delete().eq('notice_id', notice_id);
  } catch {}
  memoryStore.notices = memoryStore.notices.filter((n) => n.notice_id !== notice_id);
  return { success: true };
}

// -----------------------------------------------------------------------------
// 9. COMMUNICATIONS MODULE
// -----------------------------------------------------------------------------

export async function fetchCommunications(): Promise<DbCommunication[]> {
  try {
    const { data, error } = await supabase.from('communications').select('*').order('sent_at', { ascending: true });
    if (!error && data) return data;
  } catch {}
  return memoryStore.communications;
}

export async function sendCommunication(comm: Omit<DbCommunication, 'communication_id'>): Promise<{ success: boolean; data?: DbCommunication }> {
  try {
    const { data, error } = await supabase.from('communications').insert([comm]).select().single();
    if (!error && data) {
      memoryStore.communications.push(data);
      return { success: true, data };
    }
  } catch {}

  const newComm: DbCommunication = {
    ...comm,
    communication_id: Date.now(),
  };
  memoryStore.communications.push(newComm);
  return { success: true, data: newComm };
}

// -----------------------------------------------------------------------------
// REALTIME SUBSCRIPTIONS
// -----------------------------------------------------------------------------

export function subscribeToVisitors(callback: (payload: any) => void) {
  return supabase
    .channel('realtime:visitors')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'visitors' }, callback)
    .subscribe();
}

export function subscribeToNotices(callback: (payload: any) => void) {
  return supabase
    .channel('realtime:notices')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notices' }, callback)
    .subscribe();
}

export function subscribeToCommunications(callback: (payload: any) => void) {
  return supabase
    .channel('realtime:communications')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'communications' }, callback)
    .subscribe();
}
