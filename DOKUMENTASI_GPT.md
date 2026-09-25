# DOKUMENTASI PROYEK - SATUATK (Sistem ATK / Inventory)

> File ini dibuat sebagai konteks untuk di-upload ke GPT / AI assistant.
> Upload file ini + source code agar AI langsung paham proyek.

## 1. Ringkasan Proyek
- **Nama:** SATUATK (satuatk_db)
- **Jenis:** Aplikasi web inventory & permintaan ATK (Alat Tulis Kantor) internal perusahaan
- **Deskripsi:** Laravel + Inertia.js + React. Alur utama: Requester mengajukan permintaan barang → Approval bertingkat (Admin/Gudang → SM → GM) → Pemenuhan stok & distribusi → Konfirmasi pengambilan → Laporan & audit.
- **Repo lokal:** `D:\Code\satuatk`
- **Bahasa UI:** Indonesia (sebagian Inggris di kode)
- **Auth:** Session Laravel standar + Spatie Permission (role & permission). Ada route dev `GET /bypass-login/{email}` untuk login cepat (HAPUS di production).

## 2. Tech Stack
- **Backend:** PHP `^8.2` (lokal: 8.2.12), Laravel Framework `^12.0`
- **Frontend:** React `^19.2.8`, React DOM, Inertia React `^3.6.1`, Vite `^8.1.5`, `laravel-vite-plugin ^3.1.3`, TailwindCSS `^4.0.0` + `@tailwindcss/vite`, Axios
- **UI Lib:** Radix UI (avatar, dialog, dropdown, select, tabs, toast, dll), lucide-react, cmdk, react-hook-form + zod + @hookform/resolvers, apexcharts + react-apexcharts, date-fns, clsx + tailwind-merge + class-variance-authority
- **Backend Lib:** `inertiajs/inertia-laravel ^3.3`, `spatie/laravel-permission ^6.25`, `spatie/laravel-activitylog ^4.12`, `tightenco/ziggy ^2.6`, `laravel/tinker ^2.9`
- **Database:** MySQL (`DB_DATABASE=satuatki_db`, charset utf8mb4_unicode_ci)
- **Build:** `npm run build` (Vite) → output ke `public/build`, `composer install`
- **Entry frontend:** `resources/css/app.css`, `resources/js/app.jsx` (alias `@` → `/resources/js`)

## 3. Struktur Folder Penting
```
app/
  Http/Controllers/
    Auth/AuthenticatedSessionController.php
    DashboardController.php
    ProfileController.php
    Inventory/ (InventoryController, ItemController, StockController, StockOpnameController, AdjustmentController)
    Requests/RequestController.php
    Approvals/ApprovalController.php
    Distribution/DistributionController.php
    Fulfillment/FulfillmentController.php
    Reports/ReportController.php
    Master/ (Category, Unit, Location, Supplier, Department)
    UserManagement/UserController.php
    NotificationController.php, AuditController.php, SettingsController.php, Settings/ApprovalRuleController.php
  Models/ (User, MasterItem, MasterCategory/Unit/Location/Supplier/Department, InventoryStock/Transaction/Adjustment(+Item), StockOpname(+Item), Approval(+Log/Rule), PickupSchedule/Log, Setting)
  Services/, Notifications/, Providers/
routes/web.php (semua route web, auth + permission middleware)
resources/js/
  pages/ Dashboard.jsx, Auth/, Inventory/, Requests/, Approvals/, Distribution/, Fulfillment/, Reports/, Master/, Users/, Notifications/, Audit/, Settings/, Profile/
  layouts/, Components/, constants/, utils/
database/migrations/ (23 file: users, cache, jobs, master_*, inventory_*, stock_opname_*, request_*, approval_*, pickup_*, permission, activity_log, notifications, approval_rules, settings)
database/seeders/ (DatabaseSeeder → RolesAndPermissions, AdminUser, MasterLocation, MasterCategoryAndUnit, Item, ApprovalRules)
config/, bootstrap/, public/, storage/, vite.config.js
```

## 4. Modul & Fitur (berdasarkan routes/web.php)
1. **Auth:** `GET/POST /login`, `POST /logout`, profile edit/password/delete.
2. **Dashboard:** `GET /` → DashboardController@index.
3. **Inventory** (`/inventory`, perm `inventory.view`):
   - Items CRUD, Stock index/show, Stock Opname (`inventory.opname`), Adjustment (`inventory.adjust`).
4. **Requests** (`/requests`, perm `request.view-own`):
   - List, create/store (`request.create`), reorder (`request.reorder`), show/edit/update/submit/cancel by UUID (`{atk:uuid}`).
5. **Approvals** (`/approvals`, perm `approval.view`): list, show by UUID, approve/reject/comment (`approval.approve`).
6. **Distribution** (`/distribution`, perm `distribution.view`): list, show, prepare (`distribution.manage`), confirm pickup `POST /distribution/{pickup:uuid}/confirm` (perm `distribution.pickup`, bisa diakses requester tanpa distribution.view).
7. **Fulfillment** (`/pemenuhan-stok`, perm `distribution.view`): list, show, confirm-partial & cancel (`request.cancel`).
8. **Reports** (`/reports`, perm `report.view`): index, inventory, usage, department, distribution, recap, trend, export (`report.export`).
9. **Master** (`/master`, perm `master.view`): categories, units, locations, suppliers, departments (resource penuh).
10. **Users** (`/users`, perm `user.view`): index, store (`user.create`), update/password/toggle (`user.edit`), delete (`user.delete`).
11. **Notifications** (`notification.view`): list, mark read/read-all.
12. **Audit** (`audit.view`): list activity log (Spatie Activitylog).
13. **Settings** (`settings.view`): view/update (`settings.manage`), Approval Rules CRUD + toggle.

## 5. Role & Permission (RolesAndPermissionsSeeder.php)
- **Permissions (35):** dashboard.view, master.view/create/edit/delete, inventory.view/manage/adjust/opname/export, request.view-own/view-all/create/edit/cancel/reorder, approval.view/approve, distribution.view/manage/pickup, report.view/export, notification.view, audit.view, user.view/create/edit/delete/manage-roles, settings.view/manage.
- **Admin:** semua permission (full access, approval level 1 gudang/logistik).
- **SM:** dashboard, inventory.view/export, request.view-all, approval.view/approve, distribution.view, report.view, notification.
- **GM:** seperti SM + report.export (approval level 3 tertinggi).
- **Requester:** dashboard, inventory.view, request.view-own/create/edit/cancel, distribution.pickup, notification.
- Guard: `web`. Seeder tambahan: AdminUserSeeder, MasterLocationSeeder, MasterCategoryAndUnitSeeder, ItemSeeder, ApprovalRulesSeeder.

## 6. Alur Bisnis Inti
1. Requester buat Request ATK (`requests.create`) → status draft → submit.
2. Approval bertingkat sesuai ApprovalRule (Admin level 1 → SM level 2 → GM level 3). Approve/reject/comment di `/approvals`.
3. Jika disetujui → Fulfillment (`/pemenuhan-stok`) cek stok & confirm partial/cancel.
4. Distribution (`/distribution`) siapkan jadwal pickup (`prepare`) → Requester konfirmasi ambil (`confirm`, butuh `distribution.pickup`).
5. Stok berkurang via InventoryTransaction, tercatat di Audit/Activity Log + Notifications.
6. Stock Opname & Adjustment untuk koreksi fisik vs sistem. Reorder untuk pengajuan ulang stok menipis.

## 7. Setup Lokal (untuk AI & developer)
```bash
# syarat: PHP 8.2+, Composer, Node 18+, MySQL
git clone <repo> && cd satuatk
cp .env.example .env   # sesuaikan DB_DATABASE=satuatki_db, APP_URL=http://localhost:8000
composer install
npm install
php artisan key:generate
php artisan migrate --seed   # = RolesAndPermissions + Admin + Master + Item + ApprovalRules
php artisan storage:link
npm run dev                  # dev Vite
php artisan serve --port=8000
```
- `.env` lokal saat ini: APP_NAME=Laravel, APP_ENV=local, APP_DEBUG=true, DB_HOST=127.0.0.1:3306, DB_USERNAME=root, DB_PASSWORD=(kosong).
- Perintah berguna: `php artisan migrate:fresh --seed`, `php artisan permission:cache-reset`, `php artisan config:clear && php artisan route:clear && php artisan view:clear`, `npm run build`.

## 8. Build Production
```bash
composer install --optimize-autoloader --no-dev
npm install && npm run build
php artisan config:cache && php artisan route:cache && php artisan view:cache
php artisan migrate --force
php artisan storage:link
```
- Pastikan `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://domain-anda.com`, APP_KEY terisi.
- Folder `public/build` (hasil Vite) WAJIB ikut ter-upload. Hapus route `/bypass-login/{email}` sebelum production.

## 9. Yang Perlu Diketahui AI Saat Bantu Coding
- Routing pakai `web.php` + Inertia render (bukan API JSON murni). Frontend di `resources/js/pages/*`. URL frontend generate via Ziggy.
- Model pakai UUID untuk Request/Approval/Pickup (`{atk:uuid}`, `{approval:uuid}`, `{pickup:uuid}` — route model binding by uuid).
- Otorisasi via `permission:` middleware, bukan gate manual. Cek seeder untuk daftar permission valid.
- Validasi frontend pakai react-hook-form + zod. Styling Tailwind v4.
- Jangan ubah struktur permission/role tanpa update `RolesAndPermissionsSeeder.php`.
- Fokus file jika debug: RequestController, ApprovalController, DistributionController, FulfillmentController, InventoryStock/Transaction.

## 10. Pertanyaan Umum ke GPT (contoh prompt)
- "Berdasarkan DOKUMENTASI ini, buatkan ERD dari modul Request-Approval-Pickup."
- "Cek alur approvals bertingkat, bagaimana ApprovalRule menentukan approver?"
- "Bantu deploy Laravel 12 + Inertia + Vite ini ke cPanel shared hosting dengan SSH."
- "Buatkan test untuk RequestController@store dan ApprovalController@approve."
