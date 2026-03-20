import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, Shield, CheckCircle2, AlertCircle, Loader2, Info } from "lucide-react";
import { changePassword } from "@/services/profileService";
import { getPasswordStrength, validatePassword } from "@/utils/validators";

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
      <motion.div initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10 }} transition={{ type: "spring", damping: 20 }}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm mb-5
          ${msg.type === "success" ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" : "bg-red-500/10 border-red-500/25 text-red-400"}`}>
        {msg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        {msg.text}
      </motion.div>
    )}
  </AnimatePresence>
);

const PasswordField = ({ label, value, onChange, show, onToggle, disabled }) => (
  <div>
    <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">{label}</label>
    <div className={`flex items-center bg-white/[0.04] border rounded-xl transition-all duration-200 focus-within:border-primary-500/50
      ${disabled ? "opacity-40 cursor-not-allowed border-white/5" : "border-white/8 hover:border-white/15 focus-within:bg-white/[0.06]"}`}>
      <Lock className="w-4 h-4 text-white/25 ml-4 flex-shrink-0" />
      <input type={show ? "text" : "password"} value={value} onChange={onChange} disabled={disabled}
        placeholder="••••••••"
        className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder-white/20 outline-none" />
      <button type="button" onClick={onToggle} disabled={disabled}
        className="mr-4 text-white/25 hover:text-white/60 transition-colors flex-shrink-0">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  </div>
);

const SecuritySettings = ({ user }) => {
  const [form, setForm]   = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow]   = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]     = useState(null);
  const isLocal           = user.provider === "local";

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000); };

  const handleSubmit = async () => {
    if (form.newPassword !== form.confirmPassword) { showMsg("error", "New passwords do not match."); return; }
    if (form.newPassword.length < 6) { showMsg("error", "Password must be at least 6 characters."); return; }
    try {
      setLoading(true);
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showMsg("success", "Password changed successfully!");
    } catch (e) { showMsg("error", e?.response?.data?.message || "Failed to change password."); }
    finally { setLoading(false); }
  };

  const strength = form.newPassword ? getPasswordStrength(form.newPassword) : null;
  const checks   = form.newPassword ? validatePassword(form.newPassword) : null;

  return (
    <div className="max-w-2xl">
      <Toast msg={msg} />

      {/* Change Password */}
      <SectionCard title="Change Password" subtitle="Update your account password">
        {!isLocal && (
          <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/8 border border-amber-500/20 rounded-xl text-sm text-amber-400 mb-5">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Your account uses <strong>{user.provider}</strong> login. Password change is not available for OAuth accounts.</span>
          </div>
        )}
        <div className="space-y-4">
          <PasswordField label="Current Password"
            value={form.currentPassword} onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
            show={show.current} onToggle={() => setShow(s => ({ ...s, current: !s.current }))} disabled={!isLocal} />

          <PasswordField label="New Password"
            value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
            show={show.new} onToggle={() => setShow(s => ({ ...s, new: !s.new }))} disabled={!isLocal} />

          {/* Strength Meter */}
          <AnimatePresence>
            {form.newPassword && strength && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="space-y-2.5 overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <motion.div className={`h-full rounded-full ${strength.color}`}
                      initial={{ width: 0 }} animate={{ width: strength.width }} transition={{ duration: 0.4 }} />
                  </div>
                  <span className={`text-xs font-bold w-14 text-right
                    ${strength.label === "Strong" ? "text-emerald-400" :
                      strength.label === "Good"   ? "text-blue-400"   :
                      strength.label === "Fair"   ? "text-yellow-400" : "text-red-400"}`}>
                    {strength.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[["8+ characters", checks.length], ["Uppercase", checks.uppercase], ["Number", checks.number], ["Symbol", checks.symbol]].map(([k, v]) => (
                    <div key={k} className={`flex items-center gap-1.5 text-xs transition-colors ${v ? "text-emerald-400" : "text-white/25"}`}>
                      <CheckCircle2 className={`w-3 h-3 ${v ? "opacity-100" : "opacity-30"}`} /> {k}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <PasswordField label="Confirm New Password"
            value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
            show={show.confirm} onToggle={() => setShow(s => ({ ...s, confirm: !s.confirm }))} disabled={!isLocal} />

          <div className="pt-1">
            <motion.button onClick={handleSubmit} disabled={loading || !isLocal}
              whileHover={{ scale: isLocal ? 1.02 : 1 }} whileTap={{ scale: isLocal ? 0.97 : 1 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all disabled:opacity-40">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {loading ? "Changing..." : "Change Password"}
            </motion.button>
          </div>
        </div>
      </SectionCard>

      {/* 2FA Status */}
      <SectionCard title="Two-Factor Authentication" subtitle="Add an extra layer of security">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center
              ${user.twoFactorEnabled ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-white/5 border border-white/10"}`}>
              <Shield className={`w-5 h-5 ${user.twoFactorEnabled ? "text-emerald-400" : "text-white/30"}`} />
            </div>
            <div>
              <p className="text-sm font-semibold">
                2FA is {" "}
                <span className={user.twoFactorEnabled ? "text-emerald-400" : "text-white/40"}>
                  {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                </span>
              </p>
              <p className="text-xs text-white/30 mt-0.5">
                {user.twoFactorEnabled ? "Your account is protected." : "Enable for extra security."}
              </p>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border
            ${user.twoFactorEnabled ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/5 border-white/10 text-white/30"}`}>
            {user.twoFactorEnabled ? "Active" : "Inactive"}
          </span>
        </div>
        <p className="text-xs text-white/20 mt-4 flex items-center gap-1.5">
          <Info className="w-3 h-3" /> Full 2FA setup management coming in next update.
        </p>
      </SectionCard>

      {/* Account Info */}
      <SectionCard title="Account Information" subtitle="Your account details">
        <div className="space-y-1">
          {[
            { label: "Account Type",   value: isLocal ? "Email & Password" : `OAuth (${user.provider})` },
            { label: "Member Since",   value: new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) },
            { label: "Email Verified", value: user.isEmailVerified ? "Verified ✓" : "Not Verified" , color: user.isEmailVerified ? "text-emerald-400" : "text-yellow-400" },
            { label: "Current Plan",   value: (user.subscription?.plan || "free").toUpperCase() },
            { label: "Role",           value: user.role.toUpperCase() },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
              <span className="text-sm text-white/40">{label}</span>
              <span className={`text-sm font-semibold ${color || "text-white/80"}`}>{value}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

export default SecuritySettings;
