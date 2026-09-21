'use client';

import {Card, CardContent} from '@/components/ui/card';
import {Sparkline} from '@/components/dashboard/charts';
import {formatTrend} from '@/lib/format';
import {ArrowDownRight, ArrowUpRight, LucideIcon, Minus} from 'lucide-react';

/** Плашка динамики: +8,2% зелёным, −3,2% красным */
export function TrendBadge({value}: {value: number}) {
    const isFlat = value === 0;
    const isUp = value > 0;
    const Icon = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight;

    const className = isFlat
        ? 'bg-app-fg/5 text-app-subtle'
        : isUp
          ? 'bg-emerald-500/10 text-emerald-400'
          : 'bg-red-500/10 text-red-400';

    return (
        <span
            className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium ${className}`}
        >
            <Icon size={12} />
            {formatTrend(value)}
        </span>
    );
}

interface StatCardProps {
    label: string;
    value: string;
    hint?: string;
    icon: LucideIcon;
    iconClassName?: string;
    trend?: number;
    /** Мини-график за 7 дней */
    spark?: number[];
}

/** Компактная карточка KPI */
export function StatCard({
    label,
    value,
    hint,
    icon: Icon,
    iconClassName = 'text-brand',
    trend,
    spark
}: StatCardProps) {
    return (
        <Card className='border-app-border bg-surface/60 backdrop-blur-sm'>
            <CardContent className='p-4'>
                <div className='flex items-center justify-between gap-2'>
                    <p className='truncate text-[11px] font-medium uppercase tracking-wider text-app-muted'>
                        {label}
                    </p>
                    <Icon size={14} className={`shrink-0 ${iconClassName}`} />
                </div>

                <div className='mt-2 flex flex-wrap items-end justify-between gap-x-2 gap-y-1'>
                    <p className='text-xl font-bold leading-none text-app-fg'>{value}</p>
                    {trend !== undefined && <TrendBadge value={trend} />}
                </div>

                <div className='mt-2 flex items-end justify-between gap-2'>
                    <p className='min-w-0 truncate text-[11px] text-app-subtle'>{hint ?? ''}</p>
                    {spark && <Sparkline values={spark} className='h-6 w-16 shrink-0' />}
                </div>
            </CardContent>
        </Card>
    );
}

/** Полоска прогресса (загруженность, доля выручки и т.п.) */
export function ProgressBar({value, className}: {value: number; className?: string}) {
    const width = Math.min(Math.max(value, 0), 100);

    return (
        <div
            className={[
                'h-1.5 w-full overflow-hidden rounded-full bg-app-fg/10',
                className ?? ''
            ].join(' ')}
        >
            <div className='h-full rounded-full bg-brand' style={{width: `${width}%`}} />
        </div>
    );
}
