import { useState } from "react";
import Icon from "@/components/ui/icon";

const PACKS = [
  { id: 1, stars: 50, price: "99₽", bonus: null },
  { id: 2, stars: 150, price: "249₽", bonus: "+20" },
  { id: 3, stars: 500, price: "749₽", bonus: "+100" },
  { id: 4, stars: 1000, price: "1 299₽", bonus: "+250" },
];

const TRANSACTIONS = [
  { id: 1, type: "in", label: "Покупка звёзд", amount: 150, time: "Сегодня, 14:30" },
  { id: 2, type: "out", label: "Подарок Марии", amount: 30, time: "Вчера, 18:00" },
  { id: 3, type: "out", label: "Premium — 1 мес.", amount: 100, time: "3 дня назад" },
  { id: 4, type: "in", label: "Покупка звёзд", amount: 50, time: "Неделю назад" },
];

export default function WalletPage({
  stars,
  setStars,
}: {
  stars: number;
  setStars: (n: number) => void;
}) {
  const [loading, setLoading] = useState<number | null>(null);
  const [success, setSuccess] = useState<number | null>(null);

  const buy = (pack: typeof PACKS[0]) => {
    setLoading(pack.id);
    setTimeout(() => {
      const bonus = pack.bonus ? parseInt(pack.bonus.replace("+", "")) : 0;
      setStars(stars + pack.stars + bonus);
      setLoading(null);
      setSuccess(pack.id);
      setTimeout(() => setSuccess(null), 2000);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
      {/* Balance card */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div
          className="relative overflow-hidden rounded-3xl p-5"
          style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2d8cf0 60%, #7c3aed 100%)" }}
        >
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)",
          }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span style={{ fontSize: 20 }}>⭐</span>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>Ваши звёзды</span>
            </div>
            <div style={{ fontSize: 44, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{stars}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>AstreyCoins</div>

            <div className="flex items-center gap-2 mt-4">
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
              >
                <Icon name="ArrowUpRight" size={12} />
                Отправить
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
              >
                <Icon name="History" size={12} />
                История
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add stars */}
      <div className="px-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontWeight: 600, fontSize: 15, color: "var(--am-text)" }}>Купить звёзды</span>
          <span style={{ fontSize: 12, color: "var(--am-text-muted)" }}>⭐ = монеты профиля</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => buy(pack)}
              disabled={loading !== null}
              className="relative flex flex-col items-center py-4 px-3 rounded-2xl transition-all active:scale-95"
              style={{
                background: success === pack.id ? "rgba(45,220,191,0.15)" : "var(--am-surface)",
                border: success === pack.id
                  ? "1px solid var(--am-online)"
                  : pack.bonus
                  ? "1px solid rgba(45,140,240,0.4)"
                  : "1px solid var(--am-border)",
              }}
            >
              {pack.bonus && (
                <div
                  className="absolute top-2 right-2 px-1.5 py-0.5 rounded-lg text-xs font-bold"
                  style={{ background: "var(--am-accent)", color: "#fff" }}
                >
                  {pack.bonus}
                </div>
              )}
              <span style={{ fontSize: 24, marginBottom: 4 }}>⭐</span>
              <span style={{ fontWeight: 700, fontSize: 18, color: "var(--am-text)" }}>{pack.stars}</span>
              <span style={{ fontSize: 11, color: "var(--am-text-muted)", marginBottom: 8 }}>звёзд</span>
              <div
                className="px-4 py-1.5 rounded-xl text-sm font-semibold w-full text-center"
                style={{
                  background: success === pack.id ? "var(--am-online)" : "var(--am-accent)",
                  color: "#fff",
                }}
              >
                {loading === pack.id ? "..." : success === pack.id ? "✓ Куплено" : pack.price}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div className="px-4 pb-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontWeight: 600, fontSize: 15, color: "var(--am-text)" }}>История</span>
        </div>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--am-surface)", border: "1px solid var(--am-border)" }}
        >
          {TRANSACTIONS.map((tx, i) => (
            <div
              key={tx.id}
              className="flex items-center gap-3 px-4 py-3.5"
              style={{ borderBottom: i < TRANSACTIONS.length - 1 ? "1px solid var(--am-border)" : "none" }}
            >
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: tx.type === "in" ? "rgba(45,220,191,0.12)" : "rgba(239,68,68,0.12)",
                }}
              >
                <Icon
                  name={tx.type === "in" ? "ArrowDownLeft" : "ArrowUpRight"}
                  size={16}
                  style={{ color: tx.type === "in" ? "var(--am-online)" : "#ef4444" }}
                />
              </div>
              <div className="flex-1">
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--am-text)" }}>{tx.label}</div>
                <div style={{ fontSize: 11, color: "var(--am-text-muted)" }}>{tx.time}</div>
              </div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: tx.type === "in" ? "var(--am-online)" : "#ef4444",
                }}
              >
                {tx.type === "in" ? "+" : "-"}{tx.amount} ⭐
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
