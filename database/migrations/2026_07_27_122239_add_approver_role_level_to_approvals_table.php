<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('approvals', function (Blueprint $table) {
            // Which user approval_level is required to action this approval record
            $table->unsignedTinyInteger('required_level')->default(1)->after('level')
                  ->comment('Minimum approval_level a user must have to action this record');
            // When the approver was first notified (for SLA tracking)
            $table->timestamp('notified_at')->nullable()->after('due_at');
        });
    }

    public function down(): void
    {
        Schema::table('approvals', function (Blueprint $table) {
            $table->dropColumn(['required_level', 'notified_at']);
        });
    }
};
