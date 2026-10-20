<?php

use App\Http\Controllers\ConcursoController;
use App\Models\Concurso;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('/home', function () {
        $concursos = Concurso::query()
            ->where('user_id', Auth::id())
            ->orderByDesc('data_concurso')
            ->get(['id', 'titulo', 'data_concurso']);

        return Inertia::render('homePage', [
            'concursos' => $concursos,
        ]);
    })->name('homePage');
    Route::get('/historico', [ConcursoController::class, 'history'])->name('historico');
    Route::get('/adicionar-concurso', function () {
        return Inertia::render('concurso/concursoform');
    })->name('addConcurso');
    Route::prefix('concurso')->group(function () {
        Route::post('/', [ConcursoController::class, 'create'])->name('concurso.create');
        Route::post('/importar-estrutura', [ConcursoController::class, 'importStructure'])->name('concurso.import-structure');
        Route::post('/{concurso}/simulado', [ConcursoController::class, 'startPractice'])->name('concurso.simulado.start');
        Route::get('/{concurso}/simulado/{simulado}', [ConcursoController::class, 'practice'])->name('concurso.simulado.show');
        Route::post('/{concurso}/simulado/{simulado}/concluir', [ConcursoController::class, 'finishPractice'])->name('concurso.simulado.finish');
        Route::get('/{concurso}/materia/{materia}', [ConcursoController::class, 'subject'])->name('concurso.materia.show');
        Route::get('/{concurso}', [ConcursoController::class, 'show'])->name('concurso.show');
        Route::post('/{concurso}/importar-questoes', [ConcursoController::class, 'importQuestions'])->name('concurso.import-questions');
        Route::get('/', [ConcursoController::class, 'index'])->name('concurso.index');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
