'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import {ProgressBar} from '@/components/dashboard/stat-card';
import {LoadBarChart} from '@/components/dashboard/charts';
import {
    Activity,
    CalendarDays,
    CalendarX2,
    Clock,
    LayoutGrid,
    Loader2,
    LogIn,
    LogOut,
    Play,
    RefreshCw,
    Users,
    type LucideIcon
} from 'lucide-react';
import {formatDateTime, formatDuration, formatMoney, formatNumber} from '@/lib/format';
import {formatPhone} from '@/lib/phone';
import {
    bookingStatusKeyFromLabel,
    statusBadgeStyle,
    statusButtonStyle,
    type BookingStatusKey
} from '@/lib/org/status';
import {BookingDetailsModal} from './booking-details-modal';
import {
    ManagerShiftResponse,
    ManagerShiftSummary,
    ShiftBooking,
    ShiftStaff
} from '@/types/dashboard';
import type {BookingDetailsResponse} from '@/types/bookings';
import {UserData} from '@/types/auth';
import {toast} from 'sonner';
import axios from 'axios';

const STAFF_STATUS_KEY: Partial<Record<ShiftStaff['status'], BookingStatusKey>> = {
    'На смене': 'seated',
    Заканчивает: 'expected'
};

function formatShiftClock(value: string | null): string {
    if (!value) return '—';

    return new Date(value).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function ShiftStat({label, value}: {label: string; value: string}) {
    return (
        <div className='min-w-[92px]'>
            <p className='text-[10px] uppercase tracking-wider text-app-subtle'>{label}</p>
            <p className='mt-0.5 text-sm font-semibold text-app-fg'>{value}</p>
        </div>
    );
}

function OccupancyRing({value}: {value: number}) {
    const normalized = Math.min(100, Math.max(0, value));
    const degrees = normalized * 3.6;

    return (
        <div className='relative h-20 w-20 shrink-0 rounded-full bg-app-fg/10'>
            <div
                className='absolute inset-0 rounded-full'
                style={{
                    background: `conic-gradient(var(--brand) 0deg ${degrees}deg, transparent ${degrees}deg 360deg)`
                }}
            />
            <div className='absolute inset-2 flex items-center justify-center rounded-full bg-surface'>
                <span className='text-lg font-bold text-app-fg'>{Math.round(normalized)}%</span>
            </div>
        </div>
    );
}

function MetricRow({
    icon: Icon,
    label,
    value,
    iconClassName
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    iconClassName?: string;
}) {
    return (
        <div className='flex items-center justify-between gap-3'>
            <span className='flex items-center gap-2 text-xs text-app-muted'>
                <Icon size={14} className={iconClassName ?? 'text-app-subtle'} />
                {label}
            </span>
            <span className='text-sm font-semibold text-app-fg'>{value}</span>
        </div>
    );
}

/** Дашборд менеджера: операционная работа смены (без финансов и точек) */
export function ManagerDashboard({user}: {user: UserData}) {
    const [shift, setShift] = useState<ManagerShiftSummary | null>(null);
    const [isSummaryLoading, setIsSummaryLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isShiftActionLoading, setIsShiftActionLoading] = useState(false);
    const [startingBookingId, setStartingBookingId] = useState<number | null>(null);
    const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const fetchShift = useCallback(async (force = false) => {
        const {data} = await axios.get<ManagerShiftResponse>('/api/dashboard/shift', {
            params: force ? {refresh: '1'} : undefined
        });
        if (isMountedRef.current && data.success) setShift(data.data);
    }, []);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await fetchShift(true);
            toast.success('Смена обновлена');
        } catch {
            toast.error('Не удалось обновить данные смены');
        } finally {
            if (isMountedRef.current) setIsRefreshing(false);
        }
    }, [fetchShift]);

    const handleStartBooking = useCallback(
        async (booking: ShiftBooking) => {
            const bookingId = Number(booking.id);

            setStartingBookingId(bookingId);
            try {
                const {data} = await axios.patch<BookingDetailsResponse>(
                    `/api/bookings/${bookingId}`,
                    {action: 'start'}
                );

                if (data.success) {
                    toast.success('Визит начат');
                    await handleRefresh();
                } else {
                    toast.error(
                        typeof data.data === 'string'
                            ? data.data
                            : 'Не удалось начать визит'
                    );
                }
            } catch (err) {
                if (axios.isAxiosError(err)) {
                    toast.error(
                        err.response?.data?.data ??
                            err.response?.data?.error ??
                            'Не удалось начать визит'
                    );
                } else {
                    toast.error('Неизвестная ошибка');
                }
            } finally {
                if (isMountedRef.current) setStartingBookingId(null);
            }
        },
        [handleRefresh]
    );

    const handleShiftAction = useCallback(async (action: 'start' | 'finish') => {
        setIsShiftActionLoading(true);
        try {
            const {data} = await axios.post<ManagerShiftResponse>(
                `/api/dashboard/shift/${action}`
            );

            if (data.success) {
                setShift(data.data);
                toast.success(action === 'start' ? 'Вы вышли на смену' : 'Смена завершена');
            } else {
                toast.error(
                    typeof data.data === 'string' ? data.data : 'Не удалось изменить смену'
                );
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                toast.error(
                    err.response?.data?.data ??
                        err.response?.data?.error ??
                        'Не удалось изменить смену'
                );
            } else {
                toast.error('Неизвестная ошибка');
            }
        } finally {
            if (isMountedRef.current) setIsShiftActionLoading(false);
        }
    }, []);

    useEffect(() => {
        const handleBookingCreated = () => {
            void handleRefresh();
        };

        window.addEventListener('booking-created', handleBookingCreated);
        return () => window.removeEventListener('booking-created', handleBookingCreated);
    }, [handleRefresh]);

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

    const myBookings = useMemo(
        () => (shift?.bookings ?? []).filter(booking => booking.isMine),
        [shift]
    );

    const kpi = shift?.kpi;
    const personal = shift?.personal;
    const shiftInfo = personal?.shift;
    const hasShift = Boolean(shiftInfo?.id);
    const isOnShift = Boolean(shiftInfo?.isActive);
    const shiftRevenue = hasShift ? shiftInfo?.revenue ?? 0 : personal?.revenue ?? 0;
    const shiftBookings = hasShift ? shiftInfo?.bookings ?? 0 : personal?.bookings ?? 0;
    const shiftGuests = hasShift ? shiftInfo?.guests ?? 0 : personal?.guests ?? 0;
    const shiftAverageCheck = hasShift
        ? shiftInfo?.averageCheck ?? 0
        : personal?.averageCheck ?? 0;
    const shiftCancellations = hasShift
        ? shiftInfo?.cancellations ?? 0
        : personal?.cancellations ?? 0;
    const shiftDescription = !hasShift
        ? 'Нажмите «Выйти на смену», чтобы начать учёт'
        : isOnShift
          ? `С ${formatShiftClock(shiftInfo?.startedAt ?? null)} · ${formatDuration(
                shiftInfo?.durationMinutes ?? 0
            )}`
          : `С ${formatShiftClock(shiftInfo?.startedAt ?? null)} до ${formatShiftClock(
                shiftInfo?.endedAt ?? null
            )} · ${formatDuration(shiftInfo?.durationMinutes ?? 0)}`;
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

            {/* Моя смена: статус, личная выручка и управление сменой */}
            {isSummaryLoading || !personal ? (
                <Skeleton className='mb-4 h-28 w-full' />
            ) : (
                <Card className='mb-4 border-app-border bg-surface/60 backdrop-blur-sm'>
                    <CardContent className='flex flex-wrap items-center gap-x-6 gap-y-4 p-4'>
                        <div className='flex min-w-[220px] items-center gap-3'>
                            <span
                                className={[
                                    'flex h-10 w-10 items-center justify-center rounded-xl',
                                    isOnShift
                                        ? 'bg-emerald-500/10 text-emerald-400'
                                        : hasShift
                                          ? 'bg-brand/10 text-brand'
                                          : 'bg-app-fg/10 text-app-muted'
                                ].join(' ')}
                            >
                                {isOnShift ? <Activity size={20} /> : <Clock size={20} />}
                            </span>
                            <div>
                                <p className='text-sm font-semibold text-app-fg'>
                                    {isOnShift
                                        ? 'Вы на смене'
                                        : hasShift
                                          ? 'Смена завершена'
                                          : 'Вы не на смене'}
                                </p>
                                <p className='text-xs text-app-subtle'>{shiftDescription}</p>
                            </div>
                        </div>

                        <div className='flex flex-1 flex-wrap items-center gap-x-6 gap-y-3'>
                            <ShiftStat
                                label={hasShift ? 'Моя выручка за смену' : 'Моя выручка за сегодня'}
                                value={formatMoney(shiftRevenue)}
                            />
                            <ShiftStat
                                label='Мои брони'
                                value={formatNumber(shiftBookings)}
                            />
                            <ShiftStat label='Гости' value={formatNumber(shiftGuests)} />
                            <ShiftStat
                                label='Средний чек'
                                value={formatMoney(shiftAverageCheck)}
                            />
                            <ShiftStat
                                label='Отмены'
                                value={formatNumber(shiftCancellations)}
                            />
                        </div>

                        <Button
                            type='button'
                            variant={isOnShift ? 'outline' : 'default'}
                            onClick={() =>
                                void handleShiftAction(isOnShift ? 'finish' : 'start')
                            }
                            disabled={isShiftActionLoading}
                            className={
                                isOnShift
                                    ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/15 hover:text-red-300'
                                    : 'bg-brand font-semibold text-brand-fg hover:bg-brand/90'
                            }
                        >
                            {isShiftActionLoading ? (
                                <Loader2 size={15} className='animate-spin' />
                            ) : isOnShift ? (
                                <LogOut size={15} />
                            ) : (
                                <LogIn size={15} />
                            )}
                            {isShiftActionLoading
                                ? 'Сохраняем…'
                                : isOnShift
                                  ? 'Закончить смену'
                                  : 'Выйти на смену'}
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div
                className={[
                    'transition-opacity duration-200',
                    isRefreshing ? 'opacity-60' : 'opacity-100'
                ].join(' ')}
            >
                {/* Пульт смены */}
                {isSummaryLoading || !kpi ? (
                    <Skeleton className='h-[164px] w-full rounded-xl' />
                ) : (
                    <Card className='relative overflow-hidden border-app-border bg-surface/60 backdrop-blur-sm'>
                        <div className='pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-brand/10 blur-3xl' />
                        <CardContent className='grid p-0 lg:grid-cols-[1.15fr_0.85fr_1fr]'>
                            {/* Брони и гости */}
                            <div className='relative p-5'>
                                <p className='text-[11px] font-medium uppercase tracking-wider text-app-muted'>
                                    Смена сегодня
                                </p>
                                <div className='mt-3 flex flex-wrap items-end gap-x-6 gap-y-2'>
                                    <div>
                                        <p className='text-4xl font-bold leading-none text-app-fg'>
                                            {formatNumber(kpi.bookingsToday)}
                                        </p>
                                        <p className='mt-1 text-xs text-app-subtle'>броней</p>
                                    </div>
                                    <div>
                                        <p className='text-2xl font-semibold leading-none text-app-fg'>
                                            {formatNumber(kpi.guestsToday)}
                                        </p>
                                        <p className='mt-1 flex items-center gap-1 text-xs text-app-subtle'>
                                            <Users size={12} /> гостей
                                        </p>
                                    </div>
                                </div>
                                <div className='mt-4 flex flex-wrap gap-2'>
                                    <span className='inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-medium text-brand'>
                                        <Activity size={11} /> пик в {peakHour}
                                    </span>
                                    <span className='inline-flex items-center rounded-full bg-app-fg/5 px-2.5 py-1 text-[11px] text-app-muted'>
                                        {kpi.bookingsToday
                                            ? `≈ ${(kpi.guestsToday / kpi.bookingsToday).toFixed(1)} гостей на бронь`
                                            : 'нет броней'}
                                    </span>
                                </div>
                            </div>

                            {/* Загрузка зала */}
                            <div className='relative flex flex-col justify-center border-t border-app-border/60 p-5 lg:border-l lg:border-t-0'>
                                <p className='text-[11px] font-medium uppercase tracking-wider text-app-muted'>
                                    Загрузка зала
                                </p>
                                <div className='mt-3 flex items-center gap-4'>
                                    <OccupancyRing value={kpi.occupancy} />
                                    <div>
                                        <p className='text-2xl font-bold leading-none text-app-fg'>
                                            {kpi.tablesBusy}/{kpi.tablesTotal}
                                        </p>
                                        <p className='mt-1 flex items-center gap-1 text-xs text-app-subtle'>
                                            <LayoutGrid size={12} /> столов занято
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Вторичные показатели */}
                            <div className='relative border-t border-app-border/60 p-5 lg:border-l lg:border-t-0'>
                                <div className='flex h-full flex-col justify-center gap-4'>
                                    <MetricRow
                                        icon={Clock}
                                        label='Среднее время'
                                        value={formatDuration(kpi.averageVisitMinutes)}
                                        iconClassName='text-yellow-400'
                                    />
                                    <MetricRow
                                        icon={CalendarX2}
                                        label='Отмены'
                                        value={formatNumber(kpi.cancellations)}
                                        iconClassName='text-red-400'
                                    />
                                    <MetricRow
                                        icon={CalendarDays}
                                        label='Ожидаются'
                                        value={formatNumber(kpi.expectedArrivals)}
                                        iconClassName='text-brand'
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Брони (слева) + «Моя смена» и «Кто на смене» (справа, друг под другом) */}
                <div className='mt-4 grid grid-cols-1 items-stretch gap-3 lg:grid-cols-5'>
                    <Card className='flex min-h-[320px] flex-col border-app-border bg-surface/60 backdrop-blur-sm lg:col-span-3'>
                        <CardHeader
                            className={`${sectionHeader} flex flex-row flex-wrap items-center justify-between gap-2`}
                        >
                            <CardTitle>Мои брони сегодня</CardTitle>
                            <Link
                                href='/dashboard/bookings'
                                className='text-xs font-medium text-brand transition-colors hover:text-brand/80'
                            >
                                Все брони
                            </Link>
                        </CardHeader>
                        <CardContent className='flex min-h-0 flex-1 flex-col p-4 pt-0'>
                            {isSummaryLoading || !shift ? (
                                <div className='space-y-2'>
                                    {[0, 1, 2, 3].map(cell => (
                                        <Skeleton key={cell} className='h-[72px] w-full' />
                                    ))}
                                </div>
                            ) : myBookings.length === 0 ? (
                                <div className='flex flex-1 flex-col items-center justify-center gap-2 text-sm text-app-subtle'>
                                    <p>У вас пока нет броней на сегодня</p>
                                    <Link
                                        href='/dashboard/bookings'
                                        className='text-xs font-medium text-brand hover:text-brand/80'
                                    >
                                        Перейти к бронированиям
                                    </Link>
                                </div>
                            ) : (
                                <div className='space-y-2'>
                                    {myBookings.slice(0, 4).map(booking => (
                                        <div
                                            key={booking.id}
                                            role='button'
                                            tabIndex={0}
                                            title={
                                                booking.phone
                                                    ? `${booking.guestName}, ${formatPhone(
                                                          booking.phone
                                                      )}`
                                                    : booking.guestName
                                            }
                                            onClick={() =>
                                                setSelectedBookingId(Number(booking.id))
                                            }
                                            onKeyDown={event => {
                                                if (
                                                    event.key === 'Enter' ||
                                                    event.key === ' '
                                                ) {
                                                    event.preventDefault();
                                                    setSelectedBookingId(Number(booking.id));
                                                }
                                            }}
                                            className='flex cursor-pointer items-center gap-3 rounded-lg border border-app-border/60 bg-surface-2/30 p-3 transition-colors hover:border-app-border hover:bg-surface-2/60 focus-visible:border-brand/60 focus-visible:outline-none'
                                        >
                                            <div className='min-w-0 flex-1'>
                                                <div className='flex flex-wrap items-center gap-2'>
                                                    <span className='font-mono text-[13px] font-semibold text-app-fg'>
                                                        {booking.time}–{booking.endTime}
                                                    </span>
                                                    <span
                                                        className='whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium'
                                                        style={statusBadgeStyle(
                                                            bookingStatusKeyFromLabel(
                                                                booking.status
                                                            )
                                                        )}
                                                    >
                                                        {booking.status}
                                                    </span>
                                                </div>
                                                <p className='mt-0.5 truncate text-sm font-medium text-app-fg/90'>
                                                    {booking.guestName}
                                                </p>
                                                <p className='truncate text-[11px] text-app-subtle'>
                                                    {booking.table} · {booking.guests} гостей ·{' '}
                                                    {booking.locationName}
                                                </p>
                                            </div>
                                            {booking.status === 'Ожидается' && (
                                                <button
                                                    type='button'
                                                    title='Начать визит'
                                                    aria-label='Начать визит'
                                                    disabled={
                                                        startingBookingId ===
                                                        Number(booking.id)
                                                    }
                                                    onClick={event => {
                                                        event.stopPropagation();
                                                        void handleStartBooking(booking);
                                                    }}
                                                    style={statusButtonStyle('seated')}
                                                    className='flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-all hover:opacity-80 disabled:cursor-wait disabled:opacity-50'
                                                >
                                                    {startingBookingId ===
                                                    Number(booking.id) ? (
                                                        <Loader2
                                                            size={14}
                                                            className='animate-spin'
                                                        />
                                                    ) : (
                                                        <Play
                                                            size={14}
                                                            fill='currentColor'
                                                        />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {myBookings.length > 4 && (
                                        <Link
                                            href='/dashboard/bookings'
                                            className='block pt-1 text-center text-xs font-medium text-brand hover:text-brand/80'
                                        >
                                            Ещё {myBookings.length - 4} броней
                                        </Link>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className='flex min-h-0 flex-col gap-3 lg:col-span-2'>
                        <Card className='border-app-border bg-surface/60 backdrop-blur-sm'>
                            <CardHeader className={sectionHeader}>
                                <CardTitle>Мои показатели за сегодня</CardTitle>
                            </CardHeader>
                            <CardContent className={sectionContent}>
                                {isSummaryLoading || !personal ? (
                                    <div className='grid grid-cols-2 gap-3'>
                                        {[0, 1, 2, 3, 4, 5].map(cell => (
                                            <Skeleton key={cell} className='h-16 w-full' />
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        <div className='grid grid-cols-2 gap-3'>
                                            <div className='rounded-lg border border-app-border/60 px-3 py-2.5'>
                                                <p className='text-[11px] uppercase tracking-wider text-app-subtle'>
                                                    Моя выручка
                                                </p>
                                                <p className='mt-1 text-lg font-bold text-app-fg'>
                                                    {formatMoney(personal.revenue)}
                                                </p>
                                            </div>
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
                                                    Средний чек
                                                </p>
                                                <p className='mt-1 text-lg font-bold text-app-fg'>
                                                    {formatMoney(personal.averageCheck)}
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
                                                          STAFF_STATUS_KEY[person.status]
                                                              ? ''
                                                              : 'bg-app-fg/10 text-app-muted'
                                                      ].join(' ')}
                                                      style={
                                                          STAFF_STATUS_KEY[person.status]
                                                              ? statusBadgeStyle(
                                                                    STAFF_STATUS_KEY[
                                                                        person.status
                                                                    ]!
                                                                )
                                                              : undefined
                                                      }
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

            <BookingDetailsModal
                open={selectedBookingId !== null}
                bookingId={selectedBookingId}
                onClose={() => setSelectedBookingId(null)}
                onUpdated={() => {
                    void handleRefresh();
                }}
            />
        </div>
    );
}
