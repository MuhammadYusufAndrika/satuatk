<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'uuid' => $request->user()->uuid,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'employee_id' => $request->user()->employee_id,
                    'avatar_url' => $request->user()->avatar_url,
                    'approval_level' => $request->user()->approval_level ?? 0,
                    'department' => $request->user()->department?->only('id', 'name', 'code'),
                    'roles' => $request->user()->getRoleNames(),
                    'permissions' => $request->user()->getAllPermissions()->pluck('name'),
                ] : null,
            ],
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'flash' => [
    'success' => $request->session()->get('success'),
    'error' => $request->session()->get('error'),
    'warning' => $request->session()->get('warning'),
    'info' => $request->session()->get('info'),
    'duplicate_warning' => $request->session()->get('duplicate_warning'),
],
            'notifications_count' => rescue(
                fn () => $request->user()?->unreadNotifications()->count() ?? 0,
                0,
                false
            ),
        ]);
    }
}
