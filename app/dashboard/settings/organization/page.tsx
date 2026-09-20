'use client';

import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import type {Organization} from '@/types/org';
import axios from 'axios';
import {useEffect, useState} from 'react';
import {Building2, Clock, Hash, MapPin, ShieldCheck, ShieldX, User} from 'lucide-react';

const STATUS_CONFIG: Record<string, {label: string; className: string; icon: typeof ShieldCheck}> = {
    Active: {
        label: 'Активна',
        className: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
        icon: ShieldCheck
    },
    Pending: {
        label: 'На проверке',
        className: 'border-brand/30 bg-brand/15 text-brand',
        icon: Clock
    },
    Inactive: {
        label: 'Неактивна',
        className: 'border-zinc-500/30 bg-zinc-500/15 text-app-muted',
        icon: ShieldX
    }
};

function getStatusConfig(status: string) {
    return (
        STATUS_CONFIG[status] ?? {
            label: status,
            className: 'border-zinc-500/30 bg-zinc-500/15 text-app-muted',
            icon: Clock
        }
    );
}

export default function OrganizationPage() {
    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const {data} = await axios.get('/api/orgs');
                if (!cancelled && data.success) {
                    setOrg(data.data);
                }
            } catch (err) {
                if (!cancelled) {
                    if (axios.isAxiosError(err)) {
                        const status = err.response?.status;
                        if (status === 409) {
                            setOrg(null);
                        } else {
                            const message =
                                err.response?.data?.error ??
                                err.response?.data?.message ??
                                err.response?.data?.data ??
                                'Ошибка загрузки организации';
                            setError(message);
                        }
                    } else {
                        setError('Неизвестная ошибка');
                    }
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className='max-w-2xl'>
            <div className='rounded-2xl border border-app-border bg-surface/60 p-8 backdrop-blur-sm'>
                <div className='mb-6 flex items-center gap-3'>
                    <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10'>
                        <Building2 size={18} className='text-brand' />
                    </div>
                    <div>
                        <h2 className='text-sm font-semibold text-app-fg'>Организация</h2>
                        <p className='text-xs text-app-subtle'>Информация о вашей организации</p>
                    </div>
                </div>

                {loading ? (
                    <div className='space-y-4'>
                        <Skeleton className='h-5 w-48 bg-surface-2' />
                        <Skeleton className='h-4 w-36 bg-surface-2' />
                        <Skeleton className='h-4 w-40 bg-surface-2' />
                        <Skeleton className='h-4 w-44 bg-surface-2' />
                    </div>
                ) : error ? (
                    <div className='rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400'>
                        {error}
                    </div>
                ) : org ? (
                    <div className='space-y-5'>
                        {/* Название + статус */}
                        <div className='flex items-center gap-3'>
                            <h3 className='text-lg font-bold text-app-fg'>{org.name}</h3>
                            <StatusBadge status={org.status} />
                        </div>

                        {/* Баннер "на проверке" */}
                        {org.status === 'Pending' && (
                            <div className='flex items-start gap-3 rounded-lg border border-brand/20 bg-brand/5 px-4 py-3'>
                                <Clock size={16} className='mt-0.5 shrink-0 text-brand' />
                                <div>
                                    <p className='text-sm font-medium text-brand'>
                                        Организация на проверке
                                    </p>
                                    <p className='mt-1 text-xs text-app-muted'>
                                        Администратор проверяет данные. Обычно это занимает не более
                                        24 часов. Вы получите уведомление на email.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ИНН / КПП */}
                        <div className='flex flex-wrap gap-x-8 gap-y-2'>
                            <div className='flex items-center gap-2 text-sm'>
                                <Hash size={14} className='text-app-subtle' />
                                <span className='text-app-subtle'>ИНН:</span>
                                <span className='font-medium text-app-fg/90'>{org.inn}</span>
                            </div>
                            <div className='flex items-center gap-2 text-sm'>
                                <Hash size={14} className='text-app-subtle' />
                                <span className='text-app-subtle'>КПП:</span>
                                <span className='font-medium text-app-fg/90'>{org.kpp}</span>
                            </div>
                        </div>

                        {/* Директор */}
                        <div className='flex items-center gap-2 text-sm'>
                            <User size={14} className='text-app-subtle' />
                            <span className='text-app-subtle'>Директор:</span>
                            <span className='font-medium text-app-fg/90'>{org.director}</span>
                        </div>

                        {/* Точки */}
                        <div className='flex items-center gap-2 text-sm'>
                            <MapPin size={14} className='text-app-subtle' />
                            <span className='text-app-subtle'>Точек:</span>
                            <span className='font-medium text-app-fg/90'>
                                {org.locations.length}
                            </span>
                        </div>

                        {/* Дата создания */}
                        <p className='border-t border-app-border pt-4 text-xs text-app-subtle'>
                            Создана{' '}
                            {new Date(org.createdAt).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </p>
                    </div>
                ) : (
                    <div className='flex items-center gap-3 rounded-lg border border-app-border/50 bg-surface-2/30 px-4 py-3'>
                        <Building2 size={16} className='text-app-subtle' />
                        <p className='text-sm text-app-muted'>
                            Организация ещё не создана.{' '}
                            <a href='/onboarding' className='text-brand hover:underline'>
                                Завершите регистрацию
                            </a>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusBadge({status}: {status: string}) {
    const config = getStatusConfig(status);
    const Icon = config.icon;
    return (
        <Badge className={config.className}>
            <Icon size={12} className='mr-1' />
            {config.label}
        </Badge>
    );
}
