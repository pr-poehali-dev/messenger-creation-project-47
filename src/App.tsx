import { useState, useEffect } from "react";
import ChatsPage from "@/pages/ChatsPage";
import ContactsPage from "@/pages/ContactsPage";
import ProfilePage from "@/pages/ProfilePage";
import WalletPage from "@/pages/WalletPage";
import PremiumPage from "@/pages/PremiumPage";
import AdminPage from "@/pages/AdminPage";
import AuthPage from "@/pages/AuthPage";
import Icon from "@/components/ui/icon";
import { authApi, walletApi } from "@/lib/api";

type Tab = "chats" | "contacts" | "wallet" | "premium" | "profile" | "admin";

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

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: "chats", label: "Чаты", icon: "MessageCircle" },
  { id: "contacts", label: "Контакты", icon: "Users" },
  { id: "wallet", label: "Кошелёк", icon: "Wallet" },
  { id: "premium", label: "Premium", icon: "Sparkles" },
  { id: "profile", label: "Профиль", icon: "User" },
];

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("chats");
  const [gifts, setGifts] = useState<Gift[]>([]);

  // Check saved session
  useEffect(() => {
    const check = async () => {
      const token = localStorage.getItem("am_token");
      if (!token) { setAuthLoading(false); return; }
      const res = await authApi.me();
      if (res.id) {
        setUser(res as AppUser);
        loadGifts();
      } else {
        localStorage.removeItem("am_token");
      }
      setAuthLoading(false);
    };
    check();
  }, []);

  const loadGifts = async () => {
    const res = await walletApi.myGifts();
    if (res.gifts) setGifts(res.gifts);
  };

  const onAuth = (u: object, token: string) => {
    localStorage.setItem("am_token", token);
    setUser(u as AppUser);
    loadGifts();
  };

  const onLogout = async () => {
    await authApi.logout();
    localStorage.removeItem("am_token");
    setUser(null);
    setTab("chats");
  };

  const onUpdateUser = (u: AppUser) => {
    setUser(u);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height: "100dvh", background: "var(--am-bg)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse" style={{ background: "linear-gradient(135deg, #1d4ed8, #2d8cf0)" }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>A</span>
          </div>
          <span style={{ color: "var(--am-text-muted)", fontSize: 13 }}>Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuth={onAuth} />;
  }

  const navItems = user.is_admin
    ? [...NAV, { id: "admin" as Tab, label: "Админ", icon: "ShieldCheck" }]
    : NAV;

  const initials = user.display_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const renderPage = () => {
    switch (tab) {
      case "chats": return <ChatsPage currentUserId={user.id} />;
      case "contacts": return <ContactsPage onOpenChat={() => setTab("chats")} />;
      case "profile": return <ProfilePage user={user} onUpdate={onUpdateUser} onLogout={onLogout} gifts={gifts} />;
      case "wallet": return <WalletPage currentUserId={user.id} isPremium={user.is_premium} />;
      case "premium": return <PremiumPage isPremium={user.is_premium} onGoWallet={() => setTab("wallet")} />;
      case "admin": return user.is_admin ? <AdminPage /> : null;
    }
  };

  return (
    <div className="flex flex-col" style={{ height: "100dvh", background: "var(--am-bg)", maxWidth: 480, margin: "0 auto", overflow: "hidden" }}>
      {/* Header */}
      <div className="am-glass flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--am-border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1d4ed8, #2d8cf0)", boxShadow: "0 0 16px rgba(45,140,240,0.4)" }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>A</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: "var(--am-text)", letterSpacing: "-0.3px" }}>
            Astrey<span style={{ color: "var(--am-accent)" }}>Messange</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {user.status === "online" && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--am-online)" }} />
              <span style={{ fontSize: 11, color: "var(--am-online)", fontWeight: 500 }}>онлайн</span>
            </div>
          )}
          {user.is_premium && <span style={{ fontSize: 14 }}>⭐</span>}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-transform hover:scale-110"
            style={{ background: user.avatar_color, color: "#fff" }}
            onClick={() => setTab("profile")}
          >
            {initials}
          </div>
        </div>
      </div>

      {/* Page */}
      <div className="flex-1 overflow-hidden" style={{ position: "relative" }}>
        <div key={tab} className="animate-fade-in h-full">
          {renderPage()}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="am-glass flex-shrink-0 flex items-center justify-around px-1 py-2" style={{ borderTop: "1px solid var(--am-border)" }}>
        {navItems.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all duration-200 active:scale-95"
              style={{ color: active ? "var(--am-accent)" : "var(--am-text-muted)", background: active ? "rgba(45,140,240,0.12)" : "transparent", minWidth: 48 }}
            >
              <Icon name={item.icon} size={20} />
              <span style={{ fontSize: 9, fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
