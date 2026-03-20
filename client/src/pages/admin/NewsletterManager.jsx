"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Send, History, Users, Loader2, Sparkles, Mail,
  CheckCircle2, Clock, Eye, Trash2, Filter, Info, ArrowRight,
  ShieldCheck, Zap, Globe, RefreshCcw
} from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import Footer from "@/components/Footer"; // YE WALA MISSING THA

// ── Constants ─────────────────────────────────────────────────────────────────
const TARGET_MAP = {
  all:         { label: "Everyone",      color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",     Icon: Globe },
  subscribers: { label: "Subscribers",   color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", Icon: Zap },
  pro_users:   { label: "Premium Nodes", color: "text-purple-400",  bg: "bg-purple-500/10 border-purple-500/20",  Icon: ShieldCheck },
};

// ── Shared ────────────────────────────────────────────────────────────────────
const TargetBadge = ({ target }) => {
  const t = TARGET_MAP[target] || TARGET_MAP.all;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest ${t.bg} ${t.color}`}>
      <t.Icon className="w-3 h-3" /> {t.label}
    </span>
  );
};

const NewsletterManager = () => {
  const [form, setForm] = useState({ subject: "", content: "", target: "all" });
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [view, setView] = useState("compose"); // compose | logs

  const fetchHistory = async () => {
    try {
      setFetching(true);
      const res = await axiosInstance.get("/admin/newsletter/history");
      setHistory(res.data.history || []);
    } catch (err) {
      console.error("Transmission logs failed to load");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.content.trim()) return alert("Construct payload fully before dispatch.");
    if (!window.confirm("Initialize High-Priority Broadcast Relay?")) return;

    setLoading(true);
    try {
      await axiosInstance.post("/admin/newsletter/send", form);
      alert("Relay Successful. Payload Dispatched.");
      setForm({ subject: "", content: "", target: "all" });
      fetchHistory();
      setView("logs");
    } catch (err) {
      alert("Dispatch relay error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#03050a] text-white selection:bg-primary-500/30 font-sans">
      <main className="pt-32 pb-20 px-6 md:px-10 max-w-7xl mx-auto">
        
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <Link to="/admin" className="flex items-center gap-2 text-white/30 hover:text-primary-400 mb-4 w-fit group text-[10px] font-black uppercase tracking-widest transition-colors">
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </Link>
            <h2 className="text-4xl font-black italic tracking-tighter flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary-500/10 border border-primary-500/20">
                <Mail className="text-primary-500 w-8 h-8" />
              </div>
              Relay <span className="text-primary-500">Commander</span>
            </h2>
          </div>

          <div className="flex bg-white/5 p-1.5 rounded-[1.25rem] border border-white/5 backdrop-blur-md">
            <button 
              onClick={() => setView("compose")} 
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'compose' ? 'bg-white text-black shadow-xl shadow-white/5' : 'text-white/30 hover:text-white'}`}
            >
              Compose
            </button>
            <button 
              onClick={() => { setView("logs"); fetchHistory(); }} 
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'logs' ? 'bg-white text-black shadow-xl shadow-white/5' : 'text-white/30 hover:text-white'}`}
            >
              Dispatch Logs
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ── COMPOSE VIEW ── */}
          {view === "compose" && (
            <motion.div 
              key="compose" 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }} 
              className="grid lg:grid-cols-3 gap-10"
            >
              <div className="lg:col-span-2 space-y-6">
                <div className="glass p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.01]">
                  <div className="flex items-center justify-between mb-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-primary-500" /> Construct Payload
                    </p>
                    <TargetBadge target={form.target} />
                  </div>

                  <form onSubmit={handleSend} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-white/20 ml-2 tracking-widest">Global Subject Line</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Critical Update #042: System Maintenance..." 
                        className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-primary-500/50 transition-all font-black text-sm placeholder:text-white/10"
                        value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-white/20 ml-2 tracking-widest">Transmission Target</label>
                        <select 
                          className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none text-white/70 font-black uppercase text-[10px] tracking-widest appearance-none cursor-pointer focus:border-primary-500/50"
                          value={form.target} onChange={e => setForm({...form, target: e.target.value})}
                        >
                          <option value="all" className="bg-[#03050a]">Broadcast: Everyone</option>
                          <option value="subscribers" className="bg-[#03050a]">Broadcast: Newsletter Only</option>
                          <option value="pro_users" className="bg-[#03050a]">Broadcast: Premium Nodes</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-3 px-5 border border-white/5 rounded-2xl bg-white/[0.02]">
                         <Info className="text-primary-500 w-4 h-4 flex-shrink-0" />
                         <p className="text-[9px] text-white/30 leading-tight uppercase font-bold tracking-widest">Relay will bypass basic filters for instant notification delivery.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-white/20 ml-2 tracking-widest">Encrypted HTML Content</label>
                      <textarea 
                        placeholder="Construct HTML relay message..." 
                        className="w-full h-80 bg-white/5 border border-white/10 p-6 rounded-[2rem] outline-none focus:border-primary-500/50 transition-all font-medium text-sm resize-none placeholder:text-white/10"
                        value={form.content} onChange={e => setForm({...form, content: e.target.value})}
                      />
                    </div>

                    <button 
                      disabled={loading} 
                      className="w-full py-5 bg-white text-black rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-primary-500 hover:text-white transition-all active:scale-95 disabled:opacity-40 shadow-2xl shadow-white/5"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Initialize Dispatch</>}
                    </button>
                  </form>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                <div className="glass p-7 rounded-[2.5rem] border border-white/5 bg-white/[0.01]">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-6">Status Intelligence</p>
                   <div className="space-y-4">
                      <div className="p-5 rounded-[1.5rem] bg-white/[0.02] border border-white/5">
                         <p className="text-[9px] font-black text-primary-500 uppercase mb-1 tracking-[0.2em]">Queue Priority</p>
                         <p className="text-xl font-black italic uppercase">Critical</p>
                      </div>
                      <div className="p-5 rounded-[1.5rem] bg-white/[0.02] border border-white/5">
                         <p className="text-[9px] font-black text-emerald-500 uppercase mb-1 tracking-[0.2em]">Relay Health</p>
                         <p className="text-xl font-black italic uppercase">Optimal</p>
                      </div>
                   </div>
                </div>
                
                <div className="p-7 bg-primary-500/5 border border-primary-500/10 rounded-[2.5rem] text-center relative overflow-hidden group">
                   <Zap className="text-primary-500 w-12 h-12 mx-auto mb-4 group-hover:scale-110 transition-transform duration-500" />
                   <h4 className="text-xs font-black uppercase tracking-widest mb-2 italic">Multi-Node Relay</h4>
                   <p className="text-[10px] text-white/30 uppercase font-black leading-relaxed">Broadcasts are routed through global SMTP nodes for 100% bypass.</p>
                   <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary-500/10 blur-3xl rounded-full" />
                </div>
              </div>
            </motion.div>
          )}

          {/* ── LOGS VIEW ── */}
          {view === "logs" && (
            <motion.div 
              key="logs" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }} 
              className="glass rounded-[2.5rem] border border-white/5 overflow-hidden bg-white/[0.01] backdrop-blur-md shadow-2xl"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-[0.2em] text-white/30 border-b border-white/5 bg-white/5">
                      <th className="px-8 py-6 font-black">Broadcast Subject</th>
                      <th className="px-8 py-6 font-black">Relay Target</th>
                      <th className="px-8 py-6 font-black">Node Reach</th>
                      <th className="px-8 py-6 font-black">Transmission Date</th>
                      <th className="px-8 py-6 text-right font-black">Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {!fetching && history.map((log, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-all group">
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-white/80 uppercase italic tracking-tighter">{log.subject}</p>
                        </td>
                        <td className="px-8 py-6"><TargetBadge target={log.sentTo} /></td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                              <Users size={14} className="text-white/30" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest">{log.recipientCount} Nodes</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs font-black text-white/30 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={12} /> {new Date(log.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="inline-flex items-center gap-2 text-[9px] font-black px-4 py-1.5 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full uppercase tracking-[0.2em]">
                             <CheckCircle2 size={12} /> Dispatched
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {fetching && (
                  <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-50">
                    <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Synchronizing Transmission Logs...</p>
                  </div>
                )}
                
                {!fetching && history.length === 0 && (
                  <div className="p-32 text-center opacity-20 flex flex-col items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                      <History size={32} />
                    </div>
                    <p className="font-black italic uppercase tracking-[0.2em] text-xs">Zero historical transmission logs detected</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

export default NewsletterManager;