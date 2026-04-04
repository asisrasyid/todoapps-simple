import type { DriveStep } from "driver.js";

export const TOUR_MAIN_KEY       = "sm_tour_main_done";
export const TOUR_BOARD_KEY      = "sm_tour_board_done";
export const TOUR_DASHBOARD_KEY  = "sm_tour_dashboard_done";
export const TOUR_BOARDS_KEY     = "sm_tour_boards_done";
export const TOUR_APPROVALS_KEY  = "sm_tour_approvals_done";
export const TOUR_PROFILE_KEY    = "sm_tour_profile_done";

export function isTourDone(key: string): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(key) === "1";
}

export function markTourDone(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, "1");
}

// ─── Main tour steps (sidebar + navigation) ───────────────────────────────────
export const mainTourSteps: DriveStep[] = [
  {
    popover: {
      title: "Selamat datang di Todo Track! 🎉",
      description:
        "Aplikasi manajemen task berbasis Kanban untuk tim kamu. Mari kita lihat fitur-fitur utamanya — hanya butuh 1 menit!",
      side: "over",
      align: "center",
    },
  },
  {
    element: '[data-tour="sidebar"]',
    popover: {
      title: "Navigasi Utama",
      description:
        "Sidebar ini adalah pusat navigasi. Kamu bisa collapse/expand dengan mengklik tombol di kanan atas, atau langsung klik ikon saat sidebar mengecil.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="nav-dashboard"]',
    popover: {
      title: "Dashboard",
      description:
        "Lihat ringkasan aktivitas, statistik task, contribution grid, dan task yang butuh perhatian — semua dalam satu halaman.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-boards"]',
    popover: {
      title: "Boards",
      description:
        "Kelola papan kerja Kanban. Setiap board punya kolom dan task sendiri. Kamu bisa membuat board baru, mengundang anggota tim, dan mengatur role mereka.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-approvals"]',
    popover: {
      title: "Approvals",
      description:
        "Kolom tertentu bisa diset memerlukan persetujuan. Saat contributor memindahkan task ke kolom tersebut, approval request akan muncul di sini.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-profile"]',
    popover: {
      title: "Profil & API Key",
      description:
        "Update profil, ganti password, dan kelola API Key untuk integrasi eksternal dari halaman ini.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="theme-toggle"]',
    popover: {
      title: "Ganti Tema",
      description:
        "Pilih tampilan Light, Dark, atau ikuti pengaturan sistem. Preferensi tersimpan otomatis.",
      side: "right",
      align: "end",
    },
  },
  {
    element: '[data-tour="tour-help"]',
    popover: {
      title: "Ulangi Tur Kapan Saja",
      description:
        "Klik tombol ? ini kapanpun kamu ingin melihat tur fitur lagi. Selamat menggunakan Todo Track! 🚀",
      side: "right",
      align: "end",
    },
  },
];

// ─── Dashboard tour steps ─────────────────────────────────────────────────────
export const dashboardTourSteps: DriveStep[] = [
  {
    popover: {
      title: "Dashboard — Pusat Kendali Kamu 📊",
      description: "Halaman ini merangkum semua aktivitas dan statistik task kamu dalam satu tampilan.",
      side: "over", align: "center",
    },
  },
  {
    element: '[data-tour="stat-cards"]',
    popover: {
      title: "Statistik Task",
      description: "4 kartu ini menunjukkan total task, yang sudah selesai, sedang berjalan, dan yang sudah melewati deadline. Klik board di sidebar untuk melihat detail.",
      side: "bottom", align: "start",
    },
  },
  {
    element: '[data-tour="stale-tasks"]',
    popover: {
      title: "Task Butuh Perhatian ⚠️",
      description: "Task yang tidak ada perubahan lebih dari 3 hari akan muncul di sini sebagai pengingat agar tidak terlupakan.",
      side: "bottom", align: "start",
    },
  },
  {
    element: '[data-tour="contribution-grid"]',
    popover: {
      title: "Activity Heatmap",
      description: "Visualisasi aktivitas harian selama setahun — mirip GitHub contribution graph. Kotak lebih gelap = lebih banyak aktivitas di hari itu.",
      side: "top", align: "start",
    },
  },
  {
    element: '[data-tour="recent-activity"]',
    popover: {
      title: "Aktivitas Terbaru",
      description: "10 task yang paling baru diupdate. Klik salah satu untuk langsung menuju board dan membuka task tersebut.",
      side: "left", align: "start",
    },
  },
  {
    element: '[data-tour="activity-filter"]',
    popover: {
      title: "Filter Aktivitas",
      description: "Filter tampilan activity heatmap dan recent activity berdasarkan rentang tanggal atau bulan tertentu.",
      side: "bottom", align: "end",
    },
  },
];

// ─── Boards page tour steps ───────────────────────────────────────────────────
export const boardsTourSteps: DriveStep[] = [
  {
    popover: {
      title: "Boards — Ruang Kerja Tim 🗂️",
      description: "Setiap board adalah ruang kerja terpisah dengan kolom, task, anggota, dan label sendiri.",
      side: "over", align: "center",
    },
  },
  {
    element: '[data-tour="new-board-btn"]',
    popover: {
      title: "Buat Board Baru",
      description: "Klik tombol ini untuk membuat board baru. Isi nama dan deskripsi, lalu kamu langsung jadi owner board tersebut dengan 4 kolom default.",
      side: "bottom", align: "end",
    },
  },
  {
    element: '[data-tour="board-card"]',
    popover: {
      title: "Board Card",
      description: "Klik card untuk membuka kanban board. Badge di pojok kiri bawah menunjukkan role kamu di board ini (Owner / Approver / Contributor / Viewer).",
      side: "bottom", align: "start",
    },
  },
  {
    element: '[data-tour="board-menu"]',
    popover: {
      title: "Menu Board",
      description: "Hover card lalu klik ⋯ untuk membuka opsi board. Owner bisa menghapus board dari sini.",
      side: "left", align: "center",
    },
  },
];

// ─── Approvals tour steps ─────────────────────────────────────────────────────
export const approvalsTourSteps: DriveStep[] = [
  {
    popover: {
      title: "Approvals — Sistem Persetujuan ✅",
      description: "Saat contributor memindahkan task ke kolom yang memerlukan approval, request akan muncul di sini untuk ditinjau oleh owner atau approver.",
      side: "over", align: "center",
    },
  },
  {
    element: '[data-tour="approval-filter"]',
    popover: {
      title: "Filter & Urutkan",
      description: "Tampilkan hanya yang pending, atau lihat semua riwayat approval. Urutkan dari terbaru atau terlama.",
      side: "bottom", align: "end",
    },
  },
  {
    element: '[data-tour="approval-card"]',
    popover: {
      title: "Kartu Approval",
      description: "Setiap kartu menunjukkan task mana yang ingin dipindahkan, dari kolom mana ke kolom mana, dan siapa yang mengajukan request.",
      side: "bottom", align: "start",
    },
  },
  {
    element: '[data-tour="approve-btn"]',
    popover: {
      title: "Setujui Task",
      description: "Klik Approve untuk menyetujui perpindahan. Task akan langsung pindah ke kolom tujuan.",
      side: "top", align: "start",
    },
  },
  {
    element: '[data-tour="reject-btn"]',
    popover: {
      title: "Tolak Request",
      description: "Klik Reject untuk menolak. Kamu bisa menuliskan catatan alasan penolakan yang akan terlihat oleh contributor.",
      side: "top", align: "start",
    },
  },
];

// ─── Profile tour steps ───────────────────────────────────────────────────────
export const profileTourSteps: DriveStep[] = [
  {
    popover: {
      title: "Profil & Pengaturan Akun 👤",
      description: "Kelola informasi pribadi, manajemen pengguna (khusus admin), dan API Key untuk integrasi eksternal.",
      side: "over", align: "center",
    },
  },
  {
    element: '[data-tour="profile-tabs"]',
    popover: {
      title: "Tab Navigasi",
      description: "3 tab tersedia: Profil (edit nama & password), Users (kelola pengguna — khusus Owner global), dan API Keys.",
      side: "bottom", align: "start",
    },
  },
  {
    element: '[data-tour="profile-info"]',
    popover: {
      title: "Informasi Profil",
      description: "Tampilkan nama, username, role global, dan avatar kamu. Klik Edit Profile untuk mengubah nama tampilan.",
      side: "bottom", align: "start",
    },
  },
  {
    element: '[data-tour="edit-profile-btn"]',
    popover: {
      title: "Edit Profil & Password",
      description: "Update nama tampilan atau ganti password dari sini. Password lama diperlukan untuk verifikasi sebelum mengganti yang baru.",
      side: "bottom", align: "start",
    },
  },
  {
    element: '[data-tour="apikeys-section"]',
    popover: {
      title: "API Keys",
      description: "Generate API Key untuk mengakses Todo Track dari aplikasi eksternal tanpa perlu login manual. Setiap key bisa diberi nama dan dicabut kapan saja.",
      side: "top", align: "start",
    },
  },
];

// ─── Board tour steps (kanban features) ──────────────────────────────────────
export const boardTourSteps: DriveStep[] = [
  {
    popover: {
      title: "Selamat datang di Kanban Board! 🗂️",
      description:
        "Inilah tempat kamu mengelola task tim. Mari kenali fitur-fiturnya.",
      side: "over",
      align: "center",
    },
  },
  {
    element: '[data-tour="kanban-column"]',
    popover: {
      title: "Kolom / Status",
      description:
        "Setiap kolom mewakili tahap pengerjaan. Owner & approver bisa menambah, mengedit, menghapus, dan mengubah warna kolom. Kolom bisa diset memerlukan approval.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="task-card"]',
    popover: {
      title: "Task Card",
      description:
        "Klik card untuk membuka detail task. Setiap task bisa punya assignee, label, deadline, subtask, lampiran, dan komentar.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="task-comment"]',
    popover: {
      title: "Komentar",
      description:
        "Klik ikon 💬 di task card untuk membuka komentar. Kamu bisa berdiskusi dan saling balas seperti media sosial.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="add-task"]',
    popover: {
      title: "Tambah Task",
      description:
        "Klik tombol ini untuk menambah task baru ke kolom. Ketik judul lalu tekan Enter atau klik Add.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="add-column"]',
    popover: {
      title: "Tambah Kolom",
      description:
        "Buat kolom baru sesuai alur kerja tim kamu. Kolom bisa di-drag untuk diurutkan ulang.",
      side: "left",
      align: "center",
    },
  },
  {
    popover: {
      title: "Drag & Drop ✨",
      description:
        "Seret task dari satu kolom ke kolom lain untuk mengubah statusnya. Kalau kolom tujuan memerlukan approval, request akan dikirim otomatis.",
      side: "over",
      align: "center",
    },
  },
];
