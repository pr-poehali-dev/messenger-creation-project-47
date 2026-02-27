import { useState } from "react";
import ChatsPage from "@/pages/ChatsPage";
import ContactsPage from "@/pages/ContactsPage";
import ProfilePage from "@/pages/ProfilePage";
import WalletPage from "@/pages/WalletPage";
import PremiumPage from "@/pages/PremiumPage";
import Icon from "@/components/ui/icon";

type Tab = "chats" | "contacts" | "profile" | "wallet" | "premium";

const NAV = [
  { id: "chats", label: "Чаты", icon: "MessageCircle" },
  { id: "contacts", label: "Контакты", icon: "Users" },
  { id: "wallet", label: "Кошелёк", icon: "Wallet" },
  { id: "premium", label: "Premium", icon: "Sparkles" },
  { id: "profile", label: "Профиль", icon: "User" },
] as const;

export interface UserProfile {
  name: string;
  username: string;
  avatar: string;
  status: "online" | "offline";
  avatarColor: string;
}

export default function App() {
  const [tab, setTab] = useState<Tab>("chats");
  const [isPremium, setIsPremium] = useState(false);
  const [stars, setStars] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({
    name: "Алексей Орлов",
    username: "@astrey_user",
    avatar: "АО",
    status: "online",
    avatarColor: "#2d8cf0",
  });

  const renderPage = () => {
    switch (tab) {
      case "chats": return <ChatsPage profile={profile} />;
      case "contacts": return <ContactsPage onOpenChat={() => setTab("chats")} />;
      case "profile": return <ProfilePage profile={profile} setProfile={setProfile} isPremium={isPremium} />;
      case "wallet": return <WalletPage stars={stars} setStars={setStars} />;
      case "premium": return <PremiumPage isPremium={isPremium} setIsPremium={setIsPremium} stars={stars} setStars={setStars} />;
    }
  };

  return (
    <div
      className="flex flex-col"
      style={{
        height: "100dvh",
        background: "var(--am-bg)",
        maxWidth: 480,
        margin: "0 auto",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        className="am-glass flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--am-border)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1d4ed8, #2d8cf0)", boxShadow: "0 0 16px rgba(45,140,240,0.4)" }}
          >
            <span style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>A</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: "var(--am-text)", letterSpacing: "-0.3px" }}>
            Astrey<span style={{ color: "var(--am-accent)" }}>Messange</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {profile.status === "online" && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--am-online)" }} />
              <span style={{ fontSize: 11, color: "var(--am-online)", fontWeight: 500 }}>онлайн</span>
            </div>
          )}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-transform hover:scale-110"
            style={{ background: profile.avatarColor, color: "#fff" }}
            onClick={() => setTab("profile")}
          >
            {profile.avatar}
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
      <div
        className="am-glass flex-shrink-0 flex items-center justify-around px-2 py-2"
        style={{ borderTop: "1px solid var(--am-border)" }}
      >
        {NAV.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id as Tab)}
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 active:scale-95"
              style={{
                color: active ? "var(--am-accent)" : "var(--am-text-muted)",
                background: active ? "rgba(45,140,240,0.12)" : "transparent",
                minWidth: 56,
              }}
            >
              <Icon name={item.icon} size={20} />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
