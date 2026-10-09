import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type DataTableColumn<T> = {
    key: string;
    header: string;
    cell: (row: T) => ReactNode;
    className?: string;
};

type DataTableProps<T> = {
    columns: DataTableColumn<T>[];
    data: T[];
    getRowKey: (row: T) => string | number;
    emptyMessage?: string;
};

export function DataTable<T>({
    columns,
    data,
    getRowKey,
    emptyMessage = 'Nenhum registro encontrado.',
}: DataTableProps<T>) {
    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    <tr>
                        {columns.map((column) => (
                            <th key={column.key} scope="col" className={cn('px-4 py-3', column.className)}>
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {data.length > 0 ? (
                        data.map((row) => (
                            <tr key={getRowKey(row)} className="transition-colors hover:bg-muted/40">
                                {columns.map((column) => (
                                    <td key={column.key} className={cn('px-4 py-3', column.className)}>
                                        {column.cell(row)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
