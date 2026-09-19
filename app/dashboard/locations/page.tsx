'use client';

import {useCallback, useEffect, useState} from 'react';
import Link from 'next/link';
import axios from 'axios';
import {toast} from 'sonner';
import type {Organization} from '@/types/org';
import {useAuthStore} from '@/stores/auth.store';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import {Armchair, Building2, Clock, Loader2, MapPin, Phone, Plus, X} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocationForm {
    name: string;
    address: string;
    phone: string;
    activePlaces: number | '';
}

interface LocationErrors {
    name?: string;
    address?: string;
    phone?: string;
    activePlaces?: string;
    general?: string;
}

const EMPTY_FORM: LocationForm = {name: '', address: '', phone: '', activePlaces: ''};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls = (hasError?: string) =>
    [
        'border-zinc-700 bg-zinc-800/50 text-white placeholder:text-zinc-600',
        'focus-visible:border-amber-500/60 focus-visible:ring-0 focus-visible:ring-offset-0',
        hasError ? 'border-red-500/60' : ''
    ].join(' ');

function validateForm(form: LocationForm): LocationErrors {
    const errors: LocationErrors = {};
    if (!form.name.trim()) errors.name = 'Введите название';
    if (!form.address.trim()) errors.address = 'Введите адрес';
    if (!form.phone.trim()) errors.phone = 'Введите телефон';
    else if (!/^\d{10,11}$/.test(form.phone)) errors.phone = '10 или 11 цифр';
    if (!form.activePlaces || Number(form.activePlaces) < 1) errors.activePlaces = 'Мин. 1';
    else if (Number(form.activePlaces) > 50) errors.activePlaces = 'Макс. 50';
    return errors;
}

function pluralPoints(n: number): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'точка';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'точки';
    return 'точек';
}

function getStatusConfig(status: string) {
    if (status === 'Active') {
        return {label: 'Активна', className: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'};
    }
    if (status === 'Pending') {
        return {label: 'На проверке', className: 'border-amber-500/30 bg-amber-500/15 text-amber-400'};
    }
    return {label: 'Неактивна', className: 'border-zinc-500/30 bg-zinc-500/15 text-zinc-400'};
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LocationsPage() {
    const {user} = useAuthStore();

    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<LocationForm>(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState<LocationErrors>({});
    const [saving, setSaving] = useState(false);

    const loadOrg = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const {data} = await axios.get('/api/orgs');
            if (data.success) setOrg(data.data);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const status = err.response?.status;
                // Организации ещё нет / пользователь не привязан к ней
                if (status === 401 || status === 404 || status === 409) {
                    setOrg(null);
                } else {
                    setError(
                        err.response?.data?.data ??
                            err.response?.data?.message ??
                            'Ошибка загрузки точек'
                    );
                }
            } else {
                setError('Неизвестная ошибка');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOrg();
    }, [loadOrg]);

    const canManage = user?.role === 'Admin' || user?.role === 'SuperUser';
    const canAdd = canManage && org?.status === 'Active';

    const updateForm = (field: keyof LocationForm, value: string | number) => {
        setForm(prev => ({...prev, [field]: value}));
        if (formErrors[field]) setFormErrors(prev => ({...prev, [field]: undefined}));
    };

    const closeForm = () => {
        setShowForm(false);
        setForm(EMPTY_FORM);
        setFormErrors({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors = validateForm(form);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setSaving(true);
        setFormErrors({});

        try {
            const {data} = await axios.post('/api/locations', {
                name: form.name.trim(),
                address: form.address.trim(),
                phone: form.phone.trim(),
                activePlaces: Number(form.activePlaces)
            });

            if (data.success) {
                toast.success('Точка добавлена');
                closeForm();
                await loadOrg();
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setFormErrors({
                    general: err.response?.data?.data ?? 'Ошибка сохранения точки'
                });
            } else {
                setFormErrors({general: 'Неизвестная ошибка'});
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className='p-6 lg:p-8'>
            <Breadcrumb className='mb-4'>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link
                                href='/dashboard'
                                className='text-zinc-500 transition-colors hover:text-zinc-300'
                            >
                                Дашборд
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className='text-zinc-700' />
                    <BreadcrumbItem>
                        <BreadcrumbPage className='text-zinc-300'>Точки</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Заголовок */}
            <div className='mb-6 flex flex-wrap items-end justify-between gap-4'>
                <div>
                    <h1 className='text-xl font-bold text-white'>Точки продаж</h1>
                    <p className='mt-1 text-sm text-zinc-500'>
                        {org
                            ? `${org.name} · ${org.locations.length} ${pluralPoints(org.locations.length)}`
                            : 'Управление точками вашей организации'}
                    </p>
                </div>
                {canAdd && !showForm && (
                    <Button
                        onClick={() => setShowForm(true)}
                        className='bg-amber-500 font-semibold text-black hover:bg-amber-400'
                    >
                        <Plus size={15} />
                        Добавить точку
                    </Button>
                )}
            </div>

            {/* Форма добавления */}
            {showForm && (
                <div className='mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm'>
                    <div className='mb-5 flex items-start justify-between'>
                        <div className='flex items-center gap-3'>
                            <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10'>
                                <Plus size={18} className='text-amber-400' />
                            </div>
                            <div>
                                <h2 className='text-sm font-semibold text-white'>Новая точка</h2>
                                <p className='text-xs text-zinc-500'>
                                    Заполните данные точки продаж
                                </p>
                            </div>
                        </div>
                        <button
                            type='button'
                            onClick={closeForm}
                            className='text-zinc-600 transition-colors hover:text-zinc-300'
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {formErrors.general && (
                        <div className='mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400'>
                            {formErrors.general}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className='space-y-4'>
                        <Field label='Название' error={formErrors.name}>
                            <Input
                                placeholder='Кальянная «Дым»'
                                disabled={saving}
                                value={form.name}
                                maxLength={60}
                                onChange={e => updateForm('name', e.target.value)}
                                className={inputCls(formErrors.name)}
                            />
                        </Field>

                        <Field label='Адрес' error={formErrors.address}>
                            <Input
                                placeholder='г. Москва, ул. Примерная, 1'
                                disabled={saving}
                                value={form.address}
                                maxLength={120}
                                onChange={e => updateForm('address', e.target.value)}
                                className={inputCls(formErrors.address)}
                            />
                        </Field>

                        <div className='grid grid-cols-2 gap-3'>
                            <Field label='Телефон' error={formErrors.phone}>
                                <Input
                                    placeholder='79991234567'
                                    disabled={saving}
                                    value={form.phone}
                                    maxLength={11}
                                    onChange={e => updateForm('phone', e.target.value)}
                                    className={inputCls(formErrors.phone)}
                                />
                            </Field>
                            <Field label='Активных мест' error={formErrors.activePlaces}>
                                <Input
                                    type='number'
                                    min={1}
                                    max={50}
                                    placeholder='10'
                                    disabled={saving}
                                    value={form.activePlaces}
                                    onChange={e => updateForm('activePlaces', e.target.value)}
                                    className={inputCls(formErrors.activePlaces)}
                                />
                            </Field>
                        </div>

                        <div className='flex gap-3 pt-2'>
                            <Button
                                type='button'
                                variant='outline'
                                disabled={saving}
                                onClick={closeForm}
                                className='border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                            >
                                Отмена
                            </Button>
                            <Button
                                type='submit'
                                disabled={saving}
                                className='flex-1 bg-amber-500 font-semibold text-black hover:bg-amber-400 disabled:opacity-40'
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                        Сохранение...
                                    </>
                                ) : (
                                    'Добавить точку'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Состояния */}
            {loading ? (
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className='h-36 rounded-xl bg-zinc-800/60' />
                    ))}
                </div>
            ) : error ? (
                <div className='rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400'>
                    {error}
                </div>
            ) : !org ? (
                <div className='flex items-center gap-3 rounded-lg border border-zinc-700/50 bg-zinc-800/30 px-4 py-3'>
                    <Building2 size={16} className='text-zinc-500' />
                    <p className='text-sm text-zinc-400'>
                        Организация ещё не создана.{' '}
                        <Link href='/onboarding' className='text-amber-400 hover:underline'>
                            Завершите регистрацию
                        </Link>
                    </p>
                </div>
            ) : (
                <>
                    {org.status === 'Pending' && (
                        <div className='mb-6 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3'>
                            <Clock size={16} className='mt-0.5 shrink-0 text-amber-400' />
                            <div>
                                <p className='text-sm font-medium text-amber-300'>
                                    Организация на проверке
                                </p>
                                <p className='mt-1 text-xs text-zinc-400'>
                                    Добавление точек станет доступно после активации организации.
                                </p>
                            </div>
                        </div>
                    )}

                    {org.locations.length === 0 ? (
                        <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 py-16'>
                            <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10'>
                                <MapPin size={22} className='text-amber-400' />
                            </div>
                            <p className='text-sm font-medium text-zinc-300'>Точек пока нет</p>
                            <p className='mt-1 text-xs text-zinc-500'>
                                Добавьте первую точку продаж
                            </p>
                            {canAdd && (
                                <Button
                                    onClick={() => setShowForm(true)}
                                    className='mt-5 bg-amber-500 font-semibold text-black hover:bg-amber-400'
                                >
                                    <Plus size={15} />
                                    Добавить точку
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                            {org.locations.map(location => {
                                const status = getStatusConfig(location.status);
                                return (
                                    <div
                                        key={location.id}
                                        className='rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition-colors hover:border-zinc-700'
                                    >
                                        <div className='mb-4 flex items-start justify-between gap-3'>
                                            <div className='flex min-w-0 items-center gap-2.5'>
                                                <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10'>
                                                    <MapPin
                                                        size={15}
                                                        className='text-amber-400'
                                                    />
                                                </div>
                                                <h3 className='truncate text-sm font-semibold text-white'>
                                                    {location.name}
                                                </h3>
                                            </div>
                                            <Badge className={status.className}>
                                                {status.label}
                                            </Badge>
                                        </div>

                                        <div className='space-y-2'>
                                            <InfoRow icon={MapPin} text={location.address} />
                                            {location.phone && (
                                                <InfoRow icon={Phone} text={location.phone} />
                                            )}
                                            <InfoRow
                                                icon={Armchair}
                                                text={`${location.activePlaces} активных мест`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function InfoRow({icon: Icon, text}: {icon: typeof MapPin; text: string}) {
    return (
        <div className='flex items-start gap-2 text-sm'>
            <Icon size={14} className='mt-0.5 shrink-0 text-zinc-500' />
            <span className='text-zinc-300'>{text}</span>
        </div>
    );
}

function Field({
    label,
    error,
    children
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className='space-y-1.5'>
            <Label className='text-xs font-medium uppercase tracking-wider text-zinc-400'>
                {label}
            </Label>
            {children}
            {error && <p className='text-xs text-red-400'>{error}</p>}
        </div>
    );
}
