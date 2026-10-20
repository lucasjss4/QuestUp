import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Check, CircleHelp, X } from 'lucide-react';

type Concurso = {
    id: number;
    titulo: string;
};

type Materia = {
    id: number;
    nome: string;
    descricao: string;
};

type Conteudo = {
    id: number;
    nome: string;
    descricao: string;
    questoes_count: number;
    questoes_respondidas_count: number;
    respondidas_count: number;
    acertos_count: number;
    erros_count: number;
    desempenho_percentual: number | null;
    ultima_resposta_em: string | null;
};

type MateriaPageProps = {
    concurso: Concurso;
    materia: Materia;
    conteudos: Conteudo[];
};

const formatDate = (date: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${date.slice(0, 10)}T00:00:00Z`));

export default function MateriaPage({ concurso, materia, conteudos }: MateriaPageProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Início', href: route('homePage') },
        { title: concurso.titulo, href: route('concurso.show', concurso.id) },
        { title: materia.nome, href: route('concurso.materia.show', { concurso: concurso.id, materia: materia.id }) },
    ];
    const questoesRespondidas = conteudos.reduce((total, conteudo) => total + conteudo.questoes_respondidas_count, 0);
    const respostasContabilizadas = conteudos.reduce((total, conteudo) => total + conteudo.respondidas_count, 0);
    const acertos = conteudos.reduce((total, conteudo) => total + conteudo.acertos_count, 0);
    const erros = conteudos.reduce((total, conteudo) => total + conteudo.erros_count, 0);
    const desempenho = respostasContabilizadas > 0 ? Math.round((acertos / respostasContabilizadas) * 100) : null;
    const melhorDesempenho = conteudos.reduce<number | null>(
        (best, conteudo) =>
            conteudo.desempenho_percentual !== null && (best === null || conteudo.desempenho_percentual > best)
                ? conteudo.desempenho_percentual
                : best,
        null,
    );
    const menorDesempenho = conteudos.reduce<number | null>(
        (worst, conteudo) =>
            conteudo.desempenho_percentual !== null && (worst === null || conteudo.desempenho_percentual < worst)
                ? conteudo.desempenho_percentual
                : worst,
        null,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${materia.nome} - ${concurso.titulo}`} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('concurso.show', concurso.id)}>
                                <ArrowLeft />
                                Voltar ao concurso
                            </Link>
                        </Button>
                        <div className="space-y-1">
                            <h1 className="text-foreground text-2xl font-semibold tracking-tight">{materia.nome}</h1>
                            <p className="text-muted-foreground text-sm">Acompanhamento dos conteúdos e das respostas em {concurso.titulo}.</p>
                        </div>
                    </div>
                </header>

                <section aria-label="Resumo da matéria" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Conteúdos</CardDescription>
                            <CardTitle className="text-2xl">{conteudos.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Questões já respondidas</CardDescription>
                            <CardTitle className="text-2xl">{questoesRespondidas}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Acertos e erros</CardDescription>
                            <CardTitle className="flex items-center gap-3 text-2xl">
                                <span className="inline-flex items-center gap-1.5">
                                    <Check className="size-4 text-emerald-600" />
                                    {acertos}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <X className="text-destructive size-4" />
                                    {erros}
                                </span>
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Desempenho geral</CardDescription>
                            <CardTitle className="text-2xl">{desempenho === null ? 'Sem dados' : `${desempenho}%`}</CardTitle>
                        </CardHeader>
                        {desempenho !== null && (
                            <CardContent>
                                <div
                                    role="progressbar"
                                    aria-label={`Desempenho geral em ${materia.nome}`}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={desempenho}
                                    className="bg-muted h-2 overflow-hidden rounded-full"
                                >
                                    <div className="bg-primary h-full rounded-full" style={{ width: `${desempenho}%` }} />
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </section>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Desempenho por conteúdo</CardTitle>
                        <CardDescription>
                            Conteúdos com maior percentual de acerto aparecem primeiro. Questões puladas e simulados não concluídos não entram nos
                            cálculos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {conteudos.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] text-left text-sm">
                                    <thead className="bg-muted/50 text-muted-foreground border-b text-xs font-semibold tracking-wide uppercase">
                                        <tr>
                                            <th scope="col" className="px-4 py-3">
                                                Conteúdo
                                            </th>
                                            <th scope="col" className="px-4 py-3">
                                                Questões respondidas
                                            </th>
                                            <th scope="col" className="px-4 py-3">
                                                Acertos / erros
                                            </th>
                                            <th scope="col" className="px-4 py-3">
                                                Desempenho
                                            </th>
                                            <th scope="col" className="px-4 py-3">
                                                Última atividade
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-border divide-y">
                                        {conteudos.map((conteudo) => {
                                            const isBest = melhorDesempenho !== null && conteudo.desempenho_percentual === melhorDesempenho;

                                            return (
                                                <tr key={conteudo.id} className="hover:bg-muted/40 transition-colors">
                                                    <th scope="row" className="px-4 py-3 font-medium">
                                                        <div className="flex items-start gap-3">
                                                            <BookOpen className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                                                            <div>
                                                                <p>{conteudo.nome}</p>
                                                                {conteudo.descricao && (
                                                                    <p className="text-muted-foreground mt-1 max-w-sm text-xs font-normal">
                                                                        {conteudo.descricao}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </th>
                                                    <td className="px-4 py-3">
                                                        {conteudo.questoes_respondidas_count} de {conteudo.questoes_count}
                                                        {conteudo.respondidas_count > conteudo.questoes_respondidas_count && (
                                                            <p className="text-muted-foreground mt-1 text-xs">
                                                                {conteudo.respondidas_count} respostas contabilizadas
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {conteudo.respondidas_count > 0 ? (
                                                            <span className="inline-flex items-center gap-3">
                                                                <span className="inline-flex items-center gap-1">
                                                                    <Check className="size-3.5 text-emerald-600" />
                                                                    {conteudo.acertos_count}
                                                                </span>
                                                                <span className="inline-flex items-center gap-1">
                                                                    <X className="text-destructive size-3.5" />
                                                                    {conteudo.erros_count}
                                                                </span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">Sem respostas</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {conteudo.desempenho_percentual === null ? (
                                                            <span className="text-muted-foreground">Sem dados</span>
                                                        ) : (
                                                            <div className="min-w-32 space-y-1.5">
                                                                <div className="flex items-center gap-3">
                                                                    <div
                                                                        role="progressbar"
                                                                        aria-label={`Desempenho em ${conteudo.nome}`}
                                                                        aria-valuemin={0}
                                                                        aria-valuemax={100}
                                                                        aria-valuenow={conteudo.desempenho_percentual}
                                                                        className="bg-muted h-2 min-w-16 flex-1 overflow-hidden rounded-full"
                                                                    >
                                                                        <div
                                                                            className="bg-primary h-full rounded-full"
                                                                            style={{ width: `${conteudo.desempenho_percentual}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="w-10 shrink-0 font-medium">
                                                                        {conteudo.desempenho_percentual}%
                                                                    </span>
                                                                </div>
                                                                {isBest && <p className="text-muted-foreground text-xs">Melhor aproveitamento</p>}
                                                                {menorDesempenho !== melhorDesempenho &&
                                                                    conteudo.desempenho_percentual === menorDesempenho && (
                                                                        <p className="text-muted-foreground text-xs">Precisa de mais revisão</p>
                                                                    )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="text-muted-foreground px-4 py-3">
                                                        {conteudo.ultima_resposta_em ? formatDate(conteudo.ultima_resposta_em) : '—'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <CircleHelp className="text-muted-foreground mx-auto mb-3 size-8" />
                                <p className="font-medium">Ainda não há conteúdos nesta matéria para este concurso.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
