export interface OfficerUser {
  id: number;
  user_id: string;
  password_hash?: string;
  full_name: string;
  role: string;
  department: string;
  designation: string;
  badge_number: string;
  terminal: string;
  status: 'Active' | 'Inactive';
  created_at: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: OfficerUser | null;
  rememberMe: boolean;
}
