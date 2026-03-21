"use client";

import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import useAuth from "@/hooks/useAuth";
import axiosInstance from "@/utils/axiosInstance";
import { io } from "socket.io-client"; // NEW: Socket Client Import

// ─── Icons ──────────────────────────────────────────────────────────────────
const IconSearch    = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
const IconBell      = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const IconHome      = () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IconFeatures  = () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const IconMsg       = () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const IconUser      = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconChevron   = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>;
const IconLogout    = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconSun       = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><path d="M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>;
const IconMoon      = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;

// ─── Constants ───────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Home",     href: "/",           icon: <IconHome /> },
  { label: "Chat",     href: "/chat",     icon: <IconMsg /> }, // Added Chat link
  { label: "Pricing",  href: "/pricing",   icon: <IconMsg /> },
];

// ─── Search Modal Component ──────────────────────────────────────────────────
const SearchModal = ({ onClose }) => {
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div 
      className="fixed inset-0 z-[1100] flex items-start justify-center pt-24 px-4 bg-black/70 backdrop-blur-md"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="relative w-full max-w-2xl bg-[#0d111a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        initial={{ scale: 0.9, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 px-8 py-6 border-b border-white/5">
          <IconSearch />
          <input 
            ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages, users, or settings..." 
            className="flex-1 bg-transparent outline-none text-lg text-white placeholder-white/20"
          />
          <kbd className="hidden md:block text-[10px] font-black bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-xl text-white/40">ESC</kbd>
        </div>
        <div className="p-8 min-h-[300px]">
          <p className="text-[10px] font-black uppercase text-white/20 tracking-[0.2em] mb-4">Quick Suggestions</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {["Update Profile", "Security Settings", "Billing History", "Active Groups"].map((item) => (
              <button key={item} className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary-500/50 hover:bg-primary-500/5 transition-all text-left text-sm font-bold text-white/60 hover:text-white">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><IconSearch /></div>
                {item}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── MAIN NAVBAR ─────────────────────────────────────────────────────────────
const Navbar = ({ theme, toggleTheme }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false); // NEW: Unread state
  
  const notiRef = useRef(null);
  const profileRef = useRef(null);
  const socket = useRef(null); // NEW: Socket Reference

  // 1. LIVE NOTIFICATIONS LOGIC
  useEffect(() => {
    if (isAuthenticated) {
      // Initialize Socket connection
      socket.current = io("https://chatify-j1v2.onrender.com", { withCredentials: true });

      // Listen for broadcasts
      socket.current.on("new-announcement", (data) => {
        setNotifications((prev) => [
          { message: `${data.title}: ${data.message}`, time: "Just now", type: data.type },
          ...prev
        ]);
        setHasUnread(true); // Show red dot
        
        // Notification Sound
        new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play().catch(() => {});
      });

      // Fetch Announcements History
      const fetchAnnouncements = async () => {
        try {
          const res = await axiosInstance.get("/api/announcements");
          const history = res.data.announcements.map(a => ({
            message: `${a.title}: ${a.message}`,
            time: new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: a.type
          }));
          setNotifications(history);
        } catch (err) {
          console.log("No notification history found");
        }
      };
      fetchAnnouncements();

      return () => {
        if (socket.current) socket.current.disconnect();
      };
    }
  }, [isAuthenticated]);

  // 2. Scroll Logic
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 3. Close dropdowns on outside click
  useEffect(() => {
    const closeAll = (e) => {
      if (notiRef.current && !notiRef.current.contains(e.target)) setNotiOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", closeAll);
    return () => document.removeEventListener("mousedown", closeAll);
  }, []);

  const isActive = (href) => location.pathname === href;

  const handleNotiToggle = () => {
    setNotiOpen(!notiOpen);
    setProfileOpen(false);
    if (!notiOpen) setHasUnread(false); // Clear dot when opening
  };

  return (
    <>
      {/* ── DESKTOP NAVBAR ─────────────────────────────────────────────────── */}
      <motion.header 
        className="fixed top-8 left-0 right-0 z-[1000] hidden md:flex justify-center px-10 pointer-events-none"
        initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 18, stiffness: 120 }}
      >
        <div className={`
          pointer-events-auto flex items-center justify-between w-full max-w-7xl px-10 py-4
          rounded-[3rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-700
          ${scrolled ? "bg-[#0d111ab3] backdrop-blur-2xl py-3 scale-[0.97]" : "bg-white/[0.03] backdrop-blur-md"}
        `}>
          
          <Link to="/" className="flex items-center gap-4 group">
            <motion.div 
              className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-600 to-purple-600 flex items-center justify-center shadow-xl shadow-primary-500/20"
              whileHover={{ rotate: -10, scale: 1.1 }}
            >
              <IconMsg />
            </motion.div>
            <div className="flex flex-col text-left">
              <span className="text-xl font-black italic tracking-tighter uppercase leading-none text-white">Chatify</span>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary-500">Premium</span>
            </div>
          </Link>

          <nav className="flex items-center gap-2 bg-white/5 p-2 rounded-full border border-white/5">
            <LayoutGroup>
              {NAV_LINKS.map((link) => (
                <Link 
                  key={link.href} to={link.href}
                  className={`relative px-8 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300
                    ${isActive(link.href) ? "text-black" : "text-white/40 hover:text-white"}`}
                >
                  {isActive(link.href) && (
                    <motion.div 
                      layoutId="active-pill"
                      className="absolute inset-0 bg-white rounded-full shadow-lg shadow-white/10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              ))}
            </LayoutGroup>
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 pr-4 border-r border-white/10">
              <button onClick={() => setSearchOpen(true)} className="p-3 rounded-2xl bg-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all active:scale-90">
                <IconSearch />
              </button>
              
              <button onClick={toggleTheme} className="p-3 rounded-2xl bg-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all active:scale-90">
                {theme === "dark" ? <IconSun /> : <IconMoon />}
              </button>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {/* Notification Dropdown */}
                <div className="relative" ref={notiRef}>
                  <button 
                    onClick={handleNotiToggle} 
                    className={`p-3 rounded-2xl transition-all relative ${notiOpen ? "bg-primary-500 text-white" : "bg-white/5 text-white/30 hover:text-white"}`}
                  >
                    <IconBell />
                    {hasUnread && (
                      <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0d111a] animate-pulse" />
                    )}
                  </button>
                  <AnimatePresence>
                    {notiOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="absolute right-0 mt-6 w-96 bg-[#0d111a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl z-[1001]"
                      >
                         <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Broadcasts</span>
                            <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-500 text-[9px] font-black uppercase">{notifications.length} Active</span>
                         </div>
                         <div className="max-h-[400px] overflow-y-auto p-4 space-y-2">
                            {notifications.length > 0 ? (
                               notifications.map((n, i) => (
                                 <div key={i} className={`p-4 rounded-2xl border transition-colors cursor-pointer text-left ${n.type === 'warning' ? 'bg-orange-500/5 border-orange-500/10' : 'bg-white/[0.02] border-white/5'} hover:bg-white/5`}>
                                    <p className="text-sm font-bold text-white/80 leading-snug">{n.message}</p>
                                    <p className="text-[10px] text-white/20 mt-1.5 uppercase font-black">{n.time}</p>
                                 </div>
                               ))
                            ) : (
                               <div className="py-20 text-center space-y-3 opacity-20">
                                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto"><IconBell /></div>
                                  <p className="text-xs font-black uppercase tracking-widest">No announcements</p>
                               </div>
                            )}
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button 
                    onClick={() => {setProfileOpen(!profileOpen); setNotiOpen(false);}} 
                    className="flex items-center gap-3 p-1.5 pr-5 rounded-[1.5rem] bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all active:scale-95 text-white"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg">
                      {user?.name?.[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col items-start">
                       <span className="text-xs font-black uppercase tracking-widest text-white/80">{user?.name?.split(' ')[0]}</span>
                    </div>
                    <IconChevron />
                  </button>
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="absolute right-0 mt-6 w-64 bg-[#0d111a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl z-[1001]"
                      >
                         <div className="p-6 border-b border-white/5 bg-white/[0.02] text-left">
                            <p className="text-[10px] font-black uppercase text-primary-500 tracking-widest mb-1">{user?.role || 'Verified User'}</p>
                            <p className="font-bold text-white truncate text-xs">{user?.email}</p>
                         </div>
                         <div className="p-3 space-y-1">
                            <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-white/5 text-sm font-bold text-white/60 hover:text-white transition-all">
                               <IconUser /> Profile
                            </button>
                            <button onClick={logout} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-red-500/10 text-sm font-bold text-red-400 transition-all">
                               <IconLogout /> Sign Out
                            </button>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Login</Link>
                <Link to="/register" className="btn-glow px-8 py-3 text-[11px] uppercase font-black tracking-widest rounded-full">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </motion.header>

      {/* ── MOBILE TOP BAR ─────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-[1000] md:hidden px-6 py-6 bg-black/60 backdrop-blur-2xl border-b border-white/5 flex justify-between items-center text-white">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg"><IconMsg /></div>
          <span className="text-lg font-black italic tracking-tighter uppercase italic">Chatify</span>
        </Link>
        <div className="flex items-center gap-3">
           <button onClick={() => setSearchOpen(true)} className="p-2.5 rounded-xl bg-white/5 text-white/40 active:scale-90"><IconSearch /></button>
           <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-white/5 text-white/40 active:scale-90">{theme === "dark" ? <IconSun /> : <IconMoon />}</button>
        </div>
      </header>

      {/* ── MOBILE BOTTOM NAVIGATION ────────────────────── */}
      <nav className="fixed bottom-8 left-8 right-8 z-[1000] md:hidden bg-[#0d111ae6] backdrop-blur-2xl border border-white/10 rounded-[3rem] px-4 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex justify-around items-center">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} to={link.href} className={`relative flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive(link.href) ? "text-primary-500" : "text-white/20"}`}>
            {isActive(link.href) && (
                <motion.div layoutId="mob-active" className="absolute -top-4 w-10 h-1 bg-primary-500 rounded-full shadow-[0_0_15px_#0ea5e9]" />
            )}
            <div className={`transition-transform duration-300 ${isActive(link.href) ? "scale-110 -translate-y-1" : ""}`}>{link.icon}</div>
            <span className="text-[9px] font-black uppercase tracking-widest">{link.label}</span>
          </Link>
        ))}
        
        <Link 
            to={isAuthenticated ? "/profile" : "/login"} 
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive("/profile") ? "text-primary-500" : "text-white/20"}`}
        >
          {isAuthenticated ? (
            <div className={`w-6 h-6 rounded-lg bg-primary-500 flex items-center justify-center text-[10px] font-black text-white transition-all ${isActive("/profile") ? "ring-2 ring-primary-500 ring-offset-4 ring-offset-[#0d111a]" : ""}`}>
              {user?.name?.[0]}
            </div>
          ) : (
            <div className="w-5 h-5 flex items-center justify-center"><IconUser /></div>
          )}
          <span className="text-[9px] font-black uppercase tracking-widest">Profile</span>
        </Link>
      </nav>

      {/* Full Modals */}
      <AnimatePresence>
        {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
