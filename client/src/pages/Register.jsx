import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate }                from "react-router-dom";
import { motion, AnimatePresence }           from "framer-motion";
import AuthLayout                           from "@/layouts/AuthLayout";
import { PrimaryButton }                    from "@/components/Button";
import { registerUser, checkUsername }      from "@/services/authService";
import { validateEmail, validatePassword,
         getPasswordStrength,
         validateUsername }                 from "@/utils/validators";
import { useAuthContext }                   from "@/context/AuthContext";

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconEyeOpen   = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEyeClosed = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const IconGoogle    = () => <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>;
const IconGithub    = () => <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>;
const IconUser      = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconAt        = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>;
const IconMail      = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IconLock      = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconShield    = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconArrow     = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const IconSpinner   = () => <svg className="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>;

// ─── Reusable Field Error ─────────────────────────────────────────────────────
const FieldError = ({ message }) => (
  <AnimatePresence>
    {message && (
      <motion.p className="text-xs text-red-400 mt-1.5 flex items-center gap-1"
        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
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
  };
  const icons = { error: "⚠️", success: "✅" };
  return (
    <motion.div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${styles[type]} mb-5`}
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }} transition={{ type: "spring", damping: 20 }}
    >
      <span className="flex-shrink-0">{icons[type]}</span>
      <span>{message}</span>
    </motion.div>
  );
};

// ─── Password Strength Meter ──────────────────────────────────────────────────
const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const strength = getPasswordStrength(password);
  const checks   = validatePassword(password);

  const checkItems = [
    { label: "8+ characters",     ok: checks.length    },
    { label: "Uppercase letter",  ok: checks.uppercase },
    { label: "Lowercase letter",  ok: checks.lowercase },
    { label: "Number",            ok: checks.number    },
    { label: "Special symbol",    ok: checks.symbol    },
  ];

  return (
    <motion.div
      className="mt-3 space-y-2"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{    opacity: 0, height: 0 }}
    >
      {/* Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${strength.color}`}
            initial={{ width: "0%" }}
            animate={{ width: strength.width }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <span className={`text-xs font-semibold ${
          strength.label === "Strong" ? "text-emerald-400" :
          strength.label === "Good"   ? "text-blue-400"   :
          strength.label === "Fair"   ? "text-yellow-400" : "text-red-400"
        }`}>{strength.label}</span>
      </div>

      {/* Check Items */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {checkItems.map((c) => (
          <motion.div
            key={c.label}
            className={`flex items-center gap-1.5 text-xs transition-colors duration-200
                        ${c.ok ? "text-emerald-400" : "text-white/30"}`}
            animate={{ color: c.ok ? "#34d399" : "rgba(255,255,255,0.3)" }}
          >
            <span>{c.ok ? "✓" : "○"}</span>
            {c.label}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Username Availability ────────────────────────────────────────────────────
const UsernameStatus = ({ status }) => {
  if (!status) return null;
  const configs = {
    checking:    { color: "text-white/40",    icon: "⟳", text: "Checking..." },
    available:   { color: "text-emerald-400", icon: "✓", text: "Username available!" },
    unavailable: { color: "text-red-400",     icon: "✗", text: "Username taken." },
    invalid:     { color: "text-yellow-400",  icon: "⚠", text: "3–20 chars, letters/numbers/_ only." },
  };
  const c = configs[status];
  return (
    <motion.p className={`text-xs mt-1.5 flex items-center gap-1 ${c.color}`}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <span>{c.icon}</span> {c.text}
    </motion.p>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN REGISTER PAGE
// ═════════════════════════════════════════════════════════════════════════════
const Register = () => {
  const navigate     = useNavigate();
  const { dispatch } = useAuthContext();

  const [form, setForm] = useState({
    name:            "",
    username:        "",
    email:           "",
    password:        "",
    confirmPassword: "",
    agreeTerms:      false,
  });

  const [errors,          setErrors]          = useState({});
  const [alert,           setAlert]           = useState(null);
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [usernameStatus,  setUsernameStatus]  = useState(null);  // checking | available | unavailable | invalid
  const [step,            setStep]            = useState(1);     // 1 = form, 2 = verify email

  // ── Debounced Username Check ───────────────────────────────────────────────
  useEffect(() => {
    if (!form.username) { setUsernameStatus(null); return; }
    if (!validateUsername(form.username)) { setUsernameStatus("invalid"); return; }

    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const data = await checkUsername(form.username);
        setUsernameStatus(data.available ? "available" : "unavailable");
      } catch {
        setUsernameStatus(null);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [form.username]);

  // ── Validate ───────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.name.trim())              errs.name    = "Full name is required.";
    else if (form.name.trim().length < 2) errs.name  = "Name must be at least 2 characters.";

    if (!form.username)                 errs.username = "Username is required.";
    else if (!validateUsername(form.username)) errs.username = "3–20 chars, letters/numbers/_ only.";
    else if (usernameStatus === "unavailable") errs.username = "This username is already taken.";

    if (!form.email)                    errs.email    = "Email is required.";
    else if (!validateEmail(form.email)) errs.email   = "Enter a valid email address.";

    if (!form.password)                 errs.password = "Password is required.";
    else {
      const checks = validatePassword(form.password);
      const passed = Object.values(checks).filter(Boolean).length;
      if (passed < 3) errs.password = "Password is too weak. Add uppercase, numbers & symbols.";
    }

    if (!form.confirmPassword)          errs.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword)
                                        errs.confirmPassword = "Passwords do not match.";

    if (!form.agreeTerms)               errs.agreeTerms = "You must agree to the Terms & Privacy Policy.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: "" }));
    if (alert) setAlert(null);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      setAlert(null);
      await registerUser({
        name:     form.name.trim(),
        username: form.username.toLowerCase(),
        email:    form.email.toLowerCase(),
        password: form.password,
      });
      setStep(2); // Show email verification screen
    } catch (err) {
      const msg = err?.response?.data?.message || "Registration failed. Please try again.";
      setAlert({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = (provider) => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/${provider}`;
  };

  // ── Email Verification Screen ──────────────────────────────────────────────
  if (step === 2) {
    return (
      <AuthLayout>
        <motion.div
          className="text-center py-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 20 }}
        >
          <motion.div
            className="text-7xl mb-6"
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            📬
          </motion.div>
          <h2 className="text-2xl font-bold mb-3">Verify your email</h2>
          <p className="text-white/50 text-sm leading-relaxed mb-6">
            We sent a verification link to{" "}
            <span className="text-primary-400 font-semibold">{form.email}</span>.
            <br />
            Click the link to activate your account.
          </p>

          {/* Steps */}
          <div className="glass rounded-2xl p-5 mb-6 text-left space-y-3">
            {[
              "Open your email inbox",
              "Click the verification link",
              "You'll be redirected to Chatify",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-white/60">
                <div className="w-6 h-6 rounded-full bg-primary-500/20 border border-primary-500/30
                                flex items-center justify-center text-xs font-bold text-primary-400 flex-shrink-0">
                  {i + 1}
                </div>
                {step}
              </div>
            ))}
          </div>

          <p className="text-xs text-white/30">
            Didn't receive it?{" "}
            <button className="text-primary-400 hover:text-primary-300 transition-colors">
              Resend email
            </button>
          </p>

          <div className="mt-6 pt-5 border-t border-white/10">
            <Link to="/login" className="text-sm text-white/40 hover:text-white transition-colors">
              ← Back to Login
            </Link>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  // ── Main Register Form ─────────────────────────────────────────────────────
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start chatting in under 60 seconds"
    >
      <AnimatePresence>
        {alert && <AlertBanner type={alert.type} message={alert.message} />}
      </AnimatePresence>

      {/* Social Auth */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <motion.button onClick={() => handleSocialAuth("google")}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                     bg-white/5 border border-white/10 hover:bg-white/10
                     text-sm font-medium transition-all duration-200"
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <IconGoogle /> Google
        </motion.button>
        <motion.button onClick={() => handleSocialAuth("github")}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                     bg-white/5 border border-white/10 hover:bg-white/10
                     text-sm font-medium transition-all duration-200"
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <IconGithub /> GitHub
        </motion.button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-white/30">or register with email</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">

        {/* Full Name */}
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
            Full Name
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"><IconUser /></span>
            <input
              type="text" name="name" value={form.name}
              onChange={handleChange} placeholder="John Doe" autoComplete="name"
              className={`input-glass pl-11 ${errors.name ? "border-red-500/60" : ""}`}
            />
          </div>
          <FieldError message={errors.name} />
        </div>

        {/* Username */}
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"><IconAt /></span>
            <input
              type="text" name="username" value={form.username}
              onChange={handleChange} placeholder="johndoe_" autoComplete="username"
              className={`input-glass pl-11 ${errors.username ? "border-red-500/60" :
                usernameStatus === "available" ? "border-emerald-500/60" : ""}`}
            />
          </div>
          {!errors.username
            ? <UsernameStatus status={usernameStatus} />
            : <FieldError message={errors.username} />
          }
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"><IconMail /></span>
            <input
              type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="you@example.com" autoComplete="email"
              className={`input-glass pl-11 ${errors.email ? "border-red-500/60" : ""}`}
            />
          </div>
          <FieldError message={errors.email} />
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"><IconLock /></span>
            <input
              type={showPassword ? "text" : "password"} name="password" value={form.password}
              onChange={handleChange} placeholder="Create a strong password" autoComplete="new-password"
              className={`input-glass pl-11 pr-11 ${errors.password ? "border-red-500/60" : ""}`}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
              {showPassword ? <IconEyeClosed /> : <IconEyeOpen />}
            </button>
          </div>
          <FieldError message={errors.password} />
          <AnimatePresence>
            {form.password && <PasswordStrength password={form.password} />}
          </AnimatePresence>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
            Confirm Password
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"><IconLock /></span>
            <input
              type={showConfirm ? "text" : "password"} name="confirmPassword"
              value={form.confirmPassword} onChange={handleChange}
              placeholder="Repeat your password" autoComplete="new-password"
              className={`input-glass pl-11 pr-11
                ${errors.confirmPassword   ? "border-red-500/60" :
                  form.confirmPassword && form.password === form.confirmPassword
                    ? "border-emerald-500/60" : ""}`}
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
              {showConfirm ? <IconEyeClosed /> : <IconEyeOpen />}
            </button>
          </div>
          {!errors.confirmPassword && form.confirmPassword && form.password === form.confirmPassword && (
            <motion.p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span>✓</span> Passwords match
            </motion.p>
          )}
          <FieldError message={errors.confirmPassword} />
        </div>

        {/* Terms & Privacy */}
        <div>
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 flex-shrink-0">
              <input type="checkbox" name="agreeTerms" checked={form.agreeTerms}
                onChange={handleChange} className="sr-only" />
              <motion.div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center
                             transition-colors duration-200
                             ${form.agreeTerms
                               ? "bg-primary-500 border-primary-500"
                               : "border-white/20 bg-transparent group-hover:border-white/40"}`}
                whileTap={{ scale: 0.85 }}
              >
                {form.agreeTerms && (
                  <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }}
                    width="12" height="12" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12"/>
                  </motion.svg>
                )}
              </motion.div>
            </div>
            <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors leading-relaxed select-none">
              I agree to the{" "}
              <Link to="/terms" className="text-primary-400 hover:text-primary-300 transition-colors">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-primary-400 hover:text-primary-300 transition-colors">
                Privacy Policy
              </Link>
            </span>
          </label>
          <FieldError message={errors.agreeTerms} />
        </div>

        {/* Submit */}
        <PrimaryButton
          type="submit" loading={loading} disabled={loading}
          size="md" className="w-full justify-center mt-2"
        >
          {loading ? (
            <><IconSpinner /> Creating account...</>
          ) : (
            <>Create Free Account <IconArrow /></>
          )}
        </PrimaryButton>
      </form>

      {/* Login Link */}
      <div className="mt-6 pt-6 border-t border-white/10 text-center">
        <p className="text-sm text-white/40">
          Already have an account?{" "}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      {/* Security Note */}
      <motion.div
        className="mt-5 flex items-center justify-center gap-2 text-xs text-white/20"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
      >
        <IconShield />
        <span>Your data is encrypted and never sold.</span>
      </motion.div>
    </AuthLayout>
  );
};

export default Register;
