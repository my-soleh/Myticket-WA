import React, { useRef, useState } from "react";
import {
  Palette, Sun, Moon, Plug, Table2, ShieldCheck, AlertTriangle, Upload,
  Trash2, KeyRound, Link2, CheckCircle2, RefreshCw, Image as ImageIcon, Sparkles,
} from "lucide-react";
import { useStore } from "../lib/store";
import { Card, Button, Input, Field, Segmented, Toggle, cn as cnBase, CopyBtn } from "../components/ui";
import { maskKey } from "../lib/engine";

type Section = "branding" | "appearance" | "whatsapp" | "sheets" | "roles";

const SECTIONS: { id: Section; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "branding", label: "Logo & Branding", icon: <Palette size={16} />, desc: "Logo, nama aplikasi, warna aksen" },
  { id: "appearance", label: "Mode Tampilan", icon: <Sun size={16} />, desc: "Light / dark mode" },
  { id: "whatsapp", label: "Integrasi WhatsApp", icon: <Plug size={16} />, desc: "Provider API & webhook" },
  { id: "sheets", label: "Google Spreadsheet", icon: <Table2 size={16} />, desc: "Sinkronisasi otomatis" },
  { id: "roles", label: "Role & Hak Akses", icon: <ShieldCheck size={16} />, desc: "Matriks izin per role" },
];

const ACCENTS = [
  { id: "emerald", label: "Emerald", hex: "#0e8a5f" },
  { id: "teal", label: "Teal", hex: "#0e9aa7" },
  { id: "sky", label: "Sky", hex: "#0e7bc4" },
  { id: "amber", label: "Amber", hex: "#c07f10" },
  { id: "rose", label: "Rose", hex: "#d64560" },
] as const;

const Settings: React.FC = () => {
  const store = useStore();
  const { data, currentUser, updateSettings, theme, setTheme, toast, addLog, resetDemo } = store;
  const s = data.settings;
  const isSuper = currentUser?.role === "superadmin";
  const isPic = currentUser?.role === "pic";
  const visible = SECTIONS.filter((sec) => (isPic ? sec.id === "appearance" : isSuper ? true : sec.id !== "roles"));

  const [active, setActive] = useState<Section>(visible[0].id);
  const [testBusy, setTestBusy] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onLogoFile = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast("File harus berupa gambar", "error", "Format: PNG, JPG, atau SVG.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateSettings({ logo: reader.result as string });
      addLog("settings", "Unggah logo aplikasi", f.name);
      toast("Logo diperbarui", "success", "Logo & favicon sekarang memakai unggahan Anda.");
    };
    reader.readAsDataURL(f);
  };

  const runTest = async () => {
    setTestBusy(true);
    await new Promise((r) => setTimeout(r, 1500));
    setTestBusy(false);
    toast("Koneksi berhasil 🎉", "success", `${s.provider.provider} merespon dalam 240ms · saldo sesi normal.`);
    addLog("settings", "Test koneksi provider", `${s.provider.provider} · OK`);
  };

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
      <div className="grid md:grid-cols-[240px_1fr] gap-4 items-start">
        {/* nav seksi */}
        <div className="md:sticky md:top-20 anim-fade-up">
          <div className="flex md:flex-col gap-1.5 overflow-x-auto pb-1">
            {visible.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActive(sec.id)}
                className={cnBase(
                  "flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all shrink-0 md:shrink min-w-[190px] md:min-w-0",
                  active === sec.id
                    ? "bg-pine text-mint border-pine shadow-md"
                    : "bg-card border-line text-mute hover:text-ink hover:border-prim/40"
                )}
              >
                <span className={cnBase(active === sec.id ? "text-prim2" : "")}>{sec.icon}</span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold whitespace-nowrap">{sec.label}</span>
                  <span className={cnBase("block text-[10.5px] whitespace-nowrap", active === sec.id ? "text-mintdim" : "text-faint")}>{sec.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 min-w-0">
          {/* ---------- BRANDING ---------- */}
          {active === "branding" && (
            <>
              <Card title={<span className="flex items-center gap-2"><ImageIcon size={16} className="text-prim" /> Logo Aplikasi</span>} className="anim-pop">
                <div className="px-5 pb-5 flex flex-col sm:flex-row gap-6">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-line bg-card2 flex items-center justify-center overflow-hidden chat-bg">
                      {s.logo ? (
                        <img src={s.logo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="w-20 h-20"><LogoPreview /></span>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onLogoFile(e.target.files?.[0])} />
                    <div className="flex gap-2">
                      <Button size="sm" variant="soft" onClick={() => fileRef.current?.click()}>
                        <Upload size={14} /> Unggah
                      </Button>
                      {s.logo && (
                        <Button size="sm" variant="ghost" onClick={() => { updateSettings({ logo: null }); toast("Logo dikembalikan ke preset", "info"); }}>
                          <Trash2 size={14} /> Hapus
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-2">Preset logo bawaan</p>
                      <div className="flex gap-2.5">
                        {[0, 1, 2, 3].map((i) => (
                          <button
                            key={i}
                            onClick={() => { updateSettings({ logoPreset: i, logo: null }); toast("Preset logo diterapkan", "success"); }}
                            className={cnBase(
                              "w-14 h-14 rounded-xl border-2 p-1.5 transition-all hover:scale-105",
                              !s.logo && s.logoPreset === i ? "border-prim ring-2 ring-prim/25" : "border-line hover:border-prim/40"
                            )}
                            title={`Preset ${i + 1}`}
                          >
                            <PresetThumb i={i} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="Nama aplikasi">
                        <Input value={s.appName} onChange={(e) => updateSettings({ appName: e.target.value })} />
                      </Field>
                      <Field label="Tagline">
                        <Input value={s.tagline} onChange={(e) => updateSettings({ tagline: e.target.value })} />
                      </Field>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-2">Warna aksen tema</p>
                      <div className="flex flex-wrap gap-2">
                        {ACCENTS.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => { updateSettings({ accent: a.id }); toast(`Aksen "${a.label}" diterapkan`, "success"); }}
                            className={cnBase(
                              "flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border text-xs font-semibold transition-all",
                              s.accent === a.id ? "border-prim bg-primsoft text-primink" : "border-line text-mute hover:border-prim/40"
                            )}
                          >
                            <span className="w-4 h-4 rounded-full" style={{ background: a.hex }} />
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11.5px] text-faint leading-relaxed">
                      Logo unggahan otomatis menjadi favicon browser & logo sidebar. Perubahan tersimpan di <code className="font-mono bg-card2 px-1 rounded">app_settings</code> dan dipakai seluruh sesi pengguna.
                    </p>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* ---------- APPEARANCE ---------- */}
          {active === "appearance" && (
            <Card title={<span className="flex items-center gap-2"><Sparkles size={16} className="text-prim" /> Mode Tampilan</span>} className="anim-pop">
              <div className="px-5 pb-5 space-y-5">
                <div className="grid sm:grid-cols-2 gap-3">
                  {([
                    { id: "light", label: "Mode Terang", desc: "Latar cerah, cocok untuk siang hari", icon: <Sun size={20} /> },
                    { id: "dark", label: "Mode Gelap", desc: "Redup & nyaman, hemat baterai", icon: <Moon size={20} /> },
                  ] as const).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setTheme(m.id); toast(`${m.label} aktif`, "success", "Preferensi tersimpan di perangkat ini."); }}
                      className={cnBase(
                        "relative rounded-xl border-2 p-5 text-left transition-all hover:border-prim/50",
                        theme === m.id ? "border-prim bg-primsoft/60" : "border-line bg-card2"
                      )}
                    >
                      {theme === m.id && (
                        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-prim text-white flex items-center justify-center">
                          <CheckCircle2 size={13} />
                        </span>
                      )}
                      <span className={cnBase("inline-flex w-11 h-11 rounded-xl items-center justify-center mb-3", theme === m.id ? "bg-prim text-white" : "bg-card border border-line text-mute")}>
                        {m.icon}
                      </span>
                      <p className="font-display font-semibold">{m.label}</p>
                      <p className="text-xs text-mute mt-0.5">{m.desc}</p>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-line bg-card2">
                  <div>
                    <p className="text-[13.5px] font-semibold">Mode default pengguna baru</p>
                    <p className="text-xs text-mute">Dipakai saat login pertama kali di perangkat baru.</p>
                  </div>
                  <Segmented
                    value={s.themeDefault}
                    onChange={(v) => updateSettings({ themeDefault: v as "light" | "dark" })}
                    options={[
                      { value: "light", label: "Terang" },
                      { value: "dark", label: "Gelap" },
                    ]}
                  />
                </div>
                <p className="text-[11.5px] text-faint">Preferensi mode tersimpan di <code className="font-mono bg-card2 px-1 rounded">localStorage</code> per perangkat dan berpindah halus dengan transisi warna.</p>
              </div>
            </Card>
          )}

          {/* ---------- WHATSAPP ---------- */}
          {active === "whatsapp" && (
            <>
              <Card title={<span className="flex items-center gap-2"><Plug size={16} className="text-prim" /> Provider API WhatsApp</span>} className="anim-pop"
                action={
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="relative flex w-2 h-2"><span className="w-2 h-2 rounded-full bg-emerald-500 ping-dot text-emerald-500" /></span>
                    TERHUBUNG
                  </span>
                }
              >
                <div className="px-5 pb-5 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Provider aktif" hint="Modular adapter — ganti provider tanpa mengubah logic inti.">
                      <div className="grid grid-cols-2 gap-1.5">
                        {["Fonnte", "Wablas", "Qontak", "Meta Cloud API"].map((p) => (
                          <button
                            key={p}
                            onClick={() => { updateSettings({ provider: { ...s.provider, provider: p } }); toast(`Provider diganti ke ${p}`, "info", "Pastikan API key sesuai provider."); }}
                            className={cnBase(
                              "px-3 py-2.5 rounded-lg border text-[13px] font-semibold transition-all",
                              s.provider.provider === p ? "border-prim bg-primsoft text-primink" : "border-line bg-card2 text-mute hover:border-prim/40"
                            )}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label="API Key / Token" hint="Tersimpan terenkripsi (AES-256) di server.">
                      <div className="relative">
                        <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                        <Input
                          type={showKey ? "text" : "password"}
                          className="pl-9 pr-16 font-mono text-[13px]"
                          value={s.provider.apiKey}
                          onChange={(e) => updateSettings({ provider: { ...s.provider, apiKey: e.target.value } })}
                        />
                        <button onClick={() => setShowKey((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-prim">
                          {showKey ? "Sembunyikan" : "Lihat"} · {maskKey(s.provider.apiKey)}
                        </button>
                      </div>
                    </Field>
                  </div>

                  <Field label="Webhook URL (pesan masuk)" hint="Pasang URL ini di dashboard provider agar pesan masuk dikirim ke sistem.">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 px-3 h-10 rounded-lg border border-line bg-card2 font-mono text-[12.5px] text-mute overflow-hidden">
                        <Link2 size={13} className="shrink-0 text-prim" />
                        <span className="truncate">{s.provider.webhook}</span>
                      </div>
                      <CopyBtn text={s.provider.webhook} label="Salin URL" />
                    </div>
                  </Field>

                  <div className="grid sm:grid-cols-2 gap-2.5">
                    <div className="flex items-center justify-between p-3 rounded-xl border border-line bg-card2">
                      <div>
                        <p className="text-[13px] font-semibold">Auto-reply ke pelapor</p>
                        <p className="text-[11px] text-mute">Kirim konfirmasi tiket otomatis</p>
                      </div>
                      <Toggle checked={s.provider.autoReply} onChange={(v) => updateSettings({ provider: { ...s.provider, autoReply: v } })} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-line bg-card2">
                      <div>
                        <p className="text-[13px] font-semibold">Auto-forward ke PIC</p>
                        <p className="text-[11px] text-mute">Round-robin sesuai mapping kategori</p>
                      </div>
                      <Toggle checked={s.provider.autoForward} onChange={(v) => updateSettings({ provider: { ...s.provider, autoForward: v } })} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[11.5px] text-faint">Rate-limit webhook: 60 req/menit · validasi tanda tangan HMAC aktif.</p>
                    <Button onClick={runTest} loading={testBusy}><Plug size={15} /> Uji koneksi</Button>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* ---------- SHEETS ---------- */}
          {active === "sheets" && (
            <Card title={<span className="flex items-center gap-2"><Table2 size={16} className="text-prim" /> Sinkronisasi Google Spreadsheet</span>} className="anim-pop"
              action={
                <span className={cnBase("flex items-center gap-1.5 text-[11px] font-bold", s.sheet.connected ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                  <span className={cnBase("w-2 h-2 rounded-full", s.sheet.connected ? "bg-emerald-500" : "bg-rose-500")} />
                  {s.sheet.connected ? "TERHUBUNG" : "TERPUTUS"}
                </span>
              }
            >
              <div className="px-5 pb-5 space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-line bg-card2">
                  <div>
                    <p className="text-[13.5px] font-semibold">Akun Google (Service Account)</p>
                    <p className="text-xs text-mute">sheet-sync@waticket.iam.gserviceaccount.com</p>
                  </div>
                  <Button
                    size="sm"
                    variant={s.sheet.connected ? "outline" : "primary"}
                    onClick={() => {
                      updateSettings({ sheet: { ...s.sheet, connected: !s.sheet.connected } });
                      toast(s.sheet.connected ? "Koneksi Google diputus" : "Akun Google terhubung", s.sheet.connected ? "warn" : "success");
                      addLog("settings", s.sheet.connected ? "Putus koneksi Google" : "Hubungkan akun Google", "OAuth2 service account");
                    }}
                  >
                    {s.sheet.connected ? "Putuskan" : "Hubungkan akun"}
                  </Button>
                </div>

                <div className={cnBase("space-y-4 transition-opacity", !s.sheet.connected && "opacity-50 pointer-events-none")}>
                  <div className="grid sm:grid-cols-[1fr_180px] gap-3">
                    <Field label="Spreadsheet ID" hint="Dari URL: docs.google.com/spreadsheets/d/<ID>/edit">
                      <Input className="font-mono text-[12.5px]" value={s.sheet.spreadsheetId} onChange={(e) => updateSettings({ sheet: { ...s.sheet, spreadsheetId: e.target.value } })} />
                    </Field>
                    <Field label="Nama sheet">
                      <Input value={s.sheet.sheetName} onChange={(e) => updateSettings({ sheet: { ...s.sheet, sheetName: e.target.value } })} />
                    </Field>
                  </div>
                  <Field label="Jadwal sinkronisasi">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {([
                        { id: "realtime", label: "Realtime", desc: "tiap perubahan" },
                        { id: "15m", label: "15 menit", desc: "cron */15" },
                        { id: "hourly", label: "Tiap jam", desc: "cron 0 *" },
                        { id: "daily", label: "Harian", desc: "23:00 WIB" },
                      ] as const).map((o) => (
                        <button
                          key={o.id}
                          onClick={() => updateSettings({ sheet: { ...s.sheet, schedule: o.id } })}
                          className={cnBase(
                            "px-3 py-2.5 rounded-lg border text-left transition-all",
                            s.sheet.schedule === o.id ? "border-prim bg-primsoft" : "border-line bg-card2 hover:border-prim/40"
                          )}
                        >
                          <span className="block text-[13px] font-semibold">{o.label}</span>
                          <span className="block text-[10.5px] text-faint">{o.desc}</span>
                        </button>
                      ))}
                    </div>
                  </Field>
                  <p className="text-[11.5px] text-faint">
                    Kolom yang disinkronkan: kode, tanggal, pelapor, nomor, kategori, PIC, status, prioritas, SLA, update terakhir. Sinkron terakhir: {s.sheet.lastSync ? new Date(s.sheet.lastSync).toLocaleString("id-ID") : "belum pernah"}.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* ---------- ROLES ---------- */}
          {active === "roles" && isSuper && (
            <Card title={<span className="flex items-center gap-2"><ShieldCheck size={16} className="text-prim" /> Matriks Hak Akses (RBAC)</span>} className="anim-pop">
              <div className="px-5 pb-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px] min-w-[560px]">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wider text-faint border-b border-line2">
                        <th className="py-2.5 pr-3 font-semibold">Modul</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Lihat</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Kelola</th>
                        <th className="py-2.5 pl-3 font-semibold">Berlaku untuk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(s.roles).map(([mod, perm]) => (
                        <tr key={mod} className="border-b border-line2 last:border-0">
                          <td className="py-3 pr-3 font-semibold capitalize">{mod === "logs" ? "Log Aktivitas" : mod}</td>
                          {(["view", "manage"] as const).map((k) => (
                            <td key={k} className="py-3 px-3 text-center">
                              <Toggle
                                checked={perm[k]}
                                label={`${mod} ${k}`}
                                onChange={(v) => updateSettings({ roles: { ...s.roles, [mod]: { ...perm, [k]: v } } })}
                              />
                            </td>
                          ))}
                          <td className="py-3 pl-3 text-xs text-mute">
                            {["users", "settings"].includes(mod) ? "Super Admin & Admin" : "Admin & PIC (sesuai scope)"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11.5px] text-faint mt-3">Super Admin selalu memiliki akses penuh. Perubahan berlaku untuk sesi berikutnya (JWT claim diperbarui saat refresh token).</p>
              </div>
            </Card>
          )}

          {/* danger zone */}
          {isSuper && (
            <Card className="anim-fade-up border-rose-200 dark:border-rose-500/25">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 flex items-center justify-center">
                    <AlertTriangle size={18} />
                  </span>
                  <div>
                    <p className="font-display font-semibold text-[14px]">Reset data demo</p>
                    <p className="text-xs text-mute">Kembalikan seluruh tiket, kategori, dan pengaturan ke kondisi awal.</p>
                  </div>
                </div>
                {confirmReset ? (
                  <div className="flex items-center gap-2 anim-pop">
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Yakin? Data hilang permanen.</span>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>Batal</Button>
                    <Button size="sm" variant="danger" onClick={resetDemo}><Trash2 size={14} /> Ya, reset</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setConfirmReset(true)}>Reset data…</Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

/* pratinjau preset logo (mirip AppLogo, versi statik utk settings) */
const LogoPreview: React.FC = () => {
  const { data } = useStore();
  const i = Math.min(data.settings.logoPreset, 3);
  return <PresetThumb i={i} />;
};

const PresetThumb: React.FC<{ i: number }> = ({ i }) => {
  const marks = [
    <svg key="0" viewBox="0 0 64 64" className="w-full h-full"><rect width="64" height="64" rx="16" className="fill-pine dark:fill-pine3" /><path d="M32 12c-11 0-20 8-20 18 0 4.4 1.8 8.4 4.8 11.6L15 52l11.2-4.4c1.8.5 3.7.8 5.8.8 11 0 20-8 20-18S43 12 32 12z" className="fill-prim" /><path d="M24 31l5 5 11-11" stroke="var(--pine)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    <svg key="1" viewBox="0 0 64 64" className="w-full h-full"><rect width="64" height="64" rx="16" className="fill-prim" /><rect x="18" y="22" width="28" height="22" rx="8" className="fill-pine" /><circle cx="27" cy="33" r="2.6" className="fill-prim" /><circle cx="37" cy="33" r="2.6" className="fill-prim" /><path d="M14 34a18 18 0 0 1 36 0" stroke="var(--pine)" strokeWidth="3.4" fill="none" strokeLinecap="round" /><rect x="11" y="32" width="6" height="10" rx="3" className="fill-pine" /><rect x="47" y="32" width="6" height="10" rx="3" className="fill-pine" /></svg>,
    <svg key="2" viewBox="0 0 64 64" className="w-full h-full"><rect width="64" height="64" rx="16" className="fill-pine dark:fill-pine3" /><path d="M50 16 14 30l12 5 5 13z" className="fill-prim" /><path d="M26 35l10-9" stroke="var(--pine)" strokeWidth="2.6" strokeLinecap="round" /></svg>,
    <svg key="3" viewBox="0 0 64 64" className="w-full h-full"><rect width="64" height="64" rx="16" className="fill-prim" /><path d="M32 10l16 6v14c0 11-7 18-16 22-9-4-16-11-16-22V16z" className="fill-pine" /><path d="M24 30c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8c-1 0-2-.2-2.9-.5L24 39l1.6-4.6A7.9 7.9 0 0 1 24 30z" className="fill-prim" /></svg>,
  ];
  return marks[i];
};

export default Settings;
