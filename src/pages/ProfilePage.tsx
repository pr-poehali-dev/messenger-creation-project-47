import { useState } from "react";
import Icon from "@/components/ui/icon";
import type { UserProfile } from "@/App";

const AVATAR_COLORS = ["#2d8cf0", "#a855f7", "#10b981", "#ef4444", "#f59e0b", "#ec4899", "#06b6d4", "#8b5cf6"];

interface Props {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  isPremium: boolean;
}

export default function ProfilePage({ profile, setProfile, isPremium }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);

  const save = () => {
    const initials = draft.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
    setProfile({ ...draft, avatar: initials });
    setEditing(false);
  };

  const toggleStatus = () => {
    setProfile({ ...profile, status: profile.status === "online" ? "offline" : "online" });
  };

  if (editing) {
    return (
      <div className="flex flex-col h-full animate-slide-up">
        <div
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--am-border)" }}
        >
          <button onClick={() => setEditing(false)} style={{ color: "var(--am-accent)" }}>
            <Icon name="X" size={22} />
          </button>
          <span style={{ fontWeight: 600, fontSize: 16, color: "var(--am-text)" }}>Редактировать профиль</span>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 flex flex-col gap-4">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 py-4">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold"
              style={{ background: draft.avatarColor, color: "#fff" }}
            >
              {draft.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setDraft({ ...draft, avatarColor: c })}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: c,
                    border: draft.avatarColor === c ? "2px solid #fff" : "2px solid transparent",
                    boxShadow: draft.avatarColor === c ? "0 0 10px rgba(255,255,255,0.3)" : "none",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Fields */}
          {[
            { label: "Имя", key: "name", placeholder: "Ваше имя" },
            { label: "Username", key: "username", placeholder: "@username" },
          ].map((field) => (
            <div key={field.key}>
              <label style={{ fontSize: 12, color: "var(--am-text-muted)", fontWeight: 500, marginBottom: 6, display: "block" }}>
                {field.label}
              </label>
              <input
                value={draft[field.key as keyof typeof draft] as string}
                onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className="w-full outline-none"
                style={{
                  background: "var(--am-surface2)",
                  border: "1px solid var(--am-border)",
                  borderRadius: 12,
                  padding: "12px 14px",
                  color: "var(--am-text)",
                  fontSize: 14,
                  fontFamily: "inherit",
                }}
              />
            </div>
          ))}

          <button
            onClick={save}
            className="w-full py-3.5 rounded-2xl font-semibold text-base transition-all active:scale-98 mt-2"
            style={{ background: "var(--am-accent)", color: "#fff" }}
          >
            Сохранить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
      {/* Banner */}
      <div
        className="relative flex-shrink-0 h-36"
        style={{
          background: isPremium
            ? "linear-gradient(135deg, #f59e0b, #a855f7, #2d8cf0)"
            : "linear-gradient(135deg, #1d4ed8 0%, #1e2738 100%)",
        }}
      >
        {isPremium && (
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)",
          }} />
        )}
      </div>

      {/* Avatar on banner */}
      <div className="px-5 flex-shrink-0" style={{ marginTop: -36, marginBottom: 16, position: "relative", zIndex: 1 }}>
        <div className="flex items-end justify-between">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-4"
              style={{ background: profile.avatarColor, color: "#fff", borderColor: "var(--am-bg)" }}
            >
              {profile.avatar}
            </div>
            {profile.status === "online" && (
              <div
                className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2"
                style={{ background: "var(--am-online)", borderColor: "var(--am-bg)" }}
              />
            )}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
            style={{ background: "var(--am-surface2)", color: "var(--am-text)", border: "1px solid var(--am-border)" }}
          >
            <Icon name="Pencil" size={14} />
            Изменить
          </button>
        </div>

        {/* Name */}
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <span style={{ fontWeight: 700, fontSize: 20, color: "var(--am-text)" }}>{profile.name}</span>
            {isPremium && (
              <span className="animate-pop-in px-2 py-0.5 rounded-lg text-xs font-bold"
                style={{ background: "linear-gradient(90deg, #f59e0b, #fbbf24)", color: "#000" }}>
                ★ Premium
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: "var(--am-text-muted)", marginTop: 2 }}>{profile.username}</div>
        </div>
      </div>

      {/* Status toggle */}
      <div className="px-4 pb-4 flex-shrink-0">
        <button
          onClick={toggleStatus}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all active:scale-98"
          style={{ background: "var(--am-surface)", border: "1px solid var(--am-border)" }}
        >
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ background: profile.status === "online" ? "var(--am-online)" : "var(--am-text-dim)" }}
          />
          <span style={{ fontSize: 14, color: "var(--am-text)" }}>
            {profile.status === "online" ? "Онлайн" : "Не в сети"}
          </span>
          <div className="ml-auto">
            <Icon name="ChevronRight" size={16} style={{ color: "var(--am-text-muted)" }} />
          </div>
        </button>
      </div>

      {/* Stats */}
      <div className="px-4 pb-4 flex-shrink-0">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Друзья", value: "8", icon: "👥" },
            { label: "Группы", value: "3", icon: "💬" },
            { label: "Подарки", value: isPremium ? "5" : "0", icon: "🎁" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center py-4 rounded-2xl gap-1"
              style={{ background: "var(--am-surface)", border: "1px solid var(--am-border)" }}
            >
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <span style={{ fontWeight: 700, fontSize: 18, color: "var(--am-text)" }}>{s.value}</span>
              <span style={{ fontSize: 11, color: "var(--am-text-muted)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="px-4 pb-6 flex flex-col gap-2 flex-shrink-0">
        {[
          { icon: "Bell", label: "Уведомления" },
          { icon: "Lock", label: "Приватность" },
          { icon: "Palette", label: "Оформление" },
          { icon: "HelpCircle", label: "Помощь" },
        ].map((item) => (
          <button
            key={item.label}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-98"
            style={{ background: "var(--am-surface)", border: "1px solid var(--am-border)" }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(45,140,240,0.12)" }}
            >
              <Icon name={item.icon} size={16} style={{ color: "var(--am-accent)" }} />
            </div>
            <span style={{ fontSize: 14, color: "var(--am-text)", fontWeight: 500 }}>{item.label}</span>
            <div className="ml-auto">
              <Icon name="ChevronRight" size={16} style={{ color: "var(--am-text-dim)" }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
