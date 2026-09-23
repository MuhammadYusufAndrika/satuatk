<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\MasterCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $categories = MasterCategory::query()
            ->when($request->search, fn($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Master/Categories/Index', [
            'categories' => $categories,
            'filters'    => $request->only('search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:30', 'unique:master_categories,code'],
            'name' => ['required', 'string', 'max:100'],
            'icon' => ['nullable', 'string', 'max:50'],
        ]);

        MasterCategory::create($data);

        return back()->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function update(Request $request, MasterCategory $category): RedirectResponse
    {
        $data = $request->validate([
            'code'      => ['required', 'string', 'max:30', 'unique:master_categories,code,' . $category->id],
            'name'      => ['required', 'string', 'max:100'],
            'icon'      => ['nullable', 'string', 'max:50'],
            'is_active' => ['boolean'],
        ]);

        $category->update($data);

        return back()->with('success', 'Kategori berhasil diperbarui.');
    }

    public function destroy(MasterCategory $category): RedirectResponse
    {
        $category->delete();
        return back()->with('success', 'Kategori berhasil dihapus.');
    }
}
