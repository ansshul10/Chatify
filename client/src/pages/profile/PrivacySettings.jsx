import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Users, Lock, Eye, Clock, Gift, Copy, CheckCircle2, AlertCircle, Loader2, Link2, Check, Wifi } from "lucide-react";
import { updatePrivacy, toggleOnlineStatus, fetchReferral } from "@/services/profileService";

// ── Clickable Row Checkbox ─────────────────────────────────────────────────────
const CheckRow = ({ checked, onChange, label, desc, icon: Icon }) => (
  <motion.div
    onClick={() => onChange(!checked)}
    whileTap={{ scale: 0.99 }}
    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200
      ${checked
        ? "bg-primary-500/5 border-primary-500/20 hover:bg-primary-500/8"
        : "border-white/5 hover:border-white/10 hover:bg-white/[0.02]"}`}>
    {Icon && (
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200
        ${checked ? "bg-primary-500/15 border border-primary-500/30" : "bg-white/[0.04] border border-white/8"}`}>
        <Icon className={`w-4 h-4 ${checked ? "text-primary-400" : "text-white/30"}`} />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-semibold transition-colors ${checked ? "text-white/90" : "text-white/60"}`}>{label}</p>
      {desc && <p className="text-xs text-white/30 mt-0.5">{desc}</p>}
    </div>
    <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all duration-200
      ${checked ? "bg-primary-500 border-primary-500 shadow-lg shadow-primary-500/30" : "border-white/15 bg-transparent"}`}>
      <AnimatePresence>
        {checked && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}>
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </motion.div>
);

const SectionCard = ({ title, subtitle, children }) => (
  <motion.div className="glass rounded-2xl border border-white/5 overflow-hidden mb-5"
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
    <div className="px-6 pt-6 pb-5 border-b border-white/5">
      <h3 className="text-xs font-black uppercase tracking-widest text-white/40">{title}</h3>
      {subtitle && <p className="text-xs text-white/25 mt-1">{subtitle}</p>}
    </div>
    <div className="p-6">{children}</div>
  </motion.div>
);

const Toast = ({ msg }) => (
  <AnimatePresence>
    {msg && (
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm mb-5
          ${msg.type === "success" ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" : "bg-red-500/10 border-red-500/25 text-red-400"}`}>
        {msg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        {msg.text}
      </motion.div>
    )}
  </AnimatePresence>
);

const VISIBILITY_OPTIONS = [
  { value: "public",  label: "Public",  desc: "Anyone can view",  Icon: Globe },
  { value: "friends", label: "Friends", desc: "Only connections", Icon: Users },
  { value: "private", label: "Private", desc: "Only you",         Icon: Lock  },
];

const PrivacySettings = ({ user, profile, onUpdate }) => {
  const [privacy,     setPrivacy]     = useState({ ...profile.privacy });
  const [isOnline,    setIsOnline]    = useState(user.isOnline);
  const [referral,    setReferral]    = useState(null);
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingRef,  setLoadingRef]  = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [msg,         setMsg]         = useState(null);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3500); };

  const handleSave = async () => {
    try {
      setLoadingSave(true);
      await updatePrivacy(privacy);
      await toggleOnlineStatus({ isOnline });
      onUpdate();
      showMsg("success", "Privacy settings updated!");
    } catch { showMsg("error", "Failed to update settings."); }
    finally { setLoadingSave(false); }
  };

  const loadReferral = async () => {
    try {
      setLoadingRef(true);
      const res = await fetchReferral();
      setReferral(res.data);
    } catch { showMsg("error", "Failed to load referral info."); }
    finally { setLoadingRef(false); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referral.inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl">
      <Toast msg={msg} />

      {/* Profile Visibility */}
      <SectionCard title="Profile Visibility" subtitle="Control who can see your profile">

        {/* Segmented Selector */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {VISIBILITY_OPTIONS.map(({ value, label, desc, Icon }) => {
            const isSelected = privacy.profileVisibility === value;
            return (
              <motion.button key={value}
                onClick={() => setPrivacy(p => ({ ...p, profileVisibility: value }))}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
                className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border text-center transition-all duration-200
                  ${isSelected
                    ? "bg-primary-500/10 border-primary-500/40"
                    : "bg-white/[0.02] border-white/8 hover:border-white/15"}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
                  ${isSelected ? "bg-primary-500/20 border border-primary-500/30" : "bg-white/5 border border-white/8"}`}>
                  <Icon className={`w-4 h-4 ${isSelected ? "text-primary-400" : "text-white/30"}`} />
                </div>
                <span className={`text-xs font-bold transition-colors ${isSelected ? "text-white" : "text-white/40"}`}>
                  {label}
                </span>
                <span className={`text-xs leading-tight transition-colors ${isSelected ? "text-white/50" : "text-white/20"}`}>
                  {desc}
                </span>
                {/* Selected indicator dot */}
                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${isSelected ? "bg-primary-400" : "bg-transparent"}`} />
              </motion.button>
            );
          })}
        </div>

        {/* Checkbox Rows */}
        <div className="space-y-2 mb-6">
          <CheckRow
            checked={privacy.showEmail}
            onChange={(val) => setPrivacy(p => ({ ...p, showEmail: val }))}
            label="Show Email on Profile"
            desc="Others can see your email address."
            icon={Eye}
          />
          <CheckRow
            checked={privacy.showLastSeen}
            onChange={(val) => setPrivacy(p => ({ ...p, showLastSeen: val }))}
            label="Show Last Seen"
            desc="Others can see when you were last active."
            icon={Clock}
          />

          {/* Online Status Row — with live indicator */}
          <motion.div
            onClick={() => setIsOnline(v => !v)}
            whileTap={{ scale: 0.99 }}
            className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200
              ${isOnline
                ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/8"
                : "border-white/5 hover:border-white/10 hover:bg-white/[0.02]"}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200
              ${isOnline ? "bg-emerald-500/15 border border-emerald-500/30" : "bg-white/[0.04] border border-white/8"}`}>
              <Wifi className={`w-4 h-4 ${isOnline ? "text-emerald-400" : "text-white/30"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-semibold transition-colors ${isOnline ? "text-white/90" : "text-white/60"}`}>
                  Appear Online
                </p>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300
                  ${isOnline ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-white/15"}`} />
              </div>
              <p className="text-xs text-white/30 mt-0.5">Show your online status to others.</p>
            </div>
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all duration-200
              ${isOnline ? "bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/30" : "border-white/15 bg-transparent"}`}>
              <AnimatePresence>
                {isOnline && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}>
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        <motion.button onClick={handleSave} disabled={loadingSave}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all disabled:opacity-50">
          {loadingSave ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {loadingSave ? "Saving..." : "Save Privacy Settings"}
        </motion.button>
      </SectionCard>

      {/* Referral */}
      <SectionCard title="Referral & Invite" subtitle="Invite friends and track referrals">
        {!referral ? (
          <div className="flex flex-col items-center py-4 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
              <Gift className="w-6 h-6 text-primary-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white/70">Your Invite Link</p>
              <p className="text-xs text-white/30 mt-1">Share your unique link and track how many people join</p>
            </div>
            <motion.button onClick={loadReferral} disabled={loadingRef}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all disabled:opacity-40">
              {loadingRef ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              {loadingRef ? "Loading..." : "Show My Invite Link"}
            </motion.button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-primary-400">{referral.referralCount}</p>
                <p className="text-xs text-white/30 mt-1 uppercase tracking-wider">Friends Joined</p>
              </div>
              <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-white/60">{referral.referralCode}</p>
                <p className="text-xs text-white/30 mt-1 uppercase tracking-wider">Your Code</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-1 bg-white/[0.03] border border-white/8 rounded-xl">
              <p className="flex-1 px-3 text-xs font-mono text-white/40 truncate">{referral.inviteLink}</p>
              <motion.button onClick={copyLink} whileTap={{ scale: 0.93 }}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex-shrink-0
                  ${copied
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                    : "bg-primary-500/15 text-primary-400 border border-primary-500/25 hover:bg-primary-500/25"}`}>
                {copied
                  ? <><CheckCircle2 className="w-3.5 h-3.5" /> Copied!</>
                  : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </motion.button>
            </div>
          </motion.div>
        )}
      </SectionCard>
    </div>
  );
};

export default PrivacySettings;
