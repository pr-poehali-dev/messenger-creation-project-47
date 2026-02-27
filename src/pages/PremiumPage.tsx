import Icon from "@/components/ui/icon";

const FEATURES = [
  { icon: "🎨", title: "Анимированный баннер", desc: "Уникальный градиентный фон профиля" },
  { icon: "✨", title: "Значок Premium", desc: "Золотой ⭐ рядом с именем" },
  { icon: "🎁", title: "Редкие подарки", desc: "Доступ к эпическим и легендарным подаркам" },
  { icon: "📌", title: "Закреп сообщений", desc: "Закрепляйте важные сообщения" },
  { icon: "🌐", title: "Без ограничений", desc: "Неограниченное хранилище медиа" },
  { icon: "⚡", title: "Анимированные реакции", desc: "Эксклюзивный набор реакций" },
];

export default function PremiumPage({ isPremium, onGoWallet }: { isPremium: boolean; onGoWallet: () => void }) {
  if (isPremium) {
    return (
      <div className="flex flex-col h-full overflow-y-auto scrollbar-hide px-4 py-6">
        <div className="flex flex-col items-center py-8 animate-fade-in">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 animate-pop-in"
            style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24, #a855f7)", boxShadow: "0 0 40px rgba(245,158,11,0.5)" }}>
            <span style={{ fontSize: 44 }}>★</span>
          </div>
          <h2 style={{ fontWeight: 900, fontSize: 26, color: "var(--am-text)", marginBottom: 6 }}>Astrey Premium</h2>
          <div className="px-4 py-1.5 rounded-xl text-sm font-bold mb-3" style={{ background: "linear-gradient(90deg, #f59e0b, #fbbf24)", color: "#000" }}>✓ АКТИВЕН</div>
          <p style={{ fontSize: 14, color: "var(--am-text-muted)", textAlign: "center", maxWidth: 280 }}>
            Вы наслаждаетесь всеми премиум-возможностями AstreyMessange
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl animate-fade-in"
              style={{ background: "var(--am-surface)", border: "1px solid rgba(245,158,11,0.2)", animationDelay: `${i * 0.06}s` }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
              <div className="flex-1">
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--am-text)" }}>{f.title}</div>
                <div style={{ fontSize: 12, color: "var(--am-text-muted)" }}>{f.desc}</div>
              </div>
              <Icon name="Check" size={16} style={{ color: "var(--am-online)", flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
      <div className="relative flex flex-col items-center py-8 px-6 flex-shrink-0 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #1a1040 0%, #0d1117 60%)" }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 50% 0%, rgba(245,158,11,0.6) 0%, transparent 60%)" }} />
        <div className="relative w-20 h-20 rounded-full flex items-center justify-center mb-4 animate-pop-in"
          style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24, #a855f7)", boxShadow: "0 0 40px rgba(245,158,11,0.35)" }}>
          <span style={{ fontSize: 36 }}>★</span>
        </div>
        <h1 className="relative" style={{ fontWeight: 900, fontSize: 26, color: "#fff", marginBottom: 6 }}>Astrey Premium</h1>
        <p className="relative text-center" style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", maxWidth: 260 }}>
          Разблокируй все возможности мессенджера
        </p>
      </div>

      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="grid grid-cols-2 gap-2">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex flex-col gap-1.5 p-3 rounded-2xl animate-fade-in"
              style={{ background: "var(--am-surface)", border: "1px solid var(--am-border)", animationDelay: `${i * 0.05}s` }}>
              <span style={{ fontSize: 22 }}>{f.icon}</span>
              <span style={{ fontWeight: 600, fontSize: 12, color: "var(--am-text)" }}>{f.title}</span>
              <span style={{ fontSize: 11, color: "var(--am-text-muted)", lineHeight: 1.3 }}>{f.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pb-6 flex-shrink-0">
        <button onClick={onGoWallet} className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-98"
          style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)", color: "#000", boxShadow: "0 4px 20px rgba(245,158,11,0.35)" }}>
          ★ Купить Premium в Кошельке
        </button>
        <p style={{ fontSize: 12, color: "var(--am-text-muted)", textAlign: "center", marginTop: 8 }}>
          Оплата звёздами из вашего кошелька
        </p>
      </div>
    </div>
  );
}
