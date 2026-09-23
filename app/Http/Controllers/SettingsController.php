<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Settings/Index', [
            'settings' => [
                'app_name'    => Setting::get('app_name', 'general', config('app.name')),
                'timezone'    => Setting::get('timezone', 'general', config('app.timezone')),
                'locale'      => Setting::get('locale', 'general', config('app.locale')),
            ],
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'app_name' => ['nullable', 'string', 'max:100'],
            'timezone' => ['nullable', 'string', 'max:50'],
            'locale'   => ['nullable', 'string', 'max:10'],
        ]);

        foreach (array_filter($data) as $key => $value) {
            Setting::set($key, $value, 'general');
        }

        return back()->with('success', 'Pengaturan berhasil disimpan.');
    }
}
