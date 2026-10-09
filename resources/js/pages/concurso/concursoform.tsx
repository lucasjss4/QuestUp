import { Card } from '@/components/ui/card';
import { FormCard } from '@/components/ui/form-card';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { createConcurso } from '@/services/concursoService';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        router.post(route('concurso.create'), formData);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Adicionar Concurso" />
            <div className="flex h-full items-start justify-center">
                <Card className="h-150 w-full flex mt-5 ml-10 mr-10 text-black bg-white justify-center items-center">
                    <FormCard
                        title='Adicionar Concurso'
                        description='Preencha os campos abaixo para adicionar um novo concurso.'
                        fields={
                            [
                                { name: 'titulo', label: 'Nome do Concurso', type: 'text', onChange: handleChange, value: formData.titulo },
                                { name: 'data_concurso', label: 'Data do Concurso', type: 'date', onChange: handleChange, value: formData.data_concurso },
                            ]
                        }
                        onSubmit={handleSubmit}
                    />
                </Card>
            </div>
        </AppLayout>
    );
}
