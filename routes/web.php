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
    Route::get('/adicionar-concurso', function () {
        return Inertia::render('concurso/concursoform');
    })->name('addConcurso');
    Route::get('/home-concurso', function () {
        return Inertia::render('concurso/page');
    })->name('addConcurso');

    Route::prefix('concurso')->group(function () {
        Route::post('/', [ConcursoController::class, 'create'])->name('concurso.create');
        Route::post('/importar-estrutura', [ConcursoController::class, 'importStructure'])->name('concurso.import-structure');
        Route::get('/', [ConcursoController::class, 'index'])->name('concurso.index');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
