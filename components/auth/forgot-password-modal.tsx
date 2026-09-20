'use client';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import axios from 'axios';
import {useEffect, useState} from 'react';
import {CheckCircle2, Loader2} from 'lucide-react';

interface ForgotPasswordModalProps {
    open: boolean;
    onClose: () => void;
    initialLogin?: string;
}

export function ForgotPasswordModal({open, onClose, initialLogin = ''}: ForgotPasswordModalProps) {
    const [login, setLogin] = useState(initialLogin);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (open) {
            setLogin(initialLogin);
            setEmail('');
            setError('');
            setDone(false);
        }
    }, [open, initialLogin]);

    if (!open) return null;

    const handleSubmit = async () => {
        if (!login.trim()) {
            setError('Введите логин');
            return;
        }
        if (!email.trim()) {
            setError('Введите email');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const {data} = await axios.post('/api/auth/reset-password/request', {login, email});
            if (data.success) {
                setDone(true);
            } else {
                setError(typeof data.data === 'string' ? data.data : 'Ошибка');
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.data ?? err.response?.data?.error ?? 'Ошибка сети');
            } else {
                setError('Неизвестная ошибка');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputCls =
        'border-app-border bg-surface-2/50 text-app-fg placeholder:text-app-subtle focus-visible:border-brand/60 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-40';

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'>
            <div className='w-full max-w-sm rounded-2xl border border-app-border bg-surface p-6 shadow-2xl'>
                {!done ? (
                    <>
                        <h2 className='text-lg font-semibold text-app-fg'>Сброс пароля</h2>
                        <p className='mt-1 text-sm text-app-subtle'>
                            Введите логин и email — новый пароль придёт на почту
                        </p>

                        {error && (
                            <div className='mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400'>
                                {error}
                            </div>
                        )}

                        <div className='mt-5 space-y-4'>
                            <div className='space-y-1.5'>
                                <Label className='text-xs font-medium uppercase tracking-wider text-app-muted'>
                                    Логин
                                </Label>
                                <Input
                                    value={login}
                                    onChange={e => {
                                        setLogin(e.target.value);
                                        setError('');
                                    }}
                                    placeholder='Введите логин'
                                    autoFocus
                                    disabled={isSubmitting}
                                    className={inputCls}
                                />
                            </div>

                            <div className='space-y-1.5'>
                                <Label className='text-xs font-medium uppercase tracking-wider text-app-muted'>
                                    Email
                                </Label>
                                <Input
                                    type='email'
                                    value={email}
                                    onChange={e => {
                                        setEmail(e.target.value);
                                        setError('');
                                    }}
                                    placeholder='Введите email'
                                    disabled={isSubmitting}
                                    className={inputCls}
                                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                />
                            </div>

                            <div className='flex gap-3'>
                                <Button
                                    variant='outline'
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className='flex-1 border-app-border text-app-fg/80 hover:bg-surface-2 hover:text-app-fg'
                                >
                                    Отмена
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className='flex-1 bg-brand font-semibold text-brand-fg hover:bg-brand/90 disabled:opacity-40'
                                >
                                    {isSubmitting ? (
                                        <Loader2 className='h-4 w-4 animate-spin' />
                                    ) : (
                                        'Сбросить'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className='py-4 text-center'>
                        <CheckCircle2 size={48} className='mx-auto mb-4 text-emerald-400' />
                        <h2 className='text-lg font-semibold text-app-fg'>Пароль сброшен</h2>
                        <p className='mt-2 text-sm text-app-subtle'>
                            Новый пароль отправлен на{' '}
                            <span className='text-app-fg/80'>{email}</span>
                        </p>
                        <Button
                            onClick={onClose}
                            className='mt-6 w-full bg-brand font-semibold text-brand-fg hover:bg-brand/90'
                        >
                            Войти
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
