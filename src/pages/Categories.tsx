import React, { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Tags, KeyRound, X } from "lucide-react";
import { useStore } from "../lib/store";
import { Card, Button, Input, Textarea, Select, Field, Modal, Pill, cn, EmptyState, Avatar, Toggle } from "../components/ui";
import { CAT_COLORS } from "../lib/types";
import type { Category } from "../lib/types";
import { uid, classifyMessage } from "../lib/engine";

const EMPTY: Category = { id: "", name: "", description: "", color: "emerald", keywords: [], picIds: [], active: true };

const Categories: React.FC = () => {
  const { data, saveCategory, deleteCategory, toast } = useStore();
  const [modal, setModal] = useState<null | Category>(null);
  const [kwInput, setKwInput] = useState("");
  const [test, setTest] = useState("");
  const [confirmDel, setConfirmDel] = useState<Category | null>(null);

  const pics = data.users.filter((u) => u.isPic);
  const ticketCount = (id: string) => data.tickets.filter((t) => t.categoryId === id).length;

  const testResult = useMemo(
    () => (test.trim() ? classifyMessage(test, data.categories) : null),
    [test, data.categories]
  );

  const addKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!modal) return;
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const v = kwInput.trim().replace(/,$/, "");
      if (v && !modal.keywords.includes(v)) {
        setModal({ ...modal, keywords: [...modal.keywords, v] });
      }
      setKwInput("");
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    if (!modal.name.trim()) {
      toast("Nama kategori wajib diisi", "error");
      return;
    }
    const finalKw = kwInput.trim() ? [...modal.keywords, kwInput.trim()] : modal.keywords;
    saveCategory({ ...modal, id: modal.id || uid(), keywords: finalKw });
    setModal(null);
    setKwInput("");
  };

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-4">
      {/* header + tester */}
      <div className="grid lg:grid-cols-3 gap-3.5 anim-fade-up">
        <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">Kategori Kendala / Pengaduan</h2>
            <p className="text-[13px] text-mute mt-0.5">
              Setiap kategori punya <strong>filter kata kunci</strong> untuk deteksi otomatis dan mapping ke nomor WhatsApp PIC.
            </p>
          </div>
          <Button onClick={() => { setModal({ ...EMPTY }); setKwInput(""); }}>
            <Plus size={16} /> Kategori baru
          </Button>
        </div>

        <Card className="p-4">
          <p className="text-[11px] font-semibold text-faint uppercase tracking-wider flex items-center gap-1.5">
            <KeyRound size={12} /> Uji mesin kata kunci
          </p>
          <Input value={test} onChange={(e) => setTest(e.target.value)} placeholder="Contoh: lampu jalan mati…" className="mt-2 h-9 text-[13px]" />
          <p className="text-xs mt-2 leading-snug">
            {test.trim() === "" ? (
              <span className="text-faint">Ketik pesan untuk melihat kategori yang terdeteksi.</span>
            ) : testResult ? (
              <span className="text-primink font-semibold">✓ Terdeteksi: {testResult.name}</span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 font-semibold">✗ Tidak cocok — akan masuk “Belum Terklasifikasi”</span>
            )}
          </p>
        </Card>
      </div>

      {/* grid kategori */}
      {data.categories.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Tags size={24} />}
            title="Belum ada kategori"
            desc="Buat kategori pertama beserta kata kunci agar pesan masuk bisa diklasifikasi otomatis."
            action={<Button size="sm" onClick={() => setModal({ ...EMPTY })}><Plus size={14} /> Buat kategori</Button>}
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3.5 stagger">
          {data.categories.map((c) => {
            const col = CAT_COLORS[c.color] ?? CAT_COLORS.slate;
            const mapped = c.picIds.map((id) => data.users.find((u) => u.id === id)).filter(Boolean);
            return (
              <Card key={c.id} className={cn("p-4.5 group relative overflow-hidden hover:border-prim/40 transition-all", !c.active && "opacity-60")}>
                <span className={cn("absolute inset-x-0 top-0 h-1", col.dot)} />
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", col.soft)}>
                      <Tags size={16} className="text-ink" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-[14.5px] truncate">{c.name}</p>
                      <p className="text-[11px] text-faint">{ticketCount(c.id)} tiket · {c.keywords.length} kata kunci</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setModal({ ...c }); setKwInput(""); }} className="p-1.5 rounded-md text-mute hover:text-ink hover:bg-card2" title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setConfirmDel(c)} className="p-1.5 rounded-md text-mute hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10" title="Hapus">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-mute mt-2.5 leading-relaxed line-clamp-2">{c.description}</p>

                <div className="flex flex-wrap gap-1 mt-3">
                  {c.keywords.slice(0, 6).map((k) => (
                    <span key={k} className="font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-card2 border border-line2 text-mute">
                      {k}
                    </span>
                  ))}
                  {c.keywords.length > 6 && (
                    <span className="text-[10.5px] px-1.5 py-0.5 text-faint">+{c.keywords.length - 6} lagi</span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-line2">
                  <div className="flex items-center">
                    {mapped.length > 0 ? (
                      <>
                        <div className="flex -space-x-1.5">
                          {mapped.map((p) => p && <Avatar key={p.id} name={p.name} color={p.color} size={24} className="ring-2 ring-card" />)}
                        </div>
                        <span className="text-[11px] text-mute ml-2">
                          {mapped.map((p) => p?.name.split(" ")[0]).join(", ")}
                          {c.picIds.length > 1 && <span className="text-faint"> · round-robin</span>}
                        </span>
                      </>
                    ) : (
                      <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">⚠ Belum ada PIC ter-mapping</span>
                    )}
                  </div>
                  <Pill className={c.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-line2 text-mute"}>
                    {c.active ? "Aktif" : "Nonaktif"}
                  </Pill>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* modal form */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.id ? `Edit kategori — ${modal.name}` : "Kategori baru"}
        width="max-w-xl"
      >
        {modal && (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid sm:grid-cols-[1fr_150px] gap-3">
              <Field label="Nama kategori">
                <Input value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} placeholder="mis. Taman & Ruang Publik" autoFocus />
              </Field>
              <Field label="Warna label">
                <div className="flex items-center gap-1.5 h-10 flex-wrap">
                  {Object.entries(CAT_COLORS).map(([key, v]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setModal({ ...modal, color: key })}
                      className={cn("w-6 h-6 rounded-full transition-transform", v.dot, modal.color === key ? "scale-110 ring-2 ring-offset-2 ring-prim ring-offset-card" : "hover:scale-110")}
                      aria-label={key}
                    />
                  ))}
                </div>
              </Field>
            </div>

            <Field label="Deskripsi">
              <Textarea value={modal.description} onChange={(e) => setModal({ ...modal, description: e.target.value })} placeholder="Jenis kendala yang termasuk kategori ini…" rows={2} />
            </Field>

            <Field label="Filter kata kunci" hint="Tekan Enter atau koma untuk menambah. Pesan yang mengandung kata ini akan otomatis masuk kategori ini.">
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg border border-line bg-card2 focus-within:border-prim focus-within:ring-2 focus-within:ring-prim/20 transition-all">
                {modal.keywords.map((k) => (
                  <span key={k} className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-md bg-primsoft text-primink text-xs font-medium anim-pop">
                    {k}
                    <button type="button" onClick={() => setModal({ ...modal, keywords: modal.keywords.filter((x) => x !== k) })} className="hover:bg-prim/20 rounded p-0.5">
                      <X size={11} />
                    </button>
                  </span>
                ))}
                <input
                  value={kwInput}
                  onChange={(e) => setKwInput(e.target.value)}
                  onKeyDown={addKeyword}
                  placeholder={modal.keywords.length ? "" : "mis. jalan, berlubang, aspal…"}
                  className="flex-1 min-w-[140px] bg-transparent text-sm focus:outline-none placeholder:text-faint py-1"
                />
              </div>
            </Field>

            <Field label="Mapping PIC (round-robin bila lebih dari satu)" hint="Pesan akan diforward otomatis ke nomor WhatsApp PIC terpilih.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {pics.map((p) => {
                  const on = modal.picIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setModal({
                          ...modal,
                          picIds: on ? modal.picIds.filter((x) => x !== p.id) : [...modal.picIds, p.id],
                        })
                      }
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-2 rounded-lg border text-left transition-all",
                        on ? "border-prim bg-primsoft" : "border-line bg-card2 hover:border-prim/40",
                        !p.active && "opacity-50"
                      )}
                    >
                      <Avatar name={p.name} color={p.color} size={28} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold truncate">{p.name}</span>
                        <span className="block text-[10.5px] text-faint font-mono">{p.waNumber}</span>
                      </span>
                      <span className={cn("w-4 h-4 rounded border flex items-center justify-center text-[10px]", on ? "bg-prim border-prim text-white" : "border-line bg-card")}>
                        {on && "✓"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 text-[13px] font-medium">
                <Toggle checked={modal.active} onChange={(v) => setModal({ ...modal, active: v })} />
                Kategori aktif (ikut deteksi otomatis)
              </label>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setModal(null)}>Batal</Button>
                <Button type="submit">{modal.id ? "Simpan perubahan" : "Buat kategori"}</Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* konfirmasi hapus */}
      <Modal open={confirmDel !== null} onClose={() => setConfirmDel(null)} title="Hapus kategori?" width="max-w-md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDel(null)}>Batal</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmDel) deleteCategory(confirmDel.id);
                setConfirmDel(null);
              }}
            >
              <Trash2 size={14} /> Ya, hapus
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed">
          Kategori <strong>{confirmDel?.name}</strong> akan dihapus permanen.
          {" "}{ticketCount(confirmDel?.id ?? "") > 0 && (
            <>Sebanyak <strong>{ticketCount(confirmDel?.id ?? "")} tiket</strong> terkait akan dipindahkan ke <em>Belum Terklasifikasi</em>.</>
          )}
        </p>
      </Modal>
    </div>
  );
};

export default Categories;
