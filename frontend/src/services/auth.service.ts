import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'PATIENT' | 'DOCTOR';
  phone?: string;
  specialization?: string;
  qualification?: string;
  experience?: number;
  consultationFee?: number;
  registrationNumber?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: async (data: RegisterPayload) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginPayload) => {
    const response = await api.post('/auth/login', data);
    const { user, accessToken, refreshToken } = response.data.data;
    useAuthStore.getState().setAuth(user, accessToken, refreshToken);
    return response.data;
  },

  logout: async () => {
    const { refreshToken } = useAuthStore.getState();
    try {
      await api.post('/auth/logout', { refreshToken });
    } finally {
      useAuthStore.getState().clearAuth();
    }
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  verifyOTP: async (email: string, otp: string) => {
    const response = await api.post('/auth/verify-otp', {
      email,
      otp,
      purpose: 'EMAIL_VERIFICATION',
    });
    return response.data;
  },

  sendOTP: async (email: string, purpose: string) => {
    const response = await api.post('/auth/send-otp', { email, purpose });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (email: string, otp: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { email, otp, newPassword });
    return response.data;
  },
};
