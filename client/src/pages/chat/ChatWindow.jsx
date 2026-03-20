import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import CryptoJS from "crypto-js";
import axiosInstance from "@/utils/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";

// --- EMOJI & GIF IMPORTS ---
import EmojiPicker from 'emoji-picker-react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid, SearchBar, SearchContextManager } from '@giphy/react-components';

// Giphy Instance using ENV key
const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_API_KEY);

const ChatWindow = ({ activeChat, user, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  
  // Advanced Features States
  const [replyTo, setReplyTo] = useState(null);
  const [showReactionFor, setShowReactionFor] = useState(null);

  // Encryption States
  const [isSyncEnabled, setIsSyncEnabled] = useState(false); 
  const [syncKey, setSyncKey] = useState(""); 
  const [showKeyField, setShowKeyField] = useState(false);

  // Emoji & GIF States
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);

  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const pickerRef = useRef(null);

  // 🛡️ Screenshot Protection (Ghost Logic)
  useEffect(() => {
    const handleScreenshot = async (e) => {
      if (e.key === "PrintScreen" || (e.ctrlKey && e.key === "p")) {
        socket?.emit("screenshot_detected", { receiverId: activeChat._id, senderName: user.name });
        alert("🛡️ GHOST SECURITY: Screenshot attempt detected and logged.");
      }
    };
    window.addEventListener("keyup", handleScreenshot);
    return () => window.removeEventListener("keyup", handleScreenshot);
  }, [socket, activeChat, user.name]);

  // 🚀 Auto Scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isSyncEnabled]);

  // 🖱️ Click Outside Logic
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
        setShowGifPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔌 Socket Connection
  useEffect(() => {
    const s = io(import.meta.env.VITE_API_URL, { withCredentials: true });
    setSocket(s);
    
    s.on("new_message", (msg) => {
      if (msg.sender === activeChat._id || msg.receiver === activeChat._id) {
        setMessages(p => [...p, msg]);
        setIsTyping(false);
        if (msg.sender === activeChat._id) {
          axiosInstance.post("/chat/mark-as-read", { senderId: activeChat._id });
        }
      }
    });

    s.on("reaction_updated", ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
    });

    s.on("message_updated", ({ messageId, newContent }) => {
      setMessages(p => p.map(m => m._id === messageId ? { ...m, content: newContent, isEdited: true } : m));
    });

    s.on("message_deleted", ({ messageId }) => {
      setMessages(p => p.filter(m => m._id !== messageId));
    });

    s.on("display_typing", ({ senderId }) => {
      if (senderId === activeChat._id) setIsTyping(true);
    });

    s.on("hide_typing", ({ senderId }) => {
      if (senderId === activeChat._id) setIsTyping(false);
    });

    return () => s.close();
  }, [activeChat]);

  // 📑 History Loader
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosInstance.get(`/chat/conversations/${activeChat._id}`);
        setMessages(res.data.data);
        await axiosInstance.post("/chat/mark-as-read", { senderId: activeChat._id });
      } catch (err) { console.error(err); }
    };
    load();
  }, [activeChat]);

  // ✍️ Typing logic
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!socket) return;
    socket.emit("typing", { receiverId: activeChat._id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { receiverId: activeChat._id });
    }, 2000);
  };

  // 📥 Reaction Handler
  const handleReaction = async (messageId, emoji) => {
    try {
      const res = await axiosInstance.post(`/chat/react`, { messageId, emoji });
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions: res.data.reactions } : m));
      socket.emit("send_reaction", { messageId, reactions: res.data.reactions, receiverId: activeChat._id });
      setShowReactionFor(null);
    } catch (err) { console.error(err); }
  };

  const onEmojiClick = (emojiData) => {
    setInput(prev => prev + emojiData.emoji);
  };

  const sendGif = async (gif) => {
    const gifUrl = gif.images.fixed_height.url;
    handleAction(gifUrl, "image");
    setShowGifPicker(false);
  };

  const handleAction = async (directContent = null, type = "text") => {
    const finalContent = directContent || input;
    if (!finalContent.trim()) return;

    if (editingMessage) {
      try {
        await axiosInstance.put("/chat/edit", { messageId: editingMessage._id, newContent: finalContent });
        setMessages(prev => prev.map(m => m._id === editingMessage._id ? { ...m, content: finalContent, isEdited: true } : m));
        setEditingMessage(null);
        setInput("");
      } catch (err) { console.error(err); }
    } else {
      socket.emit("stop_typing", { receiverId: activeChat._id });
      let content = finalContent;
      let isEncrypted = false;
      let hash = null;

      if (isSyncEnabled && syncKey && type === "text") {
        content = CryptoJS.AES.encrypt(finalContent, syncKey).toString();
        isEncrypted = true;
        hash = CryptoJS.SHA256(syncKey).toString();
      }

      try {
        const res = await axiosInstance.post("/chat/send", { 
          receiverId: activeChat._id, 
          content, 
          isEncrypted, 
          encryptionHash: hash,
          messageType: type,
          replyTo: replyTo?._id
        });
        setMessages(p => [...p, res.data.data]);
        if (!directContent) setInput("");
        setReplyTo(null);
        setShowEmojiPicker(false);
      } catch (err) { console.error(err); }
    }
  };

  const handleUnsend = async (id) => {
    try {
      await axiosInstance.delete(`/chat/delete-permanent/${id}`);
      setMessages(prev => prev.filter(m => m._id !== id));
    } catch (err) { console.error(err); }
  };

  const renderContent = (msg) => {
    if (msg.messageType === "image" || msg.content.includes("giphy.com")) {
        return <img src={msg.content} alt="gif" className="rounded-xl w-56 h-auto shadow-lg border border-white/5" />;
    }

    if (!msg.isEncrypted) return msg.content;
    if (!syncKey) return (
      <span className="font-mono text-[11px] opacity-40 break-all select-none uppercase tracking-tighter">
        {msg.content.substring(0, 15)}... (Encrypted Node)
      </span>
    );

    try {
      const bytes = CryptoJS.AES.decrypt(msg.content, syncKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted || <span className="text-red-400">Invalid Key</span>;
    } catch (e) {
      return <span className="text-red-400 italic text-[11px]">Cipher Error</span>;
    }
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-[#080b14]">
      {/* HEADER */}
      <header className="h-16 px-4 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white/40 active:scale-90">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}
          <div className="w-11 h-11 rounded-2xl bg-primary-600 flex items-center justify-center font-black text-sm shadow-lg border border-white/10 uppercase">
            {activeChat.name[0]}
          </div>
          <div>
            <p className="text-[14px] font-black uppercase tracking-wider text-white">{activeChat.name}</p>
            <div className="flex items-center gap-1.5">
               <div className={`h-[3px] w-10 rounded-full transition-all duration-500 ${isSyncEnabled ? 'bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse' : 'bg-yellow-500'}`} />
               <p className="text-[9px] font-bold uppercase opacity-50 tracking-widest">{isSyncEnabled ? "Ghost Mode" : "Standard"}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setShowEmojiPicker(false); setShowGifPicker(!showGifPicker); }} 
            className={`p-2.5 rounded-xl transition-all border ${showGifPicker ? 'bg-primary-600 border-white/20 text-white' : 'bg-white/5 border-white/5 text-white/20 hover:text-white/40'}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </button>

          <label className="relative inline-flex items-center cursor-pointer scale-90">
            <input type="checkbox" checked={isSyncEnabled} onChange={() => { setIsSyncEnabled(!isSyncEnabled); if(!isSyncEnabled) setShowKeyField(true); }} className="sr-only peer" />
            <div className="w-12 h-6 bg-white/5 rounded-full peer peer-checked:bg-primary-600 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/40 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
          </label>
        </div>
      </header>

      {/* MESSAGES AREA */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-[url('/grid.svg')] bg-fixed">
        {messages.map((m, i) => {
          const senderId = typeof m.sender === 'object' ? m.sender._id : m.sender;
          const isMe = user?._id && senderId.toString() === user._id.toString();

          return (
            <div key={i} className={`flex w-full ${isMe ? "justify-end" : "justify-start"} group relative`}>
              <div className="flex flex-col max-w-[82%] relative">
                
                {/* Reply Context */}
                {m.replyTo && (
                  <div className="bg-white/5 p-2 px-3 rounded-t-xl border-l-4 border-primary-500 mb-[-10px] text-[11px] opacity-60 truncate">
                    {typeof m.replyTo === 'object' ? m.replyTo.content.substring(0, 30) : "Reply Logic"}
                  </div>
                )}

                {/* Desktop Action Toolbar */}
                <div className={`absolute -top-7 ${isMe ? 'right-0' : 'left-0'} hidden group-hover:flex gap-2 bg-black/90 p-1.5 px-3 rounded-lg border border-white/10 z-30 shadow-2xl scale-95 backdrop-blur-md`}>
                   <button onClick={() => setReplyTo(m)} className="text-[10px] font-black text-primary-400 uppercase">Reply</button>
                   <button onClick={() => setShowReactionFor(m._id)} className="text-[10px] font-black text-emerald-400 uppercase">React</button>
                   {isMe && <button onClick={() => handleUnsend(m._id)} className="text-[10px] font-black text-red-500 uppercase">Unsend</button>}
                </div>

                {/* Message Bubble */}
                <div className={`p-3.5 px-5 rounded-[1.25rem] text-[13.5px] font-medium leading-relaxed transition-all shadow-md ${
                  isMe ? "bg-primary-600 rounded-br-none text-white shadow-primary-900/10" : "bg-white/5 border border-white/5 backdrop-blur-md rounded-bl-none text-white/90"
                }`}>
                  <div className={m.isEncrypted && !syncKey ? "opacity-50" : "opacity-100"}>
                    {renderContent(m)}
                  </div>
                  
                  <div className="text-[8px] mt-2 opacity-30 text-right flex justify-end gap-1.5 font-black uppercase tracking-tighter">
                    {m.isEdited && <span className="italic">(edited)</span>}
                    {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                    {isMe && (m.status === 'read' ? '✓✓' : '✓')}
                  </div>
                </div>

                {/* Reactions UI */}
                {m.reactions?.length > 0 && (
                  <div className={`flex gap-1 mt-[-8px] z-10 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {m.reactions.map((r, idx) => (
                      <span key={idx} className="bg-black/80 border border-white/10 rounded-full px-2 py-0.5 text-[10px] shadow-lg">{r.emoji}</span>
                    ))}
                  </div>
                )}

                {/* Reaction Picker Overlay */}
                <AnimatePresence>
                  {showReactionFor === m._id && (
                    <motion.div initial={{opacity:0, scale:0.5}} animate={{opacity:1, scale:1}} className="absolute top-0 left-0 z-50 flex gap-2 bg-[#1a1f2e] p-2 rounded-2xl shadow-2xl border border-white/10">
                      {["❤️", "👍", "😂", "😮", "🔥"].map(emoji => (
                        <button key={emoji} onClick={() => handleReaction(m._id, emoji)} className="text-xl hover:scale-125 transition-all">{emoji}</button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/5 p-2.5 px-5 rounded-full flex gap-1.5 border border-white/5 shadow-inner">
              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      {/* PICKER OVERLAY */}
      <AnimatePresence>
        {(showEmojiPicker || showGifPicker) && (
          <motion.div 
            ref={pickerRef}
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
            className="absolute bottom-28 left-4 right-4 z-50 bg-[#0d111e] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl h-[400px] backdrop-blur-3xl"
          >
            {showEmojiPicker && (
              <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" width="100%" height="100%" searchPlaceHolder="Scan for signal..." skinTonesDisabled={true} />
            )}
            {showGifPicker && (
              <div className="h-full flex flex-col p-5 bg-[#0d111e]">
                <SearchContextManager apiKey={import.meta.env.VITE_GIPHY_API_KEY}>
                  <SearchBar className="giphy-search-bar !bg-white/5 !border-white/10 !rounded-2xl !text-[12px] !p-4" />
                  <div className="flex-1 overflow-y-auto mt-5 custom-scrollbar">
                     <Grid onGifClick={sendGif} fetchGifs={(offset) => gf.trending({ offset, limit: 12 })} width={350} columns={2} gutter={12} />
                  </div>
                </SearchContextManager>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="p-5 bg-black/40 border-t border-white/5 backdrop-blur-2xl">
        <AnimatePresence>
          {replyTo && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-white/5 p-3 rounded-2xl border-l-4 border-primary-500 mb-4 flex justify-between items-center">
              <div className="truncate pr-4 text-left">
                <p className="text-[10px] font-black uppercase text-primary-500">Replying to message</p>
                <p className="text-[12px] text-white/40 truncate italic">{replyTo.content}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-white/20 hover:text-white">✕</button>
            </motion.div>
          )}

          {(isSyncEnabled || showKeyField) && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-4 overflow-hidden">
              <div className="flex gap-2 bg-primary-600/10 p-2 rounded-2xl border border-primary-500/20 shadow-inner">
                <input 
                  type="password"
                  value={syncKey}
                  onChange={(e) => setSyncKey(e.target.value)}
                  placeholder="ENCRYPTION KEY (AES-256)"
                  className="flex-1 bg-transparent text-[11px] px-4 outline-none text-primary-300 placeholder:text-primary-800 font-black uppercase tracking-widest"
                />
                <button onClick={() => setShowKeyField(false)} className="px-5 py-2 bg-primary-600 rounded-xl text-[10px] font-black uppercase shadow-lg">SET</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-4 bg-white/5 p-2 rounded-[1.5rem] border border-white/10 focus-within:border-primary-500/30 transition-all shadow-inner items-center">
          <button 
            onClick={() => { setShowGifPicker(false); setShowEmojiPicker(!showEmojiPicker); }}
            className={`p-3 rounded-2xl transition-all ${showEmojiPicker ? 'bg-primary-600 text-white shadow-lg' : 'bg-white/5 text-white/30 hover:text-white/60'}`}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/></svg>
          </button>

          <input 
            value={input} 
            onChange={handleInputChange} 
            onKeyDown={e => e.key === "Enter" && handleAction()} 
            placeholder={isSyncEnabled ? "Broadcast secure signal..." : "Type handshake..."} 
            className="flex-1 bg-transparent border-none outline-none px-1 text-[14px] font-medium text-white placeholder:text-white/10" 
          />
          
          <button 
            onClick={() => handleAction()} 
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-90 ${isSyncEnabled ? 'bg-emerald-600 shadow-emerald-900/20' : 'bg-primary-600 shadow-primary-900/20'}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" /></svg>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ChatWindow;