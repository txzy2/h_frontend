'use client';

import {Header} from '@/components/layout/header';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {useSession} from '@/hooks/useSession';
import {useAuthStore} from '@/stores/auth.store';
import axios from 'axios';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
import {Eye, EyeOff, Loader2, ShieldCheck} from 'lucide-react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import Link from 'next/link';

// Правила валидации совпадают с бэком
const PASSWORD_RULES = {
    minLength: 8,
    hasNumber: /(?=.*\d)/,
    hasSpecial: /(?=.*[!@#$%^&*(),.?":{}|<>])/
};

interface FormState {
    login: string;
    old_password: string;
    new_password: string;
    confirm_password: string;
}

interface FormErrors {
    login?: string;
    old_password?: string;
    new_password?: string;
    confirm_password?: string;
    general?: string;
}

function validatePassword(value: string, fieldName: string): string | undefined {
    if (!value.trim()) return 'Обязательное поле';
    if (value.length < PASSWORD_RULES.minLength) return 'Минимум 8 символов';
    if (!PASSWORD_RULES.hasNumber.test(value)) return 'Нужна хотя бы одна цифра';
    if (!PASSWORD_RULES.hasSpecial.test(value)) return 'Нужен хотя бы один спецсимвол';
    return undefined;
}

function validate(form: FormState): FormErrors {
    const errors: FormErrors = {};

    if (!form.login.trim()) errors.login = 'Введите логин';

    const oldErr = validatePassword(form.old_password, 'old_password');
    if (oldErr) errors.old_password = oldErr;

    const newErr = validatePassword(form.new_password, 'new_password');
    if (newErr) errors.new_password = newErr;

    if (!form.confirm_password.trim()) {
        errors.confirm_password = 'Подтвердите пароль';
    } else if (form.new_password !== form.confirm_password) {
        errors.confirm_password = 'Пароли не совпадают';
    }

    return errors;
}

export default function Settings() {
    const {isLoading} = useSession();
    const {user, clearUser, clearPermissions} = useAuthStore();
    const router = useRouter();

    const [form, setForm] = useState<FormState>({
        login: '',
        old_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [show, setShow] = useState({old: false, new: false, confirm: false});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Предзаполняем логин из store
    useEffect(() => {
        if (user?.login) {
            setForm(prev => ({...prev, login: user.login}));
        }
    }, [user]);

    const logout = async () => {
        try {
            await axios.post('/api/auth/logout');
        } finally {
            clearUser();
            clearPermissions();
            router.replace('/login');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setForm(prev => ({...prev, [name]: value}));
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({...prev, [name]: undefined, general: undefined}));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors = validate(form);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            const {data} = await axios.post('/api/auth/change-password/request', {
                login: form.login,
                old_password: form.old_password,
                new_password: form.new_password,
                confirm_password: form.confirm_password
            });

            if (data.success) {
                // Передаём request_id через sessionStorage
                sessionStorage.setItem('cp_request_id', data.data.request_id);
                router.push('/dashboard/settings/verify');
            } else {
                setErrors({general: typeof data.data === 'string' ? data.data : 'Ошибка запроса'});
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const message =
                    error.response?.data?.data ?? error.response?.data?.error ?? 'Ошибка сети';
                setErrors({general: message});
            } else {
                setErrors({general: 'Неизвестная ошибка'});
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || !user) {
        return (
            <div className='flex min-h-screen items-center justify-center bg-[#0a0a0a]'>
                <div className='h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent' />
            </div>
        );
    }

    return (
        <div className='flex min-h-screen flex-col bg-[#0a0a0a]'>
            <Header user={user} isLoading={isLoading} onLogout={logout} />

            <main className='mx-auto w-full max-w-screen-xl flex-1 px-4 py-8'>
                <Breadcrumb className='mb-6'>
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
                            <BreadcrumbPage className='text-zinc-300'>Настройки</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className='mb-6'>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className='text-xs text-zinc-600 transition-colors hover:text-zinc-400'
                    >
                        ← Назад к дашборду
                    </button>
                    <h1 className='mt-3 text-2xl font-bold text-white'>Настройки</h1>
                    <p className='mt-1 text-sm text-zinc-500'>Управление вашим аккаунтом</p>
                </div>

                <div className='max-w-md'>
                    <div className='rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 backdrop-blur-sm'>
                        {/* Заголовок секции */}
                        <div className='mb-6 flex items-center gap-3'>
                            <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10'>
                                <ShieldCheck size={18} className='text-amber-400' />
                            </div>
                            <div>
                                <h2 className='text-sm font-semibold text-white'>Смена пароля</h2>
                                <p className='text-xs text-zinc-500'>
                                    Код подтверждения придёт на {user.email}
                                </p>
                            </div>
                        </div>

                        {/* Общая ошибка */}
                        {errors.general && (
                            <div className='mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400'>
                                {errors.general}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} noValidate className='space-y-4'>
                            {/* Логин (readonly) */}
                            <div className='space-y-1.5'>
                                <Label className='text-xs font-medium uppercase tracking-wider text-zinc-400'>
                                    Логин
                                </Label>
                                <Input
                                    name='login'
                                    value={form.login}
                                    readOnly
                                    className='border-zinc-700 bg-zinc-800/30 text-zinc-400 cursor-default focus-visible:ring-0 focus-visible:ring-offset-0'
                                />
                            </div>

                            {/* Старый пароль */}
                            <PasswordField
                                id='old_password'
                                label='Текущий пароль'
                                value={form.old_password}
                                show={show.old}
                                error={errors.old_password}
                                disabled={isSubmitting}
                                onToggle={() => setShow(p => ({...p, old: !p.old}))}
                                onChange={handleChange}
                            />

                            <div className='border-t border-zinc-800 pt-4'>
                                {/* Новый пароль */}
                                <div className='space-y-4'>
                                    <PasswordField
                                        id='new_password'
                                        label='Новый пароль'
                                        value={form.new_password}
                                        show={show.new}
                                        error={errors.new_password}
                                        disabled={isSubmitting}
                                        onToggle={() => setShow(p => ({...p, new: !p.new}))}
                                        onChange={handleChange}
                                    />

                                    {/* Подтверждение */}
                                    <PasswordField
                                        id='confirm_password'
                                        label='Подтвердите новый пароль'
                                        value={form.confirm_password}
                                        show={show.confirm}
                                        error={errors.confirm_password}
                                        disabled={isSubmitting}
                                        onToggle={() => setShow(p => ({...p, confirm: !p.confirm}))}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Подсказка */}
                            <p className='text-xs text-zinc-600'>
                                Пароль должен содержать минимум 8 символов, цифру и спецсимвол
                            </p>

                            <Button
                                type='submit'
                                disabled={isSubmitting}
                                className='w-full bg-amber-500 font-semibold text-black hover:bg-amber-400 disabled:opacity-40'
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                        Отправка кода...
                                    </>
                                ) : (
                                    'Получить код подтверждения'
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}

// ============================================================
// Sub-component
// ============================================================

interface PasswordFieldProps {
    id: string;
    label: string;
    value: string;
    show: boolean;
    error?: string;
    disabled: boolean;
    onToggle: () => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function PasswordField({
    id,
    label,
    value,
    show,
    error,
    disabled,
    onToggle,
    onChange
}: PasswordFieldProps) {
    return (
        <div className='space-y-1.5'>
            <Label
                htmlFor={id}
                className='text-xs font-medium uppercase tracking-wider text-zinc-400'
            >
                {label}
            </Label>
            <div className='relative'>
                <Input
                    id={id}
                    name={id}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    placeholder='••••••••'
                    autoComplete='off'
                    maxLength={32}
                    className={[
                        'border-zinc-700 bg-zinc-800/50 pr-10 text-white placeholder:text-zinc-600',
                        'focus-visible:border-amber-500/60 focus-visible:ring-0 focus-visible:ring-offset-0',
                        'disabled:opacity-40',
                        error ? 'border-red-500/60' : ''
                    ].join(' ')}
                />
                <button
                    type='button'
                    onClick={onToggle}
                    tabIndex={-1}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300'
                >
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
            </div>
            {error && <p className='text-xs text-red-400'>{error}</p>}
        </div>
    );
}
