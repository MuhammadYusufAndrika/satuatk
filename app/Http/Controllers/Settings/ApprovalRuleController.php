<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\ApprovalRule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApprovalRuleController extends Controller
{
    public function index(): Response
    {
        $rules = ApprovalRule::orderBy('level')->orderBy('min_value')->get();

        return Inertia::render('Settings/ApprovalRules', [
            'rules' => $rules,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'        => ['required', 'string', 'max:100'],
            'level'       => ['required', 'integer', 'min:1', 'max:2'],
            'min_value'   => ['required', 'numeric', 'min:0'],
            'max_value'   => ['nullable', 'numeric', 'gt:min_value'],
            'sla_hours'   => ['required', 'integer', 'min:1', 'max:720'],
            'description' => ['nullable', 'string', 'max:255'],
            'is_active'   => ['boolean'],
        ]);

        ApprovalRule::create($data);

        return back()->with('success', 'Aturan approval berhasil ditambahkan.');
    }

    public function update(Request $request, ApprovalRule $approvalRule): RedirectResponse
    {
        $data = $request->validate([
            'name'        => ['required', 'string', 'max:100'],
            'level'       => ['required', 'integer', 'min:1', 'max:2'],
            'min_value'   => ['required', 'numeric', 'min:0'],
            'max_value'   => ['nullable', 'numeric', 'gt:min_value'],
            'sla_hours'   => ['required', 'integer', 'min:1', 'max:720'],
            'description' => ['nullable', 'string', 'max:255'],
            'is_active'   => ['boolean'],
        ]);

        $approvalRule->update($data);

        return back()->with('success', 'Aturan approval diperbarui.');
    }

    public function destroy(ApprovalRule $approvalRule): RedirectResponse
    {
        $approvalRule->delete();

        return back()->with('success', 'Aturan approval dihapus.');
    }

    public function toggle(ApprovalRule $approvalRule): RedirectResponse
    {
        $approvalRule->update(['is_active' => ! $approvalRule->is_active]);

        return back()->with('success', 'Status aturan diperbarui.');
    }
}
