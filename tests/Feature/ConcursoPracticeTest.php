<?php

namespace Tests\Feature;

use App\Models\Alternativa;
use App\Models\Concurso;
use App\Models\ConcursoConteudo;
use App\Models\Conteudo;
use App\Models\Materia;
use App\Models\Questao;
use App\Models\Simulado;
use App\Models\SimuladoQuestao;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConcursoPracticeTest extends TestCase
{
    use RefreshDatabase;

    public function test_practice_uses_requested_random_question_count_and_stores_completion_results(): void
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'practice@example.test',
            'password' => 'password',
        ]);
        $concurso = Concurso::create([
            'titulo' => 'Concurso de teste',
            'data_concurso' => '2026-12-01',
            'user_id' => $user->id,
        ]);
        $materia = Materia::create([
            'Nome' => 'Português',
            'Descricao' => 'Língua portuguesa',
            'Codigo' => 'portugues',
        ]);
        $conteudo = Conteudo::create([
            'Nome' => 'Gramática',
            'Descricao' => 'Gramática',
            'Codigo' => 'gramatica',
            'materia_id' => $materia->id,
        ]);
        ConcursoConteudo::create([
            'concurso_id' => $concurso->id,
            'conteudo_id' => $conteudo->id,
        ]);

        $questoes = collect(range(1, 3))->map(function (int $number) use ($conteudo) {
            $questao = Questao::create([
                'Enunciado' => "Questão {$number}",
                'origem' => 'Inédita',
                'Dificuldade' => 'Fácil',
                'conteudo_id' => $conteudo->id,
            ]);

            Alternativa::create([
                'opcao' => 'A',
                'texto' => 'Correta',
                'correta' => true,
                'questao_id' => $questao->id,
            ]);
            Alternativa::create([
                'opcao' => 'B',
                'texto' => 'Incorreta',
                'correta' => false,
                'questao_id' => $questao->id,
            ]);

            return $questao;
        });

        $this->actingAs($user)
            ->get(route('concurso.show', $concurso->id))
            ->assertInertia(fn ($page) => $page
                ->component('concurso/page')
                ->where('materias.0.questoes_count', 3)
                ->where('materias.0.questoes_respondidas_count', 0)
                ->where('materias.0.respondidas_count', 0)
                ->where('materias.0.acertos_count', 0)
                ->where('materias.0.desempenho_percentual', null));

        $this->post(route('concurso.simulado.start', $concurso->id), [
            'quantidades' => [$materia->id => 3],
        ])
            ->assertRedirect();

        $simulado = Simulado::query()->latest('id')->firstOrFail();
        $this->assertSame(3, SimuladoQuestao::query()->where('simulado_id', $simulado->id)->count());

        $selectedQuestions = SimuladoQuestao::query()->where('simulado_id', $simulado->id)->orderBy('id')->get();
        $this->assertCount(3, $selectedQuestions);
        $this->assertContains($selectedQuestions[0]->questao_id, $questoes->pluck('id'));
        $this->assertContains($selectedQuestions[1]->questao_id, $questoes->pluck('id'));

        $this->post(route('concurso.simulado.finish', [$concurso->id, $simulado->id]), [
            'respostas' => [
                ['questao_id' => $selectedQuestions[0]->questao_id, 'opcao_marcada' => 'A'],
                ['questao_id' => $selectedQuestions[1]->questao_id, 'opcao_marcada' => 'B'],
                ['questao_id' => $selectedQuestions[2]->questao_id, 'opcao_marcada' => null],
            ],
        ])->assertRedirect(route('concurso.simulado.show', [$concurso->id, $simulado->id]));

        $this->assertNotNull($simulado->fresh()->concluido_em);
        $this->assertDatabaseHas('simulado_questaos', [
            'simulado_id' => $simulado->id,
            'questao_id' => $selectedQuestions[0]->questao_id,
            'opcao_marcada' => 'A',
            'acerto' => true,
        ]);
        $this->assertDatabaseHas('simulado_questaos', [
            'simulado_id' => $simulado->id,
            'questao_id' => $selectedQuestions[1]->questao_id,
            'opcao_marcada' => 'B',
            'acerto' => false,
        ]);
        $this->assertDatabaseHas('simulado_questaos', [
            'simulado_id' => $simulado->id,
            'questao_id' => $selectedQuestions[2]->questao_id,
            'opcao_marcada' => null,
            'acerto' => null,
        ]);

        $this->get(route('concurso.show', $concurso->id))
            ->assertInertia(fn ($page) => $page
                ->component('concurso/page')
                ->where('materias.0.questoes_respondidas_count', 2)
                ->where('materias.0.respondidas_count', 2)
                ->where('materias.0.acertos_count', 1)
                ->where('materias.0.desempenho_percentual', 50));

        $this->get(route('concurso.materia.show', [$concurso->id, $materia->id]))
            ->assertInertia(fn ($page) => $page
                ->component('concurso/materia')
                ->where('materia.nome', 'Português')
                ->where('conteudos.0.nome', 'Gramática')
                ->where('conteudos.0.questoes_count', 3)
                ->where('conteudos.0.questoes_respondidas_count', 2)
                ->where('conteudos.0.acertos_count', 1)
                ->where('conteudos.0.erros_count', 1)
                ->where('conteudos.0.desempenho_percentual', 50)
                ->where('conteudos.0.ultima_resposta_em', now()->toDateString()));

        $this->get(route('concurso.simulado.show', [$concurso->id, $simulado->id]))
            ->assertInertia(fn ($page) => $page
                ->component('concurso/simulado')
                ->where('simulado.concluido', true)
                ->has('resultados', 3)
                ->where('resultados.0.conteudo', 'Gramática')
                ->where('resultados.0.resposta_marcada', 'Correta')
                ->where('resultados.0.resposta_correta', 'Correta')
                ->where('resultados.1.resposta_marcada', 'Incorreta')
                ->where('resultados.1.resposta_correta', 'Correta'));
    }

    public function test_practice_rejects_more_questions_than_are_available(): void
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'practice-validation@example.test',
            'password' => 'password',
        ]);
        $concurso = Concurso::create([
            'titulo' => 'Concurso de teste',
            'data_concurso' => '2026-12-01',
            'user_id' => $user->id,
        ]);
        $materia = Materia::create([
            'Nome' => 'Português',
            'Descricao' => 'Língua portuguesa',
            'Codigo' => 'portugues',
        ]);
        $conteudo = Conteudo::create([
            'Nome' => 'Gramática',
            'Descricao' => 'Gramática',
            'Codigo' => 'gramatica',
            'materia_id' => $materia->id,
        ]);
        ConcursoConteudo::create([
            'concurso_id' => $concurso->id,
            'conteudo_id' => $conteudo->id,
        ]);

        $this->actingAs($user)
            ->from(route('concurso.show', $concurso->id))
            ->post(route('concurso.simulado.start', $concurso->id), [
                'quantidades' => [$materia->id => 1],
            ])
            ->assertSessionHasErrors('quantidades');

        $this->assertDatabaseCount('simulados', 0);
    }
}
