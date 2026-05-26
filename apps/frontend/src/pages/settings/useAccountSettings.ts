import { useState, useEffect } from 'react';
import { accountSettingsApi } from '../../api/accountSettings.api';
import type { User, UserPreferences } from '@sefirah/shared';

// ─── Local form shapes ────────────────────────────────────────────────────────

interface SecurityForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface DeactivateForm {
  password: string;
  isOpen: boolean;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_USER: User = {
  id: '',
  fullName: '',
  email: '',
  avatarUrl: null,
  preferences: { emailNotifications: true, cursorVisibility: true },
  createdAt: '',
  updatedAt: '',
};

const DEFAULT_SECURITY: SecurityForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAccountSettings = () => {
  const [user, setUser] = useState<User>(DEFAULT_USER);
  // Local editable copy của fullName (email là read-only, không update được)
  const [fullName, setFullName] = useState('');
  const [prefs, setPrefs] = useState<UserPreferences>({
    emailNotifications: true,
    cursorVisibility: true,
  });
  const [security, setSecurity] = useState<SecurityForm>(DEFAULT_SECURITY);
  const [deactivate, setDeactivate] = useState<DeactivateForm>({
    password: '',
    isOpen: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [globalError, setGlobalError] = useState('');

  // ── Helpers ────────────────────────────────────────────────────────────────

  const syncFromUser = (u: User) => {
    setUser(u);
    setFullName(u.fullName);
    setPrefs(u.preferences);
  };

  const extractErrorMessage = (err: any): string => {
    // Backend trả { message, details? }
    return err?.response?.data?.message ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.';
  };

  // ── Load ───────────────────────────────────────────────────────────────────

  const loadData = async () => {
    setIsLoading(true);
    setGlobalError('');
    try {
      // GET /users/me trả về User đầy đủ gồm cả preferences
      const res = await accountSettingsApi.getMe();
      syncFromUser(res.data);
    } catch (err) {
      setGlobalError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Avatar upload ──────────────────────────────────────────────────────────
  // Backend nhận avatarUrl (string URL), không nhận multipart
  // → Bạn cần upload file lên storage (S3/Cloudinary/...) trước,
  //   lấy URL rồi gọi updateProfile({ avatarUrl: url })
  // Hiện tại: dùng FileReader để tạo base64 preview, gọi updateProfile
  const handleAvatarChange = async (file: File) => {
    setGlobalError('');
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await accountSettingsApi.updateProfile({ avatarUrl: base64 });
      syncFromUser(res.data);
    } catch (err) {
      setGlobalError(extractErrorMessage(err));
    }
  };

  // ── Save all ───────────────────────────────────────────────────────────────

  const handleSaveAll = async () => {
    setPasswordError('');
    setGlobalError('');

    // Validate fullName
    if (fullName.trim() === "") {
      setGlobalError("Họ và tên không được để trống.");
      return;
    }

    // Validate password nếu người dùng có nhập
    if (security.newPassword) {
      if (!security.currentPassword) {
        setPasswordError('Vui lòng nhập mật khẩu hiện tại.');
        return;
      }
      if (security.newPassword !== security.confirmPassword) {
        setPasswordError('Mật khẩu mới không khớp.');
        return;
      }
      if (security.newPassword.length < 8) {
        setPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự.');
        return;
      }
    }

    setIsSaving(true);
    try {
      let updatedUser: User | null = null;

      // Chỉ update fullName nếu có thay đổi
      if (fullName.trim() !== user.fullName) {
        const res = await accountSettingsApi.updateProfile({ fullName: fullName.trim() });
        updatedUser = res.data;
      }

      // Chỉ update prefs nếu có thay đổi
      const prefsChanged =
        prefs.emailNotifications !== user.preferences.emailNotifications ||
        prefs.cursorVisibility !== user.preferences.cursorVisibility;
      if (prefsChanged) {
        const res = await accountSettingsApi.updatePreferences(prefs);
        updatedUser = res.data;
      }

      if (updatedUser) {
        syncFromUser(updatedUser);
      }

      // Đổi password riêng (backend sẽ xóa refresh tokens → cần login lại)
      if (security.newPassword) {
        await accountSettingsApi.updatePassword({
          currentPassword: security.currentPassword,
          newPassword: security.newPassword,
        });
        // Backend xóa refresh token → xóa local token, về login
        localStorage.removeItem('access_token');
        alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
        window.location.href = '/login';
        return;
      }

      setSecurity(DEFAULT_SECURITY);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setGlobalError(extractErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  // ── Deactivate ─────────────────────────────────────────────────────────────

  const handleDeactivateConfirm = async () => {
    if (!deactivate.password) {
      setGlobalError('Vui lòng nhập mật khẩu để xác nhận.');
      return;
    }
    try {
      await accountSettingsApi.deactivateAccount({ password: deactivate.password });
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    } catch (err) {
      setGlobalError(extractErrorMessage(err));
      setDeactivate((d) => ({ ...d, password: '' }));
    }
  };

  // ── Cancel ─────────────────────────────────────────────────────────────────

  const handleCancel = () => {
    setPasswordError('');
    setGlobalError('');
    setSecurity(DEFAULT_SECURITY);
    loadData();
  };

  return {
    // Data
    user,
    fullName, setFullName,
    prefs, setPrefs,
    security, setSecurity,
    deactivate, setDeactivate,
    // UI state
    isLoading,
    isSaving,
    saveSuccess,
    passwordError,
    globalError,
    // Handlers
    handleAvatarChange,
    handleSaveAll,
    handleDeactivateConfirm,
    handleCancel,
  };
};