import { useState } from "react";
import Icon from "@/components/ui/icon";
import { authApi, walletApi } from "@/lib/api";

const AVATAR_COLORS = ["#2d8cf0", "#a855f7", "#10b981", "#ef4444", "#f59e0b", "#ec4899", "#06b6d4", "#8b5cf6"];

interface AppUser {
  id: number;
  display_name: string;
  username: string | null;
  avatar_color: string;
  stars_balance: number;
  is_premium: boolean;
  is_admin: boolean;
  is_system: boolean;
  phone: string | null;
  status: string;
  bio: string;
}

interface Gift {
  id: number;
  name: string;
  emoji: string;
  rarity: string;
  gradient_from: string;
  gradient_to: string;
  price_stars: number;
  message: string;
  from_name: string;
  from_color: string;
  created_at: string;
}

const RARITY_LABEL: Record<string, string> = { common: "Обычный", rare: "Редкий", epic: "Эпический", legendary: "Легендарный" };
const RARITY_COLOR: Record<string, string> = { common: "#6b7a99", rare: "#3b82f6", epic: "#a855f7", legendary: "#f59e0b" };

interface Props {
  user: AppUser;
  onUpdate: (u: AppUser) => void;
  onLogout: () => void;
  gifts: Gift[];
}

export default function ProfilePage({ user, onUpdate, onLogout, gifts }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ display_name: user.display_name, username: user.username || "", avatar_color: user.avatar_color, bio: user.bio || "" });
  const [saving, setSaving] = useState(false);
  const [showGifts, setShowGifts] = useState(false);

  const save = async () => {
    setSaving(true);
    await authApi.updateProfile(draft);
    setSaving(false);
    onUpdate({ ...user, ...draft, username: draft.username || null });
    setEditing(false);
  };

  const toggleStatus = async () => {
    const newStatus = user.status === "online" ? "offline" : "online";
    await authApi.updateProfile({ status: newStatus });
    onUpdate({ ...user, status: newStatus });
  };

  if (editing) {
    return (
      <div className="flex flex-col h-full animate-slide-up">
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--am-border)" }}>
          <button onClick={() => setEditing(false)} style={{ color: "var(--am-accent)" }}><Icon name="X" size={22} /></button>
          <span style={{ fontWeight: 600, fontSize: 16, color: "var(--am-text)" }}>Редактировать профиль</span>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 flex flex-col gap-4">
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold" style={{ background: draft.avatar_color, color: "#fff" }}>
              {draft.display_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {AVATAR_COLORS.map((c) => (
                <button key={c} onClick={() => setDraft({ ...draft, avatar_color: c })} className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                  style={{ background: c, border: draft.avatar_color === c ? "2.5px solid #fff" : "2px solid transparent", boxShadow: draft.avatar_color === c ? "0 0 12px rgba(255,255,255,0.3)" : "none" }} />
              ))}
            </div>
          </div>
          {[
            { label: "Имя", key: "display_name", placeholder: "Ваше имя" },
            { label: "Username", key: "username", placeholder: "@username" },
            { label: "О себе", key: "bio", placeholder: "Расскажите о себе..." },
          ].map((f) => (
            <div key={f.key}>
              <label style={{ fontSize: 12, color: "var(--am-text-muted)", fontWeight: 500, marginBottom: 6, display: "block" }}>{f.label}</label>
              <input value={draft[f.key as keyof typeof draft]} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} placeholder={f.placeholder} className="w-full outline-none"
                style={{ background: "var(--am-surface2)", border: "1px solid var(--am-border)", borderRadius: 12, padding: "12px 14px", color: "var(--am-text)", fontSize: 14, fontFamily: "inherit" }} />
            </div>
          ))}
          <button onClick={save} disabled={saving} className="w-full py-3.5 rounded-2xl font-semibold text-base transition-all active:scale-98 mt-2"
            style={{ background: "var(--am-accent)", color: "#fff", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      </div>
    );
  }

  if (showGifts) {
    return (
      <div className="flex flex-col h-full animate-fade-in">
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--am-border)" }}>
          <button onClick={() => setShowGifts(false)} style={{ color: "var(--am-accent)" }}><Icon name="ChevronLeft" size={22} /></button>
          <span style={{ fontWeight: 600, fontSize: 16, color: "var(--am-text)" }}>Мои подарки</span>
          <span className="ml-auto px-2 py-0.5 rounded-lg text-xs font-bold" style={{ background: "rgba(245,158,11,0.15)", color: "var(--am-premium)" }}>{gifts.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4">
          {gifts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span style={{ fontSize: 40 }}>🎁</span>
              <span style={{ color: "var(--am-text-muted)", fontSize: 14 }}>Подарков пока нет</span>
              <span style={{ color: "var(--am-text-dim)", fontSize: 12 }}>Попросите друзей подарить что-нибудь</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {gifts.map((g, i) => (
              <div key={g.id} className="flex flex-col items-center p-4 rounded-2xl animate-pop-in" style={{ background: `linear-gradient(135deg, ${g.gradient_from}20, ${g.gradient_to}20)`, border: `1px solid ${RARITY_COLOR[g.rarity]}30`, animationDelay: `${i * 0.06}s` }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2" style={{ background: `linear-gradient(135deg, ${g.gradient_from}, ${g.gradient_to})` }}>
                  <span style={{ fontSize: 28 }}>{g.emoji}</span>
                </div>
                <span style={{ fontWeight: 600, fontSize: 13, color: "var(--am-text)" }}>{g.name}</span>
                <span style={{ fontSize: 10, color: RARITY_COLOR[g.rarity], fontWeight: 600, marginTop: 2 }}>{RARITY_LABEL[g.rarity]}</span>
                <span style={{ fontSize: 11, color: "var(--am-text-muted)", marginTop: 4 }}>от {g.from_name}</span>
                {g.message && <p style={{ fontSize: 11, color: "var(--am-text-muted)", textAlign: "center", marginTop: 4, fontStyle: "italic" }}>"{g.message}"</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const initials = user.display_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
      {/* Banner */}
      <div className="relative flex-shrink-0 h-36" style={{
        background: user.is_premium
          ? "linear-gradient(135deg, #f59e0b, #a855f7, #2d8cf0)"
          : "linear-gradient(135deg, #1d4ed8 0%, #1e2738 100%)",
      }}>
        {user.is_premium && <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)" }} />}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      </div>

      <div className="px-5 flex-shrink-0" style={{ marginTop: -40, marginBottom: 16, position: "relative", zIndex: 1 }}>
        <div className="flex items-end justify-between">
          <div className="relative">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-4" style={{ background: user.avatar_color, color: "#fff", borderColor: "var(--am-bg)" }}>
              {initials}
            </div>
            {user.status === "online" && <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2" style={{ background: "var(--am-online)", borderColor: "var(--am-bg)" }} />}
          </div>
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95" style={{ background: "var(--am-surface2)", color: "var(--am-text)", border: "1px solid var(--am-border)" }}>
            <Icon name="Pencil" size={14} /> Изменить
          </button>
        </div>
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <span style={{ fontWeight: 700, fontSize: 20, color: "var(--am-text)" }}>{user.display_name}</span>
            {user.is_premium && <span className="animate-pop-in px-2 py-0.5 rounded-lg text-xs font-bold" style={{ background: "linear-gradient(90deg, #f59e0b, #fbbf24)", color: "#000" }}>★ Premium</span>}
            {user.is_admin && <span className="px-2 py-0.5 rounded-lg text-xs font-bold" style={{ background: "rgba(45,140,240,0.2)", color: "var(--am-accent)" }}>Admin</span>}
          </div>
          {user.username && <div style={{ fontSize: 13, color: "var(--am-text-muted)", marginTop: 2 }}>{user.username}</div>}
          {user.bio && <p style={{ fontSize: 13, color: "var(--am-text-muted)", marginTop: 6, lineHeight: 1.4 }}>{user.bio}</p>}
        </div>
      </div>

      {/* Phone */}
      <div className="px-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: "var(--am-surface)", border: "1px solid var(--am-border)" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(45,140,240,0.12)" }}>
            <Icon name="Phone" size={15} style={{ color: "var(--am-accent)" }} />
          </div>
          <span style={{ fontSize: 14, color: "var(--am-text)" }}>{user.phone || "Не указан"}</span>
        </div>
      </div>

      {/* Status */}
      <div className="px-4 pb-4 flex-shrink-0">
        <button onClick={toggleStatus} className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all active:scale-98" style={{ background: "var(--am-surface)", border: "1px solid var(--am-border)" }}>
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: user.status === "online" ? "var(--am-online)" : "var(--am-text-dim)" }} />
          <span style={{ fontSize: 14, color: "var(--am-text)" }}>{user.status === "online" ? "Онлайн" : "Не в сети"}</span>
          <span style={{ fontSize: 12, color: "var(--am-text-muted)", marginLeft: "auto" }}>нажмите для изменения</span>
        </button>
      </div>

      {/* Stats */}
      <div className="px-4 pb-4 flex-shrink-0">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center py-4 rounded-2xl gap-1" style={{ background: "var(--am-surface)", border: "1px solid var(--am-border)" }}>
            <span style={{ fontSize: 22 }}>⭐</span>
            <span style={{ fontWeight: 700, fontSize: 18, color: "var(--am-text)" }}>{user.stars_balance}</span>
            <span style={{ fontSize: 11, color: "var(--am-text-muted)" }}>Звёзды</span>
          </div>
          <button onClick={() => setShowGifts(true)} className="flex flex-col items-center py-4 rounded-2xl gap-1 transition-all active:scale-98" style={{ background: "var(--am-surface)", border: "1px solid var(--am-border)" }}>
            <span style={{ fontSize: 22 }}>🎁</span>
            <span style={{ fontWeight: 700, fontSize: 18, color: "var(--am-text)" }}>{gifts.length}</span>
            <span style={{ fontSize: 11, color: "var(--am-text-muted)" }}>Подарки</span>
          </button>
          <div className="flex flex-col items-center py-4 rounded-2xl gap-1" style={{ background: "var(--am-surface)", border: user.is_premium ? "1px solid rgba(245,158,11,0.4)" : "1px solid var(--am-border)" }}>
            <span style={{ fontSize: 22 }}>{user.is_premium ? "👑" : "🌟"}</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: user.is_premium ? "var(--am-premium)" : "var(--am-text)" }}>{user.is_premium ? "Premium" : "Базовый"}</span>
            <span style={{ fontSize: 11, color: "var(--am-text-muted)" }}>Статус</span>
          </div>
        </div>
      </div>

      {/* Settings & Logout */}
      <div className="px-4 pb-6 flex flex-col gap-2 flex-shrink-0">
        {[
          { icon: "Bell", label: "Уведомления" },
          { icon: "Lock", label: "Приватность" },
          { icon: "Palette", label: "Оформление" },
        ].map((item) => (
          <button key={item.label} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-98" style={{ background: "var(--am-surface)", border: "1px solid var(--am-border)" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(45,140,240,0.12)" }}>
              <Icon name={item.icon} size={16} style={{ color: "var(--am-accent)" }} />
            </div>
            <span style={{ fontSize: 14, color: "var(--am-text)", fontWeight: 500 }}>{item.label}</span>
            <div className="ml-auto"><Icon name="ChevronRight" size={16} style={{ color: "var(--am-text-dim)" }} /></div>
          </button>
        ))}
        <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-98 mt-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
            <Icon name="LogOut" size={16} style={{ color: "#ef4444" }} />
          </div>
          <span style={{ fontSize: 14, color: "#ef4444", fontWeight: 500 }}>Выйти</span>
        </button>
      </div>
    </div>
  );
}
