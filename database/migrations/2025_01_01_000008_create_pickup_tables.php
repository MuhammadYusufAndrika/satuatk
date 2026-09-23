<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pickup_schedules', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('pickup_number', 50)->unique();
            $table->unsignedBigInteger('request_id');
            $table->string('status', 20)->default('scheduled');
            // scheduled, ready, picked_up, cancelled
            $table->date('scheduled_date');
            $table->string('pickup_time', 20)->nullable();
            $table->string('qr_code')->nullable();
            $table->unsignedBigInteger('prepared_by')->nullable();
            $table->timestamp('prepared_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('request_id')->references('id')->on('requests');
            $table->foreign('prepared_by')->references('id')->on('users')->nullOnDelete();

            $table->index('status');
            $table->index('scheduled_date');
        });

        Schema::create('pickup_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pickup_schedule_id');
            $table->unsignedBigInteger('picked_up_by');
            $table->timestamp('picked_up_at');
            $table->string('signature_path')->nullable(); // digital signature file
            $table->text('proof_notes')->nullable();
            $table->timestamps();

            $table->foreign('pickup_schedule_id')->references('id')->on('pickup_schedules')->cascadeOnDelete();
            $table->foreign('picked_up_by')->references('id')->on('users');

            $table->index('pickup_schedule_id');
            $table->index('picked_up_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pickup_logs');
        Schema::dropIfExists('pickup_schedules');
    }
};
