import axiosClient from './axiosClient';
import type {
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest
} from '../types/auth.types';

const AUTH_URL = '/api/v1/auth';

export const authApi = {
    login: (data: LoginRequest) => {
        return axiosClient.post<AuthResponse>(`${AUTH_URL}/login`, data);
    },

    register: (data: RegisterRequest) => {
        return axiosClient.post<{ message: string }>(`${AUTH_URL}/register`, data);
    },

    forgotPassword: (data: ForgotPasswordRequest) => {
        return axiosClient.post<{ message: string }>(`${AUTH_URL}/forgot-password`, data);
    },

    resetPassword: (data: ResetPasswordRequest) => {
        return axiosClient.post<{ message: string }>(`${AUTH_URL}/reset-password`, data);
    },

    // OAuth endpoints
    loginWithGoogle: (token: string) => {
        return axiosClient.post<AuthResponse>(`${AUTH_URL}/oauth/google`, { token });
    },

    loginWithGithub: (code: string) => {
        return axiosClient.post<AuthResponse>(`${AUTH_URL}/oauth/github`, { code });
    }
};