import React, { useState, useEffect } from "react";
import { collaborationApi } from "../../../api/board.api";
import { accountSettingsApi } from "../../../api/accountSettings.api";
import type { Collaborator, User } from "@sefirah/shared";
import "./ShareModal.css";

interface ShareModalProps {
  boardId: string;
  ownerId: string;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ boardId, ownerId, onClose }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Invite by email state
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  // Invite link state
  const [linkRole, setLinkRole] = useState<"viewer" | "editor">("viewer");
  const [expiresInHours, setExpiresInHours] = useState(72);
  const [generatedLink, setGeneratedLink] = useState<{
    inviteUrl: string;
    expiresAt: string;
  } | null>(null);
  const [linkError, setLinkError] = useState("");
  const [copied, setCopied] = useState(false);

  const isOwner = currentUser?.id === ownerId;

  // Load current user and collaborators list
  useEffect(() => {
    const initModal = async () => {
      try {
        setLoading(true);
        const [meRes, collabRes] = await Promise.all([
          accountSettingsApi.getMe(),
          collaborationApi.getCollaborators(boardId),
        ]);
        const userProfile = (meRes as any).data || meRes;
        setCurrentUser(userProfile);
        setCollaborators(collabRes);
      } catch (err) {
        console.error("Failed to load share settings:", err);
      } finally {
        setLoading(false);
      }
    };

    initModal();
  }, [boardId]);

  // Handle invitation submission
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setInviteError("");
    setInviteSuccess("");
    setActionLoading(true);

    try {
      const newCollab = await collaborationApi.inviteCollaborator(boardId, {
        email: email.trim().toLowerCase(),
        role,
      });

      // Add to list or refresh list
      setCollaborators((prev) => [...prev, newCollab]);
      setEmail("");
      setInviteSuccess(`Successfully invited ${email}!`);
    } catch (err: any) {
      console.error(err);
      const errMsg =
        err.response?.data?.message || err.message || "Failed to invite collaborator";
      setInviteError(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: "viewer" | "editor") => {
    try {
      setActionLoading(true);
      const updated = await collaborationApi.updateCollaboratorRole(
        boardId,
        userId,
        newRole
      );
      setCollaborators((prev) =>
        prev.map((c) => (c.userId === userId ? updated : c))
      );
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update role");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle revoking collaborator access
  const handleRemoveCollaborator = async (userId: string) => {
    const confirmMsg =
      userId === currentUser?.id
        ? "Are you sure you want to leave this board?"
        : "Are you sure you want to remove this collaborator?";
    if (!window.confirm(confirmMsg)) return;

    try {
      setActionLoading(true);
      await collaborationApi.removeCollaborator(boardId, userId);
      setCollaborators((prev) => prev.filter((c) => c.userId !== userId));
      
      // If the user left themselves, close modal/navigate away
      if (userId === currentUser?.id) {
        onClose();
        window.location.reload(); // Reload or redirect to dashboard
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to remove collaborator");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle generating invite link
  const handleGenerateLink = async () => {
    setLinkError("");
    setGeneratedLink(null);
    setCopied(false);
    setActionLoading(true);

    try {
      const linkData = await collaborationApi.generateInviteLink(boardId, {
        role: linkRole,
        expiresInHours,
      });
      setGeneratedLink({
        inviteUrl: linkData.inviteUrl,
        expiresAt: linkData.expiresAt,
      });
    } catch (err: any) {
      console.error(err);
      setLinkError(err.response?.data?.message || "Failed to generate link");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal__header">
          <h2>Share board</h2>
          <button className="share-modal__close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {loading ? (
          <div className="share-modal__loading">
            <div className="share-modal__spinner"></div>
            <p>Loading share settings...</p>
          </div>
        ) : (
          <div className="share-modal__content">
            {/* INVITATION FORM (Owner Only) */}
            {isOwner ? (
              <form className="share-modal__section share-modal__invite-form" onSubmit={handleInvite}>
                <h3 className="share-modal__section-title">Invite via Email</h3>
                <div className="share-modal__form-row">
                  <input
                    type="email"
                    placeholder="Enter email address..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="share-modal__input"
                    required
                    disabled={actionLoading}
                  />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as "viewer" | "editor")}
                    className="share-modal__select"
                    disabled={actionLoading}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button
                    type="submit"
                    className="share-modal__btn share-modal__btn--primary"
                    disabled={actionLoading || !email.trim()}
                  >
                    Invite
                  </button>
                </div>
                {inviteError && <p className="share-modal__feedback share-modal__feedback--error">{inviteError}</p>}
                {inviteSuccess && <p className="share-modal__feedback share-modal__feedback--success">{inviteSuccess}</p>}
              </form>
            ) : (
              <div className="share-modal__section">
                <p className="share-modal__note">Only the owner can invite new members or manage roles.</p>
              </div>
            )}

            {/* GENERATE INVITE LINK (Owner Only) */}
            {isOwner && (
              <div className="share-modal__section share-modal__link-section">
                <h3 className="share-modal__section-title">Invite Link</h3>
                <div className="share-modal__form-row">
                  <div className="share-modal__form-group">
                    <label>Link Role</label>
                    <select
                      value={linkRole}
                      onChange={(e) => setLinkRole(e.target.value as "viewer" | "editor")}
                      className="share-modal__select"
                      disabled={actionLoading}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                    </select>
                  </div>
                  <div className="share-modal__form-group">
                    <label>Expires In</label>
                    <select
                      value={expiresInHours}
                      onChange={(e) => setExpiresInHours(Number(e.target.value))}
                      className="share-modal__select"
                      disabled={actionLoading}
                    >
                      <option value={1}>1 hour</option>
                      <option value={24}>24 hours</option>
                      <option value={72}>3 days</option>
                      <option value={168}>7 days</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateLink}
                    className="share-modal__btn share-modal__btn--secondary"
                    disabled={actionLoading}
                  >
                    Create Link
                  </button>
                </div>

                {linkError && <p className="share-modal__feedback share-modal__feedback--error">{linkError}</p>}

                {generatedLink && (
                  <div className="share-modal__link-display">
                    <input
                      type="text"
                      value={generatedLink.inviteUrl}
                      readOnly
                      className="share-modal__input share-modal__input--readonly"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className={`share-modal__btn ${copied ? "share-modal__btn--success" : "share-modal__btn--primary"}`}
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <span className="share-modal__expiry">
                      Expires: {formatDate(generatedLink.expiresAt)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* COLLABORATORS LIST */}
            <div className="share-modal__section share-modal__members-section">
              <h3 className="share-modal__section-title">Members with Access</h3>
              <div className="share-modal__members-list">
                {/* Board Owner */}
                <div className="share-modal__member-item share-modal__member-item--owner">
                  <div className="share-modal__member-info">
                    <div className="share-modal__avatar share-modal__avatar--owner">
                      👑
                    </div>
                    <div>
                      <span className="share-modal__member-name">Board Owner</span>
                      <span className="share-modal__member-badge">Owner</span>
                    </div>
                  </div>
                  <span className="share-modal__role-text">Owner</span>
                </div>

                {/* Other Collaborators */}
                {collaborators.length === 0 ? (
                  <p className="share-modal__no-collaborators">No other members have access yet.</p>
                ) : (
                  collaborators.map((collab) => {
                    const initials = collab.fullName
                      .trim()
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join("")
                      .toUpperCase();

                    return (
                      <div key={collab.userId} className="share-modal__member-item">
                        <div className="share-modal__member-info">
                          {collab.avatarUrl ? (
                            <img
                              src={collab.avatarUrl}
                              alt={collab.fullName}
                              className="share-modal__avatar"
                            />
                          ) : (
                            <div className="share-modal__avatar share-modal__avatar--text">
                              {initials || "?"}
                            </div>
                          )}
                          <div className="share-modal__member-details">
                            <span className="share-modal__member-name">{collab.fullName}</span>
                            <span className="share-modal__member-email">{collab.email}</span>
                          </div>
                        </div>

                        <div className="share-modal__member-actions">
                          {isOwner ? (
                            <>
                              <select
                                value={collab.role}
                                onChange={(e) =>
                                  handleRoleChange(
                                    collab.userId,
                                    e.target.value as "viewer" | "editor"
                                  )
                                }
                                className="share-modal__select share-modal__select--small"
                                disabled={actionLoading}
                              >
                                <option value="viewer">Viewer</option>
                                <option value="editor">Editor</option>
                              </select>
                              <button
                                onClick={() => handleRemoveCollaborator(collab.userId)}
                                className="share-modal__revoke-btn"
                                title="Revoke access"
                                disabled={actionLoading}
                              >
                                &times;
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="share-modal__role-text">
                                {collab.role.charAt(0).toUpperCase() + collab.role.slice(1)}
                              </span>
                              {collab.userId === currentUser?.id && (
                                <button
                                  onClick={() => handleRemoveCollaborator(collab.userId)}
                                  className="share-modal__leave-btn"
                                  title="Leave Board"
                                  disabled={actionLoading}
                                >
                                  Leave
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareModal;
