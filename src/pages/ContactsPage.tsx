import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { authApi, msgApi } from "@/lib/api";

interface User {
  id: number;
  display_name: string;
  username: string | null;
  avatar_color: string;
  is_premium: boolean;
  is_system: boolean;
  phone: string | null;
  status: string;
}

export default function ContactsPage({ onOpenChat }: { onOpenChat: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await authApi.searchUsers(search || undefined);
      if (res.users) setUsers(res.users);
      setLoading(false);
    };
    load();
  }, [search]);

  const startChat = async (userId: number) => {
    setCreating(userId);
    const res = await msgApi.createChat(userId);
    setCreating(null);
    if (res.ok) onOpenChat();
  };

  const online = users.filter((u) => u.status === "online");
  const offline = users.filter((u) => u.status !== "online");

  const renderUser = (u: User, i: number) => (
    <div key={u.id} className="flex items-center gap-3 px-4 py-3 animate-fade-in" style={{ borderBottom: "1px solid var(--am-border)", animationDelay: `${i * 0.04}s` }}>
      <div className="relative flex-shrink-0">
        <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: u.avatar_color, color: "#fff" }}>
          {u.display_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
        </div>
        {u.status === "online" && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2" style={{ background: "var(--am-online)", borderColor: "var(--am-bg)" }} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--am-text)" }}>{u.display_name}</span>
          {u.is_system && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ background: "rgba(45,140,240,0.15)", border: "1px solid rgba(45,140,240,0.3)" }}>
              <Icon name="ShieldCheck" size={10} style={{ color: "var(--am-accent)" }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--am-accent)" }}>СИС</span>
            </div>
          )}
          {u.is_premium && !u.is_system && <span style={{ fontSize: 11 }}>⭐</span>}
        </div>
        <div style={{ fontSize: 12, color: "var(--am-text-muted)" }}>
          {u.username || (u.is_system ? "+88845013" : u.phone || "")}
        </div>
      </div>
      <button
        onClick={() => startChat(u.id)}
        disabled={creating === u.id}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 flex-shrink-0"
        style={{ background: "var(--am-accent)", color: "#fff", opacity: creating === u.id ? 0.6 : 1 }}
      >
        <Icon name="MessageCircle" size={13} />
        {creating === u.id ? "..." : "Написать"}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl" style={{ background: "var(--am-surface2)", border: "1px solid var(--am-border)" }}>
          <Icon name="Search" size={16} style={{ color: "var(--am-text-muted)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по имени или @username..." className="flex-1 outline-none bg-transparent" style={{ fontSize: 14, color: "var(--am-text)", fontFamily: "inherit" }} />
          {search && <button onClick={() => setSearch("")} style={{ color: "var(--am-text-muted)" }}><Icon name="X" size={14} /></button>}
        </div>
      </div>

      <div className="px-4 pb-2 flex gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: "rgba(45,220,191,0.1)", border: "1px solid rgba(45,220,191,0.2)" }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--am-online)" }} />
          <span style={{ fontSize: 12, color: "var(--am-online)", fontWeight: 500 }}>{online.length} онлайн</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: "var(--am-surface2)", border: "1px solid var(--am-border)" }}>
          <Icon name="Users" size={12} style={{ color: "var(--am-text-muted)" }} />
          <span style={{ fontSize: 12, color: "var(--am-text-muted)", fontWeight: 500 }}>{users.length} пользователей</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading && [1,2,3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="w-11 h-11 rounded-full am-shimmer flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-3 rounded-full am-shimmer w-1/2" />
              <div className="h-2.5 rounded-full am-shimmer w-1/3" />
            </div>
          </div>
        ))}
        {!loading && online.length > 0 && (
          <>
            <div className="px-4 pt-2 pb-1"><span style={{ fontSize: 11, fontWeight: 600, color: "var(--am-text-muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Онлайн</span></div>
            {online.map((u, i) => renderUser(u, i))}
          </>
        )}
        {!loading && offline.length > 0 && (
          <>
            <div className="px-4 pt-3 pb-1"><span style={{ fontSize: 11, fontWeight: 600, color: "var(--am-text-muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Недавно</span></div>
            {offline.map((u, i) => renderUser(u, online.length + i))}
          </>
        )}
        {!loading && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div style={{ fontSize: 40 }}>👤</div>
            <span style={{ color: "var(--am-text-muted)", fontSize: 14 }}>Пользователи не найдены</span>
          </div>
        )}
      </div>
    </div>
  );
}
