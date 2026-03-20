import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Smartphone, LogOut, Clock, Wifi, CheckCircle2, AlertCircle, Loader2, History } from "lucide-react";
import { fetchSessions, revokeAllSessions, fetchLoginHistory } from "@/services/profileService";

const SectionCard = ({ title, subtitle, action, children }) => (
  <motion.div className="glass rounded-2xl border border-white/5 overflow-hidden mb-5"
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
    <div className="px-6 pt-6 pb-5 border-b border-white/5 flex items-center justify-between">
      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-white/40">{title}</h3>
        {subtitle && <p className="text-xs text-white/25 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
    <div className="p-6">{children}</div>
  </motion.div>
);

const Toast = ({ msg }) => (
  <AnimatePresence>
    {msg && (
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
        transition={{ type: "spring", damping: 20 }}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm mb-5
          ${msg.type === "success" ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" : "bg-red-500/10 border-red-500/25 text-red-400"}`}>
        {msg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        {msg.text}
      </motion.div>
    )}
  </AnimatePresence>
);

const getDeviceIcon = (ua = "") => {
  const u = ua.toLowerCase();
  return u.includes("mobile") || u.includes("android") || u.includes("iphone")
    ? <Smartphone className="w-5 h-5" />
    : <Monitor className="w-5 h-5" />;
};

const getDeviceName = (ua = "") => {
  if (ua.includes("Chrome"))  return `Chrome — ${ua.includes("Windows") ? "Windows" : ua.includes("Mac") ? "macOS" : "Linux"}`;
  if (ua.includes("Firefox")) return `Firefox — ${ua.includes("Windows") ? "Windows" : "Linux"}`;
  if (ua.includes("Safari"))  return `Safari — macOS / iOS`;
  return ua.split(" ")[0] || "Unknown Device";
};

const SessionsDevices = () => {
  const [sessions,     setSessions]     = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [revoking,     setRevoking]     = useState(false);
  const [msg,          setMsg]          = useState(null);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000); };

  const load = async () => {
    try {
      setLoading(true);
      const [sessRes, histRes] = await Promise.all([fetchSessions(), fetchLoginHistory()]);
      setSessions(sessRes.data.devices || []);
      setLoginHistory(histRes.data || []);
    } catch { showMsg("error", "Failed to load sessions."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRevoke = async () => {
    if (!window.confirm("Revoke all sessions? You will be logged out everywhere.")) return;
    try {
      setRevoking(true);
      await revokeAllSessions();
      showMsg("success", "All sessions revoked. Redirecting...");
      setTimeout(() => window.location.href = "/login", 1500);
    } catch { showMsg("error", "Failed to revoke sessions."); }
    finally { setRevoking(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-white/30 text-sm">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Toast msg={msg} />

      {/* Known Devices */}
      <SectionCard title="Known Devices"
        subtitle={`${sessions.length} device${sessions.length !== 1 ? "s" : ""} recognized`}
        action={
          <motion.button onClick={handleRevoke} disabled={revoking || sessions.length === 0}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-red-500/8 border border-red-500/20 text-red-400 hover:bg-red-500/15 transition-all disabled:opacity-30">
            {revoking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
            Revoke All
          </motion.button>
        }>
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <Wifi className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/25 text-sm">No known devices recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((device, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/5 rounded-xl hover:border-white/10 transition-all">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-white/40 flex-shrink-0">
                  {getDeviceIcon(device.userAgent)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/80 truncate">{getDeviceName(device.userAgent)}</p>
                  <p className="text-xs text-white/30 mt-0.5">IP: {device.ip || "Unknown"}</p>
                </div>
                {device.lastSeen && (
                  <div className="flex items-center gap-1.5 text-xs text-white/25 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(device.lastSeen).toLocaleDateString()}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
        <p className="text-xs text-white/20 mt-4 flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3" /> Revoking will log you out from all devices including this one.
        </p>
      </SectionCard>

      {/* Login History */}
      <SectionCard title="Login History" subtitle="Recent login activity on your account">
        {loginHistory.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/25 text-sm">No login history available yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {loginHistory.map((log, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-3.5 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.status === "success" ? "bg-emerald-400" : "bg-red-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/60 truncate">{getDeviceName(log.userAgent)}</p>
                  <p className="text-xs text-white/25">IP: {log.ip}</p>
                </div>
                <div className="text-right flex-shrink-0 space-y-0.5">
                  <p className={`text-xs font-bold capitalize ${log.status === "success" ? "text-emerald-400" : "text-red-400"}`}>
                    {log.status}
                  </p>
                  <p className="text-xs text-white/25">{new Date(log.loggedInAt).toLocaleDateString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default SessionsDevices;
