import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Ticket, Inbox, Wrench, CheckCircle2, AlarmClock, Send, ChevronRight,
  TrendingUp, Activity, Radio,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { useStore } from "../lib/store";
import { Card, StatusBadge, Button, Reveal, Pill, cn, Avatar } from "../components/ui";
import { timeAgo, fmtTime, isOverdue, hoursLeft, classifyMessage } from "../lib/engine";
import { STATUS_META, CAT_COLORS } from "../lib/types";
import type { TicketStatus } from "../lib/types";

const CHART_TOOLTIP = {
  contentStyle: {
    background: "var(--card)",
    border: "1px solid var(--line)",
    borderRadius: 10,
    fontSize: 12,
    fontFamily: "IBM Plex Sans",
    boxShadow: "var(--shadow-card)",
  },
  labelStyle: { color: "var(--ink)", fontWeight: 600 },
};

const Dashboard: React.FC = () => {
  const { data, navigate, currentUser, simulateIncoming, toast, setTicketsQuery } = useStore();
  const [period, setPeriod] = useState<"harian" | "mingguan" | "bulanan">("harian");
  const [feed, setFeed] = useState<{ id: string; text: string; time: number; kind: "in" | "cat" | "fwd" }[]>([]);
  const [simBusy, setSimBusy] = useState(false);
  const isPic = currentUser?.role === "pic";
  const dataRef = useRef(data);
  dataRef.current = data;

  /* feed langsung dari log webhook */
  useEffect(() => {
    const items = data.activityLogs
      .filter((l) => l.type === "webhook" || l.type === "ticket")
      .slice(0, 6)
      .map((l) => ({ id: l.id, text: l.detail, time: l.time, kind: (l.type === "webhook" ? "in" : "fwd") as "in" | "fwd" }));
    setFeed(items);
  }, [data.activityLogs]);

  /* simulasi pesan masuk berkala */
  useEffect(() => {
    const iv = setInterval(() => {
      const t = simulateIncoming();
      if (t) {
        const catName = dataRef.current.categories.find((c) => c.id === t.categoryId)?.name ?? "Belum Terklasifikasi";
        toast(`Pesan masuk: ${t.reporterName}`, "info", `${t.code} terdeteksi kategori "${catName}".`);
      }
    }, 42_000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tickets = useMemo(
    () => (isPic ? data.tickets.filter((t) => t.picId === currentUser?.id) : data.tickets),
    [data.tickets, isPic, currentUser]
  );

  const stats = useMemo(() => {
    const open = tickets.filter((t) => t.status === "baru").length;
    const fwd = tickets.filter((t) => t.status === "diteruskan").length;
    const proc = tickets.filter((t) => ["diproses", "menunggu"].includes(t.status)).length;
    const done = tickets.filter((t) => t.status === "selesai").length;
    const overdue = tickets.filter(isOverdue).length;
    const resolved = tickets.filter((t) => t.status === "selesai");
    const avg = resolved.length
      ? Math.round(resolved.reduce((s, t) => s + (t.updatedAt - t.createdAt), 0) / resolved.length / 3600_000 * 10) / 10
      : 0;
    return { total: tickets.length, open, fwd, proc, done, overdue, avg };
  }, [tickets]);

  const trend = useMemo(() => {
    const buckets: { label: string; count: number }[] = [];
    const nowD = new Date();
    if (period === "harian") {
      for (let i = 13; i >= 0; i--) {
        const d = new Date(nowD);
        d.setDate(d.getDate() - i);
        const key = d.toDateString();
        buckets.push({
          label: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
          count: data.tickets.filter((t) => new Date(t.createdAt).toDateString() === key).length,
        });
      }
    } else if (period === "mingguan") {
      for (let i = 7; i >= 0; i--) {
        const start = new Date(nowD);
        start.setDate(start.getDate() - i * 7 - 6);
        const end = new Date(nowD);
        end.setDate(end.getDate() - i * 7);
        buckets.push({
          label: `${start.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`,
          count: data.tickets.filter((t) => t.createdAt >= start.getTime() && t.createdAt <= end.getTime() + 86_400_000).length,
        });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(nowD.getFullYear(), nowD.getMonth() - i, 1);
        buckets.push({
          label: d.toLocaleDateString("id-ID", { month: "short" }),
          count: data.tickets.filter((t) => {
            const td = new Date(t.createdAt);
            return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
          }).length,
        });
      }
    }
    return buckets;
  }, [period, data.tickets]);

  const catData = useMemo(() => {
    return data.categories
      .map((c) => ({
        name: c.name,
        value: tickets.filter((t) => t.categoryId === c.id).length,
        hex: CAT_COLORS[c.color]?.hex ?? "#8b9aa5",
      }))
      .filter((c) => c.value > 0)
      .concat([
        {
          name: "Belum Terklasifikasi",
          value: tickets.filter((t) => !t.categoryId).length,
          hex: "#8b9aa5",
        },
      ])
      .filter((c) => c.value > 0);
  }, [data.categories, tickets]);

  const attention = useMemo(
    () =>
      tickets
        .filter((t) => !["selesai", "ditolak"].includes(t.status))
        .map((t) => ({ t, left: hoursLeft(t), over: isOverdue(t) }))
        .sort((a, b) => a.left - b.left)
        .slice(0, 5),
    [tickets]
  );

  const recent = useMemo(() => [...tickets].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6), [tickets]);

  const simulateNow = () => {
    setSimBusy(true);
    setTimeout(() => {
      const t = simulateIncoming();
      setSimBusy(false);
      if (t) {
        const catName = data.categories.find((c) => c.id === t.categoryId)?.name ?? "Belum Terklasifikasi";
        toast(`Webhook menerima pesan baru`, "success", `${t.code} dari ${t.reporterName} → kategori "${catName}".`);
      }
    }, 700);
  };

  const statCards = [
    { label: "Total Tiket", value: stats.total, icon: <Ticket size={18} />, tone: "text-prim bg-primsoft", sub: `${stats.fwd} menunggu forward` },
    { label: "Tiket Baru", value: stats.open, icon: <Inbox size={18} />, tone: "text-sky-600 bg-sky-100 dark:text-sky-300 dark:bg-sky-500/15", sub: "masuk via WhatsApp" },
    { label: "Sedang Ditangani", value: stats.proc, icon: <Wrench size={18} />, tone: "text-amber-600 bg-amber-100 dark:text-amber-300 dark:bg-amber-500/15", sub: "diproses + menunggu" },
    { label: "Selesai", value: stats.done, icon: <CheckCircle2 size={18} />, tone: "text-emerald-600 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/15", sub: `rata-rata ${stats.avg} jam` },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* sapaan */}
      <div className="flex flex-wrap items-end justify-between gap-3 anim-fade-up">
        <div>
          <p className="text-[13px] text-mute">
            Halo, <strong className="text-ink">{currentUser?.name?.split(" ")[0]}</strong> 👋 — berikut ringkasan operasional hari ini.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stats.overdue > 0 && (
            <Pill className="bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
              <AlarmClock size={12} /> {stats.overdue} tiket lewat SLA
            </Pill>
          )}
          <Button size="sm" variant="soft" onClick={() => navigate("reports")}>
            Lihat laporan <ChevronRight size={14} />
          </Button>
        </div>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5 stagger">
        {statCards.map((s) => (
          <Card key={s.label} className="p-4.5 group hover:border-prim/40 transition-all cursor-default">
            <div className="flex items-start justify-between">
              <span className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", s.tone)}>
                {s.icon}
              </span>
              <TrendingUp size={14} className="text-faint opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="font-display text-3xl font-bold mt-3 tabular-nums">{s.value}</p>
            <p className="text-[13px] font-semibold mt-0.5">{s.label}</p>
            <p className="text-[11.5px] text-faint">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* chart + donat */}
      <div className="grid lg:grid-cols-3 gap-3.5">
        <Reveal className="lg:col-span-2">
          <Card
            title={
              <span className="flex items-center gap-2">
                <Activity size={16} className="text-prim" /> Tren Tiket Masuk
              </span>
            }
            action={
              <div className="flex gap-1">
                {(["harian", "mingguan", "bulanan"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all",
                      period === p ? "bg-prim text-white" : "text-mute hover:text-ink hover:bg-card2"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            }
          >
            <div className="px-3 pb-4 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gTiket" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--prim)" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="var(--prim)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line2)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--faint)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--faint)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Tiket"
                    stroke="var(--prim)"
                    strokeWidth={2.5}
                    fill="url(#gTiket)"
                    activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
                    animationDuration={700}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={90}>
          <Card title={<span className="flex items-center gap-2"><Radio size={16} className="text-prim" /> Per Kategori</span>} className="h-full">
            <div className="px-4 pb-4 flex flex-col items-center">
              <div className="h-[150px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={catData} dataKey="value" nameKey="name" innerRadius={44} outerRadius={66} paddingAngle={3} strokeWidth={0} animationDuration={700}>
                      {catData.map((c, i) => (
                        <Cell key={i} fill={c.hex} />
                      ))}
                    </Pie>
                    <Tooltip {...CHART_TOOLTIP} />
                  </PieChart>
                </ResponsiveContainer>
                <span className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-display text-2xl font-bold tabular-nums">{tickets.length}</span>
                  <span className="text-[10px] text-faint uppercase tracking-wider">tiket</span>
                </span>
              </div>
              <div className="w-full space-y-1.5 mt-2">
                {catData.slice(0, 4).map((c) => (
                  <div key={c.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: c.hex }} />
                    <span className="truncate text-mute flex-1">{c.name}</span>
                    <span className="font-semibold tabular-nums">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Reveal>
      </div>

      {/* bawah: terbaru + perhatian + feed */}
      <div className="grid lg:grid-cols-3 gap-3.5">
        <Reveal className="lg:col-span-2">
          <Card
            title={<span className="flex items-center gap-2"><Inbox size={16} className="text-prim" /> Tiket Terbaru</span>}
            action={
              <Button size="xs" variant="ghost" onClick={() => { setTicketsQuery(""); navigate("tickets"); }}>
                Semua tiket <ChevronRight size={13} />
              </Button>
            }
          >
            <div className="divide-y divide-line2">
              {recent.length === 0 && (
                <p className="text-center text-[13px] text-faint py-10">Belum ada tiket yang masuk.</p>
              )}
              {recent.map((t) => {
                const cat = data.categories.find((c) => c.id === t.categoryId);
                const pic = data.users.find((u) => u.id === t.picId);
                return (
                  <button
                    key={t.id}
                    onClick={() => { setTicketsQuery(t.code); navigate("tickets"); }}
                    className="w-full flex items-center gap-3.5 px-5 py-3 text-left hover:bg-card2 transition-colors group"
                  >
                    <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_META[t.status].dot)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold truncate group-hover:text-prim transition-colors">
                        <span className="font-mono text-xs text-faint mr-1.5">{t.code}</span>
                        {t.reporterName}
                      </p>
                      <p className="text-xs text-mute truncate">{t.message}</p>
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge status={t.status} size="xs" />
                      <span className="text-[10.5px] text-faint">{cat?.name ?? "Belum terklasifikasi"}{pic ? ` · ${pic.name.split(" ")[0]}` : ""}</span>
                    </div>
                    <span className="text-[10.5px] text-faint shrink-0 w-16 text-right">{timeAgo(t.createdAt)}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </Reveal>

        <div className="space-y-3.5">
          <Reveal delay={80}>
            <Card title={<span className="flex items-center gap-2"><AlarmClock size={16} className="text-amber-500" /> Perlu Perhatian</span>}>
              <div className="px-3 pb-3 space-y-1.5">
                {attention.length === 0 && (
                  <p className="text-center text-[12.5px] text-faint py-6">Semua tiket dalam batas SLA ✨</p>
                )}
                {attention.map(({ t, left, over }) => (
                  <button
                    key={t.id}
                    onClick={() => { setTicketsQuery(t.code); navigate("tickets"); }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors",
                      over ? "bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/15" : "hover:bg-card2"
                    )}
                  >
                    <span className={cn("font-mono text-[11px] font-semibold shrink-0", over ? "text-rose-600 dark:text-rose-300" : "text-mute")}>{t.code}</span>
                    <span className="text-xs truncate flex-1 text-mute">{t.message}</span>
                    <span className={cn("text-[10.5px] font-bold shrink-0 tabular-nums", over ? "text-rose-600 dark:text-rose-300" : left < 6 ? "text-amber-600 dark:text-amber-300" : "text-faint")}>
                      {over ? `+${Math.abs(Math.round(left))}j` : `${Math.max(0, Math.round(left))}j lagi`}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          </Reveal>

          <Reveal delay={140}>
            <Card
              title={<span className="flex items-center gap-2"><Send size={16} className="text-prim" /> Webhook Tester</span>}
              action={
                <span className="flex items-center gap-1.5 text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="relative flex w-1.5 h-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ping-dot text-emerald-500" /></span>
                  LISTENING
                </span>
              }
            >
              <div className="px-4 pb-4">
                <div className="space-y-2 max-h-[132px] overflow-y-auto pr-1 mb-3">
                  {feed.map((f) => (
                    <div key={f.id} className="flex items-start gap-2 text-xs anim-fade-in">
                      <span className={cn("mt-1 w-1.5 h-1.5 rounded-full shrink-0", f.kind === "in" ? "bg-prim" : "bg-amber-400")} />
                      <div className="min-w-0">
                        <p className="text-mute leading-snug truncate">{f.text}</p>
                        <p className="text-[10px] text-faint">{fmtTime(f.time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button size="sm" className="w-full" onClick={simulateNow} loading={simBusy}>
                  <Send size={14} /> Kirim pesan uji via webhook
                </Button>
              </div>
            </Card>
          </Reveal>
        </div>
      </div>

      {/* baris status bawah */}
      <Reveal>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11.5px] text-faint px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> API WhatsApp: {data.settings.provider.provider} terhubung
          </span>
          <span className="flex items-center gap-1.5">
            <span className={cn("w-1.5 h-1.5 rounded-full", data.settings.sheet.connected ? "bg-emerald-500" : "bg-rose-500")} />
            Google Sheets: {data.settings.sheet.connected ? `sync ${data.settings.sheet.schedule === "realtime" ? "realtime" : "terjadwal"}` : "terputus"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Keyword engine: {data.categories.reduce((s, c) => s + c.keywords.length, 0)} kata kunci aktif
          </span>
          <span className="ml-auto font-mono">
            Uji deteksi: “{classifyMessage("lampu jalan mati", data.categories)?.name ?? "—"}”
          </span>
        </div>
      </Reveal>
    </div>
  );
};

export default Dashboard;
