'use client';

import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Skeleton} from '@/components/ui/skeleton';
import {useConfirm} from '@/components/ui/confirm-dialog';
import {useAuthStore} from '@/stores/auth.store';
import type {FloorPlanApi, FloorPlanLayout, FloorPlanResponse, FloorPlanTable} from '@/types/floor-plan';
import type {OrganizationLocation, OrganizationResponse} from '@/types/org';
import axios from 'axios';
import {
    Circle,
    Info,
    LayoutGrid,
    Loader2,
    MapPin,
    MousePointer2,
    Move,
    Plus,
    RotateCcw,
    Save,
    Square,
    Trash2,
    Users
} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {Rnd} from 'react-rnd';
import {toast} from 'sonner';

const TABLE_COLORS = ['#f59e0b', '#0ea5e9', '#10b981', '#8b5cf6', '#f43f5e', '#64748b'];

const RESIZE_HANDLE_STYLE = {
    width: 10,
    height: 10,
    borderRadius: '9999px',
    background: 'var(--brand)',
    border: '2px solid var(--surface)'
};

const RESIZE_HANDLES = {
    bottomRight: RESIZE_HANDLE_STYLE,
    bottomLeft: RESIZE_HANDLE_STYLE,
    topRight: RESIZE_HANDLE_STYLE,
    topLeft: RESIZE_HANDLE_STYLE
};

function displayTableName(name: string): string {
    const trimmed = name.trim();
    const withoutPrefix = trimmed.replace(/^стол\s*/i, '');

    return withoutPrefix || trimmed || '—';
}

export default function FloorPlanPage() {
    const user = useAuthStore(state => state.user);
    const router = useRouter();
    const isAdmin = user?.role === 'Admin' || user?.role === 'SuperUser';

    const [locations, setLocations] = useState<OrganizationLocation[]>([]);
    const [locationId, setLocationId] = useState<number | null>(null);
    const [plan, setPlan] = useState<FloorPlanResponse | null>(null);
    const [layout, setLayout] = useState<FloorPlanLayout | null>(null);
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [seatsDraft, setSeatsDraft] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user && !isAdmin) router.replace('/forbidden');
    }, [user, isAdmin, router]);

    useEffect(() => {
        if (!isAdmin) return;

        let cancelled = false;

        axios
            .get<OrganizationResponse>('/api/orgs')
            .then(({data}) => {
                if (cancelled) return;

                if (data.success && data.data) {
                    const active = data.data.locations.filter(
                        location => location.status === 'Active'
                    );
                    setLocations(active);
                    setLocationId(current => current ?? active[0]?.id ?? null);
                    if (!active.length) setIsLoading(false);
                } else {
                    setError('Не удалось загрузить точки организации');
                    setIsLoading(false);
                }
            })
            .catch(err => {
                if (cancelled) return;
                if (axios.isAxiosError(err)) {
                    setError(
                        err.response?.data?.data ??
                            err.response?.data?.message ??
                            'Не удалось загрузить точки организации'
                    );
                } else {
                    setError('Не удалось загрузить точки организации');
                }
                setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isAdmin]);

    useEffect(() => {
        if (!locationId) return;

        let cancelled = false;
        setIsLoading(true);
        setError('');

        axios
            .get<FloorPlanApi>('/api/floor-plan', {params: {locationId}})
            .then(({data}) => {
                if (cancelled) return;

                if (data.success) {
                    setPlan(data.data);
                    setLayout(data.data.layout);
                    setSelectedTableId(null);
                    setIsDirty(false);
                } else {
                    setError(
                        typeof data.data === 'string'
                            ? data.data
                            : 'Не удалось загрузить план зала'
                    );
                }
            })
            .catch(err => {
                if (cancelled) return;
                if (axios.isAxiosError(err)) {
                    setError(
                        err.response?.data?.data ??
                            err.response?.data?.error ??
                            'Не удалось загрузить план зала'
                    );
                } else {
                    setError('Не удалось загрузить план зала');
                }
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [locationId]);

    const confirm = useConfirm();

    const selectedTable = useMemo(
        () => layout?.tables.find(table => table.id === selectedTableId) ?? null,
        [layout, selectedTableId]
    );

    useEffect(() => {
        setSeatsDraft(selectedTable ? String(selectedTable.seats) : '');
        // Черновик поля не должен сбрасываться на каждый ввод — только при смене стола.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTable?.id]);

    const totalSeats = useMemo(
        () => layout?.tables.reduce((sum, table) => sum + table.seats, 0) ?? 0,
        [layout]
    );

    const updateTable = useCallback(
        (id: string, patch: Partial<FloorPlanTable>) => {
            setLayout(current =>
                current
                    ? {
                          ...current,
                          tables: current.tables.map(table =>
                              table.id === id ? {...table, ...patch} : table
                          )
                      }
                    : current
            );
            setIsDirty(true);
        },
        []
    );

    const addTable = () => {
        if (!layout) return;

        const index = layout.tables.length;
        const table: FloorPlanTable = {
            id: `new-${Date.now()}-${index}`,
            tableId: null,
            name: `Стол ${index + 1}`,
            seats: 4,
            x: 80 + (index % 5) * 44,
            y: 80 + (index % 4) * 44,
            width: 88,
            height: 88,
            rotation: 0,
            shape: 'round',
            color: null
        };

        setLayout({...layout, tables: [...layout.tables, table]});
        setSelectedTableId(table.id);
        setIsDirty(true);
    };

    const removeSelectedTable = async () => {
        if (!layout || !selectedTable) return;

        const confirmed = await confirm({
            title: 'Убрать стол с плана?',
            description: selectedTable.tableId
                ? 'Стол останется в базе, но исчезнет с плана.'
                : 'Новый стол будет удалён без сохранения.',
            confirmLabel: 'Убрать',
            cancelLabel: 'Оставить',
            variant: 'danger'
        });

        if (!confirmed) return;

        setLayout({
            ...layout,
            tables: layout.tables.filter(table => table.id !== selectedTable.id)
        });
        setSelectedTableId(null);
        setIsDirty(true);
    };

    const savePlan = async () => {
        if (!layout || !locationId || isSaving) return;

        setIsSaving(true);
        setError('');

        try {
            const {data} = await axios.put<FloorPlanApi>('/api/floor-plan', {
                locationId,
                layout
            });

            if (data.success) {
                setPlan(data.data);
                setLayout(data.data.layout);
                setIsDirty(false);
                toast.success('План зала сохранён');
            } else {
                setError(
                    typeof data.data === 'string'
                        ? data.data
                        : 'Не удалось сохранить план зала'
                );
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.data ??
                        err.response?.data?.error ??
                        'Не удалось сохранить план зала'
                );
            } else {
                setError('Не удалось сохранить план зала');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const resetPlan = () => {
        if (!plan) return;
        setLayout(plan.layout);
        setSelectedTableId(null);
        setIsDirty(false);
    };

    const changeLocation = async (value: string) => {
        if (isDirty) {
            const confirmed = await confirm({
                title: 'Есть несохранённые изменения',
                description:
                    'Перейти к другой точке? Несохранённые изменения плана будут потеряны.',
                confirmLabel: 'Перейти',
                cancelLabel: 'Остаться'
            });

            if (!confirmed) return;
        }

        setLocationId(Number(value));
    };

    if (!user || !isAdmin) return null;

    return (
        <div className='p-6 lg:p-8'>
            <div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
                <div>
                    <h1 className='text-2xl font-bold text-app-fg'>План зала</h1>
                    <p className='mt-1 text-sm text-app-subtle'>
                        Расставьте столы, настройте размеры и количество мест
                    </p>
                </div>

                <div className='flex w-full flex-wrap items-center gap-2 sm:w-auto'>
                    <div className='relative'>
                        <MapPin
                            size={15}
                            className='pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-app-subtle'
                        />
                        <select
                            value={locationId ?? ''}
                            onChange={event => void changeLocation(event.target.value)}
                            disabled={isLoading || !locations.length}
                            className='h-9 min-w-[190px] cursor-pointer appearance-none rounded-lg border border-app-border bg-surface-2/50 pr-8 pl-9 text-sm text-app-fg outline-none focus:border-brand/60 disabled:opacity-50'
                        >
                            {!locations.length && <option value=''>Нет точек</option>}
                            {locations.map(location => (
                                <option key={location.id} value={location.id}>
                                    {location.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={addTable}
                        disabled={!layout || isLoading}
                        className='h-9 gap-2 border-app-border bg-surface/60 text-app-fg/80 hover:bg-surface-2 hover:text-app-fg'
                    >
                        <Plus size={15} />
                        Добавить стол
                    </Button>

                    <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={resetPlan}
                        disabled={!isDirty || isSaving}
                        className='h-9 gap-2 border-app-border bg-surface/60 text-app-muted hover:bg-surface-2 hover:text-app-fg disabled:opacity-40'
                    >
                        <RotateCcw size={15} />
                        Сбросить
                    </Button>

                    <Button
                        type='button'
                        onClick={() => void savePlan()}
                        disabled={!isDirty || isSaving || !layout}
                        className='h-9 gap-2 bg-brand font-semibold text-brand-fg hover:bg-brand/90 disabled:opacity-40'
                    >
                        {isSaving ? (
                            <Loader2 size={15} className='animate-spin' />
                        ) : (
                            <Save size={15} />
                        )}
                        Сохранить
                    </Button>
                </div>
            </div>

            {error && (
                <div className='mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400'>
                    {error}
                </div>
            )}

            <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]'>
                <Card className='border-app-border bg-surface/60 backdrop-blur-sm'>
                    <CardHeader className='flex flex-row flex-wrap items-center justify-between gap-2 px-4 pt-4 pb-2'>
                        <CardTitle className='flex items-center gap-2'>
                            <LayoutGrid size={16} className='text-brand' />
                            {plan?.locationName ?? 'Схема зала'}
                        </CardTitle>
                        <div className='flex items-center gap-3 text-xs text-app-subtle'>
                            <span>
                                Столов: <span className='text-app-fg'>{layout?.tables.length ?? 0}</span>
                            </span>
                            <span>
                                Мест: <span className='text-app-fg'>{totalSeats}</span>
                            </span>
                            {isDirty && (
                                <span className='flex items-center gap-1 text-brand'>
                                    <span className='h-1.5 w-1.5 rounded-full bg-brand' />
                                    не сохранено
                                </span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className='p-4 pt-2'>
                        {isLoading || !layout ? (
                            <Skeleton className='h-[520px] w-full rounded-xl' />
                        ) : !locations.length ? (
                            <div className='flex min-h-[520px] flex-col items-center justify-center gap-3 rounded-xl border border-app-border bg-app/50 text-sm text-app-subtle'>
                                <MapPin size={28} className='text-app-subtle' />
                                <p>Сначала добавьте точку организации</p>
                            </div>
                        ) : (
                            <div className='max-h-[calc(100dvh-300px)] min-h-[520px] overflow-auto rounded-xl border border-app-border/60 bg-app p-4'>
                                <div
                                    role='presentation'
                                    onClick={event => {
                                        if (event.target === event.currentTarget) {
                                            setSelectedTableId(null);
                                        }
                                    }}
                                    className='relative mx-auto overflow-hidden rounded-xl border border-app-border/60 bg-app shadow-inner'
                                    style={{
                                        width: layout.canvas.width,
                                        height: layout.canvas.height,
                                        backgroundImage:
                                            'radial-gradient(circle, color-mix(in srgb, var(--app-fg) 14%, transparent) 1px, transparent 1px)',
                                        backgroundSize: '24px 24px'
                                    }}
                                >
                                    <div
                                        className='pointer-events-none absolute inset-0'
                                        style={{
                                            background:
                                                'radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--brand) 10%, transparent), transparent 55%)'
                                        }}
                                    />

                                    {layout.tables.length === 0 && (
                                        <div className='absolute inset-0 flex flex-col items-center justify-center gap-3 text-app-subtle'>
                                            <LayoutGrid size={36} className='opacity-40' />
                                            <p className='text-sm'>На плане пока нет столов</p>
                                            <Button
                                                type='button'
                                                size='sm'
                                                onClick={event => {
                                                    event.stopPropagation();
                                                    addTable();
                                                }}
                                                className='gap-2 bg-brand font-semibold text-brand-fg hover:bg-brand/90'
                                            >
                                                <Plus size={14} />
                                                Добавить стол
                                            </Button>
                                        </div>
                                    )}

                                    {layout.tables.map((table, index) => {
                                        const isSelected = selectedTableId === table.id;
                                        const accent =
                                            table.color ??
                                            TABLE_COLORS[index % TABLE_COLORS.length];

                                        return (
                                            <Rnd
                                                key={table.id}
                                                bounds='parent'
                                                position={{x: table.x, y: table.y}}
                                                size={{
                                                    width: table.width,
                                                    height: table.height
                                                }}
                                                minWidth={48}
                                                minHeight={48}
                                                maxWidth={400}
                                                maxHeight={400}
                                                dragGrid={[10, 10]}
                                                resizeGrid={[10, 10]}
                                                lockAspectRatio={table.shape === 'round'}
                                                enableResizing={isSelected}
                                                resizeHandleStyles={RESIZE_HANDLES}
                                                onClick={(event: globalThis.MouseEvent) => {
                                                    event.stopPropagation();
                                                    setSelectedTableId(table.id);
                                                }}
                                                onDragStop={(_, data) =>
                                                    updateTable(table.id, {
                                                        x: Math.round(data.x),
                                                        y: Math.round(data.y)
                                                    })
                                                }
                                                onResizeStop={(_, __, ref, ___, position) =>
                                                    updateTable(table.id, {
                                                        x: Math.round(position.x),
                                                        y: Math.round(position.y),
                                                        width: Math.round(
                                                            parseFloat(ref.style.width)
                                                        ),
                                                        height: Math.round(
                                                            parseFloat(ref.style.height)
                                                        )
                                                    })
                                                }
                                                className='group cursor-move'
                                                style={{
                                                    zIndex: isSelected ? 30 : 10,
                                                    outline: isSelected
                                                        ? '2px solid var(--brand)'
                                                        : 'none',
                                                    outlineOffset: '4px',
                                                    borderRadius:
                                                        table.shape === 'round'
                                                            ? '9999px'
                                                            : '16px'
                                                }}
                                            >
                                                <div
                                                    className='relative h-full w-full'
                                                    style={{
                                                        transform: `rotate(${table.rotation}deg)`
                                                    }}
                                                >
                                                    <span className='absolute top-1 right-1 z-10 rounded bg-app-fg/10 p-0.5 text-app-subtle opacity-0 transition-opacity group-hover:opacity-100'>
                                                        <Move size={10} />
                                                    </span>

                                                    {table.shape === 'round' ? (
                                                        <>
                                                            {Array.from({
                                                                length: table.seats
                                                            }).map((_, seatIndex) => {
                                                                const angle =
                                                                    (seatIndex /
                                                                        table.seats) *
                                                                        Math.PI *
                                                                        2 -
                                                                    Math.PI / 2;

                                                                return (
                                                                    <span
                                                                        key={seatIndex}
                                                                        className='absolute h-2.5 w-2.5 rounded-full border border-app-border/70 bg-surface-2 shadow-sm'
                                                                        style={{
                                                                            left: `${
                                                                                50 +
                                                                                Math.cos(
                                                                                    angle
                                                                                ) *
                                                                                    41
                                                                            }%`,
                                                                            top: `${
                                                                                50 +
                                                                                Math.sin(
                                                                                    angle
                                                                                ) *
                                                                                    41
                                                                            }%`,
                                                                            transform:
                                                                                'translate(-50%, -50%)'
                                                                        }}
                                                                    />
                                                                );
                                                            })}

                                                            <div
                                                                className='absolute inset-[14%] flex flex-col items-center justify-center rounded-full border-2 bg-gradient-to-br from-surface to-surface-2 shadow-[0_10px_30px_rgba(0,0,0,0.28)] transition-shadow'
                                                                style={{
                                                                    borderColor: isSelected
                                                                        ? 'var(--brand)'
                                                                        : accent
                                                                }}
                                                            >
                                                                <span className='max-w-full truncate px-1 text-sm font-bold text-app-fg'>
                                                                    {displayTableName(table.name)}
                                                                </span>
                                                                <span className='mt-0.5 flex items-center gap-1 text-[10px] text-app-subtle'>
                                                                    <Users size={10} />
                                                                    {table.seats}
                                                                </span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div
                                                            className='absolute inset-[8%] flex flex-col items-center justify-center rounded-xl border-2 bg-gradient-to-br from-surface to-surface-2 shadow-[0_10px_30px_rgba(0,0,0,0.28)]'
                                                            style={{
                                                                borderColor: isSelected
                                                                    ? 'var(--brand)'
                                                                    : accent
                                                            }}
                                                        >
                                                            <span className='max-w-full truncate px-2 text-sm font-bold text-app-fg'>
                                                                {displayTableName(table.name)}
                                                            </span>
                                                            <span className='mt-0.5 flex items-center gap-1 text-[10px] text-app-subtle'>
                                                                <Users size={10} />
                                                                {table.seats}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </Rnd>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <p className='mt-3 flex items-center gap-2 text-[11px] text-app-subtle'>
                            <Info size={13} />
                            Перетаскивайте столы мышью. Выберите стол, чтобы изменить размер,
                            поворот и количество мест.
                        </p>
                    </CardContent>
                </Card>

                <Card className='h-fit border-app-border bg-surface/60 backdrop-blur-sm'>
                    <CardHeader className='px-4 pt-4 pb-2'>
                        <CardTitle className='flex items-center gap-2'>
                            <MousePointer2 size={16} className='text-brand' />
                            Свойства стола
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-5 p-4 pt-2'>
                        {!selectedTable ? (
                            <div className='flex flex-col items-center gap-3 rounded-xl border border-dashed border-app-border px-4 py-10 text-center text-sm text-app-subtle'>
                                <MousePointer2 size={26} className='opacity-40' />
                                <p>Выберите стол на плане</p>
                                <p className='text-[11px]'>
                                    Здесь появятся название, форма, места, поворот и цвет.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className='flex items-center justify-between gap-2'>
                                    <div className='min-w-0'>
                                        <p className='truncate text-sm font-semibold text-app-fg'>
                                            {selectedTable.name}
                                        </p>
                                        <p className='text-[11px] text-app-subtle'>
                                            {selectedTable.tableId
                                                ? `Стол #${selectedTable.tableId}`
                                                : 'Новый стол'}
                                        </p>
                                    </div>
                                    <span
                                        className='h-3 w-3 shrink-0 rounded-full border border-app-border'
                                        style={{
                                            backgroundColor:
                                                selectedTable.color ??
                                                'var(--brand)'
                                        }}
                                    />
                                </div>

                                <div className='space-y-1.5'>
                                    <Label className='text-xs text-app-muted'>Название</Label>
                                    <Input
                                        value={selectedTable.name}
                                        maxLength={100}
                                        onChange={event =>
                                            updateTable(selectedTable.id, {
                                                name: event.target.value
                                            })
                                        }
                                        className='h-9 border-app-border bg-surface-2/50 text-app-fg focus-visible:border-brand/60 focus-visible:ring-0'
                                    />
                                </div>

                                <div className='space-y-1.5'>
                                    <Label className='text-xs text-app-muted'>
                                        Количество мест
                                    </Label>
                                    <Input
                                        type='number'
                                        min={1}
                                        max={50}
                                        value={seatsDraft}
                                        onChange={event => {
                                            const raw = event.target.value;
                                            const parsed = Number(raw);

                                            setSeatsDraft(raw);

                                            if (
                                                Number.isInteger(parsed) &&
                                                parsed >= 1 &&
                                                parsed <= 50
                                            ) {
                                                updateTable(selectedTable.id, {
                                                    seats: parsed
                                                });
                                            }
                                        }}
                                        onBlur={() => {
                                            const parsed = Number(seatsDraft);

                                            if (
                                                !Number.isInteger(parsed) ||
                                                parsed < 1 ||
                                                parsed > 50
                                            ) {
                                                setSeatsDraft(String(selectedTable.seats));
                                            } else {
                                                updateTable(selectedTable.id, {
                                                    seats: parsed
                                                });
                                                setSeatsDraft(String(parsed));
                                            }
                                        }}
                                        className='h-9 border-app-border bg-surface-2/50 text-app-fg focus-visible:border-brand/60 focus-visible:ring-0'
                                    />
                                </div>

                                <div className='space-y-1.5'>
                                    <Label className='text-xs text-app-muted'>Форма</Label>
                                    <div className='grid grid-cols-2 gap-2'>
                                        <button
                                            type='button'
                                            onClick={() =>
                                                updateTable(selectedTable.id, {
                                                    shape: 'round',
                                                    height: selectedTable.width
                                                })
                                            }
                                            className={[
                                                'flex items-center justify-center gap-2 rounded-lg border px-2 py-2 text-xs transition-colors',
                                                selectedTable.shape === 'round'
                                                    ? 'border-brand/50 bg-brand/10 text-brand'
                                                    : 'border-app-border text-app-muted hover:text-app-fg'
                                            ].join(' ')}
                                        >
                                            <Circle size={14} />
                                            Круглый
                                        </button>
                                        <button
                                            type='button'
                                            onClick={() =>
                                                updateTable(selectedTable.id, {
                                                    shape: 'rect'
                                                })
                                            }
                                            className={[
                                                'flex items-center justify-center gap-2 rounded-lg border px-2 py-2 text-xs transition-colors',
                                                selectedTable.shape === 'rect'
                                                    ? 'border-brand/50 bg-brand/10 text-brand'
                                                    : 'border-app-border text-app-muted hover:text-app-fg'
                                            ].join(' ')}
                                        >
                                            <Square size={14} />
                                            Прямоугольный
                                        </button>
                                    </div>
                                </div>

                                <div className='space-y-2'>
                                    <div className='flex items-center justify-between text-xs'>
                                        <Label className='text-app-muted'>Поворот</Label>
                                        <span className='font-mono text-app-subtle'>
                                            {selectedTable.rotation}°
                                        </span>
                                    </div>
                                    <input
                                        type='range'
                                        min={0}
                                        max={360}
                                        step={15}
                                        value={selectedTable.rotation}
                                        onChange={event =>
                                            updateTable(selectedTable.id, {
                                                rotation: Number(event.target.value)
                                            })
                                        }
                                        className='w-full accent-[var(--brand)]'
                                    />
                                </div>

                                <div className='space-y-2'>
                                    <Label className='text-xs text-app-muted'>Цвет</Label>
                                    <div className='flex flex-wrap items-center gap-2'>
                                        {TABLE_COLORS.map(color => (
                                            <button
                                                key={color}
                                                type='button'
                                                title={color}
                                                onClick={() =>
                                                    updateTable(selectedTable.id, {color})
                                                }
                                                className={[
                                                    'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110',
                                                    selectedTable.color === color
                                                        ? 'border-app-fg/60'
                                                        : 'border-transparent'
                                                ].join(' ')}
                                                style={{backgroundColor: color}}
                                            />
                                        ))}
                                        <label className='flex h-7 cursor-pointer items-center gap-1 rounded-full border border-app-border px-2 text-[10px] text-app-subtle'>
                                            <input
                                                type='color'
                                                value={selectedTable.color ?? '#f59e0b'}
                                                onChange={event =>
                                                    updateTable(selectedTable.id, {
                                                        color: event.target.value
                                                    })
                                                }
                                                className='h-4 w-4 cursor-pointer rounded border-0 bg-transparent p-0'
                                            />
                                            свой
                                        </label>
                                    </div>
                                </div>

                                <Button
                                    type='button'
                                    variant='outline'
                                    onClick={() => void removeSelectedTable()}
                                    className='w-full gap-2 border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/15 hover:text-red-300'
                                >
                                    <Trash2 size={14} />
                                    Убрать с плана
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
