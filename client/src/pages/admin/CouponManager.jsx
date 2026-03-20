"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Ticket, Plus, Trash2, Tag, Gift, Loader2 } from "lucide-react";
import { PrimaryButton } from "@/components/Button";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "@/utils/axiosInstance";

const CouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: "", discountPercentage: "" });

  // 1. Fetch Coupons from Database
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/pricing/admin/coupons");
      setCoupons(res.data.coupons || []);
    } catch (err) {
      console.error("Fetch Coupons Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // 2. Handle Add Coupon (API call)
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discountPercentage) return;

    try {
      setBtnLoading(true);
      const res = await axiosInstance.post("/pricing/admin/create-coupon", {
        code: newCoupon.code,
        discountPercentage: Number(newCoupon.discountPercentage)
      });

      if (res.data.success) {
        setCoupons([res.data.coupon, ...coupons]);
        setNewCoupon({ code: "", discountPercentage: "" });
        alert("Offer Deployed Successfully!");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create coupon");
    } finally {
      setBtnLoading(false);
    }
  };

  // 3. Handle Delete Coupon
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await axiosInstance.delete(`/pricing/admin/coupon/${id}`);
      setCoupons(coupons.filter(c => c._id !== id));
    } catch (err) {
      alert("Failed to delete coupon");
    }
  };

  return (
    <div className="min-h-screen bg-[#03050a] text-white selection:bg-primary-500/30">
      <main className="pt-32 pb-20 px-4 md:px-10 max-w-7xl mx-auto">
        
        <Link to="/admin" className="flex items-center gap-2 text-white/40 hover:text-white mb-10 transition-colors w-fit group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Link>

        <div className="grid lg:grid-cols-12 gap-10 items-start">
          
          {/* Create Coupon Form (Left Column) */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <div className="glass p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.01] sticky top-32">
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 italic">
                <Gift className="text-primary-500 w-6 h-6" /> Create Offer
              </h3>
              <form onSubmit={handleAdd} className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase font-black text-white/30 tracking-[0.2em] block mb-3">Coupon Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. CHATIFY50"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold focus:outline-none focus:border-primary-500 transition-all placeholder:text-white/10"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-white/30 tracking-[0.2em] block mb-3">Discount Percentage</label>
                  <input 
                    type="number" 
                    placeholder="50"
                    value={newCoupon.discountPercentage}
                    onChange={(e) => setNewCoupon({...newCoupon, discountPercentage: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold focus:outline-none focus:border-primary-500 transition-all placeholder:text-white/10"
                    required
                  />
                </div>
                <PrimaryButton 
                  type="submit" 
                  disabled={btnLoading}
                  className="w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] justify-center shadow-lg shadow-primary-500/10"
                >
                  {btnLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy Coupon"}
                </PrimaryButton>
              </form>
            </div>
          </div>

          {/* Coupons List (Right Column) */}
          <div className="lg:col-span-8 order-1 lg:order-2 space-y-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white/40 uppercase tracking-widest text-xs">
              <Tag className="w-4 h-4" /> Live Coupons
            </h3>
            
            {loading ? (
              <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {coupons.map((c) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={c._id} 
                      className="glass p-6 rounded-[2rem] border border-white/5 bg-white/[0.02] flex items-center justify-between group hover:border-primary-500/30 transition-all relative overflow-hidden"
                    >
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-primary-500/20 group-hover:text-primary-500 transition-all duration-500">
                          <Ticket className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-black text-lg tracking-wider">{c.code}</h4>
                          <p className="text-[10px] text-primary-400 font-bold uppercase tracking-widest">{c.discountPercentage}% Discount</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleDelete(c._id)}
                        className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 relative z-10"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                      {/* Background Pattern */}
                      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary-500/5 blur-3xl rounded-full" />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {coupons.length === 0 && (
                  <p className="col-span-full text-center text-white/10 font-bold py-20 uppercase tracking-widest italic">No active offers found</p>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default CouponManager;