"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useInView
} from "framer-motion";
import {
  Shield, Lock, EyeOff, Key, Zap,
  Fingerprint, Timer, ShieldCheck, ServerOff,
  Globe, Cpu, RefreshCcw, Binary, AlertTriangle,
  ChevronRight, ArrowRight, CheckCircle2, Info,
  Activity
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PrimaryButton } from "@/components/Button";
import { useSystemSettings } from "@/hooks/useSystemSettings"; // Added the hook

// ─── Data Configurations ───────────────────────────────────────────────────

const PROTOCOLS = [
  {
    title: "End-to-End Encryption",
    id: "e2ee",
    icon: <Lock className="w-6 h-6" />,
    color: "primary",
    desc: "Every interaction is wrapped in a multi-layered AES-256-GCM encryption tunnel. Your keys never leave your device.",
    details: [
      "X3DH Key Agreement Protocol",
      "Double Ratchet Algorithm",
      "Perfect Forward Secrecy",
      "Post-Quantum Resistant"
    ]
  },
  {
    title: "Zero Knowledge Architecture",
    id: "zero",
    icon: <ServerOff className="w-6 h-6" />,
    color: "purple",
    desc: "Our servers are 'dumb'. They route packets but cannot decipher content, metadata, or user identities.",
    details: [
      "No Cloud Metadata storage",
      "Encrypted RAM-only Routing",
      "Zero Logging Policy",
      "On-device Key Derivation"
    ]
  },
  {
    title: "Biometric Hardening",
    id: "bio",
    icon: <Fingerprint className="w-6 h-6" />,
    color: "emerald",
    desc: "Physical device-level security. Use secure enclaves to protect local data from physical tampering.",
    details: [
      "FaceID / TouchID Integration",
      "Hardware Secure Enclave",
      "Attempt-limited Lockout",
      "Encrypted Local Cache"
    ]
  }
];

const SECURITY_STATS = [
  { label: "Encryption Standard", value: "AES-256", sub: "Military Grade" },
  { label: "Key Exchange", value: "Curve255", sub: "Elliptic Curve" },
  { label: "Auditing", value: "24/7", sub: "Automated Checks" },
  { label: "Data Breaches", value: "Zero", sub: "Since Inception" }
];

const AUDIT_STEPS = [
  { title: "Static Analysis", text: "Automated source code scanning for known vulnerabilities." },
  { title: "Dynamic Testing", text: "Live penetration testing on all routing nodes." },
  { title: "Bug Bounty", text: "Global community of ethical hackers testing Chatify daily." },
  { title: "Transparency Reports", text: "Quarterly reports detailing our infrastructure health." }
];

// ─── Reusable Components ────────────────────────────────────────────────────

const ProtocolCard = ({ protocol, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const colors = {
    primary: "border-primary-500/20 bg-primary-500/5 text-primary-400 shadow-primary-500/10",
    purple: "border-purple-500/20 bg-purple-500/5 text-purple-400 shadow-purple-500/10",
    emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 shadow-emerald-500/10"
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      className={`glass p-8 rounded-[2.5rem] border ${colors[protocol.color]} group hover:border-opacity-50 transition-all duration-500`}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform`}>
          {protocol.icon}
        </div>
        <h3 className="text-xl font-black uppercase tracking-widest">{protocol.title}</h3>
      </div>

      <p className="text-white/50 leading-relaxed mb-8 font-medium">
        {protocol.desc}
      </p>

      <div className="space-y-3 border-t border-white/5 pt-6">
        {protocol.details.map((detail, i) => (
          <div key={i} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            {detail}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const EncryptionVisual = () => {
  return (
    <div className="relative w-full h-[400px] flex items-center justify-center overflow-hidden rounded-[3rem] bg-[#05080f] border border-white/5">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#0ea5e9 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="w-[300px] h-[300px] rounded-full border-2 border-dashed border-primary-500/20 flex items-center justify-center"
      >
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="w-[200px] h-[200px] rounded-full border-2 border-dashed border-purple-500/20 flex items-center justify-center"
        >
          <div className="w-24 h-24 bg-primary-500 rounded-3xl flex items-center justify-center shadow-[0_0_50px_#0ea5e950]">
            <Lock className="w-10 h-10 text-white" />
          </div>
        </motion.div>
      </motion.div>

      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-primary-400 rounded-full"
          animate={{
            x: [Math.random() * 400 - 200, Math.random() * 400 - 200],
            y: [Math.random() * 400 - 200, Math.random() * 400 - 200],
            opacity: [0, 1, 0]
          }}
          transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
        />
      ))}
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────

const Security = () => {
  const { settings } = useSystemSettings(); // Fetch dynamic labels
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const headerScale = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#03050a] text-white font-sans selection:bg-primary-500/30">
      <Navbar />

      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[radial-gradient(circle_at_50%_0%,#0ea5e915,transparent_70%)] pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-primary-600/10 blur-[150px] rounded-full" />

        <motion.div
          style={{ opacity: headerOpacity, scale: headerScale }}
          className="max-w-6xl mx-auto relative z-10 text-center"
        >
          {/* DYNAMIC INFRA LABEL AND VERSION */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[10px] font-black uppercase tracking-[0.4em] mb-10"
          >
            <Shield className="w-3 h-3" />
            {settings?.infraLabel} {settings?.currentVersion}
          </motion.div>

          <h1 className="text-6xl md:text-8xl font-black leading-[0.85] italic tracking-tighter mb-10 uppercase">
            Communication <br />
            <span className="gradient-text">Is A Human Right.</span>
          </h1>

          <p className="text-xl text-white/40 leading-relaxed max-w-3xl mx-auto font-medium italic mb-16">
            We don't just secure your chats. We rebuild the internet's broken trust
            through math, transparency, and a relentless refusal to store your data.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {SECURITY_STATS.map((stat, i) => (
              <div key={i} className="glass p-6 rounded-3xl border border-white/5 text-center group hover:border-primary-500/30 transition-all duration-500">
                <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-[9px] uppercase font-black text-primary-500 tracking-widest mb-1">{stat.label}</div>
                <div className="text-[8px] uppercase font-bold text-white/20">{stat.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-20">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase mb-6 leading-none">
                The Protocol <br /><span className="text-white/20">Standard.</span>
              </h2>
              <p className="text-white/40 font-medium">Our technology stack is built on proven cryptographic standards, verified by independent security researchers.</p>
            </div>
            <PrimaryButton className="px-8 py-4 rounded-2xl">
              Download Audit Paper <ArrowRight className="ml-2 w-4 h-4" />
            </PrimaryButton>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {PROTOCOLS.map((p, i) => (
              <ProtocolCard key={p.id} protocol={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-6 bg-[#05080f] relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-12">
              <div>
                <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-6">
                  Invisible <br /><span className="text-primary-500">Data Sharding.</span>
                </h2>
                <p className="text-white/40 text-lg leading-relaxed font-medium">
                  We implement Ephemeral Key Rotation. This means every single message
                  uses a different key. Even if a key was somehow compromised, the
                  rest of your history remains perfectly safe.
                </p>
              </div>

              <div className="space-y-6">
                {AUDIT_STEPS.map((step, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ x: 10 }}
                    className="flex gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5 group hover:border-primary-500/20 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-all">
                      <Binary className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black uppercase text-xs tracking-widest text-white/80 mb-1">{step.title}</h4>
                      <p className="text-sm text-white/30 font-medium leading-snug">{step.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative">
              <EncryptionVisual />
              <div className="absolute -bottom-6 -right-6 glass p-6 rounded-3xl border border-white/10 shadow-2xl max-w-[200px]">
                <div className="flex items-center gap-2 text-primary-400 font-black text-[10px] uppercase tracking-widest mb-2">
                  <Activity className="w-3 h-3" /> Real-time
                </div>
                <div className="text-xs text-white/50 leading-snug italic">
                  "Entropy generated at 1.2Gbps for high-speed encryption."
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black italic tracking-tighter uppercase">Transparent by <span className="text-primary-500">Design.</span></h2>
          </div>

          <div className="space-y-4">
            {[
              { q: "Do you hand over data to governments?", a: "We cannot hand over what we do not have. Because our architecture is zero-knowledge, there are no messages, keys, or meaningful metadata to provide even under subpoena." },
              { q: "How do you handle password resets?", a: "We don't. Your password is used to derive your local key. If you lose your password and your recovery phrase, your account and its data are cryptographically unrecoverable." },
              { q: "Is Chatify Open Source?", a: "Yes. Our cryptographic libraries and client apps are open-sourced on GitHub, allowing the global community to verify our claims." }
            ].map((faq, i) => (
              <details key={i} className="group glass rounded-[2rem] border border-white/5 overflow-hidden">
                <summary className="list-none p-8 cursor-pointer flex justify-between items-center hover:bg-white/5 transition-colors">
                  <span className="font-black uppercase text-sm tracking-widest">{faq.q}</span>
                  <ChevronRight className="w-5 h-5 text-primary-500 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-8 pb-8 text-white/40 font-medium leading-relaxed border-t border-white/5 pt-6">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-[4rem] p-12 md:p-24 text-center border border-primary-500/20 glass shadow-2xl">
            <div className="absolute top-0 right-0 p-8">
              <AlertTriangle className="w-10 h-10 text-primary-500/20" />
            </div>

            <div className="relative z-10">
              <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-8 uppercase leading-none">
                Don't Be Just <br /><span className="text-primary-500">Another Data Point.</span>
              </h2>
              <p className="text-xl text-white/40 mb-12 font-medium max-w-2xl mx-auto leading-relaxed italic">
                Take control of your digital identity. Join the 10,000+ people
                who refuse to be tracked, targeted, or sold.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <PrimaryButton href="/register" className="px-12 py-6 rounded-2xl text-xl font-black uppercase tracking-widest shadow-[0_0_40px_rgba(14,165,233,0.3)]">
                  Protect My Privacy
                </PrimaryButton>
                <div className="flex items-center gap-3 text-white/20 font-black uppercase text-xs tracking-widest">
                  <Globe className="w-4 h-4" /> Global Infrastructure
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Security;