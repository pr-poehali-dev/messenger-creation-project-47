import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { msgApi } from "@/lib/api";

interface ChatItem {
  id: number;
  type: string;
  name: string;
  avatar_color: string;
  last_msg: string;
  last_time: string | null;
  unread: number;
  other_id: number | null;
  other_status: string;
  other_system: boolean;
  other_premium: boolean;
}

interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_color: string;
  is_system: boolean;
  is_premium: boolean;
  text: string;
  created_at: string;
  is_mine: boolean;
}

function fmtTime(ts: string | null) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) return d.toLocaleDateString("ru", { weekday: "short" });
  return d.toLocaleDateString("ru", { day: "numeric", month: "short" });
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function ChatsPage({ currentUserId }: { currentUserId: number }) {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [openChat, setOpenChat] = useState<ChatItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const lastMsgId = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);

  const loadChats = useCallback(async () => {
    const res = await msgApi.getChats();
    if (res.chats) setChats(res.chats);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadChats();
    const iv = setInterval(loadChats, 5000);
    return () => clearInterval(iv);
  }, [loadChats]);

  const loadMessages = useCallback(async (chatId: number, append = false) => {
    const res = await msgApi.getMessages(chatId, append ? lastMsgId.current : 0);
    if (res.messages) {
      if (append && res.messages.length > 0) {
        setMessages((prev) => [...prev, ...res.messages]);
        lastMsgId.current = res.messages[res.messages.length - 1].id;
      } else if (!append) {
        setMessages(res.messages);
        if (res.messages.length > 0) lastMsgId.current = res.messages[res.messages.length - 1].id;
        else lastMsgId.current = 0;
      }
    }
  }, []);

  useEffect(() => {
    if (!openChat) { if (pollRef.current) clearInterval(pollRef.current); return; }
    loadMessages(openChat.id, false);
    pollRef.current = setInterval(() => loadMessages(openChat.id, true), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [openChat, loadMessages]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMsg = async () => {
    if (!input.trim() || !openChat) return;
    const text = input.trim();
    setInput("");
    const res = await msgApi.send(openChat.id, text);
    if (res.ok) {
      await loadMessages(openChat.id, false);
      loadChats();
    }
  };

  const openChatView = (chat: ChatItem) => {
    setOpenChat(chat);
    setMessages([]);
    lastMsgId.current = 0;
    setChats((prev) => prev.map((c) => c.id === chat.id ? { ...c, unread: 0 } : c));
  };

  // suppress unused warning
  void currentUserId;

  const filtered = chats.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  if (openChat) {
    return (
      <div className="flex flex-col h-full animate-fade-in">
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0 am-glass" style={{ borderBottom: "1px solid var(--am-border)" }}>
          <button onClick={() => { setOpenChat(null); loadChats(); }} style={{ color: "var(--am-accent)" }}>
            <Icon name="ChevronLeft" size={22} />
          </button>
          <div className="relative">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: openChat.avatar_color, color: "#fff" }}>
              {initials(openChat.name)}
            </div>
            {openChat.other_status === "online" && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2" style={{ background: "var(--am-online)", borderColor: "var(--am-bg)" }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span style={{ fontWeight: 600, fontSize: 15, color: "var(--am-text)" }}>{openChat.name}</span>
              {openChat.other_system && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ background: "rgba(45,140,240,0.15)", border: "1px solid rgba(45,140,240,0.3)" }}>
                  <Icon name="ShieldCheck" size={11} style={{ color: "var(--am-accent)" }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: "var(--am-accent)" }}>СИС</span>
                </div>
              )}
              {openChat.other_premium && !openChat.other_system && <span style={{ fontSize: 12 }}>⭐</span>}
            </div>
            <span style={{ fontSize: 11, color: openChat.other_status === "online" ? "var(--am-online)" : "var(--am-text-muted)" }}>
              {openChat.other_status === "online" ? "онлайн" : "был(а) недавно"}
            </span>
          </div>
          <button style={{ color: "var(--am-text-muted)" }}><Icon name="Phone" size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
              <span style={{ fontSize: 36 }}>💬</span>
              <span style={{ fontSize: 13, color: "var(--am-text-muted)" }}>Начните диалог</span>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={msg.id} className="flex animate-fade-in" style={{ justifyContent: msg.is_mine ? "flex-end" : "flex-start", animationDelay: `${Math.min(i * 0.02, 0.3)}s` }}>
              {!msg.is_mine && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0 mt-auto" style={{ background: msg.sender_color, color: "#fff" }}>
                  {initials(msg.sender_name)}
                </div>
              )}
              <div className={msg.is_mine ? "am-bubble-out" : "am-bubble-in"} style={{ padding: "9px 13px", maxWidth: "76%" }}>
                {msg.is_system && (
                  <div className="flex items-center gap-1 mb-1">
                    <Icon name="ShieldCheck" size={11} style={{ color: "var(--am-accent)" }} />
                    <span style={{ fontSize: 10, color: "var(--am-accent)", fontWeight: 600 }}>Системный</span>
                  </div>
                )}
                <p style={{ fontSize: 14, color: "#fff", lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.text}</p>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", textAlign: "right", marginTop: 3 }}>
                  {fmtTime(msg.created_at)}
                  {msg.is_mine && <span className="ml-1">✓</span>}
                </div>
              </div>
            </div>
          ))}
          <div ref={msgEndRef} />
        </div>

        <div className="am-glass flex items-end gap-2 px-3 py-3 flex-shrink-0" style={{ borderTop: "1px solid var(--am-border)" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
            placeholder="Сообщение..."
            rows={1}
            className="flex-1 resize-none outline-none scrollbar-hide"
            style={{ background: "var(--am-surface2)", border: "1px solid var(--am-border)", borderRadius: 16, padding: "10px 14px", color: "var(--am-text)", fontSize: 14, fontFamily: "inherit", maxHeight: 120 }}
          />
          <button onClick={sendMsg} disabled={!input.trim()} className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            style={{ background: input.trim() ? "var(--am-accent)" : "var(--am-surface2)", color: input.trim() ? "#fff" : "var(--am-text-dim)" }}>
            <Icon name="Send" size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl" style={{ background: "var(--am-surface2)", border: "1px solid var(--am-border)" }}>
          <Icon name="Search" size={16} style={{ color: "var(--am-text-muted)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск чатов..." className="flex-1 outline-none bg-transparent" style={{ fontSize: 14, color: "var(--am-text)", fontFamily: "inherit" }} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading && [1,2,3,4].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="w-12 h-12 rounded-full am-shimmer flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-3 rounded-full am-shimmer w-2/3" />
              <div className="h-2.5 rounded-full am-shimmer w-full" />
            </div>
          </div>
        ))}
        {!loading && filtered.map((chat, i) => (
          <button key={chat.id} onClick={() => openChatView(chat)} className="w-full flex items-center gap-3 px-4 py-3 transition-colors animate-fade-in active:bg-white/5" style={{ borderBottom: "1px solid var(--am-border)", animationDelay: `${i * 0.04}s` }}>
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold" style={{ background: chat.avatar_color, color: "#fff", fontSize: chat.type === "group" ? 20 : 15 }}>
                {chat.type === "group" ? "💬" : initials(chat.name)}
              </div>
              {chat.other_status === "online" && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2" style={{ background: "var(--am-online)", borderColor: "var(--am-bg)" }} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  <span style={{ fontWeight: 600, fontSize: 15, color: "var(--am-text)" }}>{chat.name}</span>
                  {chat.other_system && <Icon name="ShieldCheck" size={13} style={{ color: "var(--am-accent)" }} />}
                  {chat.other_premium && !chat.other_system && <span style={{ fontSize: 11 }}>⭐</span>}
                </div>
                <span style={{ fontSize: 11, color: "var(--am-text-muted)" }}>{fmtTime(chat.last_time)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="truncate" style={{ fontSize: 13, color: "var(--am-text-muted)", maxWidth: "85%" }}>{chat.last_msg || "Нет сообщений"}</span>
                {chat.unread > 0 && <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--am-accent)", fontSize: 10, fontWeight: 700, color: "#fff" }}>{chat.unread}</div>}
              </div>
            </div>
          </button>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div style={{ fontSize: 40 }}>💬</div>
            <span style={{ color: "var(--am-text-muted)", fontSize: 14 }}>Чатов пока нет</span>
            <span style={{ color: "var(--am-text-dim)", fontSize: 12 }}>Найдите пользователей в разделе Контакты</span>
          </div>
        )}
      </div>
    </div>
  );
}
