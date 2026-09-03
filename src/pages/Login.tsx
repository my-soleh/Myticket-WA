import React, { useEffect, useMemo, useState } from "react";
import {
  Eye, EyeOff, ArrowRight, CheckCheck, Mail, Lock, KeyRound, ShieldCheck,
  Zap, RotateCcw, Bot, Sparkles,
} from "lucide-react";
import { useStore } from "../lib/store";
import { AppLogo } from "../components/layout";
import { Button, Input, cn } from "../components/ui";

interface ChatStep {
  from: "pelapor" | "bot" | "sys";
  text: string;
  delay: number;
  typing?: number;
}

const SCRIPT: ChatStep[] = [
  { from: "pelapor", text: "Selamat pagi min, lampu PJU di Jl. Melati mati sudah 3 hari, gelap & rawan 🙏", delay: 600, typing: 0 },
  { from: "bot", text: "✅ Pesan diterima! Tiket TK-1042 berhasil dibuat.\nEstimasi respon: 1×24 jam.", delay: 1400, typing: 1200 },
  { from: "sys", text: "Kata kunci cocok: “lampu”, “pju” → kategori Penerangan & Listrik", delay: 1200 },
  { from: "sys", text: "Diteruskan otomatis ke PIC Dewi Lestari (+62 813-2201-1104)", delay: 1200 },
  { from: "bot", text: "👷 Dewi: Baik kak, tim teknis meluncur sore ini. Mohon ditunggu ya.", delay: 1800, typing: 1400 },
  { from: "sys", text: "Status diperbarui: Diproses · tersinkron ke Google Sheets ✓", delay: 1400 },
];

const DEMO = [
  { label: "Super Admin", email: "superadmin@waticket.id", pass: "admin123" },
  { label: "Admin", email: "admin@waticket.id", pass: "admin123" },
  { label: "PIC", email: "budi@waticket.id", pass: "pic123" },
];

const ChatDemo: React.FC = () => {
  const [visible, setVisible] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let alive = true;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const run = () => {
      let t = 800;
      SCRIPT.forEach((step, i) => {
        t += step.delay;
        if (step.typing) {
          const tStart = t;
          timers.push(setTimeout(() => alive && setTyping(true), tStart));
          t += step.typing;
          timers.push(setTimeout(() => alive && setTyping(false), t));
        }
        timers.push(
          setTimeout(() => {
            if (!alive) return;
            setVisible(i + 1);
          }, t)
        );
      });
      timers.push(setTimeout(() => {
        if (!alive) return;
        setVisible(0);
        timers = [];
        run();
      }, t + 3600));
    };
    run();
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* header chat */}
      <div className="flex items-center gap-3 px-4 py-3 bg-pine2 border border-pineline rounded-t-2xl">
        <span className="relative">
          <span className="w-10 h-10 rounded-full bg-prim flex items-center justify-center text-pine">
            <Bot size={20} />
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-pine2" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-mint font-semibold text-sm leading-tight">WA Admin Pusat</p>
          <p className="text-[11px] text-mintdim">{typing ? "sedang mengetik…" : "online · auto-response aktif"}</p>
        </div>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-mintdim/50" />
          <span className="w-1.5 h-1.5 rounded-full bg-mintdim/50" />
          <span className="w-1.5 h-1.5 rounded-full bg-mintdim/50" />
        </div>
      </div>

      {/* isi chat */}
      <div className="chat-bg bg-pine border-x border-pineline px-4 py-5 space-y-3 min-h-[300px]">
        {SCRIPT.slice(0, visible).map((s, i) =>
          s.from === "sys" ? (
            <div key={i} className="flex justify-center anim-pop">
              <span className="text-[10.5px] font-medium text-mintdim bg-pine2 border border-pineline rounded-full px-3 py-1 text-center">
                {s.text}
              </span>
            </div>
          ) : (
            <div key={i} className={cn("flex anim-pop", s.from === "pelapor" ? "justify-start" : "justify-end")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line",
                  s.from === "pelapor"
                    ? "bg-pine3 text-mint rounded-tl-sm"
                    : "bg-prim text-pine font-medium rounded-tr-sm"
                )}
              >
                {s.text}
                <span className={cn("flex items-center justify-end gap-1 text-[9.5px] mt-1", s.from === "pelapor" ? "text-mintdim" : "text-pine/60")}>
                  {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  {s.from === "bot" && <CheckCheck size={12} />}
                </span>
              </div>
            </div>
          )
        )}
        {typing && (
          <div className="flex justify-end anim-fade-in">
            <div className="bg-prim rounded-xl rounded-tr-sm px-4 py-3 flex gap-1">
              <span className="typing-dot w-1.5 h-1.5 rounded-full bg-pine" />
              <span className="typing-dot w-1.5 h-1.5 rounded-full bg-pine" />
              <span className="typing-dot w-1.5 h-1.5 rounded-full bg-pine" />
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-pine2 border border-pineline rounded-b-2xl flex items-center gap-2 text-[11px] text-mintdim">
        <Zap size={13} className="text-prim2" />
        Auto-reply · klasifikasi kata kunci · forward ke PIC · sync Google Sheets
      </div>
    </div>
  );
};

const Login: React.FC = () => {
  const { login, toast, data } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "forgot" | "sent">("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [shake, setShake] = useState(0);

  const year = useMemo(() => new Date().getFullYear(), []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email dan password wajib diisi.");
      setShake((s) => s + 1);
      return;
    }
    setLoading(true);
    setError("");
    setTimeout(() => {
      const res = login(email, password);
      setLoading(false);
      if (!res.ok) {
        setError(res.error ?? "Gagal masuk.");
        setShake((s) => s + 1);
      } else {
        toast("Selamat datang kembali 👋", "success", "Anda berhasil masuk ke dashboard.");
      }
    }, 850);
  };

  return (
    <div className="min-h-screen flex bg-app">
      {/* panel kiri */}
      <div className="hidden lg:flex flex-col w-[52%] bg-pine pine-grid relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-prim/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 w-[420px] h-[420px] rounded-full bg-prim/10 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between p-8">
          <AppLogo onDark size={38} />
          <span className="flex items-center gap-2 text-[11px] font-semibold text-mintdim border border-pineline rounded-full px-3 py-1.5 bg-pine2/60">
            <span className="relative flex w-2 h-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 ping-dot text-emerald-400" />
            </span>
            Semua sistem operasional
          </span>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 xl:px-16">
          <p className="text-prim2 font-mono text-xs font-semibold tracking-[0.2em] uppercase mb-4">Auto-Response · Forwarder · Sync</p>
          <h1 className="font-display text-mint text-4xl xl:text-[44px] font-bold leading-[1.12]">
            Setiap pesan WhatsApp
            <br />
            menjadi <span className="text-prim2">tiket tertangani.</span>
          </h1>
          <p className="text-mintdim mt-5 text-[15px] leading-relaxed max-w-md">
            Keluhan masuk ke WA Admin, dikategorikan otomatis oleh filter kata kunci,
            diforward ke PIC yang tepat, dan tercatat rapi hingga ke Google Spreadsheet.
          </p>

          <div className="mt-10">
            <ChatDemo />
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-6 px-10 pb-7 text-[11.5px] text-mintdim">
          <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-prim2" /> JWT + RBAC</span>
          <span className="flex items-center gap-1.5"><Sparkles size={13} className="text-prim2" /> Keyword engine</span>
          <span className="flex items-center gap-1.5"><RotateCcw size={13} className="text-prim2" /> Audit trail</span>
          <span className="ml-auto">© {year} {data.settings.appName}</span>
        </div>
      </div>

      {/* panel kanan — form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md anim-fade-up">
          <div className="lg:hidden mb-8">
            <AppLogo size={38} />
          </div>

          {mode === "sent" ? (
            <div className="bg-card border border-line rounded-2xl card-shadow p-8 text-center anim-pop">
              <span className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto mb-4">
                <Mail size={24} />
              </span>
              <h2 className="font-display text-xl font-bold">Periksa inbox Anda</h2>
              <p className="text-sm text-mute mt-2 leading-relaxed">
                Tautan reset password telah dikirim ke <strong className="text-ink">{forgotEmail}</strong>.
                Tautan berlaku selama 30 menit.
              </p>
              <Button variant="outline" className="mt-6 w-full" onClick={() => setMode("login")}>
                Kembali ke halaman masuk
              </Button>
            </div>
          ) : mode === "forgot" ? (
            <div className="bg-card border border-line rounded-2xl card-shadow p-8 anim-pop">
              <button onClick={() => setMode("login")} className="text-xs font-medium text-mute hover:text-ink mb-5 inline-flex items-center gap-1">
                ← Kembali
              </button>
              <span className="w-12 h-12 rounded-xl bg-primsoft text-primink flex items-center justify-center mb-4">
                <KeyRound size={22} />
              </span>
              <h2 className="font-display text-2xl font-bold">Reset password</h2>
              <p className="text-sm text-mute mt-1.5">Masukkan email terdaftar, kami kirimkan tautan pemulihan.</p>
              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (forgotEmail.includes("@")) setMode("sent");
                }}
              >
                <Input type="email" required placeholder="nama@instansi.go.id" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
                <Button type="submit" className="w-full">Kirim tautan reset</Button>
              </form>
            </div>
          ) : (
            <div key={shake} className={cn("bg-card border border-line rounded-2xl card-shadow p-8", shake > 0 && "anim-shake")}>
              <h2 className="font-display text-2xl font-bold">Masuk ke panel</h2>
              <p className="text-sm text-mute mt-1.5">Kelola tiket, PIC, dan integrasi dalam satu tempat.</p>

              <form onSubmit={submit} className="mt-7 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-mute mb-1.5 uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                    <Input type="email" placeholder="nama@instansi.go.id" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-mute uppercase tracking-wide">Password</label>
                    <button type="button" onClick={() => setMode("forgot")} className="text-xs font-medium text-prim hover:text-prim2">
                      Lupa password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                    <Input type={show ? "text" : "password"} placeholder="••••••••" className="pl-9 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                    <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-ink" aria-label="Tampilkan password">
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <span
                    onClick={() => setRemember((v) => !v)}
                    className={cn("w-4.5 h-4.5 rounded border flex items-center justify-center transition-all", remember ? "bg-prim border-prim text-white" : "border-line bg-card2")}
                  >
                    {remember && <CheckCheck size={12} />}
                  </span>
                  <span className="text-[13px] text-mute" onClick={() => setRemember((v) => !v)}>Ingat saya di perangkat ini</span>
                </label>

                {error && (
                  <p className="text-[13px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg px-3 py-2.5 anim-fade-in">
                    {error}
                  </p>
                )}

                <Button type="submit" loading={loading} className="w-full h-11 text-[15px]">
                  Masuk <ArrowRight size={16} />
                </Button>
              </form>

              <div className="mt-7">
                <p className="text-[11px] font-semibold text-faint uppercase tracking-wider text-center mb-3">Coba akun demo</p>
                <div className="grid grid-cols-3 gap-2">
                  {DEMO.map((d) => (
                    <button
                      key={d.label}
                      onClick={() => {
                        setEmail(d.email);
                        setPassword(d.pass);
                        setError("");
                      }}
                      className="rounded-lg border border-line bg-card2 px-2 py-2.5 text-xs font-semibold text-mute hover:text-primink hover:border-prim/50 hover:bg-primsoft transition-all active:scale-95"
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-faint text-center mt-3 font-mono">admin123 · pic123</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
