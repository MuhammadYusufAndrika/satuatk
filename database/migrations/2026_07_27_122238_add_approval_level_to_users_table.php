<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // 1=Level 1 (Admin/Staff), 2=Level 2 (SM/Supervisor), 3=Level 3 (GM)
            // An approver can approve requests at or below their level.
            $table->unsignedTinyInteger('approval_level')->default(1)->after('is_active')
                  ->comment('1=Admin, 2=SM, 3=GM — determines max approval level this user can action');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('approval_level');
        });
    }
};
