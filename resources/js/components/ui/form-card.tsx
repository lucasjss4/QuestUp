import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type FormField = {
    name: string;
    label: string;
    type?: string;
    placeholder?: string;
    value?: string;
    autoComplete?: string;
    required?: boolean;
    disabled?: boolean;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

type FormCardProps = {
    title: string;
    description?: string;
    fields: FormField[];
    submitLabel?: string;
    cancelLabel?: string;
    onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
    onCancel?: () => void;
    className?: string;
    submitDisabled?: boolean;
    footerStart?: React.ReactNode;
};

export function FormCard({
    title,
    description,
    fields,
    submitLabel = 'Salvar',
    cancelLabel = 'Cancelar',
    onSubmit,
    onCancel,
    className,
    submitDisabled = false,
    footerStart,
}: FormCardProps) {
    return (
        <Card className={cn('w-full max-w-2xl', className)}>
            <form onSubmit={onSubmit}>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    {description ? <CardDescription>{description}</CardDescription> : null}
                </CardHeader>

                <CardContent className="space-y-5">
                    {fields.map((field) => (
                        <div key={field.name} className="space-y-2">
                            <Label htmlFor={field.name}>{field.label}</Label>
                            <Input
                                id={field.name}
                                name={field.name}
                                type={field.type ?? 'text'}
                                placeholder={field.placeholder}
                                value={field.value}
                                autoComplete={field.autoComplete}
                                required={field.required}
                                disabled={field.disabled}
                                onChange={field.onChange}
                            />
                        </div>
                    ))}
                </CardContent>

                <CardFooter className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {footerStart}

                    <div className="flex justify-end gap-3">
                        {onCancel ? (
                            <Button type="button" variant="outline" onClick={onCancel}>
                                {cancelLabel}
                            </Button>
                        ) : null}

                        <Button type="submit" disabled={submitDisabled}>
                            {submitLabel}
                        </Button>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}
