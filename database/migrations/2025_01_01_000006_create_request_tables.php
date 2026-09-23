<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('requests', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('request_number', 50)->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category', 20)->default('regular'); // regular, urgent
            $table->string('status', 30)->default('draft');
            // draft, submitted, approved, partially_approved, rejected, fulfilled, cancelled
            $table->unsignedBigInteger('department_id');
            $table->unsignedBigInteger('requested_by');
            $table->date('needed_date')->nullable();
            $table->text('notes')->nullable();
            $table->string('attachment')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('fulfilled_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('department_id')->references('id')->on('master_departments');
            $table->foreign('requested_by')->references('id')->on('users');

            $table->index('status');
            $table->index('category');
            $table->index('department_id');
            $table->index('requested_by');
            $table->index('submitted_at');
        });

        Schema::create('request_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('request_id');
            $table->unsignedBigInteger('item_id');
            $table->integer('quantity_requested');
            $table->integer('quantity_approved')->nullable();
            $table->integer('quantity_fulfilled')->nullable();
            $table->string('status', 20)->default('pending'); // pending, approved, rejected, fulfilled
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('request_id')->references('id')->on('requests')->cascadeOnDelete();
            $table->foreign('item_id')->references('id')->on('master_items');

            $table->index('request_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('request_items');
        Schema::dropIfExists('requests');
    }
};
