'use client';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {useAuthStore} from '@/stores/auth.store';
import axios from 'axios';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
import {Eye, EyeOff, Loader2, ShieldCheck} from 'lucide-react';

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

function validatePassword(value: string): string | undefined {
    if (!value.trim()) return 'Обязательное поле';
    if (value.length < PASSWORD_RULES.minLength) return 'Минимум 8 символов';
    if (!PASSWORD_RULES.hasNumber.test(value)) return 'Нужна хотя бы одна цифра';
    if (!PASSWORD_RULES.hasSpecial.test(value)) return 'Нужен хотя бы один спецсимвол';
    return undefined;
}

function validate(form: FormState): FormErrors {
    const errors: FormErrors = {};
    if (!form.login.trim()) errors.login = 'Введите логин';
    if (!form.old_password.trim()) errors.old_password = 'Введите пароль';

    const newErr = validatePassword(form.new_password);
    if (newErr) errors.new_password = newErr;

    if (!form.confirm_password.trim()) {
        errors.confirm_password = 'Подтвердите пароль';
    } else if (form.new_password !== form.confirm_password) {
        errors.confirm_password = 'Пароли не совпадают';
    }

    return errors;
}

export default function AccountPage() {
    const {user} = useAuthStore();
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

    useEffect(() => {
        if (user?.login) {
            setForm(prev => ({...prev, login: user.login}));
        }
    }, [user]);

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

    return (
        <div className='max-w-md'>
            <div className='rounded-2xl border border-app-border bg-surface/60 p-8 backdrop-blur-sm'>
                <div className='mb-6 flex items-center gap-3'>
                    <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10'>
                        <ShieldCheck size={18} className='text-brand' />
                    </div>
                    <div>
                        <h2 className='text-sm font-semibold text-app-fg'>Смена пароля</h2>
                        <p className='text-xs text-app-subtle'>
                            Код подтверждения придёт на {user?.email}
                        </p>
                    </div>
                </div>

                {errors.general && (
                    <div className='mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400'>
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate className='space-y-4'>
                    <div className='space-y-1.5'>
                        <Label className='text-xs font-medium uppercase tracking-wider text-app-muted'>
                            Логин
                        </Label>
                        <Input
                            name='login'
                            value={form.login}
                            readOnly
                            className='cursor-default border-app-border bg-surface-2/30 text-app-muted focus-visible:ring-0 focus-visible:ring-offset-0'
                        />
                    </div>

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

                    <div className='border-t border-app-border pt-4'>
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

                    <p className='text-xs text-app-subtle'>
                        Пароль должен содержать минимум 8 символов, цифру и спецсимвол
                    </p>

                    <Button
                        type='submit'
                        disabled={isSubmitting}
                        className='w-full bg-brand font-semibold text-brand-fg hover:bg-brand/90 disabled:opacity-40'
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
                className='text-xs font-medium uppercase tracking-wider text-app-muted'
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
                        'border-app-border bg-surface-2/50 pr-10 text-app-fg placeholder:text-app-subtle',
                        'focus-visible:border-brand/60 focus-visible:ring-0 focus-visible:ring-offset-0',
                        'disabled:opacity-40',
                        error ? 'border-red-500/60' : ''
                    ].join(' ')}
                />
                <button
                    type='button'
                    onClick={onToggle}
                    tabIndex={-1}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-app-subtle transition-colors hover:text-app-fg/80'
                >
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
            </div>
            {error && <p className='text-xs text-red-400'>{error}</p>}
        </div>
    );
}
