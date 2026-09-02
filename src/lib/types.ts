export type Role = "superadmin" | "admin" | "pic";
export type Page =
  | "dashboard"
  | "tickets"
  | "categories"
  | "users"
  | "reports"
  | "settings"
  | "logs";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  active: boolean;
  waNumber: string;
  color: string;
  isPic: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string; // key of CAT_COLORS
  keywords: string[];
  picIds: string[];
  active: boolean;
  isSystem?: boolean;
}

export type TicketStatus =
  | "baru"
  | "diteruskan"
  | "diproses"
  | "menunggu"
  | "selesai"
  | "ditolak";

export type Priority = "rendah" | "normal" | "tinggi";

export interface ChatMsg {
  id: string;
  from: "pelapor" | "admin" | "pic" | "sistem";
  text: string;
  time: number;
}

export interface TicketLog {
  id: string;
  from: string;
  to: string;
  note: string;
  by: string;
  time: number;
}

export interface Attachment {
  name: string;
  kind: "image" | "doc";
  size: string;
}

export interface Ticket {
  id: string;
  code: string;
  reporterName: string;
  reporterNumber: string;
  message: string;
  categoryId: string | null;
  picId: string | null;
  status: TicketStatus;
  priority: Priority;
  createdAt: number;
  updatedAt: number;
  slaHours: number;
  conversation: ChatMsg[];
  logs: TicketLog[];
  attachments: Attachment[];
}

export interface WaNumber {
  id: string;
  label: string;
  number: string;
  type: "admin" | "pic";
  provider: string;
  connected: boolean;
  lastPing: number;
}

export type LogType =
  | "login"
  | "ticket"
  | "category"
  | "user"
  | "export"
  | "settings"
  | "sync"
  | "webhook";

export interface ActivityLog {
  id: string;
  user: string;
  type: LogType;
  action: string;
  detail: string;
  time: number;
}

export interface SyncLog {
  id: string;
  time: number;
  rows: number;
  status: "sukses" | "gagal" | "pending";
  trigger: "otomatis" | "manual";
  sheet: string;
}

export interface Notif {
  id: string;
  type: "ticket" | "overdue" | "sync" | "system";
  title: string;
  body: string;
  time: number;
  read: boolean;
}

export interface ProviderSettings {
  provider: string;
  apiKey: string;
  webhook: string;
  autoReply: boolean;
  autoForward: boolean;
}

export interface SheetSettings {
  connected: boolean;
  spreadsheetId: string;
  sheetName: string;
  schedule: "realtime" | "15m" | "hourly" | "daily";
  lastSync: number | null;
}

export interface AppSettings {
  appName: string;
  tagline: string;
  logo: string | null; // dataURL unggahan admin
  logoPreset: number;
  accent: "emerald" | "teal" | "sky" | "amber" | "rose";
  themeDefault: "light" | "dark";
  provider: ProviderSettings;
  sheet: SheetSettings;
  roles: Record<string, { view: boolean; manage: boolean }>;
}

export interface AppState {
  users: User[];
  categories: Category[];
  tickets: Ticket[];
  numbers: WaNumber[];
  activityLogs: ActivityLog[];
  syncLogs: SyncLog[];
  notifs: Notif[];
  settings: AppSettings;
}

/* ---------- Konfigurasi tampilan ---------- */

export const STATUS_META: Record<
  TicketStatus,
  { label: string; badge: string; dot: string; hex: string }
> = {
  baru: {
    label: "Baru",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    dot: "bg-sky-500",
    hex: "#38a8e0",
  },
  diteruskan: {
    label: "Diteruskan",
    badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
    dot: "bg-cyan-500",
    hex: "#22b8b0",
  },
  diproses: {
    label: "Diproses",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    dot: "bg-amber-500",
    hex: "#e5a325",
  },
  menunggu: {
    label: "Menunggu",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    dot: "bg-orange-400",
    hex: "#ef8a3c",
  },
  selesai: {
    label: "Selesai",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    dot: "bg-emerald-500",
    hex: "#1fa870",
  },
  ditolak: {
    label: "Ditolak",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    dot: "bg-rose-500",
    hex: "#e05252",
  },
};

export const STATUS_ORDER: TicketStatus[] = [
  "baru",
  "diteruskan",
  "diproses",
  "menunggu",
  "selesai",
  "ditolak",
];

export const PRIORITY_META: Record<Priority, { label: string; cls: string; hours: number }> = {
  rendah: { label: "Rendah", cls: "bg-line2 text-mute", hours: 48 },
  normal: { label: "Normal", cls: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300", hours: 24 },
  tinggi: { label: "Tinggi", cls: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300", hours: 8 },
};

export const CAT_COLORS: Record<string, { dot: string; soft: string; hex: string }> = {
  emerald: { dot: "bg-emerald-500", soft: "bg-emerald-100 dark:bg-emerald-500/15", hex: "#1fa870" },
  teal: { dot: "bg-teal-500", soft: "bg-teal-100 dark:bg-teal-500/15", hex: "#14a0a0" },
  sky: { dot: "bg-sky-500", soft: "bg-sky-100 dark:bg-sky-500/15", hex: "#38a8e0" },
  amber: { dot: "bg-amber-500", soft: "bg-amber-100 dark:bg-amber-500/15", hex: "#e5a325" },
  rose: { dot: "bg-rose-500", soft: "bg-rose-100 dark:bg-rose-500/15", hex: "#e05252" },
  cyan: { dot: "bg-cyan-500", soft: "bg-cyan-100 dark:bg-cyan-500/15", hex: "#22b8b0" },
  slate: { dot: "bg-slate-400", soft: "bg-slate-100 dark:bg-slate-500/15", hex: "#8b9aa5" },
};

export const ROLE_META: Record<Role, { label: string; cls: string }> = {
  superadmin: {
    label: "Super Admin",
    cls: "bg-pine text-mint dark:bg-mint dark:text-pine",
  },
  admin: {
    label: "Admin",
    cls: "bg-primsoft text-primink",
  },
  pic: {
    label: "PIC / Petugas",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
};

export const NAV_ACCESS: Record<Page, Role[]> = {
  dashboard: ["superadmin", "admin", "pic"],
  tickets: ["superadmin", "admin", "pic"],
  categories: ["superadmin", "admin"],
  users: ["superadmin", "admin"],
  reports: ["superadmin", "admin"],
  logs: ["superadmin"],
  settings: ["superadmin", "admin", "pic"],
};
