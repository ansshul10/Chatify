"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, LifeBuoy, RefreshCcw, Loader2, Send,
  CheckCircle2, XCircle, Clock, Zap, MessageSquare,
  Filter, X, Check, Eye, Crown, ChevronRight,
} from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_MAP = {
  open:        { label: "Open",        color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",       Icon: MessageSquare },
  pending:     { label: "Pending",     color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/20",   Icon: Clock         },
  in_progress: { label: "In Progress", color: "text-purple-400",  bg: "bg-purple-500/10 border-purple-500/20",   Icon: Zap           },
  resolved:    { label: "Resolved",    color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", Icon: CheckCircle2  },
  closed:      { label: "Closed",      color: "text-white/30",    bg: "bg-white/5 border-white/10",              Icon: XCircle       },
};

const PLAN_BADGE = {
  free:       { label: "FREE",  cls: "bg-white/5 text-white/40 border-white/10"              },
  pro:        { label: "PLUS",  cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
  enterprise: { label: "ULTRA", cls: "bg-purple-500/15 text-purple-400 border-purple-500/20" },
};

const PRIORITY_DOT = {
  low:    "bg-emerald-400",
  medium: "bg-yellow-400",
  high:   "bg-orange-400",
  urgent: "bg-red-400",
};

const CATEGORY_LABEL = {
  billing:         "Billing",
  account:         "Account",
  bug:             "Bug Report",
  feature_request: "Feature Request",
  security:        "Security",
  other:           "Other",
};

// ── Shared ────────────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.open;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest ${s.bg} ${s.color}`}>
      <s.Icon className="w-3 h-3" /> {s.label}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Ticket Detail View
// ═══════════════════════════════════════════════════════════════════════════════
const TicketDetail = ({ ticketId, onBack, onUpdate }) => {
  const [ticket,  setTicket]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply,   setReply]   = useState("");
  const [status,  setStatus]  = useState("");
  const [sending, setSending] = useState(false);
  const [updSt,   setUpdSt]   = useState(false);
  const [imgPrev, setImgPrev] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/support/admin/${ticketId}`);
      setTicket(res.data.ticket);
      setStatus(res.data.ticket.status);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [ticketId]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    try {
      setSending(true);
      await axiosInstance.post(`/support/admin/${ticketId}/reply`, { message: reply, status });
      setReply("");
      load();
      onUpdate?.();
    } catch { } finally { setSending(false); }
  };

  const handleStatus = async (newStatus) => {
    try {
      setUpdSt(true);
      await axiosInstance.patch(`/support/admin/${ticketId}/status`, { status: newStatus });
      setStatus(newStatus);
      load();
      onUpdate?.();
    } catch { } finally { setUpdSt(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-32">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );
  if (!ticket) return null;

  const plan      = PLAN_BADGE[ticket.userSnapshot?.plan] || PLAN_BADGE.free;
  const isPremium = ticket.userSnapshot?.plan !== "free";

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <button onClick={onBack}
        className="flex items-center gap-2 text-white/40 hover:text-white mb-10 transition-colors w-fit group">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to All Tickets
      </button>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* Left: Thread */}
        <div className="lg:col-span-2 space-y-5">

          {/* Ticket Header Card */}
          <div className="glass p-7 rounded-[2rem] border border-white/5 bg-white/[0.01]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap mb-3">
                  <span className="font-mono text-sm font-black text-primary-400">{ticket.ticketId}</span>
                  <StatusBadge status={ticket.status} />
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest ${plan.cls}`}>
                    {isPremium && <Crown className="w-3 h-3" />} {plan.label}
                  </span>
                </div>
                <h3 className="text-xl font-black mb-1">{ticket.subject}</h3>
                <p className="text-xs text-white/30">{new Date(ticket.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/8 px-3 py-2 rounded-xl">
                <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[ticket.priority] || "bg-white/20"}`} />
                <span className="text-xs text-white/50 capitalize font-bold">{ticket.priority}</span>
              </div>
            </div>
          </div>

          {/* Original Message */}
          <div className="glass p-7 rounded-[2rem] border border-white/5 bg-white/[0.01]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4">Original Message</p>
            <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
            {ticket.attachment && (
              <button onClick={() => setImgPrev(ticket.attachment)}
                className="mt-5 flex items-center gap-2 text-xs font-bold text-primary-400 hover:text-primary-300 transition-colors">
                <Eye className="w-4 h-4" /> View Attachment
              </button>
            )}
          </div>

          {/* Replies Thread */}
          {ticket.replies?.length > 0 && (
            <div className="space-y-4">
              {ticket.replies.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`p-5 rounded-[1.75rem] border text-sm leading-relaxed
                    ${r.sender === "admin"
                      ? "bg-primary-500/8 border-primary-500/20"
                      : "glass border-white/5 bg-white/[0.01]"}`}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black
                      ${r.sender === "admin" ? "bg-primary-500/20 text-primary-400" : "bg-white/10 text-white/50"}`}>
                      {r.sender === "admin" ? "A" : "U"}
                    </div>
                    <span className={`text-xs font-black uppercase tracking-widest
                      ${r.sender === "admin" ? "text-primary-400" : "text-white/40"}`}>
                      {r.sender === "admin" ? "Support Team (You)" : ticket.userSnapshot?.name}
                    </span>
                    <span className="text-[10px] text-white/20 ml-auto">{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-white/70 whitespace-pre-wrap pl-9">{r.message}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Reply Box */}
          <div className="glass p-7 rounded-[2rem] border border-white/5 bg-white/[0.01]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-5">Reply to User</p>
            <textarea value={reply} onChange={e => setReply(e.target.value)} rows={4}
              placeholder="Write your reply... User will receive an email notification automatically."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-medium focus:outline-none focus:border-primary-500 transition-all placeholder:text-white/10 resize-none mb-4" />
            <div className="flex items-center gap-3 flex-wrap">
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white/70 outline-none focus:border-primary-500 transition-all">
                {Object.entries(STATUS_MAP).map(([val, { label }]) => (
                  <option key={val} value={val} className="bg-[#03050a]">{label}</option>
                ))}
              </select>
              <button onClick={handleReply} disabled={sending || !reply.trim()}
                className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all active:scale-95 disabled:opacity-40 shadow-lg shadow-white/5">
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {sending ? "Sending..." : "Send + Update Status"}
              </button>
            </div>
          </div>
        </div>

        {/* Right: User Info + Quick Status */}
        <div className="space-y-5">

          {/* User Card */}
          <div className="glass p-6 rounded-[2rem] border border-white/5 bg-white/[0.01]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-5">User Info</p>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-base font-black flex-shrink-0
                ${isPremium ? "bg-yellow-500/15 border border-yellow-500/20 text-yellow-400" : "bg-white/10 text-white/50"}`}>
                {ticket.userSnapshot?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold">{ticket.userSnapshot?.name}</p>
                <p className="text-xs text-white/30">{ticket.userSnapshot?.email}</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${plan.cls}`}>
              {isPremium && <Crown className="w-3.5 h-3.5 flex-shrink-0" />}
              <span className="text-[10px] font-black uppercase tracking-widest">{plan.label} Plan</span>
              {isPremium && <span className="text-[10px] opacity-50 ml-auto">Priority Support</span>}
            </div>
          </div>

          {/* Category */}
          <div className="glass p-6 rounded-[2rem] border border-white/5 bg-white/[0.01]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3">Category</p>
            <span className="text-sm font-bold text-white/60">
              {CATEGORY_LABEL[ticket.category] || ticket.category}
            </span>
          </div>

          {/* Quick Status */}
          <div className="glass p-6 rounded-[2rem] border border-white/5 bg-white/[0.01]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-5">Quick Status Update</p>
            <div className="space-y-2">
              {Object.entries(STATUS_MAP).map(([val, { label, color, Icon }]) => (
                <button key={val} onClick={() => handleStatus(val)}
                  disabled={updSt || ticket.status === val}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all
                    ${ticket.status === val
                      ? `bg-white/8 border-white/15 ${color}`
                      : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/8 text-white/30"}`}>
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {label}
                  {ticket.status === val && <Check className="w-3.5 h-3.5 ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview */}
      <AnimatePresence>
        {imgPrev && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
            onClick={() => setImgPrev(null)}>
            <motion.img src={imgPrev} alt="attachment"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-2xl w-full rounded-[2rem] border border-white/10 shadow-2xl" />
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tickets List View
// ═══════════════════════════════════════════════════════════════════════════════
const SupportTickets = () => {
  const [tickets,    setTickets]    = useState([]);
  const [stats,      setStats]      = useState({});
  const [loading,    setLoading]    = useState(true);
  const [view,       setView]       = useState("list");
  const [activeId,   setActiveId]   = useState(null);
  const [filters,    setFilters]    = useState({ status: "", priority: "", plan: "" });
  const [selected,   setSelected]   = useState([]);
  const [bulkStatus, setBulkStatus] = useState("closed");
  const [bulking,    setBulking]    = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status)   params.status   = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.plan)     params.plan     = filters.plan;
      const res = await axiosInstance.get("/support/admin", { params });
      setTickets(res.data.tickets);
      setStats(res.data.stats);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filters]);

  const handleBulk = async () => {
    if (!selected.length) return;
    try {
      setBulking(true);
      await axiosInstance.post("/support/admin/bulk", { ids: selected, status: bulkStatus });
      setSelected([]);
      load();
    } catch { } finally { setBulking(false); }
  };

  const toggleSelect = (id) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const selectAll = () =>
    setSelected(selected.length === tickets.length ? [] : tickets.map(t => t._id));

  return (
    <div className="min-h-screen bg-[#03050a] text-white selection:bg-primary-500/30">
      <main className="pt-32 pb-20 px-4 md:px-10 max-w-7xl mx-auto">

        <AnimatePresence mode="wait">

          {/* ── LIST VIEW ── */}
          {view === "list" && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* Back + Title */}
              <Link to="/admin"
                className="flex items-center gap-2 text-white/40 hover:text-white mb-10 transition-colors w-fit group">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
              </Link>

              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-black italic flex items-center gap-3 tracking-tighter">
                  <LifeBuoy className="text-primary-500 w-8 h-8" /> Support <span className="text-primary-500">Tickets</span>
                </h2>
                <button onClick={load}
                  className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all active:scale-95">
                  <RefreshCcw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>

              {/* Stats Row — clickable filters */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
                {Object.entries(STATUS_MAP).map(([key, { label, color, bg, Icon }]) => (
                  <button key={key}
                    onClick={() => setFilters(f => ({ ...f, status: f.status === key ? "" : key }))}
                    className={`p-5 rounded-[2rem] border text-center transition-all
                      ${filters.status === key
                        ? `${bg} border-current`
                        : "glass border-white/5 hover:border-white/10 bg-white/[0.01]"}`}>
                    <Icon className={`w-5 h-5 mx-auto mb-2 ${filters.status === key ? color : "text-white/20"}`} />
                    <p className={`text-2xl font-black ${filters.status === key ? color : "text-white"}`}>
                      {stats[key] || 0}
                    </p>
                    <p className="text-[10px] text-white/30 mt-1 uppercase tracking-widest font-bold">{label}</p>
                  </button>
                ))}
              </div>

              {/* Filters Bar */}
              <div className="glass p-5 rounded-[2rem] border border-white/5 bg-white/[0.01] mb-6 flex flex-wrap gap-3 items-center">
                <Filter className="w-4 h-4 text-white/25 flex-shrink-0" />
                {[
                  { key: "priority", options: ["low","medium","high","urgent"],     label: "Priority" },
                  { key: "plan",     options: ["free","pro","enterprise"],           label: "Plan"     },
                ].map(({ key, options, label }) => (
                  <select key={key} value={filters[key]}
                    onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white/50 outline-none focus:border-primary-500 transition-all">
                    <option value="" className="bg-[#03050a]">All {label}s</option>
                    {options.map(o => (
                      <option key={o} value={o} className="bg-[#03050a] capitalize">{o.replace("_"," ")}</option>
                    ))}
                  </select>
                ))}
                {(filters.status || filters.priority || filters.plan) && (
                  <button onClick={() => setFilters({ status: "", priority: "", plan: "" })}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors">
                    <X className="w-3.5 h-3.5" /> Clear Filters
                  </button>
                )}

                {/* Bulk Actions */}
                {selected.length > 0 && (
                  <div className="flex items-center gap-3 ml-auto">
                    <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">{selected.length} selected</span>
                    <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white/50 outline-none">
                      {Object.entries(STATUS_MAP).map(([val, { label }]) => (
                        <option key={val} value={val} className="bg-[#03050a]">{label}</option>
                      ))}
                    </select>
                    <button onClick={handleBulk} disabled={bulking}
                      className="flex items-center gap-1.5 bg-white text-black px-5 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all active:scale-95 disabled:opacity-40">
                      {bulking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Table */}
              <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden bg-white/[0.01]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[800px]">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-[0.2em] text-white/30 border-b border-white/5 bg-white/5">
                        <th className="p-6 w-10">
                          <input type="checkbox"
                            checked={selected.length === tickets.length && tickets.length > 0}
                            onChange={selectAll}
                            className="w-4 h-4 rounded accent-primary-500 cursor-pointer" />
                        </th>
                        <th className="p-6">Ticket</th>
                        <th className="p-6">User & Plan</th>
                        <th className="p-6">Category</th>
                        <th className="p-6">Priority</th>
                        <th className="p-6">Status</th>
                        <th className="p-6">Date</th>
                        <th className="p-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {!loading && tickets.map((t, i) => {
                        const plan      = PLAN_BADGE[t.userSnapshot?.plan] || PLAN_BADGE.free;
                        const isPremium = t.userSnapshot?.plan !== "free";
                        return (
                          <motion.tr key={t._id}
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className={`hover:bg-white/[0.02] transition-colors group
                              ${isPremium ? "border-l-2 border-yellow-500/25" : ""}`}>
                            <td className="p-6">
                              <input type="checkbox" checked={selected.includes(t._id)}
                                onChange={() => toggleSelect(t._id)}
                                className="w-4 h-4 rounded accent-primary-500 cursor-pointer" />
                            </td>
                            <td className="p-6">
                              <p className="font-mono text-xs font-black text-primary-400 mb-1">{t.ticketId}</p>
                              <p className="text-xs text-white/50 max-w-[200px] truncate">{t.subject}</p>
                            </td>
                            <td className="p-6">
                              <div className="flex items-center gap-2 mb-1.5">
                                {isPremium && <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                                <span className="text-sm font-bold text-white/80">{t.userSnapshot?.name}</span>
                              </div>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-widest ${plan.cls}`}>
                                {plan.label}
                              </span>
                            </td>
                            <td className="p-6">
                              <span className="text-xs text-white/40 capitalize font-medium">
                                {CATEGORY_LABEL[t.category] || t.category}
                              </span>
                            </td>
                            <td className="p-6">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[t.priority] || "bg-white/20"}`} />
                                <span className="text-xs text-white/40 capitalize font-medium">{t.priority}</span>
                              </div>
                            </td>
                            <td className="p-6"><StatusBadge status={t.status} /></td>
                            <td className="p-6">
                              <span className="text-xs text-white/30">{new Date(t.createdAt).toLocaleDateString()}</span>
                            </td>
                            <td className="p-6 text-right">
                              <button onClick={() => { setActiveId(t._id); setView("detail"); }}
                                className="flex items-center gap-1.5 ml-auto bg-primary-500/10 text-primary-400 hover:bg-primary-500 hover:text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95">
                                Open <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {loading && (
                    <div className="flex justify-center py-20">
                      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                  )}
                  {!loading && tickets.length === 0 && (
                    <p className="p-20 text-center text-white/10 font-bold italic uppercase tracking-widest">
                      No tickets found
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── DETAIL VIEW ── */}
          {view === "detail" && (
            <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TicketDetail
                ticketId={activeId}
                onBack={() => { setView("list"); load(); }}
                onUpdate={load}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};

export default SupportTickets;
