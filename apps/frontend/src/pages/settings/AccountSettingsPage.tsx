import { useRef } from "react";
import { useAccountSettings } from "./useAccountSettings";

export default function AccountSettingsPage() {
  const {
    user,
    fullName,
    setFullName,
    prefs,
    setPrefs,
    security,
    setSecurity,
    deactivate,
    setDeactivate,
    isLoading,
    isSaving,
    saveSuccess,
    passwordError,
    globalError,
    handleAvatarChange,
    handleSaveAll,
    handleDeactivateConfirm,
    handleCancel,
  } = useAccountSettings();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Preview ngay lập tức
    const previewUrl = URL.createObjectURL(file);
    // Tạm ghi đè avatarUrl để hiện preview (hook sẽ sync lại sau khi upload xong)
    handleAvatarChange(file);
    // Hiện preview local trong lúc chờ
    e.target.value = "";
    const img = document.getElementById(
      "avatar-preview",
    ) as HTMLImageElement | null;
    if (img) img.src = previewUrl;
  };

  if (isLoading) {
    return (
      <div
        style={{
          ...S.page,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={S.spinner} />
      </div>
    );
  }

  return (
    <div style={S.page}>
      {/* Page header */}
      <div style={S.header}>
        <h1 style={S.headerTitle}>Account Settings</h1>
        <p style={S.headerSub}>
          Manage your personal information, security, and workspace preferences.
        </p>
      </div>

      {/* Global error */}
      {globalError && (
        <div style={S.errorBanner}>
          <IconAlert />
          <span>{globalError}</span>
        </div>
      )}

      <div style={S.card}>
        {/* ── Profile Information ───────────────────────────────────────── */}
        <section style={S.section}>
          <SectionHeader icon={<IconUser />} title="Profile Information" />

          <div style={S.profileRow}>
            {/* Avatar */}
            <div style={S.avatarWrapper}>
              <div style={S.avatar}>
                {user.avatarUrl ? (
                  <img
                    id="avatar-preview"
                    src={user.avatarUrl}
                    alt="avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                  <img
                    id="avatar-preview"
                    src=""
                    alt=""
                    style={{ display: "none" }}
                  />
                )}
                {!user.avatarUrl && <IconDefaultAvatar />}
              </div>
              <button
                style={S.avatarBtn}
                onClick={() => fileInputRef.current?.click()}
                title="Đổi ảnh"
              >
                <IconUpload />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={onFileChange}
              />
            </div>

            {/* Fields */}
            <div style={S.profileFields}>
              <Field label="FULL NAME">
                <input
                  style={S.input}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </Field>
              {/* Email chỉ hiển thị, không edit được (backend không có endpoint đổi email) */}
              <Field label="EMAIL ADDRESS">
                <input
                  style={{
                    ...S.input,
                    background: "#f3f4f6",
                    color: "#9ca3af",
                    cursor: "not-allowed",
                  }}
                  value={user.email}
                  readOnly
                  title="Email không thể thay đổi"
                />
              </Field>
            </div>
          </div>
        </section>

        <Divider />

        {/* ── Security ─────────────────────────────────────────────────── */}
        <section style={S.section}>
          <SectionHeader icon={<IconShield />} title="Security" />

          <div style={S.securityGrid}>
            <Field label="CURRENT PASSWORD">
              <input
                style={S.input}
                type="password"
                value={security.currentPassword}
                onChange={(e) =>
                  setSecurity((s) => ({
                    ...s,
                    currentPassword: e.target.value,
                  }))
                }
                placeholder="Current password"
              />
            </Field>
            <Field label="NEW PASSWORD">
              <input
                style={S.input}
                type="password"
                value={security.newPassword}
                onChange={(e) =>
                  setSecurity((s) => ({ ...s, newPassword: e.target.value }))
                }
                placeholder="New password"
              />
            </Field>
            <Field label="CONFIRM PASSWORD">
              <input
                style={{
                  ...S.input,
                  borderColor: passwordError ? "#ef4444" : undefined,
                }}
                type="password"
                value={security.confirmPassword}
                onChange={(e) =>
                  setSecurity((s) => ({
                    ...s,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder="Repeat new password"
              />
            </Field>
          </div>

          {passwordError && <p style={S.errorText}>{passwordError}</p>}
          <p style={S.hintText}>
            Để trống nếu không muốn đổi mật khẩu. Sau khi đổi bạn sẽ cần đăng
            nhập lại.
          </p>
        </section>

        <Divider />

        {/* ── Preferences ──────────────────────────────────────────────── */}
        <section style={S.section}>
          <SectionHeader icon={<IconSliders />} title="Preferences" />

          <PreferenceRow
            label="Email Notifications"
            description="Receive weekly digests and important updates."
            checked={prefs.emailNotifications}
            onChange={(v) => setPrefs((p) => ({ ...p, emailNotifications: v }))}
          />
          <PreferenceRow
            label="Real-time Cursor Visibility"
            description="Show your cursor position to collaborators."
            checked={prefs.cursorVisibility}
            onChange={(v) => setPrefs((p) => ({ ...p, cursorVisibility: v }))}
            last
          />
        </section>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div style={S.footer}>
        <button
          style={S.deactivateBtn}
          onClick={() => setDeactivate((d) => ({ ...d, isOpen: true }))}
        >
          <IconTrash />
          Deactivate Account
        </button>
        <div style={{ display: "flex", gap: 12 }}>
          <button style={S.cancelBtn} onClick={handleCancel}>
            Cancel
          </button>
          <button
            style={{ ...S.saveBtn, opacity: isSaving ? 0.7 : 1 }}
            onClick={handleSaveAll}
            disabled={isSaving}
          >
            {isSaving
              ? "Saving…"
              : saveSuccess
                ? "✓ Saved!"
                : "Save All Changes"}
          </button>
        </div>
      </div>

      {/* ── Deactivate confirm modal ──────────────────────────────────────── */}
      {deactivate.isOpen && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <h3 style={S.modalTitle}>Vô hiệu hoá tài khoản</h3>
            <p style={S.modalDesc}>
              Hành động này sẽ xoá toàn bộ dữ liệu của bạn và{" "}
              <strong>không thể hoàn tác</strong>. Nhập mật khẩu để xác nhận.
            </p>
            <input
              style={{ ...S.input, marginBottom: 16 }}
              type="password"
              placeholder="Nhập mật khẩu của bạn"
              value={deactivate.password}
              onChange={(e) =>
                setDeactivate((d) => ({ ...d, password: e.target.value }))
              }
            />
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                style={S.cancelBtn}
                onClick={() => setDeactivate({ password: "", isOpen: false })}
              >
                Huỷ
              </button>
              <button
                style={{ ...S.saveBtn, background: "#ef4444" }}
                onClick={handleDeactivateConfirm}
              >
                Xác nhận xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div style={S.sectionHeader}>
      {icon}
      <h2 style={S.sectionTitle}>{title}</h2>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={S.fieldGroup}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={S.divider} />;
}

function PreferenceRow({
  label,
  description,
  checked,
  onChange,
  last,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <div
      style={{
        ...S.prefItem,
        borderBottom: last ? "none" : "1px solid #f3f4f6",
      }}
    >
      <div>
        <p style={S.prefLabel}>{label}</p>
        <p style={S.prefDesc}>{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: "none",
        cursor: "pointer",
        background: checked ? "#3b7de8" : "#d1d5db",
        position: "relative",
        flexShrink: 0,
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
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

const IconUser = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#3b7de8"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconShield = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#3b7de8"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconSliders = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#3b7de8"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="8" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
    <circle cx="4" cy="6" r="2" fill="#3b7de8" stroke="none" />
    <circle cx="8" cy="12" r="2" fill="#3b7de8" stroke="none" />
    <circle cx="4" cy="18" r="2" fill="#3b7de8" stroke="none" />
  </svg>
);
const IconAlert = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#ef4444"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IconUpload = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
    <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
  </svg>
);
const IconDefaultAvatar = () => (
  <svg width="60" height="60" viewBox="0 0 24 24" fill="#64748b">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);
const IconTrash = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#ef4444"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ marginRight: 6 }}
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

// ─── Styles ────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
    background: "#f0f2f5",
    minHeight: "100vh",
    padding: "32px 24px 60px",
    boxSizing: "border-box",
  },
  spinner: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "3px solid #e5e7eb",
    borderTopColor: "#3b7de8",
  },
  header: { maxWidth: 980, margin: "0 auto 20px" },
  headerTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 6px",
    letterSpacing: "-0.5px",
  },
  headerSub: { fontSize: 14, color: "#6b7280", margin: 0 },
  errorBanner: {
    maxWidth: 980,
    margin: "0 auto 16px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "10px 16px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#ef4444",
    fontSize: 13,
  },
  card: {
    maxWidth: 980,
    margin: "0 auto",
    background: "white",
    borderRadius: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.06)",
  },
  section: { padding: "32px 36px" },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  sectionTitle: { fontSize: 17, fontWeight: 600, color: "#111827", margin: 0 },
  divider: { height: 1, background: "#f0f2f5", margin: "0 36px" },
  profileRow: { display: "flex", alignItems: "flex-start", gap: 28 },
  avatarWrapper: { position: "relative", flexShrink: 0 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: "50%",
    background: "#1e293b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarBtn: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "#3b7de8",
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
    gap: "16px 20px",
    alignItems: "start",
  },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: "#9ca3af",
    letterSpacing: "0.06em",
  },
  input: {
    height: 42,
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    padding: "0 14px",
    fontSize: 14,
    color: "#1f2937",
    background: "#f9fafb",
    outline: "none",
    transition: "border-color 0.15s",
    boxSizing: "border-box",
    width: "100%",
  },
  securityGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "0 20px",
  },
  errorText: { color: "#ef4444", fontSize: 13, marginTop: 10, marginBottom: 0 },
  hintText: { color: "#9ca3af", fontSize: 12, marginTop: 8, marginBottom: 0 },
  prefItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 0",
  },
  prefLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "#111827",
    margin: "0 0 3px",
  },
  prefDesc: { fontSize: 13, color: "#9ca3af", margin: 0 },
  footer: {
    maxWidth: 980,
    margin: "24px auto 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deactivateBtn: {
    display: "flex",
    alignItems: "center",
    background: "none",
    border: "none",
    color: "#ef4444",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    padding: "8px 0",
  },
  cancelBtn: {
    height: 40,
    padding: "0 20px",
    background: "white",
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 14,
    color: "#374151",
    fontWeight: 500,
    cursor: "pointer",
  },
  saveBtn: {
    height: 40,
    padding: "0 22px",
    background: "#3b7de8",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "-0.1px",
    transition: "opacity 0.2s",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "white",
    borderRadius: 16,
    padding: 28,
    width: 420,
    maxWidth: "90vw",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 10px",
  },
  modalDesc: {
    fontSize: 14,
    color: "#6b7280",
    margin: "0 0 20px",
    lineHeight: 1.6,
  },
};
