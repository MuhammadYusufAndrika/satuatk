<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class AuditController extends Controller
{
    public function index(Request $request): Response
    {
        $logs = [];

        // If spatie/laravel-activitylog is installed, use it; otherwise return empty
        if (class_exists(Activity::class)) {
            $logs = Activity::with('causer')
                ->when($request->search, fn($q, $s) => $q->where('description', 'like', "%{$s}%"))
                ->when($request->causer, fn($q, $c) => $q->where('causer_id', $c))
                ->latest()
                ->paginate(30)
                ->withQueryString();
        }

        return Inertia::render('Audit/Index', [
            'logs'    => $logs,
            'filters' => $request->only('search', 'causer'),
            'users'   => User::active()->orderBy('name')->get(['id', 'name']),
        ]);
    }
}
