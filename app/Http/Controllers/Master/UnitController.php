<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\MasterUnit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UnitController extends Controller
{
    public function index(Request $request): Response
    {
        $units = MasterUnit::query()
            ->when($request->search, fn($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Master/Units/Index', [
            'units'   => $units,
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'code'   => ['required', 'string', 'max:10', 'unique:master_units,code'],
            'name'   => ['required', 'string', 'max:50'],
            'symbol' => ['nullable', 'string', 'max:10'],
        ]);

        MasterUnit::create($data);
        return back()->with('success', 'Satuan berhasil ditambahkan.');
    }

    public function update(Request $request, MasterUnit $unit): RedirectResponse
    {
        $data = $request->validate([
            'code'      => ['required', 'string', 'max:10', 'unique:master_units,code,' . $unit->id],
            'name'      => ['required', 'string', 'max:50'],
            'symbol'    => ['nullable', 'string', 'max:10'],
            'is_active' => ['boolean'],
        ]);

        $unit->update($data);
        return back()->with('success', 'Satuan berhasil diperbarui.');
    }

    public function destroy(MasterUnit $unit): RedirectResponse
    {
        $unit->delete();
        return back()->with('success', 'Satuan berhasil dihapus.');
    }
}
