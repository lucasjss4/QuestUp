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
        Schema::create('concurso_conteudos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('concurso_id');
            $table->unsignedBigInteger('conteudo_id');


            $table->foreign('concurso_id')->references('id')->on('concursos');
            $table->foreign('conteudo_id')->references('id')->on('conteudos');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('concurso_conteudos');
    }
};
