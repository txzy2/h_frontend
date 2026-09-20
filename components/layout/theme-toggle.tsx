'use client';

import {useBranding} from '@/components/providers/branding-provider';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {Moon, Sun} from 'lucide-react';
import {useTheme} from 'next-themes';

interface ThemeToggleProps {
    className?: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
}

/** Быстрое переключение светлой/тёмной темы */
export function ThemeToggle({className, side = 'bottom'}: ThemeToggleProps) {
    const {resolvedTheme} = useTheme();
    const {chooseTheme} = useBranding();

    // resolvedTheme === undefined до монтирования — рисуем иконку тёмной темы,
    // чтобы не было рассинхрона гидратации
    const isDark = resolvedTheme === undefined ? true : resolvedTheme !== 'light';

    return (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => chooseTheme(isDark ? 'light' : 'dark')}
                        className={
                            className ??
                            'shrink-0 rounded-lg p-1.5 text-header-fg/60 transition-colors hover:bg-header-fg/[0.08] hover:text-header-fg'
                        }
                        aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
                    >
                        {isDark ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </TooltipTrigger>
                <TooltipContent side={side} className='border-app-border bg-surface-2 text-app-fg/90'>
                    {isDark ? 'Светлая тема' : 'Тёмная тема'}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
