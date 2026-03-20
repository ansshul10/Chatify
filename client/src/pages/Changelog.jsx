"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  motion, 
  AnimatePresence, 
  useScroll, 
  useSpring, 
  useTransform 
} from "framer-motion";
import { 
  Rocket, 
  ShieldCheck, 
  Zap, 
  Bug, 
  GitBranch, 
  Calendar, 
  ChevronRight, 
  Search,
  Filter,
  ArrowUpRight,
  Info
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSystemSettings } from "@/hooks/useSystemSettings";

// ─── Data Configurations ───────────────────────────────────────────────────

const LOGS = [
  { 
    version: "v2.1.0", 
    date: "March 19, 2026", 
    title: "The Performance Update", 
    type: "Major",
    status: "Latest",
    description: "Our biggest optimization pass yet. We've rewritten the core WebSocket handler to ensure sub-50ms delivery globally.",
    changes: [
      { text: "Sub-50ms message delivery engine", type: "feature" },
      { text: "Redesigned WebSocket stability protocols", type: "improvement" },
      { text: "Experimental 'Deep Sea' darker theme", type: "feature" },
      { text: "Reduced RAM footprint by 40% on Desktop", type: "improvement" }
    ],
    author: { name: "Gourav", avatar: "G" }
  },
  { 
    version: "v2.0.4", 
    date: "Feb 12, 2026", 
    title: "Security Hardening", 
    type: "Patch",
    status: "Stable",
    description: "Closing the gap on local device security. This update introduces biometric integration for private vaults.",
    changes: [
      { text: "AES-256 Encryption internal audit", type: "security" },
      { text: "Native Biometric Lock (FaceID/Fingerprint)", type: "security" },
      { text: "Fixed race condition in Auth handshake", type: "fix" },
      { text: "Patch for CVE-2026-1024", type: "security" }
    ],
    author: { name: "Admin", avatar: "A" }
  },
  { 
    version: "v2.0.0", 
    date: "Jan 05, 2026", 
    title: "Chatify Reborn", 
    type: "Core",
    status: "Legacy",
    description: "A complete overhaul of the Chatify ecosystem. New UI, new engine, new possibilities.",
    changes: [
      { text: "Complete UI Redesign with Glassmorphism", type: "feature" },
      { text: "High-fidelity Framer Motion animations", type: "improvement" },
      { text: "Global multi-index search implementation", type: "feature" },
      { text: "Integrated Community Workspaces", type: "feature" }
    ],
    author: { name: "Gourav", avatar: "G" }
  },
];

// ─── Sub-Components ─────────────────────────────────────────────────────────

const ChangeBadge = ({ type }) => {
  const config = {
    feature: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    improvement: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    security: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    fix: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${config[type]}`}>
      {type}
    </span>
  );
};

const LogCard = ({ log, index }) => {
  const isLatest = log.status === "Latest";
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`relative group mb-20`}
    >
      {/* Connector Line */}
      <div className="absolute left-[-21px] md:left-1/2 md:-translate-x-px top-10 bottom-[-80px] w-0.5 bg-gradient-to-b from-white/10 to-transparent hidden group-last:block" />

      <div className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-0">
        
        {/* Date/Version Column (Left on Desktop) */}
        <div className="md:w-1/2 md:pr-12 md:text-right order-2 md:order-1">
          <div className={`inline-flex items-center gap-2 font-mono text-sm mb-2 ${isLatest ? 'text-primary-400' : 'text-white/40'}`}>
            <Calendar className="w-3 h-3" /> {log.date}
          </div>
          <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2 group-hover:text-primary-400 transition-colors">
            {log.title}
          </h3>
          <p className="text-white/30 text-sm leading-relaxed max-w-sm md:ml-auto">
            {log.description}
          </p>
        </div>

        {/* Center Dot */}
        <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-2xl border border-white/10 bg-[#0d111a] shadow-2xl md:mx-8 order-1 md:order-2 group-hover:border-primary-500/50 transition-all duration-500">
           {isLatest ? <Rocket className="w-5 h-5 text-primary-500 animate-pulse" /> : <GitBranch className="w-5 h-5 text-white/20" />}
           
           {isLatest && (
             <div className="absolute -top-1 -right-1 flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
             </div>
           )}
        </div>

        {/* Changes Column (Right on Desktop) */}
        <div className="md:w-1/2 md:pl-12 order-3">
          <div className="glass p-6 md:p-8 rounded-[2rem] border border-white/5 bg-white/[0.01] group-hover:bg-white/[0.03] group-hover:border-white/10 transition-all duration-500 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-bold text-white/60">
                {log.version}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-[10px] font-black">
                  {log.author.avatar}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{log.author.name}</span>
              </div>
            </div>

            <ul className="space-y-4">
              {log.changes.map((change, idx) => (
                <li key={idx} className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <ChangeBadge type={change.type} />
                    <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                      {change.text}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <button className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary-500 hover:text-white transition-colors group/btn">
              View Commits <ArrowUpRight className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────

const Changelog = () => {
  const { settings } = useSystemSettings();
  const containerRef = useRef(null);
  const [search, setSearch] = useState("");
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const pathLength = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const filteredLogs = LOGS.filter(log => 
    log.title.toLowerCase().includes(search.toLowerCase()) ||
    log.version.toLowerCase().includes(search.toLowerCase()) ||
    log.changes.some(c => c.text.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div ref={containerRef} className="min-h-screen bg-[#03050a] text-white font-sans selection:bg-primary-500/30">
      <Navbar />

      {/* ── SECTION: HERO ── */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_50%_0%,#0ea5e910,transparent_70%)] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-8"
          >
            <GitBranch className="w-3 h-3" /> {settings?.systemIterationLabel || "System Iterations"}
          </motion.div>
          
          <h1 className="text-6xl md:text-8xl font-black leading-[0.85] italic tracking-tighter mb-8 uppercase">
            Evolution <br />
            <span className="gradient-text">Of Chatify.</span>
          </h1>
          
          <p className="text-xl text-white/30 leading-relaxed max-w-2xl mx-auto font-medium italic mb-12">
            Documenting every push, patch, and breakthrough as we build 
            the most powerful communication engine on the web.
          </p>

          {/* Search/Filter Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="text"
              placeholder="FILTER UPDATES..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-xs font-black tracking-widest focus:border-primary-500 outline-none transition-all uppercase"
            />
          </div>
        </div>
      </section>

      {/* ── SECTION: TIMELINE ── */}
      <section className="relative py-24 px-6 max-w-7xl mx-auto">
        
        {/* Vertical Progress Line (Desktop Only) */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/5 hidden md:block">
          <motion.div 
            style={{ scaleY: pathLength, originY: 0 }}
            className="absolute inset-0 bg-gradient-to-b from-primary-500 via-purple-500 to-transparent"
          />
        </div>

        <div className="relative">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log, i) => (
              <LogCard key={log.version} log={log} index={i} />
            ))
          ) : (
            <div className="py-40 text-center">
               <Info className="w-12 h-12 text-white/10 mx-auto mb-4" />
               <p className="text-white/20 font-black uppercase tracking-widest">No matching logs found</p>
            </div>
          )}
        </div>
      </section>

      {/* ── SECTION: SUBSCRIBE ── */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
           <div className="glass p-12 md:p-20 rounded-[4rem] border border-white/10 bg-white/[0.01] relative overflow-hidden text-center shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 via-transparent to-transparent opacity-50" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-3xl bg-primary-500/10 flex items-center justify-center mx-auto mb-8">
                  <Zap className="w-8 h-8 text-primary-500" />
                </div>
                <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase mb-6 leading-none">
                  Stay in the <br /><span className="text-primary-500">Fast Lane.</span>
                </h2>
                <p className="text-white/40 font-medium mb-12 max-w-md mx-auto">
                  Get notified the second a new update drops. No spam, just pure technical updates.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input 
                    type="email" 
                    placeholder="EMAIL ADDRESS"
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-black tracking-widest outline-none focus:border-primary-500 transition-all uppercase"
                  />
                  <button className="bg-white text-black px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-primary-500 hover:text-white transition-all shadow-xl">
                    Subscribe
                  </button>
                </div>
              </div>
           </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Changelog;