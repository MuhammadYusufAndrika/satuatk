<?php

namespace App\Http\Controllers\UserManagement;

use App\Http\Controllers\Controller;
use App\Models\MasterDepartment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    // ─── Role → approval_level mapping ───────────────────────────────────────

    private const ROLE_LEVELS = [
        'Requester' => 0,
        'Admin'     => 1,
        'SM'        => 2,
        'GM'        => 3,
    ];

    // ─── Index ────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $users = User::with(['roles', 'department'])
            ->when($request->search, fn($q, $s) =>
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('employee_id', 'like', "%{$s}%")
            )
            ->when($request->role, fn($q, $r) => $q->role($r))
            ->when($request->status !== null && $request->status !== '', fn($q) =>
                $q->where('is_active', $request->boolean('status'))
            )
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        // Summarize role for the frontend
        $users->getCollection()->transform(function ($u) {
            $u->role = $u->roles->first()?->name ?? null;
            return $u;
        });

        $roles = Role::orderBy('name')->pluck('name');
        $departments = MasterDepartment::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Users/Index', [
            'users'       => $users,
            'roles'       => $roles,
            'departments' => $departments,
            'filters'     => $request->only('search', 'role', 'status'),
            'stats'       => [
                'total'     => User::count(),
                'active'    => User::where('is_active', true)->count(),
                'by_role'   => Role::withCount('users')->get()->map(fn($r) => ['name' => $r->name, 'count' => $r->users_count]),
            ],
        ]);
    }

    // ─── Store (create user) ──────────────────────────────────────────────────

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'          => ['required', 'string', 'max:255'],
            'email'         => ['required', 'email', 'unique:users,email'],
            'employee_id'   => ['required', 'string', 'max:50', 'unique:users,employee_id'],
            'phone'         => ['nullable', 'string', 'max:20'],
            'department_id' => ['nullable', 'exists:master_departments,id'],
            'role'          => ['required', 'string', Rule::in(array_keys(self::ROLE_LEVELS))],
            'password'      => ['required', Password::defaults()],
        ]);

        $approvalLevel = self::ROLE_LEVELS[$validated['role']];

        $user = User::create([
            'name'           => $validated['name'],
            'email'          => $validated['email'],
            'employee_id'    => $validated['employee_id'],
            'phone'          => $validated['phone'] ?? null,
            'department_id'  => $validated['department_id'] ?? null,
            'password'       => Hash::make($validated['password']),
            'approval_level' => $approvalLevel,
            'is_active'      => true,
            'email_verified_at' => now(),
        ]);

        $user->syncRoles([$validated['role']]);

        return back()->with('success', "Pengguna {$user->name} berhasil dibuat dengan role {$validated['role']}.");
    }

    // ─── Update (edit user) ───────────────────────────────────────────────────

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name'          => ['required', 'string', 'max:255'],
            'email'         => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'employee_id'   => ['required', 'string', 'max:50', Rule::unique('users')->ignore($user->id)],
            'phone'         => ['nullable', 'string', 'max:20'],
            'department_id' => ['nullable', 'exists:master_departments,id'],
            'role'          => ['required', 'string', Rule::in(array_keys(self::ROLE_LEVELS))],
            'is_active'     => ['boolean'],
        ]);

        $approvalLevel = self::ROLE_LEVELS[$validated['role']];

        $user->update([
            'name'           => $validated['name'],
            'email'          => $validated['email'],
            'employee_id'    => $validated['employee_id'],
            'phone'          => $validated['phone'] ?? null,
            'department_id'  => $validated['department_id'] ?? null,
            'is_active'      => $validated['is_active'] ?? $user->is_active,
            'approval_level' => $approvalLevel,
        ]);

        $user->syncRoles([$validated['role']]);

        return back()->with('success', "Data {$user->name} berhasil diperbarui.");
    }

    // ─── Update password ──────────────────────────────────────────────────────

    public function updatePassword(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $user->update(['password' => Hash::make($validated['password'])]);

        return back()->with('success', "Password {$user->name} berhasil diubah.");
    }

    // ─── Toggle active status ─────────────────────────────────────────────────

    public function toggleActive(User $user): RedirectResponse
    {
        // Prevent deactivating yourself
        if ($user->id === auth()->id()) {
            return back()->withErrors(['error' => 'Tidak bisa menonaktifkan akun sendiri.']);
        }

        $user->update(['is_active' => ! $user->is_active]);

        $status = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';
        return back()->with('success', "{$user->name} berhasil {$status}.");
    }

    // ─── Destroy ─────────────────────────────────────────────────────────────

    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->withErrors(['error' => 'Tidak bisa menghapus akun sendiri.']);
        }

        $user->delete();

        return back()->with('success', "Pengguna {$user->name} berhasil dihapus.");
    }
}
