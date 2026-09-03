import React, { useMemo, useState } from "react";
import {
  FileSpreadsheet, FileText, FileType2, RefreshCw, CheckCircle2, XCircle,
  Clock, Download, Table2, UploadCloud, CalendarDays,
} from "lucide-react";
import { useStore } from "../lib/store";
import { Card, Button, Input, Select, Field, StatusBadge, cn, EmptyState, Pill } from "../components/ui";
import { buildReportRows, exportXLSX, exportPDF, exportDOCX, fmtDateTime, timeAgo } from "../lib/engine";
import { STATUS_META, STATUS_ORDER } from "../lib/types";
import type { TicketStatus } from "../lib/types";

const Reports: React.FC = () => {
  const { data, toast, addLog, runManualSync } = useStore();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fCat, setFCat] = useState("semua");
  const [fStatus, setFStatus] = useState("semua");
  const [fPic, setFPic] = useState("semua");
  const [busy, setBusy] = useState<"xlsx" | "pdf" | "docx" | "sync" | null>(null);

  const pics = data.users.filter((u) => u.isPic);

  const filtered = useMemo(() => {
    const fromTs = from ? new Date(from + "T00:00:00").getTime() : null;
    const toTs = to ? new Date(to + "T23:59:59").getTime() : null;
    return data.tickets
      .filter((t) => (fromTs ? t.createdAt >= fromTs : true))
      .filter((t) => (toTs ? t.createdAt <= toTs : true))
      .filter((t) => (fCat === "semua" ? true : fCat === "none" ? !t.categoryId : t.categoryId === fCat))
      .filter((t) => (fStatus === "semua" ? true : t.status === fStatus))
      .filter((t) => (fPic === "semua" ? true : fPic === "none" ? !t.picId : t.picId === fPic))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [data.tickets, from, to, fCat, fStatus, fPic]);

  const rows = useMemo(
    () => buildReportRows(filtered, data.categories, data.users),
    [filtered, data.categories, data.users]
  );

  const summary = useMemo(() => {
    const count = (s: TicketStatus) => filtered.filter((t) => t.status === s).length;
    return STATUS_ORDER.map((s) => ({ s, n: count(s) })).filter((x) => x.n > 0);
  }, [filtered]);

  const filterLabel = useMemo(() => {
    const parts: string[] = [];
    if (from || to) parts.push(`${from || "…"} s/d ${to || "…"}`);
    if (fCat !== "semua") parts.push(`kategori: ${data.categories.find((c) => c.id === fCat)?.name ?? "Belum terklasifikasi"}`);
    if (fStatus !== "semua") parts.push(`status: ${STATUS_META[fStatus as TicketStatus].label}`);
    if (fPic !== "semua") parts.push(`PIC: ${data.users.find((u) => u.id === fPic)?.name ?? "tanpa PIC"}`);
    return parts.length ? parts.join(" · ") : "Semua tiket, tanpa filter";
  }, [from, to, fCat, fStatus, fPic, data.categories, data.users]);

  const doExport = async (kind: "xlsx" | "pdf" | "docx") => {
    if (rows.length === 0) {
      toast("Tidak ada data untuk di-export", "warn", "Ubah filter agar ada tiket yang tercakup.");
      return;
    }
    setBusy(kind);
    addLog("export", `Export laporan ${kind.toUpperCase()}`, `${rows.length} baris · ${filterLabel}`);
    try {
      await new Promise((r) => setTimeout(r, 650));
      if (kind === "xlsx") exportXLSX(rows, data.settings.appName);
      if (kind === "pdf") exportPDF(rows, data.settings.appName, filterLabel);
      if (kind === "docx") await exportDOCX(rows, data.settings.appName, filterLabel);
      toast(`File ${kind.toUpperCase()} berhasil dibuat`, "success", `${rows.length} baris · ${filterLabel}`);
    } catch {
      toast("Gagal membuat file", "error", "Terjadi kesalahan saat generating dokumen.");
    } finally {
      setBusy(null);
    }
  };

  const syncNow = async () => {
    setBusy("sync");
    await runManualSync();
    setBusy(null);
  };

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-4">
      <div className="grid xl:grid-cols-[1fr_320px] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          {/* filter + export */}
          <Card className="p-4 anim-fade-up">
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <Field label="Dari tanggal">
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </Field>
              <Field label="Sampai tanggal">
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </Field>
              <Field label="Kategori">
                <Select value={fCat} onChange={(e) => setFCat(e.target.value)}>
                  <option value="semua">Semua</option>
                  <option value="none">Belum terklasifikasi</option>
                  {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Status">
                <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
                  <option value="semua">Semua</option>
                  {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                </Select>
              </Field>
              <Field label="PIC">
                <Select value={fPic} onChange={(e) => setFPic(e.target.value)}>
                  <option value="semua">Semua</option>
                  <option value="none">Tanpa PIC</option>
                  {pics.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
              </Field>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-line2">
              <p className="text-[13px] text-mute">
                <strong className="text-ink text-lg font-display tabular-nums">{filtered.length}</strong> tiket dalam laporan
                <span className="text-faint"> · {filterLabel}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => doExport("xlsx")} loading={busy === "xlsx"}>
                  <FileSpreadsheet size={15} className="text-emerald-600" /> Unduh XLSX
                </Button>
                <Button variant="outline" size="sm" onClick={() => doExport("pdf")} loading={busy === "pdf"}>
                  <FileText size={15} className="text-rose-500" /> Unduh PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => doExport("docx")} loading={busy === "docx"}>
                  <FileType2 size={15} className="text-sky-500" /> Unduh DOCX
                </Button>
              </div>
            </div>
          </Card>

          {/* tabel spreadsheet-like */}
          <Card className="anim-fade-up overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line2 bg-card2">
              <p className="flex items-center gap-2 text-[13px] font-semibold">
                <Table2 size={15} className="text-prim" /> Rekap Progres Tiket
              </p>
              {summary.length > 0 && (
                <div className="hidden md:flex items-center gap-1.5">
                  {summary.map(({ s, n }) => (
                    <Pill key={s} className={STATUS_META[s].badge}>{n} {STATUS_META[s].label}</Pill>
                  ))}
                </div>
              )}
            </div>
            {rows.length === 0 ? (
              <EmptyState
                icon={<CalendarDays size={24} />}
                title="Tidak ada data pada rentang ini"
                desc="Perluas rentang tanggal atau reset filter kategori/status/PIC."
                action={<Button size="sm" variant="soft" onClick={() => { setFrom(""); setTo(""); setFCat("semua"); setFStatus("semua"); setFPic("semua"); }}>Reset filter</Button>}
              />
            ) : (
              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="w-full text-[12.5px] min-w-[980px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="text-left text-[10.5px] uppercase tracking-wider text-mint bg-pine">
                      <th className="px-3 py-2.5 font-semibold">#</th>
                      <th className="px-3 py-2.5 font-semibold">Kode</th>
                      <th className="px-3 py-2.5 font-semibold">Tanggal</th>
                      <th className="px-3 py-2.5 font-semibold">Pelapor</th>
                      <th className="px-3 py-2.5 font-semibold">No. WA</th>
                      <th className="px-3 py-2.5 font-semibold">Kategori</th>
                      <th className="px-3 py-2.5 font-semibold">PIC</th>
                      <th className="px-3 py-2.5 font-semibold">Status</th>
                      <th className="px-3 py-2.5 font-semibold">Pesan</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {rows.map((r, i) => (
                      <tr key={i} className={cn("border-b border-line2", i % 2 === 1 && "bg-card2")}>
                        <td className="px-3 py-2 text-faint">{i + 1}</td>
                        <td className="px-3 py-2 font-semibold text-prim">{r.Kode}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-mute">{r.Tanggal}</td>
                        <td className="px-3 py-2 whitespace-nowrap font-sans font-medium">{r.Pelapor}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-mute">{r["No. WhatsApp"]}</td>
                        <td className="px-3 py-2 whitespace-nowrap font-sans">{r.Kategori}</td>
                        <td className="px-3 py-2 whitespace-nowrap font-sans">{r.PIC}</td>
                        <td className="px-3 py-2 font-sans">
                          <StatusBadge status={(STATUS_ORDER.find((s) => STATUS_META[s].label === r.Status) ?? "baru") as TicketStatus} size="xs" />
                        </td>
                        <td className="px-3 py-2 font-sans text-mute max-w-[280px] truncate" title={r.Pesan}>{r.Pesan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* sinkronisasi */}
        <div className="space-y-4">
          <Card className="anim-fade-up p-4.5">
            <div className="flex items-center gap-3">
              <span className={cn("w-11 h-11 rounded-xl flex items-center justify-center", data.settings.sheet.connected ? "bg-primsoft text-primink" : "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300")}>
                <UploadCloud size={20} />
              </span>
              <div className="flex-1">
                <p className="font-display font-semibold text-[14.5px]">Google Spreadsheet</p>
                <p className={cn("text-[11.5px] font-semibold", data.settings.sheet.connected ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                  {data.settings.sheet.connected ? "Terhubung · Service Account" : "Tidak terhubung"}
                </p>
              </div>
            </div>
            <div className="mt-3.5 space-y-2 text-[12.5px]">
              <div className="flex justify-between gap-2">
                <span className="text-faint">Spreadsheet</span>
                <span className="font-mono text-[11px] truncate max-w-[160px]" title={data.settings.sheet.spreadsheetId}>
                  …{data.settings.sheet.spreadsheetId.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-faint">Sheet tujuan</span>
                <span className="font-semibold">{data.settings.sheet.sheetName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-faint">Jadwal</span>
                <span className="font-semibold capitalize">
                  {data.settings.sheet.schedule === "realtime" ? "Realtime (tiap perubahan)" : data.settings.sheet.schedule === "15m" ? "Tiap 15 menit" : data.settings.sheet.schedule === "hourly" ? "Tiap jam" : "Harian 23:00"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-faint">Sync terakhir</span>
                <span className="font-semibold">{data.settings.sheet.lastSync ? timeAgo(data.settings.sheet.lastSync) : "—"}</span>
              </div>
            </div>
            <Button className="w-full mt-4" onClick={syncNow} loading={busy === "sync"} disabled={!data.settings.sheet.connected}>
              <RefreshCw size={15} /> Sinkronkan sekarang
            </Button>
            {!data.settings.sheet.connected && (
              <p className="text-[11px] text-faint text-center mt-2">Hubungkan akun Google di menu Pengaturan.</p>
            )}
          </Card>

          <Card className="anim-fade-up" title={<span className="flex items-center gap-2"><Clock size={15} className="text-prim" /> Riwayat Sinkronisasi</span>}>
            <div className="divide-y divide-line2 max-h-[380px] overflow-y-auto">
              {data.syncLogs.length === 0 && (
                <p className="text-center text-[12.5px] text-faint py-8">Belum ada riwayat sync.</p>
              )}
              {data.syncLogs.map((l) => (
                <div key={l.id} className="flex items-center gap-2.5 px-4 py-2.5">
                  {l.status === "sukses" ? (
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  ) : l.status === "gagal" ? (
                    <XCircle size={15} className="text-rose-500 shrink-0" />
                  ) : (
                    <RefreshCw size={15} className="text-amber-500 animate-spin shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold leading-tight">
                      {l.status === "pending" ? "Menyinkronkan…" : `${l.rows} baris ${l.status}`}
                    </p>
                    <p className="text-[10.5px] text-faint">{l.sheet} · {l.trigger} · {fmtDateTime(l.time)}</p>
                  </div>
                  {l.status === "gagal" && (
                    <Pill className="bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">retry</Pill>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <div className="flex items-start gap-2 text-[11.5px] text-faint px-1">
            <Download size={13} className="shrink-0 mt-0.5 text-prim" />
            <p>Export menghasilkan file dari data ter-filter saat ini. File dibuat di sisi klien lalu diunduh (setara signed URL di produksi).</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
