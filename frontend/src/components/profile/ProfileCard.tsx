import { useEffect, useState } from 'react';
import { Check, Images, X, Trash2} from "lucide-react";
import Avatar, { type AvatarId } from './Avatar';
import AvatarModal from './AvatarModal';
import DeleteAccount from './DeleteModal';

function buildPath(route:string) : string
{
  if (import.meta.env.MODE != 'development'){
    return '/' + route; 
  }
  else{
    return 'http://localhost:5000/' + route;
  }
}

export default function Profile() {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [avatarId, setAvatarId] = useState<AvatarId>("default");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetch(buildPath("api/auth/me"), { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) return;
        setUserId(data.user.id);
        setUsername(data.user.username);
        setEmail(data.user.email);
        setAvatarId(data.user.avatarId ?? "default");
      })
      .catch(() => console.error("Failed to load profile"));
  }, []);

  const handleAvatarSave = async (id: AvatarId) => {
    try {
      const res = await fetch(buildPath(`api/users/${userId}/username`), {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarId: id }),
      });

      if (!res.ok) {
        alert("Failed to update avatar.");
        return;
      }

      setAvatarId(id);
      setShowAvatarPicker(false);
    } catch {
      alert("Network error. Please try again.");
    }
  };

  const handleProfileSave = async () => {
    if (!username.trim()) return;

    try {
      const res = await fetch(buildPath(`api/users/${userId}/username`), {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (res.status === 409) {
        alert("Username already taken.");
      } 
      else if (!res.ok) {
        alert(data.message ?? "Failed to update profile.");
      } 
      else {
        setUsername(data.username);
        alert("Profile saved!");
      
      } 
    }catch {
      alert("Network error. Please try again.");
    }
  };

  const handlePasswordSave = () => {
    setPasswordError("");
    setPasswordSuccess("");
  
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 10) {
      setPasswordError("Password must be at least 10 characters.");
      return;
    }

    setPasswordSuccess("Password updated successfully.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleDeleteAccount = async () => {
  try {
    const res = await fetch(buildPath(`api/users/${userId}`), {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      alert("Failed to delete account.");
      return;
    }

    // Clear session and redirect to login/home
    window.location.href = "/";
    } catch {
      alert("Network error. Please try again.");
    }
  };

  const input = `
    w-full px-4 py-[0.7rem]
    font-sans text-[0.93rem] text-base-content
    bg-base-100 border border-primary/20 rounded-[3px]
    placeholder:text-secondary/80
    outline-none
    focus:border-primary focus:ring-2 focus:ring-primary/30
    transition-all duration-150
  `;
 
  const disabledInput = `
    w-full px-4 py-[0.7rem]
    font-sans text-[0.93rem] text-secondary/80
    bg-base-100 border border-primary/20 rounded-[3px]
    outline-none cursor-not-allowed
  `;
 
  const sectionLabel = `
    font-sans text-[0.85rem] font-semibold tracking-[0.18em] uppercase text-secondary
  `;
 
  const fieldLabel = `
    font-sans text-[0.85rem] <text-secondary />
    <90></90> font-medium
  `;
 
  const primaryButton = `
    w-full flex items-center justify-center gap-2
    font-sans text-[0.76rem] font-semibold tracking-[0.1em] uppercase
    bg-primary text-primary-content
    px-6 py-[0.82rem] rounded-[3px] border-none
    transition-colors duration-200 hover:bg-primary-focus
    cursor-pointer
  `;
 
  const outlineButton = `
    w-full flex items-center justify-center
    font-sans text-[0.76rem] font-semibold tracking-[0.1em] uppercase
    bg-transparent text-primary
    px-6 py-[0.75rem] rounded-[3px]
    border border-primary/80
    transition-colors duration-200 hover:bg-primary/10
    cursor-pointer
  `;
 
  const divider = "border-t border-primary/30";
  
  return (
    <main
      className="page-setup
        relative min-h-screen flex flex-col items-center justify-center
        pt-28 pb-20 px-8 overflow-hidden bg-base-200 
      "
    >
    {/* Avatar Picker Modal */}
    {showAvatarPicker && (
      <AvatarModal
        current={avatarId}
        onConfirm={(id) => { handleAvatarSave(id); }}
        onClose={() => setShowAvatarPicker(false)}
        sectionLabel={sectionLabel}
        primaryButton={primaryButton}
        outlineButton={outlineButton}
      />
    )}
      <div className="profile-card 
        relative z-[4] flex flex-col items-center w-full">
        <div
          className="input-fields-container
            flex flex-col gap-6
            bg-base-100 border border-primary/20 border-t-[3px] border-t-primary
            rounded px-9 py-8
            w-full max-w-[460px]
          "
        >
          <p className={sectionLabel}>
            Profile Settings
          </p>
 
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <Avatar avatarId={avatarId} size="md" />
            <button className={primaryButton} onClick={() => {
              setShowAvatarPicker(true);
            }}>
              <Images className="h-5 w-5" />
              Change picture
            </button>
          </div>
 
          <div className={divider} />
 
          {/* Account info */}
          <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); handleProfileSave(); }}>
            <p className={sectionLabel}>Account info</p>
 
            <div className="flex flex-col gap-1.5 group">
              <label htmlFor="email" className={fieldLabel}>Email</label>
              <input
                id="email"
                type="email"
                value={email}
                disabled
                className={disabledInput}
              />
              <span className="hidden group-hover:block font-sans text-[0.72rem] text-soil opacity-90">
                Email cannot be changed at this time.
              </span>
            </div>
 
            <div className="flex flex-col gap-1.5">
              <label className={fieldLabel}>Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className={input}
              />
            </div>
 
            <button type="submit" className={primaryButton}>Save Changes</button>
          </form>
 
          <div className={divider} />
 
          {/* Change password*/}
          <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); handlePasswordSave(); }}>
            <p className={sectionLabel}>Change password</p>
 
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="current-password" className={fieldLabel}>Current password</label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={input}
                />
              </div>
 
              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-password" className={fieldLabel}>New password</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={input}
                />
              </div>
 
              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm-password" className={fieldLabel}>Confirm new password</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={input}
                />
              </div>
            </div>
 
            {passwordError && (
              <p className="font-sans text-[0.84rem] text-error -mt-1">
                <X className="inline-block mr-2 mb-1" />
                {passwordError}
              </p>
            )}
            {passwordSuccess && (
              <p className="font-sans text-[0.84rem] text-success -mt-1">
                <Check className="inline-block mr-2 mb-1" />
                {passwordSuccess}
              </p>
            )}
 
            <button type="submit" className={primaryButton}>Update password</button>
          </form>
        </div>
      </div>

      {/* Delete Account */}
      <div className="w-full max-w-[460px] mt-4">
        <button
          className="w-full flex items-center justify-center gap-2
            font-sans text-[0.76rem] font-semibold tracking-[0.1em] uppercase
            bg-transparent text-error
            px-6 py-[0.75rem] rounded-[3px]
            border border-error/40
            transition-colors duration-200 hover:bg-error hover:text-white
            cursor-pointer"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 className="h-4 w-4" />
          Delete account
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <DeleteAccount
          onConfirm={handleDeleteAccount}
          onClose={() => setShowDeleteConfirm(false)}
          sectionLabel={sectionLabel}
          outlineButton={outlineButton}
        />
      )}

    </main>
  );
}
