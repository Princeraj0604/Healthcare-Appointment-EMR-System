import api from '@/lib/api';

export const doctorApi = {
  getDoctors: async (params?: Record<string, any>) => {
    const response = await api.get('/doctors', { params });
    return response.data;
  },

  getDoctorById: async (id: string) => {
    const response = await api.get(`/doctors/${id}`);
    return response.data.data;
  },

  getDoctorAvailability: async (id: string, date: string) => {
    const response = await api.get(`/doctors/${id}/availability`, { params: { date } });
    return response.data.data;
  },

  getDoctorReviews: async (id: string, page = 1) => {
    const response = await api.get(`/doctors/${id}/reviews`, { params: { page } });
    return response.data;
  },

  updateProfile: async (data: Record<string, any>) => {
    const response = await api.put('/doctors/profile', data);
    return response.data.data;
  },

  setAvailability: async (schedules: any[]) => {
    const response = await api.put('/doctors/availability', { schedules });
    return response.data;
  },
};

export const appointmentApi = {
  bookAppointment: async (data: { doctorId: string; scheduledAt: string; type?: string; symptoms?: string }) => {
    const response = await api.post('/appointments', data);
    return response.data.data;
  },

  getMyAppointments: async (params?: Record<string, any>) => {
    const response = await api.get('/appointments', { params });
    return response.data;
  },

  getAppointmentById: async (id: string) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data.data;
  },

  cancelAppointment: async (id: string, cancelReason: string) => {
    const response = await api.put(`/appointments/${id}/cancel`, { cancelReason });
    return response.data;
  },

  updateStatus: async (id: string, status: string, notes?: string) => {
    const response = await api.put(`/appointments/${id}/status`, { status, notes });
    return response.data;
  },
};

export const paymentApi = {
  createOrder: async (appointmentId: string) => {
    const response = await api.post('/payments/create-order', { appointmentId });
    return response.data.data;
  },

  verifyPayment: async (data: { appointmentId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) => {
    const response = await api.post('/payments/verify', data);
    return response.data;
  },
};

export const medicalRecordApi = {
  getPatientHistory: async (patientUserId: string, page = 1) => {
    const response = await api.get(`/medical-records/patient/${patientUserId}`, { params: { page } });
    return response.data;
  },

  getRecordByAppointment: async (appointmentId: string) => {
    const response = await api.get(`/medical-records/appointment/${appointmentId}`);
    return response.data.data;
  },

  createRecord: async (data: any) => {
    const response = await api.post('/medical-records', data);
    return response.data.data;
  },
};

export const notificationApi = {
  getNotifications: async (page = 1) => {
    const response = await api.get('/notifications', { params: { page } });
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  },
};

export const adminApi = {
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard-stats');
    return response.data.data;
  },

  getUsers: async (params?: Record<string, any>) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  approveDoctor: async (doctorId: string, isApproved: boolean) => {
    const response = await api.put(`/admin/doctors/${doctorId}/approve`, { isApproved });
    return response.data;
  },
};
