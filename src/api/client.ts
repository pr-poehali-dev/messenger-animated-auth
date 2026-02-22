const URLS = {
  auth: "https://functions.poehali.dev/24ac209f-63bb-4a47-95e6-f5087b441115",
  chats: "https://functions.poehali.dev/9f5b68e5-7ee9-43f4-9825-2162745ac1e8",
  messages: "https://functions.poehali.dev/432db9d0-81bc-44ac-98b9-530b59b29fc6",
};

function getToken(): string {
  return localStorage.getItem("messenger_token") || "";
}

async function call(fn: keyof typeof URLS, body: Record<string, unknown>) {
  const res = await fetch(URLS[fn], {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": getToken(),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка сервера");
  return data;
}

export const api = {
  // Auth
  checkPhone: (phone: string) => call("auth", { action: "check_phone", phone }),
  register: (name: string, phone: string, password: string, tag: string, avatar_url?: string) =>
    call("auth", { action: "register", name, phone, password, tag, avatar_url: avatar_url || "" }),
  login: (phone: string, password: string) =>
    call("auth", { action: "login", phone, password }),
  logout: () => call("auth", { action: "logout" }),
  getMe: () => call("auth", { action: "me" }),
  updateProfile: (updates: Record<string, unknown>) =>
    call("auth", { action: "update", ...updates }),

  // Chats
  getChats: () => call("chats", { action: "list" }),
  createChat: (other_user_id: number) =>
    call("chats", { action: "create", other_user_id }),
  searchUsers: (q: string, interests: string[]) =>
    call("chats", { action: "users", q, interests }),

  // Messages
  getMessages: (chat_id: number, before_id?: number) =>
    call("messages", { action: "list", chat_id, ...(before_id ? { before_id } : {}) }),
  sendMessage: (chat_id: number, text?: string, sticker?: string) =>
    call("messages", { action: "send", chat_id, text, sticker }),
  reactToMessage: (message_id: number, emoji: string) =>
    call("messages", { action: "react", message_id, emoji }),
  markRead: (chat_id: number) =>
    call("messages", { action: "read", chat_id }),
};
