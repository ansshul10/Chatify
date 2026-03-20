import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconGithub   = () => <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>;
const IconTwitter  = () => <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
const IconDiscord  = () => <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>;
const IconLinkedin = () => <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;

const SOCIAL_LINKS = [
  { icon: <IconGithub />,  href: "#", label: "GitHub",   color: "hover:text-white"         },
  { icon: <IconTwitter />, href: "#", label: "Twitter",  color: "hover:text-sky-400"        },
  { icon: <IconDiscord />, href: "#", label: "Discord",  color: "hover:text-indigo-400"     },
  { icon: <IconLinkedin />,href: "#", label: "LinkedIn", color: "hover:text-blue-500"       },
];

// Updated links to point to the new pages
const PRODUCT_LINKS  = [
  { label: "Features",        href: "/features" },
  { label: "Security",        href: "/security" },
  { label: "Changelog",       href: "/changelog" },
  { label: "Pricing",         href: "/pricing"   },
  { label: "Support",         href: "/support"   }, // ← NEW

];

const COMMUNITY_LINKS = [
  { label: "Discord Server",  href: "#" },
  { label: "Blog",            href: "/blog" },
  { label: "Forums",          href: "#" },
  { label: "Open Source",     href: "#" },
  { label: "Roadmap",         href: "#" },
];

// ── Magnetic Link ──────────────────────────────────────────────────────────────
const MagneticLink = ({ children, href, className = "" }) => {
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    const el   = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x    = (e.clientX - (rect.left + rect.width  / 2)) * 0.25;
    const y    = (e.clientY - (rect.top  + rect.height / 2)) * 0.25;
    el.style.transform = `translate(${x}px, ${y}px)`;
  };

  const handleMouseLeave = () => {
    if (ref.current) ref.current.style.transform = "translate(0,0)";
  };

  return (
    <div ref={ref} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      style={{ transition: "transform 0.2s ease", display: "inline-block" }}>
      <Link 
        to={href}
        onClick={() => window.scrollTo(0, 0)} // Ensures page starts at top
        className={`text-sm text-white/50 hover:text-white transition-colors duration-200 ${className}`}
      >
        {children}
      </Link>
    </div>
  );
};

// ── Main Footer ────────────────────────────────────────────────────────────────
const Footer = () => {
  const [email,     setEmail]     = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [isOperational, setIsOperational] = useState(true);

  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const { data } = await axiosInstance.get("/health");
        setIsOperational(data.message === "OK");
      } catch (err) {
        setIsOperational(false);
      }
    };
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 15000); 
    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await axiosInstance.post("/subscribers", { email });
      setSubmitted(true);
      setEmail("");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="relative mt-32 border-t border-white/5">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px
                      bg-gradient-to-r from-transparent via-primary-500 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">

          {/* Column 1 — Logo + Socials */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600
                             flex items-center justify-center shadow-lg">
                <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <Link to="/" onClick={() => window.scrollTo(0,0)} className="font-bold text-xl gradient-text">Chatify</Link>
            </div>
            <p className="text-sm text-white/40 leading-relaxed max-w-[200px]">
              The world's most secure real-time messaging platform.
              Connect, chat, and collaborate — all in one place.
            </p>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map((s) => (
                <motion.a key={s.label} href={s.href} aria-label={s.label}
                  className={`p-2 rounded-xl bg-white/5 text-white/40 ${s.color}
                              hover:bg-white/10 transition-all duration-200`}
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.9 }}>
                  {s.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Column 2 — Product */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider">Product</h4>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.label}><MagneticLink href={l.href}>{l.label}</MagneticLink></li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Community */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider">Community</h4>
            <ul className="space-y-3">
              {COMMUNITY_LINKS.map((l) => (
                <li key={l.label}><MagneticLink href={l.href}>{l.label}</MagneticLink></li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Real-Time Status + Newsletter */}
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Status</h4>
              <div className="flex items-center gap-2 glass px-3 py-2 rounded-xl w-fit">
                <motion.span
                  className={`w-2 h-2 rounded-full ${isOperational ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <span className={`text-xs font-medium ${isOperational ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isOperational ? "All Systems Operational" : "Systems Offline"}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Newsletter</h4>
              {submitted ? (
                <motion.div
                  className="glass px-4 py-3 rounded-xl text-sm text-emerald-400"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}>
                  🎉 You're in! Welcome to the community.
                </motion.div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="input-glass text-sm py-2.5"
                  />
                  {error && <p className="text-[11px] text-red-400 ml-1">{error}</p>}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-glow text-sm py-2.5"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}>
                    {loading ? "Joining..." : "Join Community"}
                  </motion.button>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row
                        items-center justify-between gap-4 text-xs text-white/30">
          <p>© {new Date().getFullYear()} Chatify. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" onClick={() => window.scrollTo(0,0)} className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" onClick={() => window.scrollTo(0,0)} className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;