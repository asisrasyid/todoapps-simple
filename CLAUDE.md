# SheetMaster App — Project Context

## MANDATORY: Changelog Update
**Setiap agen WAJIB mengupdate changelog setelah menyelesaikan pekerjaan apapun.**

Lokasi: `C:/Users/m.aziz/.claude/projects/D--LEARN-AND-DEV-Todo-apps-sheetmaster-app/memory/changelog_log.md`

Format entry baru:
```
## YYYY-MM-DD — <ringkasan singkat sesi>
- <perubahan 1>
- <perubahan 2>
- dst.
```

Ini **tidak opsional**. Tambahkan entry sebelum mengakhiri sesi, bahkan untuk perubahan kecil.

## Apa ini?
Todo/Kanban app berbasis Next.js dengan backend Google Apps Script + Google Sheets sebagai database. Di UI disebut **"Todo Track"** (sidebar title).

## Stack
- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v3, Radix UI, shadcn/ui pattern
- **State**: Zustand (`src/store/boardStore.ts`)
- **Data Fetching**: TanStack Query v5
- **DnD**: @dnd-kit (drag-and-drop kanban)
- **Backend**: Google Apps Script Web App (REST-like, single POST endpoint)
- **DB**: Google Sheets

## Struktur Direktori
```
src/
  app/
    (auth)/          — login page
    (dashboard)/     — protected routes
      dashboard/     — halaman dashboard
      boards/        — daftar board
      boards/[id]/   — kanban board detail
      approvals/     — halaman approval
      profile/       — profil user + API key management
    share/           — public board view (no auth)
  components/
    dashboard/       — ActivityFilter, ContributionGrid
    kanban/          — KanbanBoard, KanbanColumn, ColumnHeader, TaskCard
    layout/          — Sidebar, Topbar
    task/            — task detail components
    approval/        — approval components
    ui/              — shadcn-style UI primitives
  hooks/             — useBoard, useBoards, useDashboard, useApprovals
  lib/
    api.ts           — semua API calls ke Google Apps Script
    auth.ts          — auth helpers
    utils.ts         — utility functions
  store/
    boardStore.ts    — Zustand global state
  types/
    index.ts         — semua TypeScript types
```

## API Pattern
Semua request ke Google Apps Script:
- Method: `POST`
- Content-Type: `text/plain` (hindari CORS preflight)
- Body: `JSON.stringify({ action, token?, ...params })`
- Auth: `token` di body (dari `localStorage.getItem("sm_token")`)
- Response: `{ success: boolean, data?: T, error?: string }`

## Role System
`owner` > `approver` > `contributor` > `viewer`

## Fitur Utama
1. **Kanban Board** — kolom custom + drag-and-drop task
2. **Approval System** — kolom bisa set `requiresApproval: true`, move task butuh approval
3. **Dashboard** — stats, contribution grid (activity heatmap), stale tasks, recent activity
4. **Subtasks** — task bisa punya subtask list
5. **Labels & Assignees** — per board
6. **Public Board** — share read-only via link (GET, no auth)
7. **API Key Management** — generate key untuk akses eksternal
8. **User Management** — admin kelola user (global role)

## Konvensi Penting
- Env var: `NEXT_PUBLIC_APPS_SCRIPT_URL` — URL endpoint Apps Script
- Token disimpan di `localStorage` key `sm_token`
- Semua API function ada di `src/lib/api.ts`, prefix `api*`
- Hooks di `src/hooks/` wrap TanStack Query + api calls
- Tidak ada database lokal — semua data dari Google Sheets via Apps Script
- Apps Script code ada di folder `apps-script/`

## Naming
- Repo/package name: `sheetmaster-app`
- UI display name: **Todo Track**
- Commit style: conventional commits + bahasa Indonesia boleh

## Log Perubahan Terakhir (per 2026-04-03)
- Dashboard direfactor: filter pindah ke navbar, activity & recent activity berdampingan + scrollable
- Tambah filter range tanggal dan bulan di card activity dashboard
- Sidebar title ganti dari "SheetMaster" ke "Todo Track"
