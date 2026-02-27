import { useState } from "react";
import { authApi } from "@/lib/api";
import Icon from "@/components/ui/icon";

type Step = "phone" | "otp" | "name";

interface Props {
  onAuth: (user: object, token: string) => void;
}

export default function AuthPage({ onAuth }: Props) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [otpCode, setOtpCode] = useState(""); // для отображения (MVP без SMS)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isNew, setIsNew] = useState(false);

  const formatPhone = (v: string) => {
    let clean = v.replace(/\D/g, "");
    if (clean.startsWith("8")) clean = "7" + clean.slice(1);
    if (!clean.startsWith("7") && clean.length > 0) clean = "7" + clean;
    return "+" + clean.slice(0, 11);
  };

  const sendOtp = async () => {
    if (!phone || phone.length < 8) { setError("Введите корректный номер"); return; }
    setLoading(true); setError("");
    const res = await authApi.sendOtp(phone);
    setLoading(false);
    if (res.ok) {
      setOtpCode(res.code || ""); // в MVP код возвращается в ответе
      setStep("otp");
    } else {
      setError(res.error || "Ошибка");
    }
  };

  const verifyOtp = async () => {
    if (!code || code.length !== 6) { setError("Введите 6-значный код"); return; }
    setLoading(true); setError("");
    const res = await authApi.verifyOtp(phone, code, name);
    setLoading(false);
    if (res.ok) {
      localStorage.setItem("am_token", res.token);
      onAuth(res.user, res.token);
    } else {
      setError(res.error || "Неверный код");
    }
  };

  const submitName = () => {
    if (!name.trim()) { setError("Введите имя"); return; }
    verifyOtp();
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
      style={{ background: "var(--am-bg)" }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center mb-10 animate-fade-in">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
          style={{
            background: "linear-gradient(135deg, #1d4ed8, #2d8cf0, #7c3aed)",
            boxShadow: "0 0 40px rgba(45,140,240,0.4)",
          }}
        >
          <span style={{ fontSize: 36, fontWeight: 900, color: "#fff" }}>A</span>
        </div>
        <h1 style={{ fontWeight: 900, fontSize: 28, color: "var(--am-text)", letterSpacing: "-0.5px" }}>
          Astrey<span style={{ color: "var(--am-accent)" }}>Messange</span>
        </h1>
        <p style={{ fontSize: 14, color: "var(--am-text-muted)", marginTop: 4 }}>
          Лучший мессенджер для общения
        </p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-3xl p-6 animate-slide-up"
        style={{ background: "var(--am-surface)", border: "1px solid var(--am-border)" }}
      >
        {step === "phone" && (
          <>
            <h2 style={{ fontWeight: 700, fontSize: 20, color: "var(--am-text)", marginBottom: 6 }}>
              Войти или зарегистрироваться
            </h2>
            <p style={{ fontSize: 13, color: "var(--am-text-muted)", marginBottom: 20 }}>
              Введите номер телефона — мы отправим код
            </p>
            <div className="relative mb-4">
              <div
                className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
                style={{ background: "var(--am-surface2)", border: "1px solid var(--am-border)" }}
              >
                <Icon name="Phone" size={18} style={{ color: "var(--am-text-muted)", flexShrink: 0 }} />
                <input
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                  placeholder="+7 999 123-45-67"
                  type="tel"
                  className="flex-1 outline-none bg-transparent"
                  style={{ fontSize: 15, color: "var(--am-text)", fontFamily: "inherit" }}
                />
              </div>
            </div>
            {error && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 12 }}>{error}</p>}
            <button
              onClick={sendOtp}
              disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-98"
              style={{ background: "var(--am-accent)", color: "#fff", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Отправляем..." : "Получить код →"}
            </button>
          </>
        )}

        {step === "otp" && (
          <>
            <button
              onClick={() => setStep("phone")}
              className="flex items-center gap-1 mb-4"
              style={{ color: "var(--am-accent)", fontSize: 13 }}
            >
              <Icon name="ChevronLeft" size={16} /> Назад
            </button>
            <h2 style={{ fontWeight: 700, fontSize: 20, color: "var(--am-text)", marginBottom: 6 }}>
              Введите код
            </h2>
            <p style={{ fontSize: 13, color: "var(--am-text-muted)", marginBottom: 4 }}>
              Код отправлен на <strong style={{ color: "var(--am-text)" }}>{phone}</strong>
            </p>
            {otpCode && (
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl mb-4"
                style={{ background: "rgba(45,220,191,0.12)", border: "1px solid rgba(45,220,191,0.3)" }}
              >
                <Icon name="Info" size={14} style={{ color: "var(--am-online)" }} />
                <span style={{ fontSize: 12, color: "var(--am-online)" }}>
                  Тестовый код: <strong>{otpCode}</strong>
                </span>
              </div>
            )}
            <div
              className="flex items-center gap-2 px-4 py-3.5 rounded-2xl mb-4"
              style={{ background: "var(--am-surface2)", border: "1px solid var(--am-border)" }}
            >
              <Icon name="Key" size={18} style={{ color: "var(--am-text-muted)", flexShrink: 0 }} />
              <input
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); if (e.target.value.length === 6) verifyOtp(); }}
                onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
                placeholder="000000"
                maxLength={6}
                type="text"
                inputMode="numeric"
                className="flex-1 outline-none bg-transparent text-center tracking-widest"
                style={{ fontSize: 22, color: "var(--am-text)", fontFamily: "inherit", letterSpacing: "0.3em" }}
              />
            </div>
            {error && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 12 }}>{error}</p>}
            <button
              onClick={verifyOtp}
              disabled={loading || code.length !== 6}
              className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-98"
              style={{ background: "var(--am-accent)", color: "#fff", opacity: (loading || code.length !== 6) ? 0.6 : 1 }}
            >
              {loading ? "Проверяем..." : "Войти"}
            </button>
          </>
        )}
      </div>

      <p style={{ fontSize: 12, color: "var(--am-text-dim)", marginTop: 24, textAlign: "center" }}>
        Регистрируясь, вы соглашаетесь с условиями использования AstreyMessange
      </p>
    </div>
  );
}
