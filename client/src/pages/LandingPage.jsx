import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PrimaryButton, GhostButton } from "@/components/Button";
import useAuth from "@/hooks/useAuth"; // Ensure this hook provides isAuthenticated

// ─── Custom Cursor ────────────────────────────────────────────────────────────
const CustomCursor = () => {
  const cursorRef = useRef(null);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const move = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
    };
    const over = (e) => setHovering(!!e.target.closest("a, button, [data-hover]"));
    const leave = () => setHovering(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    window.addEventListener("mouseout", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mouseout", leave);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className={`custom-cursor hidden lg:block ${hovering ? "hovering" : ""}`}
    />
  );
};

// ─── Typewriter Effect ────────────────────────────────────────────────────────
const TYPEWRITER_WORDS = [
  "Connect with Friends",
  "Chat in Real-Time",
  "Collaborate Securely",
  "Build Communities",
];

const TypewriterText = () => {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = TYPEWRITER_WORDS[index];
    const timeout = deleting
      ? setTimeout(() => {
          setText((t) => t.slice(0, -1));
          if (text.length === 1) {
            setDeleting(false);
            setIndex((i) => (i + 1) % TYPEWRITER_WORDS.length);
          }
        }, 50)
      : setTimeout(() => {
          setText(word.slice(0, text.length + 1));
          if (text === word) setTimeout(() => setDeleting(true), 1800);
        }, 80);
    return () => clearTimeout(timeout);
  }, [text, deleting, index]);

  return (
    <span className="gradient-text">
      {text}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ repeat: Infinity, duration: 0.7 }}
        className="inline-block ml-0.5 w-0.5 h-[1em] bg-primary-400 align-middle"
      />
    </span>
  );
};

// ─── Floating Message Cards ───────────────────────────────────────────────────
const FLOAT_CARDS = [
  { name: "Alex K.", msg: "Hey! Are you coming tonight?", avatar: "A", delay: 0, side: "left" },
  {
    name: "Sarah M.",
    msg: "The new update looks seriously good.",
    avatar: "S",
    delay: 1.5,
    side: "right",
  },
  {
    name: "James R.",
    msg: "Voice message received, sounds great.",
    avatar: "J",
    delay: 3,
    side: "left",
  },
];

const FloatingCard = ({ card }) => (
  <motion.div
    className={`absolute glass px-4 py-3 rounded-2xl flex items-center gap-3 w-64 shadow-xl
                ${card.side === "left" ? "-left-10 lg:-left-24" : "-right-10 lg:-right-24"}`}
    animate={{ y: [0, -10, 0] }}
    transition={{ repeat: Infinity, duration: 4 + card.delay, ease: "easeInOut", delay: card.delay }}
    style={{ top: `${20 + card.delay * 18}%` }}
  >
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
      {card.avatar}
    </div>
    <div>
      <p className="text-xs font-semibold text-white">{card.name}</p>
      <p className="text-xs text-white/60">{card.msg}</p>
    </div>
    <span className="status-dot ml-auto flex-shrink-0" />
  </motion.div>
);

// ─── Features Bento ───────────────────────────────────────────────────────────
const FEATURES = [
  {
    title: "End-to-End Encryption",
    desc: "Every message and file is encrypted using AES-256. Zero knowledge — not even we can read your chats.",
    icon: "",
    size: "lg:col-span-2",
    gradient: "from-blue-600/20 to-cyan-600/20",
    tag: "Security",
  },
  {
    title: "Real-Time Messaging",
    desc: "Sub-50ms message delivery powered by WebSockets. Typing indicators, read receipts, and live reactions.",
    icon: "⚡",
    size: "lg:col-span-1",
    gradient: "from-purple-600/20 to-pink-600/20",
    tag: "Performance",
  },
  {
    title: "Smart AI Assistant",
    desc: "Built-in AI to summarize long chats, translate messages in 50+ languages, and auto-reply when you're away.",
    icon: "AI",
    size: "lg:col-span-1",
    gradient: "from-orange-600/20 to-red-600/20",
    tag: "AI",
  },
  {
    title: "Cross-Platform Sync",
    desc: "Seamlessly switch between iOS, Android, Web, and Desktop. Your chats follow you everywhere, in real-time.",
    icon: "∞",
    size: "lg:col-span-2",
    gradient: "from-indigo-600/20 to-violet-600/20",
    tag: "Sync",
  },
];

// ─── Mock Live Chat Demo ──────────────────────────────────────────────────────
const AI_RESPONSES = [
  "Hey, welcome to Chatify! How can I help?",
  "Chatify supports voice messages, file sharing, and group chats.",
  "We use AES-256 encryption — your messages stay private.",
  "You can invite friends by sharing your unique Chatify link.",
];

const LiveDemo = () => {
  const [messages, setMessages] = useState([
    { id: 1, type: "bot", text: "Hey, welcome to Chatify. Try typing something." },
  ]);
  const [input, setInput] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [aiIndex, setAiIndex] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [messages, aiTyping]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), type: "user", text: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setAiTyping(true);
    setTimeout(() => {
      const reply = AI_RESPONSES[aiIndex % AI_RESPONSES.length];
      setMessages((m) => [...m, { id: Date.now() + 1, type: "bot", text: reply }]);
      setAiTyping(false);
      setAiIndex((i) => i + 1);
    }, 1200);
  };

  return (
    <div className="glass rounded-3xl overflow-hidden max-w-md w-full mx-auto shadow-2xl">
      <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-sm font-bold">
          C
        </div>
        <div>
          <p className="text-sm font-semibold">Chatify Bot</p>
          <div className="flex items-center gap-1.5">
            <span className="status-dot w-1.5 h-1.5" />
            <span className="text-xs text-emerald-400">Online</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 h-64 overflow-y-auto space-y-3 scrollbar-hide">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-4 py-2.5 rounded-2xl text-sm max-w-[80%] leading-relaxed
              ${
                msg.type === "user"
                  ? "bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-br-sm"
                  : "bg-white/10 text-white/90 rounded-bl-sm"
              }`}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}
        {aiTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-white/10 flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 bg-white/50 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 pb-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="input-glass text-sm py-2.5 flex-1"
        />
        <motion.button
          onClick={sendMessage}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center flex-shrink-0"
        >
          <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
};

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    role: "Product Designer",
    text: "Chatify is hands-down the cleanest chat app I've used. The UI is stunning!",
    avatar: "P",
    stars: 5,
  },
  {
    name: "Marcus Chen",
    role: "Software Engineer",
    text: "The encryption and security features are world-class. I trust it with client comms.",
    avatar: "M",
    stars: 5,
  },
  {
    name: "Zara Williams",
    role: "Startup Founder",
    text: "We replaced other tools with Chatify. Faster, leaner, and way more polished.",
    avatar: "Z",
    stars: 5,
  },
  {
    name: "Rahul Gupta",
    role: "DevOps Engineer",
    text: "99.9% uptime feels real. I haven't seen a single outage in months.",
    avatar: "R",
    stars: 5,
  },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "Is Chatify free to use?",
    a: "Yes! Chatify is free for personal use with up to 10 active chats. Pro plans unlock unlimited chats, file storage, and API access.",
  },
  {
    q: "How secure are my messages?",
    a: "All messages are encrypted end-to-end using AES-256. Only you and your recipient can read them — not even our servers.",
  },
  {
    q: "Is there a mobile app?",
    a: "Chatify works great on mobile browsers today. Native Android and iOS apps are in the works.",
  },
  {
    q: "Can I use Chatify for teams?",
    a: "Absolutely! Create team workspaces, channels, and group chats. Invite unlimited members on the Team plan.",
  },
  {
    q: "Does Chatify support file sharing?",
    a: "Yes — share images, videos, documents, and voice messages up to 100MB per file on the free plan.",
  },
];

// ─── Platform Icons ────────────────────────────────────────────────────────────
const PLATFORMS = [
  { name: "Android Web", icon: "📱", status: "Use Now", href: "#" },
  { name: "iOS Web", icon: "📱", status: "Use Now", href: "#" },
  { name: "Web", icon: "🖥️", status: "Use Now", href: "/chat" },
  { name: "Android App", icon: "🤖", status: "Coming Soon", href: "#" },
  { name: "iOS App", icon: "🍎", status: "Coming Soon", href: "#" },
  { name: "Desktop App", icon: "💻", status: "Coming Soon", href: "#" },
];

// ─── Scroll Reveal Hook ────────────────────────────────────────────────────────
const useScrollReveal = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        }),
      { threshold: 0.1 },
    );
    document
      .querySelectorAll(".reveal, .reveal-left, .reveal-right")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
};

// ─── Exit Intent Popup ─────────────────────────────────────────────────────────
const ExitPopup = ({ onClose }) => (
  <motion.div
    className="fixed inset-0 z-[9998] flex items-center justify-center px-4"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
    <motion.div
      className="relative glass rounded-3xl p-10 max-w-md w-full text-center shadow-2xl"
      initial={{ scale: 0.85, y: 30 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.85, y: 30 }}
      transition={{ type: "spring", damping: 20 }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <h2 className="text-2xl font-bold mb-2">Wait! Don&apos;t miss out.</h2>
      <p className="text-white/50 text-sm mb-6">
        Join thousands of users already chatting. Sign up free — no credit card needed.
      </p>
      <PrimaryButton href="/register" size="lg" className="w-full justify-center">
        Create Free Account
      </PrimaryButton>
      <button
        onClick={onClose}
        className="mt-4 text-xs text-white/30 hover:text-white/60 transition-colors"
      >
        No thanks, I&apos;ll miss out
      </button>
    </motion.div>
  </motion.div>
);

// ─── Marquee Logos (Trusted By) ───────────────────────────────────────────────
const TRUSTED = [
  "Andromeda Labs",
  "Milkyway Corp",
  "Orion Systems",
  "Nebula Networks",
  "Quantum Chat Co.",
  "Alpha Centauri Guild",
  "Lunar Dev Studio",
  "Mars HQ",
];

// ═════════════════════════════════════════════════════════════════════════════
// MAIN LANDING PAGE
// ═════════════════════════════════════════════════════════════════════════════
const LandingPage = () => {
  const { isAuthenticated } = useAuth(); // Hook to check if logged in
  const [theme, setTheme] = useState("dark");
  const [exitPopup, setExitPopup] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);
  const [faqSearch, setFaqSearch] = useState("");
  const { scrollY } = useScroll();

  // live stats
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [messagesToday, setMessagesToday] = useState(0);
  const [uptime, setUptime] = useState("99.9%");
  const [apiStatus, setApiStatus] = useState("checking"); // up | down | checking

  const [communityEmail, setCommunityEmail] = useState("");
  const [communityStatus, setCommunityStatus] = useState(null);
  const [communityLoading, setCommunityLoading] = useState(false);

  // Parallax transforms
  const heroY = useTransform(scrollY, [0, 500], [0, -80]);
  const heroBlobY = useTransform(scrollY, [0, 500], [0, -120]);

  useScrollReveal();

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Exit intent Logic - FIXED to check isAuthenticated
  useEffect(() => {
    if (isAuthenticated) return; // DON'T show if logged in

    let shown = false;
    const handler = (e) => {
      if (e.clientY <= 5 && !shown) {
        shown = true;
        setExitPopup(true);
      }
    };
    document.addEventListener("mouseleave", handler);
    return () => document.removeEventListener("mouseleave", handler);
  }, [isAuthenticated]); // Added isAuthenticated as dependency

  // Live stats fetch
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stats/live`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setOnlineUsers(data.onlineUsers);
          setMessagesToday(data.messagesToday);
          setUptime(data.uptime);
        }
      } catch {
        // ignore
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  // System health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/health`);
        if (res.ok) setApiStatus("up");
        else setApiStatus("down");
      } catch {
        setApiStatus("down");
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const filteredFaqs = FAQS.filter(
    (f) =>
      f.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.a.toLowerCase().includes(faqSearch.toLowerCase()),
  );

  const stats = [
    { value: (onlineUsers || 10000).toLocaleString() + "+", label: "Users Online" },
    { value: (messagesToday || 1000000).toLocaleString() + "+", label: "Messages Today" },
    { value: uptime, label: "Uptime" },
    { value: "256", label: "Bit Encryption" },
  ];

  const handleJoinCommunity = async (e) => {
    e.preventDefault();
    if (!communityEmail.trim()) {
      setCommunityStatus({ type: "error", message: "Please enter your email." });
      return;
    }
    setCommunityLoading(true);
    setCommunityStatus(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/subscribers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: communityEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setCommunityStatus({ type: "success", message: data.message });
        setCommunityEmail("");
      } else {
        setCommunityStatus({
          type: "error",
          message: data.message || "Something went wrong.",
        });
      }
    } catch {
      setCommunityStatus({ type: "error", message: "Failed to join. Try again." });
    } finally {
      setCommunityLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#080b14] text-white overflow-x-hidden ${theme}`}>
      <CustomCursor />
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center pt-40 pb-20 px-6 overflow-hidden">
        <motion.div
          style={{ y: heroBlobY }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-600/15 rounded-full blur-[120px] pointer-events-none"
        />
        <motion.div
          style={{ y: heroBlobY }}
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none"
        />

        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(14,165,233,0.8) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(14,165,233,0.8) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />

        <motion.div style={{ y: heroY }} className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
            className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-xs font-medium text-primary-300 mb-8 border border-primary-500/20"
          >
            <motion.span
              className="status-dot"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            {onlineUsers
              ? `${onlineUsers.toLocaleString()}+ users online right now`
              : "Users are joining right now"}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6 tracking-tight"
          >
            The future of
            <br />
            <TypewriterText />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Encrypted, blazing-fast messaging for individuals and teams. Built for privacy.
            Designed for delight.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <PrimaryButton href="/register" size="lg">
              Start Chatting Free
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </PrimaryButton>
            <GhostButton href="/#demo" size="lg">
              Live Demo ↓
            </GhostButton>
          </motion.div>

          <div className="relative inline-block">
            {FLOAT_CARDS.map((card, i) => (
              <FloatingCard key={i} card={card} />
            ))}

            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.6, type: "spring", damping: 20 }}
              className="glass rounded-3xl p-1.5 shadow-[0_30px_80px_rgba(14,165,233,0.2)] max-w-sm mx-auto"
            >
              <div className="bg-[#0d111e] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/70" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <span className="w-3 h-3 rounded-full bg-green-500/70" />
                  </div>
                  <div className="flex-1 text-center text-xs text-white/30">
                    Chatify — Messages
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    {
                      side: "left",
                      text: "Hey! Did you check the new update?",
                      time: "2:30 PM",
                    },
                    {
                      side: "right",
                      text: "Yes, it looks absolutely on point.",
                      time: "2:31 PM",
                    },
                    {
                      side: "left",
                      text: "The encryption feature is seriously solid.",
                      time: "2:31 PM",
                    },
                    {
                      side: "right",
                      text: "Totally agree. Best chat experience so far.",
                      time: "2:32 PM",
                    },
                  ].map((msg, i) => (
                    <motion.div
                      key={i}
                      className={`flex ${msg.side === "right" ? "justify-end" : ""}`}
                      initial={{ opacity: 0, x: msg.side === "right" ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.15 }}
                    >
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-xs max-w-[80%]
                        ${
                          msg.side === "right"
                            ? "bg-gradient-to-r from-primary-600 to-purple-600 rounded-br-sm"
                            : "bg-white/10 rounded-bl-sm"
                        }`}
                      >
                        <p>{msg.text}</p>
                        <p className="text-[10px] opacity-50 mt-1 text-right">{msg.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* LIVE STATS */}
      <section className="py-16 px-6 border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              className="glass rounded-2xl p-6 text-center reveal"
              whileHover={{ scale: 1.04, y: -4 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-7 h-7 rounded-full bg-primary-500/30 mx-auto mb-3" />
              <div className="text-3xl font-black gradient-text">{stat.value}</div>
              <div className="text-sm text-white/40 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TRUSTED BY MARQUEE */}
      <section className="py-14 px-6 overflow-hidden">
        <p className="text-center text-xs text-white/30 uppercase tracking-widest mb-8">
          Trusted by teams across Earth, Mars HQ, Andromeda Labs & Alpha Centauri Guild
        </p>
        <div className="flex gap-12 animate-marquee whitespace-nowrap">
          {[...TRUSTED, ...TRUSTED].map((name, i) => (
            <span
              key={i}
              className="text-white/20 font-bold text-xl hover:text-white/60 transition-colors duration-300 cursor-default select-none"
            >
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 reveal">
            <span className="text-xs font-semibold text-primary-400 uppercase tracking-widest">
              Features
            </span>
            <h2 className="text-4xl lg:text-5xl font-black mt-3 mb-4">
              Everything you need.
              <br />
              <span className="gradient-text">Nothing you don&apos;t.</span>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              Built from the ground up with performance, privacy, and beauty as first-class
              priorities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={i}
                className={`glass rounded-3xl p-7 reveal group cursor-default
                            bg-gradient-to-br ${feat.gradient} relative overflow-hidden
                            ${feat.size}`}
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 to-transparent rounded-3xl" />
                <div className="relative z-10">
                  <div className="text-2xl mb-4 font-bold">{feat.icon}</div>
                  <span className="text-[10px] font-semibold text-primary-400 uppercase tracking-widest bg-primary-500/10 px-2 py-1 rounded-full">
                    {feat.tag}
                  </span>
                  <h3 className="text-xl font-bold mt-3 mb-2">{feat.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE CHAT DEMO */}
      <section
        id="demo"
        className="py-24 px-6 bg-gradient-to-b from-transparent via-primary-900/10 to-transparent"
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="reveal mb-12">
            <span className="text-xs font-semibold text-primary-400 uppercase tracking-widest">
              Live Demo
            </span>
            <h2 className="text-4xl lg:text-5xl font-black mt-3 mb-4">
              Try it <span className="gradient-text">right now.</span>
            </h2>
            <p className="text-white/40">No signup needed — just type and experience Chatify live.</p>
          </div>
          <div className="reveal">
            <LiveDemo />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 reveal">
            <span className="text-xs font-semibold text-primary-400 uppercase tracking-widest">
              Reviews
            </span>
            <h2 className="text-4xl font-black mt-3">
              Loved by <span className="gradient-text">thousands.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                className="glass rounded-3xl p-6 reveal group"
                whileHover={{ scale: 1.03, y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <span key={s} className="text-yellow-400 text-sm">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3 border-t border-white/10 pt-4">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-white/40">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORM AVAILABILITY */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="reveal mb-12">
            <span className="text-xs font-semibold text-primary-400 uppercase tracking-widest">
              Availability
            </span>
            <h2 className="text-4xl font-black mt-3 mb-2">
              Chat from <span className="gradient-text">anywhere.</span>
            </h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 reveal">
            {PLATFORMS.map((p, i) => (
              <motion.a
                key={i}
                href={p.href}
                className="glass rounded-2xl p-4 flex flex-col items-center gap-2 group"
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <span className="text-3xl">{p.icon}</span>
                <span className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors">
                  {p.name}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium
                  ${
                    p.status === "Coming Soon"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {p.status}
                </span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* GAMIFIED CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            className="glass rounded-3xl p-10 text-center border border-primary-500/20 bg-gradient-to-br from-primary-900/20 to-purple-900/20 reveal"
            whileHover={{ scale: 1.01 }}
          >
            <h3 className="text-2xl font-bold mb-3">
              Only <span className="gradient-text">2 steps</span> to start chatting!
            </h3>
            <div className="flex items-center justify-center gap-3 mb-6">
              {["Create Account", "Start Chatting"].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </div>
                    <span className="text-sm text-white/70">{step}</span>
                  </div>
                  {i === 0 && <span className="text-white/20">→</span>}
                </div>
              ))}
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 mb-6 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full"
                initial={{ width: "0%" }}
                whileInView={{ width: "50%" }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <PrimaryButton href="/register" size="lg">
              Get Started — It&apos;s Free
            </PrimaryButton>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 reveal">
            <span className="text-xs font-semibold text-primary-400 uppercase tracking-widest">
              FAQ
            </span>
            <h2 className="text-4xl font-black mt-3 mb-4">
              Got <span className="gradient-text">questions?</span>
            </h2>
          </div>

          <div className="relative mb-8 reveal">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              placeholder="Search questions..."
              className="input-glass pl-11"
            />
          </div>

          <div className="space-y-3 reveal">
            {filteredFaqs.map((faq, i) => (
              <motion.div key={i} className="glass rounded-2xl overflow-hidden" initial={false}>
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-white/5 transition-colors duration-200"
                >
                  <span className="font-medium text-sm">{faq.q}</span>
                  <motion.svg
                    animate={{ rotate: faqOpen === i ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="w-4 h-4 text-white/40 flex-shrink-0 ml-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </motion.svg>
                </button>
                <AnimatePresence>
                  {faqOpen === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-5 text-sm text-white/50 leading-relaxed border-t border-white/5 pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMUNITY / NEWSLETTER */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center reveal">
          <motion.div className="glass rounded-3xl p-12 border border-white/10" whileHover={{ scale: 1.01 }}>
            <h2 className="text-4xl font-black mb-3">
              Join the <span className="gradient-text">community.</span>
            </h2>
            <p className="text-white/40 mb-8 text-sm">
              Get early access to new features, tips, and exclusive updates.
            </p>
            <form
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              onSubmit={handleJoinCommunity}
            >
              <input
                type="email"
                value={communityEmail}
                onChange={(e) => setCommunityEmail(e.target.value)}
                placeholder="Enter your email"
                className="input-glass flex-1"
              />
              <PrimaryButton type="submit" disabled={communityLoading}>
                {communityLoading ? "Joining..." : "Join Now"}
              </PrimaryButton>
            </form>
            {communityStatus && (
              <p
                className={`mt-3 text-xs ${
                  communityStatus.type === "success" ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {communityStatus.message}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* System Status (bottom-left) */}
      <motion.div
        className="fixed bottom-6 left-6 z-50 glass px-4 py-2.5 rounded-full flex items-center gap-2 hidden md:flex shadow-xl"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5 }}
      >
        <motion.span
          className="w-2.5 h-2.5 rounded-full"
          animate={
            apiStatus === "up"
              ? { opacity: [1, 0.3, 1] }
              : { opacity: [1, 0.2, 1], scale: [1, 1.3, 1] }
          }
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{
            backgroundColor:
              apiStatus === "up"
                ? "#22c55e"
                : apiStatus === "down"
                ? "#ef4444"
                : "#fbbf24",
          }}
        />
        <span className="text-xs font-medium">
          {apiStatus === "up" && (
            <span className="text-emerald-400">All systems operational</span>
          )}
          {apiStatus === "down" && (
            <span className="text-red-400">Systems are down</span>
          )}
          {apiStatus === "checking" && (
            <span className="text-yellow-400">Checking system status…</span>
          )}
        </span>
      </motion.div>

      {/* Theme Switcher */}
      <motion.button
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 z-50 glass w-11 h-11 rounded-full flex items-center justify-center text-white/60 hover:text-white shadow-xl hidden md:flex"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {theme === "dark" ? (
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </motion.button>

      {/* Exit Intent Popup */}
      <AnimatePresence>{exitPopup && <ExitPopup onClose={() => setExitPopup(false)} />}</AnimatePresence>

      <Footer />
    </div>
  );
};

export default LandingPage;
