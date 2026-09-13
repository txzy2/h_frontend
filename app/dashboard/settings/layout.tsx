'use client';

import {usePathname} from 'next/navigation';
import {Building2, ShieldCheck} from 'lucide-react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import Link from 'next/link';

const NAV_ITEMS = [
    {href: '/dashboard/settings/organization', label: 'Организация', icon: Building2},
    {href: '/dashboard/settings/account', label: 'Аккаунт', icon: ShieldCheck}
];

export default function SettingsLayout({children}: {children: React.ReactNode}) {
    const pathname = usePathname();

    return (
        <div className='p-6 lg:p-8'>
            <Breadcrumb className='mb-4'>
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

            <h1 className='mb-5 text-xl font-bold text-white'>Настройки</h1>

            {/* Мобильные табы */}
            <nav className='mb-6 flex gap-1 overflow-x-auto border-b border-zinc-800 pb-px md:hidden'>
                {NAV_ITEMS.map(item => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={[
                                'flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm transition-colors',
                                isActive
                                    ? 'border-amber-500 font-medium text-amber-400'
                                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                            ].join(' ')}
                        >
                            <Icon size={14} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className='flex gap-8'>
                {/* Desktop aside */}
                <aside className='hidden w-48 shrink-0 md:block'>
                    <nav className='space-y-1'>
                        {NAV_ITEMS.map(item => {
                            const isActive = pathname.startsWith(item.href);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={[
                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                                        isActive
                                            ? 'bg-amber-500/10 font-medium text-amber-400'
                                            : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                                    ].join(' ')}
                                >
                                    <Icon size={16} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Контент */}
                <div className='min-w-0 flex-1'>{children}</div>
            </div>
        </div>
    );
}
