import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ChatSidebar = ({ contacts, activeChat, onSelect }) => {
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const navigate = useNavigate();

  const filtered = contacts.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                         u.username.toLowerCase().includes(search.toLowerCase());
    const matchesGender = genderFilter === "all" || u.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  return (
    <div className="flex flex-col h-full bg-[#0d111e]/40 backdrop-blur-xl">
      {/* ── HEADER SECTION ── */}
      <div className="p-4 border-b border-white/5 space-y-3 bg-black/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/")} className="md:hidden p-1.5 rounded-lg bg-white/5 text-white/50"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>
            <h2 className="text-xs font-black tracking-[0.2em] text-primary-500 uppercase">Nodes</h2>
          </div>
          <span className="text-[8px] font-black bg-primary-500/10 text-primary-500 px-2 py-0.5 rounded border border-primary-500/20">{filtered.length} ACTIVE</span>
        </div>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter search..." className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-[10px] outline-none focus:border-primary-500 placeholder:text-white/10" />
        <div className="flex bg-white/5 p-0.5 rounded-lg gap-0.5 border border-white/5">
          {["all", "male", "female"].map((g) => (
            <button key={g} onClick={() => setGenderFilter(g)} className={`flex-1 text-[8px] font-black uppercase py-1.5 rounded-md transition-all ${genderFilter === g ? "bg-primary-600 text-white" : "text-white/30"}`}>{g}</button>
          ))}
        </div>
      </div>

      {/* ── CONTACTS LIST ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
        {filtered.map((u) => (
          <div key={u._id} onClick={() => onSelect(u)} className={`p-2.5 rounded-xl cursor-pointer flex items-center gap-3 border ${activeChat?._id === u._id ? "bg-primary-600/10 border-primary-500/30" : "border-transparent hover:bg-white/5"}`}>
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center font-black text-[10px] border border-white/10 overflow-hidden uppercase">{u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" alt="" /> : u.name[0]}</div>
              {u.isOnline && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-[#0d111e] rounded-full animate-pulse" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[11px] truncate text-white/90 uppercase">{u.name}</p>
              <p className="text-[9px] text-white/20 truncate">@{u.username}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatSidebar;