'use client';

import {DataTable, type DataTableColumn} from '@/components/ui/data-table';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {formatMoney, formatNumber} from '@/lib/format';
import {formatPhone} from '@/lib/phone';
import {statusBadgeStyle} from '@/lib/org/status';
import {useAuthStore} from '@/stores/auth.store';
import {
    TEAM_SORT_KEYS,
    type TeamResponse,
    type TeamResponseApi,
    type TeamRow,
    type TeamSortKey
} from '@/types/team';
import axios from 'axios';
import {
    CalendarDays,
    RefreshCw,
    Search,
    UserCheck,
    UsersRound,
    Wallet
} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {useCallback, useEffect, useState} from 'react';

function SummaryCard({
    label,
    value,
    icon: Icon,
    className
}: {
    label: string;
    value: string;
    icon: LucideIcon;
    className?: string;
}) {
    return (
        <Card className='border-app-border bg-surface/60'>
            <CardContent className='flex items-center gap-3 p-4'>
                <span className='flex h-9 w-9 items-center justify-center rounded-lg bg-app-fg/5'>
                    <Icon size={17} className={className ?? 'text-app-muted'} />
                </span>
                <div>
                    <p className='text-[11px] uppercase tracking-wider text-app-subtle'>
                        {label}
                    </p>
                    <p className='mt-0.5 text-lg font-bold text-app-fg'>{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function shiftStart(value: string | null): string {
    if (!value) return '';

    return new Date(value).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

export default function TeamPage() {
    const user = useAuthStore(state => state.user);
    const router = useRouter();
    const isAdmin = user?.role === 'Admin' || user?.role === 'SuperUser';

    const [data, setData] = useState<TeamResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortKey, setSortKey] = useState<TeamSortKey>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        if (user && !isAdmin) router.replace('/forbidden');
    }, [user, isAdmin, router]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const loadTeam = useCallback(async () => {
        if (!isAdmin) return;

        setIsLoading(true);
        setError('');

        try {
            const {data: response} = await axios.get<TeamResponseApi>('/api/team', {
                params: {
                    page,
                    pageSize,
                    sort: sortKey,
                    order: sortOrder,
                    ...(debouncedSearch ? {search: debouncedSearch} : {})
                }
            });

            if (response.success) {
                setData(response.data);
            } else {
                setError(
                    typeof response.data === 'string'
                        ? response.data
                        : 'Не удалось загрузить команду'
                );
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.data ??
                        err.response?.data?.error ??
                        'Не удалось загрузить команду'
                );
            } else {
                setError('Не удалось загрузить команду');
            }
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch, isAdmin, sortKey, sortOrder, page, pageSize]);

    useEffect(() => {
        void loadTeam();
    }, [loadTeam]);

    useEffect(() => {
        if (data && data.page !== page) setPage(data.page);
    }, [data, page]);

    const handleSort = (key: string, order: 'asc' | 'desc') => {
        if (!(TEAM_SORT_KEYS as readonly string[]).includes(key)) return;

        setSortKey(key as TeamSortKey);
        setSortOrder(order);
        setPage(1);
    };

    const columns: DataTableColumn<TeamRow>[] = [
        {
            key: 'name',
            header: 'Сотрудник',
            sortable: true,
            render: row => (
                <div className='flex items-center gap-2'>
                    <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-fg/10 text-[11px] font-semibold text-app-muted'>
                        {initials(row.name)}
                    </span>
                    <div className='min-w-0'>
                        <p className='truncate font-medium text-app-fg/90'>{row.name}</p>
                        <p className='truncate text-[11px] text-app-subtle'>@{row.login}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'position',
            header: 'Должность',
            sortable: true,
            render: row => <span className='text-app-muted'>{row.position}</span>
        },
        {
            key: 'phone',
            header: 'Телефон',
            render: row => (
                <span className='text-app-muted'>
                    {row.phone ? formatPhone(row.phone) : '—'}
                </span>
            )
        },
        {
            key: 'bookings',
            header: 'Брони',
            sortable: true,
            align: 'right',
            render: row => formatNumber(row.bookings)
        },
        {
            key: 'guests',
            header: 'Гости',
            sortable: true,
            align: 'right',
            render: row => formatNumber(row.guests)
        },
        {
            key: 'revenue',
            header: 'Выручка',
            sortable: true,
            align: 'right',
            render: row => (
                <span className='font-medium text-app-fg/90'>{formatMoney(row.revenue)}</span>
            )
        },
        {
            key: 'averageCheck',
            header: 'Ср. чек',
            sortable: true,
            align: 'right',
            render: row => formatMoney(row.averageCheck)
        },
        {
            key: 'cancellations',
            header: 'Отмены',
            sortable: true,
            align: 'right',
            render: row => formatNumber(row.cancellations)
        },
        {
            key: 'shift',
            header: 'Смена',
            sortable: true,
            render: row =>
                row.isOnShift ? (
                    <span
                        className='inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium'
                        style={statusBadgeStyle('seated')}
                    >
                        На смене · {shiftStart(row.shiftStartedAt)}
                    </span>
                ) : (
                    <span className='text-app-subtle'>—</span>
                )
        }
    ];

    if (!user || !isAdmin) return null;

    return (
        <div className='p-6 lg:p-8'>
            <div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
                <div>
                    <h1 className='text-2xl font-bold text-app-fg'>Команда</h1>
                    <p className='mt-1 text-sm text-app-subtle'>
                        Сотрудники организации · показатели за текущий месяц
                    </p>
                </div>

                <div className='flex w-full flex-wrap items-center gap-2 sm:w-auto'>
                    <div className='relative min-w-0 flex-1 sm:w-72'>
                        <Search
                            size={15}
                            className='absolute top-1/2 left-3 -translate-y-1/2 text-app-subtle'
                        />
                        <Input
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            placeholder='Поиск по имени, логину, телефону'
                            className='h-9 border-app-border bg-surface-2/50 pl-9 text-app-fg placeholder:text-app-subtle focus-visible:border-brand/60 focus-visible:ring-0'
                        />
                    </div>
                    <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => void loadTeam()}
                        disabled={isLoading}
                        className='h-9 gap-2 border-app-border bg-surface/60 text-app-muted hover:bg-surface-2 hover:text-app-fg disabled:opacity-50'
                    >
                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        Обновить
                    </Button>
                </div>
            </div>

            {error && (
                <div className='mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400'>
                    {error}
                </div>
            )}

            <div className='mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4'>
                <SummaryCard
                    label='Сотрудники'
                    value={formatNumber(data?.summary.employees ?? 0)}
                    icon={UsersRound}
                    className='text-sky-400'
                />
                <SummaryCard
                    label='На смене'
                    value={formatNumber(data?.summary.onShift ?? 0)}
                    icon={UserCheck}
                    className='text-emerald-400'
                />
                <SummaryCard
                    label='Брони за месяц'
                    value={formatNumber(data?.summary.bookings ?? 0)}
                    icon={CalendarDays}
                    className='text-orange-400'
                />
                <SummaryCard
                    label='Выручка за месяц'
                    value={formatMoney(data?.summary.revenue ?? 0)}
                    icon={Wallet}
                    className='text-brand'
                />
            </div>

            <DataTable
                columns={columns}
                rows={data?.items ?? []}
                total={data?.total ?? 0}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={size => {
                    setPageSize(size);
                    setPage(1);
                }}
                sortKey={sortKey}
                sortOrder={sortOrder}
                onSortChange={handleSort}
                getRowKey={row => row.id}
                isLoading={isLoading}
                emptyMessage={
                    debouncedSearch
                        ? 'По вашему запросу сотрудники не найдены'
                        : 'В организации пока нет сотрудников'
                }
                minWidthClassName='min-w-[980px]'
            />
        </div>
    );
}
