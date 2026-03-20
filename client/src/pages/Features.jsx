"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  motion, 
  useScroll, 
  useTransform, 
  AnimatePresence, 
  useInView,
  useSpring
} from "framer-motion";
import { 
  Zap, Shield, Globe, Cpu, Smartphone, 
  Lock, MessageSquare, Mic, FolderPlus, 
  Users, Bot, Star, ChevronRight, Play,
  CheckCircle2, Activity, HardDrive, Layers
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PrimaryButton } from "@/components/Button";
import { useSystemSettings } from "@/hooks/useSystemSettings"; // Import your dynamic settings hook

// ─── Data Structures ────────────────────────────────────────────────────────

const HERO_STATS = [
  { label: "Latency", value: "< 50ms", icon: <Zap className="w-4 h-4" /> },
  { label: "Security", value: "AES-256", icon: <Shield className="w-4 h-4" /> },
  { label: "Uptime", value: "99.99%", icon: <Activity className="w-4 h-4" /> },
];

const MAIN_FEATURES = [
  {
    id: "encryption",
    title: "Quantum Encryption",
    desc: "Every packet is wrapped in a multi-layer AES-256 encryption tunnel, ensuring your data remains yours alone.",
    icon: <Lock className="w-8 h-8 text-primary-400" />,
    size: "lg:col-span-2",
    gradient: "from-blue-600/20 to-cyan-500/10",
    tags: ["Security", "Privacy"],
    image: "/api/placeholder/400/300" 
  },
  {
    id: "sync",
    title: "Instant Edge Sync",
    desc: "Synchronize state across unlimited devices simultaneously without a single drop in performance.",
    icon: <Zap className="w-8 h-8 text-yellow-400" />,
    size: "lg:col-span-1",
    gradient: "from-orange-500/20 to-red-500/10",
    tags: ["Speed"],
    image: "/api/placeholder/400/300"
  },
  {
    id: "ai",
    title: "Neural AI Engine",
    desc: "Built-in Large Language Models to summarize chats, predict replies, and translate audio in real-time.",
    icon: <Bot className="w-8 h-8 text-purple-400" />,
    size: "lg:col-span-1",
    gradient: "from-purple-600/20 to-indigo-500/10",
    tags: ["Automation"],
    image: "/api/placeholder/400/300"
  },
  {
    id: "communities",
    title: "Global Communities",
    desc: "Architect massive groups with unlimited members. Use high-level governance tools, tiered permissions, and automated anti-spam neural filters.",
    icon: <Users className="w-8 h-8 text-emerald-400" />,
    size: "lg:col-span-2",
    gradient: "from-emerald-600/20 to-teal-500/10",
    tags: ["Scale", "Management"],
  }
];

// ─── Sub-Components ─────────────────────────────────────────────────────────

const FeatureCard = ({ feature, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      className={`relative glass p-8 md:p-12 overflow-hidden group border border-white/5 hover:border-primary-500/30 transition-all duration-500 ${feature.size}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-8">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 group-hover:border-primary-500/50 transition-all duration-500">
            {feature.icon}
          </div>
          <div className="flex gap-2">
            {feature.tags.map(tag => (
              <span key={tag} className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/5 border border-white/5 text-white/40">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <h3 className="text-3xl font-black mb-4 italic tracking-tighter uppercase group-hover:text-primary-400 transition-colors">
          {feature.title}
        </h3>
        <p className="text-white/50 text-lg leading-relaxed mb-8 max-w-md">
          {feature.desc}
        </p>

        <div className="mt-auto flex items-center gap-4 text-xs font-black uppercase tracking-widest text-primary-500 cursor-pointer group/btn">
          Explore Technical Specs <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
        </div>
      </div>

      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary-500/10 blur-[100px] rounded-full group-hover:bg-primary-500/20 transition-all" />
    </motion.div>
  );
};

const ComparisonMatrix = () => (
  <div className="w-full overflow-hidden rounded-[3rem] border border-white/5 glass bg-white/[0.01]">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-white/5 border-b border-white/10">
          <th className="p-8 text-xs font-black uppercase tracking-widest text-white/30">Feature Capability</th>
          <th className="p-8 text-center text-primary-400 font-black italic">Chatify Premium</th>
          <th className="p-8 text-center text-white/20 font-black uppercase italic">Competitors</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {[
          { feature: "End-to-End Encryption", chatify: true, others: true },
          { feature: "File Limit", chatify: "10GB", others: "2GB" },
          { feature: "AI Summarization", chatify: true, others: false },
          { feature: "Self-Destruct Messages", chatify: true, others: true },
          { feature: "Latency (Global)", chatify: "42ms", others: "180ms" },
          { feature: "White-label Support", chatify: true, others: false },
        ].map((row, i) => (
          <tr key={i} className="hover:bg-white/[0.02] transition-colors">
            <td className="p-8 font-bold text-white/60">{row.feature}</td>
            <td className="p-8 text-center">
              {typeof row.chatify === 'boolean' ? 
                (row.chatify ? <CheckCircle2 className="mx-auto text-emerald-500 w-6 h-6" /> : "—") : 
                <span className="font-black text-primary-400">{row.chatify}</span>
              }
            </td>
            <td className="p-8 text-center text-white/20 font-medium">
              {typeof row.others === 'boolean' ? 
                (row.others ? <CheckCircle2 className="mx-auto opacity-20 w-6 h-6" /> : "—") : 
                row.others
              }
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

const Features = () => {
  const { settings } = useSystemSettings(); // Fetch dynamic labels and version
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.8]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#03050a] text-white selection:bg-primary-500/30">
      <Navbar />

      {/* ── HERO SECTION ── */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[radial-gradient(circle_at_50%_0%,#0ea5e915,transparent_70%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-end justify-between gap-10 mb-24">
            <motion.div 
              style={{ scale, opacity }}
              className="max-w-3xl"
            >
              {/* DYNAMIC ARCHITECTURE LABEL */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-black uppercase tracking-widest mb-8"
              >
                <Star className="w-3 h-3 fill-current" /> 
                {settings?.architectureLabel || "Architecture V3.0 is live"}
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                className="text-6xl md:text-8xl font-black leading-[0.9] italic tracking-tighter mb-8"
              >
                Engineered for <br />
                <span className="gradient-text">Absolute Power.</span>
              </motion.h1>
              <p className="text-xl text-white/40 leading-relaxed max-w-xl">
                We didn't just build a chat app. We built a high-frequency data pipeline 
                wrapped in a stunning interface.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full lg:w-auto"
            >
              {HERO_STATS.map((stat, i) => (
                <div key={i} className="glass p-6 rounded-3xl border border-white/5 min-w-[160px]">
                  <div className="text-primary-500 mb-3">{stat.icon}</div>
                  <div className="text-2xl font-black tracking-tight mb-1">{stat.value}</div>
                  <div className="text-[10px] uppercase font-black text-white/30 tracking-widest">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── BENTO GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {MAIN_FEATURES.map((feature, i) => (
              <FeatureCard key={feature.id} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON MATRIX ── */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-4">
              How we stack <span className="text-primary-500">Against.</span>
            </h2>
            <p className="text-white/40">Pure performance metrics vs the industry standard.</p>
          </div>
          <ComparisonMatrix />
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto relative overflow-hidden rounded-[4rem] p-12 md:p-24 text-center border border-primary-500/20 glass">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 via-purple-600/5 to-transparent" />
          
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-8 leading-none">
                Stop Compromising <br />
                On Your <span className="text-primary-500">Communication.</span>
              </h2>
              <p className="text-xl text-white/50 mb-12 leading-relaxed">
                Join 10,000+ power users who have switched to a more secure, 
                blazing-fast chat experience.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <PrimaryButton href="/register" size="lg" className="w-full sm:w-auto px-12 py-6 text-lg">
                  Deploy Chatify Now
                </PrimaryButton>
                <div className="flex items-center gap-2 text-white/40 font-black uppercase text-xs tracking-widest">
                  <Lock className="w-4 h-4" /> No Credit Card Required
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Features;