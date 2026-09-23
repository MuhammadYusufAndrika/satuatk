<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\MasterSupplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    public function index(Request $request): Response
    {
        $suppliers = MasterSupplier::query()
            ->when($request->search, fn($q, $s) =>
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('code', 'like', "%{$s}%")
            )
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Master/Suppliers/Index', [
            'suppliers' => $suppliers,
            'filters'   => $request->only('search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'code'           => ['required', 'string', 'max:20', 'unique:master_suppliers,code'],
            'name'           => ['required', 'string', 'max:100'],
            'contact_person' => ['nullable', 'string', 'max:100'],
            'email'          => ['nullable', 'email', 'max:100'],
            'phone'          => ['nullable', 'string', 'max:20'],
            'address'        => ['nullable', 'string'],
            'city'           => ['nullable', 'string', 'max:50'],
        ]);

        MasterSupplier::create($data);
        return back()->with('success', 'Supplier berhasil ditambahkan.');
    }

    public function update(Request $request, MasterSupplier $supplier): RedirectResponse
    {
        $data = $request->validate([
            'code'           => ['required', 'string', 'max:20', 'unique:master_suppliers,code,' . $supplier->id],
            'name'           => ['required', 'string', 'max:100'],
            'contact_person' => ['nullable', 'string', 'max:100'],
            'email'          => ['nullable', 'email', 'max:100'],
            'phone'          => ['nullable', 'string', 'max:20'],
            'address'        => ['nullable', 'string'],
            'city'           => ['nullable', 'string', 'max:50'],
            'is_active'      => ['boolean'],
        ]);

        $supplier->update($data);
        return back()->with('success', 'Supplier berhasil diperbarui.');
    }

    public function destroy(MasterSupplier $supplier): RedirectResponse
    {
        $supplier->delete();
        return back()->with('success', 'Supplier berhasil dihapus.');
    }
}
