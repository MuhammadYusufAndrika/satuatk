<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approvals', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('request_id');
            $table->integer('level'); // 1=Supervisor, 2=Senior Manager, 3=General Manager
            $table->string('status', 20)->default('pending'); // pending, approved, rejected, skipped
            $table->unsignedBigInteger('approver_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('action_at')->nullable();
            $table->timestamp('due_at')->nullable(); // SLA deadline
            $table->timestamps();

            $table->foreign('request_id')->references('id')->on('requests')->cascadeOnDelete();
            $table->foreign('approver_id')->references('id')->on('users')->nullOnDelete();

            $table->index('request_id');
            $table->index('status');
            $table->index('level');
            $table->index('approver_id');
        });

        Schema::create('approval_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('approval_id');
            $table->unsignedBigInteger('user_id');
            $table->string('action', 30); // approved, rejected, delegated, reminded
            $table->text('notes')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->foreign('approval_id')->references('id')->on('approvals')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users');

            $table->index('approval_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_logs');
        Schema::dropIfExists('approvals');
    }
};
