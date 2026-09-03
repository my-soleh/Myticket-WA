import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type {
  ActivityLog, AppState, AppSettings, Category, LogType, Notif, Page,
  SyncLog, Ticket, TicketStatus, User, WaNumber,
} from "./types";
import { STATUS_META } from "./types";
import { newTicket, uid, timeAgo } from "./engine";
import { buildSeed, INCOMING_POOL } from "./seed";

const DATA_KEY = "waticket:data:v1";
const THEME_KEY = "waticket:theme";
const SESSION_KEY = "waticket:session";

export interface ToastMsg {
  id: string;
  title: string;
  body?: string;
  type: "success" | "error" | "info" | "warn";
}

interface StoreValue {
  data: AppState;
  currentUser: User | null;
  theme: "light" | "dark";
  page: Page;
  collapsed: boolean;
  ticketsQuery: string;
  toasts: ToastMsg[];
  navigate: (p: Page) => void;
  setCollapsed: (v: boolean) => void;
  setTicketsQuery: (q: string) => void;
  setTheme: (t: "light" | "dark") => void;
  toast: (title: string, type?: ToastMsg["type"], body?: string) => void;
  dismissToast: (id: string) => void;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  simulateIncoming: () => Ticket | null;
  setTicketStatus: (id: string, status: TicketStatus, note?: string) => void;
  reassignTicket: (id: string, picId: string | null) => void;
  setTicketCategory: (id: string, categoryId: string | null) => void;
  replyTicket: (id: string, text: string) => void;
  saveCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  saveUser: (u: User) => void;
  deleteUser: (id: string) => void;
  saveNumber: (n: WaNumber) => void;
  deleteNumber: (id: string) => void;
  toggleNumber: (id: string) => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => void;
  markAllRead: () => void;
  runManualSync: () => Promise<void>;
  queueSync: (rows: number) => void;
  addLog: (type: LogType, action: string, detail: string) => void;
  resetDemo: () => void;
}

const Ctx = createContext<StoreValue | null>(null);

const loadData = (): AppState => {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed && Array.isArray(parsed.tickets)) return parsed;
    }
  } catch {
    /* abaikan */
  }
  return buildSeed();
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppState>(loadData);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw) as { userId: string };
      return loadData().users.find((u) => u.id === d.userId) ?? null;
    } catch {
      return null;
    }
  });
  const [theme, setThemeState] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [page, setPage] = useState<Page>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [ticketsQuery, setTicketsQuery] = useState("");
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const poolIdx = useRef(Math.floor(Math.random() * INCOMING_POOL.length));
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  /* persist */
  useEffect(() => {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
    } catch {
      /* kuota penuh — abaikan */
    }
  }, [data]);

  /* theme */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  /* accent branding */
  useEffect(() => {
    document.documentElement.dataset.accent = data.settings.accent;
  }, [data.settings.accent]);

  /* favicon dinamis mengikuti logo di pengaturan */
  useEffect(() => {
    const link = document.getElementById("favicon") as HTMLLinkElement | null;
    if (link) link.href = data.settings.logo ?? link.dataset.default ?? link.href;
  }, [data.settings.logo]);

  useEffect(() => {
    document.title = `${data.settings.appName} — ${data.settings.tagline}`;
  }, [data.settings.appName, data.settings.tagline]);

  const toast = useCallback((title: string, type: ToastMsg["type"] = "success", body?: string) => {
    const id = uid();
    setToasts((t) => [...t.slice(-3), { id, title, body, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4600);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const addLog = useCallback(
    (type: LogType, action: string, detail: string) => {
      const log: ActivityLog = {
        id: uid(),
        user: currentUser?.name ?? "Sistem",
        type,
        action,
        detail,
        time: Date.now(),
      };
      setData((s) => ({ ...s, activityLogs: [log, ...s.activityLogs].slice(0, 200) }));
    },
    [currentUser]
  );

  const pushNotif = (n: Omit<Notif, "id" | "time" | "read">) => {
    const notif: Notif = { ...n, id: uid(), time: Date.now(), read: false };
    setData((s) => ({ ...s, notifs: [notif, ...s.notifs].slice(0, 30) }));
  };

  /* antrian sinkronisasi Google Sheets (simulasi queue + worker) */
  const queueSync = useCallback(
    (rows: number) => {
      if (!data.settings.sheet.connected) return;
      if (data.settings.sheet.schedule !== "realtime") return;
      const id = uid();
      const entry: SyncLog = {
        id, time: Date.now(), rows, status: "pending", trigger: "otomatis",
        sheet: data.settings.sheet.sheetName,
      };
      setData((s) => ({ ...s, syncLogs: [entry, ...s.syncLogs].slice(0, 40) }));
      setTimeout(() => {
        setData((s) => ({
          ...s,
          syncLogs: s.syncLogs.map((l) => (l.id === id ? { ...l, status: "sukses" } : l)),
          settings: { ...s.settings, sheet: { ...s.settings.sheet, lastSync: Date.now() } },
        }));
      }, 1600);
    },
    [data.settings.sheet]
  );

  const runManualSync = useCallback(async () => {
    const id = uid();
    const entry: SyncLog = {
      id, time: Date.now(), rows: data.tickets.length, status: "pending",
      trigger: "manual", sheet: data.settings.sheet.sheetName,
    };
    setData((s) => ({ ...s, syncLogs: [entry, ...s.syncLogs].slice(0, 40) }));
    addLog("sync", "Sinkronisasi manual Google Sheets", `${data.tickets.length} baris tiket`);
    await new Promise((r) => setTimeout(r, 1900));
    const ok = Math.random() > 0.12;
    setData((s) => ({
      ...s,
      syncLogs: s.syncLogs.map((l) => (l.id === id ? { ...l, status: ok ? "sukses" : "gagal" } : l)),
      settings: ok
        ? { ...s.settings, sheet: { ...s.settings.sheet, lastSync: Date.now() } }
        : s.settings,
    }));
    if (ok) {
      toast("Sinkronisasi berhasil", "success", `${data.tickets.length} baris terkirim ke Google Sheets.`);
      pushNotif({ type: "sync", title: "Sinkronisasi berhasil", body: `${data.tickets.length} baris tiket tersinkron.` });
    } else {
      toast("Sinkronisasi gagal", "error", "Token OAuth kedaluwarsa. Coba hubungkan ulang di Pengaturan.");
    }
  }, [data.tickets.length, data.settings.sheet.sheetName, addLog, toast]);

  /* ---------- autentikasi ---------- */

  const login = useCallback(
    (email: string, password: string) => {
      const user = data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!user) return { ok: false, error: "Email tidak terdaftar di sistem." };
      if (user.password !== password) return { ok: false, error: "Password salah. Coba lagi." };
      if (!user.active) return { ok: false, error: "Akun dinonaktifkan. Hubungi Super Admin." };
      setCurrentUser(user);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
      setPage("dashboard");
      const log: ActivityLog = {
        id: uid(), user: user.name, type: "login", action: "Login berhasil",
        detail: `${user.email} · sesi baru`, time: Date.now(),
      };
      setData((s) => ({ ...s, activityLogs: [log, ...s.activityLogs].slice(0, 200) }));
      return { ok: true };
    },
    [data.users]
  );

  const logout = useCallback(() => {
    if (currentUser) addLog("login", "Logout", `${currentUser.email} mengakhiri sesi`);
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, [currentUser, addLog]);

  /* ---------- simulasi webhook ---------- */

  const simulateIncoming = useCallback((): Ticket | null => {
    const msg = INCOMING_POOL[poolIdx.current % INCOMING_POOL.length];
    poolIdx.current += 1;
    const s = dataRef.current;
    const t = newTicket(
      { reporterName: msg.name, reporterNumber: msg.num, message: msg.text },
      s.categories, s.tickets, s.users
    );
    const catName = s.categories.find((c) => c.id === t.categoryId)?.name ?? "Belum Terklasifikasi";
    const picName = s.users.find((u) => u.id === t.picId)?.name;
    const notif: Notif = {
      id: uid(), type: "ticket", time: Date.now(), read: false,
      title: `Pesan masuk dari ${msg.name}`,
      body: `${t.code} · ${catName}${picName ? ` → ${picName}` : " · perlu klasifikasi manual"}`,
    };
    const log: ActivityLog = {
      id: uid(), user: "Sistem", type: "webhook", action: "Pesan masuk via webhook",
      detail: `${msg.name} → ${t.code} (${catName})`, time: Date.now(),
    };
    setData((prev) => ({
      ...prev,
      tickets: [t, ...prev.tickets].slice(0, 120),
      notifs: [notif, ...prev.notifs].slice(0, 30),
      activityLogs: [log, ...prev.activityLogs].slice(0, 200),
    }));
    return t;
  }, []);

  /* ---------- tiket ---------- */

  const mutateTicket = (id: string, fn: (t: Ticket) => Ticket) => {
    setData((s) => ({
      ...s,
      tickets: s.tickets.map((t) => (t.id === id ? { ...fn(t), updatedAt: Date.now() } : t)),
    }));
  };

  const setTicketStatus = useCallback(
    (id: string, status: TicketStatus, note?: string) => {
      const before = data.tickets.find((t) => t.id === id);
      if (!before || before.status === status) return;
      mutateTicket(id, (t) => ({
        ...t,
        status,
        logs: [
          ...t.logs,
          { id: uid(), from: t.status, to: status, note: note || `Status diubah manual`, by: currentUser?.name ?? "Admin", time: Date.now() },
        ],
        conversation: [
          ...t.conversation,
          { id: uid(), from: "sistem", text: `Status: ${STATUS_META[t.status].label} → ${STATUS_META[status].label}${note ? ` · ${note}` : ""}`, time: Date.now() },
        ],
      }));
      addLog("ticket", "Ubah status tiket", `${before.code}: ${STATUS_META[before.status].label} → ${STATUS_META[status].label}`);
      queueSync(1);
      toast(`Status ${before.code} diperbarui`, "success", `Sekarang "${STATUS_META[status].label}".`);
    },
    [data.tickets, currentUser, addLog, queueSync, toast]
  );

  const reassignTicket = useCallback(
    (id: string, picId: string | null) => {
      const before = data.tickets.find((t) => t.id === id);
      if (!before) return;
      const pic = data.users.find((u) => u.id === picId);
      mutateTicket(id, (t) => ({
        ...t,
        picId,
        status: t.status === "baru" && picId ? "diteruskan" : t.status,
        logs: [
          ...t.logs,
          { id: uid(), from: t.status, to: t.status, note: pic ? `Reassign ke ${pic.name} · pesan diforward ulang` : "PIC dilepas", by: currentUser?.name ?? "Admin", time: Date.now() },
        ],
        conversation: [
          ...t.conversation,
          { id: uid(), from: "sistem", text: pic ? `Tiket direassign & diforward ulang ke ${pic.name} (${pic.waNumber})` : "PIC dilepas dari tiket", time: Date.now() },
        ],
      }));
      addLog("ticket", "Reassign tiket", `${before.code} → ${pic?.name ?? "tanpa PIC"}`);
      queueSync(1);
      if (pic) toast(`Tiket diforward ke ${pic.name}`, "info", `Pesan WhatsApp dikirim ke ${pic.waNumber}.`);
    },
    [data.tickets, data.users, currentUser, addLog, queueSync, toast]
  );

  const setTicketCategory = useCallback(
    (id: string, categoryId: string | null) => {
      const before = data.tickets.find((t) => t.id === id);
      if (!before) return;
      const cat = data.categories.find((c) => c.id === categoryId);
      mutateTicket(id, (t) => ({
        ...t,
        categoryId,
        logs: [
          ...t.logs,
          { id: uid(), from: t.status, to: t.status, note: `Klasifikasi manual → ${cat?.name ?? "Belum Terklasifikasi"}`, by: currentUser?.name ?? "Admin", time: Date.now() },
        ],
        conversation: [
          ...t.conversation,
          { id: uid(), from: "sistem", text: `Kategori diubah manual menjadi "${cat?.name ?? "Belum Terklasifikasi"}"`, time: Date.now() },
        ],
      }));
      addLog("ticket", "Klasifikasi manual", `${before.code} → ${cat?.name ?? "tanpa kategori"}`);
      queueSync(1);
    },
    [data.tickets, data.categories, currentUser, addLog, queueSync]
  );

  const replyTicket = useCallback(
    (id: string, text: string) => {
      mutateTicket(id, (t) => ({
        ...t,
        conversation: [
          ...t.conversation,
          { id: uid(), from: "admin", text, time: Date.now() },
        ],
      }));
      toast("Balasan terkirim", "success", "Pesan WhatsApp dikirim ke nomor pelapor.");
    },
    [toast]
  );

  /* ---------- CRUD ---------- */

  const saveCategory = useCallback(
    (c: Category) => {
      setData((s) => {
        const exists = s.categories.some((x) => x.id === c.id);
        return { ...s, categories: exists ? s.categories.map((x) => (x.id === c.id ? c : x)) : [...s.categories, c] };
      });
      addLog("category", "Simpan kategori", `${c.name} · ${c.keywords.length} kata kunci`);
      toast("Kategori tersimpan", "success", c.name);
    },
    [addLog, toast]
  );

  const deleteCategory = useCallback(
    (id: string) => {
      const cat = data.categories.find((c) => c.id === id);
      setData((s) => ({
        ...s,
        categories: s.categories.filter((c) => c.id !== id),
        tickets: s.tickets.map((t) => (t.categoryId === id ? { ...t, categoryId: null } : t)),
      }));
      addLog("category", "Hapus kategori", cat?.name ?? id);
      toast("Kategori dihapus", "info", "Tiket terkait dipindah ke Belum Terklasifikasi.");
    },
    [data.categories, addLog, toast]
  );

  const saveUser = useCallback(
    (u: User) => {
      setData((s) => {
        const exists = s.users.some((x) => x.id === u.id);
        return { ...s, users: exists ? s.users.map((x) => (x.id === u.id ? u : x)) : [...s.users, u] };
      });
      addLog("user", "Simpan pengguna", `${u.name} (${u.role})`);
      toast("Pengguna tersimpan", "success", u.name);
    },
    [addLog, toast]
  );

  const deleteUser = useCallback(
    (id: string) => {
      const u = data.users.find((x) => x.id === id);
      setData((s) => ({
        ...s,
        users: s.users.filter((x) => x.id !== id),
        tickets: s.tickets.map((t) => (t.picId === id ? { ...t, picId: null } : t)),
      }));
      addLog("user", "Hapus pengguna", u?.name ?? id);
      toast("Pengguna dihapus", "info");
    },
    [data.users, addLog, toast]
  );

  const saveNumber = useCallback(
    (n: WaNumber) => {
      setData((s) => {
        const exists = s.numbers.some((x) => x.id === n.id);
        return { ...s, numbers: exists ? s.numbers.map((x) => (x.id === n.id ? n : x)) : [...s.numbers, n] };
      });
      addLog("settings", "Simpan nomor WhatsApp", `${n.label} · ${n.number}`);
      toast("Nomor tersimpan", "success", `${n.label} (${n.number})`);
    },
    [addLog, toast]
  );

  const deleteNumber = useCallback(
    (id: string) => {
      setData((s) => ({ ...s, numbers: s.numbers.filter((x) => x.id !== id) }));
      addLog("settings", "Hapus nomor WhatsApp", id);
      toast("Nomor dihapus", "info");
    },
    [addLog, toast]
  );

  const toggleNumber = useCallback(
    async (id: string) => {
      await new Promise((r) => setTimeout(r, 1400));
      setData((s) => ({
        ...s,
        numbers: s.numbers.map((n) =>
          n.id === id ? { ...n, connected: !n.connected, lastPing: Date.now() } : n
        ),
      }));
      const n = data.numbers.find((x) => x.id === id);
      if (n) {
        const nowOn = !n.connected;
        toast(
          nowOn ? "Sesi terhubung" : "Sesi diputus",
          nowOn ? "success" : "warn",
          `${n.label} · scan QR selesai (simulasi perangkat)`
        );
        addLog("settings", nowOn ? "Koneksi ulang nomor" : "Putus koneksi nomor", `${n.label} · ${n.number}`);
      }
    },
    [data.numbers, addLog, toast]
  );

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      setData((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
    },
    []
  );

  const markAllRead = useCallback(() => {
    setData((s) => ({ ...s, notifs: s.notifs.map((n) => ({ ...n, read: true })) }));
  }, []);

  const resetDemo = useCallback(() => {
    localStorage.removeItem(DATA_KEY);
    window.location.reload();
  }, []);

  const value: StoreValue = {
    data, currentUser, theme, page, collapsed, ticketsQuery, toasts,
    navigate: setPage, setCollapsed, setTicketsQuery, setTheme: setThemeState,
    toast, dismissToast, login, logout,
    simulateIncoming, setTicketStatus, reassignTicket, setTicketCategory, replyTicket,
    saveCategory, deleteCategory, saveUser, deleteUser, saveNumber, deleteNumber, toggleNumber,
    updateSettings, markAllRead, runManualSync, queueSync, addLog, resetDemo,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useStore = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore harus dipakai di dalam StoreProvider");
  return v;
};

export const unreadCount = (n: Notif[]) => n.filter((x) => !x.read).length;

export const notifLabel = (t: number) => timeAgo(t);
