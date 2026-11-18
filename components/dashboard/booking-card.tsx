'use client';

import {formatPhone} from '@/lib/phone';
import type {BookingBoardItem} from '@/types/bookings';
import type {ShiftBooking, ShiftBookingStatus} from '@/types/dashboard';
import {Loader2, Play} from 'lucide-react';

type CardBooking = BookingBoardItem | ShiftBooking;

const STATUS_STYLES: Record<ShiftBookingStatus, string> = {
    Завершена: 'bg-app-fg/10 text-app-muted',
    'За столом': 'bg-emerald-500/10 text-emerald-400',
    Ожидается: 'bg-brand/10 text-brand',
    Отменена: 'bg-red-500/10 text-red-400'
};

const STATUS_BARS: Record<ShiftBookingStatus, string> = {
    Завершена: 'bg-app-fg/20',
    'За столом': 'bg-emerald-400',
    Ожидается: 'bg-brand',
    Отменена: 'bg-red-400'
};

interface BookingCardProps {
    booking: CardBooking;
    managerName?: string;
    showManager?: boolean;
    onOpen: () => void;
    onStart?: () => void;
    isStarting?: boolean;
}

export function BookingCard({
    booking,
    managerName,
    showManager = false,
    onOpen,
    onStart,
    isStarting = false
}: BookingCardProps) {
    const canStart =
        Boolean(onStart) && booking.isMine && booking.status === 'Ожидается';

    return (
        <div
            role='button'
            tabIndex={0}
            title={
                booking.phone
                    ? `${booking.guestName}, ${formatPhone(booking.phone)}`
                    : booking.guestName
            }
            onClick={onOpen}
            onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpen();
                }
            }}
            className='relative flex min-h-[104px] cursor-pointer flex-col justify-between overflow-hidden rounded-lg border border-app-border/60 bg-surface-2/30 p-3 transition-colors hover:border-app-border hover:bg-surface-2/60 focus-visible:border-brand/60 focus-visible:outline-none'
        >
            <span
                className={[
                    'absolute inset-y-0 left-0 w-1',
                    STATUS_BARS[booking.status]
                ].join(' ')}
            />

            <div className='flex items-start justify-between gap-2 pl-2'>
                <div className='min-w-0'>
                    <p className='font-mono text-[13px] font-semibold text-app-fg'>
                        {booking.time}–{booking.endTime}
                    </p>
                    <p className='mt-0.5 truncate text-sm font-medium text-app-fg/90'>
                        {booking.guestName}
                    </p>
                    {showManager && managerName && (
                        <p className='truncate text-[11px] text-app-subtle'>
                            {managerName}
                        </p>
                    )}
                </div>

                <div className='flex shrink-0 items-center gap-1'>
                    {canStart && (
                        <button
                            type='button'
                            title='Начать визит'
                            aria-label='Начать визит'
                            disabled={isStarting}
                            onClick={event => {
                                event.stopPropagation();
                                onStart?.();
                            }}
                            className='flex h-6 w-6 cursor-pointer items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:cursor-wait disabled:opacity-50'
                        >
                            {isStarting ? (
                                <Loader2 size={12} className='animate-spin' />
                            ) : (
                                <Play size={12} fill='currentColor' />
                            )}
                        </button>
                    )}
                    <span
                        className={[
                            'whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium',
                            STATUS_STYLES[booking.status]
                        ].join(' ')}
                    >
                        {booking.status}
                    </span>
                </div>
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
    );
}
