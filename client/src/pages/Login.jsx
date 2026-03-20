import { useState, useEffect } from "react";
import { Link, useNavigate }   from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AuthLayout              from "@/layouts/AuthLayout";
import { PrimaryButton }       from "@/components/Button";
import { loginUser }           from "@/services/authService";
import { validateEmail }       from "@/utils/validators";
import { useAuthContext }      from "@/context/AuthContext";

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconEyeOpen   = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEyeClosed = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const IconGoogle    = () => <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>;
const IconGithub    = () => <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>;
const IconMail       = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IconLock       = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconShield     = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconArrow      = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const IconSpinner    = () => <svg className="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>;

// ─── Inline Error Message ─────────────────────────────────────────────────────
const FieldError = ({ message }) => (
  <AnimatePresence>
    {message && (
      <motion.p
        className="text-xs text-red-400 mt-1.5 flex items-center gap-1"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{     opacity: 0, y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <span>⚠</span> {message}
      </motion.p>
    )}
  </AnimatePresence>
);

// ─── Alert Banner ─────────────────────────────────────────────────────────────
const AlertBanner = ({ type, message }) => {
  const styles = {
    error:   "bg-red-500/10   border-red-500/30   text-red-400",
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    info:    "bg-primary-500/10 border-primary-500/30 text-primary-300",
  };
  const icons = { error: "⚠️", success: "✅", info: "ℹ️" };

  return (
    <motion.div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm
                  ${styles[type]} mb-5`}
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{     opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: "spring", damping: 20 }}
    >
      <span className="flex-shrink-0 mt-0.5">{icons[type]}</span>
      <span>{message}</span>
    </motion.div>
  );
};

// ─── 2FA Modal ────────────────────────────────────────────────────────────────
const TwoFactorModal = ({ onVerify, onCancel, loading }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputs = Array.from({ length: 6 }, (_, i) => i);

  const handleChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx]  = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      document.getElementById(`otp-${idx - 1}`)?.focus();
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(""));
      document.getElementById("otp-5")?.focus();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{     opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        className="relative glass rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
        initial={{ scale: 0.88, y: 30 }}
        animate={{ scale: 1,     y: 0  }}
        exit={{     scale: 0.88, y: 30 }}
        transition={{ type: "spring", damping: 22 }}
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600
                        flex items-center justify-center mx-auto mb-4 shadow-lg">
          <IconShield />
        </div>
        <h3 className="text-xl font-bold mb-1">Two-Factor Auth</h3>
        <p className="text-sm text-white/40 mb-7">
          Enter the 6-digit code sent to your email or authenticator app.
        </p>

        {/* OTP Inputs */}
        <div className="flex items-center justify-center gap-2 mb-7" onPaste={handlePaste}>
          {inputs.map((i) => (
            <input
              key={i}
              id={`otp-${i}`}
              maxLength={1}
              value={otp[i]}
              onChange={(e) => handleChange(e.target.value, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className="w-11 h-13 text-center text-xl font-bold bg-white/5 border border-white/10
                         rounded-xl text-white outline-none focus:border-primary-500
                         focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
            />
          ))}
        </div>

        <PrimaryButton
          onClick={() => onVerify(otp.join(""))}
          loading={loading}
          disabled={otp.join("").length < 6}
          className="w-full justify-center"
          size="md"
        >
          Verify Code
        </PrimaryButton>

        <button onClick={onCancel}
          className="mt-4 text-xs text-white/30 hover:text-white/60 transition-colors block mx-auto">
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
};

// ─── Magic Link Modal ─────────────────────────────────────────────────────────
const MagicLinkModal = ({ onClose }) => {
  const [email,   setEmail]   = useState("");
  const [sent,     setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) { setError("Please enter a valid email."); return; }
    try {
      setLoading(true);
      setError("");
      // await axiosInstance.post("/api/auth/magic-link", { email });
      setSent(true);
    } catch {
      setError("Failed to send magic link. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative glass rounded-3xl p-8 max-w-sm w-full shadow-2xl"
        initial={{ scale: 0.88, y: 30 }}
        animate={{ scale: 1,     y: 0  }}
        exit={{     scale: 0.88, y: 30 }}
        transition={{ type: "spring", damping: 22 }}
      >
        <button onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-3">✨</div>
          <h3 className="text-xl font-bold">Magic Link Login</h3>
          <p className="text-sm text-white/40 mt-1">
            We'll send a one-click login link to your email.
          </p>
        </div>

        {sent ? (
          <motion.div
            className="text-center py-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1,    opacity: 1 }}
          >
            <div className="text-4xl mb-3">📬</div>
            <p className="text-emerald-400 font-semibold">Magic link sent!</p>
            <p className="text-xs text-white/40 mt-2">Check your inbox and click the link to login.</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                <IconMail />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input-glass pl-11"
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <PrimaryButton type="submit" loading={loading} className="w-full justify-center">
              Send Magic Link
            </PrimaryButton>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN LOGIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
const Login = () => {
  const navigate        = useNavigate();
  const { dispatch }    = useAuthContext();

  const [form, setForm] = useState({ email: "", password: "", rememberMe: false });
  const [errors,         setErrors]       = useState({});
  const [alert,          setAlert]        = useState(null);  // { type, message }
  const [showPassword,   setShowPassword] = useState(false);
  const [loading,        setLoading]      = useState(false);
  const [show2FA,        setShow2FA]      = useState(false);
  const [showMagicLink, setShowMagicLink]= useState(false);
  const [twoFaLoading,   setTwoFaLoading] = useState(false);
  const [pendingToken,   setPendingToken] = useState(null); // temp token for 2FA

  // ── Validate fields ───────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.email)                     errs.email    = "Email is required.";
    else if (!validateEmail(form.email)) errs.email    = "Enter a valid email address.";
    if (!form.password)                 errs.password = "Password is required.";
    else if (form.password.length < 6)  errs.password = "Password must be at least 6 characters.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: "" }));
    if (alert) setAlert(null);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      setAlert(null);
      const data = await loginUser({ email: form.email, password: form.password, rememberMe: form.rememberMe });

      // If backend requires 2FA
      if (data.requires2FA) {
        setPendingToken(data.tempToken);
        setShow2FA(true);
        return;
      }

      dispatch({ type: "SET_USER", payload: data.user });

      // ── Admin Redirect Logic ───────────────────────────────────────────
      if (data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/chat");
      }
      
    } catch (err) {
      const msg = err?.response?.data?.message || "Login failed. Please try again.";

      // Account locked
      if (err?.response?.status === 423) {
        setAlert({ type: "error", message: "Account temporarily locked. Too many failed attempts. Try again in 15 minutes." });
        return;
      }

      setAlert({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  // ── 2FA Verify ────────────────────────────────────────────────────────────
  const handle2FAVerify = async (code) => {
    try {
      setTwoFaLoading(true);
      // const data = await axiosInstance.post("/api/auth/2fa/verify", { code, tempToken: pendingToken });
      // dispatch({ type: "SET_USER", payload: data.user });
      
      // Simulated for now:
      setTimeout(() => {
        setShow2FA(false);
        // Note: In real logic, check role here too if verifying via 2FA
        navigate("/chat");
      }, 800);
    } catch {
      setAlert({ type: "error", message: "Invalid 2FA code. Please try again." });
      setShow2FA(false);
    } finally {
      setTwoFaLoading(false);
    }
  };

  // ── Social Auth ───────────────────────────────────────────────────────────
  const handleSocialAuth = (provider) => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/${provider}`;
  };

  return (
    <>
      <AuthLayout
        title="Welcome back"
        subtitle="Sign in to continue to your account"
      >
        {/* Alert Banner */}
        <AnimatePresence>
          {alert && <AlertBanner type={alert.type} message={alert.message} />}
        </AnimatePresence>

        {/* ── Social Auth Buttons ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.button
            onClick={() => handleSocialAuth("google")}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                       bg-white/5 border border-white/10 hover:bg-white/10
                       text-sm font-medium transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <IconGoogle /> Google
          </motion.button>
          <motion.button
            onClick={() => handleSocialAuth("github")}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                       bg-white/5 border border-white/10 hover:bg-white/10
                       text-sm font-medium transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <IconGithub /> GitHub
          </motion.button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/30">or continue with email</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* ── Login Form ────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                <IconMail />
              </span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                className={`input-glass pl-11 ${errors.email ? "border-red-500/60 focus:border-red-500" : ""}`}
              />
            </div>
            <FieldError message={errors.email} />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
                Password
              </label>
              <Link to="/forgot-password"
                className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                <IconLock />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                className={`input-glass pl-11 pr-11 ${errors.password ? "border-red-500/60 focus:border-red-500" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30
                           hover:text-white/70 transition-colors"
              >
                {showPassword ? <IconEyeClosed /> : <IconEyeOpen />}
              </button>
            </div>
            <FieldError message={errors.password} />
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={form.rememberMe}
                  onChange={handleChange}
                  className="sr-only"
                />
                <motion.div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center
                               transition-colors duration-200
                               ${form.rememberMe
                                 ? "bg-primary-500 border-primary-500"
                                 : "border-white/20 bg-transparent group-hover:border-white/40"}`}
                  whileTap={{ scale: 0.85 }}
                >
                  {form.rememberMe && (
                    <motion.svg
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      width="12" height="12" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12"/>
                    </motion.svg>
                  )}
                </motion.div>
              </div>
              <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors select-none">
                Remember me for 7 days
              </span>
            </label>

            {/* 2FA Badge */}
            <div className="flex items-center gap-1.5 text-xs text-white/30">
              <IconShield />
              <span>2FA Protected</span>
            </div>
          </div>

          {/* Submit */}
          <PrimaryButton
            type="submit"
            loading={loading}
            disabled={loading}
            size="md"
            className="w-full justify-center mt-2"
          >
            {loading ? (
              <><IconSpinner /> Signing in...</>
            ) : (
              <>Sign In <IconArrow /></>
            )}
          </PrimaryButton>
        </form>

        {/* ── Magic Link ────────────────────────────────────────────────── */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowMagicLink(true)}
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors
                       flex items-center gap-1.5 mx-auto"
          >
            <span>✨</span> Sign in with Magic Link instead
          </button>
        </div>

        {/* Divider */}
        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <p className="text-sm text-white/40">
            Don't have an account?{" "}
            <Link to="/register"
              className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
              Create one free
            </Link>
          </p>
        </div>

        {/* Security Note */}
        <motion.div
          className="mt-5 flex items-center justify-center gap-2 text-xs text-white/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <IconShield />
          <span>Protected by AES-256 encryption & HttpOnly cookies</span>
        </motion.div>
      </AuthLayout>

      {/* ── 2FA Modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {show2FA && (
          <TwoFactorModal
            onVerify={handle2FAVerify}
            onCancel={() => setShow2FA(false)}
            loading={twoFaLoading}
          />
        )}
      </AnimatePresence>

      {/* ── Magic Link Modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showMagicLink && <MagicLinkModal onClose={() => setShowMagicLink(false)} />}
      </AnimatePresence>
    </>
  );
};

export default Login;