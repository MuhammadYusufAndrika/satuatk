<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);              // e.g. "Standard", "SM Required", "GM Required"
            $table->unsignedTinyInteger('level');     // 1, 2, 3
            $table->decimal('min_value', 15, 2)->default(0);     // trigger if total request >= min_value
            $table->decimal('max_value', 15, 2)->nullable();     // null = no upper bound
            $table->unsignedSmallInteger('sla_hours')->default(24); // SLA per level in hours
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('level');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_rules');
    }
};
