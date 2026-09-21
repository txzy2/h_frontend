'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import {StatCard, ProgressBar} from '@/components/dashboard/stat-card';
import {LoadBarChart} from '@/components/dashboard/charts';
import {
    Activity,
    CalendarDays,
    CalendarX2,
    Clock,
    LayoutGrid,
    RefreshCw,
    Users
} from 'lucide-react';
import {formatDateTime, formatDuration, formatNumber} from '@/lib/format';
import {
    ManagerShiftResponse,
    ManagerShiftSummary,
    ShiftBookingStatus,
    ShiftStaff
} from '@/types/dashboard';
import {UserData} from '@/types/auth';
import {toast} from 'sonner';
import axios from 'axios';

const BOOKING_STATUS_STYLES: Record<ShiftBookingStatus, string> = {
    Завершена: 'bg-app-fg/10 text-app-muted',
    'За столом': 'bg-emerald-500/10 text-emerald-400',
    Ожидается: 'bg-brand/10 text-brand',
    Отменена: 'bg-red-500/10 text-red-400'
};

const BOOKING_STATUS_BARS: Record<ShiftBookingStatus, string> = {
    Завершена: 'bg-app-fg/20',
    'За столом': 'bg-emerald-400',
    Ожидается: 'bg-brand',
    Отменена: 'bg-red-400'
};

const STAFF_STATUS_STYLES: Record<ShiftStaff['status'], string> = {
    'На смене': 'bg-emerald-500/10 text-emerald-400',
    Заканчивает: 'bg-brand/10 text-brand',
    Скоро: 'bg-app-fg/10 text-app-muted'
};

const BOOKING_FILTERS = [
    {key: 'all', label: 'Все'},
    {key: 'expected', label: 'Ожидаются'},
    {key: 'inHall', label: 'В зале'},
    {key: 'past', label: 'Прошедшие'},
    {key: 'mine', label: 'Мои'}
] as const;

type BookingFilterKey = (typeof BOOKING_FILTERS)[number]['key'];

/** Дашборд менеджера: операционная работа смены (без финансов и точек) */
export function ManagerDashboard({user}: {user: UserData}) {
    const [shift, setShift] = useState<ManagerShiftSummary | null>(null);
    const [isSummaryLoading, setIsSummaryLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [bookingFilter, setBookingFilter] = useState<BookingFilterKey>('all');
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const fetchShift = useCallback(async () => {
        const {data} = await axios.get<ManagerShiftResponse>('/api/dashboard/shift');
        if (isMountedRef.current && data.success) setShift(data.data);
    }, []);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await fetchShift();
            toast.success('Смена обновлена');
        } catch {
            toast.error('Не удалось обновить данные смены');
        } finally {
            if (isMountedRef.current) setIsRefreshing(false);
        }
    }, [fetchShift]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                await fetchShift();
            } catch {
                // ignore — покажем пустое состояние
            } finally {
                if (!cancelled) setIsSummaryLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [fetchShift]);

    const peakHour = useMemo(() => {
        if (!shift?.loadByHour.length) return '—';
        return shift.loadByHour.reduce((best, point) =>
            point.bookings > best.bookings ? point : best
        ).hour;
    }, [shift]);

    const bookingCounts = useMemo(() => {
        const bookings = shift?.bookings ?? [];
        return {
            all: bookings.length,
            expected: bookings.filter(booking => booking.status === 'Ожидается').length,
            inHall: bookings.filter(booking => booking.status === 'За столом').length,
            past: bookings.filter(
                booking => booking.status === 'Завершена' || booking.status === 'Отменена'
            ).length,
            mine: bookings.filter(booking => booking.isMine).length
        };
    }, [shift]);

    const filteredBookings = useMemo(() => {
        const bookings = shift?.bookings ?? [];

        if (bookingFilter === 'expected') {
            return bookings.filter(booking => booking.status === 'Ожидается');
        }
        if (bookingFilter === 'inHall') {
            return bookings.filter(booking => booking.status === 'За столом');
        }
        if (bookingFilter === 'past') {
            return bookings.filter(
                booking => booking.status === 'Завершена' || booking.status === 'Отменена'
            );
        }
        if (bookingFilter === 'mine') {
            return bookings.filter(booking => booking.isMine);
        }

        return bookings;
    }, [shift, bookingFilter]);

    const kpi = shift?.kpi;
    const personal = shift?.personal;
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
                        Смена сегодня: брони, загрузка и кто на смене
                    </p>
                </div>

                <div className='flex flex-wrap items-center gap-2 text-xs text-app-subtle'>
                    {shift?.isMock && (
                        <span className='rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-[11px] font-medium text-brand'>
                            Демо-данные
                        </span>
                    )}
                    {shift && (
                        <span className='hidden sm:inline'>
                            обновлено {formatDateTime(shift.generatedAt)}
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

            <div
                className={[
                    'transition-opacity duration-200',
                    isRefreshing ? 'opacity-60' : 'opacity-100'
                ].join(' ')}
            >
                {/* KPI смены */}
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
                            label='Брони сегодня'
                            value={formatNumber(kpi.bookingsToday)}
                            hint={`ожидаются: ${formatNumber(kpi.expectedArrivals)}`}
                            icon={CalendarDays}
                            iconClassName='text-orange-400'
                        />
                        <StatCard
                            label='Гости сегодня'
                            value={formatNumber(kpi.guestsToday)}
                            hint={`столов занято: ${kpi.tablesBusy} из ${kpi.tablesTotal}`}
                            icon={Users}
                            iconClassName='text-sky-400'
                        />
                        <StatCard
                            label='Занято столов'
                            value={`${kpi.tablesBusy}/${kpi.tablesTotal}`}
                            hint={`загруженность ${kpi.occupancy}%`}
                            icon={LayoutGrid}
                            iconClassName='text-emerald-400'
                        />
                        <StatCard
                            label='Среднее время визита'
                            value={formatDuration(kpi.averageVisitMinutes)}
                            hint='по активным визитам'
                            icon={Clock}
                            iconClassName='text-yellow-400'
                        />
                        <StatCard
                            label='Загруженность'
                            value={`${kpi.occupancy}%`}
                            hint={`пик в ${peakHour}`}
                            icon={Activity}
                        />
                        <StatCard
                            label='Отмены'
                            value={formatNumber(kpi.cancellations)}
                            hint='за сегодня'
                            icon={CalendarX2}
                            iconClassName='text-red-400'
                        />
                    </div>
                )}

                {/* Брони (слева) + «Моя смена» и «Кто на смене» (справа, друг под другом) */}
                <div className='mt-4 grid grid-cols-1 items-stretch gap-3 lg:grid-cols-5'>
                    <Card className='flex min-h-[420px] flex-col border-app-border bg-surface/60 backdrop-blur-sm lg:col-span-3'>
                        <CardHeader
                            className={`${sectionHeader} flex flex-wrap items-center justify-between gap-x-3 gap-y-2`}
                        >
                            <CardTitle>Брони на сегодня</CardTitle>
                            <div className='flex flex-wrap items-center gap-0.5 rounded-lg border border-app-border bg-surface-2/40 p-0.5'>
                                {BOOKING_FILTERS.map(filter => {
                                    const isActive = filter.key === bookingFilter;
                                    const count = bookingCounts[filter.key];

                                    return (
                                        <button
                                            key={filter.key}
                                            type='button'
                                            onClick={() => setBookingFilter(filter.key)}
                                            title={
                                                filter.key === 'mine'
                                                    ? 'Только мои брони'
                                                    : undefined
                                            }
                                            className={[
                                                'flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors',
                                                isActive
                                                    ? 'bg-surface font-medium text-app-fg shadow-sm'
                                                    : 'text-app-muted hover:text-app-fg'
                                            ].join(' ')}
                                        >
                                            {filter.key === 'mine' && (
                                                <span
                                                    className={[
                                                        'h-1.5 w-1.5 rounded-full',
                                                        isActive ? 'bg-brand' : 'bg-app-fg/30'
                                                    ].join(' ')}
                                                />
                                            )}
                                            {filter.label}
                                            <span className='text-app-subtle'>{count}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </CardHeader>
                        <CardContent className='flex min-h-0 flex-1 flex-col p-4 pt-0'>
                            {isSummaryLoading || !shift ? (
                                <div className='grid min-h-0 flex-1 grid-cols-1 content-start gap-2 overflow-hidden sm:grid-cols-2 xl:grid-cols-3'>
                                    {[0, 1, 2, 3, 4, 5].map(cell => (
                                        <Skeleton key={cell} className='h-[100px] w-full' />
                                    ))}
                                </div>
                            ) : filteredBookings.length === 0 ? (
                                <div className='flex min-h-0 flex-1 items-center justify-center text-sm text-app-subtle'>
                                    По этому фильтру броней нет
                                </div>
                            ) : (
                                <div className='grid min-h-0 flex-1 grid-cols-1 content-start gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3 [scrollbar-width:thin]'>
                                    {filteredBookings.map(booking => (
                                        <div
                                            key={booking.id}
                                            title={
                                                booking.phone
                                                    ? `${booking.guestName}, ${booking.phone}`
                                                    : booking.guestName
                                            }
                                            className='relative flex h-[100px] flex-col justify-between overflow-hidden rounded-lg border border-app-border/60 bg-surface-2/30 p-3 transition-colors hover:border-app-border hover:bg-surface-2/60'
                                        >
                                            <span
                                                className={[
                                                    'absolute inset-y-0 left-0 w-1',
                                                    BOOKING_STATUS_BARS[booking.status]
                                                ].join(' ')}
                                            />

                                            <div className='flex items-start justify-between gap-2 pl-2'>
                                                <div className='min-w-0'>
                                                    <p className='font-mono text-sm font-semibold text-app-fg'>
                                                        {booking.time}
                                                    </p>
                                                    <p className='mt-0.5 truncate text-sm font-medium text-app-fg/90'>
                                                        {booking.guestName}
                                                    </p>
                                                </div>
                                                <span
                                                    className={[
                                                        'shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium',
                                                        BOOKING_STATUS_STYLES[booking.status]
                                                    ].join(' ')}
                                                >
                                                    {booking.status}
                                                </span>
                                            </div>

                                            <div className='flex items-center justify-between gap-2 pl-2 text-[11px] text-app-subtle'>
                                                <span className='truncate'>
                                                    {booking.table} · {booking.guests} гостей
                                                </span>
                                                {booking.isMine && (
                                                    <span className='shrink-0 rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand'>
                                                        моя
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className='flex min-h-0 flex-col gap-3 lg:col-span-2'>
                        <Card className='border-app-border bg-surface/60 backdrop-blur-sm'>
                            <CardHeader className={sectionHeader}>
                                <CardTitle>Моя смена</CardTitle>
                            </CardHeader>
                            <CardContent className={sectionContent}>
                                {isSummaryLoading || !personal ? (
                                    <div className='grid grid-cols-2 gap-3'>
                                        {[0, 1, 2, 3].map(cell => (
                                            <Skeleton key={cell} className='h-16 w-full' />
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        <div className='grid grid-cols-2 gap-3'>
                                            <div className='rounded-lg border border-app-border/60 px-3 py-2.5'>
                                                <p className='text-[11px] uppercase tracking-wider text-app-subtle'>
                                                    Мои брони
                                                </p>
                                                <p className='mt-1 text-lg font-bold text-app-fg'>
                                                    {formatNumber(personal.bookings)}
                                                </p>
                                            </div>
                                            <div className='rounded-lg border border-app-border/60 px-3 py-2.5'>
                                                <p className='text-[11px] uppercase tracking-wider text-app-subtle'>
                                                    Мои гости
                                                </p>
                                                <p className='mt-1 text-lg font-bold text-app-fg'>
                                                    {formatNumber(personal.guests)}
                                                </p>
                                            </div>
                                            <div className='rounded-lg border border-app-border/60 px-3 py-2.5'>
                                                <p className='text-[11px] uppercase tracking-wider text-app-subtle'>
                                                    Отмены
                                                </p>
                                                <p className='mt-1 text-lg font-bold text-app-fg'>
                                                    {formatNumber(personal.cancellations)}
                                                </p>
                                            </div>
                                            <div className='rounded-lg border border-app-border/60 px-3 py-2.5'>
                                                <p className='text-[11px] uppercase tracking-wider text-app-subtle'>
                                                    Ср. время
                                                </p>
                                                <p className='mt-1 text-lg font-bold text-app-fg'>
                                                    {formatDuration(personal.averageVisitMinutes)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className='mt-4'>
                                            <div className='mb-1.5 flex items-center justify-between text-xs'>
                                                <span className='text-app-subtle'>Цель смены</span>
                                                <span className='text-app-fg/80'>
                                                    {personal.bookings} из {personal.goal}
                                                </span>
                                            </div>
                                            <ProgressBar
                                                value={(personal.bookings / personal.goal) * 100}
                                            />
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card className='flex min-h-0 flex-1 flex-col border-app-border bg-surface/60 backdrop-blur-sm'>
                            <CardHeader className={sectionHeader}>
                                <CardTitle>Кто на смене</CardTitle>
                            </CardHeader>
                            <CardContent className='flex min-h-0 flex-1 flex-col overflow-y-auto p-4 pt-0 [scrollbar-width:thin]'>
                                <div className='space-y-1'>
                                    {isSummaryLoading || !shift
                                        ? [0, 1, 2].map(row => (
                                              <Skeleton key={row} className='h-12 w-full' />
                                          ))
                                        : shift.staff.map(person => (
                                              <div
                                                  key={person.id}
                                                  className='flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-2/60'
                                              >
                                                  <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-fg/10 text-[11px] font-semibold text-app-muted'>
                                                      {person.name
                                                          .split(' ')
                                                          .map(part => part[0])
                                                          .join('')
                                                          .slice(0, 2)}
                                                  </span>
                                                  <div className='min-w-0 flex-1'>
                                                      <p className='truncate text-sm font-medium text-app-fg/90'>
                                                          {person.name}
                                                      </p>
                                                      <p className='truncate text-[11px] text-app-subtle'>
                                                          {person.role} · {person.timeRange}
                                                      </p>
                                                  </div>
                                                  <span
                                                      className={[
                                                          'shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium',
                                                          STAFF_STATUS_STYLES[person.status]
                                                      ].join(' ')}
                                                  >
                                                      {person.status}
                                                  </span>
                                              </div>
                                          ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Загрузка по часам */}
                <Card className='mt-3 border-app-border bg-surface/60 backdrop-blur-sm'>
                    <CardHeader className={sectionHeader}>
                        <CardTitle>Загрузка по часам</CardTitle>
                    </CardHeader>
                    <CardContent className={sectionContent}>
                        {isSummaryLoading || !shift ? (
                            <Skeleton className='h-40 w-full' />
                        ) : (
                            <LoadBarChart points={shift.loadByHour} />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
