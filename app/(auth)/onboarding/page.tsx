'use client';

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useAuthStore} from '@/stores/auth.store';
import {useSession} from '@/hooks/useSession';
import axios from 'axios';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Loader2, Building2, MapPin, CheckCircle2, Plus, Trash2} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrgForm {
    name: string;
    inn: string;
    kpp: string;
    director: string;
    phoneNumber: string;
    plan: string;
}

interface LocationForm {
    name: string;
    address: string;
    phone: string;
    activePlaces: number | '';
}

interface OrgErrors {
    name?: string;
    inn?: string;
    kpp?: string;
    director?: string;
    phoneNumber?: string;
    plan?: string;
    general?: string;
}

interface LocationErrors {
    general?: string;
    items?: {name?: string; address?: string; activePlaces?: string}[];
}

const PLANS = [
    {value: 'Basic', label: 'Basic', description: 'До 5 точек'},
    {value: 'Medium', label: 'Medium', description: 'До 10 точек'},
    {value: 'Pro', label: 'Pro', description: 'До 10 точек'}
];

const STEPS = [
    {num: 1, label: 'Аккаунт', icon: '✓'},
    {num: 2, label: 'Организация', icon: Building2},
    {num: 3, label: 'Точки', icon: MapPin}
];

// ─── Validation ───────────────────────────────────────────────────────────────

function validateOrg(form: OrgForm): OrgErrors {
    const errors: OrgErrors = {};
    if (!form.name.trim()) errors.name = 'Введите название';
    if (!form.inn.trim()) errors.inn = 'Введите ИНН';
    else if (!/^\d{10}(\d{2})?$/.test(form.inn)) errors.inn = '10 или 12 цифр';
    if (!form.kpp.trim()) errors.kpp = 'Введите КПП';
    else if (!/^\d{9}$/.test(form.kpp)) errors.kpp = '9 цифр';
    if (!form.director.trim()) errors.director = 'Введите ФИО директора';
    if (!form.phoneNumber.trim()) errors.phoneNumber = 'Введите телефон';
    if (!form.plan) errors.plan = 'Выберите тариф';
    return errors;
}

function validateLocations(locations: LocationForm[]): LocationErrors {
    const items = locations.map(loc => {
        const e: {name?: string; address?: string; activePlaces?: string} = {};
        if (!loc.name.trim()) e.name = 'Введите название';
        if (!loc.address.trim()) e.address = 'Введите адрес';
        if (!loc.activePlaces || Number(loc.activePlaces) < 1) e.activePlaces = 'Мин. 1';
        return e;
    });
    const hasErrors = items.some(e => Object.keys(e).length > 0);
    return hasErrors ? {items} : {};
}

// ─── Input style helper ───────────────────────────────────────────────────────

const inputCls = (hasError?: string) =>
    [
        'border-zinc-700 bg-zinc-800/50 text-white placeholder:text-zinc-600',
        'focus-visible:border-amber-500/60 focus-visible:ring-0 focus-visible:ring-offset-0',
        'disabled:opacity-40',
        hasError ? 'border-red-500/60' : ''
    ].join(' ');

// ─── Main component ───────────────────────────────────────────────────────────

export default function Onboarding() {
    const router = useRouter();
    const {isLoading} = useSession();
    const {user} = useAuthStore();

    const [step, setStep] = useState(2); // шаг 1 (аккаунт) уже пройден
    const [draftId, setDraftId] = useState<string | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [plans, setPlans] = useState<
        {id: number; name: string; description: string; price: number; maxLocations: number}[]
    >([]);

    useEffect(() => {
        axios.get('/api/plans').then(({data}) => {
            if (data.success) setPlans(data.data);
        });
    }, []);

    // Step 2
    const [orgForm, setOrgForm] = useState<OrgForm>({
        name: '',
        inn: '',
        kpp: '',
        director: '',
        phoneNumber: '',
        plan: ''
    });
    const [orgErrors, setOrgErrors] = useState<OrgErrors>({});
    const [orgLoading, setOrgLoading] = useState(false);

    // Step 3
    const [locations, setLocations] = useState<LocationForm[]>([
        {name: '', address: '', phone: '', activePlaces: ''}
    ]);
    const [locErrors, setLocErrors] = useState<LocationErrors>({});
    const [locLoading, setLocLoading] = useState(false);

    // Submit
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [done, setDone] = useState(false);

    // Загружаем/создаём черновик
    useEffect(() => {
        if (isLoading) return;
        if (!user) {
            router.replace('/login');
            return;
        }

        const fetchDraft = async () => {
            try {
                const {data} = await axios.get('/api/onboarding/draft');
                if (data.success) {
                    setDraftId(data.data.id);
                    // Восстанавливаем шаг если пользователь вернулся
                    const currentStep = data.data.currentStep;
                    if (currentStep >= 2 && data.data.organization) {
                        const org = data.data.organization;
                        setOrgForm({
                            name: org.name ?? '',
                            inn: org.inn ?? '',
                            kpp: org.kpp ?? '',
                            director: org.director ?? '',
                            phoneNumber: org.phoneNumber ?? '',
                            plan: org.plan ?? ''
                        });
                    }
                    if (currentStep >= 3 && data.data.locations?.length) {
                        setLocations(
                            data.data.locations.map((l: any) => ({
                                name: l.name,
                                address: l.address,
                                phone: l.phone ?? '',
                                activePlaces: l.activePlaces
                            }))
                        );
                    }
                    setStep(Math.max(2, Math.min(currentStep, 3)));
                }
            } catch {
                // ignore
            } finally {
                setIsFetching(false);
            }
        };

        fetchDraft();
    }, [isLoading, user, router]);

    // ── Step 2: сохранить организацию ─────────────────────────────────────────

    const handleOrgSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors = validateOrg(orgForm);
        if (Object.keys(errors).length > 0) {
            setOrgErrors(errors);
            return;
        }

        setOrgLoading(true);
        setOrgErrors({});

        try {
            const {data} = await axios.post('/api/onboarding/organization', {
                draftId,
                ...orgForm
            });
            if (data.success) {
                setStep(3);
            } else {
                setOrgErrors({general: data.data ?? 'Ошибка сохранения'});
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setOrgErrors({general: err.response?.data?.data ?? 'Ошибка сети'});
            }
        } finally {
            setOrgLoading(false);
        }
    };

    // ── Step 3: сохранить точки и сабмит ──────────────────────────────────────

    const addLocation = () => {
        setLocations(prev => [...prev, {name: '', address: '', phone: '', activePlaces: ''}]);
    };

    const removeLocation = (i: number) => {
        setLocations(prev => prev.filter((_, idx) => idx !== i));
    };

    const updateLocation = (i: number, field: keyof LocationForm, value: string | number) => {
        setLocations(prev => prev.map((loc, idx) => (idx === i ? {...loc, [field]: value} : loc)));
        if (locErrors.items?.[i]) {
            setLocErrors(prev => {
                const items = [...(prev.items ?? [])];
                items[i] = {...items[i], [field]: undefined};
                return {...prev, items};
            });
        }
    };

    const handleLocationsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors = validateLocations(locations);
        if (Object.keys(errors).length > 0) {
            setLocErrors(errors);
            return;
        }

        setLocLoading(true);
        setLocErrors({});

        try {
            // Сохраняем точки
            const {data: locData} = await axios.post('/api/onboarding/locations', {
                draftId,
                locations: locations.map(l => ({
                    ...l,
                    activePlaces: Number(l.activePlaces),
                    phone: l.phone || undefined
                }))
            });

            if (!locData.success) {
                setLocErrors({general: locData.data ?? 'Ошибка сохранения точек'});
                return;
            }

            // Финальный сабмит
            setSubmitLoading(true);
            const {data: submitData} = await axios.post('/api/onboarding/submit', {draftId});

            if (submitData.success) {
                setDone(true);
                setTimeout(() => router.replace('/dashboard'), 2500);
            } else {
                setSubmitError(submitData.data ?? 'Ошибка регистрации организации');
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setSubmitError(err.response?.data?.data ?? 'Ошибка сети');
            }
        } finally {
            setLocLoading(false);
            setSubmitLoading(false);
        }
    };

    // ── Renders ───────────────────────────────────────────────────────────────

    if (isLoading || isFetching) {
        return (
            <div className='flex min-h-screen items-center justify-center bg-[#0a0a0a]'>
                <div className='h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent' />
            </div>
        );
    }

    if (done) {
        return (
            <div className='flex min-h-screen items-center justify-center bg-[#0a0a0a]'>
                <div className='text-center'>
                    <div className='mb-4 flex justify-center'>
                        <div className='flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10'>
                            <CheckCircle2 size={32} className='text-amber-400' />
                        </div>
                    </div>
                    <h2 className='text-xl font-bold text-white'>Организация зарегистрирована!</h2>
                    <p className='mt-2 text-sm text-zinc-500'>Переходим в панель управления...</p>
                </div>
            </div>
        );
    }

    return (
        <div className='relative flex min-h-screen flex-col overflow-hidden bg-[#0a0a0a]'>
            {/* Фоновые блюры */}
            <div className='pointer-events-none absolute inset-0 overflow-hidden'>
                <div className='absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-amber-900/10 blur-[120px]' />
                <div className='absolute -right-32 bottom-0 h-[400px] w-[400px] rounded-full bg-orange-900/8 blur-[120px]' />
            </div>

            {/* Сетка */}
            <div
                className='pointer-events-none absolute inset-0 opacity-[0.025]'
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(251,191,36,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.5) 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }}
            />

            <div className='relative mx-auto w-full max-w-lg flex-1 px-4 py-12'>
                {/* Лого */}
                <div className='mb-10 text-center'>
                    <span className='text-2xl font-bold tracking-tight text-white'>HooBu</span>
                    <p className='mt-1 text-sm text-zinc-500'>Настройка организации</p>
                </div>

                {/* Прогресс шагов */}
                <div className='mb-10 flex items-center justify-center gap-0'>
                    {[
                        {num: 1, label: 'Аккаунт'},
                        {num: 2, label: 'Организация'},
                        {num: 3, label: 'Точки'}
                    ].map((s, idx) => (
                        <div key={s.num} className='flex items-center'>
                            <div className='flex flex-col items-center'>
                                <div
                                    className={[
                                        'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all',
                                        s.num < step
                                            ? 'bg-amber-500 text-black'
                                            : s.num === step
                                              ? 'border-2 border-amber-500 bg-amber-500/10 text-amber-400'
                                              : 'border border-zinc-700 bg-zinc-900 text-zinc-600'
                                    ].join(' ')}
                                >
                                    {s.num < step ? '✓' : s.num}
                                </div>
                                <span
                                    className={[
                                        'mt-1.5 text-[10px] font-medium',
                                        s.num === step ? 'text-amber-400' : 'text-zinc-600'
                                    ].join(' ')}
                                >
                                    {s.label}
                                </span>
                            </div>
                            {idx < 2 && (
                                <div
                                    className={[
                                        'mx-2 mb-4 h-px w-16 transition-all',
                                        s.num < step ? 'bg-amber-500/50' : 'bg-zinc-800'
                                    ].join(' ')}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* ── Шаг 2: Организация ── */}
                {step === 2 && (
                    <div className='rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-sm'>
                        <div className='mb-6 flex items-center gap-3'>
                            <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10'>
                                <Building2 size={18} className='text-amber-400' />
                            </div>
                            <div>
                                <h2 className='text-sm font-semibold text-white'>
                                    Данные организации
                                </h2>
                                <p className='text-xs text-zinc-500'>
                                    Заполните юридические данные
                                </p>
                            </div>
                        </div>

                        {orgErrors.general && (
                            <div className='mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400'>
                                {orgErrors.general}
                            </div>
                        )}

                        <form onSubmit={handleOrgSubmit} noValidate className='space-y-4'>
                            <Field label='Название организации' error={orgErrors.name}>
                                <Input
                                    name='name'
                                    placeholder='ООО «Пример»'
                                    disabled={orgLoading}
                                    value={orgForm.name}
                                    maxLength={100}
                                    onChange={e => {
                                        setOrgForm(p => ({...p, name: e.target.value}));
                                        if (orgErrors.name)
                                            setOrgErrors(p => ({...p, name: undefined}));
                                    }}
                                    className={inputCls(orgErrors.name)}
                                />
                            </Field>

                            <div className='grid grid-cols-2 gap-3'>
                                <Field label='ИНН' error={orgErrors.inn}>
                                    <Input
                                        name='inn'
                                        placeholder='1234567890'
                                        disabled={orgLoading}
                                        value={orgForm.inn}
                                        maxLength={10}
                                        onChange={e => {
                                            setOrgForm(p => ({...p, inn: e.target.value}));
                                            if (orgErrors.inn)
                                                setOrgErrors(p => ({...p, inn: undefined}));
                                        }}
                                        className={inputCls(orgErrors.inn)}
                                    />
                                </Field>
                                <Field label='КПП' error={orgErrors.kpp}>
                                    <Input
                                        name='kpp'
                                        placeholder='123456789'
                                        disabled={orgLoading}
                                        value={orgForm.kpp}
                                        maxLength={9}
                                        onChange={e => {
                                            setOrgForm(p => ({...p, kpp: e.target.value}));
                                            if (orgErrors.kpp)
                                                setOrgErrors(p => ({...p, kpp: undefined}));
                                        }}
                                        className={inputCls(orgErrors.kpp)}
                                    />
                                </Field>
                            </div>

                            <Field label='ФИО директора' error={orgErrors.director}>
                                <Input
                                    name='director'
                                    placeholder='Иванов Иван Иванович'
                                    disabled={orgLoading}
                                    value={orgForm.director}
                                    maxLength={50}
                                    onChange={e => {
                                        setOrgForm(p => ({...p, director: e.target.value}));
                                        if (orgErrors.director)
                                            setOrgErrors(p => ({...p, director: undefined}));
                                    }}
                                    className={inputCls(orgErrors.director)}
                                />
                            </Field>

                            <Field label='Телефон организации' error={orgErrors.phoneNumber}>
                                <Input
                                    name='phoneNumber'
                                    placeholder='79991234567'
                                    disabled={orgLoading}
                                    value={orgForm.phoneNumber}
                                    maxLength={11}
                                    onChange={e => {
                                        setOrgForm(p => ({...p, phoneNumber: e.target.value}));
                                        if (orgErrors.phoneNumber)
                                            setOrgErrors(p => ({...p, phoneNumber: undefined}));
                                    }}
                                    className={inputCls(orgErrors.phoneNumber)}
                                />
                            </Field>

                            {/* Тарифный план */}
                            <div className='space-y-2'>
                                <Label className='text-xs font-medium uppercase tracking-wider text-zinc-400'>
                                    Тарифный план
                                </Label>
                                {plans.length === 0 ? (
                                    <div className='grid grid-cols-3 gap-2'>
                                        {[1, 2, 3].map(i => (
                                            <div
                                                key={i}
                                                className='h-[88px] animate-pulse rounded-lg border border-zinc-800 bg-zinc-800/50'
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className='grid grid-cols-3 gap-2'>
                                        {plans.map(plan => (
                                            <button
                                                key={plan.name}
                                                type='button'
                                                onClick={() =>
                                                    setOrgForm(p => ({...p, plan: plan.name}))
                                                }
                                                className={[
                                                    'rounded-lg border p-3 text-left transition-all',
                                                    orgForm.plan === plan.name
                                                        ? 'border-amber-500/60 bg-amber-500/10'
                                                        : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                                ].join(' ')}
                                            >
                                                <div
                                                    className={
                                                        orgForm.plan === plan.name
                                                            ? 'text-sm font-semibold text-amber-400'
                                                            : 'text-sm font-semibold text-white'
                                                    }
                                                >
                                                    {plan.name}
                                                </div>
                                                <div className='mt-0.5 text-xs text-zinc-500'>
                                                    {plan.description}
                                                </div>
                                                <div className='mt-1 text-xs text-zinc-600'>
                                                    До {plan.maxLocations} точек
                                                </div>
                                                <div className='mt-1 text-xs text-zinc-600'>
                                                    {plan.price} ₽ в месяц
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {orgErrors.plan && (
                                    <p className='text-xs text-red-400'>{orgErrors.plan}</p>
                                )}
                            </div>

                            <Button
                                type='submit'
                                disabled={orgLoading}
                                className='mt-2 w-full bg-amber-500 font-semibold text-black hover:bg-amber-400 disabled:opacity-40'
                            >
                                {orgLoading ? (
                                    <>
                                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                        Сохранение...
                                    </>
                                ) : (
                                    'Далее →'
                                )}
                            </Button>
                        </form>
                    </div>
                )}

                {/* ── Шаг 3: Точки ── */}
                {step === 3 && (
                    <div className='rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-sm'>
                        <div className='mb-6 flex items-center gap-3'>
                            <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10'>
                                <MapPin size={18} className='text-amber-400' />
                            </div>
                            <div>
                                <h2 className='text-sm font-semibold text-white'>Точки продаж</h2>
                                <p className='text-xs text-zinc-500'>Добавьте ваши кальянные</p>
                            </div>
                        </div>

                        {locErrors.general && (
                            <div className='mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400'>
                                {locErrors.general}
                            </div>
                        )}

                        {submitError && (
                            <div className='mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400'>
                                {submitError}
                            </div>
                        )}

                        <form onSubmit={handleLocationsSubmit} noValidate className='space-y-4'>
                            {locations.map((loc, i) => (
                                <div
                                    key={i}
                                    className='rounded-xl border border-zinc-800 bg-zinc-800/30 p-4'
                                >
                                    <div className='mb-3 flex items-center justify-between'>
                                        <span className='text-xs font-medium text-zinc-400'>
                                            Точка {i + 1}
                                        </span>
                                        {locations.length > 1 && (
                                            <button
                                                type='button'
                                                onClick={() => removeLocation(i)}
                                                className='text-zinc-600 transition-colors hover:text-red-400'
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>

                                    <div className='space-y-3'>
                                        <Field label='Название' error={locErrors.items?.[i]?.name}>
                                            <Input
                                                placeholder='Кальянная «Дым»'
                                                value={loc.name}
                                                maxLength={60}
                                                onChange={e =>
                                                    updateLocation(i, 'name', e.target.value)
                                                }
                                                className={inputCls(locErrors.items?.[i]?.name)}
                                            />
                                        </Field>
                                        <Field label='Адрес' error={locErrors.items?.[i]?.address}>
                                            <Input
                                                placeholder='г. Москва, ул. Примерная, 1'
                                                value={loc.address}
                                                maxLength={120}
                                                onChange={e =>
                                                    updateLocation(i, 'address', e.target.value)
                                                }
                                                className={inputCls(locErrors.items?.[i]?.address)}
                                            />
                                        </Field>
                                        <div className='grid grid-cols-2 gap-3'>
                                            <Field label='Телефон (опционально)'>
                                                <Input
                                                    placeholder='79991234567'
                                                    value={loc.phone}
                                                    maxLength={11}
                                                    onChange={e =>
                                                        updateLocation(i, 'phone', e.target.value)
                                                    }
                                                    className={inputCls()}
                                                />
                                            </Field>
                                            <Field
                                                label='Активных мест'
                                                error={locErrors.items?.[i]?.activePlaces}
                                            >
                                                <Input
                                                    type='number'
                                                    min={1}
                                                    placeholder='10'
                                                    maxLength={3}
                                                    value={loc.activePlaces}
                                                    onChange={e =>
                                                        updateLocation(
                                                            i,
                                                            'activePlaces',
                                                            e.target.value
                                                        )
                                                    }
                                                    className={inputCls(
                                                        locErrors.items?.[i]?.activePlaces
                                                    )}
                                                />
                                            </Field>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                type='button'
                                onClick={addLocation}
                                className='flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-3 text-sm text-zinc-500 transition-colors hover:border-amber-500/40 hover:text-amber-400'
                            >
                                <Plus size={15} />
                                Добавить точку
                            </button>

                            <div className='flex gap-3 pt-2'>
                                <Button
                                    type='button'
                                    variant='outline'
                                    onClick={() => setStep(2)}
                                    className='border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                >
                                    ← Назад
                                </Button>
                                <Button
                                    type='submit'
                                    disabled={locLoading || submitLoading}
                                    className='flex-1 bg-amber-500 font-semibold text-black hover:bg-amber-400 disabled:opacity-40'
                                >
                                    {locLoading || submitLoading ? (
                                        <>
                                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                            Регистрация...
                                        </>
                                    ) : (
                                        'Завершить регистрацию'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Field helper component ───────────────────────────────────────────────────

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
