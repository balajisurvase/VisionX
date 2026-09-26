// -----------------------------------------------------------------------------
// Database Schema Types for the 12 Supabase Tables
// -----------------------------------------------------------------------------

export interface DbAdmin {
  admin_id: string; // Primary Key
  name: string;
  email: string;
  phone: number;
  password?: string;
  society_id: string;
  role: string;
}

export interface DbResident {
  resident_id: string; // Primary Key
  name?: string | null;
  tower?: string | null;
  floor?: number | null;
  flat?: string | null;
  email?: string | null;
  phone?: string | null;
  password?: string | null;
  society_id?: string | null;
  status?: string | null;
  role: 'Owner' | 'Tenant' | string;
  tenant_id?: string | null;
  owner_id?: string | null;
}

export interface DbBooking {
  id: string; // Primary Key
  booking_id?: string | null;
  resident_id?: string | null;
  name?: string | null;
  tower?: string | null;
  flat?: number | null;
  amenity_name?: string | null;
  amenity_type?: string | null;
  event_name?: string | null;
  booking_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  charges?: number | null;
  status?: string | null;
  created_at?: string | null;
  society_id?: string | null;
}

export interface DbAmenity {
  id: number; // Primary Key
  amenity_id?: string | null;
  name?: string | null;
  amenity_type?: string | null;
  description?: string | null;
  price?: number | null;
  society_id?: string | null;
  created_at?: string | null;
  base_hours?: number | null;
  extra_hour_charge?: number | null;
  charges?: number | null;
  facilities?: string | null;
}

export interface DbMaintenance {
  id: string; // Primary Key (uuid)
  maintenance_id: string;
  resident_id?: string | null;
  resident_name?: string | null;
  flat_no?: number | null;
  tower?: string | null;
  month?: string | null;
  amount?: number | null;
  status?: string | null;
  due_date?: string | null;
  payment_date?: string | null;
  admin_id?: string | null;
  generated_by?: string | null;
  society_id?: string | null;
  created_at?: string | null;
}

export interface DbComplaint {
  id: string; // Primary Key
  complaint_id?: string | null;
  resident_id?: string | null;
  tower?: string | null;
  flat_no?: number | null;
  description?: string | null;
  status?: string | null;
  category?: string | null;
  complaint_date?: string | null;
  admin_comment?: string | null;
  society_id?: string | null;
}

export interface DbMedia {
  media_id: string; // Primary Key
  complaint_id?: string | null;
  uploaded_by?: string | null;
  society_id?: string | null;
  file_url?: string | null;
  uploaded_at?: string | null;
}

export interface DbVisitor {
  visitor_id: number; // Primary Key
  visitor_name: string;
  visitor_mobile: string;
  visitor_type?: string | null;
  vehicle_number?: string | null;
  profile_photo?: string | null;
  resident_id: string;
  purpose?: string | null;
  entry_time?: string | null;
  exit_time?: string | null;
  status?: string | null;
  security_user_name?: string | null;
  security_user_mobile?: string | null;
  security_user_email?: string | null;
  security_user_shift?: string | null;
  approval_status?: string | null;
  approval_time?: string | null;
  created_at?: string | null;
}

export interface DbSecurity {
  security_user_id: string; // Primary Key
  name: string;
  mobile_number: string;
  email: string;
  password?: string;
  shift: string;
  status?: string | null;
  created_at?: string | null;
}

export interface DbFinance {
  finance_id: number; // Primary Key
  maintenance_id?: number | null;
  resident_id?: number | null;
  finance_type: string; // 'INCOME' | 'EXPENSE'
  category: string;
  description?: string | null;
  amount: number;
  payment_mode?: string | null;
  payment_status?: string | null;
  transaction_date: string;
  party_name?: string | null;
  reference_number?: string | null;
  created_at?: string | null;
}

export interface DbNotice {
  notice_id: number; // Primary Key
  title: string;
  message: string;
  category?: string | null;
  priority?: 'High' | 'Normal' | 'Low' | string | null;
  created_by?: string | null;
  created_at?: string | null;
  status?: string | null;
}

export interface DbCommunication {
  communication_id: number; // Primary Key
  sender_name: string;
  message: string;
  message_type?: string | null;
  sent_at?: string | null;
  status?: string | null;
}

export type UserRole = 'ADMIN' | 'RESIDENT' | 'SECURITY';

export interface AuthSessionUser {
  id: string;
  name: string;
  email?: string;
  phone?: string | number;
  role: UserRole;
  society_id: string;
  tower?: string | null;
  flat?: string | number | null;
  shift?: string | null;
}
