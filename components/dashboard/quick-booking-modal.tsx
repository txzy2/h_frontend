'use client';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {PhoneInput} from '@/components/ui/phone-input';
import {isValidPhone, normalizePhone} from '@/lib/phone';
import {OrganizationLocation, OrganizationResponse} from '@/types/org';
import axios from 'axios';
import {CalendarDays, Loader2, MapPin, MessageSquare, Phone, User, Users, X} from 'lucide-react';
import {useEffect, useState} from 'react';
import {toast} from 'sonner';

interface QuickBookingModalProps {
    open: boolean;
    onClose: () => void;
    onCreated?: () => void;
}

interface BookingForm {
    locationId: string;
    scheduledAt: string;
    guestsCount: string;
    guestName: string;
    guestPhone: string;
    comment: string;
}

const inputCls =
    'h-10 border-app-border bg-surface-2/50 text-app-fg placeholder:text-app-subtle focus-visible:border-brand/60 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-40';

function pad(value: number): string {
    return String(value).padStart(2, '0');
}

function toLocalInputValue(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
        date.getHours()
    )}:${pad(date.getMinutes())}`;
}

function defaultScheduledAt(): string {
    const date = new Date(Date.now() + 60 * 60 * 1000);
    date.setSeconds(0, 0);

    return toLocalInputValue(date);
}

function emptyForm(): BookingForm {
    return {
        locationId: '',
        scheduledAt: defaultScheduledAt(),
        guestsCount: '2',
        guestName: '',
        guestPhone: '',
        comment: ''
    };
}

export function QuickBookingModal({open, onClose, onCreated}: QuickBookingModalProps) {
    const [form, setForm] = useState<BookingForm>(emptyForm);
    const [locations, setLocations] = useState<OrganizationLocation[]>([]);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;

        setForm(emptyForm());
        setError('');
        setLocations([]);

        let cancelled = false;
        setIsLoadingLocations(true);

        axios
            .get<OrganizationResponse>('/api/orgs')
            .then(({data}) => {
                if (cancelled) return;

                if (data.success && data.data) {
                    const activeLocations = data.data.locations.filter(
                        location => location.status === 'Active'
                    );

                    setLocations(activeLocations);
                    setForm(current => ({
                        ...current,
                        locationId: activeLocations[0] ? String(activeLocations[0].id) : ''
                    }));
                } else {
                    setError('Не удалось загрузить точки организации');
                }
            })
            .catch(err => {
                if (cancelled) return;

                if (axios.isAxiosError(err)) {
                    setError(
                        err.response?.data?.data ??
                            err.response?.data?.message ??
                            'Не удалось загрузить точки организации'
                    );
                } else {
                    setError('Не удалось загрузить точки организации');
                }
            })
            .finally(() => {
                if (!cancelled) setIsLoadingLocations(false);
            });

        return () => {
            cancelled = true;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isSubmitting) onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, isSubmitting, onClose]);

    if (!open) return null;

    const update = (field: keyof BookingForm, value: string) => {
        setForm(current => ({...current, [field]: value}));
        if (error) setError('');
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!form.locationId) {
            setError('Выберите точку');
            return;
        }

        if (!form.guestName.trim()) {
            setError('Введите имя гостя');
            return;
        }

        const phone = normalizePhone(form.guestPhone);
        if (!isValidPhone(phone)) {
            setError('Введите телефон полностью');
            return;
        }

        const guestsCount = Number(form.guestsCount);
        if (!Number.isInteger(guestsCount) || guestsCount < 1 || guestsCount > 20) {
            setError('Количество гостей должно быть от 1 до 20');
            return;
        }

        const scheduledAt = new Date(form.scheduledAt);
        if (Number.isNaN(scheduledAt.getTime())) {
            setError('Укажите дату и время');
            return;
        }
        if (scheduledAt.getTime() < Date.now() - 5 * 60 * 1000) {
            setError('Нельзя создать бронь в прошлом');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const {data} = await axios.post('/api/bookings', {
                locationId: Number(form.locationId),
                guestName: form.guestName.trim(),
                guestPhone: phone,
                guestsCount,
                scheduledAt: scheduledAt.toISOString(),
                ...(form.comment.trim() ? {comment: form.comment.trim()} : {})
            });

            if (!data.success) {
                setError(
                    typeof data.data === 'string' ? data.data : 'Не удалось создать бронь'
                );
                return;
            }

            toast.success('Бронь создана', {
                description: `${form.guestName.trim()} · ${scheduledAt.toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                })}`
            });
            onCreated?.();
            onClose();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.data ??
                        err.response?.data?.error ??
                        'Не удалось создать бронь'
                );
            } else {
                setError('Неизвестная ошибка');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className='fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4'
            onMouseDown={event => {
                if (event.target === event.currentTarget && !isSubmitting) onClose();
            }}
        >
            <div className='max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-app-border bg-surface p-6 shadow-2xl sm:rounded-2xl'>
                <div className='mb-5 flex items-start justify-between gap-4'>
                    <div className='flex items-center gap-3'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10'>
                            <CalendarDays size={20} className='text-brand' />
                        </div>
                        <div>
                            <h2 className='text-lg font-semibold text-app-fg'>Новая бронь</h2>
                            <p className='text-xs text-app-subtle'>
                                Заполните данные гостя и время визита
                            </p>
                        </div>
                    </div>
                    <button
                        type='button'
                        aria-label='Закрыть'
                        onClick={onClose}
                        disabled={isSubmitting}
                        className='cursor-pointer rounded-md p-1 text-app-subtle transition-colors hover:bg-surface-2 hover:text-app-fg disabled:opacity-40'
                    >
                        <X size={18} />
                    </button>
                </div>

                {error && (
                    <div className='mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400'>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className='space-y-4'>
                    <div className='space-y-1.5'>
                        <Label className='flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-app-muted'>
                            <MapPin size={12} />
                            Точка
                        </Label>
                        <select
                            value={form.locationId}
                            onChange={event => update('locationId', event.target.value)}
                            disabled={isLoadingLocations || isSubmitting}
                            className='h-10 w-full cursor-pointer rounded-md border border-app-border bg-surface-2/50 px-3 text-sm text-app-fg outline-none focus:border-brand/60 disabled:cursor-not-allowed disabled:opacity-40'
                        >
                            {isLoadingLocations && <option value=''>Загружаем точки…</option>}
                            {!isLoadingLocations && !locations.length && (
                                <option value=''>Нет доступных точек</option>
                            )}
                            {locations.map(location => (
                                <option key={location.id} value={location.id}>
                                    {location.name} · {location.address}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                        <div className='space-y-1.5'>
                            <Label className='flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-app-muted'>
                                <CalendarDays size={12} />
                                Дата и время
                            </Label>
                            <Input
                                type='datetime-local'
                                value={form.scheduledAt}
                                min={toLocalInputValue(new Date())}
                                onChange={event => update('scheduledAt', event.target.value)}
                                disabled={isSubmitting}
                                required
                                className={inputCls}
                            />
                        </div>

                        <div className='space-y-1.5'>
                            <Label className='flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-app-muted'>
                                <Users size={12} />
                                Гостей
                            </Label>
                            <Input
                                type='number'
                                min={1}
                                max={20}
                                value={form.guestsCount}
                                onChange={event => update('guestsCount', event.target.value)}
                                disabled={isSubmitting}
                                required
                                className={inputCls}
                            />
                        </div>
                    </div>

                    <div className='space-y-1.5'>
                        <Label className='flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-app-muted'>
                            <User size={12} />
                            Имя гостя
                        </Label>
                        <Input
                            value={form.guestName}
                            onChange={event => update('guestName', event.target.value)}
                            placeholder='Иван Иванов'
                            autoFocus
                            disabled={isSubmitting}
                            required
                            className={inputCls}
                        />
                    </div>

                    <div className='space-y-1.5'>
                        <Label className='flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-app-muted'>
                            <Phone size={12} />
                            Телефон
                        </Label>
                        <PhoneInput
                            value={form.guestPhone}
                            onChange={value => update('guestPhone', value)}
                            placeholder='+7 (999) 123-45-67'
                            disabled={isSubmitting}
                            required
                            className={inputCls}
                        />
                    </div>

                    <div className='space-y-1.5'>
                        <Label className='flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-app-muted'>
                            <MessageSquare size={12} />
                            Комментарий
                        </Label>
                        <textarea
                            value={form.comment}
                            onChange={event => update('comment', event.target.value)}
                            placeholder='Например, стол у окна'
                            maxLength={255}
                            rows={3}
                            disabled={isSubmitting}
                            className='w-full resize-none rounded-md border border-app-border bg-surface-2/50 px-3 py-2 text-sm text-app-fg outline-none placeholder:text-app-subtle focus:border-brand/60 disabled:opacity-40'
                        />
                    </div>

                    <div className='flex gap-3 pt-2'>
                        <Button
                            type='button'
                            variant='outline'
                            onClick={onClose}
                            disabled={isSubmitting}
                            className='flex-1 border-app-border text-app-fg/80 hover:bg-surface-2 hover:text-app-fg'
                        >
                            Отмена
                        </Button>
                        <Button
                            type='submit'
                            disabled={isSubmitting || isLoadingLocations || !locations.length}
                            className='flex-1 bg-brand font-semibold text-brand-fg hover:bg-brand/90 disabled:opacity-40'
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={15} className='animate-spin' />
                                    Создаём…
                                </>
                            ) : (
                                'Создать бронь'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
