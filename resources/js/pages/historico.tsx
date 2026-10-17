import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, CalendarDays, History, Search, X } from 'lucide-react';
import { useState } from 'react';

type Simulado = {
    id: number;
    concurso_id: number;
    concurso_titulo: string;
    data_realizacao: string;
};

type HistoricoProps = {
    simulados: Simulado[];
};

const formatDate = (date: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${date.slice(0, 10)}T00:00:00Z`));

export default function HistoricoPage({ simulados }: HistoricoProps) {
    const [concursoSearch, setConcursoSearch] = useState('');
    const [dataInicial, setDataInicial] = useState('');
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Início', href: route('homePage') },
        { title: 'Histórico', href: route('historico') },
    ];
    const normalizedSearch = concursoSearch.trim().toLocaleLowerCase('pt-BR');
    const simuladosFiltrados = simulados.filter((simulado) => {
        const matchesConcurso = simulado.concurso_titulo.toLocaleLowerCase('pt-BR').includes(normalizedSearch);
        const matchesDate = !dataInicial || simulado.data_realizacao.slice(0, 10) >= dataInicial;

        return matchesConcurso && matchesDate;
    });
    const hasFilters = concursoSearch.length > 0 || dataInicial.length > 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Histórico de simulados" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <header className="space-y-1">
                    <h1 className="text-foreground text-2xl font-semibold tracking-tight">Histórico de simulados</h1>
                    <p className="text-muted-foreground text-sm">Consulte os resultados dos simulados que você já concluiu.</p>
                </header>

                <section aria-label="Filtros do histórico" className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <label htmlFor="concurso-search" className="text-sm font-medium">
                            Buscar concurso
                        </label>
                        <div className="relative">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden="true" />
                            <Input
                                id="concurso-search"
                                type="search"
                                placeholder="Digite o nome do concurso"
                                value={concursoSearch}
                                onChange={(event) => setConcursoSearch(event.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="history-date-filter" className="text-sm font-medium">
                            A partir da data
                        </label>
                        <div className="relative">
                            <CalendarDays className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden="true" />
                            <Input
                                id="history-date-filter"
                                type="date"
                                value={dataInicial}
                                onChange={(event) => setDataInicial(event.target.value)}
                                className={dataInicial ? 'pr-10 pl-9' : 'pl-9'}
                            />
                            {dataInicial && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Limpar filtro de data"
                                    onClick={() => setDataInicial('')}
                                    className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
                                >
                                    <X />
                                </Button>
                            )}
                        </div>
                    </div>
                </section>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Simulados realizados</CardTitle>
                        <CardDescription>
                            {simuladosFiltrados.length === 1 ? '1 simulado encontrado' : `${simuladosFiltrados.length} simulados encontrados`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {simuladosFiltrados.length > 0 ? (
                            <div role="region" aria-label="Lista dos simulados" tabIndex={0} className="max-h-[60vh] overflow-y-auto pr-2">
                                <ul className="space-y-3">
                                    {simuladosFiltrados.map((simulado) => (
                                        <li key={simulado.id}>
                                            <Link
                                                href={`${route('concurso.simulado.show', {
                                                    concurso: simulado.concurso_id,
                                                    simulado: simulado.id,
                                                })}?origem=historico`}
                                                className="group hover:bg-muted/50 focus-visible:ring-ring flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-hidden"
                                            >
                                                <div className="flex min-w-0 items-start gap-3">
                                                    <div className="bg-primary/10 text-primary mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg">
                                                        <History className="size-4" />
                                                    </div>
                                                    <div className="min-w-0 space-y-1">
                                                        <p className="truncate font-medium">Simulado do {simulado.concurso_titulo}</p>
                                                        <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                                                            <CalendarDays className="size-4" />
                                                            Realizado em {formatDate(simulado.data_realizacao)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ArrowRight className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-1" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                {simulados.length > 0 && hasFilters ? (
                                    <>
                                        <p className="font-medium">Nenhum simulado encontrado.</p>
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            Ajuste os filtros para encontrar simulados com esses critérios.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-medium">Você ainda não concluiu nenhum simulado.</p>
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            Quando concluir um simulado, ele aparecerá aqui para você consultar o resultado.
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
