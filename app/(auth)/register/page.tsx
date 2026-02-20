'use client';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {useAuthStore} from '@/stores/auth.store';
import axios from 'axios';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
import {Eye, EyeOff, Loader2} from 'lucide-react';

const ROLES = ['SuperUser', 'Admin', 'Manager', 'User'] as const;
type Role = (typeof ROLES)[number];

interface FormState {
    name: string;
    login: string;
    email: string;
    password: string;
    confirm_password: string;
    role: Role | '';
}

interface FormErrors {
    name?: string;
    login?: string;
    email?: string;
    password?: string;
    confirm_password?: string;
    general?: string;
}

function validate(form: FormState): FormErrors {
    const errors: FormErrors = {};
    if (!form.name.trim()) errors.name = 'Введите имя';
    if (!form.login.trim()) errors.login = 'Введите логин';
    if (!form.email.trim()) errors.email = 'Введите email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Некорректный email';
    if (!form.password.trim()) errors.password = 'Введите пароль';
    else if (form.password.length < 6) errors.password = 'Минимум 6 символов';
    if (!form.confirm_password.trim()) errors.confirm_password = 'Подтвердите пароль';
    else if (form.password !== form.confirm_password)
        errors.confirm_password = 'Пароли не совпадают';
    return errors;
}

export default function Register() {
    const router = useRouter();
    const {setUser, user} = useAuthStore();

    const [form, setForm] = useState<FormState>({
        name: '',
        login: '',
        email: '',
        password: '',
        confirm_password: '',
        role: ''
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && user) {
            router.replace('/dashboard');
        }
    }, [mounted, user, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setForm(prev => ({...prev, [name]: value}));
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({...prev, [name]: undefined}));
        }
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
            const {data} = await axios.post('/api/auth/register', {
                name: form.name,
                login: form.login,
                email: form.email,
                password: form.password,
                confirm_password: form.confirm_password,
                role: form.role
            });

            if (data.success) {
                setUser(data.data);
                router.replace('/dashboard');
            } else {
                setErrors({
                    general: typeof data.data === 'string' ? data.data : 'Ошибка регистрации'
                });
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

    const inputCls = (field: keyof FormErrors) =>
        [
            'border-zinc-700 bg-zinc-800/50 text-white placeholder:text-zinc-600',
            'focus-visible:border-amber-500/60 focus-visible:ring-0 focus-visible:ring-offset-0',
            'disabled:opacity-40',
            errors[field] ? 'border-red-500/60' : ''
        ].join(' ');

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
                    <p className='mt-1.5 text-sm text-zinc-500'>
                        Зарегистрируйте новую организацию
                    </p>
                </div>

                <div className='rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-sm'>
                    {/* Общая ошибка */}
                    {errors.general && (
                        <div className='mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400'>
                            {errors.general}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className='space-y-5'>
                        {/* Имя */}
                        <div className='space-y-1.5'>
                            <Label
                                htmlFor='name'
                                className='text-xs font-medium uppercase tracking-wider text-zinc-400'
                            >
                                Имя
                            </Label>
                            <Input
                                id='name'
                                name='name'
                                type='text'
                                placeholder='Введите имя'
                                autoComplete='name'
                                autoFocus
                                disabled={isLoading}
                                value={form.name}
                                onChange={handleChange}
                                className={inputCls('name')}
                            />
                            {errors.name && <p className='text-xs text-red-400'>{errors.name}</p>}
                        </div>

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
                                disabled={isLoading}
                                value={form.login}
                                onChange={handleChange}
                                className={inputCls('login')}
                            />
                            {errors.login && <p className='text-xs text-red-400'>{errors.login}</p>}
                        </div>

                        {/* Email */}
                        <div className='space-y-1.5'>
                            <Label
                                htmlFor='email'
                                className='text-xs font-medium uppercase tracking-wider text-zinc-400'
                            >
                                Email
                            </Label>
                            <Input
                                id='email'
                                name='email'
                                type='email'
                                placeholder='Введите email'
                                autoComplete='email'
                                disabled={isLoading}
                                value={form.email}
                                onChange={handleChange}
                                className={inputCls('email')}
                            />
                            {errors.email && <p className='text-xs text-red-400'>{errors.email}</p>}
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
                                    autoComplete='new-password'
                                    disabled={isLoading}
                                    value={form.password}
                                    onChange={handleChange}
                                    className={inputCls('password') + ' pr-10'}
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
                        </div>

                        {/* Подтверждение пароля */}
                        <div className='space-y-1.5'>
                            <Label
                                htmlFor='confirm_password'
                                className='text-xs font-medium uppercase tracking-wider text-zinc-400'
                            >
                                Подтвердите пароль
                            </Label>
                            <div className='relative'>
                                <Input
                                    id='confirm_password'
                                    name='confirm_password'
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder='Повторите пароль'
                                    autoComplete='new-password'
                                    disabled={isLoading}
                                    value={form.confirm_password}
                                    onChange={handleChange}
                                    className={inputCls('confirm_password') + ' pr-10'}
                                />
                                <button
                                    type='button'
                                    onClick={() => setShowConfirm(prev => !prev)}
                                    className='absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300'
                                    tabIndex={-1}
                                    aria-label={showConfirm ? 'Скрыть пароль' : 'Показать пароль'}
                                >
                                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {errors.confirm_password && (
                                <p className='text-xs text-red-400'>{errors.confirm_password}</p>
                            )}
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
                                    Регистрация...
                                </>
                            ) : (
                                'Зарегистрироваться'
                            )}
                        </Button>
                    </form>
                </div>

                {/* Ссылки */}
                <div className='mt-6 flex flex-col items-center gap-2'>
                    <p className='text-xs text-zinc-600'>
                        Уже есть аккаунт?{' '}
                        <Button
                            variant={'link'}
                            onClick={() => router.push('/login')}
                            className='text-zinc-500 transition-colors hover:text-zinc-300 m-0 p-0 text-[12px]'
                        >
                            Войти
                        </Button>
                    </p>
                    <Button
                        variant={'link'}
                        onClick={() => router.push('/')}
                        className='text-xs text-zinc-600 transition-colors hover:text-zinc-400 m-0 p-0 text-[12px]'
                    >
                        ← Вернуться на главную
                    </Button>
                </div>
            </div>
        </div>
    );
}
