<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\MasterLocation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LocationController extends Controller
{
    public function index(Request $request): Response
    {
        $locations = MasterLocation::query()
            ->when($request->search, fn($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Master/Locations/Index', [
            'locations' => $locations,
            'filters'   => $request->only('search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:20', 'unique:master_locations,code'],
            'name' => ['required', 'string', 'max:100'],
            'type' => ['required', 'in:warehouse,rack,shelf,other'],
        ]);

        MasterLocation::create($data);
        return back()->with('success', 'Lokasi berhasil ditambahkan.');
    }

    public function update(Request $request, MasterLocation $location): RedirectResponse
    {
        $data = $request->validate([
            'code'      => ['required', 'string', 'max:20', 'unique:master_locations,code,' . $location->id],
            'name'      => ['required', 'string', 'max:100'],
            'type'      => ['required', 'in:warehouse,rack,shelf,other'],
            'is_active' => ['boolean'],
        ]);

        $location->update($data);
        return back()->with('success', 'Lokasi berhasil diperbarui.');
    }

    public function destroy(MasterLocation $location): RedirectResponse
    {
        $location->delete();
        return back()->with('success', 'Lokasi berhasil dihapus.');
    }
}
