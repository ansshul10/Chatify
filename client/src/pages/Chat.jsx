import { useState, useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext";
import axiosInstance from "@/utils/axiosInstance";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatSidebar from "./chat/ChatSidebar";
import ChatWindow from "./chat/ChatWindow";
import { motion, AnimatePresence } from "framer-motion";

const ChatPage = () => {
  const { user } = useAuthContext();
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosInstance.get("/admin/users");
        setContacts(res.data.users || res.data.data || []);
      } catch (err) { console.error(err); }
    };
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-[#06080e] text-white flex flex-col relative overflow-hidden">
      {!isMobile && <Navbar />}

      {/* Premium Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

      <main className={`flex-1 w-full max-w-6xl mx-auto z-10 flex flex-col justify-center 
        ${isMobile ? "pt-0 h-screen" : "pt-32 pb-10 px-4"}`}>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full flex bg-[#0d111e]/40 border-white/5 overflow-hidden relative shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]
            ${isMobile ? "h-screen" : "h-[600px] backdrop-blur-3xl rounded-[2rem] border"}`}
        >
          {/* SIDEBAR */}
          <div className={`${isMobile && !isSidebarOpen ? "hidden" : "block"} w-full md:w-[300px] h-full border-r border-white/5 bg-black/20`}>
            <ChatSidebar 
              contacts={contacts} 
              activeChat={activeChat} 
              onSelect={(u) => {
                setActiveChat(u);
                if (isMobile) setIsSidebarOpen(false);
              }} 
            />
          </div>

          {/* CHAT AREA / EMPTY STATE */}
          <div className={`${isMobile && isSidebarOpen ? "hidden" : "flex"} flex-1 flex-col h-full bg-black/5`}>
            <AnimatePresence mode="wait">
              {activeChat ? (
                <motion.div 
                  key="chat"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  <ChatWindow 
                    activeChat={activeChat} 
                    user={user} 
                    onBack={() => setIsSidebarOpen(true)} 
                  />
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center p-8 relative"
                >
                  {/* Dashboard / Warning Screen */}
                  <div className="max-w-md w-full space-y-8">
                    {/* Security Badge */}
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-2xl animate-pulse" />
                        <div className="relative w-20 h-20 bg-black/40 border border-white/10 rounded-3xl flex items-center justify-center text-4xl shadow-2xl">
                          🛡️
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-black uppercase tracking-[0.3em] gradient-text">Secure Sync</h3>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">End-to-End Encrypted Node</p>
                      </div>
                    </div>

                    {/* Warning & Info Panels */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2 text-yellow-500">
                          <span className="text-xs">⚠️</span>
                          <span className="text-[10px] font-black uppercase tracking-tight">System Warning</span>
                        </div>
                        <p className="text-[11px] text-white/50 leading-relaxed font-medium">
                          Do not share your <span className="text-primary-400">Sync Key</span> with anyone. 
                          Ghost mode messages cannot be recovered without the original cipher key.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                          <span className="text-lg mb-1">🔐</span>
                          <span className="text-[10px] font-black uppercase text-white/40">AES-256</span>
                          <span className="text-[9px] text-primary-500 font-bold uppercase">Active</span>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                          <span className="text-lg mb-1">🛰️</span>
                          <span className="text-[10px] font-black uppercase text-white/40">Relay</span>
                          <span className="text-[9px] text-emerald-500 font-bold uppercase">Online</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Instruction */}
                    <p className="text-center text-[9px] text-white/20 font-black uppercase tracking-[0.2em] animate-bounce">
                      Select a contact to initialize handshake
                    </p>
                  </div>

                  {/* Aesthetic Corner Accents */}
                  <div className="absolute top-6 right-6 w-2 h-2 border-t-2 border-r-2 border-white/10" />
                  <div className="absolute bottom-6 left-6 w-2 h-2 border-b-2 border-l-2 border-white/10" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      {!isMobile && <div className="mt-auto"><Footer /></div>}
    </div>
  );
};

export default ChatPage;