'use client';

import {Button} from '@/components/ui/button';
import {useRouter} from 'next/navigation';

export default function Forbidden() {
    const router = useRouter();

    return (
        <div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a] p-4'>
            {/* Фоновые блюры */}
            <div className='pointer-events-none absolute inset-0 overflow-hidden'>
                <div className='absolute -left-32 top-1/4 h-[400px] w-[400px] rounded-full bg-red-900/10 blur-[100px]' />
                <div className='absolute -right-32 bottom-1/4 h-[350px] w-[350px] rounded-full bg-red-900/8 blur-[100px]' />
                <div className='absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-900/5 blur-[80px]' />
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

            <div className='relative flex flex-col items-center text-center'>
                {/* Код ошибки */}
                <div className='relative mb-6 select-none'>
                    <span className='text-[10rem] font-black leading-none tracking-tighter text-zinc-900 md:text-[14rem]'>
                        403
                    </span>
                    <span
                        className='absolute inset-0 flex items-center justify-center text-[10rem] font-black leading-none tracking-tighter text-transparent md:text-[14rem]'
                        style={{
                            WebkitTextStroke: '1px rgba(251,191,36,0.15)'
                        }}
                    >
                        403
                    </span>
                </div>

                {/* Иконка замка */}
                <div className='mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10'>
                    <svg
                        className='h-7 w-7 text-red-400'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                        strokeWidth={1.5}
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            d='M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z'
                        />
                    </svg>
                </div>

                {/* Текст */}
                <h1 className='mb-3 text-2xl font-bold tracking-tight text-white'>
                    Доступ запрещён
                </h1>
                <p className='mb-8 max-w-sm text-sm text-zinc-500'>
                    У вас недостаточно прав для просмотра этой страницы. Обратитесь к
                    администратору, если считаете это ошибкой.
                </p>

                {/* Кнопки */}
                <div className='flex flex-wrap items-center justify-center gap-3'>
                    <Button
                        className='bg-amber-500 font-semibold text-black hover:bg-amber-400'
                        onClick={() => router.replace('/')}
                    >
                        На главную
                    </Button>
                </div>

                {/* Лого внизу */}
                <button
                    onClick={() => router.push('/')}
                    className='mt-12 text-xs text-zinc-700 transition-colors hover:text-zinc-500'
                >
                    HooBu
                </button>
            </div>
        </div>
    );
}
