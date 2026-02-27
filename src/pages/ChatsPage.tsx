import { useState } from "react";
import Icon from "@/components/ui/icon";
import type { UserProfile } from "@/App";

interface Message {
  id: number;
  text: string;
  from: "me" | "them";
  time: string;
}

interface Chat {
  id: number;
  name: string;
  avatar: string;
  avatarColor: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
  messages: Message[];
}

const INITIAL_CHATS: Chat[] = [
  {
    id: 1,
    name: "Мария Иванова",
    avatar: "МИ",
    avatarColor: "#a855f7",
    lastMsg: "Окей, увидимся завтра 👋",
    time: "14:32",
    unread: 2,
    online: true,
    messages: [
      { id: 1, text: "Привет! Как дела?", from: "them", time: "14:28" },
      { id: 2, text: "Всё отлично, спасибо! Ты как?", from: "me", time: "14:29" },
      { id: 3, text: "Тоже хорошо! Встретимся завтра?", from: "them", time: "14:31" },
      { id: 4, text: "Конечно, во сколько?", from: "me", time: "14:31" },
      { id: 5, text: "Окей, увидимся завтра 👋", from: "them", time: "14:32" },
    ],
  },
  {
    id: 2,
    name: "Дмитрий Ковалёв",
    avatar: "ДК",
    avatarColor: "#10b981",
    lastMsg: "Отправил файлы на почту",
    time: "12:15",
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: "Дим, ты отправил материалы?", from: "me", time: "12:10" },
      { id: 2, text: "Да, секунду", from: "them", time: "12:12" },
      { id: 3, text: "Отправил файлы на почту", from: "them", time: "12:15" },
    ],
  },
  {
    id: 3,
    name: "Команда AstreyDev",
    avatar: "🚀",
    avatarColor: "#f59e0b",
    lastMsg: "Деплой прошёл успешно!",
    time: "вчера",
    unread: 5,
    online: true,
    messages: [
      { id: 1, text: "Запускаем деплой на прод!", from: "them", time: "вчера" },
      { id: 2, text: "Держим кулаки 🤞", from: "me", time: "вчера" },
      { id: 3, text: "Деплой прошёл успешно!", from: "them", time: "вчера" },
    ],
  },
  {
    id: 4,
    name: "Анна Смирнова",
    avatar: "АС",
    avatarColor: "#ef4444",
    lastMsg: "Спасибо за помощь ❤️",
    time: "вчера",
    unread: 0,
    online: true,
    messages: [
      { id: 1, text: "Можешь помочь с задачей?", from: "them", time: "вчера" },
      { id: 2, text: "Конечно, что нужно?", from: "me", time: "вчера" },
      { id: 3, text: "Спасибо за помощь ❤️", from: "them", time: "вчера" },
    ],
  },
  {
    id: 5,
    name: "Иван Петров",
    avatar: "ИП",
    avatarColor: "#06b6d4",
    lastMsg: "Хорошо, пока!",
    time: "Пн",
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: "Привет, есть минута?", from: "them", time: "Пн" },
      { id: 2, text: "Да, слушаю", from: "me", time: "Пн" },
      { id: 3, text: "Хорошо, пока!", from: "them", time: "Пн" },
    ],
  },
];

function formatTime() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
}

export default function ChatsPage({ profile }: { profile: UserProfile }) {
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [openChat, setOpenChat] = useState<Chat | null>(null);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");

  const filtered = chats.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const sendMessage = () => {
    if (!input.trim() || !openChat) return;
    const newMsg: Message = { id: Date.now(), text: input.trim(), from: "me", time: formatTime() };
    setChats((prev) =>
      prev.map((c) =>
        c.id === openChat.id
          ? { ...c, messages: [...c.messages, newMsg], lastMsg: input.trim(), time: formatTime(), unread: 0 }
          : c
      )
    );
    setOpenChat((prev) => prev ? { ...prev, messages: [...prev.messages, newMsg], lastMsg: input.trim() } : null);
    setInput("");

    // simulate reply
    setTimeout(() => {
      const replies = ["👍", "Понял, спасибо!", "Окей!", "Отлично!", "Хорошо, договорились!", "😊"];
      const reply: Message = {
        id: Date.now() + 1,
        text: replies[Math.floor(Math.random() * replies.length)],
        from: "them",
        time: formatTime(),
      };
      setChats((prev) =>
        prev.map((c) =>
          c.id === openChat.id
            ? { ...c, messages: [...c.messages, newMsg, reply], lastMsg: reply.text, time: formatTime() }
            : c
        )
      );
      setOpenChat((prev) => prev ? { ...prev, messages: [...prev.messages, newMsg, reply] } : null);
    }, 1000 + Math.random() * 1000);
  };

  const openChatView = (chat: Chat) => {
    setChats((prev) => prev.map((c) => c.id === chat.id ? { ...c, unread: 0 } : c));
    setOpenChat({ ...chat, unread: 0 });
  };

  if (openChat) {
    return (
      <div className="flex flex-col h-full animate-fade-in">
        {/* Chat header */}
        <div
          className="am-glass flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--am-border)" }}
        >
          <button
            onClick={() => setOpenChat(null)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--am-accent)" }}
          >
            <Icon name="ChevronLeft" size={22} />
          </button>
          <div className="relative">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: openChat.avatarColor, color: "#fff" }}
            >
              {openChat.avatar}
            </div>
            {openChat.online && (
              <div
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                style={{ background: "var(--am-online)", borderColor: "var(--am-bg)" }}
              />
            )}
          </div>
          <div className="flex-1">
            <div style={{ fontWeight: 600, fontSize: 15, color: "var(--am-text)" }}>{openChat.name}</div>
            <div style={{ fontSize: 12, color: openChat.online ? "var(--am-online)" : "var(--am-text-muted)" }}>
              {openChat.online ? "онлайн" : "был(а) давно"}
            </div>
          </div>
          <button className="p-1.5" style={{ color: "var(--am-text-muted)" }}>
            <Icon name="Phone" size={20} />
          </button>
          <button className="p-1.5" style={{ color: "var(--am-text-muted)" }}>
            <Icon name="Video" size={20} />
          </button>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4"
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
          {openChat.messages.map((msg, i) => (
            <div
              key={msg.id}
              className="flex animate-fade-in"
              style={{
                justifyContent: msg.from === "me" ? "flex-end" : "flex-start",
                animationDelay: `${i * 0.03}s`,
              }}
            >
              <div
                className={msg.from === "me" ? "am-bubble-out" : "am-bubble-in"}
                style={{
                  padding: "10px 14px",
                  maxWidth: "78%",
                  position: "relative",
                }}
              >
                <p style={{ fontSize: 14, color: "#fff", lineHeight: 1.45, marginBottom: 4 }}>{msg.text}</p>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textAlign: "right" }}>{msg.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div
          className="am-glass flex items-end gap-2 px-3 py-3 flex-shrink-0"
          style={{ borderTop: "1px solid var(--am-border)" }}
        >
          <button className="p-2 flex-shrink-0" style={{ color: "var(--am-text-muted)" }}>
            <Icon name="Paperclip" size={20} />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Сообщение..."
            rows={1}
            className="flex-1 resize-none outline-none scrollbar-hide"
            style={{
              background: "var(--am-surface2)",
              border: "1px solid var(--am-border)",
              borderRadius: 14,
              padding: "10px 14px",
              color: "var(--am-text)",
              fontSize: 14,
              lineHeight: 1.4,
              fontFamily: "inherit",
              maxHeight: 120,
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
            style={{
              background: input.trim() ? "var(--am-accent)" : "var(--am-surface2)",
              color: input.trim() ? "#fff" : "var(--am-text-dim)",
            }}
          >
            <Icon name="Send" size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
          style={{ background: "var(--am-surface2)", border: "1px solid var(--am-border)" }}
        >
          <Icon name="Search" size={16} style={{ color: "var(--am-text-muted)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск чатов..."
            className="flex-1 outline-none bg-transparent"
            style={{ fontSize: 14, color: "var(--am-text)" }}
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {filtered.map((chat, i) => (
          <button
            key={chat.id}
            onClick={() => openChatView(chat)}
            className="w-full flex items-center gap-3 px-4 py-3 transition-colors animate-fade-in active:bg-white/5"
            style={{
              borderBottom: "1px solid var(--am-border)",
              animationDelay: `${i * 0.05}s`,
            }}
          >
            <div className="relative flex-shrink-0">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
                style={{ background: chat.avatarColor, color: "#fff", fontSize: 16 }}
              >
                {chat.avatar}
              </div>
              {chat.online && (
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                  style={{ background: "var(--am-online)", borderColor: "var(--am-bg)" }}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span style={{ fontWeight: 600, fontSize: 15, color: "var(--am-text)" }}>{chat.name}</span>
                <span style={{ fontSize: 11, color: "var(--am-text-muted)" }}>{chat.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className="truncate"
                  style={{ fontSize: 13, color: "var(--am-text-muted)", maxWidth: "80%" }}
                >
                  {chat.lastMsg}
                </span>
                {chat.unread > 0 && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--am-accent)", fontSize: 10, fontWeight: 700, color: "#fff" }}
                  >
                    {chat.unread}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div style={{ fontSize: 40 }}>💬</div>
            <span style={{ color: "var(--am-text-muted)", fontSize: 14 }}>Чаты не найдены</span>
          </div>
        )}
      </div>
    </div>
  );
}
