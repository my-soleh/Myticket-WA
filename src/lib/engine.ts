import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
} from "docx";
import type { Category, Ticket, User, Priority, ChatMsg } from "./types";
import { PRIORITY_META, STATUS_META } from "./types";

/* ---------- util ---------- */

export const uid = () => Math.random().toString(36).slice(2, 10);

export const fmtDate = (t: number) =>
  new Date(t).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

export const fmtTime = (t: number) =>
  new Date(t).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

export const fmtDateTime = (t: number) => `${fmtDate(t)} · ${fmtTime(t)}`;

export const timeAgo = (t: number) => {
  const d = Date.now() - t;
  const m = Math.floor(d / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} hari lalu`;
  return fmtDate(t);
};

export const slaDeadline = (ticket: Ticket) =>
  ticket.createdAt + ticket.slaHours * 3600_000;

export const slaRemaining = (ticket: number, hours: number) =>
  ticket + hours * 3600_000 - Date.now();

export const isOverdue = (t: Ticket) =>
  !["selesai", "ditolak"].includes(t.status) && Date.now() > slaDeadline(t);

export const hoursLeft = (t: Ticket) =>
  Math.round((slaDeadline(t) - Date.now()) / 3600_000 * 10) / 10;

export const maskKey = (k: string) =>
  k.length <= 8 ? "••••" + k.slice(-4) : k.slice(0, 5) + "••••••••" + k.slice(-4);

/* ---------- mesin filter kata kunci ---------- */

const escReg = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Skor kecocokan pesan terhadap kata kunci kategori (exact-word > contains). */
export const classifyMessage = (
  text: string,
  categories: Category[]
): Category | null => {
  const t = text.toLowerCase();
  let best: Category | null = null;
  let bestScore = 0;
  for (const c of categories) {
    if (!c.active || c.isSystem) continue;
    let score = 0;
    for (const raw of c.keywords) {
      const kw = raw.toLowerCase().trim();
      if (!kw) continue;
      if (t.includes(kw)) {
        score += kw.includes(" ")
          ? 4
          : new RegExp(`(^|[^a-z0-9])${escReg(kw)}([^a-z0-9]|$)`, "i").test(t)
          ? 2.5
          : 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
};

/** Round-robin PIC berdasarkan jumlah tiket yang sudah dipegang. */
export const pickPic = (cat: Category | null, tickets: Ticket[], users: User[]) => {
  if (!cat || cat.picIds.length === 0) return null;
  const activePics = cat.picIds
    .map((id) => users.find((u) => u.id === id))
    .filter((u) => u && u.active) as User[];
  if (activePics.length === 0) return null;
  const load = activePics.map(
    (p) => tickets.filter((t) => t.picId === p.id && !["selesai", "ditolak"].includes(t.status)).length
  );
  const min = Math.min(...load);
  return activePics[load.indexOf(min)];
};

export const nextTicketCode = (tickets: Ticket[]) => {
  const max = tickets.reduce((m, t) => {
    const n = parseInt(t.code.replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 1000);
  return `TK-${max + 1}`;
};

export const newTicket = (
  base: Pick<Ticket, "reporterName" | "reporterNumber" | "message">,
  categories: Category[],
  tickets: Ticket[],
  users: User[],
  opts?: { priority?: Priority }
): Ticket => {
  const cat = classifyMessage(base.message, categories);
  const pic = pickPic(cat, tickets, users);
  const priority: Priority =
    opts?.priority ?? (/(darurat|segera|bahaya|banjir|longsor|kebakaran)/i.test(base.message) ? "tinggi" : "normal");
  const now = Date.now();
  const convo: ChatMsg[] = [
    { id: uid(), from: "pelapor", text: base.message, time: now },
  ];
  const logs = [
    { id: uid(), from: "—", to: "baru", note: "Tiket dibuat dari webhook WhatsApp", by: "Sistem", time: now },
  ];
  if (cat) {
    convo.push({
      id: uid(),
      from: "sistem",
      text: `Kata kunci cocok → kategori "${cat.name}"${pic ? ` · diteruskan ke ${pic.name}` : ""}`,
      time: now + 1000,
    });
    if (pic) {
      logs.push({ id: uid(), from: "baru", to: "diteruskan", note: `Auto-forward ke ${pic.name}`, by: "Sistem", time: now + 1000 });
    }
  }
  return {
    id: uid(),
    code: nextTicketCode(tickets),
    reporterName: base.reporterName,
    reporterNumber: base.reporterNumber,
    message: base.message,
    categoryId: cat ? cat.id : null,
    picId: pic ? pic.id : null,
    status: cat && pic ? "diteruskan" : "baru",
    priority,
    createdAt: now,
    updatedAt: now,
    slaHours: PRIORITY_META[priority].hours,
    conversation: convo,
    logs,
    attachments: [],
  };
};

/* ---------- laporan ---------- */

export interface ReportRow {
  Kode: string;
  Tanggal: string;
  Pelapor: string;
  "No. WhatsApp": string;
  Kategori: string;
  PIC: string;
  Status: string;
  Prioritas: string;
  "SLA (jam)": number;
  "Pesan": string;
}

export const buildReportRows = (
  tickets: Ticket[],
  categories: Category[],
  users: User[]
): ReportRow[] =>
  tickets.map((t) => ({
    Kode: t.code,
    Tanggal: fmtDateTime(t.createdAt),
    Pelapor: t.reporterName,
    "No. WhatsApp": t.reporterNumber,
    Kategori: categories.find((c) => c.id === t.categoryId)?.name ?? "Belum Terklasifikasi",
    PIC: users.find((u) => u.id === t.picId)?.name ?? "—",
    Status: STATUS_META[t.status].label,
    Prioritas: PRIORITY_META[t.priority].label,
    "SLA (jam)": t.slaHours,
    Pesan: t.message.length > 120 ? t.message.slice(0, 117) + "…" : t.message,
  }));

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

const stamp = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
};

/* ---------- export XLSX ---------- */

export const exportXLSX = (rows: ReportRow[], appName: string) => {
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 10 }, { wch: 20 }, { wch: 18 }, { wch: 16 }, { wch: 20 },
    { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 9 }, { wch: 60 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rekap Tiket");
  XLSX.writeFile(wb, `Laporan-Tiket-${appName.replace(/\s+/g, "")}-${stamp()}.xlsx`);
};

/* ---------- export PDF ---------- */

export const exportPDF = (rows: ReportRow[], appName: string, filterLabel: string) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt" });
  doc.setFillColor(11, 29, 22);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 74, "F");
  doc.setTextColor(201, 238, 217);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`${appName} — Laporan Progres Tiket`, 40, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(160, 190, 175);
  doc.text(`${filterLabel}  ·  Dicetak ${fmtDateTime(Date.now())}  ·  ${rows.length} tiket`, 40, 52);

  autoTable(doc, {
    startY: 90,
    head: [Object.keys(rows[0] ?? { Kode: "" })],
    body: rows.map((r) => Object.values(r).map((v) => String(v))),
    styles: { font: "helvetica", fontSize: 7.5, cellPadding: 4, textColor: [30, 40, 35] },
    headStyles: { fillColor: [14, 138, 95], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [244, 248, 246] },
    margin: { left: 40, right: 40 },
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `Hal ${i}/${pages} · Dokumen dihasilkan otomatis oleh ${appName}`,
      doc.internal.pageSize.getWidth() - 40,
      doc.internal.pageSize.getHeight() - 18,
      { align: "right" }
    );
  }
  doc.save(`Laporan-Tiket-${stamp()}.pdf`);
};

/* ---------- export DOCX ---------- */

export const exportDOCX = async (rows: ReportRow[], appName: string, filterLabel: string) => {
  const headers = Object.keys(rows[0] ?? { Kode: "" });
  const cell = (text: string, bold = false, fill?: string) =>
    new TableCell({
      shading: fill ? { fill } : undefined,
      width: { size: Math.floor(9000 / headers.length), type: WidthType.DXA },
      children: [
        new Paragraph({
          children: [new TextRun({ text, bold, size: 16, font: "Calibri" })],
        }),
      ],
    });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h) => cell(h, true, "0E8A5F")),
      }),
      ...rows.map(
        (r) =>
          new TableRow({
            children: headers.map((h) => cell(String((r as unknown as Record<string, unknown>)[h] ?? ""))),
          })
      ),
    ],
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: `${appName} — Laporan Progres Tiket`, bold: true })],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `${filterLabel} · Dicetak ${fmtDateTime(Date.now())} · Total ${rows.length} tiket`,
                size: 18,
                color: "666666",
              }),
            ],
          }),
          table,
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 240 },
            children: [
              new TextRun({ text: `Dokumen dihasilkan otomatis oleh ${appName}`, italics: true, size: 16, color: "999999" }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `Laporan-Tiket-${stamp()}.docx`);
};
