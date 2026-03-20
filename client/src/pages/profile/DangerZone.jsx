import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, UserX, Lock, Loader2, AlertCircle, X } from "lucide-react";
import { deactivateAccount, deleteAccount } from "@/services/profileService";

const SectionCard = ({ title, subtitle, danger, children }) => (
  <motion.div className={`rounded-2xl border overflow-hidden mb-5 ${danger ? "bg-red-950/20 border-red-500/20" : "glass border-white/5"}`}
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
    <div className={`px-6 pt-6 pb-5 border-b ${danger ? "border-red-500/15" : "border-white/5"}`}>
      <h3 className={`text-xs font-black uppercase tracking-widest ${danger ? "text-red-400/70" : "text-white/40"}`}>{title}</h3>
      {subtitle && <p className="text-xs text-white/25 mt-1">{subtitle}</p>}
    </div>
    <div className="p-6">{children}</div>
  </motion.div>
);

// Confirmation Modal
const ConfirmModal = ({ title, icon: Icon, iconBg, confirmBg, confirmText, onConfirm, onCancel, loading, children }) => (
  <motion.div className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
    <motion.div className="relative glass rounded-3xl p-7 max-w-sm w-full shadow-2xl border border-white/8"
      initial={{ scale: 0.88, y: 24 }} animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.88, y: 24 }} transition={{ type: "spring", damping: 22 }}>
      <button onClick={onCancel} className="absolute top-5 right-5 text-white/25 hover:text-white/60 transition-colors">
        <X className="w-4 h-4" />
      </button>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-lg font-black mb-1">{title}</h3>
      <div className="mb-5">{children}</div>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white/60 hover:bg-white/10 transition-all">
          Cancel
        </button>
        <motion.button onClick={onConfirm} disabled={loading}
          whileTap={{ scale: 0.97 }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 ${confirmBg}`}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
        </motion.button>
      </div>
    </motion.div>
  </motion.div>
);

const DangerZone = ({ user, dispatch }) => {
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showDelete,     setShowDelete]     = useState(false);
  const [password,       setPassword]       = useState("");
  const [confirm,        setConfirm]        = useState("");
  const [loading,        setLoading]        = useState(false);
  const [msg,            setMsg]            = useState(null);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 5000); };

  const handleDeactivate = async () => {
    try {
      setLoading(true);
      await deactivateAccount();
      dispatch({ type: "LOGOUT" });
      window.location.href = "/login";
    } catch (e) { showMsg("error", e?.response?.data?.message || "Failed to deactivate account."); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (confirm !== user.username) { showMsg("error", `Type your username to confirm.`); return; }
    try {
      setLoading(true);
      await deleteAccount({ password: user.provider === "local" ? password : undefined });
      dispatch({ type: "LOGOUT" });
      window.location.href = "/";
    } catch (e) { showMsg("error", e?.response?.data?.message || "Failed to delete account."); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl">

      {/* Warning Banner */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 px-5 py-4 bg-red-500/8 border border-red-500/20 rounded-2xl mb-5">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-400">Danger Zone</p>
          <p className="text-xs text-red-400/60 mt-0.5 leading-relaxed">Actions in this section are permanent and cannot be undone. Please proceed with caution.</p>
        </div>
      </motion.div>

      {/* Error msg */}
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-red-500/10 border-red-500/25 text-red-400 text-sm mb-5">
            <AlertCircle className="w-4 h-4" /> {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deactivate */}
      <SectionCard title="Deactivate Account" subtitle="Temporarily disable your account">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-white/50 leading-relaxed">
              Your account will be disabled and hidden from others. Your data is preserved and you can reactivate by contacting support.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <motion.button onClick={() => setShowDeactivate(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/15 transition-all">
            <UserX className="w-4 h-4" /> Deactivate Account
          </motion.button>
        </div>
      </SectionCard>

      {/* Delete */}
      <SectionCard title="Delete Account" subtitle="Permanently remove your account and all data" danger>
        <p className="text-sm text-white/50 leading-relaxed mb-4">
          This will permanently delete your account, profile, and all associated data.{" "}
          <strong className="text-red-400">This action cannot be reversed.</strong>
        </p>
        <motion.button onClick={() => setShowDelete(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/18 transition-all">
          <Trash2 className="w-4 h-4" /> Delete My Account Forever
        </motion.button>
      </SectionCard>

      {/* Deactivate Modal */}
      <AnimatePresence>
        {showDeactivate && (
          <ConfirmModal title="Deactivate Account?"
            icon={UserX} iconBg="bg-amber-500/10 border border-amber-500/20 text-amber-400"
            confirmBg="bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25"
            confirmText="Deactivate"
            onConfirm={handleDeactivate} onCancel={() => setShowDeactivate(false)} loading={loading}>
            <p className="text-sm text-white/45 leading-relaxed">
              Your account will be temporarily disabled. Data is preserved and you can request reactivation via support.
            </p>
          </ConfirmModal>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDelete && (
          <ConfirmModal title="Delete Account Forever?"
            icon={Trash2} iconBg="bg-red-500/10 border border-red-500/20 text-red-400"
            confirmBg="bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 disabled:opacity-40"
            confirmText="Delete Forever"
            onConfirm={handleDelete} onCancel={() => { setShowDelete(false); setPassword(""); setConfirm(""); }} loading={loading}>
            <div className="space-y-4">
              <p className="text-sm text-white/40 leading-relaxed">
                All your data will be <strong className="text-red-400">permanently erased</strong>. This cannot be undone.
              </p>

              {user.provider === "local" && (
                <div>
                  <label className="text-xs font-semibold text-white/35 uppercase tracking-wider mb-2 block">Confirm Password</label>
                  <div className="flex items-center bg-white/[0.04] border border-white/8 rounded-xl focus-within:border-red-500/40">
                    <Lock className="w-4 h-4 text-white/25 ml-3 flex-shrink-0" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-white/35 uppercase tracking-wider mb-2 block">
                  Type <strong className="text-white/60 normal-case">{user.username}</strong> to confirm
                </label>
                <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={user.username}
                  className={`w-full bg-white/[0.04] border rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-all
                    ${confirm === user.username ? "border-red-500/40 bg-red-500/5" : "border-white/8 focus:border-red-500/30"}`} />
              </div>
            </div>
          </ConfirmModal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DangerZone;
