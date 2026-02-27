import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { msgApi } from "@/lib/api";

interface User {
  id: number;
  display_name: string;
  username: string | null;
  phone: string | null;
  avatar_color: string;
  stars_balance: number;
  is_premium: boolean;
  is_admin: boolean;
  status: string;
  created_at: string;
}

interface Payment {
  id: number;
  user_id: number;
  user_name: string;
  user_phone: string;
  stars_amount: number;
  rub_amount: number;
  status: string;
  created_at: string;
  comment: string | null;
}

export default function AdminPage() {
  const [tab, setTab] = useState<"users" | "payments">("payments");
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [giveStarsUser, setGiveStarsUser] = useState<number | null>(null);
  const [starsAmount, setStarsAmount] = useState("100");
  const [actionMsg, setActionMsg] = useState("");

  const load = async () => {
    const [u, p] = await Promise.all([msgApi.adminUsers(), msgApi.adminPayments()]);
    if (u.users) setUsers(u.users);
    if (p.payments) setPayments(p.payments);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const notify = (msg: string) => { setActionMsg(msg); setTimeout(() => setActionMsg(""), 3000); };

  const confirmPayment = async (id: number, action: "confirm" | "reject") => {
    await msgApi.adminConfirmPayment(id, action);
    notify(action === "confirm" ? "✓ Оплата подтверждена — звёзды начислены" : "✗ Оплата отклонена");
    load();
  };

  const banUser = async (id: number) => {
    if (!confirm("Заблокировать пользователя?")) return;
    await msgApi.adminBanUser(id);
    notify("Пользователь заблокирован");
    load();
  };

  const givePremium = async (id: number) => {
    await msgApi.adminGivePremium(id, 1);
    notify("Premium выдан на 1 месяц");
    load();
  };

  const giveStars = async (id: number) => {
    const amount = parseInt(starsAmount);
    if (!amount || amount < 1) return;
    await msgApi.adminGiveStars(id, amount);
    notify(`${amount} ⭐ выдано пользователю`);
    setGiveStarsUser(null);
    load();
  };

  const pending = payments.filter((p) => p.status === "pending");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0" style={{ borderBottom: "1px solid var(--am-border)" }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(45,140,240,0.15)" }}>
            <Icon name="ShieldCheck" size={16} style={{ color: "var(--am-accent)" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "var(--am-text)" }}>Панель администратора</span>
          {pending.length > 0 && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#ef4444", fontSize: 10, fontWeight: 700, color: "#fff" }}>{pending.length}</div>
          )}
        </div>
        {actionMsg && (
          <div className="px-3 py-2 rounded-xl mb-2 animate-pop-in" style={{ background: "rgba(45,220,191,0.12)", border: "1px solid rgba(45,220,191,0.3)" }}>
            <span style={{ fontSize: 12, color: "var(--am-online)" }}>{actionMsg}</span>
          </div>
        )}
        <div className="flex gap-2">
          {[{ id: "payments", label: `Оплаты${pending.length ? ` (${pending.length})` : ""}` }, { id: "users", label: "Пользователи" }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as "users" | "payments")} className="px-3 py-1.5 rounded-xl text-xs font-medium"
              style={{ background: tab === t.id ? "var(--am-accent)" : "var(--am-surface2)", color: tab === t.id ? "#fff" : "var(--am-text-muted)" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading && <div className="flex items-center justify-center py-16"><span style={{ color: "var(--am-text-muted)" }}>Загрузка...</span></div>}

        {!loading && tab === "payments" && (
          <div className="px-4 py-3 flex flex-col gap-3">
            {payments.length === 0 && <div className="text-center py-8" style={{ color: "var(--am-text-muted)", fontSize: 13 }}>Платежей нет</div>}
            {payments.map((p) => (
              <div key={p.id} className="px-4 py-4 rounded-2xl" style={{ background: "var(--am-surface)", border: `1px solid ${p.status === "pending" ? "rgba(245,158,11,0.4)" : p.status === "confirmed" ? "rgba(45,220,191,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontWeight: 600, fontSize: 14, color: "var(--am-text)" }}>{p.user_name}</span>
                  <div className="px-2 py-0.5 rounded-lg text-xs font-bold" style={{
                    background: p.status === "pending" ? "rgba(245,158,11,0.15)" : p.status === "confirmed" ? "rgba(45,220,191,0.15)" : "rgba(239,68,68,0.15)",
                    color: p.status === "pending" ? "var(--am-premium)" : p.status === "confirmed" ? "var(--am-online)" : "#ef4444"
                  }}>
                    {p.status === "pending" ? "Ожидает" : p.status === "confirmed" ? "Подтверждено" : "Отклонено"}
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <span style={{ fontSize: 13, color: "var(--am-text-muted)" }}>📱 {p.user_phone}</span>
                  <span style={{ fontSize: 13, color: "var(--am-text)" }}>{p.rub_amount} ₽ → <strong>{p.stars_amount} ⭐</strong></span>
                </div>
                <div style={{ fontSize: 11, color: "var(--am-text-dim)", marginBottom: p.status === "pending" ? 10 : 0 }}>
                  #{p.id} · {new Date(p.created_at).toLocaleString("ru", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
                {p.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => confirmPayment(p.id, "confirm")} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95" style={{ background: "var(--am-online)", color: "#000" }}>
                      ✓ Подтвердить
                    </button>
                    <button onClick={() => confirmPayment(p.id, "reject")} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                      ✗ Отклонить
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "users" && (
          <div className="px-4 py-3 flex flex-col gap-2">
            {users.map((u) => (
              <div key={u.id} className="px-4 py-3 rounded-2xl" style={{ background: "var(--am-surface)", border: "1px solid var(--am-border)" }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: u.avatar_color, color: "#fff" }}>
                    {u.display_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontWeight: 600, fontSize: 13, color: "var(--am-text)" }}>{u.display_name}</span>
                      {u.is_premium && <span style={{ fontSize: 10 }}>⭐</span>}
                      {u.is_admin && <span className="px-1.5 py-0.5 rounded-md text-xs font-bold" style={{ background: "rgba(45,140,240,0.15)", color: "var(--am-accent)" }}>ADM</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--am-text-muted)" }}>{u.phone || u.username} · {u.stars_balance} ⭐</div>
                  </div>
                  <div className="w-2 h-2 rounded-full" style={{ background: u.status === "online" ? "var(--am-online)" : "var(--am-text-dim)" }} />
                </div>
                {!u.is_admin && (
                  <div className="flex gap-1.5 flex-wrap">
                    <button onClick={() => givePremium(u.id)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
                      style={{ background: "rgba(245,158,11,0.12)", color: "var(--am-premium)", border: "1px solid rgba(245,158,11,0.2)" }}>
                      + Premium
                    </button>
                    <button onClick={() => setGiveStarsUser(giveStarsUser === u.id ? null : u.id)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
                      style={{ background: "rgba(45,140,240,0.12)", color: "var(--am-accent)", border: "1px solid rgba(45,140,240,0.2)" }}>
                      + Звёзды
                    </button>
                    <button onClick={() => banUser(u.id)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
                      style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>
                      Бан
                    </button>
                  </div>
                )}
                {giveStarsUser === u.id && (
                  <div className="flex gap-2 mt-2 animate-fade-in">
                    <input value={starsAmount} onChange={(e) => setStarsAmount(e.target.value)} type="number" className="flex-1 outline-none px-3 py-2 rounded-xl text-sm"
                      style={{ background: "var(--am-surface2)", border: "1px solid var(--am-border)", color: "var(--am-text)", fontFamily: "inherit" }} />
                    <button onClick={() => giveStars(u.id)} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--am-accent)", color: "#fff" }}>
                      Выдать ⭐
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
