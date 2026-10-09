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
        Schema::create('questaos', function (Blueprint $table) {
            $table->id();
            $table->text('Enunciado');
            $table->string('origem');
            $table->string('Dificuldade');
            $table->unsignedBigInteger('conteudo_id');

            $table->foreign('conteudo_id')->references('id')->on('conteudos');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('questaos');
    }
};
