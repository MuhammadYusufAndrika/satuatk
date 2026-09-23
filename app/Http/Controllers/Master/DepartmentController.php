<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\MasterDepartment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    public function index(Request $request): Response
    {
        $departments = MasterDepartment::query()
            ->when($request->search, fn($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Master/Departments/Index', [
            'departments' => $departments,
            'filters'     => $request->only('search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:10', 'unique:master_departments,code'],
            'name' => ['required', 'string', 'max:100'],
        ]);

        MasterDepartment::create($data);
        return back()->with('success', 'Departemen berhasil ditambahkan.');
    }

    public function update(Request $request, MasterDepartment $department): RedirectResponse
    {
        $data = $request->validate([
            'code'      => ['required', 'string', 'max:10', 'unique:master_departments,code,' . $department->id],
            'name'      => ['required', 'string', 'max:100'],
            'is_active' => ['boolean'],
        ]);

        $department->update($data);
        return back()->with('success', 'Departemen berhasil diperbarui.');
    }

    public function destroy(MasterDepartment $department): RedirectResponse
    {
        $department->delete();
        return back()->with('success', 'Departemen berhasil dihapus.');
    }
}
