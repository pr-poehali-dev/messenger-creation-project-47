import { useState } from "react";
import Icon from "@/components/ui/icon";

const FEATURES = [
  { icon: "🎨", title: "Анимированный баннер", desc: "Уникальный градиентный фон профиля" },
  { icon: "✨", title: "Значок Premium", desc: "Золотой значок рядом с именем" },
  { icon: "🎁", title: "Эксклюзивные подарки", desc: "Доступ к редким подаркам и стикерам" },
  { icon: "📌", title: "Закреп сообщений", desc: "Закрепляйте важные сообщения в чатах" },
  { icon: "🌐", title: "Без ограничений", desc: "Неограниченное хранилище медиафайлов" },
  { icon: "⚡", title: "Быстрые реакции", desc: "Эксклюзивный набор анимированных реакций" },
];

const PLANS = [
  { id: "month", label: "1 месяц", price: 100, stars: true, popular: false },
  { id: "3month", label: "3 месяца", price: 250, stars: true, popular: true, save: "−17%" },
  { id: "year", label: "1 год", price: 800, stars: true, popular: false, save: "−33%" },
];

export default function PremiumPage({
  isPremium,
  setIsPremium,
  stars,
  setStars,
}: {
  isPremium: boolean;
  setIsPremium: (v: boolean) => void;
  stars: number;
  setStars: (n: number) => void;
}) {
  const [selected, setSelected] = useState("3month");
  const [loading, setLoading] = useState(false);

  const selectedPlan = PLANS.find((p) => p.id === selected)!;
  const canBuy = stars >= selectedPlan.price;

  const buy = () => {
    if (!canBuy || loading) return;
    setLoading(true);
    setTimeout(() => {
      setStars(stars - selectedPlan.price);
      setIsPremium(true);
      setLoading(false);
    }, 1500);
  };

  if (isPremium) {
    return (
      <div className="flex flex-col h-full overflow-y-auto scrollbar-hide px-4 py-6">
        {/* Active badge */}
        <div className="flex flex-col items-center py-8 animate-fade-in">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-4 animate-pop-in"
            style={{
              background: "linear-gradient(135deg, #f59e0b, #fbbf24, #a855f7)",
              boxShadow: "0 0 40px rgba(245,158,11,0.5)",
            }}
          >
            <span style={{ fontSize: 44 }}>★</span>
          </div>
          <h2 style={{ fontWeight: 900, fontSize: 26, color: "var(--am-text)", marginBottom: 6 }}>
            Astrey Premium
          </h2>
          <div
            className="px-4 py-1.5 rounded-xl text-sm font-bold mb-3"
            style={{ background: "linear-gradient(90deg, #f59e0b, #fbbf24)", color: "#000" }}
          >
            ✓ АКТИВЕН
          </div>
          <p style={{ fontSize: 14, color: "var(--am-text-muted)", textAlign: "center", maxWidth: 280 }}>
            Вы наслаждаетесь всеми премиум-возможностями AstreyMessange
          </p>
        </div>

        {/* Features active */}
        <div className="flex flex-col gap-2">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl animate-fade-in"
              style={{
                background: "var(--am-surface)",
                border: "1px solid rgba(245,158,11,0.2)",
                animationDelay: `${i * 0.06}s`,
              }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
              <div className="flex-1">
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--am-text)" }}>{f.title}</div>
                <div style={{ fontSize: 12, color: "var(--am-text-muted)" }}>{f.desc}</div>
              </div>
              <Icon name="Check" size={16} style={{ color: "var(--am-online)", flexShrink: 0 }} />
            </div>
          ))}
        </div>

        <button
          onClick={() => setIsPremium(false)}
          className="mt-6 py-3 rounded-2xl text-sm transition-all"
          style={{ color: "var(--am-text-muted)", border: "1px solid var(--am-border)" }}
        >
          Отменить подписку
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
      {/* Hero */}
      <div
        className="relative flex flex-col items-center py-8 px-6 flex-shrink-0 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #1a1040 0%, #0d1117 60%)" }}
      >
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 50% 0%, rgba(245,158,11,0.6) 0%, transparent 60%)",
        }} />
        <div
          className="relative w-20 h-20 rounded-full flex items-center justify-center mb-4 animate-pop-in"
          style={{
            background: "linear-gradient(135deg, #f59e0b, #fbbf24, #a855f7)",
            boxShadow: "0 0 40px rgba(245,158,11,0.35)",
          }}
        >
          <span style={{ fontSize: 36 }}>★</span>
        </div>
        <h1 className="relative" style={{ fontWeight: 900, fontSize: 26, color: "#fff", marginBottom: 6 }}>
          Astrey Premium
        </h1>
        <p className="relative text-center" style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", maxWidth: 260 }}>
          Разблокируй все возможности мессенджера
        </p>
      </div>

      {/* Features */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="grid grid-cols-2 gap-2">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="flex flex-col gap-1.5 p-3 rounded-2xl animate-fade-in"
              style={{
                background: "var(--am-surface)",
                border: "1px solid var(--am-border)",
                animationDelay: `${i * 0.05}s`,
              }}
            >
              <span style={{ fontSize: 22 }}>{f.icon}</span>
              <span style={{ fontWeight: 600, fontSize: 12, color: "var(--am-text)" }}>{f.title}</span>
              <span style={{ fontSize: 11, color: "var(--am-text-muted)", lineHeight: 1.3 }}>{f.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div className="px-4 pb-3 flex-shrink-0">
        <div style={{ fontWeight: 600, fontSize: 15, color: "var(--am-text)", marginBottom: 10 }}>Выберите план</div>
        <div className="flex flex-col gap-2">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className="flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all active:scale-98"
              style={{
                background: selected === plan.id ? "rgba(45,140,240,0.12)" : "var(--am-surface)",
                border: selected === plan.id ? "1.5px solid var(--am-accent)" : "1px solid var(--am-border)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                  style={{
                    borderColor: selected === plan.id ? "var(--am-accent)" : "var(--am-border)",
                    background: selected === plan.id ? "var(--am-accent)" : "transparent",
                  }}
                >
                  {selected === plan.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "var(--am-text)" }}>{plan.label}</span>
                  {plan.popular && (
                    <span
                      className="ml-2 px-2 py-0.5 rounded-md text-xs font-bold"
                      style={{ background: "rgba(45,140,240,0.2)", color: "var(--am-accent)" }}
                    >
                      Выгодно
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {plan.save && (
                  <span style={{ fontSize: 11, color: "var(--am-online)", fontWeight: 600 }}>{plan.save}</span>
                )}
                <span style={{ fontWeight: 700, fontSize: 15, color: "var(--am-text)" }}>
                  {plan.price} ⭐
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Balance info */}
      <div className="px-4 pb-2 flex-shrink-0">
        <div
          className="flex items-center justify-between px-4 py-3 rounded-2xl"
          style={{ background: "var(--am-surface)", border: "1px solid var(--am-border)" }}
        >
          <span style={{ fontSize: 13, color: "var(--am-text-muted)" }}>Ваш баланс</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: stars >= selectedPlan.price ? "var(--am-text)" : "#ef4444" }}>
            {stars} ⭐
          </span>
        </div>
        {!canBuy && (
          <p style={{ fontSize: 12, color: "#ef4444", marginTop: 6, textAlign: "center" }}>
            Нужно ещё {selectedPlan.price - stars} ⭐ — пополни кошелёк
          </p>
        )}
      </div>

      {/* CTA */}
      <div className="px-4 pb-6 flex-shrink-0">
        <button
          onClick={buy}
          disabled={!canBuy || loading}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-98"
          style={{
            background: canBuy
              ? "linear-gradient(135deg, #f59e0b, #fbbf24)"
              : "var(--am-surface2)",
            color: canBuy ? "#000" : "var(--am-text-muted)",
            cursor: canBuy ? "pointer" : "not-allowed",
            boxShadow: canBuy ? "0 4px 20px rgba(245,158,11,0.35)" : "none",
          }}
        >
          {loading ? "Активация..." : canBuy ? `★ Купить за ${selectedPlan.price} звёзд` : "Недостаточно звёзд"}
        </button>
      </div>
    </div>
  );
}
