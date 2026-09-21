'use client';

import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {isAllowed} from '@/lib/auth/roles';
import {useAuthStore} from '@/stores/auth.store';
import {Plus} from 'lucide-react';

/**
 * Плавающая кнопка быстрого создания брони.
 * Показывается только Manager / Admin / SuperUser.
 *
 * TODO: открыть форму создания брони + серверная проверка права (bookings.create)
 */
export function QuickBookingButton() {
    const user = useAuthStore(state => state.user);

    if (!user || !isAllowed(user.role)) return null;

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type='button'
                        aria-label='Создать бронь'
                        className='cursor-pointer fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-brand text-brand-fg shadow-lg shadow-black/25 transition-transform hover:scale-105 active:scale-95 lg:bottom-6 lg:right-6'
                    >
                        <Plus size={22} strokeWidth={2.5} />
                    </button>
                </TooltipTrigger>
                <TooltipContent
                    side='left'
                    className='border-app-border bg-surface-2 text-app-fg/90'
                >
                    Новая бронь
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
