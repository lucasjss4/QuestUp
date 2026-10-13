<?php

namespace App\Http\Controllers;

use App\Models\Concurso;
use App\Models\ConcursoConteudo;
use App\Models\Conteudo;
use App\Models\Materia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use JsonException;

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
            'data_concurso' => 'required|date',
        ]);

        Concurso::create([
            'titulo' => $request->input('titulo'),
            'data_concurso' => $request->input('data_concurso'),
            'user_id' => Auth::id(),
        ]);

        return redirect()->route('homePage')->with('success', 'Concurso criado com sucesso!');
    }

    public function importStructure(Request $request)
    {
        $validated = $request->validate([
            'titulo' => 'required|string|max:255',
            'data_concurso' => 'required|date',
            'arquivo_json' => 'required|file|max:10240',
        ]);

        $file = $request->file('arquivo_json');

        if (strtolower($file->getClientOriginalExtension()) !== 'json') {
            throw ValidationException::withMessages([
                'arquivo_json' => 'Selecione um arquivo com a extensão .json.',
            ]);
        }

        $json = file_get_contents($file->getRealPath());

        if ($json === false) {
            throw ValidationException::withMessages([
                'arquivo_json' => 'Não foi possível ler o arquivo enviado.',
            ]);
        }

        try {
            $structure = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw ValidationException::withMessages([
                'arquivo_json' => 'O arquivo não contém um JSON válido.',
            ]);
        }

        if (! is_array($structure) || array_is_list($structure) || count($structure) !== 1 || ! array_key_exists('materias', $structure)) {
            throw ValidationException::withMessages([
                'arquivo_json' => 'O JSON deve ser um objeto contendo somente a propriedade "materias".',
            ]);
        }

        $materias = $structure['materias'] ?? null;

        if (! is_array($materias) || ! array_is_list($materias)) {
            throw ValidationException::withMessages([
                'arquivo_json' => 'A propriedade "materias" deve ser uma lista.',
            ]);
        }

        $contentCodes = [];

        foreach ($materias as $materia) {
            if (! is_array($materia) || ! isset($materia['conteudos']) || ! is_array($materia['conteudos'])) {
                continue;
            }

            if (! array_is_list($materia['conteudos'])) {
                throw ValidationException::withMessages([
                    'arquivo_json' => 'Os conteúdos de cada matéria devem estar em uma lista.',
                ]);
            }

            foreach ($materia['conteudos'] as $conteudo) {
                if (! is_array($conteudo) || ! isset($conteudo['codigo']) || ! is_string($conteudo['codigo'])) {
                    continue;
                }

                if (isset($contentCodes[$conteudo['codigo']])) {
                    throw ValidationException::withMessages([
                        'arquivo_json' => "O código de conteúdo \"{$conteudo['codigo']}\" aparece mais de uma vez no JSON.",
                    ]);
                }

                $contentCodes[$conteudo['codigo']] = true;
            }
        }

        $structureValidator = Validator::make($structure, [
            'materias' => 'required|array|min:1',
            'materias.*' => 'required|array:codigo,nome,descricao,conteudos',
            'materias.*.codigo' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'distinct:strict'],
            'materias.*.nome' => 'required|string|max:255',
            'materias.*.descricao' => 'required|string|max:255',
            'materias.*.conteudos' => 'required|array|min:1',
            'materias.*.conteudos.*' => 'required|array:codigo,nome,descricao',
            'materias.*.conteudos.*.codigo' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'distinct:strict'],
            'materias.*.conteudos.*.nome' => 'required|string|max:255',
            'materias.*.conteudos.*.descricao' => 'required|string|max:255',
        ], [
            'materias.*.codigo.regex' => 'Use códigos em minúsculas, sem espaços ou acentos, separando palavras-chave por hífen.',
            'materias.*.conteudos.*.codigo.regex' => 'Use códigos em minúsculas, sem espaços ou acentos, separando palavras-chave por hífen.',
        ]);

        if ($structureValidator->fails()) {
            throw ValidationException::withMessages([
                'arquivo_json' => 'Confira a estrutura do JSON: matérias e conteúdos precisam ter código, nome e descrição.',
            ]);
        }

        $concurso = DB::transaction(function () use ($validated, $structure) {
            $concurso = Concurso::create([
                'titulo' => $validated['titulo'],
                'data_concurso' => $validated['data_concurso'],
                'user_id' => Auth::id(),
            ]);

            foreach ($structure['materias'] as $materiaData) {
                $materia = Materia::firstOrCreate(
                    ['Codigo' => $materiaData['codigo']],
                    ['Nome' => $materiaData['nome'], 'Descricao' => $materiaData['descricao']],
                );

                foreach ($materiaData['conteudos'] as $conteudoData) {
                    $conteudo = Conteudo::firstOrCreate(
                        ['Codigo' => $conteudoData['codigo']],
                        [
                            'Nome' => $conteudoData['nome'],
                            'Descricao' => $conteudoData['descricao'],
                            'materia_id' => $materia->id,
                        ],
                    );

                    if ($conteudo->materia_id !== $materia->id) {
                        throw ValidationException::withMessages([
                            'arquivo_json' => "O código de conteúdo \"{$conteudoData['codigo']}\" já está associado a outra matéria.",
                        ]);
                    }

                    ConcursoConteudo::firstOrCreate([
                        'concurso_id' => $concurso->id,
                        'conteudo_id' => $conteudo->id,
                    ]);
                }
            }

            return $concurso;
        });

        return redirect()->route('homePage')->with('success', 'Concurso e estrutura importados com sucesso!');
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
