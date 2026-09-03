import React, { useState } from "react";
import { Plus, Pencil, Trash2, Phone, Wifi, WifiOff, UserRound, RefreshCw, ShieldCheck } from "lucide-react";
import { useStore } from "../lib/store";
import { Card, Button, Input, Field, Modal, Segmented, Toggle, cn, Avatar, Pill, EmptyState, IconBtn } from "../components/ui";
import { ROLE_META, CAT_COLORS } from "../lib/types";
import type { Role, User, WaNumber } from "../lib/types";
import { uid, timeAgo } from "../lib/engine";

const EMPTY_USER: User = { id: "", name: "", email: "", password: "pic123", role: "pic", active: true, waNumber: "", color: "#0e8a5f", isPic: true };
const EMPTY_NUM: WaNumber = { id: "", label: "", number: "", type: "pic", provider: "Fonnte", connected: false, lastPing: Date.now() };
const AVATAR_COLORS = ["#0e8a5f", "#0e7bc4", "#e5a325", "#14a0a0", "#e05252", "#8b5cf6", "#1fa870"];

const Users: React.FC = () => {
  const { data, saveUser, deleteUser, saveNumber, deleteNumber, toggleNumber, currentUser, toast } = useStore();
  const [tab, setTab] = useState<"users" | "numbers">("users");
  const [userModal, setUserModal] = useState<User | null>(null);
  const [numModal, setNumModal] = useState<WaNumber | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmUser, setConfirmUser] = useState<User | null>(null);
  const [confirmNum, setConfirmNum] = useState<WaNumber | null>(null);

  const isSuper = currentUser?.role === "superadmin";
  const catsOf = (picId: string) => data.categories.filter((c) => c.picIds.includes(picId));

  const submitUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userModal) return;
    if (!userModal.name.trim() || !userModal.email.includes("@")) {
      toast("Nama & email wajib valid", "error");
      return;
    }
    if (data.users.some((u) => u.id !== userModal.id && u.email.toLowerCase() === userModal.email.toLowerCase())) {
      toast("Email sudah terdaftar", "error", "Gunakan email lain untuk akun ini.");
      return;
    }
    saveUser({ ...userModal, id: userModal.id || uid(), isPic: userModal.role === "pic" });
    setUserModal(null);
  };

  const submitNum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numModal) return;
    if (!numModal.label.trim() || numModal.number.replace(/\D/g, "").length < 9) {
      toast("Label & nomor WhatsApp wajib valid", "error");
      return;
    }
    saveNumber({ ...numModal, id: numModal.id || uid() });
    setNumModal(null);
  };

  const connect = async (id: string) => {
    setBusyId(id);
    await toggleNumber(id);
    setBusyId(null);
  };

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 anim-fade-up">
        <div>
          <h2 className="font-display text-xl font-bold">Pengguna & Nomor WhatsApp</h2>
          <p className="text-[13px] text-mute mt-0.5">Kelola akun admin/PIC, nomor WA Admin penerima pesan, dan nomor PIC tujuan forward.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Segmented
            value={tab}
            onChange={(v) => setTab(v as "users" | "numbers")}
            options={[
              { value: "users", label: <span className="flex items-center gap-1.5"><UserRound size={13} /> Pengguna</span> },
              { value: "numbers", label: <span className="flex items-center gap-1.5"><Phone size={13} /> Nomor WhatsApp</span> },
            ]}
            size="md"
          />
          {tab === "users" ? (
            <Button onClick={() => setUserModal({ ...EMPTY_USER, color: AVATAR_COLORS[data.users.length % AVATAR_COLORS.length] })}>
              <Plus size={16} /> Pengguna
            </Button>
          ) : (
            <Button onClick={() => setNumModal({ ...EMPTY_NUM })}>
              <Plus size={16} /> Nomor
            </Button>
          )}
        </div>
      </div>

      {tab === "users" ? (
        <Card className="anim-fade-up overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[820px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-faint border-b border-line2 bg-card2">
                  <th className="px-4 py-2.5 font-semibold">Pengguna</th>
                  <th className="px-3 py-2.5 font-semibold">Role</th>
                  <th className="px-3 py-2.5 font-semibold">No. WhatsApp</th>
                  <th className="px-3 py-2.5 font-semibold">Tanggung jawab</th>
                  <th className="px-3 py-2.5 font-semibold">Beban tiket</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => {
                  const open = data.tickets.filter((t) => t.picId === u.id && !["selesai", "ditolak"].includes(t.status)).length;
                  return (
                    <tr key={u.id} className="border-b border-line2 last:border-0 hover:bg-card2 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} color={u.color} size={34} />
                          <div>
                            <p className="font-semibold flex items-center gap-1.5">
                              {u.name}
                              {u.id === currentUser?.id && <span className="text-[10px] font-bold text-prim">(Anda)</span>}
                            </p>
                            <p className="text-[11.5px] text-faint">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3"><Pill className={ROLE_META[u.role].cls}>{ROLE_META[u.role].label}</Pill></td>
                      <td className="px-3 py-3 font-mono text-xs whitespace-nowrap">{u.waNumber || "—"}</td>
                      <td className="px-3 py-3">
                        {u.isPic ? (
                          <div className="flex flex-wrap gap-1">
                            {catsOf(u.id).length ? (
                              catsOf(u.id).map((c) => (
                                <Pill key={c.id} className={cn(CAT_COLORS[c.color]?.soft, "text-ink")}>
                                  <span className={cn("w-1.5 h-1.5 rounded-full", CAT_COLORS[c.color]?.dot)} />{c.name}
                                </Pill>
                              ))
                            ) : (
                              <span className="text-xs text-faint">Belum ada mapping</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-faint">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-display font-bold tabular-nums">{u.isPic ? open : "—"}</span>
                        <span className="text-[11px] text-faint"> aktif</span>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => {
                            if (u.id === currentUser?.id) {
                              toast("Tidak bisa menonaktifkan akun sendiri", "warn");
                              return;
                            }
                            saveUser({ ...u, active: !u.active });
                          }}
                          className="flex items-center gap-2"
                          title="Klik untuk mengubah status"
                        >
                          <Toggle checked={u.active} onChange={() => {
                            if (u.id === currentUser?.id) { toast("Tidak bisa menonaktifkan akun sendiri", "warn"); return; }
                            saveUser({ ...u, active: !u.active });
                          }} />
                          <span className={cn("text-xs font-medium", u.active ? "text-emerald-600 dark:text-emerald-400" : "text-faint")}>
                            {u.active ? "Aktif" : "Nonaktif"}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-0.5">
                          <IconBtn label="Edit" onClick={() => setUserModal({ ...u })} className="w-8 h-8"><Pencil size={14} /></IconBtn>
                          {isSuper && u.id !== currentUser?.id && (
                            <IconBtn label="Hapus" onClick={() => setConfirmUser(u)} className="w-8 h-8 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                              <Trash2 size={14} />
                            </IconBtn>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3.5 stagger">
          {data.numbers.length === 0 && (
            <Card className="sm:col-span-2 xl:col-span-3">
              <EmptyState
                icon={<Phone size={24} />}
                title="Belum ada nomor terdaftar"
                desc="Tambahkan nomor WA Admin (penerima pesan) dan nomor PIC (tujuan forward)."
                action={<Button size="sm" onClick={() => setNumModal({ ...EMPTY_NUM })}><Plus size={14} /> Tambah nomor</Button>}
              />
            </Card>
          )}
          {data.numbers.map((n) => (
            <Card key={n.id} className="p-4.5 group hover:border-prim/40 transition-all relative overflow-hidden">
              <span className={cn("absolute inset-x-0 top-0 h-1", n.type === "admin" ? "bg-prim" : "bg-amber-400")} />
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className={cn("w-10 h-10 rounded-xl flex items-center justify-center", n.type === "admin" ? "bg-primsoft text-primink" : "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300")}>
                    <Phone size={17} />
                  </span>
                  <div>
                    <p className="font-display font-semibold text-[14px] leading-tight">{n.label}</p>
                    <p className="text-[11px] text-faint uppercase tracking-wide font-semibold">
                      {n.type === "admin" ? "WA Admin · penerima" : "WA PIC · tujuan forward"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setNumModal({ ...n })} className="p-1.5 rounded-md text-mute hover:text-ink hover:bg-card2" title="Edit"><Pencil size={14} /></button>
                  <button onClick={() => setConfirmNum(n)} className="p-1.5 rounded-md text-mute hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10" title="Hapus"><Trash2 size={14} /></button>
                </div>
              </div>

              <p className="font-mono text-[15px] font-semibold mt-3">{n.number}</p>

              <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-line2">
                <div className="flex items-center gap-2">
                  <span className={cn("relative flex w-2.5 h-2.5", n.connected ? "text-emerald-500" : "text-rose-400")}>
                    <span className={cn("w-2.5 h-2.5 rounded-full", n.connected ? "bg-emerald-500 ping-dot" : "bg-rose-400")} />
                  </span>
                  <div>
                    <p className={cn("text-xs font-bold", n.connected ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                      {n.connected ? "Connected" : "Disconnected"}
                    </p>
                    <p className="text-[10px] text-faint">
                      {n.provider} · ping {n.connected ? timeAgo(n.lastPing) : "terakhir " + timeAgo(n.lastPing)}
                    </p>
                  </div>
                </div>
                <Button
                  size="xs"
                  variant={n.connected ? "outline" : "primary"}
                  onClick={() => connect(n.id)}
                  loading={busyId === n.id}
                >
                  {n.connected ? <><WifiOff size={12} /> Putus</> : <><RefreshCw size={12} /> Sambungkan</>}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* info keamanan */}
      <div className="flex items-start gap-2.5 text-[12px] text-faint px-1">
        <ShieldCheck size={14} className="text-prim shrink-0 mt-0.5" />
        <p>Password disimpan ter-hash (bcrypt/argon2 di server produksi). Sesi menggunakan JWT + refresh token; rate-limiting aktif pada endpoint login & webhook.</p>
      </div>

      {/* modal pengguna */}
      <Modal open={userModal !== null} onClose={() => setUserModal(null)} title={userModal?.id ? `Edit — ${userModal.name}` : "Pengguna baru"} width="max-w-xl">
        {userModal && (
          <form onSubmit={submitUser} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Nama lengkap"><Input value={userModal.name} onChange={(e) => setUserModal({ ...userModal, name: e.target.value })} autoFocus /></Field>
              <Field label="Email login"><Input type="email" value={userModal.email} onChange={(e) => setUserModal({ ...userModal, email: e.target.value })} /></Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Password awal" hint="Dibagikan ke pengguna untuk login pertama.">
                <Input value={userModal.password} onChange={(e) => setUserModal({ ...userModal, password: e.target.value })} />
              </Field>
              <Field label="Role">
                <select
                  className="w-full h-10 px-3 rounded-lg border border-line bg-card2 text-sm focus:outline-none focus:border-prim"
                  value={userModal.role}
                  disabled={!isSuper}
                  onChange={(e) => setUserModal({ ...userModal, role: e.target.value as Role })}
                >
                  <option value="superadmin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="pic">PIC / Petugas</option>
                </select>
              </Field>
            </div>
            <div className="grid sm:grid-cols-[1fr_180px] gap-3">
              <Field label="Nomor WhatsApp" hint="Untuk PIC: nomor yang menerima forward tiket.">
                <Input value={userModal.waNumber} onChange={(e) => setUserModal({ ...userModal, waNumber: e.target.value })} placeholder="+62 812-…" />
              </Field>
              <Field label="Warna avatar">
                <div className="flex items-center gap-1.5 h-10">
                  {AVATAR_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setUserModal({ ...userModal, color: c })}
                      className={cn("w-6 h-6 rounded-full transition-transform", userModal.color === c ? "scale-110 ring-2 ring-offset-2 ring-prim ring-offset-card" : "hover:scale-110")}
                      style={{ background: c }} aria-label={c} />
                  ))}
                </div>
              </Field>
            </div>
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 text-[13px] font-medium">
                <Toggle checked={userModal.active} onChange={(v) => setUserModal({ ...userModal, active: v })} /> Akun aktif
              </label>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setUserModal(null)}>Batal</Button>
                <Button type="submit">Simpan</Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* modal nomor */}
      <Modal open={numModal !== null} onClose={() => setNumModal(null)} title={numModal?.id ? `Edit — ${numModal.label}` : "Nomor WhatsApp baru"} width="max-w-lg">
        {numModal && (
          <form onSubmit={submitNum} className="space-y-4">
            <Field label="Label / nama perangkat">
              <Input value={numModal.label} onChange={(e) => setNumModal({ ...numModal, label: e.target.value })} placeholder="mis. WA Admin Pusat" autoFocus />
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Nomor WhatsApp">
                <Input value={numModal.number} onChange={(e) => setNumModal({ ...numModal, number: e.target.value })} placeholder="+62 811-…" />
              </Field>
              <Field label="Tipe">
                <Segmented
                  value={numModal.type}
                  onChange={(v) => setNumModal({ ...numModal, type: v as "admin" | "pic" })}
                  options={[
                    { value: "admin", label: "Admin" },
                    { value: "pic", label: "PIC" },
                  ]}
                  size="md"
                />
              </Field>
            </div>
            <Field label="Provider API">
              <select
                className="w-full h-10 px-3 rounded-lg border border-line bg-card2 text-sm focus:outline-none focus:border-prim"
                value={numModal.provider}
                onChange={(e) => setNumModal({ ...numModal, provider: e.target.value })}
              >
                {["Fonnte", "Wablas", "Qontak", "Meta Cloud API"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => setNumModal(null)}>Batal</Button>
              <Button type="submit">Simpan nomor</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* konfirmasi hapus */}
      <Modal open={!!(confirmUser || confirmNum)} onClose={() => { setConfirmUser(null); setConfirmNum(null); }} title="Hapus data?"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setConfirmUser(null); setConfirmNum(null); }}>Batal</Button>
            <Button variant="danger" onClick={() => {
              if (confirmUser) deleteUser(confirmUser.id);
              if (confirmNum) deleteNumber(confirmNum.id);
              setConfirmUser(null); setConfirmNum(null);
            }}>
              <Trash2 size={14} /> Ya, hapus
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed">
          {confirmUser && <>Akun <strong>{confirmUser.name}</strong> akan dihapus. Tiket yang sedang ia pegang akan kehilangan PIC dan perlu di-reassign.</>}
          {confirmNum && <>Nomor <strong>{confirmNum.label} ({confirmNum.number})</strong> akan dihapus dari daftar perangkat.</>}
        </p>
      </Modal>
    </div>
  );
};

export default Users;
