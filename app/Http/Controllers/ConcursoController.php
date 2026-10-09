<?php

namespace App\Http\Controllers;

use App\Models\Concurso;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ConcursoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $concursos = Concurso::where('user_id', Auth::id())->get();

        return view('concurso.index', compact('concursos'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        $request->validate([
            'titulo' => 'required|string|max:255',
            'data_concurso' => 'nullable|date',
        ]);
    
        Concurso::create([
            'titulo' => $request->input('titulo'),
            'data_concurso' => $request->input('data_concurso'),
            'user_id' => Auth::id(),
        ]);
        
        return redirect()->route('homePage')->with('success', 'Concurso criado com sucesso!');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
