import React, { useMemo, useState } from "react";
import {
  LogIn, Ticket, Tags, Users, Download, Settings, RefreshCw, Webhook,
  ScrollText, Search, X,
} from "lucide-react";
import { useStore } from "../lib/store";
import { Card, Input, Pill, cn, EmptyState, IconBtn } from "../components/ui";
import { fmtDateTime, timeAgo } from "../lib/engine";
import type { LogType } from "../lib/types";

const TYPE_META: Record<LogType, { label: string; icon: React.ReactNode; cls: string }> = {
  login: { label: "Autentikasi", icon: <LogIn size={14} />, cls: "bg-pine text-mint" },
  ticket: { label: "Tiket", icon: <Ticket size={14} />, cls: "bg-primsoft text-primink" },
  category: { label: "Kategori", icon: <Tags size={14} />, cls: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300" },
  user: { label: "Pengguna", icon: <Users size={14} />, cls: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" },
  export: { label: "Export", icon: <Download size={14} />, cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  settings: { label: "Pengaturan", icon: <Settings size={14} />, cls: "bg-line2 text-mute" },
  sync: { label: "Sinkronisasi", icon: <RefreshCw size={14} />, cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  webhook: { label: "Webhook", icon: <Webhook size={14} />, cls: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
};

const ActivityLog: React.FC = () => {
  const { data } = useStore();
  const [q, setQ] = useState("");
  const [fType, setFType] = useState<"semua" | LogType>("semua");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return data.activityLogs
      .filter((l) => (fType === "semua" ? true : l.type === fType))
      .filter((l) =>
        query ? [l.user, l.action, l.detail].some((s) => s.toLowerCase().includes(query)) : true
      );
  }, [data.activityLogs, q, fType]);

  return (
    <div className="p-4 md:p-6 max-w-[1100px] mx-auto space-y-4">
      <div className="anim-fade-up">
        <h2 className="font-display text-xl font-bold">Log Aktivitas (Audit Trail)</h2>
        <p className="text-[13px] text-mute mt-0.5">
          Rekam jejak seluruh aktivitas admin, PIC, dan sistem — login, perubahan tiket, kategori, export, hingga sinkronisasi.
        </p>
      </div>

      <Card className="anim-fade-up">
        <div className="flex flex-wrap items-center gap-2.5 px-4 pt-4 pb-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari pengguna atau aktivitas…" className="pl-9" />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-ink">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFType("semua")}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all", fType === "semua" ? "bg-pine text-mint" : "bg-card2 border border-line text-mute hover:text-ink")}
            >
              Semua
            </button>
            {(Object.keys(TYPE_META) as LogType[]).map((t) => (
              <button
                key={t}
                onClick={() => setFType(t)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                  fType === t ? "bg-pine text-mint" : "bg-card2 border border-line text-mute hover:text-ink"
                )}
              >
                {TYPE_META[t].label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<ScrollText size={24} />}
            title="Tidak ada log yang cocok"
            desc="Coba kata kunci lain atau tampilkan semua tipe aktivitas."
          />
        ) : (
          <div className="divide-y divide-line2">
            {filtered.map((l) => (
              <div key={l.id} className="flex items-center gap-3.5 px-4 py-3 hover:bg-card2 transition-colors">
                <span className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", TYPE_META[l.type].cls)}>
                  {TYPE_META[l.type].icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] leading-snug">
                    <strong>{l.user}</strong>
                    <span className="text-mute"> — {l.action}</span>
                  </p>
                  <p className="text-xs text-faint truncate">{l.detail}</p>
                </div>
                <Pill className={cn("shrink-0 hidden sm:inline-flex", TYPE_META[l.type].cls)}>{TYPE_META[l.type].label}</Pill>
                <div className="text-right shrink-0 w-28">
                  <p className="text-[11.5px] font-medium text-mute">{timeAgo(l.time)}</p>
                  <p className="text-[10px] text-faint font-mono">{fmtDateTime(l.time)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-4 py-3 border-t border-line2 flex items-center justify-between">
          <p className="text-xs text-faint">{filtered.length} entri ditampilkan · log disimpan 90 hari (rotasi otomatis)</p>
          <IconBtn label="Muat ulang" onClick={() => setQ("")} className="w-8 h-8"><RefreshCw size={14} /></IconBtn>
        </div>
      </Card>
    </div>
  );
};

export default ActivityLog;
