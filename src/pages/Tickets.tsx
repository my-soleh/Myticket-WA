import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Filter, X, ChevronLeft, ChevronRight, Phone, CheckCheck, Send,
  Paperclip, Image as ImageIcon, FileText, History, UserRound, Copy, MessageCircle,
} from "lucide-react";
import { useStore } from "../lib/store";
import {
  Card, StatusBadge, Button, Input, Select, Pill, cn, EmptyState, Avatar, IconBtn,
} from "../components/ui";
import { timeAgo, fmtDateTime, fmtTime, isOverdue, hoursLeft, classifyMessage } from "../lib/engine";
import { STATUS_META, STATUS_ORDER, PRIORITY_META, CAT_COLORS } from "../lib/types";
import type { Ticket, TicketStatus } from "../lib/types";

const PAGE_SIZE = 8;

const Tickets: React.FC = () => {
  const store = useStore();
  const { data, currentUser, ticketsQuery, setTicketsQuery } = store;
  const [search, setSearch] = useState(ticketsQuery);
  const [fStatus, setFStatus] = useState<string>("semua");
  const [fCat, setFCat] = useState<string>("semua");
  const [fPic, setFPic] = useState<string>("semua");
  const [fDate, setFDate] = useState<string>("semua");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => setSearch(ticketsQuery), [ticketsQuery]);
  useEffect(() => setPage(1), [search, fStatus, fCat, fPic, fDate]);

  const isPic = currentUser?.role === "pic";
  const pics = data.users.filter((u) => u.isPic);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.tickets
      .filter((t) => (isPic ? t.picId === currentUser?.id : true))
      .filter((t) =>
        q
          ? [t.code, t.reporterName, t.reporterNumber, t.message].some((s) => s.toLowerCase().includes(q))
          : true
      )
      .filter((t) => (fStatus === "semua" ? true : t.status === fStatus))
      .filter((t) => (fCat === "semua" ? true : fCat === "none" ? !t.categoryId : t.categoryId === fCat))
      .filter((t) => (fPic === "semua" ? true : fPic === "none" ? !t.picId : t.picId === fPic))
      .filter((t) => {
        if (fDate === "semua") return true;
        const d = Date.now() - t.createdAt;
        if (fDate === "today") return d < 24 * 3600_000;
        if (fDate === "week") return d < 7 * 24 * 3600_000;
        if (fDate === "month") return d < 30 * 24 * 3600_000;
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [data.tickets, search, fStatus, fCat, fPic, fDate, isPic, currentUser]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = data.tickets.find((t) => t.id === selectedId) ?? null;

  const hasFilter = search || fStatus !== "semua" || fCat !== "semua" || fPic !== "semua" || fDate !== "semua";

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <Card className="anim-fade-up">
        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 px-4 pt-4 pb-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setTicketsQuery(e.target.value); }}
              placeholder="Cari kode tiket, nama pelapor, nomor, isi pesan…"
              className="pl-9"
            />
            {search && (
              <button onClick={() => { setSearch(""); setTicketsQuery(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-ink">
                <X size={14} />
              </button>
            )}
          </div>
          <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="w-36">
            <option value="semua">Semua status</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </Select>
          <Select value={fCat} onChange={(e) => setFCat(e.target.value)} className="w-44">
            <option value="semua">Semua kategori</option>
            <option value="none">Belum terklasifikasi</option>
            {data.categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          {!isPic && (
            <Select value={fPic} onChange={(e) => setFPic(e.target.value)} className="w-40">
              <option value="semua">Semua PIC</option>
              <option value="none">Tanpa PIC</option>
              {pics.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          )}
          <Select value={fDate} onChange={(e) => setFDate(e.target.value)} className="w-36">
            <option value="semua">Semua waktu</option>
            <option value="today">24 jam terakhir</option>
            <option value="week">7 hari terakhir</option>
            <option value="month">30 hari terakhir</option>
          </Select>
          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setTicketsQuery(""); setFStatus("semua"); setFCat("semua"); setFPic("semua"); setFDate("semua"); }}>
              <X size={14} /> Reset
            </Button>
          )}
        </div>

        {/* tabel */}
        {pageItems.length === 0 ? (
          <EmptyState
            icon={<MessageCircle size={24} />}
            title={hasFilter ? "Tidak ada tiket yang cocok" : "Belum ada tiket masuk"}
            desc={
              hasFilter
                ? "Coba ubah kata kunci atau reset filter untuk melihat semua tiket."
                : "Pesan WhatsApp yang masuk ke nomor admin akan otomatis menjadi tiket di sini."
            }
            action={hasFilter ? (
              <Button variant="soft" size="sm" onClick={() => { setSearch(""); setTicketsQuery(""); setFStatus("semua"); setFCat("semua"); setFPic("semua"); setFDate("semua"); }}>
                Reset semua filter
              </Button>
            ) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[860px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-faint border-y border-line2 bg-card2">
                  <th className="px-4 py-2.5 font-semibold">Tiket</th>
                  <th className="px-3 py-2.5 font-semibold">Pelapor</th>
                  <th className="px-3 py-2.5 font-semibold">Kategori</th>
                  <th className="px-3 py-2.5 font-semibold">PIC</th>
                  <th className="px-3 py-2.5 font-semibold">Prioritas</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">SLA</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Dibuat</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((t) => {
                  const cat = data.categories.find((c) => c.id === t.categoryId);
                  const pic = data.users.find((u) => u.id === t.picId);
                  const over = isOverdue(t);
                  const left = hoursLeft(t);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedId(t.id)}
                      className="border-b border-line2 last:border-0 hover:bg-card2 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <p className="font-mono font-semibold text-xs text-prim">{t.code}</p>
                        <p className="text-xs text-mute truncate max-w-[240px] mt-0.5">{t.message}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-semibold whitespace-nowrap">{t.reporterName}</p>
                        <p className="text-[11px] text-faint font-mono whitespace-nowrap">{t.reporterNumber}</p>
                      </td>
                      <td className="px-3 py-3">
                        {cat ? (
                          <Pill className={cn("whitespace-nowrap", CAT_COLORS[cat.color]?.soft, "text-ink")}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", CAT_COLORS[cat.color]?.dot)} />
                            {cat.name}
                          </Pill>
                        ) : (
                          <Pill className="bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 whitespace-nowrap">
                            ! Belum terklasifikasi
                          </Pill>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {pic ? (
                          <span className="flex items-center gap-2">
                            <Avatar name={pic.name} color={pic.color} size={24} />
                            <span className="text-xs font-medium">{pic.name.split(" ").slice(0, 2).join(" ")}</span>
                          </span>
                        ) : (
                          <span className="text-faint text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <Pill className={PRIORITY_META[t.priority].cls}>{PRIORITY_META[t.priority].label}</Pill>
                      </td>
                      <td className="px-3 py-3"><StatusBadge status={t.status} size="xs" /></td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {["selesai", "ditolak"].includes(t.status) ? (
                          <span className="text-xs text-faint">—</span>
                        ) : (
                          <span className={cn("text-xs font-bold tabular-nums", over ? "text-rose-600 dark:text-rose-400" : left < 6 ? "text-amber-600 dark:text-amber-400" : "text-mute")}>
                            {over ? `Lewat ${Math.abs(Math.round(left))} jam` : `${Math.max(0, Math.round(left))} jam lagi`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-faint whitespace-nowrap">{timeAgo(t.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* paginasi */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-line2">
            <p className="text-xs text-faint">
              Menampilkan <strong className="text-ink">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</strong> dari <strong className="text-ink">{filtered.length}</strong> tiket
            </p>
            <div className="flex items-center gap-1">
              <IconBtn label="Sebelumnya" onClick={() => setPage((p) => Math.max(1, p - 1))} className="w-8 h-8">
                <ChevronLeft size={16} />
              </IconBtn>
              {Array.from({ length: pages }).slice(0, 6).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={cn("w-8 h-8 rounded-lg text-xs font-semibold transition-all", page === i + 1 ? "bg-prim text-white" : "text-mute hover:bg-card2")}
                >
                  {i + 1}
                </button>
              ))}
              <IconBtn label="Berikutnya" onClick={() => setPage((p) => Math.min(pages, p + 1))} className="w-8 h-8">
                <ChevronRight size={16} />
              </IconBtn>
            </div>
          </div>
        )}
      </Card>

      {selected && <TicketDetail ticket={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
};

/* ================= Detail tiket ================= */

const TicketDetail: React.FC<{ ticket: Ticket; onClose: () => void }> = ({ ticket, onClose }) => {
  const { data, currentUser, setTicketStatus, reassignTicket, setTicketCategory, replyTicket, toast } = useStore();
  const [reply, setReply] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  const isPic = currentUser?.role === "pic";

  const cat = data.categories.find((c) => c.id === ticket.categoryId);
  const pic = data.users.find((u) => u.id === ticket.picId);
  const over = isOverdue(ticket);

  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [ticket.conversation.length, ticket.id]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const sendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    replyTicket(ticket.id, reply.trim());
    setReply("");
  };

  const tryAutoClassify = () => {
    const guess = classifyMessage(ticket.message, data.categories);
    if (guess) {
      setTicketCategory(ticket.id, guess.id);
      toast(`Terdeteksi: ${guess.name}`, "success", "Mesin kata kunci menyarankan kategori ini.");
    } else {
      toast("Tidak ada kecocokan kata kunci", "warn", "Pilih kategori secara manual.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-pine/55 backdrop-blur-[2px] anim-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-app border-l border-line h-full flex flex-col anim-slide-right">
        {/* header */}
        <div className="flex items-center gap-3 px-5 h-16 bg-card border-b border-line shrink-0">
          <div className="min-w-0 flex-1 flex items-center gap-3">
            <Avatar name={ticket.reporterName} color="#0e8a5f" size={38} />
            <div className="min-w-0">
              <p className="font-display font-bold text-[15px] leading-tight flex items-center gap-2">
                {ticket.reporterName}
                <span className="font-mono text-[11px] font-semibold text-prim bg-primsoft rounded px-1.5 py-0.5">{ticket.code}</span>
              </p>
              <p className="text-[11.5px] text-faint font-mono">{ticket.reporterNumber} · via WA Admin Pusat</p>
            </div>
          </div>
          <StatusBadge status={ticket.status} />
          {over && <Pill className="bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 hidden sm:inline-flex">Lewat SLA</Pill>}
          <IconBtn label="Tutup" onClick={onClose}><X size={18} /></IconBtn>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* percakapan */}
          <div className="flex-1 flex flex-col min-w-0">
            <div ref={chatRef} className="flex-1 overflow-y-auto chat-bg px-4 md:px-6 py-5 space-y-3">
              {ticket.conversation.map((m) => {
                if (m.from === "sistem")
                  return (
                    <div key={m.id} className="flex justify-center anim-fade-in">
                      <span className="text-[10.5px] font-medium text-mute bg-card border border-line rounded-full px-3 py-1 text-center max-w-[90%]">
                        ⚙ {m.text} · {fmtTime(m.time)}
                      </span>
                    </div>
                  );
                const incoming = m.from === "pelapor";
                return (
                  <div key={m.id} className={cn("flex anim-fade-in", incoming ? "justify-start" : "justify-end")}>
                    <div
                      className={cn(
                        "max-w-[82%] rounded-xl px-3.5 py-2.5 text-[13.5px] leading-relaxed shadow-sm",
                        incoming
                          ? "bg-card border border-line2 rounded-tl-sm"
                          : m.from === "pic"
                          ? "bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 rounded-tr-sm"
                          : "bg-[#d7f3e6] dark:bg-[#123b2c] rounded-tr-sm"
                      )}
                    >
                      {!incoming && (
                        <p className={cn("text-[10.5px] font-bold mb-0.5", m.from === "pic" ? "text-sky-600 dark:text-sky-300" : "text-primink")}>
                          {m.from === "pic" ? `👷 ${pic?.name ?? "PIC"}` : "✉ Balasan Admin"}
                        </p>
                      )}
                      {m.text}
                      <span className="flex items-center justify-end gap-1 text-[9.5px] text-faint mt-1">
                        {fmtTime(m.time)}
                        {!incoming && <CheckCheck size={12} className="text-sky-500" />}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* lampiran */}
            {ticket.attachments.length > 0 && (
              <div className="px-4 md:px-6 py-2.5 bg-card border-t border-line2 flex items-center gap-2 overflow-x-auto">
                <Paperclip size={14} className="text-faint shrink-0" />
                {ticket.attachments.map((a) => (
                  <span key={a.name} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card2 border border-line text-xs font-medium whitespace-nowrap hover:border-prim/50 cursor-pointer transition-colors">
                    {a.kind === "image" ? <ImageIcon size={13} className="text-prim" /> : <FileText size={13} className="text-amber-500" />}
                    {a.name} <span className="text-faint">({a.size})</span>
                  </span>
                ))}
              </div>
            )}

            {/* balas */}
            <form onSubmit={sendReply} className="p-3.5 bg-card border-t border-line flex items-center gap-2.5">
              <Input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={`Balas ${ticket.reporterName} via WhatsApp…`}
                className="flex-1"
              />
              <Button type="submit" disabled={!reply.trim()}><Send size={15} /> Kirim</Button>
            </form>
          </div>

          {/* panel properti */}
          <div className="lg:w-[320px] shrink-0 bg-card border-t lg:border-t-0 lg:border-l border-line overflow-y-auto">
            <div className="p-4.5 space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-faint uppercase tracking-wider mb-2">Status Tiket</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {STATUS_ORDER.map((s) => (
                    <button
                      key={s}
                      onClick={() => setTicketStatus(ticket.id, s as TicketStatus)}
                      className={cn(
                        "px-2 py-2 rounded-lg border text-[11.5px] font-semibold transition-all active:scale-95",
                        ticket.status === s
                          ? "border-prim bg-primsoft text-primink"
                          : "border-line bg-card2 text-mute hover:border-prim/40"
                      )}
                    >
                      {STATUS_META[s].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-faint uppercase tracking-wider mb-2">Kategori (filter kata kunci)</p>
                <div className="flex gap-1.5">
                  <Select
                    value={ticket.categoryId ?? "none"}
                    onChange={(e) => setTicketCategory(ticket.id, e.target.value === "none" ? null : e.target.value)}
                    className="h-9 text-[13px]"
                  >
                    <option value="none">Belum terklasifikasi</option>
                    {data.categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                  {!cat && (
                    <Button variant="soft" size="sm" onClick={tryAutoClassify} title="Deteksi otomatis dari isi pesan">
                      ✨ Deteksi
                    </Button>
                  )}
                </div>
                {cat && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {cat.keywords.slice(0, 6).map((k) => (
                      <span key={k} className="text-[10.5px] font-mono px-1.5 py-0.5 rounded bg-card2 border border-line2 text-mute">
                        {ticket.message.toLowerCase().includes(k.toLowerCase()) ? `✓ ${k}` : k}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-[11px] font-semibold text-faint uppercase tracking-wider mb-2">PIC Penanggung Jawab</p>
                <Select
                  value={ticket.picId ?? "none"}
                  disabled={isPic}
                  onChange={(e) => reassignTicket(ticket.id, e.target.value === "none" ? null : e.target.value)}
                  className="h-9 text-[13px]"
                >
                  <option value="none">— Tanpa PIC —</option>
                  {data.users.filter((u) => u.isPic && u.active).map((p) => (
                    <option key={p.id} value={p.id}>{p.name} · {p.waNumber}</option>
                  ))}
                </Select>
                {isPic && <p className="text-[10.5px] text-faint mt-1">Hanya admin yang dapat reassign tiket.</p>}
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-[12px]">
                <div className="p-2.5 rounded-lg bg-card2 border border-line2">
                  <p className="text-faint text-[10.5px] uppercase tracking-wide">Prioritas</p>
                  <p className="font-semibold mt-0.5">{PRIORITY_META[ticket.priority].label} · SLA {ticket.slaHours} jam</p>
                </div>
                <div className="p-2.5 rounded-lg bg-card2 border border-line2">
                  <p className="text-faint text-[10.5px] uppercase tracking-wide">Batas SLA</p>
                  <p className={cn("font-semibold mt-0.5", over ? "text-rose-600 dark:text-rose-400" : "")}>
                    {fmtDateTime(ticket.createdAt + ticket.slaHours * 3600_000)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-faint uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <History size={12} /> Timeline Progres
                </p>
                <div className="space-y-0">
                  {ticket.logs.map((l, i) => (
                    <div key={l.id} className="flex gap-2.5">
                      <div className="flex flex-col items-center">
                        <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", i === ticket.logs.length - 1 ? "bg-prim" : "bg-line")} />
                        {i < ticket.logs.length - 1 && <span className="w-px flex-1 bg-line my-1" />}
                      </div>
                      <div className="pb-3.5 min-w-0">
                        <p className="text-[12.5px] font-semibold leading-snug">
                          {l.from !== l.to && l.from !== "—" ? (
                            <>
                              <span className="text-mute">{STATUS_META[l.from as TicketStatus]?.label ?? l.from}</span>
                              {" → "}
                              <span className="text-prim">{STATUS_META[l.to as TicketStatus]?.label ?? l.to}</span>
                            </>
                          ) : (
                            <span>{l.note}</span>
                          )}
                        </p>
                        <p className="text-[11px] text-mute leading-snug">{l.from !== l.to && l.from !== "—" ? l.note : ""}</p>
                        <p className="text-[10.5px] text-faint mt-0.5">{l.by} · {fmtDateTime(l.time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-line2">
                <span className="text-[11px] text-faint flex items-center gap-1"><UserRound size={12} /> Detail pelapor</span>
                <button
                  onClick={async () => {
                    try { await navigator.clipboard.writeText(ticket.reporterNumber); toast("Nomor disalin", "success", ticket.reporterNumber); }
                    catch { toast("Gagal menyalin", "error"); }
                  }}
                  className="text-[11px] font-medium text-prim hover:text-prim2 flex items-center gap-1"
                >
                  <Copy size={11} /> Salin nomor
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tickets;
