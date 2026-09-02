import type {
  AppState, ActivityLog, Category, Notif, SyncLog, Ticket, TicketStatus,
  User, WaNumber, Priority, ChatMsg, TicketLog, Attachment,
} from "./types";
import { PRIORITY_META } from "./types";
import { uid, classifyMessage, pickPic } from "./engine";

const h = 3600_000;
const now = Date.now();
const ago = (hours: number) => now - hours * h;

export const USERS: User[] = [
  { id: "u1", name: "Raka Aditya", email: "superadmin@waticket.id", password: "admin123", role: "superadmin", active: true, waNumber: "+62 812-1000-0001", color: "#0e8a5f", isPic: false },
  { id: "u2", name: "Nadia Putri", email: "admin@waticket.id", password: "admin123", role: "admin", active: true, waNumber: "+62 812-1000-0002", color: "#0e7bc4", isPic: false },
  { id: "u3", name: "Budi Santoso", email: "budi@waticket.id", password: "pic123", role: "pic", active: true, waNumber: "+62 813-2201-1101", color: "#e5a325", isPic: true },
  { id: "u4", name: "Siti Rahmawati", email: "siti@waticket.id", password: "pic123", role: "pic", active: true, waNumber: "+62 813-2201-1102", color: "#14a0a0", isPic: true },
  { id: "u5", name: "Agus Wijaya", email: "agus@waticket.id", password: "pic123", role: "pic", active: true, waNumber: "+62 813-2201-1103", color: "#38a8e0", isPic: true },
  { id: "u6", name: "Dewi Lestari", email: "dewi@waticket.id", password: "pic123", role: "pic", active: true, waNumber: "+62 813-2201-1104", color: "#e05252", isPic: true },
  { id: "u7", name: "Rudi Hartono", email: "rudi@waticket.id", password: "pic123", role: "pic", active: false, waNumber: "+62 813-2201-1105", color: "#8b5cf6", isPic: true },
  { id: "u8", name: "Maya Kusuma", email: "maya@waticket.id", password: "pic123", role: "pic", active: true, waNumber: "+62 813-2201-1106", color: "#1fa870", isPic: true },
];

export const CATEGORIES: Category[] = [
  { id: "c1", name: "Jalan & Infrastruktur", description: "Jalan berlubang, aspal rusak, jembatan, trotoar, drainase, longsor.", color: "sky", keywords: ["jalan", "berlubang", "aspal", "jembatan", "trotoar", "longsor", "drainase", "banjir"], picIds: ["u3"], active: true },
  { id: "c2", name: "Sampah & Kebersihan", description: "Tumpukan sampah, bau, TPS penuh, selokan mampet, limbah.", color: "emerald", keywords: ["sampah", "bau", "tps", "selokan", "got mampet", "limbah", "kebersihan"], picIds: ["u4"], active: true },
  { id: "c3", name: "Air Bersih / PDAM", description: "Air mati, keruh, pipa bocor, tekanan kecil.", color: "cyan", keywords: ["air", "pdam", "pipa", "keruh", "air mati", "bocor"], picIds: ["u5"], active: true },
  { id: "c4", name: "Penerangan & Listrik", description: "Lampu PJU mati, padam listrik, kabel menjuntai.", color: "amber", keywords: ["lampu", "pju", "listrik", "padam", "gelap", "kabel"], picIds: ["u6", "u3"], active: true },
  { id: "c5", name: "Keamanan & Ketertiban", description: "Begal, pencurian, tawuran, knalpot bising, premanisme.", color: "rose", keywords: ["begal", "maling", "keamanan", "tawuran", "preman", "bising", "knalpot", "pencurian"], picIds: ["u7"], active: true },
  { id: "c6", name: "Administrasi & Dokumen", description: "KTP, KK, akta, surat keterangan, perizinan.", color: "teal", keywords: ["ktp", "akta", "surat", "dokumen", "perizinan", "kk", "administrasi"], picIds: ["u8", "u2"], active: true },
];

const WA_NUMBERS: WaNumber[] = [
  { id: "n1", label: "WA Admin Pusat", number: "+62 811-222-333", type: "admin", provider: "Fonnte", connected: true, lastPing: ago(0.1) },
  { id: "n2", label: "WA Bot Cadangan", number: "+62 811-222-334", type: "admin", provider: "Fonnte", connected: false, lastPing: ago(26) },
  { id: "n3", label: "PIC Infrastruktur", number: "+62 813-2201-1101", type: "pic", provider: "Wablas", connected: true, lastPing: ago(0.4) },
  { id: "n4", label: "PIC Kebersihan", number: "+62 813-2201-1102", type: "pic", provider: "Wablas", connected: true, lastPing: ago(1.2) },
  { id: "n5", label: "PIC PDAM", number: "+62 813-2201-1103", type: "pic", provider: "Fonnte", connected: true, lastPing: ago(0.8) },
  { id: "n6", label: "PIC Penerangan", number: "+62 813-2201-1104", type: "pic", provider: "Qontak", connected: false, lastPing: ago(49) },
];

interface Spec {
  name: string; num: string; text: string; hoursAgo: number;
  status: TicketStatus; priority?: Priority; attach?: Attachment[];
}

const SPECS: Spec[] = [
  { name: "Hendra Gunawan", num: "+62 857-1102-3341", text: "Selamat pagi, lampu PJU di Jl. Melati Raya mati sudah 3 hari, jalanan jadi gelap dan rawan. Mohon segera dicek, terima kasih.", hoursAgo: 2, status: "diproses", priority: "tinggi" },
  { name: "Rina Marlina", num: "+62 812-9930-1177", text: "Ada tumpukan sampah di pinggir Jl. Kenanga dekat pasar, sudah seminggu tidak diangkut dan bau sekali menyengat.", hoursAgo: 5, status: "diteruskan" },
  { name: "Joko Prasetyo", num: "+62 813-7745-9021", text: "Jalan berlubang besar di pertigaan Cempaka, kemarin ada motor yang jatuh. Mohon segera diperbaiki sebelum ada korban lagi.", hoursAgo: 8, status: "diproses", attach: [{ name: "foto-jalan.jpg", kind: "image", size: "1.2 MB" }] },
  { name: "Sari Wulandari", num: "+62 821-4433-8890", text: "Air PDAM mati total di Perumahan Griya Asri blok C sejak semalam. Kapan kira-kira normal kembali?", hoursAgo: 12, status: "menunggu" },
  { name: "Andi Saputra", num: "+62 856-2210-7743", text: "Mohon info prosedur pembuatan e-KTP baru karena KTP saya hilang. Apakah bisa diurus online?", hoursAgo: 20, status: "selesai" },
  { name: "Lina Kartika", num: "+62 812-5567-2201", text: "Selokan di depan rumah mampet, air menggenang dan bau. Tolong dibantu petugas kebersihan.", hoursAgo: 27, status: "diproses" },
  { name: "Bagus Wicaksono", num: "+62 813-9034-5512", text: "Terjadi tawuran sekelompok remaja di lapangan Merdeka tadi malam, warga resah. Mohon patroli rutin.", hoursAgo: 31, status: "baru", priority: "tinggi" },
  { name: "Dian Permatasari", num: "+62 821-7788-3345", text: "Pipa PDAM bocor di Jl. Anggrek no 12, air bersih terbuang percuma sejak pagi. Mohon segera ditangani.", hoursAgo: 40, status: "selesai", attach: [{ name: "video-bocor.mp4", kind: "doc", size: "8.4 MB" }] },
  { name: "Fajar Nugroho", num: "+62 857-6612-0098", text: "Lampu jalan di gang Masjid Al-Ikhlas padam, anak-anak ngaji jadi takut pulang malam.", hoursAgo: 52, status: "selesai" },
  { name: "Tuti Alawiyah", num: "+62 812-3345-6670", text: "Trotoar di depan SDN 2 rusak dan berlubang, bahaya untuk anak sekolah yang jalan kaki.", hoursAgo: 58, status: "menunggu" },
  { name: "Rendra Mahendra", num: "+62 813-1120-4455", text: "Mohon surat keterangan domisili untuk keperluan pendaftaran sekolah anak. Syaratnya apa saja?", hoursAgo: 75, status: "selesai" },
  { name: "Putri Ayudia", num: "+62 821-9902-1187", text: "Ada yang buang limbah cair ke kali belakang pabrik, air jadi hitam dan bau menyengat. Mohon ditindak!", hoursAgo: 82, status: "diproses", priority: "tinggi", attach: [{ name: "foto-kali.jpg", kind: "image", size: "2.1 MB" }] },
  { name: "Yusuf Hamdani", num: "+62 856-7743-2210", text: "Knalpot brong motor sering lewat perumahan jam 11 malam, sangat bising mengganggu istirahat.", hoursAgo: 99, status: "ditolak" },
  { name: "Wulan Sari", num: "+62 812-8876-5534", text: "Aspal jalan raya depan kantor kecamatan mengelupas, banyak kerikil berserakan membahayakan pengendara.", hoursAgo: 125, status: "selesai" },
  { name: "Gilang Ramadhan", num: "+62 813-5560-9912", text: "TPS dekat rumah saya sudah penuh meluber ke jalan, mohon segera diangkut petugas.", hoursAgo: 150, status: "selesai" },
  { name: "Mega Utami", num: "+62 821-3341-7789", text: "Selamat siang, ingin bertanya soal jadwal pemadaman listrik bergilir minggu ini di wilayah Sukamaju.", hoursAgo: 2.5, status: "baru" },
];

const sysMsg = (time: number, text: string): ChatMsg => ({ id: uid(), from: "sistem", text, time });

const buildConvo = (spec: Spec, t: { catName?: string; picName?: string; createdAt: number }): ChatMsg[] => {
  const c: ChatMsg[] = [{ id: uid(), from: "pelapor", text: spec.text, time: t.createdAt }];
  const t0 = t.createdAt + 60_000;
  c.push(sysMsg(t0, `Auto-reply terkirim ke pelapor · tiket terdaftar${t.catName ? ` · kategori "${t.catName}"` : " · menunggu klasifikasi manual"}`));
  if (t.picName) c.push(sysMsg(t0 + 45_000, `Pesan diteruskan ke PIC ${t.picName} (${spec.num.replace("+62", "0").replace(/-/g, "")})`));
  if (["diproses", "menunggu", "selesai"].includes(spec.status))
    c.push({ id: uid(), from: "pic", text: "Baik, laporan sudah kami terima. Tim akan segera turun ke lokasi. Mohon ditunggu.", time: t.createdAt + 2.2 * h });
  if (spec.status === "menunggu")
    c.push({ id: uid(), from: "pelapor", text: "Terima kasih, kami tunggu kabarnya ya Pak/Bu.", time: t.createdAt + 2.6 * h });
  if (spec.status === "selesai") {
    c.push({ id: uid(), from: "pic", text: "Update: pekerjaan di lapangan sudah selesai 100%. Mohon dicek kembali, terima kasih atas laporannya.", time: t.createdAt + 6 * h });
    c.push({ id: uid(), from: "pelapor", text: "Sudah dicek, sudah beres. Terima kasih banyak atas respon cepatnya! 🙏", time: t.createdAt + 6.8 * h });
  }
  if (spec.status === "ditolak")
    c.push({ id: uid(), from: "admin", text: "Mohon maaf, laporan ini di luar cakupan layanan kami. Silakan hubungi call center 112 untuk penanganan lebih lanjut.", time: t.createdAt + 1.4 * h });
  return c;
};

const buildTickets = (): Ticket[] =>
  SPECS.map((spec, i) => {
    const createdAt = ago(spec.hoursAgo);
    const cat = classifyMessage(spec.text, CATEGORIES);
    const pic = cat ? pickPic(cat, [], USERS) : null;
    const priority: Priority = spec.priority ?? (cat && ["c1", "c5"].includes(cat.id) && i % 3 === 0 ? "tinggi" : "normal");
    const logs: TicketLog[] = [
      { id: uid(), from: "—", to: "baru", note: "Tiket dibuat dari webhook WhatsApp", by: "Sistem", time: createdAt },
    ];
    if (cat) logs.push({ id: uid(), from: "baru", to: "diteruskan", note: `Auto-kategori "${cat.name}"${pic ? ` · forward ke ${pic.name}` : ""}`, by: "Sistem", time: createdAt + 60_000 });
    if (["diproses", "menunggu", "selesai"].includes(spec.status))
      logs.push({ id: uid(), from: "diteruskan", to: "diproses", note: "PIC memulai penanganan", by: pic?.name ?? "Admin", time: createdAt + 2.2 * h });
    if (spec.status === "menunggu")
      logs.push({ id: uid(), from: "diproses", to: "menunggu", note: "Menunggu konfirmasi pelapor", by: pic?.name ?? "Admin", time: createdAt + 3 * h });
    if (spec.status === "selesai")
      logs.push({ id: uid(), from: "diproses", to: "selesai", note: "Pekerjaan selesai, dikonfirmasi pelapor", by: pic?.name ?? "Admin", time: createdAt + 6.5 * h });
    if (spec.status === "ditolak")
      logs.push({ id: uid(), from: "baru", to: "ditolak", note: "Di luar cakupan layanan", by: "Nadia Putri", time: createdAt + 1.2 * h });

    return {
      id: uid(),
      code: `TK-${1001 + i}`,
      reporterName: spec.name,
      reporterNumber: spec.num,
      message: spec.text,
      categoryId: cat ? cat.id : null,
      picId: spec.status === "baru" ? pic?.id ?? null : pic?.id ?? null,
      status: spec.status,
      priority,
      createdAt,
      updatedAt: logs[logs.length - 1].time,
      slaHours: PRIORITY_META[priority].hours,
      conversation: buildConvo(spec, { catName: cat?.name, picName: pic?.name, createdAt }),
      logs,
      attachments: spec.attach ?? [],
    };
  });

const ACTIVITY_SEED: ActivityLog[] = [
  { id: uid(), user: "Raka Aditya", type: "login", action: "Login berhasil", detail: "superadmin@waticket.id · Chrome / Windows", time: ago(0.3) },
  { id: uid(), user: "Sistem", type: "webhook", action: "Pesan masuk via webhook", detail: "Hendra Gunawan → TK-1001 (Penerangan & Listrik)", time: ago(2) },
  { id: uid(), user: "Sistem", type: "ticket", action: "Auto-forward tiket", detail: "TK-1001 diteruskan ke Dewi Lestari", time: ago(2) },
  { id: uid(), user: "Dewi Lestari", type: "ticket", action: "Ubah status tiket", detail: "TK-1001: Diteruskan → Diproses", time: ago(1.6) },
  { id: uid(), user: "Nadia Putri", type: "category", action: "Edit kata kunci kategori", detail: "Menambah kata kunci \"kabel\" ke Penerangan & Listrik", time: ago(7) },
  { id: uid(), user: "Nadia Putri", type: "export", action: "Export laporan XLSX", detail: "42 baris · filter: 7 hari terakhir", time: ago(22) },
  { id: uid(), user: "Sistem", type: "sync", action: "Sinkronisasi Google Sheets", detail: "42 baris berhasil disinkronkan", time: ago(22.2) },
  { id: uid(), user: "Raka Aditya", type: "user", action: "Nonaktifkan akun PIC", detail: "Rudi Hartono dinonaktifkan sementara", time: ago(30) },
  { id: uid(), user: "Raka Aditya", type: "settings", action: "Ubah pengaturan provider", detail: "Mengganti API key Fonnte", time: ago(50) },
  { id: uid(), user: "Sistem", type: "webhook", action: "Pesan masuk via webhook", detail: "Gilang Ramadhan → TK-1015 (Sampah & Kebersihan)", time: ago(150) },
];

const SYNC_SEED: SyncLog[] = [
  { id: uid(), time: ago(0.5), rows: 16, status: "sukses", trigger: "otomatis", sheet: "Rekap Tiket" },
  { id: uid(), time: ago(6), rows: 15, status: "sukses", trigger: "otomatis", sheet: "Rekap Tiket" },
  { id: uid(), time: ago(22.2), rows: 42, status: "sukses", trigger: "manual", sheet: "Rekap Tiket" },
  { id: uid(), time: ago(46), rows: 38, status: "gagal", trigger: "otomatis", sheet: "Rekap Tiket" },
  { id: uid(), time: ago(47), rows: 38, status: "sukses", trigger: "manual", sheet: "Rekap Tiket (retry)" },
];

const NOTIF_SEED: Notif[] = [
  { id: uid(), type: "ticket", title: "Tiket baru masuk", body: "Mega Utami menanyakan jadwal pemadaman listrik — menunggu klasifikasi.", time: ago(2.5), read: false },
  { id: uid(), type: "overdue", title: "SLA hampir habis", body: "TK-1007 (Keamanan) melewati 50% waktu SLA tanpa respon PIC.", time: ago(9), read: false },
  { id: uid(), type: "sync", title: "Sinkronisasi berhasil", body: "16 baris tiket tersinkron ke Google Sheets.", time: ago(0.5), read: true },
];

export const INCOMING_POOL = [
  { name: "Anton Wibowo", num: "+62 857-4410-2231", text: "Jalan aspal di depan pom bensin Sukagalih berlubang parah, tolong segera ditambal sebelum makan korban." },
  { name: "Fitri Handayani", num: "+62 812-6602-8873", text: "Bau menyengat dari tumpukan sampah di belakang ruko blok B, sudah 4 hari tidak diangkut." },
  { name: "Galih Prakoso", num: "+62 813-8871-4459", text: "Air PDAM keruh dan berbau sejak pagi di wilayah Cikutra, mohon dicek kualitasnya." },
  { name: "Nurul Hidayah", num: "+62 821-5540-9917", text: "Lampu PJU di sepanjang Jl. Dago atas mati semua, gelap total kalau malam." },
  { name: "Rizky Fauzan", num: "+62 856-9921-3308", text: "Sekelompok preman meminta uang parkir liar di alun-alun, warga jadi takut. Mohon patroli." },
  { name: "Sinta Dewi", num: "+62 812-4478-6650", text: "Saya mau mengurus akta kelahiran anak kedua, syarat dokumen apa saja yang harus disiapkan?" },
  { name: "Herman Susilo", num: "+62 813-3345-8812", text: "Drainase mampet causes banjir setinggi mata kaki tiap hujan di jl. veteran, mohon dinormalisasi." },
  { name: "Ayu Anggraini", num: "+62 821-7712-0045", text: "Pipa air bocor di persimpangan pasar, air bersih mengalir deras ke jalan. Darurat, mohon segera!" },
  { name: "Dimas Anggara", num: "+62 857-2299-6641", text: "Kabel listrik menjuntai rendah di gang Soka, percikan api waktu hujan. Bahaya, tolong segera!" },
  { name: "Laras Ayuningtyas", num: "+62 812-9034-7782", text: "Trotoar depan halte rusak dan berlubang, tadi pagi ada lansia yang tersandung." },
];

export const buildSeed = (): AppState => ({
  users: USERS,
  categories: CATEGORIES,
  tickets: buildTickets(),
  numbers: WA_NUMBERS,
  activityLogs: ACTIVITY_SEED,
  syncLogs: SYNC_SEED,
  notifs: NOTIF_SEED,
  settings: {
    appName: "WATicket",
    tagline: "Sistem Ticketing WhatsApp",
    logo: null,
    logoPreset: 0,
    accent: "emerald",
    themeDefault: "light",
    provider: {
      provider: "Fonnte",
      apiKey: "fnte_live_9f3ka81bXzQ7wE5rT2yu",
      webhook: "https://api.waticket.id/webhook/fonnte",
      autoReply: true,
      autoForward: true,
    },
    sheet: {
      connected: true,
      spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      sheetName: "Rekap Tiket",
      schedule: "realtime",
      lastSync: ago(0.5),
    },
    roles: {
      tickets: { view: true, manage: true },
      categories: { view: true, manage: true },
      users: { view: true, manage: true },
      reports: { view: true, manage: true },
      settings: { view: true, manage: false },
      logs: { view: true, manage: false },
    },
  },
});
