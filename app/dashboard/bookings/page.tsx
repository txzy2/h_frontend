'use client';

import {BookingCard} from '@/components/dashboard/booking-card';
import {BookingDetailsModal} from '@/components/dashboard/booking-details-modal';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import {formatMoney, formatNumber} from '@/lib/format';
import {useAuthStore} from '@/stores/auth.store';
import {BookingsBoard, BookingsBoardResponse, EmployeeBookingStat} from '@/types/bookings';
import axios from 'axios';
import {CalendarDays, CalendarX2, Clock, RefreshCw, Users, Wallet} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {toast} from 'sonner';

function formatBoardDate(value: string): string {
    return new Date(value).toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
}

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

function EmployeeStats({employees}: {employees: EmployeeBookingStat[]}) {
    return (
        <Card className='border-app-border bg-surface/60 backdrop-blur-sm'>
            <CardHeader className='px-4 pt-4 pb-2'>
                <CardTitle>Статистика по сотрудникам за сегодня</CardTitle>
            </CardHeader>
            <CardContent className='overflow-x-auto p-4 pt-0'>
                <table className='w-full min-w-[720px] text-sm'>
                    <thead>
                        <tr className='text-left text-xs uppercase tracking-wider text-app-subtle'>
                            <th className='pb-2.5 font-medium'>Сотрудник</th>
                            <th className='pb-2.5 text-right font-medium'>Брони</th>
                            <th className='pb-2.5 text-right font-medium'>Гости</th>
                            <th className='pb-2.5 text-right font-medium'>Выручка</th>
                            <th className='pb-2.5 text-right font-medium'>Ср. чек</th>
                            <th className='pb-2.5 text-right font-medium'>Отмены</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(employee => (
                            <tr
                                key={employee.id}
                                className='border-t border-app-border/60'
                            >
                                <td className='py-2.5'>
                                    <p className='font-medium text-app-fg/90'>
                                        {employee.name}
                                    </p>
                                    <p className='text-[11px] text-app-subtle'>
                                        {employee.role}
                                    </p>
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
                                <td className='py-2.5 text-right text-app-muted'>
                                    {formatMoney(employee.averageCheck)}
                                </td>
                                <td className='py-2.5 text-right text-app-muted'>
                                    {formatNumber(employee.cancellations)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
}

export default function BookingsPage() {
    const user = useAuthStore(state => state.user);
    const isAdmin = user?.role === 'Admin' || user?.role === 'SuperUser';

    const [board, setBoard] = useState<BookingsBoard | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<'mine' | 'all'>('mine');
    const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
    const [startingBookingId, setStartingBookingId] = useState<number | null>(null);

    useEffect(() => {
        if (isAdmin) setFilter('all');
    }, [isAdmin]);

    const loadBoard = useCallback(async () => {
        setIsLoading(true);
        setError('');

        try {
            const {data} = await axios.get<BookingsBoardResponse>('/api/bookings/board');

            if (data.success) {
                setBoard(data.data);
            } else {
                setError(
                    typeof data.data === 'string' ? data.data : 'Не удалось загрузить брони'
                );
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.data ??
                        err.response?.data?.error ??
                        'Не удалось загрузить брони'
                );
            } else {
                setError('Не удалось загрузить брони');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadBoard();
    }, [loadBoard]);

    const handleStart = useCallback(
        async (bookingId: number) => {
            setStartingBookingId(bookingId);

            try {
                const {data} = await axios.patch<{success: boolean; data: unknown}>(
                    `/api/bookings/${bookingId}`,
                    {action: 'start'}
                );

                if (data.success) {
                    toast.success('Визит начат');
                    await loadBoard();
                } else {
                    toast.error('Не удалось начать визит');
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
                setStartingBookingId(null);
            }
        },
        [loadBoard]
    );

    const bookings = useMemo(() => {
        if (!board) return [];

        if (isAdmin || filter === 'all') return board.bookings;

        return board.bookings.filter(booking => booking.isMine);
    }, [board, filter, isAdmin]);

    if (!user) return null;

    const mineCount = board?.bookings.filter(booking => booking.isMine).length ?? 0;

    return (
        <div className='p-6 lg:p-8'>
            <div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
                <div>
                    <h1 className='text-2xl font-bold text-app-fg'>Бронирования</h1>
                    <p className='mt-1 text-sm text-app-subtle'>
                        {board
                            ? `${formatBoardDate(board.date)} · ${board.summary.bookings} броней`
                            : 'Загрузка…'}
                    </p>
                </div>

                <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => void loadBoard()}
                    disabled={isLoading}
                    className='h-8 gap-2 border-app-border bg-surface/60 text-app-muted hover:bg-surface-2 hover:text-app-fg disabled:opacity-50'
                >
                    <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                    Обновить
                </Button>
            </div>

            {error && (
                <div className='mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400'>
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className='space-y-4'>
                    <div className='grid grid-cols-2 gap-3 lg:grid-cols-5'>
                        {[0, 1, 2, 3, 4].map(card => (
                            <Skeleton key={card} className='h-[74px] w-full' />
                        ))}
                    </div>
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
                        {[0, 1, 2, 3, 4, 5].map(card => (
                            <Skeleton key={card} className='h-[104px] w-full' />
                        ))}
                    </div>
                </div>
            ) : !board ? (
                <div className='flex min-h-[240px] items-center justify-center rounded-xl border border-app-border bg-surface/60 text-sm text-app-subtle'>
                    {error || 'Нет данных'}
                </div>
            ) : (
                <div className='space-y-4'>
                    <div className='grid grid-cols-2 gap-3 lg:grid-cols-5'>
                        <SummaryCard
                            label={isAdmin ? 'Брони' : 'Мои брони'}
                            value={formatNumber(board.summary.bookings)}
                            icon={CalendarDays}
                            className='text-orange-400'
                        />
                        <SummaryCard
                            label={isAdmin ? 'Гости' : 'Мои гости'}
                            value={formatNumber(board.summary.guests)}
                            icon={Users}
                            className='text-sky-400'
                        />
                        <SummaryCard
                            label={isAdmin ? 'Выручка' : 'Моя выручка'}
                            value={formatMoney(board.summary.revenue)}
                            icon={Wallet}
                            className='text-emerald-400'
                        />
                        <SummaryCard
                            label={isAdmin ? 'Ожидаются' : 'Мои ожидаются'}
                            value={formatNumber(board.summary.expectedArrivals)}
                            icon={Clock}
                            className='text-brand'
                        />
                        <SummaryCard
                            label={isAdmin ? 'Отмены' : 'Мои отмены'}
                            value={formatNumber(board.summary.cancellations)}
                            icon={CalendarX2}
                            className='text-red-400'
                        />
                    </div>

                    {isAdmin && <EmployeeStats employees={board.employees} />}

                    <Card className='border-app-border bg-surface/60 backdrop-blur-sm'>
                        <CardHeader className='flex flex-row flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-2'>
                            <CardTitle>
                                {isAdmin
                                    ? 'Все брони на сегодня'
                                    : filter === 'mine'
                                      ? 'Мои брони на сегодня'
                                      : 'Все брони на сегодня'}
                            </CardTitle>

                            {!isAdmin && (
                                <div className='flex items-center gap-0.5 rounded-lg border border-app-border bg-surface-2/40 p-0.5'>
                                    <button
                                        type='button'
                                        onClick={() => setFilter('mine')}
                                        className={[
                                            'rounded-md px-2.5 py-1 text-[11px] transition-colors',
                                            filter === 'mine'
                                                ? 'bg-surface font-medium text-app-fg shadow-sm'
                                                : 'text-app-muted hover:text-app-fg'
                                        ].join(' ')}
                                    >
                                        Мои ({mineCount})
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() => setFilter('all')}
                                        className={[
                                            'rounded-md px-2.5 py-1 text-[11px] transition-colors',
                                            filter === 'all'
                                                ? 'bg-surface font-medium text-app-fg shadow-sm'
                                                : 'text-app-muted hover:text-app-fg'
                                        ].join(' ')}
                                    >
                                        Все ({board.bookings.length})
                                    </button>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className='p-4 pt-2'>
                            {bookings.length === 0 ? (
                                <div className='flex min-h-[160px] items-center justify-center text-sm text-app-subtle'>
                                    {filter === 'mine'
                                        ? 'У вас пока нет броней на сегодня'
                                        : 'На сегодня броней нет'}
                                </div>
                            ) : (
                                <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3'>
                                    {bookings.map(booking => (
                                        <BookingCard
                                            key={booking.id}
                                            booking={booking}
                                            managerName={booking.managerName}
                                            showManager={isAdmin}
                                            onOpen={() =>
                                                setSelectedBookingId(Number(booking.id))
                                            }
                                            onStart={
                                                booking.isMine
                                                    ? () =>
                                                          void handleStart(
                                                              Number(booking.id)
                                                          )
                                                    : undefined
                                            }
                                            isStarting={
                                                startingBookingId === Number(booking.id)
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            <BookingDetailsModal
                open={selectedBookingId !== null}
                bookingId={selectedBookingId}
                onClose={() => setSelectedBookingId(null)}
                onUpdated={() => {
                    void loadBoard();
                }}
            />
        </div>
    );
}
