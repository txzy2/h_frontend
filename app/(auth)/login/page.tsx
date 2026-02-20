'use client';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {useAuthStore} from '@/stores/auth.store';
import {LoginSuccessResponse, LoginErrorResponse} from '@/types/auth';
import axios from 'axios';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
import {Eye, EyeOff, Loader2} from 'lucide-react';
import {UserData} from '@/types/auth/jwt.types';
import {isAllowed} from '@/lib/auth/roles';

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
    const {setUser, user} = useAuthStore();

    const [form, setForm] = useState<FormState>({login: '', password: ''});
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);

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

    const resetPassword = async () => {
        //todo
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
                setUser(userData);
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
        <div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a] p-4'>
            {/* Фоновые блюры */}
            <div className='pointer-events-none absolute inset-0 overflow-hidden'>
                <div className='absolute -left-32 top-1/4 h-[400px] w-[400px] rounded-full bg-amber-900/15 blur-[100px]' />
                <div className='absolute -right-32 bottom-1/4 h-[350px] w-[350px] rounded-full bg-orange-900/10 blur-[100px]' />
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
                <div className='mb-8 text-center'>
                    <Button
                        variant={'link'}
                        className='text-3xl font-bold tracking-tight text-white  m-0 p-0 transition-all hover:scale-105'
                        onClick={() => router.push('/')}
                    >
                        HooBu
                    </Button>
                    <p className='mt-1.5 text-sm text-zinc-500'>Войдите в панель управления</p>
                </div>

                <div className='rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-sm'>
                    {/* Общая ошибка */}
                    {errors.general && (
                        <div className='mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400'>
                            {errors.general}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className='space-y-5'>
                        {/* Логин */}
                        <div className='space-y-1.5'>
                            <Label
                                htmlFor='login'
                                className='text-xs font-medium uppercase tracking-wider text-zinc-400'
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
                                    'border-zinc-700 bg-zinc-800/50 text-white placeholder:text-zinc-600',
                                    'focus-visible:border-amber-500/60 focus-visible:ring-0 focus-visible:ring-offset-0',
                                    'disabled:opacity-40',
                                    errors.login ? 'border-red-500/60' : ''
                                ].join(' ')}
                            />
                            {errors.login && <p className='text-xs text-red-400'>{errors.login}</p>}
                        </div>

                        {/* Пароль */}
                        <div className='space-y-1.5'>
                            <Label
                                htmlFor='password'
                                className='text-xs font-medium uppercase tracking-wider text-zinc-400'
                            >
                                Пароль
                            </Label>
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
                                        'border-zinc-700 bg-zinc-800/50 pr-10 text-white placeholder:text-zinc-600',
                                        'focus-visible:border-amber-500/60 focus-visible:ring-0 focus-visible:ring-offset-0',
                                        'disabled:opacity-40',
                                        errors.password ? 'border-red-500/60' : ''
                                    ].join(' ')}
                                />
                                <button
                                    type='button'
                                    onClick={() => setShowPassword(prev => !prev)}
                                    className='absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300'
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                                >
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className='text-xs text-red-400'>{errors.password}</p>
                            )}
                            <div className='flex justify-end'>
                                <Button
                                    variant={'link'}
                                    className='text-[12px] p-0 m-0 text-zinc-600'
                                    type='button'
                                    onClick={async () => await resetPassword()}
                                >
                                    Забыли пароль?
                                </Button>
                            </div>
                        </div>

                        {/* Кнопка */}
                        <Button
                            type='submit'
                            disabled={isLoading}
                            className='w-full bg-amber-500 font-semibold text-black hover:bg-amber-400 disabled:opacity-40'
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

                {/* Ссылка назад */}
                <p className='mt-6 text-center text-xs text-zinc-600'>
                    <button
                        onClick={() => router.push('/')}
                        className='transition-colors hover:text-zinc-400'
                    >
                        ← Вернуться на главную
                    </button>
                </p>
            </div>
        </div>
    );
}
