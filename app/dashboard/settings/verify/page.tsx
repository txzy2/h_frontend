'use client';

import {Button} from '@/components/ui/button';
import {useAuthStore} from '@/stores/auth.store';
import axios from 'axios';
import {useRouter} from 'next/navigation';
import {useEffect, useRef, useState} from 'react';
import {Loader2, CheckCircle2} from 'lucide-react';

const CODE_LENGTH = 6;

export default function VerifyPasswordChange() {
    const router = useRouter();
    const {clearUser, clearPermissions} = useAuthStore();

    const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [requestId, setRequestId] = useState<string | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        const id = sessionStorage.getItem('cp_request_id');
        if (!id) {
            // Нет request_id — возвращаем на настройки
            router.replace('/dashboard/settings');
            return;
        }
        setRequestId(id);
        // Фокус на первый инпут
        inputRefs.current[0]?.focus();
    }, [router]);

    const handleInput = (index: number, value: string) => {
        const char = value.replace(/\D/g, '').slice(-1); // только цифры
        const newCode = [...code];
        newCode[index] = char;
        setCode(newCode);
        setError('');

        // Автопереход к следующему
        if (char && index < CODE_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Автосабмит когда все поля заполнены
        if (newCode.every(c => c) && char) {
            submitCode(newCode.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
        const newCode = Array(CODE_LENGTH).fill('');
        pasted.split('').forEach((char, i) => {
            newCode[i] = char;
        });
        setCode(newCode);

        // Фокус на последний заполненный
        const lastIndex = Math.min(pasted.length, CODE_LENGTH - 1);
        inputRefs.current[lastIndex]?.focus();

        if (pasted.length === CODE_LENGTH) {
            submitCode(pasted);
        }
    };

    const submitCode = async (codeStr: string) => {
        if (!requestId || isSubmitting) return;

        setIsSubmitting(true);
        setError('');

        try {
            const {data} = await axios.post('/api/auth/change-password/verify', {
                request_id: requestId,
                code: codeStr
            });

            if (data.success) {
                setSuccess(true);
                sessionStorage.removeItem('cp_request_id');

                // Бэк сбросил все сессии — чистим стор и редиректим на логин
                setTimeout(() => {
                    clearUser();
                    clearPermissions();
                    router.replace('/login');
                }, 2000);
            } else {
                setError(typeof data.data === 'string' ? data.data : 'Неверный код');
                setCode(Array(CODE_LENGTH).fill(''));
                inputRefs.current[0]?.focus();
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const message =
                    err.response?.data?.data ?? err.response?.data?.error ?? 'Ошибка проверки кода';
                setError(message);
            } else {
                setError('Неизвестная ошибка');
            }
            setCode(Array(CODE_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
        } finally {
            setIsSubmitting(false);
        }
    };

    // Экран успеха
    if (success) {
        return (
            <div className='flex min-h-screen items-center justify-center bg-app'>
                <div className='text-center'>
                    <CheckCircle2 size={48} className='mx-auto mb-4 text-brand' />
                    <h2 className='text-xl font-semibold text-app-fg'>Пароль изменён</h2>
                    <p className='mt-2 text-sm text-app-subtle'>
                        Все сессии завершены. Перенаправление...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-app p-4'>
            {/* Фоновые блюры */}
            <div className='pointer-events-none absolute inset-0 overflow-hidden'>
                <div className='absolute -left-32 top-1/4 h-[400px] w-[400px] rounded-full bg-brand/10 blur-[100px]' />
                <div className='absolute -right-32 bottom-1/4 h-[350px] w-[350px] rounded-full bg-brand/8 blur-[100px]' />
            </div>

            <div className='relative w-full max-w-sm'>
                {/* Лого */}
                <div className='mb-8 text-center'>
                    <span className='text-3xl font-bold tracking-tight text-app-fg'>HooBu</span>
                    <p className='mt-1.5 text-sm text-app-subtle'>Подтверждение смены пароля</p>
                </div>

                <div className='rounded-2xl border border-app-border bg-surface/60 p-8 shadow-2xl backdrop-blur-sm'>
                    <div className='mb-6 text-center'>
                        <h2 className='text-lg font-semibold text-app-fg'>Введите код</h2>
                        <p className='mt-1.5 text-sm text-app-subtle'>
                            6-значный код отправлен на вашу почту
                        </p>
                    </div>

                    {/* OTP инпуты */}
                    <div className='flex justify-center gap-2' onPaste={handlePaste}>
                        {code.map((digit, i) => (
                            <input
                                key={i}
                                ref={el => {
                                    inputRefs.current[i] = el;
                                }}
                                type='text'
                                inputMode='numeric'
                                maxLength={1}
                                value={digit}
                                onChange={e => handleInput(i, e.target.value)}
                                onKeyDown={e => handleKeyDown(i, e)}
                                disabled={isSubmitting}
                                className={[
                                    'h-12 w-10 rounded-lg border text-center text-lg font-bold text-app-fg',
                                    'bg-surface-2/50 outline-none transition-colors',
                                    'disabled:opacity-40',
                                    digit
                                        ? 'border-brand/60'
                                        : 'border-app-border focus:border-brand/40',
                                    error ? 'border-red-500/60' : ''
                                ].join(' ')}
                            />
                        ))}
                    </div>

                    {/* Ошибка */}
                    {error && <p className='mt-4 text-center text-sm text-red-400'>{error}</p>}

                    {/* Лоадер */}
                    {isSubmitting && (
                        <div className='mt-4 flex justify-center'>
                            <Loader2 size={18} className='animate-spin text-brand' />
                        </div>
                    )}

                    {/* Кнопка ручного сабмита */}
                    <Button
                        onClick={() => submitCode(code.join(''))}
                        disabled={code.some(c => !c) || isSubmitting}
                        className='mt-6 w-full bg-brand font-semibold text-brand-fg hover:bg-brand/90 disabled:opacity-40'
                    >
                        Подтвердить
                    </Button>

                    <button
                        onClick={() => router.push('/dashboard/settings')}
                        className='mt-4 w-full text-center text-xs text-app-subtle transition-colors hover:text-app-muted'
                    >
                        ← Вернуться назад
                    </button>
                </div>
            </div>
        </div>
    );
}
