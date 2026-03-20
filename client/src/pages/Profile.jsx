import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User, Shield, Smartphone, Bell, Lock, AlertTriangle, CheckCircle2, Zap } from "lucide-react";
import { fetchProfile } from "@/services/profileService";
import { useAuthContext } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import BasicInfo            from "@/pages/profile/BasicInfo";
import SecuritySettings     from "@/pages/profile/SecuritySettings";
import SessionsDevices      from "@/pages/profile/SessionsDevices";
import NotificationSettings from "@/pages/profile/NotificationSettings";
import PrivacySettings      from "@/pages/profile/PrivacySettings";
import DangerZone           from "@/pages/profile/DangerZone";

const TABS = [
  { id: "basic",         label: "Profile",       Icon: User         },
  { id: "security",      label: "Security",      Icon: Shield       },
  { id: "sessions",      label: "Sessions",      Icon: Smartphone   },
  { id: "notifications", label: "Notifications", Icon: Bell         },
  { id: "privacy",       label: "Privacy",       Icon: Lock         },
  { id: "danger",        label: "Danger Zone",   Icon: AlertTriangle },
];

const COVER_GRADIENTS = [
  "from-sky-600 to-blue-700",
  "from-purple-600 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-600",
  "from-indigo-600 to-purple-700",
  "from-rose-500 to-pink-600",
];

const Profile = () => {
  const navigate     = useNavigate();
  const { dispatch } = useAuthContext();
  const [activeTab,   setActiveTab]   = useState("basic");
  const [profileData, setProfileData] = useState(null);
  const [loading,     setLoading]     = useState(true);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await fetchProfile();
      setProfileData(res.data);
    } catch {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080b14]">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin w-10 h-10 text-primary-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p className="text-white/40 text-sm font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  const { user, profile, completion } = profileData;

  return (
    <div className="min-h-screen bg-[#080b14] text-white">
      <Navbar />

      {/* Cover Banner */}
      <div className={`h-44 md:h-60 bg-gradient-to-r ${profile.coverColor} relative mt-16`}>
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(rgba(14,165,233,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(14,165,233,0.8) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Avatar + Name + Completion Row */}
        <div className="relative -mt-14 mb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">

          {/* Left: Avatar + Info */}
          <div className="flex items-end gap-5">
            <motion.div className="relative flex-shrink-0" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 20 }}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name}
                  className="w-28 h-28 rounded-3xl border-4 border-[#080b14] object-cover shadow-2xl" />
              ) : (
                <div className="w-28 h-28 rounded-3xl border-4 border-[#080b14] bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-4xl font-black shadow-2xl">
                  {user.name?.[0]?.toUpperCase()}
                </div>
              )}
              {user.isEmailVerified && (
                <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-emerald-500 rounded-xl flex items-center justify-center border-2 border-[#080b14] shadow-lg">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              )}
            </motion.div>

            <motion.div className="mb-1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <h1 className="text-2xl font-black tracking-tight">{user.name}</h1>
              <p className="text-white/40 text-sm mt-0.5">@{user.username}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${user.isOnline ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-white/20"}`} />
                  <span className="text-xs text-white/40">{user.isOnline ? "Online" : "Offline"}</span>
                </div>
                <span className="text-white/10">|</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider
                  ${user.subscription?.plan === "pro"        ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20" :
                    user.subscription?.plan === "enterprise" ? "bg-purple-500/15 text-purple-400 border border-purple-500/20" :
                    "bg-white/5 text-white/30 border border-white/10"}`}>
                  {user.subscription?.plan || "Free"}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider
                  ${user.role === "admin" ? "bg-primary-500/15 text-primary-400 border border-primary-500/20" : "hidden"}`}>
                  Admin
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right: Completion Card */}
          <motion.div className="glass rounded-2xl px-5 py-4 lg:min-w-[240px] border border-white/5"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-primary-400" />
                <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Profile Strength</span>
              </div>
              <span className="text-sm font-black text-primary-400">{completion}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completion}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              />
            </div>
            <p className="text-xs text-white/25 mt-2 leading-relaxed">
              {completion < 100 ? "Add more details to complete your profile" : "🎉 Profile is fully complete!"}
            </p>
          </motion.div>
        </div>

        {/* Bio preview */}
        {profile.bio && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-white/50 text-sm mb-8 max-w-xl leading-relaxed -mt-4 pl-1">
            {profile.bio}
          </motion.p>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-0.5 border-b border-white/8 mb-8 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}>
          {TABS.map((tab) => {
            const isActive  = activeTab === tab.id;
            const isDanger  = tab.id === "danger";
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3.5 text-sm font-semibold whitespace-nowrap transition-all duration-200
                  ${isActive
                    ? isDanger ? "text-red-400" : "text-primary-400"
                    : isDanger ? "text-white/25 hover:text-red-400/60" : "text-white/35 hover:text-white/70"
                  }`}>
                <tab.Icon className="w-4 h-4" />
                {tab.label}
                {isActive && (
                  <motion.div layoutId="tab-indicator"
                    className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full
                      ${isDanger ? "bg-red-400" : "bg-gradient-to-r from-primary-500 to-purple-500"}`}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="pb-20">
            {activeTab === "basic"         && <BasicInfo            user={user} profile={profile} onUpdate={loadProfile} coverGradients={COVER_GRADIENTS} />}
            {activeTab === "security"      && <SecuritySettings     user={user} onUpdate={loadProfile} />}
            {activeTab === "sessions"      && <SessionsDevices />}
            {activeTab === "notifications" && <NotificationSettings profile={profile} onUpdate={loadProfile} />}
            {activeTab === "privacy"       && <PrivacySettings      user={user} profile={profile} onUpdate={loadProfile} />}
            {activeTab === "danger"        && <DangerZone           user={user} dispatch={dispatch} />}
          </motion.div>
        </AnimatePresence>

      </div>
      <Footer />
    </div>
  );
};

export default Profile;
