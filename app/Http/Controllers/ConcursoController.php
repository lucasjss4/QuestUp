<?php

namespace App\Http\Controllers;

use App\Models\Alternativa;
use App\Models\Concurso;
use App\Models\ConcursoConteudo;
use App\Models\Conteudo;
use App\Models\Materia;
use App\Models\Questao;
use App\Models\Simulado;
use App\Models\SimuladoQuestao;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

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

    public function history()
    {
        $simulados = Simulado::query()
            ->whereNotNull('concluido_em')
            ->whereHas('concurso', fn ($query) => $query->where('user_id', Auth::id()))
            ->with('concurso:id,titulo')
            ->orderByDesc('data_realizacao')
            ->orderByDesc('id')
            ->get(['id', 'concurso_id', 'data_realizacao'])
            ->map(fn (Simulado $simulado) => [
                'id' => $simulado->id,
                'concurso_id' => $simulado->concurso_id,
                'concurso_titulo' => $simulado->concurso->titulo,
                'data_realizacao' => $simulado->data_realizacao->toDateString(),
            ]);

        return Inertia::render('historico', [
            'simulados' => $simulados,
        ]);
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
            'estrutura_json' => 'required|string|max:10485760',
        ]);

        $structure = $this->decodeJsonInput($validated['estrutura_json'], 'estrutura_json');

        if (! is_array($structure) || array_is_list($structure) || count($structure) !== 1 || ! array_key_exists('materias', $structure)) {
            throw ValidationException::withMessages([
                'estrutura_json' => 'O JSON deve ser um objeto contendo somente a propriedade "materias".',
            ]);
        }

        $materias = $structure['materias'] ?? null;

        if (! is_array($materias) || ! array_is_list($materias)) {
            throw ValidationException::withMessages([
                'estrutura_json' => 'A propriedade "materias" deve ser uma lista.',
            ]);
        }

        $contentCodes = [];

        foreach ($materias as $materia) {
            if (! is_array($materia) || ! isset($materia['conteudos']) || ! is_array($materia['conteudos'])) {
                continue;
            }

            if (! array_is_list($materia['conteudos'])) {
                throw ValidationException::withMessages([
                    'estrutura_json' => 'Os conteúdos de cada matéria devem estar em uma lista.',
                ]);
            }

            foreach ($materia['conteudos'] as $conteudo) {
                if (! is_array($conteudo) || ! isset($conteudo['codigo']) || ! is_string($conteudo['codigo'])) {
                    continue;
                }

                if (isset($contentCodes[$conteudo['codigo']])) {
                    throw ValidationException::withMessages([
                        'estrutura_json' => "O código de conteúdo \"{$conteudo['codigo']}\" aparece mais de uma vez no JSON.",
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
                'estrutura_json' => 'Confira a estrutura do JSON: matérias e conteúdos precisam ter código, nome e descrição.',
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
                            'estrutura_json' => "O código de conteúdo \"{$conteudoData['codigo']}\" já está associado a outra matéria.",
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
    public function show(int $concurso)
    {
        $concursoId = $concurso;
        $concurso = Concurso::query()
            ->where('user_id', Auth::id())
            ->with([
                'concursoConteudo.conteudo' => fn ($query) => $query
                    ->with('materia')
                    ->withCount([
                        'questao' => fn ($query) => $query->whereHas(
                            'conteudo.concursoConteudo',
                            fn ($query) => $query->where('concurso_id', $concursoId),
                        ),
                    ]),
            ])
            ->findOrFail($concurso);

        $materias = $concurso->concursoConteudo
            ->groupBy(fn (ConcursoConteudo $vinculo) => $vinculo->conteudo->materia->id)
            ->map(function ($vinculos) {
                $materia = $vinculos->first()->conteudo->materia;

                return [
                    'id' => $materia->id,
                    'nome' => $materia->Nome,
                    'descricao' => $materia->Descricao,
                    'conteudos_count' => $vinculos->count(),
                    'questoes_count' => $vinculos->sum(fn (ConcursoConteudo $vinculo) => $vinculo->conteudo->questao_count),
                    'conteudos' => $vinculos->map(fn (ConcursoConteudo $vinculo) => [
                        'codigo' => $vinculo->conteudo->Codigo,
                        'nome' => $vinculo->conteudo->Nome,
                    ])->values(),
                ];
            })
            ->values();

        return Inertia::render('concurso/page', [
            'concurso' => $concurso->only(['id', 'titulo', 'data_concurso']),
            'materias' => $materias,
            'questoesCount' => $materias->sum('questoes_count'),
        ]);
    }

    public function startPractice(Request $request, int $concurso)
    {
        $validated = $request->validate([
            'quantidades' => 'required|array|min:1',
            'quantidades.*' => 'required|integer|min:0',
        ]);

        $concurso = Concurso::query()
            ->where('user_id', Auth::id())
            ->with('concursoConteudo.conteudo')
            ->findOrFail($concurso);

        $materiaIds = $concurso->concursoConteudo
            ->map(fn (ConcursoConteudo $vinculo) => $vinculo->conteudo->materia_id)
            ->unique()
            ->values();
        $quantidades = collect($validated['quantidades'])
            ->mapWithKeys(fn ($quantidade, $materiaId) => [(int) $materiaId => (int) $quantidade]);

        if ($quantidades->keys()->diff($materiaIds)->isNotEmpty()) {
            throw ValidationException::withMessages([
                'quantidades' => 'Uma ou mais matérias selecionadas não pertencem a este concurso.',
            ]);
        }

        if ($quantidades->sum() < 1) {
            throw ValidationException::withMessages([
                'quantidades' => 'Selecione pelo menos uma questão para iniciar o simulado.',
            ]);
        }

        $simulado = DB::transaction(function () use ($concurso, $quantidades) {
            $simulado = Simulado::create([
                'data_realizacao' => now()->toDateString(),
                'concurso_id' => $concurso->id,
            ]);

            foreach ($quantidades->filter(fn (int $quantidade) => $quantidade > 0) as $materiaId => $quantidade) {
                $questoes = Questao::query()
                    ->whereHas('conteudo.concursoConteudo', fn ($query) => $query->where('concurso_id', $concurso->id))
                    ->whereHas('conteudo', fn ($query) => $query->where('materia_id', $materiaId))
                    ->inRandomOrder()
                    ->limit($quantidade)
                    ->get(['id']);

                if ($questoes->count() !== $quantidade) {
                    throw ValidationException::withMessages([
                        'quantidades' => "A matéria selecionada não possui {$quantidade} questões disponíveis.",
                    ]);
                }

                foreach ($questoes as $questao) {
                    SimuladoQuestao::create([
                        'opcao_marcada' => null,
                        'acerto' => null,
                        'questao_id' => $questao->id,
                        'simulado_id' => $simulado->id,
                    ]);
                }
            }

            return $simulado;
        });

        return redirect()->route('concurso.simulado.show', [$concurso->id, $simulado->id]);
    }

    public function practice(Request $request, int $concurso, int $simulado)
    {
        $concurso = Concurso::query()
            ->where('user_id', Auth::id())
            ->findOrFail($concurso);
        $simulado = Simulado::query()
            ->where('concurso_id', $concurso->id)
            ->findOrFail($simulado);
        $respostas = SimuladoQuestao::query()
            ->where('simulado_id', $simulado->id)
            ->with(['questao.conteudo.materia', 'questao.alternativa'])
            ->orderBy('id')
            ->get();
        $concluido = $simulado->concluido_em !== null;

        return Inertia::render('concurso/simulado', [
            'concurso' => $concurso->only(['id', 'titulo']),
            'voltarParaHistorico' => $request->query('origem') === 'historico',
            'simulado' => [
                'id' => $simulado->id,
                'concluido' => $concluido,
            ],
            'questoes' => $respostas->map(fn (SimuladoQuestao $resposta) => [
                'id' => $resposta->questao->id,
                'enunciado' => $resposta->questao->Enunciado,
                'origem' => $resposta->questao->origem,
                'dificuldade' => $resposta->questao->Dificuldade,
                'materia' => $resposta->questao->conteudo->materia->Nome,
                'resposta' => $resposta->opcao_marcada,
                'alternativas' => $resposta->questao->alternativa
                    ->sortBy('opcao')
                    ->values()
                    ->map(fn (Alternativa $alternativa) => [
                        'opcao' => $alternativa->opcao,
                        'texto' => $alternativa->texto,
                    ]),
            ])->values(),
            'resultados' => $concluido
                ? $respostas->map(fn (SimuladoQuestao $resposta) => [
                    'questao_id' => $resposta->questao->id,
                    'enunciado' => $resposta->questao->Enunciado,
                    'materia' => $resposta->questao->conteudo->materia->Nome,
                    'conteudo' => $resposta->questao->conteudo->Nome,
                    'opcao_marcada' => $resposta->opcao_marcada,
                    'resposta_marcada' => $resposta->questao->alternativa
                        ->firstWhere('opcao', $resposta->opcao_marcada)?->texto,
                    'resposta_correta' => $resposta->questao->alternativa
                        ->firstWhere('correta', true)?->texto,
                    'acerto' => $resposta->acerto,
                ])->values()
                : [],
        ]);
    }

    public function finishPractice(Request $request, int $concurso, int $simulado)
    {
        $validated = $request->validate([
            'respostas' => 'required|array',
            'respostas.*' => 'required|array:questao_id,opcao_marcada',
            'respostas.*.questao_id' => 'required|integer|distinct:strict',
            'respostas.*.opcao_marcada' => 'present|nullable|string|size:1|in:A,B,C,D,E',
        ]);

        $concurso = Concurso::query()
            ->where('user_id', Auth::id())
            ->findOrFail($concurso);
        $simulado = Simulado::query()
            ->where('concurso_id', $concurso->id)
            ->findOrFail($simulado);

        if ($simulado->concluido_em !== null) {
            throw ValidationException::withMessages([
                'respostas' => 'Este simulado já foi concluído e não pode ser alterado.',
            ]);
        }

        $respostasSimulado = SimuladoQuestao::query()
            ->where('simulado_id', $simulado->id)
            ->get()
            ->keyBy('questao_id');
        $respostasEnviadas = collect($validated['respostas'])->keyBy('questao_id');

        if (
            $respostasEnviadas->count() !== $respostasSimulado->count()
            || $respostasEnviadas->keys()->diff($respostasSimulado->keys())->isNotEmpty()
        ) {
            throw ValidationException::withMessages([
                'respostas' => 'As respostas enviadas não correspondem às questões deste simulado.',
            ]);
        }

        $alternativas = Alternativa::query()
            ->whereIn('questao_id', $respostasSimulado->keys())
            ->get()
            ->groupBy('questao_id');

        DB::transaction(function () use ($respostasSimulado, $respostasEnviadas, $alternativas, $simulado) {
            foreach ($respostasSimulado as $questaoId => $registro) {
                $opcaoMarcada = $respostasEnviadas[$questaoId]['opcao_marcada'];

                if ($opcaoMarcada === null) {
                    $registro->update([
                        'opcao_marcada' => null,
                        'acerto' => null,
                    ]);

                    continue;
                }

                $alternativaMarcada = $alternativas->get($questaoId)?->firstWhere('opcao', $opcaoMarcada);

                if (! $alternativaMarcada) {
                    throw ValidationException::withMessages([
                        'respostas' => "A alternativa {$opcaoMarcada} não pertence à questão {$questaoId}.",
                    ]);
                }

                $registro->update([
                    'opcao_marcada' => $opcaoMarcada,
                    'acerto' => (bool) $alternativaMarcada->correta,
                ]);
            }

            $simulado->update(['concluido_em' => now()]);
        });

        return redirect()->route('concurso.simulado.show', [$concurso->id, $simulado->id]);
    }

    public function importQuestions(Request $request, int $concurso)
    {
        $validated = $request->validate([
            'questoes_json' => 'required|string|max:10485760',
        ]);

        $structure = $this->decodeJsonInput($validated['questoes_json'], 'questoes_json');

        if (! is_array($structure) || array_is_list($structure) || count($structure) !== 1 || ! array_key_exists('questoes', $structure)) {
            throw ValidationException::withMessages([
                'questoes_json' => 'O JSON deve ser um objeto contendo somente a propriedade "questoes".',
            ]);
        }

        $structureValidator = Validator::make($structure, [
            'questoes' => 'required|array|min:1',
            'questoes.*' => 'required|array:conteudo_codigo,enunciado,origem,dificuldade,alternativas',
            'questoes.*.conteudo_codigo' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
            'questoes.*.enunciado' => 'required|string',
            'questoes.*.origem' => 'required|string|max:255',
            'questoes.*.dificuldade' => 'required|string|max:255',
            'questoes.*.alternativas' => 'required|array|min:2|max:5',
            'questoes.*.alternativas.*' => 'required|array:opcao,texto,correta',
            'questoes.*.alternativas.*.opcao' => 'required|string|size:1|in:A,B,C,D,E',
            'questoes.*.alternativas.*.texto' => 'required|string|max:255',
            'questoes.*.alternativas.*.correta' => 'required|boolean',
        ], [
            'questoes.*.conteudo_codigo.regex' => 'Use o código do conteúdo em minúsculas, sem espaços ou acentos, separando palavras por hífen.',
        ]);

        if ($structureValidator->fails()) {
            throw ValidationException::withMessages([
                'questoes_json' => 'Confira a estrutura do JSON: cada questão precisa ter enunciado, conteúdo, origem, dificuldade e alternativas válidas.',
            ]);
        }

        foreach ($structure['questoes'] as $questao) {
            $optionCodes = array_column($questao['alternativas'], 'opcao');
            $correctAnswers = count(array_filter($questao['alternativas'], fn (array $alternativa) => (bool) $alternativa['correta']));

            if ($correctAnswers !== 1 || count($optionCodes) !== count(array_unique($optionCodes))) {
                throw ValidationException::withMessages([
                    'questoes_json' => 'Cada questão deve ter alternativas identificadas de forma única e exatamente uma resposta correta.',
                ]);
            }
        }

        $concurso = Concurso::query()
            ->where('user_id', Auth::id())
            ->with('concursoConteudo.conteudo')
            ->findOrFail($concurso);

        $conteudos = $concurso->concursoConteudo
            ->mapWithKeys(fn (ConcursoConteudo $vinculo) => [$vinculo->conteudo->Codigo => $vinculo->conteudo]);

        foreach ($structure['questoes'] as $questao) {
            if (! $conteudos->has($questao['conteudo_codigo'])) {
                throw ValidationException::withMessages([
                    'questoes_json' => "O conteúdo \"{$questao['conteudo_codigo']}\" não pertence a este concurso.",
                ]);
            }
        }

        DB::transaction(function () use ($structure, $conteudos) {
            foreach ($structure['questoes'] as $questaoData) {
                $questao = Questao::create([
                    'Enunciado' => $questaoData['enunciado'],
                    'origem' => $questaoData['origem'],
                    'Dificuldade' => $questaoData['dificuldade'],
                    'conteudo_id' => $conteudos[$questaoData['conteudo_codigo']]->id,
                ]);

                foreach ($questaoData['alternativas'] as $alternativaData) {
                    Alternativa::create([
                        'opcao' => $alternativaData['opcao'],
                        'texto' => $alternativaData['texto'],
                        'correta' => $alternativaData['correta'],
                        'questao_id' => $questao->id,
                    ]);
                }
            }
        });

        return redirect()
            ->route('concurso.show', $concurso)
            ->with('success', 'Questões importadas com sucesso!');
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

    private function decodeJsonInput(string $text, string $field): mixed
    {
        $text = trim($text);
        $data = json_decode($text, true);

        if (json_last_error() === JSON_ERROR_NONE) {
            return $data;
        }

        $normalizedText = preg_replace_callback(
            '~\\\\{2,}"~',
            static fn () => '\\'.'"',
            $text,
        );

        if ($normalizedText !== null && $normalizedText !== $text) {
            $data = json_decode($normalizedText, true);

            if (json_last_error() === JSON_ERROR_NONE) {
                return $data;
            }
        }

        throw ValidationException::withMessages([
            $field => 'JSON inválido: '.json_last_error_msg(),
        ]);
    }
}
