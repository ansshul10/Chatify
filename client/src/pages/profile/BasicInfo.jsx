import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, AtSign, Link2, Github, Linkedin, Twitter, Globe, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { updateBasicInfo, updateSocialLinks, updateUsername } from "@/services/profileService";
import { checkUsername } from "@/services/authService";

// ── Shared UI Atoms ────────────────────────────────────────────────────────────
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

const InputField = ({ label, icon: Icon, error, hint, children }) => (
  <div>
    {label && <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">{label}</label>}
    <div className={`relative flex items-center bg-white/[0.04] border rounded-xl transition-all duration-200 focus-within:border-primary-500/50 focus-within:bg-white/[0.06]
      ${error ? "border-red-500/40" : "border-white/8 hover:border-white/15"}`}>
      {Icon && <Icon className="w-4 h-4 text-white/25 ml-4 flex-shrink-0" />}
      {children}
    </div>
    <AnimatePresence>
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5">
          <AlertCircle className="w-3 h-3" /> {error}
        </motion.p>
      )}
      {hint && !error && (
        <p className="text-xs text-white/25 mt-1.5">{hint}</p>
      )}
    </AnimatePresence>
  </div>
);

const SaveBtn = ({ loading, onClick, label = "Save Changes", variant = "primary" }) => (
  <motion.button onClick={onClick} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40
      ${variant === "primary"
        ? "bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30"
        : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"}`}>
    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
    {loading ? "Saving..." : label}
  </motion.button>
);

const Toast = ({ msg }) => (
  <AnimatePresence>
    {msg && (
      <motion.div initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.97 }} transition={{ type: "spring", damping: 20 }}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm mb-5
          ${msg.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
            : "bg-red-500/10 border-red-500/25 text-red-400"}`}>
        {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
        {msg.text}
      </motion.div>
    )}
  </AnimatePresence>
);

// ═══════════════════════════════════════════════════════════════════════════════
const BasicInfo = ({ user, profile, onUpdate, coverGradients }) => {
  const [name,    setName]    = useState(user.name);
  const [bio,     setBio]     = useState(profile.bio || "");
  const [avatar,  setAvatar]  = useState(user.avatar || "");
  const [cover,   setCover]   = useState(profile.coverColor);
  const [username, setUsername] = useState(user.username);
  const [unStatus, setUnStatus] = useState(null);
  const [social,  setSocial]  = useState({ ...profile.socialLinks });

  const [loadingBasic,  setLoadingBasic]  = useState(false);
  const [loadingUn,     setLoadingUn]     = useState(false);
  const [loadingSocial, setLoadingSocial] = useState(false);
  const [msg, setMsg] = useState(null);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3500); };

  const handleUsernameChange = async (val) => {
    setUsername(val);
    if (!val || !/^[a-zA-Z0-9_]{3,20}$/.test(val)) { setUnStatus("invalid"); return; }
    if (val === user.username) { setUnStatus(null); return; }
    setUnStatus("checking");
    try {
      const data = await checkUsername(val);
      setUnStatus(data.available ? "available" : "unavailable");
    } catch { setUnStatus(null); }
  };

  const saveBasic = async () => {
    try {
      setLoadingBasic(true);
      await updateBasicInfo({ name, bio, avatar, coverColor: cover });
      onUpdate(); showMsg("success", "Profile updated successfully!");
    } catch (e) { showMsg("error", e?.response?.data?.message || "Failed to update."); }
    finally { setLoadingBasic(false); }
  };

  const saveUsername = async () => {
    if (unStatus === "unavailable" || unStatus === "invalid") return;
    try {
      setLoadingUn(true);
      await updateUsername({ username });
      onUpdate(); showMsg("success", "Username updated!"); setUnStatus(null);
    } catch (e) { showMsg("error", e?.response?.data?.message || "Failed."); }
    finally { setLoadingUn(false); }
  };

  const saveSocial = async () => {
    try {
      setLoadingSocial(true);
      await updateSocialLinks(social);
      onUpdate(); showMsg("success", "Social links saved!");
    } catch { showMsg("error", "Failed to save links."); }
    finally { setLoadingSocial(false); }
  };

  return (
    <div className="max-w-2xl">
      <Toast msg={msg} />

      {/* Basic Info Card */}
      <SectionCard title="Basic Information" subtitle="Your public profile details">
        <div className="space-y-5">

          {/* Avatar Preview + URL */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              {avatar ? (
                <img src={avatar} alt="preview" className="w-16 h-16 rounded-2xl object-cover border-2 border-white/10" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-2xl font-black border-2 border-white/10">
                  {user.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <InputField label="Avatar URL" hint="Paste any public image URL">
                <input value={avatar} onChange={e => setAvatar(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-white/20 outline-none" />
              </InputField>
            </div>
          </div>

          {/* Full Name */}
          <InputField label="Full Name">
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-white/20 outline-none" />
          </InputField>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Bio</label>
            <div className={`bg-white/[0.04] border border-white/8 rounded-xl transition-all duration-200 focus-within:border-primary-500/50 focus-within:bg-white/[0.06]`}>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={200}
                placeholder="Tell people about yourself..."
                className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-white/20 outline-none resize-none" />
              <div className="px-4 pb-2 text-right">
                <span className="text-xs text-white/20">{bio.length}/200</span>
              </div>
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Email Address</label>
            <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 cursor-not-allowed">
              <span className="text-sm text-white/40">{user.email}</span>
              {user.isEmailVerified
                ? <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                : <span className="text-xs font-semibold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-full">
                    Unverified
                  </span>
              }
            </div>
          </div>

          {/* Cover Banner */}
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Cover Banner</label>
            <div className="flex gap-2.5 flex-wrap">
              {coverGradients.map((g) => (
                <motion.button key={g} onClick={() => setCover(g)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
                  className={`relative w-11 h-11 rounded-xl bg-gradient-to-br ${g} transition-all duration-200 overflow-hidden
                    ${cover === g ? "ring-2 ring-white ring-offset-2 ring-offset-[#080b14]" : "opacity-50 hover:opacity-80"}`}>
                  {cover === g && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-white drop-shadow-lg" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          <SaveBtn loading={loadingBasic} onClick={saveBasic} />
        </div>
      </SectionCard>

      {/* Username Card */}
      <SectionCard title="Username" subtitle="Change how others find you">
        <div className="space-y-3">
          <InputField
            error={
              unStatus === "unavailable" ? "This username is already taken." :
              unStatus === "invalid"     ? "3–20 chars, letters/numbers/_ only." : null
            }>
            <AtSign className="w-4 h-4 text-white/25 ml-4 flex-shrink-0" />
            <input value={username} onChange={e => handleUsernameChange(e.target.value)}
              placeholder="your_username"
              className={`w-full bg-transparent px-3 py-3 text-sm text-white placeholder-white/20 outline-none`} />
            {unStatus === "checking"  && <Loader2 className="w-4 h-4 text-white/30 animate-spin mr-4 flex-shrink-0" />}
            {unStatus === "available" && <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-4 flex-shrink-0" />}
          </InputField>
          {unStatus === "available" && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> Username is available!
            </motion.p>
          )}
          <SaveBtn loading={loadingUn} onClick={saveUsername} label="Update Username" />
        </div>
      </SectionCard>

      {/* Social Links Card */}
      <SectionCard title="Social Links" subtitle="Connect your social profiles">
        <div className="space-y-4">
          {[
            { key: "github",   label: "GitHub",   placeholder: "https://github.com/username",       Icon: Github   },
            { key: "linkedin", label: "LinkedIn",  placeholder: "https://linkedin.com/in/username",  Icon: Linkedin },
            { key: "twitter",  label: "Twitter/X", placeholder: "https://twitter.com/username",      Icon: Twitter  },
            { key: "website",  label: "Website",   placeholder: "https://yourwebsite.com",           Icon: Globe    },
          ].map(({ key, label, placeholder, Icon }) => (
            <InputField key={key} label={label} icon={Icon}>
              <input value={social[key]} onChange={e => setSocial(s => ({ ...s, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder-white/20 outline-none" />
              {social[key] && (
                <a href={social[key]} target="_blank" rel="noreferrer" className="mr-3 flex-shrink-0">
                  <Link2 className="w-4 h-4 text-primary-400 hover:text-primary-300 transition-colors" />
                </a>
              )}
            </InputField>
          ))}
          <div className="pt-1">
            <SaveBtn loading={loadingSocial} onClick={saveSocial} label="Save Links" />
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

export default BasicInfo;
