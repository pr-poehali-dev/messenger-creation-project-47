import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { walletApi } from "@/lib/api";

interface Pack { id: number; stars: number; rub: number; }
interface Plan { id: string; label: string; months: number; stars: number; }
interface Tx { type: string; amount: number; description: string; created_at: string; }
interface Requisites { phone: string; sbp: string; bank: string; }

interface GiftCatalogItem {
  id: number;
  name: string;
  emoji: string;
  description: string;
  price_stars: number;
  rarity: string;
  is_premium_only: boolean;
  gradient_from: string;
  gradient_to: string;
}

interface SendGiftProps {
  gift: GiftCatalogItem;
  currentUserId: number;
  onBack: () => void;
  onSent: () => void;
  contacts: { id: number; display_name: string; avatar_color: string }[];
}

const RARITY_LABEL: Record<string, string> = { common: "Обычный", rare: "Редкий", epic: "Эпический", legendary: "Легендарный" };
const RARITY_COLOR: Record<string, string> = { common: "#6b7a99", rare: "#3b82f6", epic: "#a855f7", legendary: "#f59e0b" };

function SendGiftModal({ gift, onBack, onSent, contacts }: SendGiftProps) {
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    if (!selectedUser) { setError("Выберите получателя"); return; }
    setSending(true);
    const res = await walletApi.sendGift(gift.id, selectedUser, message);
    setSending(false);
    if (res.ok) onSent();
    else setError(res.error || "Ошибка отправки");
  };

  return (
    <div className="flex flex-col h-full animate-slide-up">
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--am-border)" }}>
        <button onClick={onBack} style={{ color: "var(--am-accent)" }}><Icon name="ChevronLeft" size={22} /></button>
        <span style={{ fontWeight: 600, fontSize: 16, color: "var(--am-text)" }}>Отправить подарок</span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 flex flex-col gap-4">
        {/* Gift preview */}
        <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: `linear-gradient(135deg, ${gift.gradient_from}20, ${gift.gradient_to}20)`, border: `1px solid ${RARITY_COLOR[gift.rarity]}30` }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${gift.gradient_from}, ${gift.gradient_to})` }}>
            <span style={{ fontSize: 32 }}>{gift.emoji}</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--am-text)" }}>{gift.name}</div>
            <div style={{ fontSize: 12, color: RARITY_COLOR[gift.rarity], fontWeight: 600 }}>{RARITY_LABEL[gift.rarity]}</div>
            <div style={{ fontSize: 13, color: "var(--am-text-muted)", marginTop: 2 }}>{gift.price_stars} ⭐</div>
          </div>
        </div>

        {/* Select recipient */}
        <div>
          <label style={{ fontSize: 12, color: "var(--am-text-muted)", fontWeight: 600, marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: "0.6px" }}>Кому</label>
          <div className="flex flex-col gap-2">
            {contacts.map((c) => (
              <button key={c.id} onClick={() => setSelectedUser(c.id)} className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all active:scale-98"
                style={{ background: selectedUser === c.id ? "rgba(45,140,240,0.12)" : "var(--am-surface)", border: selectedUser === c.id ? "1.5px solid var(--am-accent)" : "1px solid var(--am-border)" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: c.avatar_color, color: "#fff" }}>
                  {c.display_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <span style={{ fontSize: 14, color: "var(--am-text)", fontWeight: 500 }}>{c.display_name}</span>
                {selectedUser === c.id && <Icon name="Check" size={16} style={{ color: "var(--am-accent)", marginLeft: "auto" }} />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--am-text-muted)", fontWeight: 600, marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: "0.6px" }}>Сообщение (необязательно)</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Добавьте личное сообщение..." rows={2} className="w-full outline-none resize-none"
            style={{ background: "var(--am-surface2)", border: "1px solid var(--am-border)", borderRadius: 14, padding: "12px 14px", color: "var(--am-text)", fontSize: 14, fontFamily: "inherit" }} />
        </div>

        {error && <p style={{ fontSize: 13, color: "#ef4444" }}>{error}</p>}

        <button onClick={send} disabled={sending || !selectedUser} className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-98"
          style={{ background: selectedUser ? `linear-gradient(135deg, ${gift.gradient_from}, ${gift.gradient_to})` : "var(--am-surface2)", color: selectedUser ? "#fff" : "var(--am-text-muted)" }}>
          {sending ? "Отправляем..." : `Подарить за ${gift.price_stars} ⭐`}
        </button>
      </div>
    </div>
  );
}

export default function WalletPage({ currentUserId, isPremium }: { currentUserId: number; isPremium: boolean }) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [requisites, setRequisites] = useState<Requisites | null>(null);
  const [gifts, setGifts] = useState<GiftCatalogItem[]>([]);
  const [contacts, setContacts] = useState<{ id: number; display_name: string; avatar_color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"wallet" | "gifts">("wallet");
  const [selectedGift, setSelectedGift] = useState<GiftCatalogItem | null>(null);
  const [buyingPack, setBuyingPack] = useState<number | null>(null);
  const [buyingPlan, setBuyingPlan] = useState<string | null>(null);
  const [topupResult, setTopupResult] = useState<{ payment_id: number; stars: number; rub: number; comment: string; requisites: Requisites } | null>(null);
  const [planResult, setPlanResult] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("month_3");
  const [giftSentMsg, setGiftSentMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      const [balRes, giftRes] = await Promise.all([walletApi.balance(), walletApi.giftsCatalog()]);
      if (balRes.stars_balance !== undefined) {
        setBalance(balRes.stars_balance);
        setTransactions(balRes.transactions || []);
        setPacks(balRes.star_packs || []);
        setPlans(balRes.premium_plans || []);
        setRequisites(balRes.requisites || null);
      }
      if (giftRes.gifts) setGifts(giftRes.gifts);
      setLoading(false);
    };
    load();
  }, [currentUserId]);

  useEffect(() => {
    // Load contacts for gift sending
    import("@/lib/api").then(({ authApi }) => {
      authApi.searchUsers().then((res) => {
        if (res.users) setContacts(res.users.filter((u: { id: number }) => u.id !== currentUserId));
      });
    });
  }, [currentUserId]);

  const requestTopup = async (packId: number) => {
    setBuyingPack(packId);
    const res = await walletApi.requestTopup(packId);
    setBuyingPack(null);
    if (res.ok) setTopupResult(res);
  };

  const buyPremium = async () => {
    setBuyingPlan(selectedPlan);
    const res = await walletApi.buyPremium(selectedPlan);
    setBuyingPlan(null);
    if (res.ok) {
      setPlanResult(res.message || "Premium активирован!");
      const balRes = await walletApi.balance();
      if (balRes.stars_balance !== undefined) setBalance(balRes.stars_balance);
    } else {
      setPlanResult(res.error || "Ошибка");
    }
  };

  const onGiftSent = async () => {
    setSelectedGift(null);
    setGiftSentMsg("Подарок успешно отправлен! 🎁");
    const balRes = await walletApi.balance();
    if (balRes.stars_balance !== undefined) setBalance(balRes.stars_balance);
    setTimeout(() => setGiftSentMsg(""), 3000);
  };

  if (selectedGift) {
    return <SendGiftModal gift={selectedGift} currentUserId={currentUserId} onBack={() => setSelectedGift(null)} onSent={onGiftSent} contacts={contacts} />;
  }

  if (topupResult) {
    return (
      <div className="flex flex-col h-full overflow-y-auto scrollbar-hide px-4 py-6 animate-fade-in">
        <button onClick={() => setTopupResult(null)} className="flex items-center gap-1 mb-4" style={{ color: "var(--am-accent)", fontSize: 13 }}>
          <Icon name="ChevronLeft" size={16} /> Назад
        </button>
        <div className="flex flex-col items-center py-6 gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1d4ed8, #2d8cf0)", boxShadow: "0 0 30px rgba(45,140,240,0.4)" }}>
            <span style={{ fontSize: 32 }}>⭐</span>
          </div>
          <h2 style={{ fontWeight: 700, fontSize: 20, color: "var(--am-text)" }}>Оплата #{topupResult.payment_id}</h2>
          <p style={{ fontSize: 14, color: "var(--am-text-muted)", textAlign: "center" }}>
            Переведите <strong style={{ color: "var(--am-text)" }}>{topupResult.rub} ₽</strong> на указанные реквизиты.<br />
            После подтверждения вам начислят <strong style={{ color: "var(--am-accent)" }}>{topupResult.stars} ⭐</strong>
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { label: "Номер телефона", value: topupResult.requisites.phone },
            { label: "Система", value: topupResult.requisites.sbp },
            { label: "Банки", value: topupResult.requisites.bank },
            { label: "Комментарий", value: topupResult.comment },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{ background: "var(--am-surface)", border: "1px solid var(--am-border)" }}>
              <span style={{ fontSize: 12, color: "var(--am-text-muted)" }}>{row.label}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--am-text)" }}>{row.value}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 px-4 py-3 rounded-2xl" style={{ background: "rgba(45,220,191,0.08)", border: "1px solid rgba(45,220,191,0.2)" }}>
          <p style={{ fontSize: 12, color: "var(--am-online)", textAlign: "center", lineHeight: 1.5 }}>
            После перевода администратор подтвердит оплату в течение 15-30 минут. Звёзды появятся на вашем балансе автоматически.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
      {/* Balance */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="relative overflow-hidden rounded-3xl p-5" style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2d8cf0 60%, #7c3aed 100%)" }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)" }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span style={{ fontSize: 18 }}>⭐</span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Ваш баланс</span>
            </div>
            <div style={{ fontSize: 48, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{loading ? "..." : balance}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>AstreyCoins</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pb-3 flex gap-2 flex-shrink-0">
        {[{ id: "wallet", label: "Кошелёк" }, { id: "gifts", label: "Подарки" }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as "wallet" | "gifts")} className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: tab === t.id ? "var(--am-accent)" : "var(--am-surface2)", color: tab === t.id ? "#fff" : "var(--am-text-muted)", border: tab === t.id ? "none" : "1px solid var(--am-border)" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "wallet" && (
        <>
          {/* Premium plans */}
          <div className="px-4 pb-3 flex-shrink-0">
            <div style={{ fontWeight: 600, fontSize: 15, color: "var(--am-text)", marginBottom: 10 }}>Купить Premium</div>
            {planResult && <p style={{ fontSize: 13, color: isPremium ? "var(--am-online)" : "#ef4444", marginBottom: 8 }}>{planResult}</p>}
            <div className="flex flex-col gap-2 mb-3">
              {plans.map((plan) => (
                <button key={plan.id} onClick={() => setSelectedPlan(plan.id)} className="flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all active:scale-98"
                  style={{ background: selectedPlan === plan.id ? "rgba(45,140,240,0.12)" : "var(--am-surface)", border: selectedPlan === plan.id ? "1.5px solid var(--am-accent)" : "1px solid var(--am-border)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: selectedPlan === plan.id ? "var(--am-accent)" : "var(--am-border)", background: selectedPlan === plan.id ? "var(--am-accent)" : "transparent" }}>
                      {selectedPlan === plan.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 14, color: "var(--am-text)" }}>{plan.label}</span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "var(--am-text)" }}>{plan.stars} ⭐</span>
                </button>
              ))}
            </div>
            <button onClick={buyPremium} disabled={!!buyingPlan} className="w-full py-3.5 rounded-2xl font-bold text-base transition-all active:scale-98"
              style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)", color: "#000", opacity: buyingPlan ? 0.7 : 1, boxShadow: "0 4px 20px rgba(245,158,11,0.3)" }}>
              {buyingPlan ? "Активация..." : "★ Активировать Premium"}
            </button>
          </div>

          {/* Buy stars */}
          <div className="px-4 pb-3 flex-shrink-0">
            <div style={{ fontWeight: 600, fontSize: 15, color: "var(--am-text)", marginBottom: 10 }}>Пополнить баланс</div>
            <div className="grid grid-cols-2 gap-2">
              {packs.map((pack) => (
                <button key={pack.id} onClick={() => requestTopup(pack.id)} disabled={buyingPack !== null} className="flex flex-col items-center py-4 px-3 rounded-2xl transition-all active:scale-95"
                  style={{ background: "var(--am-surface)", border: "1px solid var(--am-border)" }}>
                  <span style={{ fontSize: 24, marginBottom: 4 }}>⭐</span>
                  <span style={{ fontWeight: 700, fontSize: 18, color: "var(--am-text)" }}>{pack.stars}</span>
                  <span style={{ fontSize: 11, color: "var(--am-text-muted)", marginBottom: 8 }}>звёзд</span>
                  <div className="px-4 py-1.5 rounded-xl text-sm font-semibold w-full text-center" style={{ background: buyingPack === pack.id ? "var(--am-online)" : "var(--am-accent)", color: "#fff" }}>
                    {buyingPack === pack.id ? "..." : `${pack.rub} ₽`}
                  </div>
                </button>
              ))}
            </div>
            {requisites && (
              <div className="mt-3 px-4 py-3 rounded-2xl" style={{ background: "var(--am-surface)", border: "1px solid var(--am-border)" }}>
                <p style={{ fontSize: 12, color: "var(--am-text-muted)", lineHeight: 1.5 }}>
                  Оплата через СБП: <strong style={{ color: "var(--am-text)" }}>{requisites.phone}</strong><br />
                  {requisites.bank}
                </p>
              </div>
            )}
          </div>

          {/* Transactions */}
          <div className="px-4 pb-6 flex-shrink-0">
            <div style={{ fontWeight: 600, fontSize: 15, color: "var(--am-text)", marginBottom: 10 }}>История</div>
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--am-surface)", border: "1px solid var(--am-border)" }}>
              {transactions.length === 0 && <div className="px-4 py-6 text-center" style={{ color: "var(--am-text-muted)", fontSize: 13 }}>Транзакций пока нет</div>}
              {transactions.map((tx, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: i < transactions.length - 1 ? "1px solid var(--am-border)" : "none" }}>
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: tx.amount > 0 ? "rgba(45,220,191,0.12)" : "rgba(239,68,68,0.12)" }}>
                    <Icon name={tx.amount > 0 ? "ArrowDownLeft" : "ArrowUpRight"} size={16} style={{ color: tx.amount > 0 ? "var(--am-online)" : "#ef4444" }} />
                  </div>
                  <div className="flex-1">
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--am-text)" }}>{tx.description || tx.type}</div>
                    <div style={{ fontSize: 11, color: "var(--am-text-muted)" }}>{new Date(tx.created_at).toLocaleString("ru", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: tx.amount > 0 ? "var(--am-online)" : "#ef4444" }}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount} ⭐
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "gifts" && (
        <div className="px-4 pb-6 flex-shrink-0">
          {giftSentMsg && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl mb-3 animate-pop-in" style={{ background: "rgba(45,220,191,0.12)", border: "1px solid rgba(45,220,191,0.3)" }}>
              <span style={{ fontSize: 18 }}>🎁</span>
              <span style={{ fontSize: 13, color: "var(--am-online)" }}>{giftSentMsg}</span>
            </div>
          )}
          <div style={{ fontWeight: 600, fontSize: 15, color: "var(--am-text)", marginBottom: 4 }}>Витрина подарков</div>
          <p style={{ fontSize: 12, color: "var(--am-text-muted)", marginBottom: 12 }}>Получатель получит половину стоимости в звёздах</p>
          <div className="grid grid-cols-2 gap-3">
            {gifts.map((g, i) => (
              <button key={g.id} onClick={() => setSelectedGift(g)} disabled={balance < g.price_stars && !g.is_premium_only}
                className="flex flex-col items-start p-4 rounded-2xl transition-all active:scale-95 animate-fade-in"
                style={{ background: `linear-gradient(135deg, ${g.gradient_from}15, ${g.gradient_to}15)`, border: `1px solid ${RARITY_COLOR[g.rarity]}25`, animationDelay: `${i * 0.05}s`, opacity: balance < g.price_stars ? 0.6 : 1 }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2" style={{ background: `linear-gradient(135deg, ${g.gradient_from}, ${g.gradient_to})` }}>
                  <span style={{ fontSize: 24 }}>{g.emoji}</span>
                </div>
                {g.is_premium_only && <span className="text-xs font-bold px-1.5 py-0.5 rounded-md mb-1" style={{ background: "rgba(245,158,11,0.2)", color: "var(--am-premium)" }}>Premium</span>}
                <span style={{ fontWeight: 600, fontSize: 13, color: "var(--am-text)" }}>{g.name}</span>
                <span style={{ fontSize: 10, color: RARITY_COLOR[g.rarity], fontWeight: 600 }}>{RARITY_LABEL[g.rarity]}</span>
                <span style={{ fontSize: 12, color: "var(--am-text-muted)", marginTop: 4 }}>{g.price_stars} ⭐</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
