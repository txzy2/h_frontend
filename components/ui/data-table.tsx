'use client';

import {Skeleton} from '@/components/ui/skeleton';
import {ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight} from 'lucide-react';
import type {ReactNode} from 'react';

export interface DataTableColumn<T> {
    key: string;
    header: string;
    sortable?: boolean;
    align?: 'left' | 'right' | 'center';
    render: (row: T) => ReactNode;
    className?: string;
    headerClassName?: string;
}

interface DataTableProps<T> {
    columns: DataTableColumn<T>[];
    rows: T[];
    total: number;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    sortKey?: string;
    sortOrder?: 'asc' | 'desc';
    onSortChange?: (key: string, order: 'asc' | 'desc') => void;
    getRowKey: (row: T) => string | number;
    isLoading?: boolean;
    emptyMessage?: string;
    onRowClick?: (row: T) => void;
    rowClassName?: (row: T) => string;
    minWidthClassName?: string;
}

function alignClass(align: DataTableColumn<unknown>['align']): string {
    if (align === 'right') return 'text-right';
    if (align === 'center') return 'text-center';

    return 'text-left';
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
    if (total <= 7) {
        return Array.from({length: total}, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, total, current, current - 1, current + 1]);

    if (current <= 3) {
        pages.add(2);
        pages.add(3);
        pages.add(4);
    }
    if (current >= total - 2) {
        pages.add(total - 1);
        pages.add(total - 2);
        pages.add(total - 3);
    }

    const sorted = [...pages]
        .filter(page => page >= 1 && page <= total)
        .sort((left, right) => left - right);
    const result: (number | 'ellipsis')[] = [];

    sorted.forEach((page, index) => {
        const previous = sorted[index - 1];

        if (previous && page - previous > 1) result.push('ellipsis');
        result.push(page);
    });

    return result;
}

/**
 * Переиспользуемая таблица: сортировка, пагинация, размер страницы, пустое состояние.
 * Подходит для команды, броней, аналитики и других списков.
 */
export function DataTable<T>({
    columns,
    rows,
    total,
    page,
    pageSize,
    onPageChange,
    onPageSizeChange,
    sortKey,
    sortOrder = 'asc',
    onSortChange,
    getRowKey,
    isLoading = false,
    emptyMessage = 'Нет данных',
    onRowClick,
    rowClassName,
    minWidthClassName = 'min-w-[760px]'
}: DataTableProps<T>) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const end = Math.min(safePage * pageSize, total);
    const pages = getPageNumbers(safePage, totalPages);
    const pageSizeOptions = [...new Set([10, 20, 50, pageSize])].sort(
        (left, right) => left - right
    );

    return (
        <div className='overflow-hidden rounded-xl border border-app-border bg-surface/60 backdrop-blur-sm'>
            <div className='overflow-x-auto'>
                <table className={`w-full ${minWidthClassName} text-sm`}>
                    <thead>
                        <tr className='border-b border-app-border/60 text-xs uppercase tracking-wider text-app-subtle'>
                            {columns.map(column => {
                                const isSorted = sortKey === column.key;
                                const SortIcon = !isSorted
                                    ? ArrowUpDown
                                    : sortOrder === 'asc'
                                      ? ArrowUp
                                      : ArrowDown;

                                return (
                                    <th
                                        key={column.key}
                                        aria-sort={
                                            isSorted
                                                ? sortOrder === 'asc'
                                                    ? 'ascending'
                                                    : 'descending'
                                                : 'none'
                                        }
                                        className={[
                                            'px-4 py-3 font-medium',
                                            alignClass(column.align),
                                            column.headerClassName ?? ''
                                        ].join(' ')}
                                    >
                                        {column.sortable && onSortChange ? (
                                            <button
                                                type='button'
                                                onClick={() =>
                                                    onSortChange(
                                                        column.key,
                                                        isSorted && sortOrder === 'asc'
                                                            ? 'desc'
                                                            : 'asc'
                                                    )
                                                }
                                                className={[
                                                    'inline-flex items-center gap-1 transition-colors hover:text-app-fg',
                                                    isSorted ? 'text-app-fg' : ''
                                                ].join(' ')}
                                            >
                                                {column.header}
                                                <SortIcon
                                                    size={12}
                                                    className={
                                                        isSorted ? 'text-brand' : 'opacity-40'
                                                    }
                                                />
                                            </button>
                                        ) : (
                                            column.header
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({length: 5}).map((_, rowIndex) => (
                                <tr
                                    key={`skeleton-${rowIndex}`}
                                    className='border-b border-app-border/40'
                                >
                                    {columns.map(column => (
                                        <td key={column.key} className='px-4 py-3'>
                                            <Skeleton className='h-4 w-full max-w-[140px]' />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className='px-4 py-12 text-center text-sm text-app-subtle'
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            rows.map(row => (
                                <tr
                                    key={getRowKey(row)}
                                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                                    className={[
                                        'border-b border-app-border/40 transition-colors last:border-b-0',
                                        onRowClick ? 'cursor-pointer hover:bg-surface-2/40' : '',
                                        rowClassName?.(row) ?? ''
                                    ].join(' ')}
                                >
                                    {columns.map(column => (
                                        <td
                                            key={column.key}
                                            className={[
                                                'px-4 py-3',
                                                alignClass(column.align),
                                                column.className ?? ''
                                            ].join(' ')}
                                        >
                                            {column.render(row)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className='flex flex-wrap items-center justify-between gap-3 border-t border-app-border/60 px-4 py-3 text-xs text-app-subtle'>
                <span>
                    Показано {start}–{end} из {total}
                </span>

                <div className='flex flex-wrap items-center gap-4'>
                    {onPageSizeChange && (
                        <label className='flex items-center gap-2'>
                            На странице
                            <select
                                value={pageSize}
                                onChange={event =>
                                    onPageSizeChange(Number(event.target.value))
                                }
                                className='h-7 cursor-pointer rounded-md border border-app-border bg-surface-2/50 px-2 text-xs text-app-fg outline-none focus:border-brand/60'
                            >
                                {pageSizeOptions.map(size => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}

                    <div className='flex items-center gap-1'>
                        <button
                            type='button'
                            aria-label='Предыдущая страница'
                            onClick={() => onPageChange(safePage - 1)}
                            disabled={safePage <= 1}
                            className='flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-app-border text-app-muted transition-colors hover:bg-surface-2 hover:text-app-fg disabled:cursor-not-allowed disabled:opacity-40'
                        >
                            <ChevronLeft size={14} />
                        </button>

                        {pages.map((item, index) =>
                            item === 'ellipsis' ? (
                                <span key={`ellipsis-${index}`} className='px-1'>
                                    …
                                </span>
                            ) : (
                                <button
                                    key={item}
                                    type='button'
                                    aria-current={item === safePage ? 'page' : undefined}
                                    onClick={() => onPageChange(item)}
                                    className={[
                                        'flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-md px-1.5 text-xs transition-colors',
                                        item === safePage
                                            ? 'bg-brand font-semibold text-brand-fg'
                                            : 'border border-app-border text-app-muted hover:bg-surface-2 hover:text-app-fg'
                                    ].join(' ')}
                                >
                                    {item}
                                </button>
                            )
                        )}

                        <button
                            type='button'
                            aria-label='Следующая страница'
                            onClick={() => onPageChange(safePage + 1)}
                            disabled={safePage >= totalPages}
                            className='flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-app-border text-app-muted transition-colors hover:bg-surface-2 hover:text-app-fg disabled:cursor-not-allowed disabled:opacity-40'
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
