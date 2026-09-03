import React, { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard, Ticket, Tags, Users, FileBarChart2, Settings, ScrollText,
  Bell, Search, Sun, Moon, LogOut, Menu, X, ChevronLeft, ChevronRight,
  Headphones, ShieldCheck, Bot, MessageCircle, RefreshCw, CheckCircle2, XCircle,
} from "lucide-react";
import type { Page } from "../lib/types";
import { NAV_ACCESS } from "../lib/types";
import { useStore, unreadCount } from "../lib/store";
import { cn, Avatar, IconBtn } from "./ui";
import { timeAgo } from "../lib/engine";

/* ---------- Logo dinamis ---------- */

const PRESET_LOGOS: ((cls: string) => React.ReactNode)[] = [
  // 0 — bubble + centang (default)
  (cls) => (
    <svg viewBox="0 0 64 64" className={cls}>
      <rect width="64" height="64" rx="16" className="fill-pine dark:fill-pine3" />
      <path d="M32 12c-11 0-20 8-20 18 0 4.4 1.8 8.4 4.8 11.6L15 52l11.2-4.4c1.8.5 3.7.8 5.8.8 11 0 20-8 20-18S43 12 32 12z" className="fill-prim" />
      <path d="M24 31l5 5 11-11" stroke="var(--pine)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  // 1 — bot headset
  (cls) => (
    <svg viewBox="0 0 64 64" className={cls}>
      <rect width="64" height="64" rx="16" className="fill-prim" />
      <rect x="18" y="22" width="28" height="22" rx="8" className="fill-pine" />
      <circle cx="27" cy="33" r="2.6" className="fill-prim" />
      <circle cx="37" cy="33" r="2.6" className="fill-prim" />
      <path d="M14 34a18 18 0 0 1 36 0" stroke="var(--pine)" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <rect x="11" y="32" width="6" height="10" rx="3" className="fill-pine" />
      <rect x="47" y="32" width="6" height="10" rx="3" className="fill-pine" />
      <path d="M46 42v3a5 5 0 0 1-5 5h-6" stroke="var(--pine)" strokeWidth="3.4" fill="none" strokeLinecap="round" />
    </svg>
  ),
  // 2 — tiket + pesawat kertas
  (cls) => (
    <svg viewBox="0 0 64 64" className={cls}>
      <rect width="64" height="64" rx="16" className="fill-pine dark:fill-pine3" />
      <path d="M50 16 14 30l12 5 5 13z" className="fill-prim" />
      <path d="M26 35l10-9" stroke="var(--pine)" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  ),
  // 3 — perisai chat
  (cls) => (
    <svg viewBox="0 0 64 64" className={cls}>
      <rect width="64" height="64" rx="16" className="fill-prim" />
      <path d="M32 10l16 6v14c0 11-7 18-16 22-9-4-16-11-16-22V16z" className="fill-pine" />
      <path d="M24 30c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8c-1 0-2-.2-2.9-.5L24 39l1.6-4.6A7.9 7.9 0 0 1 24 30z" className="fill-prim" />
    </svg>
  ),
];

export const AppLogo: React.FC<{ size?: number; withText?: boolean; onDark?: boolean }> = ({
  size = 34,
  withText = true,
  onDark = false,
}) => {
  const { data } = useStore();
  const { appName, tagline, logo, logoPreset } = data.settings;
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {logo ? (
        <img src={logo} alt={appName} className="rounded-lg object-cover shrink-0" style={{ width: size, height: size }} />
      ) : (
        <span className="shrink-0" style={{ width: size, height: size }}>
          {PRESET_LOGOS[Math.min(logoPreset, PRESET_LOGOS.length - 1)]("w-full h-full")}
        </span>
      )}
      {withText && (
        <div className="min-w-0 leading-tight">
          <p className={cn("font-display font-bold truncate", onDark ? "text-mint" : "text-ink")} style={{ fontSize: size * 0.44 }}>
            {appName}
          </p>
          <p className={cn("text-[10px] font-medium truncate", onDark ? "text-mintdim" : "text-faint")}>{tagline}</p>
        </div>
      )}
    </div>
  );
};

/* ---------- Sidebar ---------- */

const NAV: { group: string; items: { page: Page; label: string; icon: React.ReactNode }[] }[] = [
  {
    group: "Utama",
    items: [
      { page: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
      { page: "tickets", label: "Tiket", icon: <Ticket size={18} /> },
    ],
  },
  {
    group: "Manajemen",
    items: [
      { page: "categories", label: "Kategori & Kata Kunci", icon: <Tags size={18} /> },
      { page: "users", label: "Pengguna & Nomor", icon: <Users size={18} /> },
    ],
  },
  {
    group: "Data",
    items: [
      { page: "reports", label: "Laporan & Export", icon: <FileBarChart2 size={18} /> },
      { page: "logs", label: "Log Aktivitas", icon: <ScrollText size={18} /> },
    ],
  },
  {
    group: "Sistem",
    items: [{ page: "settings", label: "Pengaturan", icon: <Settings size={18} /> }],
  },
];

export const Sidebar: React.FC<{ mobileOpen: boolean; onCloseMobile: () => void }> = ({
  mobileOpen,
  onCloseMobile,
}) => {
  const { data, currentUser, page, navigate, collapsed, setCollapsed } = useStore();
  const openCount = data.tickets.filter((t) => t.status === "baru").length;
  const lastSync = data.settings.sheet.lastSync;

  const content = (
    <div className="flex flex-col h-full bg-pine text-mint">
      <div className={cn("flex items-center justify-between gap-2 px-4 h-16 border-b border-pineline shrink-0", collapsed && "justify-center px-2")}>
        {collapsed ? (
          <span className="cursor-pointer" onClick={() => navigate("dashboard")}>
            <AppLogo withText={false} size={32} />
          </span>
        ) : (
          <AppLogo onDark size={32} />
        )}
        <button
          onClick={onCloseMobile}
          className="md:hidden text-mintdim hover:text-mint p-1"
          aria-label="Tutup menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-5">
        {NAV.map((grp) => {
          const items = grp.items.filter((i) => currentUser && NAV_ACCESS[i.page].includes(currentUser.role));
          if (items.length === 0) return null;
          return (
            <div key={grp.group}>
              {!collapsed && (
                <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-mintdim/70">
                  {grp.group}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active = page === item.page;
                  return (
                    <button
                      key={item.page}
                      title={item.label}
                      onClick={() => {
                        navigate(item.page);
                        onCloseMobile();
                      }}
                      className={cn(
                        "group w-full flex items-center gap-3 rounded-lg text-[13.5px] font-medium transition-all duration-200",
                        collapsed ? "justify-center px-0 py-2.5" : "px-2.5 py-2.5",
                        active
                          ? "bg-pine3 text-white shadow-inner"
                          : "text-mintdim hover:text-mint hover:bg-pine2"
                      )}
                    >
                      <span className={cn("transition-colors", active && "text-prim2")}>{item.icon}</span>
                      {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                      {!collapsed && item.page === "tickets" && openCount > 0 && (
                        <span className="min-w-5 h-5 px-1 rounded-full bg-prim text-white text-[10.5px] font-bold flex items-center justify-center">
                          {openCount}
                        </span>
                      )}
                      {active && collapsed && <span className="absolute left-0 w-0.5 h-6 bg-prim rounded-r" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* status sinkronisasi */}
      {!collapsed && (
        <div className="mx-2.5 mb-2.5 p-3 rounded-lg bg-pine2 border border-pineline">
          <div className="flex items-center gap-2">
            <span className="relative flex w-2 h-2">
              <span className={cn("w-2 h-2 rounded-full", data.settings.sheet.connected ? "bg-emerald-400 ping-dot text-emerald-400" : "bg-rose-400")} />
            </span>
            <p className="text-[11.5px] font-semibold text-mint">Google Sheets</p>
          </div>
          <p className="text-[10.5px] text-mintdim mt-1 leading-snug">
            {data.settings.sheet.connected
              ? lastSync
                ? `Sync terakhir ${timeAgo(lastSync)}`
                : "Terhubung — belum ada sync"
              : "Tidak terhubung"}
          </p>
        </div>
      )}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex items-center justify-center gap-2 h-10 border-t border-pineline text-mintdim hover:text-mint hover:bg-pine2 transition-colors text-xs font-medium"
      >
        {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        {!collapsed && "Ciutkan menu"}
      </button>
    </div>
  );

  return (
    <>
      {/* desktop */}
      <aside
        className={cn(
          "hidden md:block fixed inset-y-0 left-0 z-30 transition-all duration-300",
          collapsed ? "w-[68px]" : "w-[248px]"
        )}
      >
        {content}
      </aside>
      {/* mobile */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-pine/70 backdrop-blur-[2px] anim-fade-in" onClick={onCloseMobile} />
          <aside className="absolute inset-y-0 left-0 w-[260px] anim-slide-left">{content}</aside>
        </div>
      )}
    </>
  );
};

/* ---------- Topbar ---------- */

export const Topbar: React.FC<{ onOpenMobile: () => void }> = ({ onOpenMobile }) => {
  const { data, currentUser, page, navigate, theme, setTheme, markAllRead, logout, setTicketsQuery } = useStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [q, setQ] = useState("");
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const unread = unreadCount(data.notifs);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const titles: Record<Page, string> = {
    dashboard: "Dashboard",
    tickets: "Manajemen Tiket",
    categories: "Kategori & Filter Kata Kunci",
    users: "Pengguna & Nomor WhatsApp",
    reports: "Laporan & Export",
    settings: "Pengaturan",
    logs: "Log Aktivitas",
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketsQuery(q);
    navigate("tickets");
  };

  const notifIcon = (t: string) =>
    t === "ticket" ? <MessageCircle size={14} /> : t === "overdue" ? <RefreshCw size={14} /> : t === "sync" ? <CheckCircle2 size={14} /> : <XCircle size={14} />;

  return (
    <header className="sticky top-0 z-20 h-16 bg-card/85 backdrop-blur-md border-b border-line flex items-center gap-3 px-4 md:px-6 transition-colors duration-300">
      <button className="md:hidden p-2 -ml-2 text-mute hover:text-ink" onClick={onOpenMobile} aria-label="Buka menu">
        <Menu size={20} />
      </button>
      <div className="min-w-0">
        <h1 className="font-display font-bold text-[17px] leading-tight truncate">{titles[page]}</h1>
        <p className="text-[11px] text-faint hidden sm:block">
          {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="flex-1" />

      {/* search */}
      <form onSubmit={submitSearch} className="hidden lg:block relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari tiket, pelapor, kode…  ⏎"
          className="w-64 h-9.5 pl-9 pr-3 rounded-lg border border-line bg-card2 text-[13px] placeholder:text-faint focus:outline-none focus:border-prim focus:ring-2 focus:ring-prim/20 transition-all"
        />
      </form>

      {/* status webhook */}
      <div
        className="hidden xl:flex items-center gap-2 h-9 px-3 rounded-lg bg-primsoft text-primink text-xs font-semibold"
        title="Webhook provider WhatsApp aktif menerima pesan"
      >
        <span className="relative flex w-2 h-2">
          <span className="w-2 h-2 rounded-full bg-prim ping-dot text-prim" />
        </span>
        Webhook aktif
      </div>

      {/* theme */}
      <IconBtn label={theme === "dark" ? "Mode terang" : "Mode gelap"} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </IconBtn>

      {/* notif */}
      <div className="relative" ref={notifRef}>
        <IconBtn label="Notifikasi" onClick={() => setNotifOpen((v) => !v)}>
          <span className="relative">
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 rounded-full bg-rose-500 text-white text-[9.5px] font-bold flex items-center justify-center">
                {unread}
              </span>
            )}
          </span>
        </IconBtn>
        {notifOpen && (
          <div className="absolute right-0 mt-2 w-[340px] bg-card border border-line rounded-xl card-shadow anim-pop overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line2">
              <p className="font-display font-semibold text-sm">Notifikasi</p>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs font-medium text-prim hover:text-prim2">
                  Tandai dibaca
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {data.notifs.length === 0 && (
                <p className="text-center text-[13px] text-faint py-8">Belum ada notifikasi.</p>
              )}
              {data.notifs.map((n) => (
                <div key={n.id} className={cn("flex gap-3 px-4 py-3 border-b border-line2 last:border-0 transition-colors", !n.read && "bg-primsoft/50")}>
                  <span className={cn("mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0", n.type === "overdue" ? "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300" : n.type === "sync" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-primsoft text-primink")}>
                    {notifIcon(n.type)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold leading-snug flex items-center gap-1.5">
                      {n.title}
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-prim" />}
                    </p>
                    <p className="text-xs text-mute leading-snug mt-0.5">{n.body}</p>
                    <p className="text-[10.5px] text-faint mt-1">{timeAgo(n.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* user */}
      <div className="relative" ref={userRef}>
        <button
          onClick={() => setUserOpen((v) => !v)}
          className="flex items-center gap-2.5 pl-1.5 pr-2 h-11 rounded-lg hover:bg-card2 transition-colors"
        >
          {currentUser && <Avatar name={currentUser.name} color={currentUser.color} size={32} />}
          <span className="hidden sm:block text-left leading-tight">
            <span className="block text-[13px] font-semibold">{currentUser?.name}</span>
            <span className="block text-[10.5px] text-faint capitalize">{currentUser?.role === "superadmin" ? "Super Admin" : currentUser?.role === "admin" ? "Admin" : "PIC"}</span>
          </span>
        </button>
        {userOpen && currentUser && (
          <div className="absolute right-0 mt-2 w-60 bg-card border border-line rounded-xl card-shadow anim-pop overflow-hidden">
            <div className="px-4 py-3.5 border-b border-line2 bg-card2">
              <p className="text-sm font-semibold">{currentUser.name}</p>
              <p className="text-xs text-mute">{currentUser.email}</p>
              <p className="text-[11px] text-faint mt-1 font-mono">{currentUser.waNumber}</p>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            >
              <LogOut size={15} /> Keluar dari akun
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export const roleIcons = { ShieldCheck, Headphones, Bot };
