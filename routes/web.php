<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Inventory\InventoryController;
use App\Http\Controllers\Inventory\ItemController;
use App\Http\Controllers\Inventory\StockController;
use App\Http\Controllers\Inventory\StockOpnameController;
use App\Http\Controllers\Inventory\AdjustmentController;
use App\Http\Controllers\Requests\RequestController;
use App\Http\Controllers\Approvals\ApprovalController;
use App\Http\Controllers\Distribution\DistributionController;
use App\Http\Controllers\Fulfillment\FulfillmentController;
use App\Http\Controllers\Reports\ReportController;
use App\Http\Controllers\Master\CategoryController;
use App\Http\Controllers\Master\UnitController;
use App\Http\Controllers\Master\LocationController;
use App\Http\Controllers\Master\SupplierController;
use App\Http\Controllers\Master\DepartmentController;
use App\Http\Controllers\UserManagement\UserController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AuditController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\Settings\ApprovalRuleController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');
    Route::delete('profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::middleware('permission:inventory.view')->prefix('inventory')->name('inventory.')->group(function () {
        Route::get('/', [InventoryController::class, 'index'])->name('index');
        Route::middleware('permission:inventory.view')->resource('items', ItemController::class)->names('items');
        Route::middleware('permission:inventory.view')->resource('stock', StockController::class)->only(['index', 'show'])->names('stock');
        Route::middleware('permission:inventory.opname')->resource('opname', StockOpnameController::class)->names('opname');
        Route::middleware('permission:inventory.adjust')->resource('adjustment', AdjustmentController::class)->names('adjustment');
    });

        Route::middleware('permission:request.view-own')->prefix('requests')->name('requests.')->group(function () {
        Route::get('/', [RequestController::class, 'index'])->name('index');
        Route::get('/create', [RequestController::class, 'create'])->name('create')->middleware('permission:request.create');
        Route::post('/', [RequestController::class, 'store'])->name('store')->middleware('permission:request.create');

        Route::middleware('permission:request.reorder')->group(function () {
            Route::get('/reorder', [RequestController::class, 'reorderIndex'])->name('reorder');
            Route::post('/reorder', [RequestController::class, 'storeReorderRequest'])->name('reorder.store');
            Route::post('/reorder-all', [RequestController::class, 'storeAllReorderRequest'])->name('reorder.store-all');
        });

        Route::get('/{atk:uuid}', [RequestController::class, 'show'])->name('show');
Route::get('/{atk:uuid}/edit', [RequestController::class, 'edit'])->name('edit')->middleware('permission:request.edit');
Route::patch('/{atk:uuid}', [RequestController::class, 'update'])->name('update')->middleware('permission:request.edit');
Route::post('/{atk:uuid}/submit', [RequestController::class, 'submit'])->name('submit');
Route::post('/{atk:uuid}/cancel', [RequestController::class, 'cancel'])->name('cancel')->middleware('permission:request.cancel');
});
    Route::middleware('permission:approval.view')->prefix('approvals')->name('approvals.')->group(function () {
        Route::get('/', [ApprovalController::class, 'index'])->name('index');
        Route::get('/{approval:uuid}', [ApprovalController::class, 'show'])->name('show');
        Route::post('/{approval:uuid}/approve', [ApprovalController::class, 'approve'])->name('approve')->middleware('permission:approval.approve');
        Route::post('/{approval:uuid}/reject', [ApprovalController::class, 'reject'])->name('reject')->middleware('permission:approval.approve');
        Route::post('/{approval:uuid}/comment', [ApprovalController::class, 'comment'])->name('comment')->middleware('permission:approval.approve');
    });

   
Route::middleware('permission:distribution.view')->prefix('distribution')->name('distribution.')->group(function () {
    Route::get('/', [DistributionController::class, 'index'])->name('index');
    Route::get('/{pickup:uuid}', [DistributionController::class, 'show'])->name('show');
    Route::post('/{pickup:uuid}/prepare', [DistributionController::class, 'prepare'])->name('prepare')->middleware('permission:distribution.manage');
});

// Receipt confirmation dilakukan requester pemilik request — jangan digabung ke group
// distribution.view di atas, karena requester biasa gak (dan gak perlu) punya izin itu.
Route::post('/distribution/{pickup:uuid}/confirm', [DistributionController::class, 'confirm'])
    ->name('distribution.confirm')
    ->middleware('permission:distribution.pickup');
Route::prefix('pemenuhan-stok')->name('fulfillment.')->middleware('permission:distribution.view')->group(function () {
    Route::get('/', [FulfillmentController::class, 'index'])->name('index');
    Route::get('/{atk:uuid}', [FulfillmentController::class, 'show'])->name('show');
});

Route::prefix('pemenuhan-stok')->name('fulfillment.')->group(function () {
    Route::post('/{atk:uuid}/confirm-partial', [FulfillmentController::class, 'confirmPartial'])->name('confirmPartial')->middleware('permission:request.cancel');
    Route::post('/{atk:uuid}/cancel', [FulfillmentController::class, 'cancelForStock'])->name('cancel')->middleware('permission:request.cancel');
});

    Route::middleware('permission:report.view')->prefix('reports')->name('reports.')->group(function () {
        Route::get('/', [ReportController::class, 'index'])->name('index');
        Route::get('/inventory', [ReportController::class, 'inventory'])->name('inventory');
        Route::get('/usage', [ReportController::class, 'usage'])->name('usage');
        Route::get('/department', [ReportController::class, 'department'])->name('department');
Route::get('/distribution', [ReportController::class, 'distribution'])->name('distribution');
Route::get('/recap', [ReportController::class, 'recap'])->name('recap');
Route::get('/trend', [ReportController::class, 'trend'])->name('trend');
Route::get('/export', [ReportController::class, 'export'])->name('export')->middleware('permission:report.export');
    });

    Route::middleware('permission:master.view')->prefix('master')->name('master.')->group(function () {
        Route::get('/', fn() => redirect()->route('master.categories.index'))->name('index');
        Route::resource('categories', CategoryController::class)->names('categories');
        Route::resource('units', UnitController::class)->names('units');
        Route::resource('locations', LocationController::class)->names('locations');
        Route::resource('suppliers', SupplierController::class)->names('suppliers');
        Route::resource('departments', DepartmentController::class)->names('departments');
    });

    Route::middleware('permission:user.view')->prefix('users')->name('users.')->group(function () {
        Route::get('/', [UserController::class, 'index'])->name('index');
        Route::post('/', [UserController::class, 'store'])->name('store')->middleware('permission:user.create');
        Route::put('/{user}', [UserController::class, 'update'])->name('update')->middleware('permission:user.edit');
        Route::put('/{user}/password', [UserController::class, 'updatePassword'])->name('password')->middleware('permission:user.edit');
        Route::patch('/{user}/toggle', [UserController::class, 'toggleActive'])->name('toggle')->middleware('permission:user.edit');
        Route::delete('/{user}', [UserController::class, 'destroy'])->name('destroy')->middleware('permission:user.delete');
    });

    Route::middleware('permission:notification.view')->prefix('notifications')->name('notifications.')->group(function () {
        Route::get('/', [NotificationController::class, 'index'])->name('index');
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead'])->name('read');
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead'])->name('read-all');
    });

    Route::middleware('permission:audit.view')->prefix('audit')->name('audit.')->group(function () {
        Route::get('/', [AuditController::class, 'index'])->name('index');
    });

    Route::middleware('permission:settings.view')->prefix('settings')->name('settings.')->group(function () {
        Route::get('/', [SettingsController::class, 'index'])->name('index');
        Route::post('/', [SettingsController::class, 'update'])->name('update')->middleware('permission:settings.manage');

        Route::middleware('permission:settings.manage')->prefix('approval-rules')->name('approval-rules.')->group(function () {
            Route::get('/', [ApprovalRuleController::class, 'index'])->name('index');
            Route::post('/', [ApprovalRuleController::class, 'store'])->name('store');
            Route::put('/{approvalRule}', [ApprovalRuleController::class, 'update'])->name('update');
            Route::delete('/{approvalRule}', [ApprovalRuleController::class, 'destroy'])->name('destroy');
            Route::patch('/{approvalRule}/toggle', [ApprovalRuleController::class, 'toggle'])->name('toggle');
        });
    });
});

