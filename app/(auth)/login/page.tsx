'use client';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {useSession} from '@/hooks/useSession';
import {useAuthStore} from '@/stores/auth.store';
import {LoginSuccessResponse, LoginErrorResponse} from '@/types/auth';
import axios from 'axios';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
import {Eye, EyeOff, Loader2} from 'lucide-react';
import {UserData} from '@/types/auth/jwt.types';
import {isAllowed} from '@/lib/auth/roles';
import {ForgotPasswordModal} from '@/components/auth/forgot-password-modal';

interface FormState {
    login: string;
    password: string;
}

interface FormErrors {
    login?: string;
    password?: string;
    general?: string;
}

function validate(form: FormState): FormErrors {
    const errors: FormErrors = {};
    if (!form.login.trim()) errors.login = 'Введите логин';
    if (!form.password.trim()) errors.password = 'Введите пароль';
    else if (form.password.length < 6) errors.password = 'Минимум 6 символов';
    return errors;
}

export default function Login() {
    const router = useRouter();
    const {user} = useAuthStore();
    const {startSession} = useSession();

    const [form, setForm] = useState<FormState>({login: '', password: ''});
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showForgot, setShowForgot] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || !user) return;

        if (isAllowed(user.role)) {
            router.replace('/dashboard');
        } else {
            router.replace('/forbidden');
        }
    }, [mounted, user, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setForm(prev => ({...prev, [name]: value}));
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({...prev, [name]: undefined}));
        }
    };

    const resetPassword = () => {
        setShowForgot(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors = validate(form);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const {data} = await axios.post<LoginSuccessResponse | LoginErrorResponse>(
                '/api/auth/login',
                {login: form.login, password: form.password}
            );

            if (data.success) {
                const userData = data.data as UserData;
                startSession(userData, data.expiresAt);
            } else {
                setErrors({general: typeof data.data === 'string' ? data.data : 'Ошибка входа'});
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const message = err.response?.data?.data ?? err.response?.data?.error;
                setErrors({general: message ?? 'Ошибка сети. Попробуйте позже.'});
            } else {
                setErrors({general: 'Неизвестная ошибка'});
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-app p-4'>
            {/* Фоновые блюры */}
            <div className='pointer-events-none absolute inset-0 overflow-hidden'>
                <div className='absolute -left-32 top-1/4 h-[400px] w-[400px] rounded-full bg-brand/15 blur-[100px]' />
                <div className='absolute -right-32 bottom-1/4 h-[350px] w-[350px] rounded-full bg-brand/10 blur-[100px]' />
            </div>

            {/* Декоративная сетка */}
            <div
                className='pointer-events-none absolute inset-0 opacity-[0.025]'
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(251,191,36,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.5) 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }}
            />

            {/* Карточка */}
            <div className='relative w-full max-w-sm'>
                {/* Лого */}
                <div className='mb-6 text-center'>
                    <Button
                        variant='link'
                        className='m-0 p-0 text-3xl font-bold tracking-tight text-app-fg transition-all hover:scale-105'
                        onClick={() => router.push('/')}
                    >
                        HooBu
                    </Button>
                    <p className='mt-1.5 text-sm text-app-subtle'>Войдите в панель управления</p>
                </div>

                <div className='rounded-2xl border border-app-border bg-surface/60 p-6 shadow-2xl backdrop-blur-sm sm:p-8'>
                    {/* Общая ошибка */}
                    {errors.general && (
                        <div className='mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400'>
                            {errors.general}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className='space-y-4'>
                        {/* Логин */}
                        <div className='space-y-1.5'>
                            <Label
                                htmlFor='login'
                                className='text-xs font-medium uppercase tracking-wider text-app-muted'
                            >
                                Логин
                            </Label>
                            <Input
                                id='login'
                                name='login'
                                type='text'
                                placeholder='Введите логин'
                                autoComplete='username'
                                autoFocus
                                disabled={isLoading}
                                value={form.login}
                                onChange={handleChange}
                                maxLength={20}
                                className={[
                                    'border-app-border bg-surface-2/50 text-app-fg placeholder:text-app-subtle',
                                    'focus-visible:border-brand/60 focus-visible:ring-0 focus-visible:ring-offset-0',
                                    'disabled:opacity-40',
                                    errors.login ? 'border-red-500/60' : ''
                                ].join(' ')}
                            />
                            {errors.login && <p className='text-xs text-red-400'>{errors.login}</p>}
                        </div>

                        {/* Пароль */}
                        <div className='space-y-1.5'>
                            <div className='flex items-center justify-between'>
                                <Label
                                    htmlFor='password'
                                    className='text-xs font-medium uppercase tracking-wider text-app-muted'
                                >
                                    Пароль
                                </Label>
                                <Button
                                    variant='link'
                                    className='h-auto p-0 text-[11px] text-app-subtle hover:text-app-muted'
                                    type='button'
                                    onClick={async () => await resetPassword()}
                                >
                                    Забыли пароль?
                                </Button>
                            </div>
                            <div className='relative'>
                                <Input
                                    id='password'
                                    name='password'
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder='Введите пароль'
                                    autoComplete='current-password'
                                    disabled={isLoading}
                                    value={form.password}
                                    onChange={handleChange}
                                    maxLength={32}
                                    className={[
                                        'border-app-border bg-surface-2/50 pr-10 text-app-fg placeholder:text-app-subtle',
                                        'focus-visible:border-brand/60 focus-visible:ring-0 focus-visible:ring-offset-0',
                                        'disabled:opacity-40',
                                        errors.password ? 'border-red-500/60' : ''
                                    ].join(' ')}
                                />
                                <button
                                    type='button'
                                    onClick={() => setShowPassword(prev => !prev)}
                                    className='absolute right-3 top-1/2 -translate-y-1/2 text-app-subtle transition-colors hover:text-app-fg/80'
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                                >
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className='text-xs text-red-400'>{errors.password}</p>
                            )}
                        </div>

                        {/* Кнопка */}
                        <Button
                            type='submit'
                            disabled={isLoading}
                            className='w-full bg-brand font-semibold text-brand-fg hover:bg-brand/90 disabled:opacity-40'
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    Вход...
                                </>
                            ) : (
                                'Войти'
                            )}
                        </Button>
                    </form>
                </div>

                {/* Соцсети */}
                <div className='mt-5'>
                    <div className='relative mb-5'>
                        <div className='absolute inset-0 flex items-center'>
                            <div className='w-full border-t border-app-border' />
                        </div>
                        <div className='relative flex justify-center text-xs'>
                            <span className='bg-app px-3 text-app-subtle'>или</span>
                        </div>
                    </div>

                    <div className='grid grid-cols-2 gap-3'>
                        <button
                            type='button'
                            disabled
                            className='flex h-10 items-center justify-center gap-2 rounded-lg border border-app-border bg-surface/50 text-sm text-app-subtle transition-colors hover:border-app-border hover:text-app-fg/80 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            <YandexIcon />
                            Яндекс
                        </button>
                        <button
                            type='button'
                            disabled
                            className='flex h-10 items-center justify-center gap-2 rounded-lg border border-app-border bg-surface/50 text-sm text-app-subtle transition-colors hover:border-app-border hover:text-app-fg/80 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            <VkIcon />
                            ВКонтакте
                        </button>
                    </div>
                    <p className='mt-2 text-center text-[10px] text-app-subtle/70'>Скоро будет доступно</p>
                </div>

                {/* Ссылки */}
                <div className='mt-6 flex flex-col items-center gap-2'>
                    <p className='text-xs text-app-subtle'>
                        Нет аккаунта?{' '}
                        <Button
                            variant='link'
                            onClick={() => router.push('/register')}
                            className='m-0 p-0 text-[12px] text-app-subtle transition-colors hover:text-app-fg/80'
                        >
                            Зарегистрироваться
                        </Button>
                    </p>
                    <Button
                        variant='link'
                        onClick={() => router.push('/')}
                        className='m-0 p-0 text-[12px] text-app-subtle transition-colors hover:text-app-muted'
                    >
                        ← Вернуться на главную
                    </Button>
                </div>
            </div>

            <ForgotPasswordModal
                open={showForgot}
                onClose={() => setShowForgot(false)}
                initialLogin={form.login}
            />
        </div>
    );
}

function YandexIcon() {
    return (
        <svg viewBox='0 0 24 24' fill='none' className='h-4 w-4'>
            <rect width='24' height='24' rx='4' fill='#FC3F1D' />
            <path
                d='M13.5 7.5h-1.2c-1.6 0-2.3.7-2.3 1.8 0 1.2.7 1.8 2 2.6l.9.5-3 4.3H8.2l2.7-3.9c-1.2-.7-2.2-1.6-2.2-3.4 0-2 1.4-3.3 3.8-3.3h1.9v11.4h-1.4V7.5h.5z'
                fill='white'
            />
        </svg>
    );
}

function VkIcon() {
    return (
        <svg viewBox='0 0 24 24' fill='none' className='h-4 w-4'>
            <rect width='24' height='24' rx='4' fill='#0077FF' />
            <path
                d='M12.8 16.2s.3 0 .5-.2c.2-.2.2-.5.2-.5s0-1.6.7-1.8c.7-.2 1.6 1.5 2.6 2.2.7.5 1.3.4 1.3.4l2.6-.4s1.4-.1.7-1c-.1-.1-.4-.8-1.8-2.2-1.5-1.5-1.3-1.2.5-3.7 1.1-1.5 1.6-2.5 1.4-2.9-.1-.4-.8-.3-.8-.3l-3 .2s-.2 0-.4.1c-.2.1-.3.3-.3.3s-.5 1.3-1.1 2.4c-1.4 2.4-1.9 2.5-2.1 2.4-.5-.3-.4-1.3-.4-2 0-2.2.3-3.1-.6-3.4-.3-.1-.5-.2-1.3-.2-1 0-1.8 0-2.3.3-.3.2-.5.5-.4.5.2 0 .6.1.8.5.3.5.3 1.6.3 1.6s.2 2.7-.4 3c-.4.2-1-.2-2.3-2.2-.7-1.1-1.2-2.3-1.2-2.3s-.1-.2-.3-.4c-.2-.1-.5-.2-.5-.2l-2.8.2s-.4 0-.6.2c-.1.2 0 .5 0 .5s2.2 5 4.6 7.6c2.2 2.3 4.7 2.2 4.7 2.2l1.5-.2z'
                fill='white'
            />
        </svg>
    );
}
