"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, Ticket, Settings, ShieldCheck,
  ArrowRight, LayoutDashboard, LifeBuoy, Megaphone, LogOut, Loader2, Mail
} from "lucide-react";
import useAuth from "@/hooks/useAuth";
import axiosInstance from "@/utils/axiosInstance";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const AdminDashboard = () => {
  const { logout } = useAuth();

  // Real States for Analytics
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    serverUptime: "99.9%" // Uptime usually monitoring tool se aata hai, filhal static rakha hai
  });
  const [loading, setLoading] = useState(true);

  // --- Fetch Real Stats from Backend ---
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        // Note: Humne UserManager mein jo analytics API banayi thi, wahi use kar sakte hain
        // Ya phir ek dedicated stats endpoint "/stats/live" use karein
        const res = await axiosInstance.get("/admin/users");
        const allUsers = res.data.users;

        setStats({
          totalUsers: allUsers.length,
          activeUsers: allUsers.filter(u => u.isActive).length,
          serverUptime: "99.9%"
        });
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const ADMIN_CARDS = [
    {
      title: "User Management",
      desc: "Control accounts & analytics.",
      icon: Users,
      path: "/admin/users",
      color: "from-blue-500/10 to-indigo-500/10",
      border: "border-blue-500/20",
    },
    {
      title: "Subscriptions",
      desc: "Approve plan upgrades.",
      icon: ShieldCheck,
      path: "/admin/subscriptions",
      color: "from-blue-500/10 to-primary-500/10",
      border: "border-primary-500/20",
    },
    {
      title: "Coupons",
      desc: "Create promo codes.",
      icon: Ticket,
      path: "/admin/coupons",
      color: "from-purple-500/10 to-pink-500/10",
      border: "border-purple-500/20",
    },
    {
      title: "Announcements",
      desc: "Live notifications.",
      icon: Megaphone,
      path: "/admin/announcements",
      color: "from-red-500/10 to-orange-500/10",
      border: "border-red-500/20",
    },
    {
      title: "Support",
      desc: "Manage tickets.",
      icon: LifeBuoy,
      path: "/admin/support",
      color: "from-emerald-500/10 to-teal-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Settings",
      desc: "Global configs.",
      icon: Settings,
      path: "/admin/settings",
      color: "from-orange-500/10 to-yellow-500/10",
      border: "border-orange-500/20",
    },
    {
      title: "Newsletter",
      desc: "Blast emails to users.",
      icon: Mail,
      path: "/admin/newsletter",
      color: "from-pink-500/10 to-rose-500/10",
      border: "border-rose-500/20",
    },
  ];

  return (
    <div className="min-h-screen bg-[#03050a] text-white selection:bg-primary-500/30 font-sans">
      <Navbar />

      <main className="relative pt-24 pb-20 px-6 max-w-6xl mx-auto">
        {/* --- Compact Header --- */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="text-center md:text-left">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center justify-center md:justify-start gap-2 mb-2 text-primary-400 font-bold uppercase tracking-[0.2em] text-[10px]"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Admin Control</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-black tracking-tighter mb-2 italic"
            >
              Dashboard <span className="text-primary-500">Overview.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-white/30 max-w-xl text-sm font-medium"
            >
              System control and real-time monitoring.
            </motion.p>
          </div>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={logout}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/5 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 text-[10px] font-black uppercase tracking-widest active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </motion.button>
        </header>

        {/* --- Compact Navigation Grid --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ADMIN_CARDS.map((card, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5, scale: 1.01 }}
              className={`group relative p-5 rounded-[2rem] border ${card.border} bg-gradient-to-br ${card.color} overflow-hidden backdrop-blur-sm transition-all duration-300`}
            >
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                  <card.icon className="w-5 h-5 text-white transition-transform duration-500" />
                </div>

                <h3 className="text-lg font-black italic tracking-tight mb-1 uppercase">
                  {card.title}
                </h3>

                <p className="text-white/40 text-[11px] leading-snug mb-6 font-medium">
                  {card.desc}
                </p>

                <Link
                  to={card.path}
                  className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary-400 hover:text-white transition-colors"
                >
                  Manage <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/5 blur-[40px] rounded-full" />
            </motion.div>
          ))}
        </div>

        {/* --- Compact Quick Stats Bar (REAL DATA) --- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="mt-12 p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-wrap gap-8 justify-around items-center backdrop-blur-xl"
        >
          {loading ? (
            <div className="flex items-center gap-2 text-white/20 font-black uppercase text-[10px] tracking-widest">
              <Loader2 className="w-4 h-4 animate-spin" /> Synchronizing Data...
            </div>
          ) : (
            <>
              <div className="text-center">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Users</p>
                <p className="text-2xl font-black italic tracking-tighter">
                  {stats.totalUsers >= 1000 ? `${(stats.totalUsers / 1000).toFixed(1)}k` : stats.totalUsers}
                </p>
              </div>

              <div className="h-8 w-[1px] bg-white/5 hidden md:block" />

              <div className="text-center">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Active</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                  <p className="text-2xl font-black italic tracking-tighter text-green-500">{stats.activeUsers}</p>
                </div>
              </div>

              <div className="h-8 w-[1px] bg-white/5 hidden md:block" />

              <div className="text-center">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Uptime</p>
                <p className="text-2xl font-black italic tracking-tighter text-primary-400">{stats.serverUptime}</p>
              </div>
            </>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;