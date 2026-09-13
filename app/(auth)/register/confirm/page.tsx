'use client';

import {Button} from '@/components/ui/button';
import {useAuthStore} from '@/stores/auth.store';
import axios from 'axios';
import {useRouter} from 'next/navigation';
import {useEffect, useRef, useState} from 'react';
import {Loader2, CheckCircle2} from 'lucide-react';

const CODE_LENGTH = 6;

export default function RegisterConfirm() {
    const router = useRouter();
    const {setUser} = useAuthStore();

    const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [loadingStep, setLoadingStep] = useState<'verify' | 'login' | null>(null);
    const [requestId, setRequestId] = useState<string | null>(null);
    const [email, setEmail] = useState<string>('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        const id = sessionStorage.getItem('reg_request_id');
        const em = sessionStorage.getItem('reg_email');
        if (!id) {
            router.replace('/register');
            return;
        }
        setRequestId(id);
        if (em) setEmail(em);
        inputRefs.current[0]?.focus();
    }, [router]);

    const clearSession = () => {
        sessionStorage.removeItem('reg_request_id');
        sessionStorage.removeItem('reg_email');
        sessionStorage.removeItem('reg_login');
        sessionStorage.removeItem('reg_password');
    };

    const handleInput = (index: number, value: string) => {
        const char = value.replace(/\D/g, '').slice(-1);
        const newCode = [...code];
        newCode[index] = char;
        setCode(newCode);
        setError('');

        if (char && index < CODE_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }

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

        const lastIndex = Math.min(pasted.length, CODE_LENGTH - 1);
        inputRefs.current[lastIndex]?.focus();

        if (pasted.length === CODE_LENGTH) {
            submitCode(pasted);
        }
    };

    const tryAutoLogin = async (): Promise<boolean> => {
        const login = sessionStorage.getItem('reg_login');
        const password = sessionStorage.getItem('reg_password');

        if (!login || !password) return false;

        try {
            const {data} = await axios.post('/api/auth/login', {login, password});
            if (data.success) {
                setUser(data.data);
                return true;
            }
        } catch {
            // Не удалось — не страшно, редиректим на логин
        }
        return false;
    };

    const submitCode = async (codeStr: string) => {
        if (!requestId || isSubmitting) return;

        setIsSubmitting(true);
        setLoadingStep('verify');
        setError('');

        try {
            const {data} = await axios.post('/api/auth/register/confirm', {
                request_id: requestId,
                code: codeStr
            });

            if (data.success) {
                setSuccess(true);
                setLoadingStep('login');

                // Пытаемся автоматически залогиниться
                const loggedIn = await tryAutoLogin();
                clearSession();

                setTimeout(() => {
                    router.replace(loggedIn ? '/onboarding' : '/login');
                }, 1500);
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
            setLoadingStep(null);
        }
    };

    if (success) {
        return (
            <div className='flex min-h-screen items-center justify-center bg-[#0a0a0a]'>
                <div className='text-center'>
                    {loadingStep === 'login' ? (
                        <>
                            <Loader2 size={48} className='mx-auto mb-4 animate-spin text-amber-400' />
                            <h2 className='text-xl font-semibold text-white'>Email подтверждён</h2>
                            <p className='mt-2 text-sm text-zinc-500'>Входим в аккаунт...</p>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={48} className='mx-auto mb-4 text-amber-400' />
                            <h2 className='text-xl font-semibold text-white'>Email подтверждён</h2>
                            <p className='mt-2 text-sm text-zinc-500'>Перенаправление...</p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a] p-4'>
            <div className='pointer-events-none absolute inset-0 overflow-hidden'>
                <div className='absolute -left-32 top-1/4 h-[400px] w-[400px] rounded-full bg-amber-900/10 blur-[100px]' />
                <div className='absolute -right-32 bottom-1/4 h-[350px] w-[350px] rounded-full bg-orange-900/8 blur-[100px]' />
            </div>

            <div className='relative w-full max-w-sm'>
                <div className='mb-8 text-center'>
                    <span className='text-3xl font-bold tracking-tight text-white'>HooBu</span>
                    <p className='mt-1.5 text-sm text-zinc-500'>Подтверждение регистрации</p>
                </div>

                <div className='rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-sm'>
                    <div className='mb-6 text-center'>
                        <h2 className='text-lg font-semibold text-white'>Введите код</h2>
                        <p className='mt-1.5 text-sm text-zinc-500'>
                            6-значный код отправлен на{' '}
                            {email ? (
                                <span className='text-zinc-300'>{email}</span>
                            ) : (
                                'вашу почту'
                            )}
                        </p>
                    </div>

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
                                    'h-12 w-10 rounded-lg border text-center text-lg font-bold text-white',
                                    'bg-zinc-800/50 outline-none transition-colors',
                                    'disabled:opacity-40',
                                    digit
                                        ? 'border-amber-500/60'
                                        : 'border-zinc-700 focus:border-amber-500/40',
                                    error ? 'border-red-500/60' : ''
                                ].join(' ')}
                            />
                        ))}
                    </div>

                    {error && <p className='mt-4 text-center text-sm text-red-400'>{error}</p>}

                    {isSubmitting && (
                        <div className='mt-4 flex flex-col items-center gap-2'>
                            <Loader2 size={18} className='animate-spin text-amber-400' />
                            <p className='text-xs text-zinc-500'>
                                {loadingStep === 'verify' ? 'Проверяем код...' : 'Входим в аккаунт...'}
                            </p>
                        </div>
                    )}

                    <Button
                        onClick={() => submitCode(code.join(''))}
                        disabled={code.some(c => !c) || isSubmitting}
                        className='mt-6 w-full bg-amber-500 font-semibold text-black hover:bg-amber-400 disabled:opacity-40'
                    >
                        Подтвердить
                    </Button>

                    <button
                        onClick={() => router.push('/register')}
                        className='mt-4 w-full text-center text-xs text-zinc-600 transition-colors hover:text-zinc-400'
                    >
                        ← Вернуться к регистрации
                    </button>
                </div>
            </div>
        </div>
    );
}
