"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Megaphone, Send, Loader2, ChevronLeft, 
  Trash2, BellRing, Sparkles, Clock 
} from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";

const Announcements = () => {
  const [form, setForm] = useState({ title: "", message: "", type: "info" });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setFetching(true);
      const res = await axiosInstance.get("/announcements");
      setHistory(res.data.announcements);
    } catch (err) {
      console.error("Failed to fetch history");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) return alert("Please fill all fields");
    
    setLoading(true);
    try {
      const res = await axiosInstance.post("/announcements", form);
      if (res.data.success) {
        setForm({ title: "", message: "", type: "info" });
        fetchHistory(); // Refresh list to show new one
      }
    } catch (err) {
      alert("Failed to broadcast");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await axiosInstance.delete(`/announcements/${id}`);
      setHistory(history.filter(h => h._id !== id));
    } catch (err) {
      alert("Failed to delete");
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] text-white font-sans selection:bg-primary-500/30">
      <main className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
        
        {/* --- Header --- */}
        <nav className="mb-12">
          <Link to="/admin" className="flex items-center gap-2 text-white/30 hover:text-primary-400 mb-4 w-fit group transition-colors text-xs font-black uppercase tracking-widest">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </Link>
          <h2 className="text-4xl font-black italic tracking-tighter flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary-500/10 border border-primary-500/20">
              <Megaphone className="text-primary-500 w-8 h-8" />
            </div>
            Broadcast <span className="text-primary-500">Center</span>
          </h2>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          
          {/* --- LEFT: Create Form (2/5) --- */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-md sticky top-32">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-4 h-4 text-primary-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">New Announcement</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase text-white/20 ml-2 mb-2 block tracking-widest">Headline</label>
                  <input 
                    type="text" 
                    placeholder="e.g. System Maintenance"
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-primary-500/50 transition-all font-bold"
                    value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-white/20 ml-2 mb-2 block tracking-widest">Message Body</label>
                  <textarea 
                    placeholder="What do you want to tell your users?"
                    className="w-full h-32 bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-primary-500/50 transition-all font-medium resize-none"
                    value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-white/20 ml-2 mb-2 block tracking-widest">Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['info', 'warning', 'danger'].map((t) => (
                      <button 
                        key={t} type="button"
                        onClick={() => setForm({...form, type: t})}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all ${form.type === t ? 'bg-primary-500 border-primary-500 text-black' : 'bg-white/5 border-white/5 text-white/40 hover:text-white'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  disabled={loading}
                  className="w-full py-5 bg-white text-black rounded-[1.5rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-primary-500 hover:text-white transition-all active:scale-95 shadow-xl shadow-white/5 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Push Broadcast</>}
                </button>
              </form>
            </div>
          </div>

          {/* --- RIGHT: History (3/5) --- */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between mb-2 px-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Sent History</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-500/50">{history.length} Total</span>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {history.map((item) => (
                  <motion.div 
                    layout key={item._id}
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="group relative bg-white/[0.01] border border-white/5 p-6 rounded-[2rem] hover:bg-white/[0.03] transition-all"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-2 h-2 rounded-full animate-pulse ${item.type === 'danger' ? 'bg-red-500' : item.type === 'warning' ? 'bg-orange-500' : 'bg-primary-500'}`} />
                          <h4 className="font-black text-lg italic uppercase tracking-tighter">{item.title}</h4>
                        </div>
                        <p className="text-white/50 text-sm leading-relaxed mb-4">{item.message}</p>
                        <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-white/20">
                          <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1.5"><BellRing className="w-3 h-3" /> Broadcast Active</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleDelete(item._id)}
                        className="p-3 rounded-xl bg-red-500/5 text-red-500/20 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {fetching && <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-white/10" /></div>}

              {!fetching && history.length === 0 && (
                <div className="py-32 bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center opacity-20">
                  <Megaphone className="w-12 h-12 mb-4" />
                  <p className="font-black uppercase tracking-widest text-xs italic">No broadcasts sent yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Announcements;