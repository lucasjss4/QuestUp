import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormCard } from '@/components/ui/form-card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, FileJson, Info } from 'lucide-react';
import { useRef, useState } from 'react';

const promptJson = `Você é especialista em analisar editais e estruturar conteúdos para uma plataforma de preparação para concursos.

Com base no edital anexado, gere um JSON válido para a vaga de [VAGA ESCOLHIDA], contendo somente as matérias e os conteúdos programáticos dessa vaga. Não inclua questões nem alternativas; elas serão cadastradas em uma etapa posterior.

Siga exatamente esta estrutura e estes nomes de propriedades:
{
  "materias": [
    {
      "codigo": "lingua-portuguesa",
      "nome": "Língua Portuguesa",
      "descricao": "Classes gramaticais e interpretação de textos",
      "conteudos": [
        {
          "codigo": "interpretacao-texto",
          "nome": "Interpretação de texto",
          "descricao": "Compreensão e interpretação de textos"
        }
      ]
    }
  ]
}

Regras obrigatórias:
- Entregue somente o JSON, sem comentários, introdução, cercas de código ou vírgulas sobrando.
- Inclua em cada matéria e conteúdo os campos "codigo", "nome" e "descricao"; cada matéria também deve conter "conteudos".
- Use códigos únicos, curtos, em minúsculas, sem acentos ou espaços; use hífen apenas para separar palavras-chave (ex.: "interpretacao-texto").
- Não invente conteúdo e não inclua matérias de outras vagas do edital.`;

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Adicionar Concurso',
        href: '/adicionar-concurso',
    },
];

export default function Concurso() {
    const [formData, setFormData] = useState({
        titulo: '',
        data_concurso: '',
    });
    const [instructionsOpen, setInstructionsOpen] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [selectedJsonFile, setSelectedJsonFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setUploadError('');

        if (!selectedJsonFile) {
            router.post(route('concurso.create'), formData, {
                onStart: () => setIsSubmitting(true),
                onFinish: () => setIsSubmitting(false),
            });
            return;
        }

        router.post(
            route('concurso.import-structure'),
            {
                ...formData,
                arquivo_json: selectedJsonFile,
            },
            {
                forceFormData: true,
                onStart: () => setIsSubmitting(true),
                onError: (errors) => {
                    setUploadError(errors.arquivo_json ?? 'Não foi possível importar o arquivo. Confira os dados e tente novamente.');
                },
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const handleJsonSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            setSelectedJsonFile(file);
            setUploadError('');
        }

        e.target.value = '';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Adicionar Concurso" />
            <div className="flex h-full flex-col items-center">
                <Button className="mt-5 ml-10 self-start" variant="outline" asChild>
                    <Link href={route('homePage')}>
                        <ArrowLeft />
                        Voltar
                    </Link>
                </Button>
                <FormCard
                    title="Adicionar Concurso"
                    description="Preencha os campos abaixo para adicionar um novo concurso."
                    fields={[
                        { name: 'titulo', label: 'Nome do Concurso', type: 'text', onChange: handleChange, value: formData.titulo, required: true },
                        {
                            name: 'data_concurso',
                            label: 'Data do Concurso',
                            type: 'date',
                            onChange: handleChange,
                            value: formData.data_concurso,
                            required: true,
                        },
                    ]}
                    submitLabel={isSubmitting ? 'Salvando...' : 'Salvar'}
                    submitDisabled={isSubmitting}
                    footerStart={
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json,application/json"
                                    className="sr-only"
                                    onChange={handleJsonSelection}
                                    aria-label="Selecionar arquivo JSON"
                                />
                                <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => fileInputRef.current?.click()}>
                                    <FileJson />
                                    Importar estrutura JSON
                                </Button>
                                <Button
                                    type="button"
                                    className="bg-amber-400 text-amber-950 hover:bg-amber-500"
                                    onClick={() => setInstructionsOpen(true)}
                                >
                                    <Info />
                                    Como preparar o JSON
                                </Button>
                            </div>
                            {selectedJsonFile && <p className="text-muted-foreground text-sm">Arquivo selecionado: {selectedJsonFile.name}</p>}
                            {uploadError && (
                                <p role="alert" className="text-destructive max-w-md text-sm">
                                    {uploadError}
                                </p>
                            )}
                        </div>
                    }
                    onSubmit={handleSubmit}
                />
            </div>
            <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Como preparar a estrutura do concurso</DialogTitle>
                        <DialogDescription>
                            Gere o arquivo estrutura.json a partir do edital e importe-o junto com o cadastro do concurso.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 text-sm">
                        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
                            <h3 className="mb-2 font-semibold">Antes de gerar o arquivo</h3>
                            <ul className="list-disc space-y-1 pl-5">
                                <li>Esta etapa cadastra somente matérias e conteúdos; questões e alternativas serão adicionadas depois.</li>
                                <li>
                                    Escolha uma vaga específica do edital e substitua <code>[VAGA ESCOLHIDA]</code> no prompt.
                                </li>
                                </ul>
                        </div>

                        <section className="space-y-2">
                            <h3 className="font-semibold">Prompt para usar na IA</h3>
                            <p className="text-muted-foreground">
                                Anexe o edital à conversa, cole o prompt abaixo e troque o nome da vaga antes de enviar.
                            </p>
                            <pre className="bg-muted max-h-80 overflow-auto rounded-lg border p-4 text-xs leading-relaxed break-words whitespace-pre-wrap">
                                {promptJson}
                            </pre>
                        </section>

                        <p className="text-muted-foreground rounded-lg border p-4">
                            Depois de receber o JSON, salve-o como <code>estrutura.json</code>. Preencha o nome e a data do concurso, clique em{' '}
                                <strong>Importar estrutura JSON</strong> para selecionar o arquivo. Depois, clique em <strong>Salvar</strong> para criar o
                                concurso e associar as matérias e conteúdos automaticamente.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
