import axiosClient from "./axiosClient";

// Types khớp với backend schema (userController.ts + @sefirah/shared)

export interface UserPreferences {
  emailNotifications: boolean;
  cursorVisibility: boolean;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

// PATCH /me/profile — chỉ fullName và avatarUrl (KHÔNG có email)
export interface UpdateProfilePayload {
  fullName?: string;
  avatarUrl?: string | null;
}

// PUT /me/password
export interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

// PATCH /me/preferences
export interface UpdatePreferencesPayload {
  emailNotifications?: boolean;
  cursorVisibility?: boolean;
}

// DELETE /me — cần password để xác nhận
export interface DeactivateAccountPayload {
  password: string;
}

// ─────────────────────────────────────────────────────────────────────────────

const USERS_URL = "/users";

export const accountSettingsApi = {
  // GET /users/me → trả về User đầy đủ (gồm cả preferences)
  getMe: () => {
    return axiosClient.get<User>(`${USERS_URL}/me`);
  },

  // PATCH /users/me/profile → trả về User đã cập nhật
  updateProfile: (data: UpdateProfilePayload) => {
    return axiosClient.patch<User>(`${USERS_URL}/me/profile`, data);
  },

  // PUT /users/me/password → trả về { message: string }
  // Lưu ý: dùng PUT (không phải PATCH) theo backend
  // Backend sẽ xóa toàn bộ refresh token sau khi đổi mật khẩu thành công
  updatePassword: (data: UpdatePasswordPayload) => {
    return axiosClient.put<{ message: string }>(
      `${USERS_URL}/me/password`,
      data,
    );
  },

  // PATCH /users/me/preferences → trả về User đã cập nhật
  updatePreferences: (data: UpdatePreferencesPayload) => {
    return axiosClient.patch<User>(`${USERS_URL}/me/preferences`, data);
  },

  // DELETE /users/me — cần gửi password trong body để xác nhận
  deactivateAccount: (data: DeactivateAccountPayload) => {
    return axiosClient.delete<{ message: string }>(`${USERS_URL}/me`, { data });
  },
};
