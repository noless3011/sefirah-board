import React, { useState, useRef } from "react";

// 1. Interfaces
interface ProfileData {
  fullName: string;
  email: string;
  avatarUrl: string | null;
}
interface SecurityData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
interface PreferencesData {
  emailNotifications: boolean;
  cursorVisibility: boolean;
}

export default function AccountSettingsPage() {
  // 2. States (Cập nhật tên theo mẫu)
  const [profile, setProfile] = useState<ProfileData>({
    fullName: "",
    email: "",
    avatarUrl: null, // Sẽ hiện ảnh mặc định nếu null
  });
  const [security, setSecurity] = useState<SecurityData>({
    currentPassword: "········", // Chỉ hiển thị dạng dot
    newPassword: "",
    confirmPassword: "",
  });
  const [prefs, setPrefs] = useState<PreferencesData>({
    emailNotifications: true,
    cursorVisibility: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3. Handlers (Giữ nguyên logic)
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfile((p) => ({ ...p, avatarUrl: URL.createObjectURL(file) }));
    }
  };

  return (
    <div style={styles.pageWrapper}>
      {/* ─── A. SYSTEM HEADER (Phần bị thiếu) ─── */}
      <header style={styles.sysHeader}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>Sefirah Board</div>
          <div style={styles.searchWrapper}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2"
              style={{ marginRight: 8 }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search boards..."
              style={styles.searchInput}
            />
          </div>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.navLink}>Recent</span>
          <span style={styles.navLink}>Templates</span>
          <span style={styles.navLink}>Shared</span>
          <div style={styles.headerDivider} />
          <button style={styles.iconBtn}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6b7280"
              strokeWidth="2"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9m7.73 13a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          <button style={styles.iconBtn}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6b7280"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button style={styles.shareBtn}>Share</button>
          <div style={styles.userAvatar}>
            {/* Ảnh đại diện nhỏ góc phải */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#a1a1aa">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        </div>
      </header>

      {/* ─── B. PAGE TITLE (Phần bị thiếu) ─── */}
      <div style={styles.mainContent}>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Account Settings</h1>
          <p style={styles.pageSubTitle}>
            Manage your personal information, security, and workspace
            preferences.
          </p>
        </div>

        {/* ─── C. MAIN SETTINGS CARD (Phần bạn đang làm) ─── */}
        <div style={styles.card}>
          {/* Profile Section */}
          <section style={styles.section}>
            <div style={styles.sectionTitleRow}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                style={{ marginRight: 8 }}
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <h2 style={styles.sectionTitle}>Profile Information</h2>
            </div>

            <div style={styles.profileContent}>
              <div style={styles.avatarBlock}>
                <div style={styles.bigAvatar}>
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt="avatar"
                      style={styles.avatarImg}
                    />
                  ) : (
                    <svg
                      width="50"
                      height="50"
                      viewBox="0 0 24 24"
                      fill="#a1a1aa"
                    >
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                  )}
                  <button
                    style={styles.avatarEditBtn}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                    </svg>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleAvatarChange}
                />
              </div>

              <div style={styles.profileFields}>
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>FULL NAME</label>
                  <input
                    style={styles.flatterInput}
                    value={profile.fullName}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, fullName: e.target.value }))
                    }
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>EMAIL ADDRESS</label>
                  <input
                    style={styles.flatterInput}
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, email: e.target.value }))
                    }
                  />
                </div>
                <button style={styles.updateBtn}>Update Profile</button>
              </div>
            </div>
          </section>

          <div style={styles.divider} />

          {/* Security Section (Sửa Input giống mẫu) */}
          <section style={styles.section}>
            <div style={styles.sectionTitleRow}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                style={{ marginRight: 8 }}
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <h2 style={styles.sectionTitle}>Security</h2>
            </div>
            <div style={styles.securityGrid}>
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>CURRENT PASSWORD</label>
                <input
                  style={styles.flatterInput}
                  type="password"
                  value={security.currentPassword}
                  placeholder="Current password"
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>NEW PASSWORD</label>
                <input
                  style={styles.flatterInput}
                  type="password"
                  placeholder="New password"
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>CONFIRM PASSWORD</label>
                <input
                  style={styles.flatterInput}
                  type="password"
                  placeholder="Repeat new password"
                />
              </div>
            </div>
          </section>

          <div style={styles.divider} />

          {/* Preferences Section (Giữ nguyên) */}
          <section style={styles.section}>
            <div style={styles.sectionTitleRow}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                style={{ marginRight: 8 }}
              >
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
              <h2 style={styles.sectionTitle}>Preferences</h2>
            </div>
            <div style={styles.prefItem}>
              <div>
                <p style={styles.prefLabel}>Email Notifications</p>
                <p style={styles.prefDesc}>
                  Receive weekly digests and important updates.
                </p>
              </div>
              <Toggle
                checked={prefs.emailNotifications}
                onChange={(v) =>
                  setPrefs((p) => ({ ...p, emailNotifications: v }))
                }
              />
            </div>
            {/* Real-time Cursor Visibility (Thêm cho giống mẫu) */}
            <div style={styles.prefItem}>
              <div>
                <p style={styles.prefLabel}>Real-time Cursor Visibility</p>
                <p style={styles.prefDesc}>
                  Show your cursor position to collaborators.
                </p>
              </div>
              <Toggle
                checked={prefs.cursorVisibility}
                onChange={(v) =>
                  setPrefs((p) => ({ ...p, cursorVisibility: v }))
                }
              />
            </div>
          </section>
        </div>

        {/* Footer Buttons */}
        <footer style={styles.pageFooter}>
          <button style={styles.deactivateBtn}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2"
              style={{ marginRight: 6 }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
            Deactivate Account
          </button>
          <div style={{ display: "flex", gap: 12 }}>
            <button style={styles.cancelBtn}>Cancel</button>
            <button style={styles.saveAllBtn}>Save All Changes</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ─── TÍCH HỢP CSS-IN-JS ĐỂ BÁM SÁT MẪU ───
const styles: Record<string, React.CSSProperties> = {
  // A. Page Wrapper & Header Hệ thống
  pageWrapper: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    background: "#f9fafb",
    minHeight: "100vh",
  },
  sysHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    height: 64,
    background: "white",
    borderBottom: "1px solid #e5e7eb",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 32 },
  logo: {
    fontSize: 18,
    fontWeight: 700,
    color: "#111827",
    letterSpacing: "-0.5px",
  },
  searchWrapper: {
    display: "flex",
    alignItems: "center",
    background: "#f3f4f6",
    borderRadius: 8,
    padding: "0 12px",
    height: 38,
    width: 280,
  },
  searchInput: {
    border: "none",
    background: "transparent",
    fontSize: 14,
    outline: "none",
    color: "#1f2937",
    width: "100%",
  },
  headerRight: { display: "flex", alignItems: "center", gap: 16 },
  navLink: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: 500,
    cursor: "pointer",
  },
  headerDivider: { height: 24, width: 1, background: "#e5e7eb" },
  iconBtn: {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
  },
  shareBtn: {
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "8px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #e5e7eb",
  },

  // B. Tiêu đề Trang (Account Settings)
  mainContent: { maxWidth: 1040, margin: "0 auto", padding: "40px 24px" },
  pageHeader: { marginBottom: 32 },
  pageTitle: {
    fontSize: 30,
    fontWeight: 800,
    color: "#111827",
    margin: "0 0 8px",
    letterSpacing: "-1px",
  },
  pageSubTitle: { fontSize: 15, color: "#6b7280", margin: 0, maxWidth: 600 },

  // C. Main Settings Card
  card: {
    background: "white",
    borderRadius: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 10px 40px rgba(0,0,0,0.03)",
    overflow: "hidden",
  },
  section: { padding: "40px 48px" },
  sectionTitleRow: { display: "flex", alignItems: "center", marginBottom: 28 },
  sectionTitle: { fontSize: 17, fontWeight: 600, color: "#111827", margin: 0 },
  divider: { height: 1, background: "#f3f4f6", margin: "0 48px" },

  // Profile Specific
  profileContent: { display: "flex", gap: 40, alignItems: "flex-start" },
  avatarBlock: { position: "relative", flexShrink: 0 },
  bigAvatar: {
    width: 100,
    height: 100,
    borderRadius: "50%",
    background: "#111827",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarEditBtn: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#3b82f6",
    border: "2px solid white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },

  profileFields: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    alignItems: "start",
  },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 8 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#9ca3af",
    letterSpacing: "0.05em",
  },

  // FLATTER INPUT STYLE (Giống mẫu)
  flatterInput: {
    height: 44,
    border: "1.5px solid transparent",
    background: "#f3f4f6",
    borderRadius: 10,
    padding: "0 16px",
    fontSize: 14,
    color: "#1f2937",
    outline: "none",
    transition: "all 0.15s",
  },

  updateBtn: {
    gridColumn: "1/-1",
    width: "fit-content",
    padding: "10px 24px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 8,
  },

  // Security Specific
  securityGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "24px",
  },

  // Preferences Specific
  prefItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 0",
    borderBottom: "1px solid #f9fafb",
  },
  prefLabel: {
    fontSize: 15,
    fontWeight: 600,
    color: "#111827",
    margin: "0 0 4px",
  },
  prefDesc: { fontSize: 14, color: "#9ca3af", margin: 0 },

  // Footer Specific
  pageFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 32,
  },
  deactivateBtn: {
    background: "none",
    border: "none",
    color: "#dc2626",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: 0,
  },
  cancelBtn: {
    padding: "10px 24px",
    background: "white",
    border: "1.5px solid #e5e7eb",
    borderRadius: 10,
    fontSize: 14,
    color: "#374151",
    fontWeight: 500,
    cursor: "pointer",
  },
  saveAllBtn: {
    padding: "11px 26px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};

// ─── TOGGLE COMPONENT (Căn chỉnh nhỏ cho giống mẫu) ───
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: "none",
        cursor: "pointer",
        background: checked ? "#2563eb" : "#d1d5db",
        position: "relative",
        transition: "background 0.2s",
        padding: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "white",
          transition: "left 0.2s",
          boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
        }}
      />
    </button>
  );
}
