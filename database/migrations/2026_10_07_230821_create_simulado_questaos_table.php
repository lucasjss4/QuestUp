<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('simulado_questaos', function (Blueprint $table) {
            $table->id();
            $table->char('opcao_marcada');
            $table->boolean('acerto');
            $table->unsignedBigInteger('questao_id');
            $table->unsignedBigInteger('simulado_id');

            $table->foreign('questao_id')->references('id')->on('questaos');
            $table->foreign('simulado_id')->references('id')->on('simulados');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('simulado_questaos');
    }
};
