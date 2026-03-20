import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Mail, Shield, MessageSquare, Megaphone, CheckCircle2, AlertCircle, Loader2, Check } from "lucide-react";
import { updateNotifications } from "@/services/profileService";

// ── Pill Checkbox ──────────────────────────────────────────────────────────────
const PillCheck = ({ checked, onChange, label }) => (
  <button type="button" onClick={() => onChange(!checked)}
    className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 select-none
      ${checked
        ? "bg-primary-500/15 border-primary-500/40 text-primary-300"
        : "bg-white/[0.03] border-white/10 text-white/30 hover:border-white/20 hover:text-white/50"}`}>
    <span className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-all duration-200
      ${checked ? "bg-primary-500 border-primary-500" : "border-white/20 bg-transparent"}`}>
      {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
    </span>
    {label}
  </button>
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

const NOTIF_OPTIONS = [
  { key: "emailOnNewDevice",  label: "New Device Login",  desc: "Alert when a new device logs into your account.", Icon: Shield,        color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20"   },
  { key: "emailOnLogin",      label: "Every Login",       desc: "Email every time you successfully log in.",       Icon: Mail,          color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20"     },
  { key: "emailOnNewMessage", label: "New Message",       desc: "Email when you receive a new message.",           Icon: MessageSquare, color: "text-purple-400",  bg: "bg-purple-500/10 border-purple-500/20" },
  { key: "emailMarketing",    label: "Product Updates",   desc: "Newsletters, feature announcements, and tips.",   Icon: Megaphone,     color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
];

const NotificationSettings = ({ profile, onUpdate }) => {
  const [prefs,   setPrefs]   = useState({ ...profile.notifications });
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState(null);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3500); };

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateNotifications(prefs);
      onUpdate();
      showMsg("success", "Notification preferences saved!");
    } catch { showMsg("error", "Failed to save preferences."); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl">
      <Toast msg={msg} />

      <SectionCard title="Email Notifications" subtitle="Choose which emails you want to receive">
        <div className="space-y-2">
          {NOTIF_OPTIONS.map(({ key, label, desc, Icon, color, bg }, i) => (
            <motion.div key={key}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setPrefs(p => ({ ...p, [key]: !p[key] }))}
              className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200
                ${prefs[key]
                  ? "bg-primary-500/5 border-primary-500/20 hover:bg-primary-500/8"
                  : "border-white/5 hover:border-white/10 hover:bg-white/[0.02]"}`}>
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all duration-200 ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold transition-colors ${prefs[key] ? "text-white/90" : "text-white/60"}`}>
                  {label}
                </p>
                <p className="text-xs text-white/30 mt-0.5 leading-relaxed">{desc}</p>
              </div>

              {/* Checkbox */}
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all duration-200
                ${prefs[key]
                  ? "bg-primary-500 border-primary-500 shadow-lg shadow-primary-500/30"
                  : "border-white/15 bg-transparent"}`}>
                <AnimatePresence>
                  {prefs[key] && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}>
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 pt-5 border-t border-white/5">
          <motion.button onClick={handleSave} disabled={loading}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            {loading ? "Saving..." : "Save Preferences"}
          </motion.button>
        </div>
      </SectionCard>
    </div>
  );
};

export default NotificationSettings;
