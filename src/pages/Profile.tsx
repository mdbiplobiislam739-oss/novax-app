import { useAuth } from "../contexts/AuthContext";
import {
  User as UserIcon,
  Settings,
  Shield,
  History,
  HeadphonesIcon,
  LogOut,
  ChevronRight,
  Wallet,
  X,
  Lock,
  Camera,
  Trophy,
  DownloadCloud,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { store } from "../lib/store";
import { formatXRP } from "../lib/utils";
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { useTranslation } from "../contexts/TranslationContext";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isInstallable, promptInstall } = usePWAInstall();
  const { language, setLanguage, t } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isWithdrawSecurityOpen, setIsWithdrawSecurityOpen] = useState(false);
  const [isAppDownloadOpen, setIsAppDownloadOpen] = useState(false);
  const [isKycOpen, setIsKycOpen] = useState(false);

  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [editTrc20, setEditTrc20] = useState(user?.trc20Address || "");
  const [editUsername, setEditUsername] = useState(user?.username || "");
  const [editAvatar, setEditAvatar] = useState(user?.avatar || "");
  
  const [kycIdNumber, setKycIdNumber] = useState(user?.kycIdNumber || "");
  const [kycPhoto, setKycPhoto] = useState<string | null>(user?.kycPhoto || null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [withdrawPassword, setWithdrawPassword] = useState(
    user?.withdrawPassword || "",
  );
  const [capturedFace, setCapturedFace] = useState<string | null>(
    user?.faceIdData || null,
  );

  const [msg, setMsg] = useState("");

  if (!user) return null;

  const handleSaveProfile = () => {
    store.updateUser(user.id, { phone: editPhone, trc20Address: editTrc20, username: editUsername, avatar: editAvatar });
    setIsEditing(false);
    setMsg("Profile updated successfully!");
    setTimeout(() => setMsg(""), 3000);
  };

  const handleChangePassword = () => {
    if (user.password !== oldPassword) {
      setMsg("Incorrect old password");
      return;
    }
    if (newPassword.length < 4) {
      setMsg("New password too short");
      return;
    }
    store.updateUser(user.id, { password: newPassword });
    setIsChangingPassword(false);
    setOldPassword("");
    setNewPassword("");
    setMsg("Password changed successfully!");
    setTimeout(() => setMsg(""), 3000);
  };

  const handleSaveWithdrawSecurity = () => {
    if (withdrawPassword.length < 4) {
      setMsg("Withdraw password must be at least 4 characters");
      return;
    }
    if (!capturedFace) {
      setMsg("Please capture your face for security");
      return;
    }
    store.updateUser(user.id, { withdrawPassword, faceIdData: capturedFace });
    setIsWithdrawSecurityOpen(false);
    setMsg("Withdraw security updated successfully!");
    setTimeout(() => setMsg(""), 3000);
  };

  const handleFaceCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressedBase64 = await compressImage(file);
      setCapturedFace(compressedBase64);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.6));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleKycPhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressedBase64 = await compressImage(file);
      setKycPhoto(compressedBase64);
    }
  };

  const handleSaveKyc = () => {
    if (!kycIdNumber || kycIdNumber.length < 5) {
      setMsg("Please enter a valid ID Number");
      return;
    }
    if (!kycPhoto) {
      setMsg("Please upload your ID Photo");
      return;
    }
    store.updateUser(user.id, { kycIdNumber, kycPhoto, kycStatus: "pending" });
    setIsKycOpen(false);
    setMsg("KYC Submitted for review!");
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <div className="space-y-4 pb-6 mt-2">
      {msg && (
        <div
          className={`p-3 rounded-xl text-sm border ${msg.includes("Incorrect") || msg.includes("short") ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-green-500/10 border-green-500/20 text-green-500"}`}
        >
          {msg}
        </div>
      )}

      {/* Profile Header */}
      <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden bg-gradient-to-r from-[var(--color-bg-card)] to-[var(--color-bg-base)]">
        {user.avatar ? (
          <img src={user.avatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-brand-primary" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-primary to-brand-gold flex items-center justify-center font-bold text-2xl text-black">
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{user.username}</h2>
            {user.kycStatus === 'approved' && (
              <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/30 flex items-center gap-1 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                <CheckCircle2 size={12} />
                Verified
              </span>
            )}
          </div>
          <div className="text-sm text-text-muted mt-1">
            ID:{" "}
            {user.id
              .replace(/[^0-9]/g, "")
              .padEnd(6, "9")
              .substring(0, 6)}
          </div>
        </div>
        <div className="bg-brand-gold/10 text-brand-gold border border-brand-gold/30 px-3 py-1 rounded-full text-xs font-bold">
          VIP {user.vipLevel}
        </div>
      </div>

      {/* Action Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <div className="relative rounded-2xl sm:rounded-3xl p-3 sm:p-4 overflow-hidden bg-gradient-to-br from-[#FF0013] to-[#80000A] shadow-[0_10px_20px_-5px_rgba(255,0,19,0.4)] flex items-center justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
          <div className="relative z-10 w-full">
            <div className="text-[11px] sm:text-sm font-medium mb-1 text-white/80">
              {t("Total Assets")}
            </div>
            <div className="font-bold text-base sm:text-lg text-white drop-shadow-sm truncate">
              {formatXRP(user.balance)}
            </div>
          </div>
          <Wallet
            className="text-white opacity-90 drop-shadow-md relative z-10 shrink-0 ml-2 w-6 h-6 sm:w-8 sm:h-8"
          />
        </div>
        <div className="glass-panel p-3 sm:p-4 rounded-2xl sm:rounded-3xl flex items-center justify-between">
          <div className="w-full">
            <div className="text-[11px] sm:text-sm text-text-muted mb-1">{t("Total Earned")}</div>
            <div className="font-bold text-base sm:text-lg text-green-500 truncate">
              {formatXRP(user.totalEarnings)}
            </div>
          </div>
          <History className="text-green-500 opacity-50 shrink-0 ml-2 w-6 h-6 sm:w-8 sm:h-8" />
        </div>
      </div>

      {/* Advanced VIP Progress */}
      {(() => {
        const vips = store.getState().vipLevels || [];
        const currentVip =
          vips.find((v) => v.level === user.vipLevel) || vips[0];
        const nextVip = vips.find((v) => v.level === user.vipLevel + 1);

        const totalDeposits = store
          .getState()
          .transactions.filter(
            (t) =>
              t.userId === user.id &&
              t.type === "deposit" &&
              t.status === "completed",
          )
          .reduce((sum, t) => sum + t.amount, 0);

        if (!nextVip) return null; // Max level

        const reqAmount = nextVip.price;
        const progress = Math.min((totalDeposits / reqAmount) * 100, 100);

        return (
          <div className="glass-panel p-4 sm:p-5 rounded-2xl sm:rounded-3xl mt-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full blur-2xl group-hover:bg-brand-gold/20 transition-all pointer-events-none" />
            <div className="flex justify-between items-end mb-2 relative z-10">
              <div>
                <div className="text-xs sm:text-sm text-text-muted mb-1 font-bold">
                  VIP Upgrade Progress
                </div>
                <div className="text-base sm:text-lg font-bold">
                  Next: <span className="text-brand-gold">{nextVip.name}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] sm:text-xs text-text-muted">Total Deposit</div>
                <div className="font-mono text-xs sm:text-sm font-bold truncate max-w-[100px] sm:max-w-none">
                  {formatXRP(totalDeposits)} / {formatXRP(reqAmount)}
                </div>
              </div>
            </div>

            <div className="h-2 sm:h-3 w-full bg-[var(--color-bg-base)] rounded-full overflow-hidden mt-3 shadow-inner relative z-10 border border-[var(--color-border-card)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-full bg-gradient-to-r from-brand-primary to-brand-gold rounded-full relative"
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </motion.div>
            </div>
            <div className="text-[10px] sm:text-xs text-center mt-3 text-text-muted">
              Deposit{" "}
              <span className="font-bold text-white">
                {formatXRP(Math.max(reqAmount - totalDeposits, 0))}
              </span>{" "}
              more to unlock{" "}
              <span className="text-brand-gold">{nextVip.name}</span>!
            </div>
          </div>
        );
      })()}

      {/* Menu Options */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        {user.role === "admin" && (
          <MenuButton
            icon={<Shield className="text-red-500" />}
            label="Admin Dashboard"
            onClick={() => navigate("/admin")}
          />
        )}
        <MenuButton
          icon={<Settings />}
          label="Edit Profile"
          onClick={() => setIsEditing(true)}
        />
        <MenuButton
          icon={<Shield />}
          label="Security Settings"
          onClick={() => setIsChangingPassword(true)}
        />
        <MenuButton
          icon={<UserIcon className={user.kycStatus === 'approved' ? "text-green-500" : user.kycStatus === 'pending' ? "text-yellow-500" : "text-gray-400"} />}
          label={`Identity Verification (KYC) ${user.kycStatus === 'approved' ? '✓' : user.kycStatus === 'pending' ? '(Pending)' : ''}`}
          onClick={() => setIsKycOpen(true)}
        />
        <MenuButton
          icon={<Lock className="text-brand-gold" />}
          label="Withdraw Security (Face ID)"
          onClick={() => setIsWithdrawSecurityOpen(true)}
        />
        <MenuButton
          icon={<History />}
          label={t("Financial Records") || "Financial Records"}
          onClick={() => setIsHistoryOpen(true)}
        />
        
        {/* Language Selection menu */}
        <MenuButton
          icon={<Globe className="text-blue-400" />}
          label={`${t("Language")} (${language})`}
          onClick={() => {
            const langs: ('English' | 'Bengali' | 'Hindi')[] = ['English', 'Bengali', 'Hindi'];
            const currentIndex = langs.indexOf(language);
            const nextLang = langs[(currentIndex + 1) % langs.length];
            setLanguage(nextLang);
            setMsg(`Language changed to ${nextLang}`);
            setTimeout(() => setMsg(""), 3000);
          }}
        />

        <MenuButton
          icon={<DownloadCloud className="text-brand-primary" />}
          label="Download App"
          onClick={() => {
            if (isInstallable) {
              promptInstall();
            } else {
              setIsAppDownloadOpen(true);
            }
          }}
        />
        
        <button
          onClick={logout}
          className="w-full p-4 flex items-center justify-between hover:bg-black/20 transition-colors border-t border-[var(--color-border-card)] text-red-500"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <LogOut size={20} />
            </div>
            <span className="font-medium">Sign Out</span>
          </div>
        </button>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-bold text-text-muted px-2 mb-3 uppercase tracking-wider">
          Live Platform Activity
        </h3>
        <FakeActivityFeed />
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <Modal onClose={() => setIsEditing(false)} title="Edit Profile">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-muted mb-2 block text-center font-bold">Choose Avatar</label>
                
                {/* Boys */}
                <div className="mb-2">
                  <span className="text-xs text-gray-400 block mb-1">Male</span>
                  <div className="flex gap-3 justify-between">
                    {[
                      "https://api.dicebear.com/9.x/micah/svg?seed=Felix",
                      "https://api.dicebear.com/9.x/micah/svg?seed=Jack",
                      "https://api.dicebear.com/9.x/micah/svg?seed=Ryan",
                      "https://api.dicebear.com/9.x/micah/svg?seed=Nolan"
                    ].map((url) => (
                      <button
                        key={url}
                        onClick={() => setEditAvatar(url)}
                        className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${editAvatar === url ? 'border-brand-primary scale-110 shadow-[0_0_10px_var(--color-brand-primary)]' : 'border-transparent opacity-50 hover:opacity-100'}`}
                      >
                        <img src={url} alt="avatar" className="w-full h-full object-cover bg-blue-100/20" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Girls */}
                <div className="mb-4">
                  <span className="text-xs text-gray-400 block mb-1">Female</span>
                  <div className="flex gap-3 justify-between">
                    {[
                      "https://api.dicebear.com/9.x/micah/svg?seed=Mia",
                      "https://api.dicebear.com/9.x/micah/svg?seed=Lily",
                      "https://api.dicebear.com/9.x/micah/svg?seed=Zoey",
                      "https://api.dicebear.com/9.x/micah/svg?seed=Destiny"
                    ].map((url) => (
                      <button
                        key={url}
                        onClick={() => setEditAvatar(url)}
                        className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${editAvatar === url ? 'border-pink-500 scale-110 shadow-[0_0_10px_#ec4899]' : 'border-transparent opacity-50 hover:opacity-100'}`}
                      >
                        <img src={url} alt="avatar" className="w-full h-full object-cover bg-pink-100/20" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm text-text-muted mb-1 block">
                  Username
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-text-muted mb-1 block">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-text-muted mb-1 block">
                  TRC20 Address
                </label>
                <input
                  type="text"
                  value={editTrc20}
                  onChange={(e) => setEditTrc20(e.target.value)}
                  className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                className="w-full py-3 mt-4 bg-brand-primary text-white font-bold rounded-xl"
              >
                Save Profile
              </button>
            </div>
          </Modal>
        )}

        {isChangingPassword && (
          <Modal
            onClose={() => setIsChangingPassword(false)}
            title="Change Password"
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-muted mb-1 block">
                  Old Password
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-text-muted mb-1 block">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white"
                />
              </div>
              <button
                onClick={handleChangePassword}
                className="w-full py-3 mt-4 bg-brand-primary text-white font-bold rounded-xl"
              >
                Change Password
              </button>
            </div>
          </Modal>
        )}

        {isWithdrawSecurityOpen && (
          <Modal
            onClose={() => setIsWithdrawSecurityOpen(false)}
            title="Withdraw Security"
          >
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-text-muted mb-2 block">
                  Set Withdraw Password
                </label>
                <input
                  type="password"
                  value={withdrawPassword}
                  onChange={(e) => setWithdrawPassword(e.target.value)}
                  placeholder="Enter 4+ digit password"
                  className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text-muted mb-2 block">
                  Face Verification Setup
                </label>
                <div className="bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-2xl p-4 text-center">
                  {capturedFace ? (
                    <div className="space-y-4">
                      <img
                        src={capturedFace}
                        alt="Face ID"
                        className="w-32 h-32 object-cover rounded-full mx-auto border-4 border-brand-primary/30"
                      />
                      <div className="text-green-500 font-bold text-sm">
                        Face ID Recorded
                      </div>
                      <label className="cursor-pointer text-brand-primary text-sm font-bold block">
                        Retake Photo
                        <input
                          type="file"
                          accept="image/*"
                          capture="user"
                          onChange={handleFaceCapture}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="cursor-pointer block py-8 space-y-3">
                      <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto text-brand-primary">
                        <Camera size={32} />
                      </div>
                      <div className="font-bold">
                        Capture Face for Withdrawals
                      </div>
                      <div className="text-xs text-text-muted px-4">
                        Take a clear selfie to secure your funds. This will be
                        required on every withdrawal.
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={handleFaceCapture}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <button
                onClick={handleSaveWithdrawSecurity}
                className="w-full py-3 bg-brand-gold text-black font-bold rounded-xl shadow-[0_0_15px_rgba(255,215,0,0.3)]"
              >
                Save Security Settings
              </button>
            </div>
          </Modal>
        )}

        {isHistoryOpen && (
          <Modal
            onClose={() => setIsHistoryOpen(false)}
            title="Financial Records"
          >
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {store.getState().transactions.filter((t) => t.userId === user.id)
                .length === 0 ? (
                <div className="text-center py-10 text-text-muted">
                  No transactions found
                </div>
              ) : (
                store
                  .getState()
                  .transactions.filter((t) => t.userId === user.id)
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((tx) => (
                    <div
                      key={tx.id}
                      className="bg-[var(--color-bg-base)] border border-[var(--color-border-card)] p-4 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-sm capitalize text-brand-gold">
                          {tx.type}
                        </div>
                        <div className="text-xs text-text-muted mt-1">
                          {new Date(tx.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div
                        className={`font-bold ${tx.type === "withdraw" || tx.amount < 0 ? "text-red-500" : "text-green-500"}`}
                      >
                        {tx.type === "withdraw" || tx.amount < 0 ? "-" : "+"}
                        {formatXRP(Math.abs(tx.amount))}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </Modal>
        )}

        {isAppDownloadOpen && (
          <Modal onClose={() => setIsAppDownloadOpen(false)} title="Download / Install App">
            <div className="space-y-4 text-center">
              <div className="mx-auto w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary mb-4">
                <DownloadCloud size={40} />
              </div>
              <h4 className="font-bold text-lg">Add to Home Screen</h4>
              <p className="text-gray-400 text-sm">
                For the best experience, install this application directly to your device.
              </p>
              
              <div className="bg-[var(--color-bg-base)] text-left p-4 rounded-xl text-sm space-y-4 mt-4">
                <div>
                  <span className="font-bold text-white flex items-center gap-2 mb-1">🌐 Android / Chrome:</span>
                  Tap the <span className="font-bold px-1.5 py-0.5 bg-white/10 rounded">⋮</span> menu icon, and select <span className="font-bold text-brand-primary">"Add to Home screen"</span> or "Install app".
                </div>
                <div className="border-t border-white/5 pt-4">
                  <span className="font-bold text-white flex items-center gap-2 mb-1">🍎 iOS / Safari:</span>
                  Tap the <span className="font-bold px-1.5 py-0.5 bg-white/10 rounded">Share</span> icon at the bottom, scroll down and select <span className="font-bold text-brand-primary">"Add to Home Screen"</span>.
                </div>
              </div>

              <button
                onClick={() => setIsAppDownloadOpen(false)}
                className="w-full mt-4 bg-[#fcd535] text-black font-bold py-3 rounded-xl hover:bg-[#e0bc2f] transition active:scale-95"
              >
                Understood
              </button>
            </div>
          </Modal>
        )}

        {isKycOpen && (
          <Modal onClose={() => setIsKycOpen(false)} title="Identity Verification">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {user.kycStatus === 'approved' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserIcon size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Verified</h3>
                  <p className="text-sm text-text-muted">Your identity has been successfully verified.</p>
                </div>
              ) : user.kycStatus === 'pending' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserIcon size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Pending Review</h3>
                  <p className="text-sm text-text-muted">Your submission is under review by our admin team.</p>
                </div>
              ) : (
                <>
                  <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-xl text-sm text-brand-primary mb-4 font-bold">
                    Notice: Please take a clear photo of yourself holding your ID card (ID card hate niya photo uthte hobe).
                  </div>

                  <div>
                    <label className="text-sm text-text-muted mb-1 block">
                      ID Number (Passport / National ID)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white"
                      value={kycIdNumber}
                      onChange={(e) => setKycIdNumber(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-text-muted mb-1 block">
                      ID Document Photo
                    </label>
                    <div className="border border-[var(--color-border-card)] rounded-xl overflow-hidden bg-[var(--color-bg-base)] text-center relative group">
                      {kycPhoto ? (
                        <div className="relative">
                          <img src={kycPhoto} alt="Document" className="w-full h-40 object-cover" />
                          <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                            <Camera className="text-white" size={24} />
                            <span className="text-xs text-white mt-2">Retake Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={handleKycPhotoCapture}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="cursor-pointer block py-8 space-y-3">
                          <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto text-brand-primary">
                            <Camera size={24} />
                          </div>
                          <div className="text-sm font-bold">
                            Upload ID Photo
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleKycPhotoCapture}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveKyc}
                    className="w-full py-3 bg-brand-primary text-black font-bold rounded-xl mt-4"
                  >
                    Submit for Verification
                  </button>
                </>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 flex items-center justify-between hover:bg-black/20 transition-colors border-b border-[var(--color-border-card)] last:border-0 group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-base)] flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <span className="font-medium">{label}</span>
      </div>
      <ChevronRight
        size={20}
        className="text-text-muted group-hover:text-white transition-colors"
      />
    </button>
  );
}

function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border-card)] p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 bg-[var(--color-bg-base)] rounded-full text-text-muted hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function FakeActivityFeed() {
  const [feed, setFeed] = React.useState<
    { id: string; text: string; type: "deposit" | "withdraw" }[]
  >([]);

  React.useEffect(() => {
    const generateActivity = () => {
      const isDeposit = Math.random() > 0.5;
      const amount = isDeposit
        ? Math.floor(Math.random() * 3900) + 100
        : Math.floor(Math.random() * 3950) + 50;
      const userStr = `User ***${Math.floor(Math.random() * 900) + 100}`;

      return {
        id: Math.random().toString(),
        text: `${userStr} just ${isDeposit ? "deposited" : "withdrew"} ${new Intl.NumberFormat().format(amount)} XRP`,
        type: isDeposit ? "deposit" : "withdraw",
      };
    };

    // Initial feed
    const initialFeed = Array.from({ length: 5 }, generateActivity).map(
      (item, index) => ({ ...item, id: index.toString() }),
    ) as { id: string; text: string; type: "deposit" | "withdraw" }[];
    setFeed(initialFeed);

    const interval = setInterval(() => {
      setFeed((prev) => {
        const next = [
          generateActivity() as {
            id: string;
            text: string;
            type: "deposit" | "withdraw";
          },
          ...prev,
        ];
        if (next.length > 5) next.pop(); // Keep 5 items max
        return next;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-2 mt-2">
      <AnimatePresence mode="popLayout">
        {feed.map((item) => (
          <motion.div
            layout
            key={item.id}
            initial={{ opacity: 0, scale: 0.9, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, y: -10, filter: "blur(4px)" }}
            className="bg-[var(--color-bg-card)] border border-[var(--color-border-card)] p-3 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden"
          >
            <div
              className={`absolute left-0 top-0 bottom-0 w-1 ${item.type === "deposit" ? "bg-green-500/50" : "bg-red-500/50"}`}
            ></div>
            <div className="flex items-center gap-3 pl-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type === "deposit" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
              >
                {item.type === "deposit" ? (
                  <Wallet size={16} />
                ) : (
                  <LogOut size={16} className="-rotate-90" />
                )}
              </div>
              <span className="text-sm font-medium text-white/90">
                {item.text}
              </span>
            </div>
            <div className="text-[10px] uppercase font-bold text-text-muted opacity-60">
              Just now
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
