'use client';

import {formatMoney, formatMoneyCompact, formatNumber} from '@/lib/format';
import {HeatmapData, HourLoadPoint, RevenuePoint} from '@/types/dashboard';
import {useMemo} from 'react';

// ─── Выручка по дням (SVG-график с областью) ─────────────────────────────────

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 180;
const PADDING_Y = 14;

export function RevenueAreaChart({points}: {points: RevenuePoint[]}) {
    const {linePath, areaPath, dotPoints} = useMemo(() => {
        if (points.length === 0) {
            return {linePath: '', areaPath: '', dotPoints: []};
        }

        const values = points.map(point => point.revenue);
        const max = Math.max(...values);
        const min = Math.min(...values);
        const range = max - min || 1;

        const stepX = VIEW_WIDTH / Math.max(points.length - 1, 1);
        const usableHeight = VIEW_HEIGHT - PADDING_Y * 2;

        const coords = points.map((point, index) => {
            const x = index * stepX;
            const y =
                PADDING_Y + usableHeight - ((point.revenue - min) / range) * usableHeight;
            return {x, y};
        });

        const line = coords
            .map((coord, index) => `${index === 0 ? 'M' : 'L'}${coord.x.toFixed(1)},${coord.y.toFixed(1)}`)
            .join(' ');

        const area = `${line} L${VIEW_WIDTH},${VIEW_HEIGHT} L0,${VIEW_HEIGHT} Z`;

        return {linePath: line, areaPath: area, dotPoints: coords};
    }, [points]);

    if (points.length === 0) return null;

    const labelStep = Math.ceil(points.length / 7);

    return (
        <div>
            <div className='relative'>
                {/* Сетка */}
                <div className='pointer-events-none absolute inset-0 flex flex-col justify-between py-[14px]'>
                    {[0, 1, 2, 3].map(line => (
                        <div key={line} className='border-t border-dashed border-app-border/70' />
                    ))}
                </div>

                <svg
                    viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
                    preserveAspectRatio='none'
                    className='h-28 w-full'
                    role='img'
                    aria-label='График выручки по дням'
                >
                    <defs>
                        <linearGradient id='revenue-fill' x1='0' y1='0' x2='0' y2='1'>
                            <stop offset='0%' stopColor='var(--brand)' stopOpacity='0.35' />
                            <stop offset='100%' stopColor='var(--brand)' stopOpacity='0' />
                        </linearGradient>
                    </defs>

                    <path d={areaPath} fill='url(#revenue-fill)' />
                    <path
                        d={linePath}
                        fill='none'
                        stroke='var(--brand)'
                        strokeWidth={2}
                        vectorEffect='non-scaling-stroke'
                        strokeLinejoin='round'
                        strokeLinecap='round'
                    />

                    {points.length <= 31 &&
                        dotPoints.map((coord, index) => (
                            <circle
                                key={index}
                                cx={coord.x}
                                cy={coord.y}
                                r={3}
                                fill='var(--brand)'
                                vectorEffect='non-scaling-stroke'
                            >
                                <title>
                                    {points[index].label}: {formatMoney(points[index].revenue)} ·{' '}
                                    {points[index].bookings} броней
                                </title>
                            </circle>
                        ))}
                </svg>
            </div>

            <div className='mt-2 flex justify-between text-[10px] text-app-subtle'>
                {points.map((point, index) =>
                    index % labelStep === 0 || index === points.length - 1 ? (
                        <span key={point.date}>{point.label}</span>
                    ) : null
                )}
            </div>
        </div>
    );
}

// ─── Загрузка по часам (бары) ────────────────────────────────────────────────

export function LoadBarChart({points}: {points: HourLoadPoint[]}) {
    const max = Math.max(...points.map(point => point.bookings), 1);

    return (
        <div>
            <div className='flex h-40 items-end gap-1.5'>
                {points.map(point => {
                    const height = Math.max((point.bookings / max) * 100, 4);
                    const isPeak = point.bookings === max;

                    return (
                        <div
                            key={point.hour}
                            className='group flex h-full flex-1 flex-col items-center justify-end'
                        >
                            <span className='mb-1 text-[10px] font-medium text-app-subtle opacity-0 transition-opacity group-hover:opacity-100'>
                                {point.bookings}
                            </span>
                            <div
                                title={`${point.hour} — ${point.bookings} броней`}
                                className={[
                                    'w-full rounded-t-md transition-colors',
                                    isPeak
                                        ? 'bg-brand'
                                        : 'bg-brand/35 group-hover:bg-brand/60'
                                ].join(' ')}
                                style={{height: `${height}%`}}
                            />
                        </div>
                    );
                })}
            </div>

            <div className='mt-2 flex gap-1.5 text-[10px] text-app-subtle'>
                {points.map((point, index) => (
                    <span key={point.hour} className='flex-1 text-center'>
                        {index % 2 === 0 ? point.hour.slice(0, 2) : ''}
                    </span>
                ))}
            </div>
        </div>
    );
}

// ─── Круговая диаграмма (доля точек по выручке) ──────────────────────────────

export interface DonutSlice {
    label: string;
    value: number;
    color: string;
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RevenueDonut({slices}: {slices: DonutSlice[]}) {
    const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;

    const segments = slices.map((slice, index) => {
        const startFraction =
            slices.slice(0, index).reduce((sum, item) => sum + item.value, 0) / total;
        const fraction = slice.value / total;

        return {
            ...slice,
            fraction,
            dashArray: `${fraction * CIRCUMFERENCE} ${CIRCUMFERENCE}`,
            dashOffset: -startFraction * CIRCUMFERENCE
        };
    });

    return (
        <div className='flex flex-col items-center gap-4 xl:flex-row xl:items-center xl:gap-5'>
            <div className='relative h-40 w-40 shrink-0'>
                <svg viewBox='0 0 100 100' className='h-full w-full -rotate-90'>
                    <circle
                        cx='50'
                        cy='50'
                        r={RADIUS}
                        fill='none'
                        stroke='var(--app-border)'
                        strokeWidth='13'
                    />
                    {segments.map(segment => (
                        <circle
                            key={segment.label}
                            cx='50'
                            cy='50'
                            r={RADIUS}
                            fill='none'
                            stroke={segment.color}
                            strokeWidth='13'
                            strokeDasharray={segment.dashArray}
                            strokeDashoffset={segment.dashOffset}
                            strokeLinecap='butt'
                        >
                            <title>
                                {segment.label}: {formatMoney(segment.value)}
                            </title>
                        </circle>
                    ))}
                </svg>
                <div className='absolute inset-0 flex flex-col items-center justify-center'>
                    <span className='text-sm font-bold text-app-fg'>
                        {formatMoneyCompact(total)}
                    </span>
                    <span className='text-[10px] text-app-subtle'>за месяц</span>
                </div>
            </div>

            <ul className='w-full min-w-0 flex-1 space-y-2'>
                {segments.map(segment => (
                    <li key={segment.label} className='flex items-center gap-2 text-xs'>
                        <span
                            className='h-2.5 w-2.5 shrink-0 rounded-full'
                            style={{backgroundColor: segment.color}}
                        />
                        <span className='min-w-0 flex-1 truncate text-app-fg/90'>
                            {segment.label}
                        </span>
                        <span className='shrink-0 tabular-nums text-app-subtle'>
                            {Math.round(segment.fraction * 100)}%
                        </span>
                        <span className='shrink-0 whitespace-nowrap font-medium tabular-nums text-app-fg/80'>
                            {formatNumber(Math.round(segment.value / 1000))}к ₽
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ─── Спарклайн для KPI-карточек ──────────────────────────────────────────────

export function Sparkline({values, className}: {values: number[]; className?: string}) {
    if (values.length < 2) return null;

    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const step = 100 / (values.length - 1);

    const points = values
        .map((value, index) => {
            const x = index * step;
            const y = 24 - ((value - min) / range) * 20 - 2;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');

    return (
        <svg
            viewBox='0 0 100 24'
            preserveAspectRatio='none'
            className={className}
            aria-hidden='true'
        >
            <polyline
                points={points}
                fill='none'
                stroke='var(--brand)'
                strokeWidth={2}
                strokeLinecap='round'
                strokeLinejoin='round'
                vectorEffect='non-scaling-stroke'
            />
        </svg>
    );
}

// ─── Heatmap загрузки (дни × часы) ───────────────────────────────────────────

export function LoadHeatmap({days, hours, values}: HeatmapData) {
    const max = Math.max(...values.flat(), 1);

    return (
        <div className='space-y-1.5'>
            <div className='flex items-center gap-1'>
                <div className='w-7 shrink-0' />
                {hours.map((hour, index) => (
                    <div key={hour} className='flex-1 text-center text-[9px] text-app-subtle'>
                        {index % 2 === 0 ? hour.slice(0, 2) : ''}
                    </div>
                ))}
            </div>

            {days.map((day, dayIndex) => (
                <div key={day} className='flex items-center gap-1'>
                    <div className='w-7 shrink-0 text-[10px] text-app-subtle'>{day}</div>
                    {(values[dayIndex] ?? []).map((value, hourIndex) => {
                        const intensity = Math.round((value / max) * 100);

                        return (
                            <div
                                key={`${day}-${hourIndex}`}
                                title={`${day}, ${hours[hourIndex] ?? ''} — загрузка ${intensity}%`}
                                className='h-5 flex-1 rounded-[3px] border border-app-border/40'
                                style={{
                                    backgroundColor: `color-mix(in oklab, var(--brand) ${Math.max(intensity, 6)}%, transparent)`
                                }}
                            />
                        );
                    })}
                </div>
            ))}

            <div className='flex items-center justify-end gap-1 pt-1 text-[10px] text-app-subtle'>
                <span>меньше</span>
                {[15, 40, 65, 90].map(level => (
                    <span
                        key={level}
                        className='h-2.5 w-4 rounded-[3px]'
                        style={{
                            backgroundColor: `color-mix(in oklab, var(--brand) ${level}%, transparent)`
                        }}
                    />
                ))}
                <span>больше</span>
            </div>
        </div>
    );
}
