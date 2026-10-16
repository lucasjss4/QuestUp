import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Check, Copy, Info, Play, Upload } from 'lucide-react';
import { useState } from 'react';

type Concurso = {
    id: number;
    titulo: string;
    data_concurso: string;
};

type Materia = {
    id: number;
    nome: string;
    descricao: string;
    conteudos_count: number;
    questoes_count: number;
    conteudos: { codigo: string; nome: string }[];
};

type ConcursoPageProps = {
    concurso: Concurso;
    materias: Materia[];
    questoesCount: number;
};

const questionPrompt = `Você é especialista em elaborar questões para concursos públicos com base em editais e materiais de estudo.

Com base no material anexado, gere questões objetivas para os conteúdos informados. Entregue somente um JSON válido seguindo exatamente este formato:
{
  "questoes": [
    {
      "conteudo_codigo": "interpretacao-texto",
      "enunciado": "Leia o trecho a seguir e assinale a alternativa correta...",
      "origem": "Questão inédita baseada no edital",
      "dificuldade": "Média",
      "alternativas": [
        { "opcao": "A", "texto": "Primeira alternativa", "correta": false },
        { "opcao": "B", "texto": "Segunda alternativa", "correta": true },
        { "opcao": "C", "texto": "Terceira alternativa", "correta": false },
        { "opcao": "D", "texto": "Quarta alternativa", "correta": false }
      ]
    }
  ]
}

Regras obrigatórias:
- Gere somente questões objetivas, com de 2 a 5 alternativas identificadas por A, B, C, D ou E.
- Cada questão deve ter exatamente uma alternativa correta; use true apenas nela e false nas demais.
- Em "conteudo_codigo", use exatamente o código de um conteúdo existente no concurso.
- Preencha "origem" com a banca/fonte ou "Questão inédita"; informe a dificuldade como "Fácil", "Média" ou "Difícil".
- Entregue somente o JSON, sem comentários, introdução, cercas de código ou vírgulas sobrando.`;

export default function ConcursoPage({ concurso, materias, questoesCount }: ConcursoPageProps) {
    const [importOpen, setImportOpen] = useState(false);
    const [questionsJson, setQuestionsJson] = useState('');
    const [importError, setImportError] = useState('');
    const [importSuccess, setImportSuccess] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [promptCopied, setPromptCopied] = useState(false);
    const [copyError, setCopyError] = useState('');
    const [simuladoOpen, setSimuladoOpen] = useState(false);
    const [quantidades, setQuantidades] = useState<Record<number, number>>({});
    const [simuladoError, setSimuladoError] = useState('');
    const [isStartingSimulado, setIsStartingSimulado] = useState(false);
    const promptWithContentCodes = `${questionPrompt}

Códigos de conteúdo disponíveis para usar no campo "conteudo_codigo":
${materias.flatMap((materia) => materia.conteudos.map((conteudo) => `- ${conteudo.codigo}: ${materia.nome} — ${conteudo.nome}`)).join('\n')}`;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Início', href: route('homePage') },
        { title: concurso.titulo, href: route('concurso.show', concurso.id) },
    ];

    const handleImport = () => {
        if (!questionsJson.trim()) {
            setImportError('Cole o JSON das questões no campo de texto antes de salvar.');
            return;
        }

        setImportError('');
        router.post(
            route('concurso.import-questions', concurso.id),
            { questoes_json: questionsJson },
            {
                onStart: () => setIsImporting(true),
                onError: (errors) => {
                    setImportError(errors.questoes_json ?? 'Não foi possível importar as questões. Confira o JSON e tente novamente.');
                },
                onSuccess: () => {
                    setQuestionsJson('');
                    setImportOpen(false);
                    setImportSuccess('Questões importadas com sucesso.');
                },
                onFinish: () => setIsImporting(false),
            },
        );
    };

    const handleCopyPrompt = async () => {
        setCopyError('');

        if (!navigator.clipboard) {
            setCopyError('Não foi possível acessar a área de transferência neste navegador.');
            return;
        }

        try {
            await navigator.clipboard.writeText(promptWithContentCodes);
            setPromptCopied(true);
        } catch {
            setCopyError('Não foi possível copiar o prompt. Verifique a permissão de acesso à área de transferência.');
        }
    };

    const openSimulado = (materiaId?: number) => {
        setQuantidades(Object.fromEntries(materias.map((materia) => [materia.id, materia.id === materiaId ? 1 : 0])));
        setSimuladoError('');
        setSimuladoOpen(true);
    };

    const handleStartSimulado = () => {
        const total = Object.values(quantidades).reduce((sum, quantidade) => sum + quantidade, 0);

        if (total < 1) {
            setSimuladoError('Informe pelo menos uma questão para iniciar o simulado.');
            return;
        }

        const exceedsAvailable = materias.some((materia) => (quantidades[materia.id] ?? 0) > materia.questoes_count);

        if (exceedsAvailable) {
            setSimuladoError('A quantidade solicitada não pode ultrapassar as questões disponíveis em cada matéria.');
            return;
        }

        setSimuladoError('');
        router.post(
            route('concurso.simulado.start', concurso.id),
            { quantidades },
            {
                onStart: () => setIsStartingSimulado(true),
                onError: (errors) => {
                    setSimuladoError(errors.quantidades ?? 'Não foi possível iniciar o simulado. Confira as quantidades e tente novamente.');
                },
                onFinish: () => setIsStartingSimulado(false),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={concurso.titulo} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('homePage')}>
                                <ArrowLeft />
                                Voltar aos concursos
                            </Link>
                        </Button>
                        <div className="space-y-1">
                            <h1 className="text-foreground text-2xl font-semibold tracking-tight">{concurso.titulo}</h1>
                            <p className="text-muted-foreground text-sm">Matérias, conteúdos e questões deste concurso.</p>
                        </div>
                    </div>
                    <Button onClick={() => setImportOpen(true)}>
                        <Upload />
                        Importar questões
                    </Button>
                </header>

                {importSuccess && (
                    <p role="status" className="rounded-md border border-emerald-600/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
                        {importSuccess}
                    </p>
                )}

                <Card>
                    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Simulado geral</CardTitle>
                            <CardDescription>
                                {questoesCount === 1 ? '1 questão cadastrada no concurso' : `${questoesCount} questões cadastradas no concurso`}
                            </CardDescription>
                        </div>
                        {questoesCount > 0 ? (
                            <Button onClick={() => openSimulado()}>
                                <Play />
                                Fazer simulado geral
                            </Button>
                        ) : (
                            <Button disabled>
                                <Play />
                                Fazer simulado geral
                            </Button>
                        )}
                    </CardHeader>
                </Card>

                <section className="space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">Matérias</h2>
                        <p className="text-muted-foreground text-sm">Escolha uma matéria para acompanhar os conteúdos e questões.</p>
                    </div>

                    {materias.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {materias.map((materia) => (
                                <Card key={materia.id} className="flex flex-col">
                                    <CardHeader>
                                        <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-lg">
                                            <BookOpen className="size-5" />
                                        </div>
                                        <CardTitle>{materia.nome}</CardTitle>
                                        <CardDescription>{materia.descricao}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <p className="text-muted-foreground text-sm">
                                            {materia.conteudos_count} {materia.conteudos_count === 1 ? 'conteúdo' : 'conteúdos'}
                                            {' · '}
                                            {materia.questoes_count} {materia.questoes_count === 1 ? 'questão' : 'questões'}
                                        </p>
                                        <div className="mt-4 space-y-2">
                                            <h3 className="text-sm font-medium">Conteúdos cobrados</h3>
                                            <ul className="text-muted-foreground max-h-40 space-y-2 overflow-y-auto pr-2 text-sm">
                                                {materia.conteudos.map((conteudo) => (
                                                    <li key={conteudo.codigo} className="flex gap-2">
                                                        <span className="text-primary" aria-hidden="true">
                                                            •
                                                        </span>
                                                        <span>{conteudo.nome}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="py-10 text-center">
                                <p className="font-medium">Este concurso ainda não tem matérias.</p>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    Importe a estrutura do concurso para visualizar as matérias nesta tela.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </section>
            </div>

            <Dialog open={simuladoOpen} onOpenChange={setSimuladoOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Configurar simulado</DialogTitle>
                        <DialogDescription>Defina quantas questões aleatórias deseja responder em cada matéria.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
                            {materias.map((materia) => (
                                <div key={materia.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{materia.nome}</p>
                                        <p className="text-muted-foreground text-xs">
                                            {materia.questoes_count} {materia.questoes_count === 1 ? 'questão disponível' : 'questões disponíveis'}
                                        </p>
                                    </div>
                                    <div className="w-24 shrink-0">
                                        <label htmlFor={`quantidade-${materia.id}`} className="sr-only">
                                            Quantidade de questões de {materia.nome}
                                        </label>
                                        <Input
                                            id={`quantidade-${materia.id}`}
                                            type="number"
                                            min={0}
                                            max={materia.questoes_count}
                                            step={1}
                                            value={quantidades[materia.id] ?? 0}
                                            disabled={materia.questoes_count === 0 || isStartingSimulado}
                                            onChange={(event) => {
                                                const value = event.target.value === '' ? 0 : Number(event.target.value);
                                                setQuantidades((current) => ({ ...current, [materia.id]: value }));
                                                setSimuladoError('');
                                            }}
                                            aria-label={`Quantidade de questões de ${materia.nome}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {simuladoError && (
                            <p role="alert" className="text-destructive text-sm">
                                {simuladoError}
                            </p>
                        )}
                        <div className="flex justify-end">
                            <Button
                                onClick={handleStartSimulado}
                                disabled={isStartingSimulado || materias.every((materia) => materia.questoes_count === 0)}
                            >
                                <Play />
                                {isStartingSimulado ? 'Preparando simulado...' : 'Iniciar simulado'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Importar questões</DialogTitle>
                        <DialogDescription>Gere um JSON de questões baseado no edital e nos códigos de conteúdo deste concurso.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 text-sm">
                        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
                            <h3 className="mb-2 flex items-center gap-2 font-semibold">
                                <Info className="size-4" />
                                Instruções para gerar o arquivo
                            </h3>
                            <ul className="list-disc space-y-1 pl-5">
                                <li>Anexe o edital ou material de referência à conversa com a IA.</li>
                                <li>Use exatamente o código de conteúdo cadastrado; cada questão precisa ter uma única resposta correta.</li>
                                <li>Copie a resposta completa em formato JSON e cole no campo abaixo.</li>
                            </ul>
                        </div>

                        <section className="space-y-2">
                            <h3 className="font-semibold">Prompt para usar na IA</h3>
                            <div className="relative">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="absolute top-2 right-6 z-10"
                                    onClick={handleCopyPrompt}
                                    aria-label={promptCopied ? 'Prompt copiado' : 'Copiar prompt'}
                                >
                                    {promptCopied ? <Check /> : <Copy />}
                                    {promptCopied ? 'Copiado' : 'Copiar'}
                                </Button>
                                <pre className="bg-muted max-h-80 overflow-auto rounded-lg border p-4 pt-12 text-xs leading-relaxed break-words whitespace-pre-wrap">
                                    {promptWithContentCodes}
                                </pre>
                            </div>
                            {copyError && (
                                <p role="alert" className="text-destructive text-sm">
                                    {copyError}
                                </p>
                            )}
                        </section>

                        <div className="space-y-2">
                            <label htmlFor="questoes-json" className="font-medium">
                                JSON completo das questões
                            </label>
                            <textarea
                                id="questoes-json"
                                value={questionsJson}
                                onChange={(event) => {
                                    setQuestionsJson(event.target.value);
                                    setImportError('');
                                    setImportSuccess('');
                                }}
                                placeholder={'{\n  "questoes": []\n}'}
                                rows={14}
                                spellCheck={false}
                                className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-72 w-full resize-y rounded-md border px-3 py-2 font-mono text-xs shadow-xs outline-none focus-visible:ring-[3px]"
                            />
                            <p className="text-muted-foreground text-xs">Cole e edite o JSON completo antes de importar.</p>
                            {importError && (
                                <p role="alert" className="text-destructive text-sm">
                                    {importError}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <Button disabled={isImporting || !questionsJson.trim()} onClick={handleImport}>
                                <Upload />
                                {isImporting ? 'Salvando...' : 'Salvar e importar questões'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
