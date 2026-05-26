import axiosClient from "./axiosClient";
import type {
  User,
  UserPreferences,
  UpdateProfilePayload,
  UpdatePasswordPayload,
  UpdatePreferencesPayload,
  DeactivateAccountPayload,
} from "@sefirah/shared";

export type {
  User,
  UserPreferences,
  UpdateProfilePayload,
  UpdatePasswordPayload,
  UpdatePreferencesPayload,
  DeactivateAccountPayload,
};

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
