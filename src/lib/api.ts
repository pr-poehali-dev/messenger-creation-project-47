const AUTH_URL = "https://functions.poehali.dev/861eb430-459a-4a0e-81fa-4a009e78d080";
const MESSAGES_URL = "https://functions.poehali.dev/b2fc2886-242d-4e40-a199-fbdb83771268";
const WALLET_URL = "https://functions.poehali.dev/a2d7210d-4a37-4e9f-a1e5-f9b9aea21b12";

function getToken() {
  return localStorage.getItem("am_token") || "";
}

async function callFn(baseUrl: string, path: string, method = "GET", body?: object) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// Auth
export const authApi = {
  sendOtp: (phone: string) => callFn(AUTH_URL, "/send_otp", "POST", { phone }),
  verifyOtp: (phone: string, code: string, name?: string) => callFn(AUTH_URL, "/verify_otp", "POST", { phone, code, name }),
  loginUsername: (username: string) => callFn(AUTH_URL, "/login_username", "POST", { username }),
  me: () => callFn(AUTH_URL, "/me", "GET"),
  updateProfile: (data: object) => callFn(AUTH_URL, "/update_profile", "PUT", data),
  logout: () => callFn(AUTH_URL, "/logout", "POST"),
  searchUsers: (q?: string) => callFn(AUTH_URL, q ? `/users?q=${encodeURIComponent(q)}` : "/users", "GET"),
};

// Messages
export const msgApi = {
  getChats: () => callFn(MESSAGES_URL, "/chats", "GET"),
  getMessages: (chatId: number, sinceId?: number) =>
    callFn(MESSAGES_URL, `/messages?chat_id=${chatId}${sinceId ? `&since_id=${sinceId}` : ""}`, "GET"),
  send: (chatId: number, text: string) => callFn(MESSAGES_URL, "/send", "POST", { chat_id: chatId, text }),
  createChat: (otherId: number) => callFn(MESSAGES_URL, "/create_chat", "POST", { other_id: otherId }),
  // Admin
  adminUsers: () => callFn(MESSAGES_URL, "/admin/users", "GET"),
  adminPayments: () => callFn(MESSAGES_URL, "/admin/payments", "GET"),
  adminBanUser: (userId: number) => callFn(MESSAGES_URL, "/admin/ban_user", "POST", { user_id: userId }),
  adminGivePremium: (userId: number, months: number) => callFn(MESSAGES_URL, "/admin/give_premium", "POST", { user_id: userId, months }),
  adminGiveStars: (userId: number, amount: number) => callFn(MESSAGES_URL, "/admin/give_stars", "POST", { user_id: userId, amount }),
  adminConfirmPayment: (paymentId: number, action: "confirm" | "reject") =>
    callFn(MESSAGES_URL, "/admin/confirm_payment", "POST", { payment_id: paymentId, action }),
  adminDeleteMessage: (messageId: number) => callFn(MESSAGES_URL, "/admin/message", "POST", { message_id: messageId }),
};

// Wallet & Gifts
export const walletApi = {
  balance: () => callFn(WALLET_URL, "/balance", "GET"),
  requestTopup: (packId: number) => callFn(WALLET_URL, "/request_topup", "POST", { pack_id: packId }),
  buyPremium: (planId: string) => callFn(WALLET_URL, "/buy_premium", "POST", { plan_id: planId }),
  giftsCatalog: () => callFn(WALLET_URL, "/gifts_catalog", "GET"),
  sendGift: (giftId: number, toUserId: number, message: string) =>
    callFn(WALLET_URL, "/send_gift", "POST", { gift_id: giftId, to_user_id: toUserId, message }),
  myGifts: () => callFn(WALLET_URL, "/my_gifts", "GET"),
};
