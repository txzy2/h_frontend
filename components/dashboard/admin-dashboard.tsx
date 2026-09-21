'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import {StatCard, TrendBadge, ProgressBar} from '@/components/dashboard/stat-card';
import {RevenueAreaChart, RevenueDonut} from '@/components/dashboard/charts';
import {
    Activity,
    CalendarDays,
    Loader2,
    Medal,
    RefreshCw,
    Star,
    TrendingUp,
    UserPlus,
    Users,
    Wallet
} from 'lucide-react';
import {
    DEFAULT_REVENUE_PERIOD,
    REVENUE_PERIOD_OPTIONS,
    RevenuePeriodKey
} from '@/lib/dashboard/periods';
import {
    formatDateTime,
    formatMoney,
    formatMoneyCompact,
    formatNumber
} from '@/lib/format';
import {
    DashboardSummary,
    DashboardSummaryResponse,
    RevenuePeriod,
    RevenuePeriodResponse
} from '@/types/dashboard';
import {UserData} from '@/types/auth';
import {toast} from 'sonner';
import axios from 'axios';

const DONUT_COLORS = ['var(--brand)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

/** Дашборд администратора: выручка, финансы, прибыльность точек */
export function AdminDashboard({user}: {user: UserData}) {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [isSummaryLoading, setIsSummaryLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [periodKey, setPeriodKey] = useState<RevenuePeriodKey>(DEFAULT_REVENUE_PERIOD);
    const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod | null>(null);
    const [isRevenueLoading, setIsRevenueLoading] = useState(true);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const fetchSummary = useCallback(async () => {
        const {data} = await axios.get<DashboardSummaryResponse>('/api/dashboard/summary');
        if (isMountedRef.current && data.success) setSummary(data.data);
    }, []);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await fetchSummary();
            toast.success('Статистика обновлена');
        } catch {
            toast.error('Не удалось обновить статистику');
        } finally {
            if (isMountedRef.current) setIsRefreshing(false);
        }
    }, [fetchSummary]);

    // Сводка для главной (пока демо-данные с бэкенда Next.js)
    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                await fetchSummary();
            } catch {
                // ignore — покажем пустое состояние
            } finally {
                if (!cancelled) setIsSummaryLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [fetchSummary]);

    const peakHour = useMemo(() => {
        if (!summary?.loadByHour.length) return '—';
        return summary.loadByHour.reduce((best, point) =>
            point.bookings > best.bookings ? point : best
        ).hour;
    }, [summary]);

    // Выручка за выбранный период: загружается при переключении, с прелоадером
    useEffect(() => {
        let cancelled = false;
        setIsRevenueLoading(true);

        (async () => {
            try {
                const {data} = await axios.get<RevenuePeriodResponse>('/api/dashboard/revenue', {
                    params: {period: periodKey}
                });
                if (!cancelled && data.success) setRevenuePeriod(data.data);
            } catch {
                // ignore — останется предыдущая серия
            } finally {
                if (!cancelled) setIsRevenueLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [periodKey]);

    const revenueStats = useMemo(() => {
        const points = revenuePeriod?.points ?? [];
        if (!points.length) return {total: 0, max: 0};

        return {
            total: points.reduce((sum, point) => sum + point.revenue, 0),
            max: Math.max(...points.map(point => point.revenue))
        };
    }, [revenuePeriod]);

    const kpi = summary?.kpi;
    const locations = summary?.locations ?? [];
    const employees = summary?.employees ?? [];
    const topLocations = [...locations].sort((a, b) => b.revenue - a.revenue).slice(0, 3);
    const totalLocationRevenue = locations.reduce((sum, location) => sum + location.revenue, 0) || 1;

    // Компактные отступы для карточек-секций
    const sectionHeader = 'px-4 pt-4 pb-2';
    const sectionContent = 'p-4 pt-0';

    return (
        <div className='p-6 lg:p-8'>
            {/* Приветствие */}
            <div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
                <div>
                    <h1 className='text-2xl font-bold text-app-fg'>
                        Добро пожаловать, <span className='text-brand'>{user.name}</span>
                    </h1>
                    <p className='mt-1 text-sm text-app-subtle'>
                        Вот что происходит сегодня в вашем заведении
                    </p>
                </div>

                <div className='flex flex-wrap items-center gap-2 text-xs text-app-subtle'>
                    {summary?.isMock && (
                        <span className='rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-[11px] font-medium text-brand'>
                            Демо-данные
                        </span>
                    )}
                    {summary && (
                        <span className='hidden sm:inline'>
                            обновлено {formatDateTime(summary.generatedAt)}
                        </span>
                    )}
                    <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={handleRefresh}
                        disabled={isSummaryLoading || isRefreshing}
                        className='h-8 gap-2 border-app-border bg-surface/60 text-app-muted hover:bg-surface-2 hover:text-app-fg disabled:opacity-50'
                    >
                        <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                        {isRefreshing ? 'Обновляем…' : 'Обновить'}
                    </Button>
                </div>
            </div>

            {/* Данные: во время обновления слегка притухают */}
            <div
                className={[
                    'transition-opacity duration-200',
                    isRefreshing ? 'opacity-60' : 'opacity-100'
                ].join(' ')}
            >
                {/* KPI: 6 компактных карточек с мини-графиками */}
                {isSummaryLoading || !kpi ? (
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
                        {[0, 1, 2, 3, 4, 5].map(card => (
                            <Card key={card} className='border-app-border bg-surface/60'>
                                <CardContent className='space-y-2 p-4'>
                                    <Skeleton className='h-3 w-20' />
                                    <Skeleton className='h-6 w-24' />
                                    <Skeleton className='h-4 w-full' />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
                        <StatCard
                            label='Выручка сегодня'
                            value={formatMoney(kpi.revenueToday)}
                            hint={`за месяц ${formatMoneyCompact(kpi.revenueMonth)}`}
                            icon={Wallet}
                            trend={kpi.revenueTrend}
                            spark={kpi.spark.revenue}
                        />
                        <StatCard
                            label='Броней сегодня'
                            value={formatNumber(kpi.bookingsToday)}
                            hint={`гостей: ${formatNumber(kpi.guestsToday)}`}
                            icon={CalendarDays}
                            iconClassName='text-orange-400'
                            trend={kpi.bookingsTrend}
                            spark={kpi.spark.bookings}
                        />
                        <StatCard
                            label='Гостей сегодня'
                            value={formatNumber(kpi.guestsToday)}
                            hint={`новых: ${formatNumber(kpi.newGuestsToday)}`}
                            icon={Users}
                            iconClassName='text-sky-400'
                            trend={kpi.guestsTrend}
                            spark={kpi.spark.guests}
                        />
                        <StatCard
                            label='Средний чек'
                            value={formatMoney(kpi.averageCheck)}
                            hint={`загруженность ${kpi.occupancy}%`}
                            icon={TrendingUp}
                            iconClassName='text-yellow-400'
                            trend={kpi.averageCheckTrend}
                            spark={kpi.spark.averageCheck}
                        />
                        <StatCard
                            label='Загруженность'
                            value={`${kpi.occupancy}%`}
                            hint={`пик в ${peakHour}`}
                            icon={Activity}
                            iconClassName='text-emerald-400'
                            trend={kpi.occupancyTrend}
                            spark={kpi.spark.occupancy}
                        />
                        <StatCard
                            label='Новые гости'
                            value={formatNumber(kpi.newGuestsToday)}
                            hint={`повторные ${kpi.returningRate}%`}
                            icon={UserPlus}
                            iconClassName='text-violet-400'
                            trend={kpi.newGuestsTrend}
                            spark={kpi.spark.newGuests}
                        />
                    </div>
                )}

                {/* Доля точек (слева) + выручка (справа) */}
                <div className='mt-4 grid grid-cols-1 gap-3 lg:grid-cols-5'>
                    <Card className='border-app-border bg-surface/60 backdrop-blur-sm lg:col-span-2'>
                        <CardHeader className={sectionHeader}>
                            <CardTitle>Доля точек по выручке</CardTitle>
                        </CardHeader>
                        <CardContent className={sectionContent}>
                            {isSummaryLoading || !summary ? (
                                <Skeleton className='h-40 w-full' />
                            ) : (
                                <RevenueDonut
                                    slices={locations.map((location, index) => ({
                                        label: location.name,
                                        value: location.revenue,
                                        color: DONUT_COLORS[index % DONUT_COLORS.length]
                                    }))}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card className='border-app-border bg-surface/60 backdrop-blur-sm lg:col-span-3'>
                        <CardHeader
                            className={`${sectionHeader} flex flex-wrap items-center justify-between gap-x-3 gap-y-2`}
                        >
                            <CardTitle>Выручка</CardTitle>
                            <div className='flex flex-wrap gap-0.5 rounded-lg border border-app-border bg-surface-2/40 p-0.5'>
                                {REVENUE_PERIOD_OPTIONS.map(option => {
                                    const isActive = option.key === periodKey;

                                    return (
                                        <button
                                            key={option.key}
                                            type='button'
                                            onClick={() => setPeriodKey(option.key)}
                                            className={[
                                                'flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors',
                                                isActive
                                                    ? 'bg-surface font-medium text-app-fg shadow-sm'
                                                    : 'text-app-muted hover:text-app-fg'
                                            ].join(' ')}
                                        >
                                            {isRevenueLoading && isActive && (
                                                <Loader2 size={10} className='animate-spin' />
                                            )}
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </CardHeader>
                        <CardContent className={sectionContent}>
                            {!revenuePeriod ? (
                                <div className='relative'>
                                    <Skeleton className='h-28 w-full' />
                                    <div className='absolute inset-0 flex items-center justify-center gap-2 text-xs text-app-subtle'>
                                        <Loader2 size={14} className='animate-spin' />
                                        Загружаем данные…
                                    </div>
                                </div>
                            ) : (
                                <div className='relative'>
                                    <div
                                        className={[
                                            'transition-all duration-200',
                                            isRevenueLoading
                                                ? 'pointer-events-none select-none opacity-40 blur-[3px]'
                                                : ''
                                        ].join(' ')}
                                        aria-busy={isRevenueLoading}
                                    >
                                        <div className='mb-1.5 flex justify-end text-[11px] text-app-subtle'>
                                            <span>
                                                всего{' '}
                                                <span className='font-medium text-app-fg/80'>
                                                    {formatMoneyCompact(revenueStats.total)}
                                                </span>{' '}
                                                · макс. {formatMoney(revenueStats.max)}
                                            </span>
                                        </div>
                                        <RevenueAreaChart points={revenuePeriod.points} />
                                    </div>

                                    {isRevenueLoading && (
                                        <div className='absolute inset-0 flex items-center justify-center gap-2 text-xs font-medium text-app-subtle'>
                                            <Loader2 size={14} className='animate-spin' />
                                            Загружаем данные…
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Самые прибыльные точки */}
                <Card className='mt-3 border-app-border bg-surface/60 backdrop-blur-sm'>
                    <CardHeader
                        className={`${sectionHeader} flex flex-row items-center justify-between`}
                    >
                        <CardTitle>Самые прибыльные точки</CardTitle>
                        <Medal size={16} className='text-brand' />
                    </CardHeader>
                    <CardContent className={sectionContent}>
                        <div className='grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3'>
                            {topLocations.map((location, index) => (
                                <div key={location.id}>
                                    <div className='flex items-center gap-2.5'>
                                        <span
                                            className={[
                                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold',
                                                index === 0
                                                    ? 'bg-brand text-brand-fg'
                                                    : 'bg-app-fg/10 text-app-muted'
                                            ].join(' ')}
                                        >
                                            {index + 1}
                                        </span>
                                        <div className='min-w-0 flex-1'>
                                            <p className='truncate text-sm font-medium text-app-fg/90'>
                                                {location.name}
                                            </p>
                                            <p className='truncate text-[11px] text-app-subtle'>
                                                {location.address}
                                            </p>
                                        </div>
                                        <div className='shrink-0 text-right'>
                                            <p className='whitespace-nowrap text-sm font-semibold text-app-fg'>
                                                {formatMoneyCompact(location.revenue)}
                                            </p>
                                            <TrendBadge value={location.trend} />
                                        </div>
                                    </div>
                                    <ProgressBar
                                        className='mt-2'
                                        value={(location.revenue / totalLocationRevenue) * 100}
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Таблица точек */}
                <Card className='mt-3 border-app-border bg-surface/60 backdrop-blur-sm'>
                    <CardHeader className={sectionHeader}>
                        <CardTitle>Точки</CardTitle>
                    </CardHeader>
                    <CardContent className={`${sectionContent} overflow-x-auto`}>
                        <table className='w-full min-w-[640px] text-sm'>
                            <thead>
                                <tr className='text-left text-xs uppercase tracking-wider text-app-subtle'>
                                    <th className='pb-2.5 font-medium'>Точка</th>
                                    <th className='pb-2.5 text-right font-medium'>Выручка</th>
                                    <th className='pb-2.5 text-right font-medium'>Броней</th>
                                    <th className='pb-2.5 text-right font-medium'>Гостей</th>
                                    <th className='pb-2.5 text-right font-medium'>Ср. чек</th>
                                    <th className='pb-2.5 pl-6 font-medium'>Загруженность</th>
                                    <th className='pb-2.5 text-right font-medium'>Динамика</th>
                                </tr>
                            </thead>
                            <tbody>
                                {locations.map(location => (
                                    <tr key={location.id} className='border-t border-app-border/60'>
                                        <td className='py-2.5'>
                                            <p className='font-medium text-app-fg/90'>
                                                {location.name}
                                            </p>
                                            <p className='text-xs text-app-subtle'>
                                                {location.address}
                                            </p>
                                        </td>
                                        <td className='py-2.5 text-right font-medium text-app-fg/90'>
                                            {formatMoney(location.revenue)}
                                        </td>
                                        <td className='py-2.5 text-right text-app-muted'>
                                            {formatNumber(location.bookings)}
                                        </td>
                                        <td className='py-2.5 text-right text-app-muted'>
                                            {formatNumber(location.guests)}
                                        </td>
                                        <td className='py-2.5 text-right text-app-muted'>
                                            {formatMoney(location.averageCheck)}
                                        </td>
                                        <td className='py-2.5 pl-6'>
                                            <div className='flex items-center gap-2'>
                                                <ProgressBar
                                                    value={location.occupancy}
                                                    className='w-24'
                                                />
                                                <span className='text-xs text-app-muted'>
                                                    {location.occupancy}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className='py-2.5 text-right'>
                                            <TrendBadge value={location.trend} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Таблица сотрудников */}
                <Card className='mt-3 border-app-border bg-surface/60 backdrop-blur-sm'>
                    <CardHeader className={sectionHeader}>
                        <CardTitle>Сотрудники</CardTitle>
                    </CardHeader>
                    <CardContent className={`${sectionContent} overflow-x-auto`}>
                        <table className='w-full min-w-[560px] text-sm'>
                            <thead>
                                <tr className='text-left text-xs uppercase tracking-wider text-app-subtle'>
                                    <th className='pb-2.5 font-medium'>Сотрудник</th>
                                    <th className='pb-2.5 text-right font-medium'>Броней</th>
                                    <th className='pb-2.5 text-right font-medium'>Гостей</th>
                                    <th className='pb-2.5 text-right font-medium'>Выручка</th>
                                    <th className='pb-2.5 text-right font-medium'>Оценка</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map(employee => (
                                    <tr
                                        key={employee.id}
                                        className='border-t border-app-border/60'
                                    >
                                        <td className='py-2.5'>
                                            <div className='flex items-center gap-3'>
                                                <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-fg/10 text-xs font-semibold text-app-muted'>
                                                    {employee.name
                                                        .split(' ')
                                                        .map(part => part[0])
                                                        .join('')
                                                        .slice(0, 2)}
                                                </span>
                                                <div>
                                                    <p className='font-medium text-app-fg/90'>
                                                        {employee.name}
                                                    </p>
                                                    <p className='text-xs text-app-subtle'>
                                                        {employee.role}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className='py-2.5 text-right text-app-muted'>
                                            {formatNumber(employee.bookings)}
                                        </td>
                                        <td className='py-2.5 text-right text-app-muted'>
                                            {formatNumber(employee.guests)}
                                        </td>
                                        <td className='py-2.5 text-right font-medium text-app-fg/90'>
                                            {formatMoney(employee.revenue)}
                                        </td>
                                        <td className='py-2.5 text-right'>
                                            <span className='inline-flex items-center gap-1 text-app-fg/90'>
                                                <Star size={13} className='text-brand' />
                                                {employee.rating.toFixed(1)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
