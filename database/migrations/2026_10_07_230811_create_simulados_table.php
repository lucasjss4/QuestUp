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
        Schema::create('simulados', function (Blueprint $table) {
            $table->id();
            $table->date('data_realizacao');
            $table->unsignedBigInteger('concurso_id');

            $table->foreign('concurso_id')->references('id')->on('concursos');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('simulados');
    }
};
