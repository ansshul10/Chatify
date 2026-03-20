import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LifeBuoy, Plus, ChevronRight, Clock, CheckCircle2, AlertCircle,
  XCircle, Loader2, Send, Paperclip, X, MessageSquare, Zap,
  Bug, CreditCard, User, Shield, Lightbulb, HelpCircle, ChevronLeft,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createTicket, getMyTickets, getMyTicketById, userReply } from "@/services/supportService";
import { useAuthContext } from "@/context/AuthContext";

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "billing",         label: "Billing",         Icon: CreditCard,   color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/20" },
  { value: "account",         label: "Account",         Icon: User,         color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20"    },
  { value: "bug",             label: "Bug Report",      Icon: Bug,          color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20"      },
  { value: "feature_request", label: "Feature Request", Icon: Lightbulb,    color: "text-purple-400",  bg: "bg-purple-500/10 border-purple-500/20"},
  { value: "security",        label: "Security",        Icon: Shield,       color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20"},
  { value: "other",           label: "Other",           Icon: HelpCircle,   color: "text-white/40",    bg: "bg-white/5 border-white/10"           },
];

const PRIORITIES = [
  { value: "low",    label: "Low",    color: "text-emerald-400", dot: "bg-emerald-400" },
  { value: "medium", label: "Medium", color: "text-yellow-400",  dot: "bg-yellow-400"  },
  { value: "high",   label: "High",   color: "text-orange-400",  dot: "bg-orange-400"  },
  { value: "urgent", label: "Urgent", color: "text-red-400",     dot: "bg-red-400"     },
];

const STATUS_MAP = {
  open:        { label: "Open",        color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",       Icon: MessageSquare },
  pending:     { label: "Pending",     color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/20",   Icon: Clock         },
  in_progress: { label: "In Progress", color: "text-purple-400",  bg: "bg-purple-500/10 border-purple-500/20",   Icon: Zap           },
  resolved:    { label: "Resolved",    color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", Icon: CheckCircle2  },
  closed:      { label: "Closed",      color: "text-white/30",    bg: "bg-white/5 border-white/10",              Icon: XCircle       },
};

const PLAN_BADGE = {
  free:       { label: "FREE",  cls: "bg-white/5 text-white/30 border-white/10"           },
  pro:        { label: "PLUS",  cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
  enterprise: { label: "ULTRA", cls: "bg-purple-500/15 text-purple-400 border-purple-500/20" },
};

// ── Shared UI ─────────────────────────────────────────────────────────────────
const SectionCard = ({ children, className = "" }) => (
  <div className={`glass rounded-2xl border border-white/5 overflow-hidden ${className}`}>{children}</div>
);

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.open;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${s.bg} ${s.color}`}>
      <s.Icon className="w-3 h-3" /> {s.label}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: Create New Ticket
// ═══════════════════════════════════════════════════════════════════════════════
const CreateTicket = ({ onSuccess, onCancel }) => {
  const [form, setForm]       = useState({ category: "", priority: "medium", subject: "", message: "" });
  const [attachment, setAtt]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAtt(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.category || !form.subject.trim() || !form.message.trim()) {
      setMsg({ type: "error", text: "Please fill in all required fields." }); return;
    }
    try {
      setLoading(true);
      await createTicket({ ...form, attachment });
      onSuccess();
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || "Failed to submit ticket." });
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <button onClick={onCancel} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to My Tickets
      </button>

      <h2 className="text-2xl font-black mb-6">New Support Ticket</h2>

      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm mb-5
              ${msg.type === "success" ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" : "bg-red-500/10 border-red-500/25 text-red-400"}`}>
            {msg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-5 max-w-2xl">

        {/* Category */}
        <SectionCard>
          <div className="px-6 pt-5 pb-4 border-b border-white/5">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Category <span className="text-red-400">*</span></h3>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {CATEGORIES.map(({ value, label, Icon, color, bg }) => (
              <motion.button key={value} onClick={() => setForm(f => ({ ...f, category: value }))}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200
                  ${form.category === value ? `${bg} ${color}` : "bg-white/[0.02] border-white/8 text-white/40 hover:border-white/15 hover:text-white/60"}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                  ${form.category === value ? bg : "bg-white/5 border border-white/8"}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">{label}</span>
              </motion.button>
            ))}
          </div>
        </SectionCard>

        {/* Priority */}
        <SectionCard>
          <div className="px-6 pt-5 pb-4 border-b border-white/5">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Priority Level</h3>
          </div>
          <div className="p-5 flex gap-2.5 flex-wrap">
            {PRIORITIES.map(({ value, label, color, dot }) => (
              <button key={value} onClick={() => setForm(f => ({ ...f, priority: value }))}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all duration-200
                  ${form.priority === value
                    ? `bg-white/10 border-white/20 ${color}`
                    : "bg-white/[0.02] border-white/8 text-white/30 hover:border-white/15"}`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                {label}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Subject */}
        <SectionCard>
          <div className="px-6 pt-5 pb-4 border-b border-white/5">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Subject <span className="text-red-400">*</span></h3>
          </div>
          <div className="p-5">
            <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              maxLength={150} placeholder="Briefly describe your issue..."
              className="w-full bg-white/[0.04] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-primary-500/50 focus:bg-white/[0.06] transition-all" />
            <p className="text-xs text-white/20 text-right mt-1.5">{form.subject.length}/150</p>
          </div>
        </SectionCard>

        {/* Message */}
        <SectionCard>
          <div className="px-6 pt-5 pb-4 border-b border-white/5">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Message <span className="text-red-400">*</span></h3>
          </div>
          <div className="p-5">
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={5} maxLength={5000} placeholder="Describe your issue in detail. Include any error messages, steps to reproduce, etc..."
              className="w-full bg-white/[0.04] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-primary-500/50 focus:bg-white/[0.06] transition-all resize-none" />
            <p className="text-xs text-white/20 text-right mt-1.5">{form.message.length}/5000</p>
          </div>
        </SectionCard>

        {/* Attachment */}
        <SectionCard>
          <div className="px-6 pt-5 pb-4 border-b border-white/5">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Attachment <span className="text-white/20 font-normal normal-case">(optional)</span></h3>
          </div>
          <div className="p-5">
            {attachment ? (
              <div className="flex items-center gap-3">
                <img src={attachment} alt="preview" className="w-16 h-16 rounded-xl object-cover border border-white/10" />
                <div className="flex-1">
                  <p className="text-sm text-emerald-400 font-semibold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Image attached</p>
                  <button onClick={() => setAtt(null)} className="text-xs text-red-400 hover:text-red-300 mt-1 flex items-center gap-1"><X className="w-3 h-3" /> Remove</button>
                </div>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-3 p-6 border border-dashed border-white/10 rounded-xl cursor-pointer hover:border-primary-500/40 hover:bg-primary-500/5 transition-all group">
                <Paperclip className="w-5 h-5 text-white/25 group-hover:text-primary-400 transition-colors" />
                <span className="text-sm text-white/30 group-hover:text-white/60 transition-colors">Attach a screenshot or image</span>
                <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </label>
            )}
          </div>
        </SectionCard>

        {/* Submit */}
        <motion.button onClick={handleSubmit} disabled={loading}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {loading ? "Submitting..." : "Submit Ticket"}
        </motion.button>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: Ticket Detail + Reply
// ═══════════════════════════════════════════════════════════════════════════════
const TicketDetail = ({ ticketId, onBack }) => {
  const [ticket,  setTicket]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply,   setReply]   = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    try { setLoading(true); const d = await getMyTicketById(ticketId); setTicket(d.ticket); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [ticketId]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    try {
      setSending(true);
      await userReply(ticketId, reply);
      setReply("");
      load();
    } catch { } finally { setSending(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

  if (!ticket) return null;

  const catObj = CATEGORIES.find(c => c.value === ticket.category);
  const plan   = PLAN_BADGE[ticket.userSnapshot?.plan] || PLAN_BADGE.free;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to My Tickets
      </button>

      {/* Ticket Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <span className="font-mono text-sm font-black text-primary-400">{ticket.ticketId}</span>
            <StatusBadge status={ticket.status} />
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${plan.cls}`}>{plan.label}</span>
          </div>
          <h2 className="text-xl font-black">{ticket.subject}</h2>
          <p className="text-xs text-white/30 mt-1">{new Date(ticket.createdAt).toLocaleString()}</p>
        </div>
        {catObj && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${catObj.bg} ${catObj.color} flex-shrink-0`}>
            <catObj.Icon className="w-4 h-4" />
            {catObj.label}
          </div>
        )}
      </div>

      {/* Original Message */}
      <SectionCard className="mb-4">
        <div className="p-5">
          <p className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Original Message</p>
          <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
          {ticket.attachment && (
            <img src={ticket.attachment} alt="attachment" className="mt-4 max-w-xs rounded-xl border border-white/10 cursor-pointer"
              onClick={() => window.open(ticket.attachment, "_blank")} />
          )}
        </div>
      </SectionCard>

      {/* Replies */}
      {ticket.replies.length > 0 && (
        <div className="space-y-3 mb-5">
          {ticket.replies.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`p-4 rounded-2xl border text-sm leading-relaxed
                ${r.sender === "admin"
                  ? "bg-primary-500/8 border-primary-500/20 ml-0 mr-8"
                  : "bg-white/[0.03] border-white/8 ml-8 mr-0"}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black
                  ${r.sender === "admin" ? "bg-primary-500/20 text-primary-400" : "bg-white/10 text-white/50"}`}>
                  {r.sender === "admin" ? "A" : "U"}
                </div>
                <span className={`text-xs font-bold ${r.sender === "admin" ? "text-primary-400" : "text-white/40"}`}>
                  {r.sender === "admin" ? "Support Team" : "You"}
                </span>
                <span className="text-xs text-white/20 ml-auto">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-white/70 whitespace-pre-wrap">{r.message}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Reply Box */}
      {ticket.status !== "closed" && (
        <SectionCard>
          <div className="p-5">
            <p className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Add Reply</p>
            <textarea value={reply} onChange={e => setReply(e.target.value)} rows={4}
              placeholder="Write your reply here..."
              className="w-full bg-white/[0.04] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-primary-500/50 transition-all resize-none mb-3" />
            <motion.button onClick={handleReply} disabled={sending || !reply.trim()}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-primary-500 to-purple-600 text-white disabled:opacity-40 shadow-lg shadow-primary-500/20 transition-all">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? "Sending..." : "Send Reply"}
            </motion.button>
          </div>
        </SectionCard>
      )}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: Ticket List
// ═══════════════════════════════════════════════════════════════════════════════
const TicketList = ({ onNew, onView }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyTickets().then(d => setTickets(d.tickets)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black">My Tickets</h2>
          <p className="text-sm text-white/40 mt-1">{tickets.length} total ticket{tickets.length !== 1 ? "s" : ""}</p>
        </div>
        <motion.button onClick={onNew} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-lg shadow-primary-500/20">
          <Plus className="w-4 h-4" /> New Ticket
        </motion.button>
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-4">
            <LifeBuoy className="w-7 h-7 text-primary-400" />
          </div>
          <p className="text-white/50 font-semibold mb-1">No support tickets yet</p>
          <p className="text-white/25 text-sm mb-6">Create a ticket and our team will help you out</p>
          <motion.button onClick={onNew} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            <Plus className="w-4 h-4" /> Create First Ticket
          </motion.button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t, i) => {
            const catObj = CATEGORIES.find(c => c.value === t.category);
            const plan   = PLAN_BADGE[t.userSnapshot?.plan] || PLAN_BADGE.free;
            return (
              <motion.div key={t._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => onView(t._id)}
                className="glass rounded-2xl border border-white/5 p-5 cursor-pointer hover:border-white/10 hover:bg-white/[0.02] transition-all group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap mb-2">
                      <span className="font-mono text-xs font-black text-primary-400">{t.ticketId}</span>
                      <StatusBadge status={t.status} />
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${plan.cls}`}>{plan.label}</span>
                      {catObj && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${catObj.bg} ${catObj.color}`}>
                          {catObj.label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-white/80 truncate">{t.subject}</p>
                    <p className="text-xs text-white/30 mt-1">{new Date(t.createdAt).toLocaleDateString()}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const Support = () => {
  const { user } = useAuthContext();
  const [view, setView]         = useState("list"); // list | create | detail
  const [detailId, setDetailId] = useState(null);
  const [refresh, setRefresh]   = useState(0);

  const plan = PLAN_BADGE[user?.subscription?.plan] || PLAN_BADGE.free;

  return (
    <div className="min-h-screen bg-[#080b14] text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-40 pb-24">

        {/* Page Header */}
        {view === "list" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-500/15 border border-primary-500/25 flex items-center justify-center">
                <LifeBuoy className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black">Support Center</h1>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${plan.cls}`}>{plan.label}</span>
                </div>
                <p className="text-xs text-white/30">Get help from our team</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Views */}
        <AnimatePresence mode="wait">
          {view === "list" && (
            <TicketList key={`list-${refresh}`}
              onNew={() => setView("create")}
              onView={(id) => { setDetailId(id); setView("detail"); }} />
          )}
          {view === "create" && (
            <CreateTicket key="create"
              onSuccess={() => { setRefresh(r => r + 1); setView("list"); }}
              onCancel={() => setView("list")} />
          )}
          {view === "detail" && (
            <TicketDetail key={`detail-${detailId}`}
              ticketId={detailId}
              onBack={() => setView("list")} />
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
};

export default Support;
