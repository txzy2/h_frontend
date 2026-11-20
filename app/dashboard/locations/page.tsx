'use client';

import {useCallback, useEffect, useState} from 'react';
import Link from 'next/link';
import axios from 'axios';
import {toast} from 'sonner';
import type {Organization, OrganizationLocation} from '@/types/org';
import {useAuthStore} from '@/stores/auth.store';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {PhoneInput} from '@/components/ui/phone-input';
import {Badge} from '@/components/ui/badge';
import {formatPhone, isValidPhone, normalizePhone} from '@/lib/phone';
import {Skeleton} from '@/components/ui/skeleton';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import {
    Armchair,
    Building2,
    Clock,
    LayoutGrid,
    Loader2,
    MapPin,
    Pencil,
    Phone,
    Plus,
    X
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocationForm {
    name: string;
    address: string;
    phone: string;
    activePlaces: number | '';
    status: string;
}

interface LocationErrors {
    name?: string;
    address?: string;
    phone?: string;
    activePlaces?: string;
    status?: string;
    general?: string;
}

const EMPTY_FORM: LocationForm = {
    name: '',
    address: '',
    phone: '',
    activePlaces: '',
    status: 'Active'
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls = (hasError?: string) =>
    [
        'border-app-border bg-surface-2/50 text-app-fg placeholder:text-app-subtle',
        'focus-visible:border-brand/60 focus-visible:ring-0 focus-visible:ring-offset-0',
        hasError ? 'border-red-500/60' : ''
    ].join(' ');

function validateForm(form: LocationForm): LocationErrors {
    const errors: LocationErrors = {};
    if (!form.name.trim()) errors.name = 'Введите название';
    if (!form.address.trim()) errors.address = 'Введите адрес';
    if (!form.phone.trim()) errors.phone = 'Введите телефон';
    else if (!isValidPhone(form.phone)) errors.phone = 'Введите телефон полностью';
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
        return {label: 'На проверке', className: 'border-brand/30 bg-brand/15 text-brand'};
    }
    return {label: 'Неактивна', className: 'border-zinc-500/30 bg-zinc-500/15 text-app-muted'};
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LocationsPage() {
    const {user} = useAuthStore();

    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
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

    useEffect(() => {
        if (!showForm) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !saving) {
                setShowForm(false);
                setEditingId(null);
                setForm(EMPTY_FORM);
                setFormErrors({});
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showForm, saving]);

    const canManage = user?.role === 'Admin' || user?.role === 'SuperUser';
    const canAdd = canManage && org?.status === 'Active';

    const updateForm = (field: keyof LocationForm, value: string | number) => {
        setForm(prev => ({...prev, [field]: value}));
        if (formErrors[field]) setFormErrors(prev => ({...prev, [field]: undefined}));
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
        setFormErrors({});
    };

    const openEdit = (location: OrganizationLocation) => {
        setEditingId(location.id);
        setForm({
            name: location.name,
            address: location.address,
            phone: location.phone ?? '',
            activePlaces: location.activePlaces,
            status: location.status
        });
        setFormErrors({});
        setShowForm(true);
        window.scrollTo({top: 0, behavior: 'smooth'});
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
            const payload = {
                name: form.name.trim(),
                address: form.address.trim(),
                phone: normalizePhone(form.phone),
                activePlaces: Number(form.activePlaces)
            };
            const {data} = editingId
                ? await axios.patch('/api/locations', {
                      id: editingId,
                      ...payload,
                      status: form.status
                  })
                : await axios.post('/api/locations', payload);

            if (data.success) {
                toast.success(editingId ? 'Точка обновлена' : 'Точка добавлена');
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
                                className='text-app-subtle transition-colors hover:text-app-fg/80'
                            >
                                Дашборд
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className='text-app-subtle/70' />
                    <BreadcrumbItem>
                        <BreadcrumbPage className='text-app-fg/80'>Точки</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Заголовок */}
            <div className='mb-6 flex flex-wrap items-end justify-between gap-4'>
                <div>
                    <h1 className='text-xl font-bold text-app-fg'>Точки продаж</h1>
                    <p className='mt-1 text-sm text-app-subtle'>
                        {org
                            ? `${org.name} · ${org.locations.length} ${pluralPoints(org.locations.length)}`
                            : 'Управление точками вашей организации'}
                    </p>
                </div>
                {canAdd && !showForm && (
                    <Button
                        onClick={() => {
                            setEditingId(null);
                            setForm(EMPTY_FORM);
                            setFormErrors({});
                            setShowForm(true);
                        }}
                        className='bg-brand font-semibold text-brand-fg hover:bg-brand/90'
                    >
                        <Plus size={15} />
                        Добавить точку
                    </Button>
                )}
            </div>

            {/* Попап добавления/редактирования точки */}
            {showForm && (
                <div
                    className='fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center'
                    onMouseDown={event => {
                        if (event.target === event.currentTarget && !saving) closeForm();
                    }}
                >
                    <div className='max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-app-border bg-surface p-6 shadow-2xl sm:rounded-2xl'>
                    <div className='mb-5 flex items-start justify-between'>
                        <div className='flex items-center gap-3'>
                            <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10'>
                                {editingId ? (
                                    <Pencil size={18} className='text-brand' />
                                ) : (
                                    <Plus size={18} className='text-brand' />
                                )}
                            </div>
                            <div>
                                <h2 className='text-sm font-semibold text-app-fg'>
                                    {editingId ? 'Редактировать точку' : 'Новая точка'}
                                </h2>
                                <p className='text-xs text-app-subtle'>
                                    {editingId
                                        ? 'Измените данные точки продаж'
                                        : 'Заполните данные точки продаж'}
                                </p>
                            </div>
                        </div>
                        <button
                            type='button'
                            onClick={closeForm}
                            className='text-app-subtle transition-colors hover:text-app-fg/80'
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
                                <PhoneInput
                                    placeholder='+7 (999) 123-45-67'
                                    disabled={saving}
                                    value={form.phone}
                                    onChange={value => updateForm('phone', value)}
                                    className={inputCls(formErrors.phone)}
                                />
                            </Field>
                            <Field label='Количество столов' error={formErrors.activePlaces}>
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

                        {editingId !== null && (
                            <Field label='Статус точки'>
                                <select
                                    value={form.status}
                                    disabled={saving}
                                    onChange={event =>
                                        updateForm('status', event.target.value)
                                    }
                                    className='h-9 w-full cursor-pointer rounded-md border border-app-border bg-surface-2/50 px-3 text-sm text-app-fg outline-none focus:border-brand/60 disabled:opacity-40'
                                >
                                    <option value='Active'>Активна</option>
                                    <option value='Inactive'>Неактивна</option>
                                    <option value='Pending'>На проверке</option>
                                    <option value='Closed'>Закрыта</option>
                                </select>
                            </Field>
                        )}

                        <p className='text-xs text-app-subtle'>
                            Столы и их расстановка настраиваются в{' '}
                            <Link
                                href='/dashboard/floor-plan'
                                className='font-medium text-brand hover:text-brand/80'
                            >
                                плане зала
                            </Link>
                            .
                        </p>

                        <div className='flex gap-3 pt-2'>
                            <Button
                                type='button'
                                variant='outline'
                                disabled={saving}
                                onClick={closeForm}
                                className='border-app-border text-app-muted hover:bg-surface-2 hover:text-app-fg'
                            >
                                Отмена
                            </Button>
                            <Button
                                type='submit'
                                disabled={saving}
                                className='flex-1 bg-brand font-semibold text-brand-fg hover:bg-brand/90 disabled:opacity-40'
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                        Сохранение...
                                    </>
                                ) : editingId ? (
                                    'Сохранить изменения'
                                ) : (
                                    'Добавить точку'
                                )}
                            </Button>
                        </div>
                    </form>
                    </div>
                </div>
            )}

            {/* Состояния */}
            {loading ? (
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className='h-36 rounded-xl bg-surface-2/60' />
                    ))}
                </div>
            ) : error ? (
                <div className='rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400'>
                    {error}
                </div>
            ) : !org ? (
                <div className='flex items-center gap-3 rounded-lg border border-app-border/50 bg-surface-2/30 px-4 py-3'>
                    <Building2 size={16} className='text-app-subtle' />
                    <p className='text-sm text-app-muted'>
                        Организация ещё не создана.{' '}
                        <Link href='/onboarding' className='text-brand hover:underline'>
                            Завершите регистрацию
                        </Link>
                    </p>
                </div>
            ) : (
                <>
                    {org.status === 'Pending' && (
                        <div className='mb-6 flex items-start gap-3 rounded-lg border border-brand/20 bg-brand/5 px-4 py-3'>
                            <Clock size={16} className='mt-0.5 shrink-0 text-brand' />
                            <div>
                                <p className='text-sm font-medium text-brand'>
                                    Организация на проверке
                                </p>
                                <p className='mt-1 text-xs text-app-muted'>
                                    Добавление точек станет доступно после активации организации.
                                </p>
                            </div>
                        </div>
                    )}

                    {org.locations.length === 0 ? (
                        <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-app-border py-16'>
                            <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10'>
                                <MapPin size={22} className='text-brand' />
                            </div>
                            <p className='text-sm font-medium text-app-fg/80'>Точек пока нет</p>
                            <p className='mt-1 text-xs text-app-subtle'>
                                Добавьте первую точку продаж
                            </p>
                            {canAdd && (
                                <Button
                                    onClick={() => {
                                        setEditingId(null);
                                        setForm(EMPTY_FORM);
                                        setFormErrors({});
                                        setShowForm(true);
                                    }}
                                    className='mt-5 bg-brand font-semibold text-brand-fg hover:bg-brand/90'
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
                                        className='rounded-xl border border-app-border bg-surface/60 p-5 transition-colors hover:border-app-border'
                                    >
                                        <div className='mb-4 flex items-start justify-between gap-3'>
                                            <div className='flex min-w-0 items-center gap-2.5'>
                                                <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10'>
                                                    <MapPin
                                                        size={15}
                                                        className='text-brand'
                                                    />
                                                </div>
                                                <h3 className='truncate text-sm font-semibold text-app-fg'>
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
                                                <InfoRow
                                                    icon={Phone}
                                                    text={formatPhone(location.phone)}
                                                />
                                            )}
                                            <InfoRow
                                                icon={Armchair}
                                                text={`Столов: ${location.activePlaces}`}
                                            />
                                        </div>

                                        {canManage && (
                                            <div className='mt-4 flex flex-wrap items-center gap-2 border-t border-app-border/60 pt-3'>
                                                <Button
                                                    type='button'
                                                    variant='outline'
                                                    size='sm'
                                                    onClick={() => openEdit(location)}
                                                    className='h-8 gap-1.5 border-app-border text-app-muted hover:bg-surface-2 hover:text-app-fg'
                                                >
                                                    <Pencil size={13} />
                                                    Редактировать
                                                </Button>
                                                <Link
                                                    href='/dashboard/floor-plan'
                                                    className='inline-flex h-8 items-center gap-1.5 rounded-md border border-app-border px-3 text-xs font-medium text-app-muted transition-colors hover:bg-surface-2 hover:text-app-fg'
                                                >
                                                    <LayoutGrid size={13} />
                                                    План зала
                                                </Link>
                                            </div>
                                        )}
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
            <Icon size={14} className='mt-0.5 shrink-0 text-app-subtle' />
            <span className='text-app-fg/80'>{text}</span>
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
            <Label className='text-xs font-medium uppercase tracking-wider text-app-muted'>
                {label}
            </Label>
            {children}
            {error && <p className='text-xs text-red-400'>{error}</p>}
        </div>
    );
}
