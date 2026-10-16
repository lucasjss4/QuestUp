import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Check, CircleHelp, X } from 'lucide-react';
import { useState } from 'react';

type Alternativa = {
    opcao: string;
    texto: string;
};

type Questao = {
    id: number;
    enunciado: string;
    origem: string;
    dificuldade: string;
    materia: string;
    resposta: string | null;
    alternativas: Alternativa[];
};

type Resultado = {
    questao_id: number;
    enunciado: string;
    materia: string;
    conteudo: string;
    opcao_marcada: string | null;
    resposta_marcada: string | undefined;
    resposta_correta: string | undefined;
    acerto: boolean | null;
};

type SimuladoProps = {
    concurso: {
        id: number;
        titulo: string;
    };
    simulado: {
        id: number;
        concluido: boolean;
    };
    questoes: Questao[];
    resultados: Resultado[];
};

export default function SimuladoPage({ concurso, simulado, questoes, resultados }: SimuladoProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(questoes[0]?.resposta ?? null);
    const [answers, setAnswers] = useState<Record<number, string | null>>(() =>
        Object.fromEntries(questoes.map((questao) => [questao.id, questao.resposta])),
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const isReadyToFinish = currentIndex >= questoes.length;
    const questao = questoes[currentIndex];
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Início', href: route('homePage') },
        { title: concurso.titulo, href: route('concurso.show', concurso.id) },
        { title: 'Simulado', href: route('concurso.simulado.show', { concurso: concurso.id, simulado: simulado.id }) },
    ];
    const progress = questoes.length > 0 ? (Math.min(currentIndex + 1, questoes.length) / questoes.length) * 100 : 0;
    const correctCount = resultados.filter((resultado) => resultado.acerto === true).length;
    const answeredCount = resultados.filter((resultado) => resultado.opcao_marcada !== null).length;
    const materiaStats = resultados.reduce<Record<string, { total: number; correct: number }>>((stats, resultado) => {
        stats[resultado.materia] ??= { total: 0, correct: 0 };
        stats[resultado.materia].total += 1;
        if (resultado.acerto === true) {
            stats[resultado.materia].correct += 1;
        }
        return stats;
    }, {});
    const contentStats = resultados.reduce<Record<string, { materia: string; conteudo: string; total: number; correct: number }>>(
        (stats, resultado) => {
            const key = `${resultado.materia}:${resultado.conteudo}`;
            stats[key] ??= { materia: resultado.materia, conteudo: resultado.conteudo, total: 0, correct: 0 };
            stats[key].total += 1;
            if (resultado.acerto === true) {
                stats[key].correct += 1;
            }
            return stats;
        },
        {},
    );

    const nextQuestion = () => {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setSelectedOption(questoes[nextIndex]?.resposta ?? null);
    };

    const submitAnswer = () => {
        if (!questao || !selectedOption || isSubmitting) {
            return;
        }

        setAnswers((current) => ({ ...current, [questao.id]: selectedOption }));
        nextQuestion();
    };

    const skipQuestion = () => {
        if (!questao) {
            return;
        }

        setAnswers((current) => ({ ...current, [questao.id]: null }));
        nextQuestion();
    };

    const finishPractice = () => {
        setSubmitError('');
        setIsSubmitting(true);

        router.post(
            route('concurso.simulado.finish', { concurso: concurso.id, simulado: simulado.id }),
            {
                respostas: questoes.map((item) => ({
                    questao_id: item.id,
                    opcao_marcada: answers[item.id] ?? null,
                })),
            },
            {
                onError: (errors) => {
                    setSubmitError(errors.respostas ?? 'Não foi possível salvar o resultado do simulado. Tente novamente.');
                },
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Simulado - ${concurso.titulo}`} />
            <div className="flex flex-1 flex-col p-4 md:p-6">
                <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('concurso.show', concurso.id)}>
                                <ArrowLeft />
                                Voltar ao concurso
                            </Link>
                        </Button>
                        {!simulado.concluido && questoes.length > 0 && (
                            <div className="w-full max-w-xs space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Progresso</span>
                                    <span className="font-medium">
                                        Questão {Math.min(currentIndex + 1, questoes.length)} de {questoes.length}
                                    </span>
                                </div>
                                <div
                                    role="progressbar"
                                    aria-valuemin={0}
                                    aria-valuemax={questoes.length}
                                    aria-valuenow={Math.min(currentIndex + 1, questoes.length)}
                                    aria-label="Progresso do simulado"
                                    className="bg-muted h-2 overflow-hidden rounded-full"
                                >
                                    <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {simulado.concluido ? (
                        <div className="space-y-5">
                            <Card>
                                <CardContent className="flex flex-col items-center py-10 text-center">
                                    <div className="bg-primary/10 text-primary mb-4 flex size-14 items-center justify-center rounded-full">
                                        <Check className="size-7" />
                                    </div>
                                    <h1 className="text-2xl font-semibold">Simulado concluído!</h1>
                                    <p className="text-muted-foreground mt-2">
                                        Você acertou {correctCount} de {answeredCount} questões respondidas.
                                    </p>
                                    <Button className="mt-6" asChild>
                                        <Link href={route('concurso.show', concurso.id)}>Fazer novo simulado</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                            <section aria-label="Estatísticas do simulado" className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardContent className="p-5">
                                        <h2 className="mb-4 text-lg font-semibold">Acertos por matéria</h2>
                                        <div className="space-y-4">
                                            {Object.entries(materiaStats).map(([materia, stats]) => {
                                                const percentage = Math.round((stats.correct / stats.total) * 100);

                                                return (
                                                    <div key={materia} className="space-y-2">
                                                        <div className="flex items-center justify-between gap-3 text-sm">
                                                            <span className="truncate font-medium">{materia}</span>
                                                            <span className="text-muted-foreground shrink-0">
                                                                {stats.correct} de {stats.total} · {percentage}%
                                                            </span>
                                                        </div>
                                                        <div
                                                            role="progressbar"
                                                            aria-label={`Acertos em ${materia}`}
                                                            aria-valuemin={0}
                                                            aria-valuemax={100}
                                                            aria-valuenow={percentage}
                                                            className="bg-muted h-2 overflow-hidden rounded-full"
                                                        >
                                                            <div className="flex h-full w-full">
                                                                <span
                                                                    className="bg-primary h-full transition-all"
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                                <span
                                                                    className="bg-muted-foreground/40 h-full transition-all"
                                                                    style={{ width: `${100 - percentage}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-5">
                                        <h2 className="mb-4 text-lg font-semibold">Acertos por conteúdo</h2>
                                        <div
                                            role="region"
                                            aria-label="Estatísticas por conteúdo"
                                            tabIndex={0}
                                            className="max-h-64 space-y-4 overflow-y-auto pr-2"
                                        >
                                            {Object.entries(contentStats).map(([key, stats]) => {
                                                const percentage = Math.round((stats.correct / stats.total) * 100);

                                                return (
                                                    <div key={key} className="space-y-2">
                                                        <div className="flex items-center justify-between gap-3 text-sm">
                                                            <div className="min-w-0">
                                                                <p className="truncate font-medium">{stats.conteudo}</p>
                                                                <p className="text-muted-foreground truncate text-xs">{stats.materia}</p>
                                                            </div>
                                                            <span className="text-muted-foreground shrink-0">
                                                                {stats.correct} de {stats.total} · {percentage}%
                                                            </span>
                                                        </div>
                                                        <div
                                                            role="progressbar"
                                                            aria-label={`Acertos em ${stats.conteudo}`}
                                                            aria-valuemin={0}
                                                            aria-valuemax={100}
                                                            aria-valuenow={percentage}
                                                            className="bg-muted h-2 overflow-hidden rounded-full"
                                                        >
                                                            <div className="flex h-full w-full">
                                                                <span
                                                                    className="bg-primary h-full transition-all"
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                                <span
                                                                    className="bg-muted-foreground/40 h-full transition-all"
                                                                    style={{ width: `${100 - percentage}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </section>
                            <section className="space-y-3">
                                <h2 className="text-lg font-semibold">Respostas</h2>
                                <div
                                    role="region"
                                    aria-label="Respostas do simulado"
                                    tabIndex={0}
                                    className="max-h-[43rem] min-h-48 space-y-3 overflow-y-auto pr-2"
                                >
                                    {resultados.map((resultado, index) => (
                                        <Card key={resultado.questao_id}>
                                            <CardContent className="flex min-h-32 items-start gap-3 p-4">
                                                <span
                                                    className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
                                                        resultado.acerto === true
                                                            ? 'bg-emerald-500/15 text-emerald-700'
                                                            : resultado.opcao_marcada === null
                                                              ? 'bg-muted text-muted-foreground'
                                                              : 'bg-destructive/10 text-destructive'
                                                    }`}
                                                >
                                                    {resultado.acerto === true ? (
                                                        <Check className="size-4" />
                                                    ) : resultado.opcao_marcada === null ? (
                                                        <CircleHelp className="size-4" />
                                                    ) : (
                                                        <X className="size-4" />
                                                    )}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-muted-foreground text-xs">
                                                        {resultado.materia} · Questão {index + 1}
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium">{resultado.enunciado}</p>
                                                    <div className="text-muted-foreground mt-2 space-y-1 text-sm">
                                                        {resultado.opcao_marcada === null ? (
                                                            <>
                                                                <p>Não respondida</p>
                                                                <p>Resposta correta: {resultado.resposta_correta ?? '—'}</p>
                                                            </>
                                                        ) : resultado.acerto ? (
                                                            <p>Resposta correta: {resultado.resposta_marcada ?? '—'}</p>
                                                        ) : (
                                                            <>
                                                                <p>Sua resposta: {resultado.resposta_marcada ?? '—'}</p>
                                                                <p>Resposta correta: {resultado.resposta_correta ?? '—'}</p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        </div>
                    ) : questoes.length === 0 ? (
                        <Card className="my-auto">
                            <CardContent className="flex flex-col items-center py-12 text-center">
                                <CircleHelp className="text-muted-foreground mb-4 size-10" />
                                <h1 className="text-xl font-semibold">Ainda não há questões para este simulado</h1>
                                <p className="text-muted-foreground mt-2 max-w-md text-sm">
                                    Volte ao concurso e configure um simulado com as questões disponíveis.
                                </p>
                                <Button className="mt-6" asChild>
                                    <Link href={route('concurso.show', concurso.id)}>Voltar ao concurso</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : isReadyToFinish ? (
                        <Card className="my-auto">
                            <CardContent className="flex flex-col items-center py-12 text-center">
                                <Check className="text-primary mb-4 size-10" />
                                <h1 className="text-xl font-semibold">Você chegou ao final do simulado</h1>
                                <p className="text-muted-foreground mt-2 text-sm">Conclua para salvar suas respostas e conferir o resultado.</p>
                                {submitError && (
                                    <p role="alert" className="text-destructive mt-4 text-sm">
                                        {submitError}
                                    </p>
                                )}
                                <Button className="mt-6" disabled={isSubmitting} onClick={() => finishPractice()}>
                                    {isSubmitting ? 'Salvando resultado...' : 'Concluir simulado'}
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <main className="flex-1">
                                <Card className="mb-4">
                                    <CardContent className="p-5 md:p-6">
                                        <p className="text-muted-foreground mb-2 text-sm">
                                            {questao.materia} · Questão {currentIndex + 1}
                                        </p>
                                        <h1 className="text-lg leading-relaxed font-semibold md:text-xl">{questao.enunciado}</h1>
                                        <p className="text-muted-foreground mt-3 text-xs">
                                            {questao.origem} · Dificuldade {questao.dificuldade}
                                        </p>
                                    </CardContent>
                                </Card>

                                <fieldset disabled={isSubmitting} className="space-y-3">
                                    <legend className="sr-only">Selecione uma alternativa</legend>
                                    {questao.alternativas.map((alternativa) => {
                                        const isSelected = selectedOption === alternativa.opcao;

                                        return (
                                            <button
                                                key={alternativa.opcao}
                                                type="button"
                                                onClick={() => setSelectedOption(alternativa.opcao)}
                                                aria-pressed={isSelected}
                                                className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                                                    isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-accent/50'
                                                }`}
                                            >
                                                <span
                                                    className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-medium ${
                                                        isSelected ? 'border-primary text-primary' : 'border-border'
                                                    }`}
                                                >
                                                    {alternativa.opcao}
                                                </span>
                                                <span className="pt-0.5 text-sm leading-relaxed">{alternativa.texto}</span>
                                            </button>
                                        );
                                    })}
                                </fieldset>
                            </main>

                            <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                                <Button variant="outline" onClick={skipQuestion} disabled={isSubmitting}>
                                    Pular questão
                                </Button>
                                <div className="flex items-center gap-3">
                                    {submitError && (
                                        <p role="alert" className="text-destructive text-sm">
                                            {submitError}
                                        </p>
                                    )}
                                    <Button onClick={submitAnswer} disabled={!selectedOption || isSubmitting}>
                                        Responder
                                    </Button>
                                </div>
                            </footer>
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
