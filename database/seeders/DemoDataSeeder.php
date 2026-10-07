<?php

namespace Database\Seeders;

use App\Models\Approval;
use App\Models\MasterDepartment;
use App\Models\MasterItem;
use App\Models\Requests\Request;
use App\Models\Requests\RequestItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Data demo agar dashboard terlihat hidup:
 * - 5 departemen + 5 user requester (satu per departemen)
 * - ±45 request tersebar 30 hari terakhir, status campur
 *   (kurva 14 hari, donat komposisi, bar departemen, top items,
 *   duplicate warning & pending approval ikut terisi)
 *
 * Idempotent: dilewati bila tabel requests sudah berisi ≥ 20 baris.
 * Jalankan: php artisan db:seed --class=DemoDataSeeder
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        if (Request::count() >= 20) {
            $this->command->info('DemoDataSeeder dilewati: tabel requests sudah berisi data.');
            return;
        }

        mt_srand(20261007);

        // ─── 1. Departemen ──────────────────────────────────────────────────
        $departments = collect([
            ['DEPT-IT',  'Teknologi Informasi'],
            ['DEPT-KEU', 'Keuangan'],
            ['DEPT-SDM', 'SDM & Umum'],
            ['DEPT-OPS', 'Operasional'],
            ['DEPT-MKT', 'Pemasaran'],
        ])->map(fn($d) => MasterDepartment::firstOrCreate(
            ['code' => $d[0]],
            ['name' => $d[1], 'is_active' => true]
        ));

        // ─── 2. User requester demo ─────────────────────────────────────────
        $demoUsers = [
            ['Budi Hartono',  'budi.it@satuatk.id',  'DEPT-IT'],
            ['Siti Rahayu',   'siti.keu@satuatk.id', 'DEPT-KEU'],
            ['Andi Pratama',  'andi.sdm@satuatk.id', 'DEPT-SDM'],
            ['Dewi Lestari',  'dewi.ops@satuatk.id', 'DEPT-OPS'],
            ['Rudi Santoso',  'rudi.mkt@satuatk.id', 'DEPT-MKT'],
        ];

        $requesters = collect($demoUsers)->map(function ($u) use ($departments) {
            $dept = $departments->firstWhere('code', $u[2]);
            $user = User::firstOrCreate(
                ['email' => $u[1]],
                [
                    'name'           => $u[0],
                    'password'       => Hash::make('password'),
                    'is_active'      => true,
                    'approval_level' => 0,
                    'department_id'  => $dept->id,
                ]
            );
            $user->assignRole('Requester');

            return $user;
        });

        // User requester bawaan ikut diberi departemen bila masih kosong,
        // supaya dashboard-nya ikut terisi.
        $defaultRequester = User::where('email', 'user@gmail.com')->first();
        if ($defaultRequester && ! $defaultRequester->department_id) {
            $defaultRequester->department_id = $departments->firstWhere('code', 'DEPT-SDM')->id;
            $defaultRequester->save();
            $requesters->push($defaultRequester);
        }

        $sm = User::where('email', 'sm@gmail.com')->first();
        $gm = User::where('email', 'gm@gmail.com')->first();

        // ─── 3. Item aktif ──────────────────────────────────────────────────
        $itemIds = MasterItem::where('is_active', true)->pluck('id')->all();

        if (empty($itemIds)) {
            $this->command->warn('DemoDataSeeder dibatalkan: tabel master_items kosong (jalankan ItemSeeder dulu).');
            return;
        }

        // ─── 4. Request tersebar 30 hari ────────────────────────────────────
        $titles = [
            'Pengadaan ATK bulanan',
            'Restock kertas HVS dan amplop',
            'Kebutuhan alat tulis rapat kerja',
            'Permintaan toner printer',
            'Pengisian ulang stok pantry tulis',
            'Kebutuhan map dan ordner arsip',
            'Permintaan mendesak presentasi direksi',
            'Restock pulpen dan spidol whiteboard',
            'Kebutuhan ATK onboarding karyawan baru',
            'Pengadaan kalkulator dan tempat pensil',
            'Restock sticky note dan klip kertas',
            'Kebutuhan tinta printer warna',
        ];

        $deliveryPoints = [
            'Gudang Utama',
            'Ruang Rapat Lt.2',
            'Resepsionis Lt.1',
            'Ruang Kerja Lt.3',
        ];

        // status => jumlah (total 45)
        $plan = array_merge(
            array_fill(0, 14, Request::STATUS_FULFILLED),
            array_fill(0, 8, Request::STATUS_APPROVED),
            array_fill(0, 8, Request::STATUS_SUBMITTED),
            array_fill(0, 4, Request::STATUS_PARTIALLY_APPROVED),
            array_fill(0, 5, Request::STATUS_REJECTED),
            array_fill(0, 3, Request::STATUS_CANCELLED),
            array_fill(0, 3, Request::STATUS_DRAFT),
        );
        shuffle($plan);

        $seqCache = [];
        $nextNumber = function (Carbon $date) use (&$seqCache) {
            $prefix = 'REQ-' . $date->format('Ym') . '-';
            if (! isset($seqCache[$prefix])) {
                $max = Request::where('request_number', 'like', $prefix . '%')->max('request_number');
                $seqCache[$prefix] = $max ? ((int) substr($max, -4)) + 1 : 1;
            }

            return $prefix . str_pad($seqCache[$prefix]++, 4, '0', STR_PAD_LEFT);
        };

        foreach ($plan as $status) {
            // 60% dalam 14 hari terakhir (kurva hidup), sisanya hari ke-15 s.d. 35
            $daysAgo = mt_rand(1, 100) <= 60 ? mt_rand(0, 13) : mt_rand(14, 34);
            $created = Carbon::now()->subDays($daysAgo)->setTime(mt_rand(8, 16), mt_rand(0, 59), 0);

            $user = $requesters->random();
            $deptId = $user->department_id
                ?? $departments->random()->id;

            $isDraft = $status === Request::STATUS_DRAFT;

            $req = new Request([
                'uuid'           => (string) Str::uuid(),
                'request_number' => $nextNumber($created),
                'title'          => $titles[array_rand($titles)],
                'category'       => mt_rand(1, 100) <= 15 ? Request::CATEGORY_URGENT : Request::CATEGORY_REGULAR,
                'status'         => $status,
                'department_id'  => $deptId,
                'requested_by'   => $user->id,
                'needed_date'    => $created->copy()->addDays(mt_rand(7, 14))->toDateString(),
                'delivery_point' => $deliveryPoints[array_rand($deliveryPoints)],
                'submitted_at'   => $isDraft ? null : $created->copy()->addHours(mt_rand(1, 5)),
                'fulfilled_at'   => $status === Request::STATUS_FULFILLED
                    ? $created->copy()->addDays(mt_rand(2, 6))
                    : null,
            ]);
            $req->created_at = $created;
            $req->updated_at = $created;
            $req->save();

            // ── Item 1–4 baris ──
            $picked = collect($itemIds)->shuffle()->take(mt_rand(1, 4));

            foreach ($picked as $itemId) {
                $qty = mt_rand(1, 12);

                $itemStatus = 'pending';
                $qtyApproved = null;
                $qtyFulfilled = null;

                if (in_array($status, [Request::STATUS_APPROVED, Request::STATUS_PARTIALLY_APPROVED, Request::STATUS_FULFILLED], true)) {
                    $itemStatus = 'approved';
                    $qtyApproved = $qty;
                }
                if ($status === Request::STATUS_FULFILLED) {
                    $itemStatus = 'fulfilled';
                    $qtyFulfilled = $qty;
                }
                if ($status === Request::STATUS_REJECTED) {
                    $itemStatus = 'rejected';
                    $qtyApproved = 0;
                }

                $ri = new RequestItem([
                    'request_id'         => $req->id,
                    'item_id'            => $itemId,
                    'quantity_requested' => $qty,
                    'quantity_approved'  => $qtyApproved,
                    'quantity_fulfilled' => $qtyFulfilled,
                    'status'             => $itemStatus,
                ]);
                $ri->created_at = $created;
                $ri->updated_at = $created;
                $ri->save();
            }

            // ── Rantai approval ringkas ──
            $this->seedApprovals($req, $status, $sm, $gm);
        }

        // ─── 5. Pasangan duplikat (memicu duplicate warning) ────────────────
        // Request sama (user + item sama) dalam 7 hari terakhir.
        $dupUser = $requesters->first();
        $dupItem = $itemIds[0];
        $dupDept = $dupUser->department_id ?? $departments->first()->id;

        foreach ([5, 3] as $daysAgo) {
            $created = Carbon::now()->subDays($daysAgo)->setTime(10, 15, 0);

            $req = new Request([
                'uuid'           => (string) Str::uuid(),
                'request_number' => $nextNumber($created),
                'title'          => 'Permintaan susulan kertas HVS',
                'category'       => Request::CATEGORY_REGULAR,
                'status'         => Request::STATUS_SUBMITTED,
                'department_id'  => $dupDept,
                'requested_by'   => $dupUser->id,
                'needed_date'    => $created->copy()->addDays(7)->toDateString(),
                'delivery_point' => 'Gudang Utama',
                'submitted_at'   => $created->copy()->addHour(),
            ]);
            $req->created_at = $created;
            $req->updated_at = $created;
            $req->save();

            $ri = new RequestItem([
                'request_id'         => $req->id,
                'item_id'            => $dupItem,
                'quantity_requested' => 5,
                'status'             => 'pending',
            ]);
            $ri->created_at = $created;
            $ri->updated_at = $created;
            $ri->save();

            $this->seedApprovals($req, Request::STATUS_SUBMITTED, $sm, $gm);
        }

        $this->command->info('✓ Data demo berhasil di-seed: 5 departemen, 5 user requester, ±47 request 30 hari terakhir.');
        $this->command->line('  Login demo: budi.it@satuatk.id / password (dan 4 akun requester lain, lihat seeder).');
    }

    /**
     * Rantai approval ringkas yang konsisten dengan status request.
     */
    private function seedApprovals(Request $req, string $status, ?User $sm, ?User $gm): void
    {
        $at = $req->submitted_at ?? $req->created_at;

        $make = function (int $level, int $requiredLevel, string $st, ?User $approver, ?Carbon $actionAt = null) use ($req, $at) {
            Approval::create([
                'uuid'           => (string) Str::uuid(),
                'request_id'     => $req->id,
                'level'          => $level,
                'required_level' => $requiredLevel,
                'status'         => $st,
                'approver_id'    => $approver?->id,
                'action_at'      => $actionAt,
                'due_at'         => $st === 'pending' ? $at->copy()->addDays(2) : null,
            ]);
        };

        match ($status) {
            Request::STATUS_SUBMITTED => $make(1, 1, 'pending', $sm),
            Request::STATUS_APPROVED => $make(1, 1, 'approved', $sm, $at->copy()->addDay()),
            Request::STATUS_PARTIALLY_APPROVED => [
                $make(1, 1, 'approved', $sm, $at->copy()->addDay()),
                $make(2, 2, 'pending', $gm),
            ],
            Request::STATUS_REJECTED => $make(1, 1, 'rejected', $sm, $at->copy()->addDay()),
            Request::STATUS_FULFILLED => [
                $make(1, 1, 'approved', $sm, $at->copy()->addDay()),
                $make(2, 2, 'approved', $gm, $at->copy()->addDays(2)),
            ],
            default => null,
        };
    }
}
