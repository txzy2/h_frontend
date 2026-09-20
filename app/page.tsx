'use client';

import {Header} from '@/components/layout/header';
import {useSession} from '@/hooks/useSession';
import {useAuthStore} from '@/stores/auth.store';
import type {UserData} from '@/types/auth';
import axios from 'axios';
import {useRouter} from 'next/navigation';
import {useEffect, useRef, useState} from 'react';
import {Button} from '@/components/ui/button';
import Link from 'next/link';
import {
    ArrowRight,
    ArrowDown,
    CalendarDays,
    Users,
    BarChart3,
    Zap,
    Bell,
    LayoutGrid,
    type LucideIcon
} from 'lucide-react';

export default function Home() {
    const {isLoading} = useSession();
    const {user, clearUser, clearPermissions} = useAuthStore();
    const router = useRouter();

    const logout = async () => {
        try {
            await axios.post('/api/auth/logout');
        } finally {
            clearUser();
            clearPermissions();
        }
    };

    useEffect(() => {
        if (isLoading || !user) return;
        const allowed = ['Admin', 'SuperAdmin', 'Manager'];
        if (allowed.includes(user.role)) router.replace('/dashboard');
    }, [isLoading, user, router]);

    return (
        <div className='flex min-h-dvh flex-col bg-app'>
            <Header user={user} isLoading={isLoading} onLogout={logout} />

            <main className='flex-1'>
                <HeroSlide user={user} onAction={() => router.push(user ? '/dashboard' : '/login')} />
                <FeaturesSlide />
                <BenefitsSlide />
            </main>

            <footer className='border-t border-app-border/50 bg-app'>
                <div className='mx-auto max-w-6xl px-4 py-12'>
                    <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-4'>
                        {/* Бренд */}
                        <div className='lg:col-span-1'>
                            <p className='text-lg font-bold tracking-tight text-app-fg'>HooBu</p>
                            <p className='mt-2 text-xs leading-relaxed text-app-subtle'>
                                CRM-платформа для кальянных заведений. Управление бронированиями,
                                гостями и аналитикой.
                            </p>
                        </div>

                        {/* Продукт */}
                        <div>
                            <h4 className='mb-3 text-xs font-medium uppercase tracking-wider text-app-muted'>
                                Продукт
                            </h4>
                            <ul className='space-y-2'>
                                <FooterLink href='#features'>Возможности</FooterLink>
                                <FooterLink href='#benefits'>Преимущества</FooterLink>
                                <FooterLink href='/register'>Регистрация</FooterLink>
                                <FooterLink href='/login'>Войти</FooterLink>
                            </ul>
                        </div>

                        {/* Компания */}
                        <div>
                            <h4 className='mb-3 text-xs font-medium uppercase tracking-wider text-app-muted'>
                                Компания
                            </h4>
                            <ul className='space-y-2'>
                                <FooterLink href='/about'>О нас</FooterLink>
                                <FooterLink href='/contacts'>Контакты</FooterLink>
                                <FooterLink href='/blog'>Блог</FooterLink>
                            </ul>
                        </div>

                        {/* Правовая информация */}
                        <div>
                            <h4 className='mb-3 text-xs font-medium uppercase tracking-wider text-app-muted'>
                                Правовая информация
                            </h4>
                            <ul className='space-y-2'>
                                <FooterLink href='/terms'>Пользовательское соглашение</FooterLink>
                                <FooterLink href='/privacy'>Политика конфиденциальности</FooterLink>
                                <FooterLink href='/rules'>Правила сервиса</FooterLink>
                            </ul>
                        </div>
                    </div>

                    <div className='mt-10 flex flex-col items-center justify-between gap-4 border-t border-app-border/50 pt-6 sm:flex-row'>
                        <p className='text-xs text-app-subtle'>
                            © {new Date().getFullYear()} HooBu. Все права защищены.
                        </p>
                        <div className='flex gap-4'>
                            <a href='#' className='text-app-subtle transition-colors hover:text-app-muted'>
                                <svg viewBox='0 0 24 24' fill='currentColor' className='h-4 w-4'>
                                    <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
                                </svg>
                            </a>
                            <a href='#' className='text-app-subtle transition-colors hover:text-app-muted'>
                                <svg viewBox='0 0 24 24' fill='currentColor' className='h-4 w-4'>
                                    <path d='M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z' />
                                </svg>
                            </a>
                            <a href='#' className='text-app-subtle transition-colors hover:text-app-muted'>
                                <svg viewBox='0 0 24 24' fill='currentColor' className='h-4 w-4'>
                                    <path d='M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z' />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FooterLink({href, children}: {href: string; children: React.ReactNode}) {
    return (
        <li>
            <Link
                href={href}
                className='text-xs text-app-subtle transition-colors hover:text-app-fg/80'
            >
                {children}
            </Link>
        </li>
    );
}

// ─── Slide wrapper ────────────────────────────────────────────────────────────

function Slide({
    children,
    className = '',
    id
}: {
    children: React.ReactNode;
    className?: string;
    id?: string;
}) {
    return (
        <section
            id={id}
            className={`relative flex min-h-dvh flex-col items-center justify-center px-4 ${className}`}
        >
            {children}
        </section>
    );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSlide({user, onAction}: {user: UserData | null; onAction: () => void}) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(t);
    }, []);

    return (
        <Slide>
            <div className='pointer-events-none absolute inset-0 overflow-hidden'>
                <div className='absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/[0.06] blur-[100px]' />
            </div>

            <div
                className={`relative mx-auto max-w-4xl text-center transition-all duration-1000 ${
                    visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
                }`}
            >
                <h1 className='mb-6 text-4xl font-bold leading-[1.1] tracking-tight text-app-fg sm:text-5xl md:text-6xl lg:text-7xl'>
                    <span className='bg-gradient-to-r from-brand to-brand bg-clip-text text-transparent'>
                        HooBu
                    </span>
                    {' '}— ваша кальянная{' '}
                    <span className='text-app-muted'>под контролем</span>
                </h1>

                <p className='mx-auto mb-10 max-w-xl text-base text-app-muted sm:text-lg'>
                    Платформа для управления бронированиями, гостями и аналитикой. Всё в одном окне.
                </p>

                <div className='flex flex-wrap items-center justify-center gap-4'>
                    <Button
                        size='lg'
                        className='h-11 bg-app-fg text-app hover:bg-app-fg/90 font-semibold px-7 gap-2 sm:h-12 sm:px-8'
                        onClick={onAction}
                    >
                        {user ? 'Панель управления' : 'Начать'}
                        <ArrowRight size={16} />
                    </Button>
                </div>

                {/* Статистика */}
                <div className='mt-14 grid grid-cols-3 gap-6 border-t border-app-border/50 pt-10 sm:gap-8'>
                    {STATS.map((s, i) => (
                        <div
                            key={s.label}
                            className={`transition-all duration-700 ${
                                visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                            }`}
                            style={{transitionDelay: `${400 + i * 150}ms`}}
                        >
                            <p className='text-2xl font-bold text-app-fg sm:text-3xl'>{s.value}</p>
                            <p className='mt-1 text-xs text-app-subtle sm:text-sm'>{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Превью карточки */}
                <div
                    className={`mx-auto mt-14 max-w-sm transition-all duration-700 sm:max-w-md ${
                        visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
                    }`}
                    style={{transitionDelay: '800ms'}}
                >
                    <div className='rounded-xl border border-app-border/60 bg-surface/50 p-4 text-left backdrop-blur-sm sm:p-5'>
                        <div className='mb-3 flex items-center justify-between'>
                            <span className='text-xs font-medium text-app-muted'>Сегодня</span>
                            <span className='rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400'>
                                12 броней
                            </span>
                        </div>
                        <div className='space-y-2'>
                            <MiniBooking time='18:00' name='Алексей К.' places={4} />
                            <MiniBooking time='19:30' name='Мария С.' places={6} />
                            <MiniBooking time='21:00' name='Дмитрий В.' places={3} />
                        </div>
                    </div>
                </div>

                <div className='mt-12 flex justify-center'>
                    <button
                        onClick={() =>
                            document.getElementById('features')?.scrollIntoView({behavior: 'smooth'})
                        }
                        className='flex flex-col items-center gap-1 text-app-subtle transition-colors hover:text-app-muted'
                    >
                        <span className='text-[10px] uppercase tracking-widest'>Подробнее</span>
                        <ArrowDown size={14} className='animate-bounce' />
                    </button>
                </div>
            </div>
        </Slide>
    );
}

const STATS = [
    {value: '150+', label: 'заведений'},
    {value: '12К+', label: 'бронирований'},
    {value: '99.9%', label: 'аптайм'}
];

function MiniBooking({time, name, places}: {time: string; name: string; places: number}) {
    return (
        <div className='flex items-center justify-between rounded-lg bg-surface-2/40 px-3 py-2'>
            <div className='flex items-center gap-3'>
                <span className='text-xs font-mono text-app-subtle'>{time}</span>
                <span className='text-sm text-app-fg/80'>{name}</span>
            </div>
            <span className='text-xs text-app-subtle'>{places} мест</span>
        </div>
    );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES: {icon: LucideIcon; title: string; desc: string}[] = [
    {
        icon: CalendarDays,
        title: 'Бронирование',
        desc: 'Столики, слоты, расписание — всё в реальном времени без конфликтов.'
    },
    {
        icon: Users,
        title: 'Гости',
        desc: 'База клиентов, история визитов, персональные предпочтения.'
    },
    {
        icon: BarChart3,
        title: 'Аналитика',
        desc: 'Загруженность, выручка, популярные позиции — решения на данных.'
    }
];

function FeaturesSlide() {
    const ref = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(0);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        setActive(Number((e.target as HTMLElement).dataset.idx));
                    }
                });
            },
            {threshold: 0.6, rootMargin: '-20% 0px -20% 0px'}
        );
        el.querySelectorAll('[data-idx]').forEach(child => observer.observe(child));
        return () => observer.disconnect();
    }, []);

    return (
        <section id='features' ref={ref} className='relative border-t border-app-border/50'>
            <div className='mx-auto max-w-5xl px-4 py-16 sm:py-20'>
                <div className='mb-12 text-center sm:mb-16'>
                    <p className='mb-3 text-xs font-medium uppercase tracking-widest text-brand'>
                        Возможности
                    </p>
                    <h2 className='text-2xl font-bold text-app-fg sm:text-3xl md:text-4xl'>
                        Три модуля для работы
                    </h2>
                </div>

                <div className='grid gap-6 sm:grid-cols-3 sm:gap-8'>
                    {FEATURES.map((f, i) => {
                        const Icon = f.icon;
                        const isActive = active === i;
                        return (
                            <div
                                key={f.title}
                                data-idx={i}
                                className={`group rounded-2xl border p-6 transition-all duration-300 sm:p-7 ${
                                    isActive
                                        ? 'border-brand/30 bg-brand/[0.03]'
                                        : 'border-app-border/50 bg-transparent hover:border-app-border'
                                }`}
                            >
                                <div
                                    className={`mb-5 flex h-10 w-10 items-center justify-center rounded-xl transition-colors sm:h-11 sm:w-11 ${
                                        isActive
                                            ? 'bg-brand/10 text-brand'
                                            : 'bg-surface-2 text-app-subtle'
                                    }`}
                                >
                                    <Icon size={20} />
                                </div>
                                <h3 className='mb-2 text-base font-semibold text-app-fg sm:text-lg'>
                                    {f.title}
                                </h3>
                                <p className='text-sm leading-relaxed text-app-subtle'>{f.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// ─── Benefits ─────────────────────────────────────────────────────────────────

const BENEFITS: {icon: LucideIcon; title: string; desc: string}[] = [
    {icon: Zap, title: 'Автоматизация', desc: 'Гости бронируют сами — система подтверждает и уведомляет.'},
    {icon: Bell, title: 'Уведомления', desc: 'Новая бронь, отмена, изменение — мгновенно.'},
    {icon: LayoutGrid, title: 'Карта зала', desc: 'Столики, статусы, зоны — визуально и понятно.'},
    {icon: CalendarDays, title: 'Расписание', desc: 'Временные слоты, повторные визиты, гибкое управление.'},
    {icon: Users, title: 'Постоянные гости', desc: 'Заметки, предпочтения, история — всё в профиле.'},
    {icon: BarChart3, title: 'Отчёты', desc: 'Загруженность по дням, средний чек, популярные слоты.'}
];

function BenefitsSlide() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setVisible(true);
            },
            {threshold: 0.15}
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <section id='benefits' className='border-t border-app-border/50 bg-surface/20'>
            <div ref={ref} className='mx-auto max-w-6xl px-4 py-16 sm:py-20'>
                <div className='mb-12 text-center sm:mb-16'>
                    <p className='mb-3 text-xs font-medium uppercase tracking-widest text-brand'>
                        Преимущества
                    </p>
                    <h2 className='text-2xl font-bold text-app-fg sm:text-3xl md:text-4xl'>
                        Почему HooBu
                    </h2>
                </div>

                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                    {BENEFITS.map((b, i) => {
                        const Icon = b.icon;
                        return (
                            <div
                                key={b.title}
                                className={`flex gap-4 rounded-xl border border-app-border/40 p-5 transition-all duration-500 hover:border-app-border/60 hover:bg-surface/40 ${
                                    visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                                }`}
                                style={{transitionDelay: `${i * 80}ms`}}
                            >
                                <div className='mt-0.5 shrink-0 text-app-subtle'>
                                    <Icon size={18} />
                                </div>
                                <div>
                                    <h3 className='mb-1 text-sm font-medium text-app-fg/90'>{b.title}</h3>
                                    <p className='text-xs leading-relaxed text-app-subtle'>{b.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
