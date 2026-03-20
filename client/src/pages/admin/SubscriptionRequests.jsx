"use client";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  ChevronLeft, ShieldCheck, CheckCircle, XCircle, 
  Eye, RefreshCcw, ShieldAlert, Zap, User, Clock, AlertTriangle, X
} from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";

const SubscriptionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(null);
  const [rejectionModal, setRejectionModal] = useState({ show: false, id: null, reason: "" });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/pricing/admin/requests");
      setRequests(res.data.requests);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status, reason = "") => {
    try {
      const res = await axiosInstance.post(`/pricing/admin/action/${id}`, { status, reason });
      if (res.data.success) {
        setRequests(prev => prev.map(r => r._id === id ? { ...r, status } : r));
        setRejectionModal({ show: false, id: null, reason: "" });
      }
    } catch (err) {
      alert("Action failed. Check console.");
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] text-white font-sans selection:bg-primary-500/30">
      <main className="pt-32 pb-20 px-6 md:px-10 max-w-7xl mx-auto">
        
        {/* --- Header & Breadcrumb --- */}
        <nav className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <Link to="/admin" className="flex items-center gap-2 text-white/30 hover:text-primary-400 mb-4 w-fit group transition-colors text-xs font-black uppercase tracking-widest">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Dashboard
            </Link>
            <h2 className="text-4xl font-black italic tracking-tighter flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary-500/10 border border-primary-500/20">
                <ShieldCheck className="text-primary-500 w-8 h-8" />
              </div>
              Payment <span className="text-primary-500">Verifications</span>
            </h2>
          </div>

          <button 
            onClick={fetchRequests} 
            disabled={loading}
            className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95 text-xs font-black uppercase tracking-widest disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> {loading ? "Syncing..." : "Refresh Data"}
          </button>
        </nav>

        {/* --- Stats Overview (Optional but Good for UI) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5">
                <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1">Pending Approval</p>
                <h3 className="text-3xl font-black italic">{requests.filter(r => r.status === 'pending').length}</h3>
            </div>
            <div className="p-6 rounded-[2rem] bg-green-500/5 border border-green-500/10">
                <p className="text-[10px] font-black uppercase text-green-500/50 tracking-widest mb-1">Approved Today</p>
                <h3 className="text-3xl font-black italic text-green-500">{requests.filter(r => r.status === 'approved').length}</h3>
            </div>
        </div>

        {/* --- Main Table Card --- */}
        <div className="relative rounded-[2.5rem] border border-white/5 bg-white/[0.01] overflow-hidden backdrop-blur-sm shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px] border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.25em] text-white/40 border-b border-white/5 bg-white/[0.03]">
                  <th className="px-10 py-6 font-black">Identity</th>
                  <th className="px-10 py-6 font-black">Transaction Info</th>
                  <th className="px-10 py-6 font-black text-center">Proof</th>
                  <th className="px-10 py-6 font-black text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-white/[0.03] transition-all group">
                    {/* User Identity */}
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 border border-white/5 flex items-center justify-center text-primary-400 group-hover:scale-110 transition-transform">
                          <User className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-black text-white text-lg tracking-tight leading-none mb-1">{req.userId?.name}</span>
                          <span className="text-white/40 text-xs font-medium">{req.userId?.email}</span>
                          <div className="flex items-center gap-2 mt-1.5">
                             <span className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] font-black text-primary-500 uppercase tracking-tighter border border-primary-500/20">@{req.userId?.username}</span>
                             <span className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] font-black text-white/40 uppercase tracking-tighter border border-white/10">{req.planId || 'Plus'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Transaction Details */}
                    <td className="px-10 py-8">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                           <span className="text-2xl font-black font-mono text-primary-400 tracking-wider italic">₹{req.pricePaid}</span>
                           <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${req.billingCycle === 'yearly' ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-white/40'}`}>
                             {req.billingCycle}
                           </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-white/20 uppercase font-black tracking-widest mb-1">Ref ID / UTR</span>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-white/60 bg-white/5 px-2 py-1 rounded-lg border border-white/5">{req.paymentNote}</span>
                                <span className="text-[10px] text-white/20 font-mono italic">{req.utr}</span>
                            </div>
                        </div>
                      </div>
                    </td>

                    {/* Screenshot / Proof */}
                    <td className="px-10 py-8">
                      <div className="flex flex-col items-center gap-2">
                        {req.screenshot ? (
                          <button 
                            onClick={() => setSelectedImg(req.screenshot)}
                            className="group relative w-14 h-14 rounded-2xl overflow-hidden border border-white/10 hover:border-primary-500/50 transition-all"
                          >
                            <img src={req.screenshot} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-transparent transition-all">
                                <Eye className="w-5 h-5 text-white" />
                            </div>
                          </button>
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-white/10">
                             <ShieldAlert className="w-6 h-6" />
                          </div>
                        )}
                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${req.screenshot ? 'text-green-500' : 'text-white/20'}`}>
                            {req.screenshot ? 'Auto-Scan Ready' : 'Manual Audit'}
                        </span>
                      </div>
                    </td>

                    {/* Decision Action */}
                    <td className="px-10 py-8 text-right">
                      {req.status === 'pending' ? (
                        <div className="flex justify-end gap-3">
                          <button 
                            onClick={() => handleAction(req._id, "approved")}
                            className="h-11 px-6 rounded-2xl bg-white text-black font-black text-[10px] uppercase hover:bg-primary-500 hover:text-white transition-all active:scale-95 shadow-lg shadow-white/5 flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" /> Approve
                          </button>
                          <button 
                            onClick={() => setRejectionModal({ show: true, id: req._id, reason: "" })}
                            className="h-11 px-6 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/10 font-black text-[10px] uppercase hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      ) : (
                        <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest ${req.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {req.status} {req.status === 'approved' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {requests.length === 0 && !loading && (
              <div className="py-32 flex flex-col items-center justify-center text-center">
                <Clock className="w-12 h-12 text-white/5 mb-4" />
                <p className="text-white/20 font-black uppercase tracking-[0.3em] text-xs italic">Queue is currently empty</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* --- Screenshot Modal --- */}
      <AnimatePresence>
        {selectedImg && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 md:p-12">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedImg(null)} className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative max-w-4xl max-h-full overflow-hidden">
              <button onClick={() => setSelectedImg(null)} className="absolute top-4 right-4 z-10 p-3 bg-black/50 hover:bg-white text-white hover:text-black rounded-full transition-all"><X className="w-5 h-5"/></button>
              <img src={selectedImg} alt="Proof" className="rounded-[2.5rem] border border-white/10 shadow-2xl max-h-[85vh] object-contain" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Custom Rejection Modal --- */}
      <AnimatePresence>
        {rejectionModal.show && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setRejectionModal({show: false, id: null, reason: ""})} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative bg-[#0d111a] border border-white/10 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl">
               <h3 className="text-xl font-black italic mb-2 flex items-center gap-2 text-red-500"><AlertTriangle className="w-6 h-6"/> Reject Request?</h3>
               <p className="text-white/40 text-sm mb-6">User will receive an email notification about the rejection reason.</p>
               
               <textarea 
                placeholder="Reason (e.g., UTR mismatch, blur screenshot...)"
                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-red-500 transition-all resize-none mb-6"
                value={rejectionModal.reason}
                onChange={(e) => setRejectionModal({...rejectionModal, reason: e.target.value})}
               />

               <div className="flex gap-4">
                  <button onClick={() => setRejectionModal({show: false, id: null, reason: ""})} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Cancel</button>
                  <button 
                    disabled={!rejectionModal.reason}
                    onClick={() => handleAction(rejectionModal.id, "failed", rejectionModal.reason)}
                    className="flex-1 py-4 bg-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all disabled:opacity-20 shadow-xl shadow-red-600/20"
                  >
                    Confirm Rejection
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubscriptionRequests;