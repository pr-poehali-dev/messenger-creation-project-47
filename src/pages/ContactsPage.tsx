import { useState } from "react";
import Icon from "@/components/ui/icon";

const CONTACTS = [
  { id: 1, name: "Мария Иванова", username: "@maria_iv", avatar: "МИ", color: "#a855f7", online: true },
  { id: 2, name: "Дмитрий Ковалёв", username: "@dima_k", avatar: "ДК", color: "#10b981", online: false },
  { id: 3, name: "Анна Смирнова", username: "@anna_sm", avatar: "АС", color: "#ef4444", online: true },
  { id: 4, name: "Иван Петров", username: "@ivan_p", avatar: "ИП", color: "#06b6d4", online: false },
  { id: 5, name: "Светлана Орлова", username: "@sveta_o", avatar: "СО", color: "#f59e0b", online: true },
  { id: 6, name: "Никита Соколов", username: "@nikita_s", avatar: "НС", color: "#8b5cf6", online: false },
  { id: 7, name: "Екатерина Лебедева", username: "@kate_l", avatar: "ЕЛ", color: "#ec4899", online: true },
  { id: 8, name: "Алексей Новиков", username: "@alex_n", avatar: "АН", color: "#14b8a6", online: false },
];

export default function ContactsPage({ onOpenChat }: { onOpenChat: () => void }) {
  const [search, setSearch] = useState("");
  const [added, setAdded] = useState<number[]>([]);

  const filtered = CONTACTS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase())
  );

  const online = filtered.filter((c) => c.online);
  const offline = filtered.filter((c) => !c.online);

  const renderContact = (contact: typeof CONTACTS[0], i: number) => (
    <div
      key={contact.id}
      className="flex items-center gap-3 px-4 py-3 animate-fade-in"
      style={{ borderBottom: "1px solid var(--am-border)", animationDelay: `${i * 0.04}s` }}
    >
      <div className="relative flex-shrink-0">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm"
          style={{ background: contact.color, color: "#fff" }}
        >
          {contact.avatar}
        </div>
        {contact.online && (
          <div
            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
            style={{ background: "var(--am-online)", borderColor: "var(--am-bg)" }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--am-text)" }}>{contact.name}</div>
        <div style={{ fontSize: 12, color: "var(--am-text-muted)" }}>{contact.username}</div>
      </div>
      <div className="flex items-center gap-2">
        {added.includes(contact.id) ? (
          <button
            onClick={onOpenChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95"
            style={{ background: "var(--am-accent)", color: "#fff" }}
          >
            <Icon name="MessageCircle" size={13} />
            Написать
          </button>
        ) : (
          <button
            onClick={() => setAdded((prev) => [...prev, contact.id])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95"
            style={{ background: "var(--am-surface2)", color: "var(--am-accent)", border: "1px solid var(--am-accent)" }}
          >
            <Icon name="UserPlus" size={13} />
            Добавить
          </button>
        )}
      </div>
    </div>
  );

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
            placeholder="Поиск по имени или @username..."
            className="flex-1 outline-none bg-transparent"
            style={{ fontSize: 14, color: "var(--am-text)", fontFamily: "inherit" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ color: "var(--am-text-muted)" }}>
              <Icon name="X" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pb-2 flex gap-3 flex-shrink-0">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: "rgba(45,220,191,0.1)", border: "1px solid rgba(45,220,191,0.2)" }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--am-online)" }} />
          <span style={{ fontSize: 12, color: "var(--am-online)", fontWeight: 500 }}>
            {CONTACTS.filter((c) => c.online).length} онлайн
          </span>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: "var(--am-surface2)", border: "1px solid var(--am-border)" }}
        >
          <Icon name="Users" size={12} style={{ color: "var(--am-text-muted)" }} />
          <span style={{ fontSize: 12, color: "var(--am-text-muted)", fontWeight: 500 }}>
            {CONTACTS.length} контактов
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {online.length > 0 && (
          <>
            <div className="px-4 pt-2 pb-1">
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--am-text-muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                Онлайн
              </span>
            </div>
            {online.map((c, i) => renderContact(c, i))}
          </>
        )}
        {offline.length > 0 && (
          <>
            <div className="px-4 pt-3 pb-1">
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--am-text-muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                Недавно
              </span>
            </div>
            {offline.map((c, i) => renderContact(c, online.length + i))}
          </>
        )}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div style={{ fontSize: 40 }}>👤</div>
            <span style={{ color: "var(--am-text-muted)", fontSize: 14 }}>Контакты не найдены</span>
          </div>
        )}
      </div>
    </div>
  );
}
