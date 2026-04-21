import api from '../axios';

export const authService = {
  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  signup: async (userData: any) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },
  
  verifyEmail: async (email: string, code: string) => {
    const response = await api.post('/auth/verify-email', { email, verificationCode: code });
    return response.data;
  },

  resendVerification: async (email: string) => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  },

  googleLogin: async (idToken: string) => {
    const response = await api.post('/auth/google', { idToken });
    return response.data;
  },

  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  requestPasswordReset: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (email: string, token: string, newPassword: string ) => {
    const response = await api.post('/auth/reset-password', { email, token, newPassword });
    return response.data;
  },
};
