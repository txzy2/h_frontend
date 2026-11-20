'use client';

import {formatPhone} from '@/lib/phone';
import {bookingStatusKeyFromLabel, statusBadgeStyle, statusBarStyle, statusButtonStyle} from '@/lib/org/status';
import type {BookingBoardItem} from '@/types/bookings';
import type {ShiftBooking} from '@/types/dashboard';
import {Loader2, Play} from 'lucide-react';

type CardBooking = BookingBoardItem | ShiftBooking;

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
    const statusKey = bookingStatusKeyFromLabel(booking.status);

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
                className='absolute inset-y-0 left-0 w-1'
                style={statusBarStyle(statusKey)}
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
                            style={statusButtonStyle('seated')}
                            className='flex h-6 w-6 cursor-pointer items-center justify-center rounded-md transition-all hover:opacity-80 disabled:cursor-wait disabled:opacity-50'
                        >
                            {isStarting ? (
                                <Loader2 size={12} className='animate-spin' />
                            ) : (
                                <Play size={12} fill='currentColor' />
                            )}
                        </button>
                    )}
                    <span
                        className='whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium'
                        style={statusBadgeStyle(statusKey)}
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
