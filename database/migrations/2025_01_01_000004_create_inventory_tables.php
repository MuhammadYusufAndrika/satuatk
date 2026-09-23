<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_stocks', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('item_id');
            $table->unsignedBigInteger('location_id');
            $table->integer('quantity')->default(0);
            $table->integer('reserved_quantity')->default(0); // reserved for approved requests
            $table->timestamps();

            $table->foreign('item_id')->references('id')->on('master_items');
            $table->foreign('location_id')->references('id')->on('master_locations');

            $table->unique(['item_id', 'location_id']);
            $table->index('item_id');
            $table->index('location_id');
        });

        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('item_id');
            $table->unsignedBigInteger('location_id');
            $table->string('transaction_type', 30); // in, out, adjustment, opname, transfer
            $table->string('reference_type')->nullable(); // request, purchase, adjustment, opname
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('reference_number')->nullable();
            $table->integer('quantity_before');
            $table->integer('quantity_change'); // positive=in, negative=out
            $table->integer('quantity_after');
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->foreign('item_id')->references('id')->on('master_items');
            $table->foreign('location_id')->references('id')->on('master_locations');
            $table->foreign('created_by')->references('id')->on('users');

            $table->index('item_id');
            $table->index('transaction_type');
            $table->index(['reference_type', 'reference_id']);
            $table->index('created_at');
        });

        Schema::create('inventory_adjustments', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('adjustment_number', 50)->unique();
            $table->string('type', 20); // increase, decrease
            $table->text('reason');
            $table->string('status', 20)->default('pending'); // pending, approved, rejected
            $table->unsignedBigInteger('created_by');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('created_by')->references('id')->on('users');
            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();

            $table->index('status');
        });

        Schema::create('inventory_adjustment_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('adjustment_id');
            $table->unsignedBigInteger('item_id');
            $table->unsignedBigInteger('location_id');
            $table->integer('quantity_before');
            $table->integer('quantity_adjustment'); // can be negative
            $table->integer('quantity_after');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('adjustment_id')->references('id')->on('inventory_adjustments')->cascadeOnDelete();
            $table->foreign('item_id')->references('id')->on('master_items');
            $table->foreign('location_id')->references('id')->on('master_locations');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_adjustment_items');
        Schema::dropIfExists('inventory_adjustments');
        Schema::dropIfExists('inventory_transactions');
        Schema::dropIfExists('inventory_stocks');
    }
};
