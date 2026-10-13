import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

type Concurso = {
    id: number;
    titulo: string;
    data_concurso: string;
};

type HomePageProps = {
    concursos: Concurso[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Início',
        href: '/home',
    },
];

const concursoColumns: DataTableColumn<Concurso>[] = [
    {
        key: 'titulo',
        header: 'Concurso',
        cell: (concurso) => <span className="text-foreground font-medium">{concurso.titulo}</span>,
    },
    {
        key: 'data_concurso',
        header: 'Data',
        cell: (concurso) =>
            concurso.data_concurso
                ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${concurso.data_concurso.slice(0, 10)}T00:00:00Z`))
                : '—',
    },
    {
        key: 'conteudo',
        header: '',
        className: 'text-right',
        cell: (concurso) => (
            <Button variant="outline" size="sm" asChild>
                <Link href={route('concurso.show', concurso.id)}>
                    Acessar conteúdo
                    <ArrowRight />
                </Link>
            </Button>
        ),
    },
];

export default function HomePage({ concursos }: HomePageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Início" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Visão geral</h1>
                        <p className="text-muted-foreground text-sm">Acompanhe seus concursos e organize seus estudos.</p>
                    </div>
                    <Button asChild>
                        <Link href={route('addConcurso')}>Adicionar concurso</Link>
                    </Button>
                </header>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Meus concursos</CardTitle>
                        <CardDescription>
                            {concursos.length === 1 ? '1 concurso cadastrado' : `${concursos.length} concursos cadastrados`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={concursoColumns}
                            data={concursos}
                            getRowKey={(concurso) => concurso.id}
                            emptyMessage="Você ainda não cadastrou nenhum concurso."
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
