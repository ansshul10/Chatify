"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Settings, Zap, Shield, AlertTriangle, Save, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import axiosInstance from "@/utils/axiosInstance";
import { PrimaryButton } from "@/components/Button";

const SystemSettings = () => {
  const [autoMode, setAutoMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Dynamic Label States
  const [config, setConfig] = useState({
    currentVersion: "V1.0",
    infraLabel: "Fortress Infrastructure",
    architectureLabel: "Architecture V1.0 is live",
    systemIterationLabel: "System Iterations"
  });

  useEffect(() => {
    fetchCurrentSettings();
  }, []);

  const fetchCurrentSettings = async () => {
    try {
      const res = await axiosInstance.get("/pricing/system-settings");
      if (res.data.settings) {
        setConfig(res.data.settings);
        setAutoMode(res.data.settings.autoApprove);
      }
    } catch (err) {
      console.error("Failed to fetch settings");
    }
  };

  const toggleMode = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.post("/pricing/admin/toggle-mode");
      setAutoMode(res.data.autoApprove);
    } catch (err) {
      console.error("Toggle failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLabelUpdate = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await axiosInstance.patch("/pricing/admin/update-system-settings", config);
      alert("All Global Labels Updated!");
    } catch (err) {
      alert("Update Failed");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#03050a] text-white selection:bg-primary-500/30">
      <main className="pt-32 pb-20 px-4 md:px-10 max-w-4xl mx-auto">
        
        <Link to="/admin" className="flex items-center gap-2 text-white/40 hover:text-white mb-10 transition-colors w-fit group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Link>

        <h2 className="text-4xl md:text-5xl font-black mb-12 italic tracking-tighter flex items-center gap-4">
          <Settings className="text-primary-500 w-10 h-10" /> System <span className="text-primary-500">Settings</span>
        </h2>

        <div className="grid gap-10">
          
          {/* 1. AUTO APPROVAL TOGGLE */}
          <div className="glass p-6 md:p-10 rounded-[2.5rem] border border-white/5 bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-primary-500/20 transition-all">
            <div className="flex items-center md:items-start gap-5 text-center sm:text-left flex-col sm:flex-row">
              <div className="w-14 h-14 rounded-3xl bg-primary-500/10 flex items-center justify-center text-primary-500 shrink-0">
                <Zap className="w-7 h-7 fill-current" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1 italic uppercase tracking-tighter">Instant Activation</h3>
                <p className="text-white/40 text-sm leading-relaxed max-w-xs">User plans approved automatically without manual review.</p>
              </div>
            </div>
            
            <button 
              onClick={toggleMode}
              disabled={loading}
              className={`relative w-20 h-10 rounded-full transition-all duration-500 ${autoMode ? 'bg-primary-500' : 'bg-white/10'}`}
            >
              <motion.div 
                animate={{ x: autoMode ? 44 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center"
              >
                {loading && <RefreshCw className="w-4 h-4 text-primary-500 animate-spin" />}
              </motion.div>
            </button>
          </div>

          {/* 2. DYNAMIC LABELS & VERSIONING FORM */}
          <div className="glass p-10 rounded-[3rem] border border-white/5 bg-white/[0.01]">
            <h3 className="text-xl font-black mb-8 italic uppercase tracking-widest text-primary-500 flex items-center gap-2">
              <Shield size={18}/> Global Versioning & Labels
            </h3>
            
            <form onSubmit={handleLabelUpdate} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 block mb-3">Current Version</label>
                  <input 
                    className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-primary-500 font-mono text-primary-400"
                    value={config.currentVersion}
                    onChange={(e) => setConfig({...config, currentVersion: e.target.value.toUpperCase()})}
                    placeholder="V1.0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 block mb-3">Infra Page Label</label>
                  <input 
                    className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-primary-500"
                    value={config.infraLabel}
                    onChange={(e) => setConfig({...config, infraLabel: e.target.value})}
                    placeholder="Fortress Infrastructure"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 block mb-3">Architecture Live Status</label>
                <input 
                  className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-primary-500"
                  value={config.architectureLabel}
                  onChange={(e) => setConfig({...config, architectureLabel: e.target.value})}
                  placeholder="Architecture V1.0 is live"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 block mb-3">Changelog Tag</label>
                <input 
                  className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-primary-500"
                  value={config.systemIterationLabel}
                  onChange={(e) => setConfig({...config, systemIterationLabel: e.target.value})}
                  placeholder="System Iterations"
                />
              </div>

              <PrimaryButton 
                type="submit" 
                disabled={updating}
                className="w-full py-5 rounded-2xl justify-center font-black uppercase tracking-widest shadow-xl shadow-primary-500/10"
              >
                {updating ? "Deploying..." : "Update Global System"}
              </PrimaryButton>
            </form>
          </div>

          {/* Alert Card */}
          <div className="p-8 rounded-[2.5rem] bg-yellow-500/5 border border-yellow-500/10 flex items-start gap-4">
            <AlertTriangle className="text-yellow-500 w-6 h-6 shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-yellow-500 italic uppercase text-xs tracking-widest mb-1">Global Impact</h4>
              <p className="text-sm text-yellow-500/60 leading-relaxed font-medium">Changes to these labels will reflect immediately across Landing, Security, and Changelog pages for all users.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SystemSettings;