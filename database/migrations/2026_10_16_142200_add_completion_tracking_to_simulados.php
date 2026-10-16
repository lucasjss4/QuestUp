<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('simulados', function (Blueprint $table) {
            $table->timestamp('concluido_em')->nullable();
        });

        Schema::table('simulado_questaos', function (Blueprint $table) {
            $table->char('opcao_marcada')->nullable()->change();
            $table->boolean('acerto')->nullable()->change();
        });
    }

    public function down(): void
    {
        DB::table('simulado_questaos')
            ->whereNull('opcao_marcada')
            ->update(['opcao_marcada' => '', 'acerto' => false]);

        Schema::table('simulado_questaos', function (Blueprint $table) {
            $table->char('opcao_marcada')->nullable(false)->change();
            $table->boolean('acerto')->nullable(false)->change();
        });

        Schema::table('simulados', function (Blueprint $table) {
            $table->dropColumn('concluido_em');
        });
    }
};
