export interface ProtectedRouteProps {
  children: React.ReactNode;
}

export interface User {
  id?: string;
  email: string;
  name: string;
  farm_id?: string;
  role_id?: string;
  email_verified?: boolean;
  avatar_url?: string;
  phone?: string;
  phone_verified?: boolean;
  created_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (email: string, password: string, name: string, phone: string) => Promise<AuthResponse>;
  logout: () => Promise<AuthResponse>;
  forgotPassword: (email: string) => Promise<AuthResponse>;
  resetPassword: (params: { token: string; currentPassword: string; newPassword: string }) => Promise<AuthResponse>;
  googleAuth: () => Promise<AuthResponse>;
}