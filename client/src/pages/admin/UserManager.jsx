"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Users, UserCheck, UserMinus, Shield, Search, 
  Activity, DollarSign, TrendingUp, ChevronLeft,
  RefreshCcw, Loader2, MoreVertical, Ban, CheckCircle
} from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Filler, Legend,
} from 'chart.js';

import Footer from "@/components/Footer"; // YE WALA MISSING THA

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState({ totalRevenue: 0, monthlyStats: [] });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { 
    fetchData(); 
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, adminRes] = await Promise.all([
        axiosInstance.get("/admin/users"),
        axiosInstance.get("/admin/analytics")
      ]);
      setUsers(userRes.data.users);
      setAnalytics(adminRes.data);
    } catch (err) { 
      console.error("Data fetch failed", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const toggleStatus = async (id) => {
    setActionLoading(id);
    try {
      await axiosInstance.patch(`/admin/users/status/${id}`);
      setUsers(users.map(u => u._id === id ? { ...u, isActive: !u.isActive } : u));
    } catch (err) { 
      alert("Action Failed"); 
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Chart Configuration
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      fill: true,
      label: 'Revenue (₹)',
      data: analytics.monthlyStats || [0, 0, 0, 0, 0, 0],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.05)',
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#3b82f6'
    }]
  };

  if (loading) return (
    <div className="min-h-screen bg-[#03050a] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#03050a] text-white selection:bg-primary-500/30">
      <main className="pt-24 pb-20 px-6 max-w-7xl mx-auto">
        
        {/* --- Header --- */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <Link to="/admin" className="flex items-center gap-2 text-white/30 hover:text-primary-400 mb-4 w-fit group text-xs font-black uppercase tracking-widest transition-colors">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Dashboard
            </Link>
            <h2 className="text-4xl font-black italic tracking-tighter flex items-center gap-4 text-white">
              User <span className="text-primary-500">Intelligence.</span>
            </h2>
          </div>
          <button onClick={fetchData} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
            <RefreshCcw className="w-5 h-5 text-white/50" />
          </button>
        </div>

        {/* --- Analytics Grid --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Gross Revenue", val: `₹${analytics.totalRevenue}`, icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/5" },
            { label: "Total Members", val: users.length, icon: Users, color: "text-blue-400", bg: "bg-blue-500/5" },
            { label: "Active Nodes", val: users.filter(u => u.isActive).length, icon: Activity, color: "text-green-400", bg: "bg-green-500/5" },
            { label: "Restricted", val: users.filter(u => !u.isActive).length, icon: Ban, color: "text-red-400", bg: "bg-red-500/5" }
          ].map((stat, i) => (
            <motion.div key={i} whileHover={{ y: -5 }} className={`p-6 rounded-[2.5rem] border border-white/5 bg-white/[0.01] ${stat.bg}`}>
              <stat.icon className={`${stat.color} mb-4`} size={20} />
              <p className="text-[10px] uppercase font-black text-white/20 tracking-widest">{stat.label}</p>
              <h3 className="text-3xl font-black italic tracking-tighter">{stat.val}</h3>
            </motion.div>
          ))}
        </div>

        {/* --- Revenue Chart --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 p-8 bg-white/[0.01] border border-white/5 rounded-[3rem] backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest text-white/30">
              <TrendingUp size={14} className="text-primary-500" /> Growth Trajectory
            </div>
            <div className="h-[300px]">
              <Line data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: "rgba(255,255,255,0.03)" } }, x: { grid: { display: false } } } }} />
            </div>
          </div>

          <div className="p-8 bg-primary-500/5 border border-primary-500/10 rounded-[3rem] flex flex-col justify-center text-center relative overflow-hidden group">
            <Shield className="mx-auto text-primary-500 mb-6 group-hover:scale-110 transition-transform duration-500" size={50} />
            <h4 className="font-black italic text-2xl mb-2 uppercase tracking-tighter text-white">System Admin</h4>
            <p className="text-xs text-white/40 mb-8 font-medium leading-relaxed uppercase tracking-widest">Global override enabled. You can modify any node in the ecosystem.</p>
            <button className="py-4 bg-white text-black font-black uppercase text-[10px] rounded-2xl tracking-[0.2em] hover:bg-primary-500 hover:text-white transition-all">Export Logs</button>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary-500/10 blur-3xl rounded-full" />
          </div>
        </div>

        {/* --- User Management Table --- */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary-500 transition-colors" size={18} />
            <input 
              type="text" placeholder="Search Identity (Name, Email)..."
              className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-[1.5rem] outline-none focus:border-primary-500/50 transition-all font-bold text-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="text-[10px] font-black uppercase text-white/20 tracking-widest px-4">{filteredUsers.length} Nodes Found</span>
        </div>

        <div className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.2em] text-white/30 border-b border-white/5 bg-white/[0.03]">
                  <th className="px-8 py-6 font-black">Member Identity</th>
                  <th className="px-8 py-6 font-black">Plan Tier</th>
                  <th className="px-8 py-6 font-black">Ecosystem Status</th>
                  <th className="px-8 py-6 text-right font-black">Decisions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-white/[0.02] transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center font-black uppercase text-white shadow-lg">
                          {u.name[0]}
                        </div>
                        <div>
                          <p className="font-black text-sm text-white tracking-tight flex items-center gap-2 uppercase italic">
                            {u.name} {u.role === 'admin' && <Shield size={12} className="text-primary-500 fill-primary-500/20" />}
                          </p>
                          <p className="text-[11px] text-white/30 font-medium">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border ${u.subscription?.plan === 'enterprise' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : u.subscription?.plan === 'pro' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
                        {u.subscription?.plan || 'Standard'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${u.isActive ? 'text-green-500' : 'text-red-500'}`}>
                        <div className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                        {u.isActive ? 'Operational' : 'Restricted'}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => toggleStatus(u._id)}
                          disabled={actionLoading === u._id}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${u.isActive ? 'border-red-500/10 text-red-500 bg-red-500/5 hover:bg-red-500 hover:text-white' : 'border-green-500/10 text-green-500 bg-green-500/5 hover:bg-green-500 hover:text-white'}`}
                        >
                          {actionLoading === u._id ? <Loader2 size={14} className="animate-spin" /> : u.isActive ? <><Ban size={14}/> Restricted</> : <><CheckCircle size={14}/> Operational</>}
                        </button>
                        <button className="p-3 rounded-xl bg-white/5 border border-white/5 text-white/20 hover:text-white transition-all active:scale-90">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserManager;