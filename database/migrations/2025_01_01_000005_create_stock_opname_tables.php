<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_opnames', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('opname_number', 50)->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('location_id')->nullable();
            $table->string('status', 20)->default('draft'); // draft, in_progress, completed, cancelled
            $table->date('opname_date');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->unsignedBigInteger('completed_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('location_id')->references('id')->on('master_locations')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users');
            $table->foreign('completed_by')->references('id')->on('users')->nullOnDelete();

            $table->index('status');
            $table->index('opname_date');
        });

        Schema::create('stock_opname_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('opname_id');
            $table->unsignedBigInteger('item_id');
            $table->unsignedBigInteger('location_id');
            $table->integer('system_quantity'); // stock in system
            $table->integer('physical_quantity')->nullable(); // actual counted
            $table->integer('difference')->nullable(); // physical - system
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('opname_id')->references('id')->on('stock_opnames')->cascadeOnDelete();
            $table->foreign('item_id')->references('id')->on('master_items');
            $table->foreign('location_id')->references('id')->on('master_locations');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_opname_items');
        Schema::dropIfExists('stock_opnames');
    }
};
