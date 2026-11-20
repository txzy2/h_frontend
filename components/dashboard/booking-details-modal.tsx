'use client';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {formatMoney} from '@/lib/format';
import {formatPhone} from '@/lib/phone';
import {bookingStatusKey, statusBadgeStyle} from '@/lib/org/status';
import {BookingActionDetails, BookingDetails, BookingDetailsResponse} from '@/types/bookings';
import axios from 'axios';
import {
    Ban,
    CalendarDays,
    CheckCircle2,
    Clock,
    History,
    Info,
    Loader2,
    MapPin,
    Phone,
    Play,
    PlusCircle,
    User,
    Users,
    Wallet,
    X
} from 'lucide-react';
import {useEffect, useState} from 'react';
import {toast} from 'sonner';

interface BookingDetailsModalProps {
    open: boolean;
    bookingId: number | null;
    onClose: () => void;
    onUpdated: () => void;
}

const inputCls =
    'h-10 border-app-border bg-surface-2/50 text-app-fg placeholder:text-app-subtle focus-visible:border-brand/60 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-40';

const TABS = [
    {key: 'info', label: 'Информация', icon: Info},
    {key: 'extend', label: 'Продлить', icon: PlusCircle},
    {key: 'close', label: 'Закрыть', icon: CheckCircle2},
    {key: 'cancel', label: 'Отменить', icon: Ban},
    {key: 'history', label: 'История', icon: History}
] as const;

type TabKey = (typeof TABS)[number]['key'];

const ACTION_LABELS: Record<BookingActionDetails['type'], string> = {
    Created: 'Бронь создана',
    Started: 'Визит начат',
    Extended: 'Бронь продлена',
    Closed: 'Бронь закрыта',
    Cancelled: 'Бронь отменена'
};

function formatTime(value: string | null): string {
    if (!value) return '—';

    return new Date(value).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long'
    });
}

function formatDateTime(value: string): string {
    return new Date(value).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function statusLabel(booking: BookingDetails): string {
    if (booking.status === 'Completed') return 'Завершена';
    if (booking.status === 'Cancelled') return 'Отменена';
    if (booking.seatedAt && !booking.completedAt) return 'За столом';

    return 'Ожидается';
}



export function BookingDetailsModal({
    open,
    bookingId,
    onClose,
    onUpdated
}: BookingDetailsModalProps) {
    const [details, setDetails] = useState<BookingDetails | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>('info');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [extendMinutes, setExtendMinutes] = useState('30');
    const [extendComment, setExtendComment] = useState('');
    const [closeAmount, setCloseAmount] = useState('');
    const [closeComment, setCloseComment] = useState('');
    const [cancelReason, setCancelReason] = useState('');

    useEffect(() => {
        if (!open || !bookingId) return;

        let cancelled = false;

        setDetails(null);
        setActiveTab('info');
        setError('');
        setExtendMinutes('30');
        setExtendComment('');
        setCloseAmount('');
        setCloseComment('');
        setCancelReason('');
        setIsLoading(true);

        axios
            .get<BookingDetailsResponse>(`/api/bookings/${bookingId}`)
            .then(({data}) => {
                if (cancelled) return;

                if (data.success) {
                    setDetails(data.data);
                    setCloseAmount(data.data.amount ? String(data.data.amount) : '');
                } else {
                    setError(
                        typeof data.data === 'string' ? data.data : 'Не удалось загрузить бронь'
                    );
                }
            })
            .catch(err => {
                if (cancelled) return;

                if (axios.isAxiosError(err)) {
                    setError(
                        err.response?.data?.data ??
                            err.response?.data?.error ??
                            'Не удалось загрузить бронь'
                    );
                } else {
                    setError('Не удалось загрузить бронь');
                }
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [open, bookingId]);

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isSubmitting) onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, isSubmitting, onClose]);

    if (!open || !bookingId) return null;

    const isMutable =
        details && details.status !== 'Completed' && details.status !== 'Cancelled';
    const canManage = Boolean(details?.isMine && isMutable);
    const unavailableMessage = details
        ? !details.isMine
            ? `Управлять бронью может только её автор${
                  details.createdByName ? ` — ${details.createdByName}` : ''
              }.`
            : `Бронь уже ${statusLabel(details).toLowerCase()}, действия недоступны.`
        : '';

    const runAction = async (payload: Record<string, unknown>, successMessage: string) => {
        if (!details) return;

        setIsSubmitting(true);
        setError('');

        try {
            const {data} = await axios.patch<BookingDetailsResponse>(
                `/api/bookings/${details.id}`,
                payload
            );

            if (!data.success) {
                setError(
                    typeof data.data === 'string'
                        ? data.data
                        : 'Не удалось выполнить действие'
                );
                return;
            }

            toast.success(successMessage);
            onUpdated();
            onClose();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.data ??
                        err.response?.data?.error ??
                        'Не удалось выполнить действие'
                );
            } else {
                setError('Неизвестная ошибка');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExtend = () => {
        const minutes = Number(extendMinutes);

        if (!Number.isInteger(minutes) || minutes < 15 || minutes > 240) {
            setError('Продлить можно на 15–240 минут');
            return;
        }

        void runAction(
            {
                action: 'extend',
                minutes,
                ...(extendComment.trim() ? {comment: extendComment.trim()} : {})
            },
            'Бронь продлена'
        );
    };

    const handleClose = () => {
        const amount = closeAmount.trim() === '' ? undefined : Number(closeAmount);

        if (
            amount !== undefined &&
            (!Number.isInteger(amount) || amount < 0 || amount > 1_000_000)
        ) {
            setError('Сумма чека должна быть от 0 до 1 000 000 ₽');
            return;
        }

        void runAction(
            {
                action: 'close',
                ...(amount !== undefined ? {amount} : {}),
                ...(closeComment.trim() ? {comment: closeComment.trim()} : {})
            },
            'Бронь закрыта'
        );
    };

    const handleCancel = () => {
        const reason = cancelReason.trim();

        if (reason.length < 3) {
            setError('Укажите причину отмены (минимум 3 символа)');
            return;
        }

        void runAction({action: 'cancel', reason}, 'Бронь отменена');
    };

    const renderUnavailable = () =>
        unavailableMessage ? (
            <div className='rounded-xl border border-app-border/60 px-4 py-4 text-sm text-app-subtle'>
                {unavailableMessage}
            </div>
        ) : null;

    return (
        <div
            className='fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4'
            onMouseDown={event => {
                if (event.target === event.currentTarget && !isSubmitting) onClose();
            }}
        >
            <div className='max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-app-border bg-surface p-6 shadow-2xl sm:rounded-2xl'>
                <div className='mb-5 flex items-start justify-between gap-4'>
                    <div className='flex items-center gap-3'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10'>
                            <CalendarDays size={20} className='text-brand' />
                        </div>
                        <div>
                            <h2 className='text-lg font-semibold text-app-fg'>
                                Бронь #{bookingId}
                            </h2>
                            <p className='text-xs text-app-subtle'>
                                Детали и управление бронью
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

                {isLoading || !details ? (
                    <div className='flex items-center justify-center gap-2 py-12 text-sm text-app-subtle'>
                        <Loader2 size={16} className='animate-spin' />
                        Загружаем бронь…
                    </div>
                ) : (
                    <>
                        <div className='mb-5 flex gap-0.5 overflow-x-auto rounded-lg border border-app-border bg-surface-2/40 p-0.5 [scrollbar-width:none]'>
                            {TABS.map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.key;

                                return (
                                    <button
                                        key={tab.key}
                                        type='button'
                                        onClick={() => {
                                            setActiveTab(tab.key);
                                            setError('');
                                        }}
                                        className={[
                                            'flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-2 text-[11px] transition-colors',
                                            isActive
                                                ? 'bg-surface font-medium text-app-fg shadow-sm'
                                                : 'text-app-muted hover:text-app-fg'
                                        ].join(' ')}
                                    >
                                        <Icon size={13} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {activeTab === 'info' && (
                            <div className='space-y-4'>
                                <div className='rounded-xl border border-app-border/60 bg-surface-2/30 p-4'>
                                    <div className='flex flex-wrap items-start justify-between gap-3'>
                                        <div>
                                            <p className='text-base font-semibold text-app-fg'>
                                                {details.guestName ?? 'Гость'}
                                            </p>
                                            <p className='mt-0.5 text-sm text-app-subtle'>
                                                {formatDate(details.scheduledAt)} ·{' '}
                                                {formatTime(details.scheduledAt)}–
                                                {formatTime(details.expectedEndAt)}
                                            </p>
                                        </div>
                                        <span
                                            className='rounded-full px-2.5 py-1 text-[11px] font-medium'
                                            style={statusBadgeStyle(
                                                bookingStatusKey(
                                                    details.status,
                                                    details.seatedAt,
                                                    details.completedAt
                                                )
                                            )}
                                        >
                                            {statusLabel(details)}
                                        </span>
                                    </div>

                                    <div className='mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2'>
                                        <div className='flex items-center gap-2 text-app-muted'>
                                            <Phone size={14} className='text-app-subtle' />
                                            {details.guestPhone
                                                ? formatPhone(details.guestPhone)
                                                : 'Телефон не указан'}
                                        </div>
                                        <div className='flex items-center gap-2 text-app-muted'>
                                            <Users size={14} className='text-app-subtle' />
                                            {details.guestsCount}{' '}
                                            {details.guestsCount === 1 ? 'гость' : 'гостей'}
                                        </div>
                                        <div className='flex items-center gap-2 text-app-muted'>
                                            <MapPin size={14} className='text-app-subtle' />
                                            {details.locationName}
                                            {details.tableName
                                                ? ` · ${details.tableName}`
                                                : ''}
                                        </div>
                                        <div className='flex items-center gap-2 text-app-muted'>
                                            <Clock size={14} className='text-app-subtle' />
                                            {details.durationMinutes} мин
                                        </div>
                                        <div className='flex items-center gap-2 text-app-muted'>
                                            <Wallet size={14} className='text-app-subtle' />
                                            Чек: {formatMoney(details.amount)}
                                        </div>
                                        <div className='flex items-center gap-2 text-app-muted'>
                                            <User size={14} className='text-app-subtle' />
                                            {details.isMine
                                                ? 'Ваша бронь'
                                                : `Менеджер: ${
                                                      details.createdByName ?? 'неизвестен'
                                                  }`}
                                        </div>
                                    </div>

                                    {details.comment && (
                                        <p className='mt-3 rounded-lg bg-surface/60 px-3 py-2 text-xs text-app-subtle'>
                                            {details.comment}
                                        </p>
                                    )}
                                </div>

                                {details.isMine && isMutable && !details.seatedAt && (
                                    <div className='rounded-xl border border-emerald-500/20 p-4'>
                                        <p className='flex items-center gap-2 text-sm font-semibold text-app-fg'>
                                            <Play
                                                size={15}
                                                className='text-emerald-400'
                                                fill='currentColor'
                                            />
                                            Начать визит
                                        </p>
                                        <p className='mt-1 text-xs text-app-subtle'>
                                            Зафиксирует приход гостя. Бронь перейдёт в статус
                                            «За столом».
                                        </p>
                                        <Button
                                            type='button'
                                            onClick={() =>
                                                void runAction(
                                                    {action: 'start'},
                                                    'Визит начат'
                                                )
                                            }
                                            disabled={isSubmitting}
                                            className='mt-3 w-full bg-emerald-500 font-semibold text-white hover:bg-emerald-500/90 disabled:opacity-40'
                                        >
                                            {isSubmitting ? (
                                                <Loader2
                                                    size={15}
                                                    className='animate-spin'
                                                />
                                            ) : (
                                                <Play size={15} fill='currentColor' />
                                            )}
                                            Начать визит
                                        </Button>
                                    </div>
                                )}

                                {details.seatedAt && !details.completedAt && (
                                    <div className='rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400'>
                                        Визит начат в {formatTime(details.seatedAt)}
                                    </div>
                                )}

                                {!details.isMine && renderUnavailable()}
                            </div>
                        )}

                        {activeTab === 'extend' &&
                            (canManage ? (
                                <div className='rounded-xl border border-app-border/60 p-4'>
                                    <p className='flex items-center gap-2 text-sm font-semibold text-app-fg'>
                                        <PlusCircle size={15} className='text-brand' />
                                        Продлить бронь
                                    </p>
                                    <p className='mt-1 text-xs text-app-subtle'>
                                        Увеличивает плановую длительность визита.
                                    </p>
                                    <div className='mt-3 space-y-3'>
                                        <div className='space-y-1.5'>
                                            <Label className='text-xs text-app-muted'>
                                                На сколько минут
                                            </Label>
                                            <Input
                                                type='number'
                                                min={15}
                                                max={240}
                                                step={15}
                                                value={extendMinutes}
                                                onChange={event =>
                                                    setExtendMinutes(event.target.value)
                                                }
                                                disabled={isSubmitting}
                                                className={inputCls}
                                            />
                                        </div>
                                        <div className='space-y-1.5'>
                                            <Label className='text-xs text-app-muted'>
                                                Комментарий (необязательно)
                                            </Label>
                                            <Input
                                                value={extendComment}
                                                onChange={event =>
                                                    setExtendComment(event.target.value)
                                                }
                                                placeholder='Гости задержались'
                                                maxLength={500}
                                                disabled={isSubmitting}
                                                className={inputCls}
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type='button'
                                        onClick={handleExtend}
                                        disabled={isSubmitting}
                                        className='mt-3 w-full bg-brand font-semibold text-brand-fg hover:bg-brand/90 disabled:opacity-40'
                                    >
                                        {isSubmitting ? (
                                            <Loader2 size={15} className='animate-spin' />
                                        ) : (
                                            <PlusCircle size={15} />
                                        )}
                                        Продлить
                                    </Button>
                                </div>
                            ) : (
                                renderUnavailable()
                            ))}

                        {activeTab === 'close' &&
                            (canManage ? (
                                <div className='rounded-xl border border-app-border/60 p-4'>
                                    <p className='flex items-center gap-2 text-sm font-semibold text-app-fg'>
                                        <CheckCircle2
                                            size={15}
                                            className='text-emerald-400'
                                        />
                                        Закрыть бронь
                                    </p>
                                    <p className='mt-1 text-xs text-app-subtle'>
                                        Зафиксирует завершение и сумму чека. Выручка попадёт в
                                        статистику.
                                    </p>
                                    <div className='mt-3 space-y-3'>
                                        <div className='space-y-1.5'>
                                            <Label className='text-xs text-app-muted'>
                                                Сумма чека, ₽
                                            </Label>
                                            <Input
                                                type='number'
                                                min={0}
                                                step={100}
                                                value={closeAmount}
                                                onChange={event =>
                                                    setCloseAmount(event.target.value)
                                                }
                                                placeholder='3500'
                                                disabled={isSubmitting}
                                                className={inputCls}
                                            />
                                        </div>
                                        <div className='space-y-1.5'>
                                            <Label className='text-xs text-app-muted'>
                                                Комментарий (необязательно)
                                            </Label>
                                            <Input
                                                value={closeComment}
                                                onChange={event =>
                                                    setCloseComment(event.target.value)
                                                }
                                                placeholder='Всё прошло хорошо'
                                                maxLength={500}
                                                disabled={isSubmitting}
                                                className={inputCls}
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type='button'
                                        onClick={handleClose}
                                        disabled={isSubmitting}
                                        className='mt-3 w-full bg-emerald-500 font-semibold text-white hover:bg-emerald-500/90 disabled:opacity-40'
                                    >
                                        {isSubmitting ? (
                                            <Loader2 size={15} className='animate-spin' />
                                        ) : (
                                            <CheckCircle2 size={15} />
                                        )}
                                        Закрыть бронь
                                    </Button>
                                </div>
                            ) : (
                                renderUnavailable()
                            ))}

                        {activeTab === 'cancel' &&
                            (canManage ? (
                                <div className='rounded-xl border border-red-500/20 p-4'>
                                    <p className='flex items-center gap-2 text-sm font-semibold text-app-fg'>
                                        <Ban size={15} className='text-red-400' />
                                        Отменить бронь
                                    </p>
                                    <p className='mt-1 text-xs text-app-subtle'>
                                        Причина отмены обязательна и сохранится в истории.
                                    </p>
                                    <div className='mt-3 space-y-1.5'>
                                        <Label className='text-xs text-app-muted'>
                                            Причина отмены
                                        </Label>
                                        <textarea
                                            value={cancelReason}
                                            onChange={event =>
                                                setCancelReason(event.target.value)
                                            }
                                            placeholder='Почему бронь отменяется'
                                            maxLength={500}
                                            rows={3}
                                            disabled={isSubmitting}
                                            className='w-full resize-none rounded-md border border-app-border bg-surface-2/50 px-3 py-2 text-sm text-app-fg outline-none placeholder:text-app-subtle focus:border-brand/60 disabled:opacity-40'
                                        />
                                    </div>
                                    <Button
                                        type='button'
                                        variant='outline'
                                        onClick={handleCancel}
                                        disabled={isSubmitting}
                                        className='mt-3 w-full border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/15 hover:text-red-300 disabled:opacity-40'
                                    >
                                        {isSubmitting ? (
                                            <Loader2 size={15} className='animate-spin' />
                                        ) : (
                                            <Ban size={15} />
                                        )}
                                        Отменить бронь
                                    </Button>
                                </div>
                            ) : (
                                renderUnavailable()
                            ))}

                        {activeTab === 'history' && (
                            <div className='rounded-xl border border-app-border/60 p-4'>
                                <p className='flex items-center gap-2 text-sm font-semibold text-app-fg'>
                                    <History size={15} className='text-app-subtle' />
                                    История действий
                                </p>
                                <div className='mt-4 space-y-4'>
                                    {details.actions.length === 0 && (
                                        <p className='text-xs text-app-subtle'>
                                            Действий пока нет
                                        </p>
                                    )}
                                    {details.actions.map(action => (
                                        <div
                                            key={action.id}
                                            className='border-l-2 border-app-border pl-3'
                                        >
                                            <div className='flex flex-wrap items-center justify-between gap-2'>
                                                <p className='text-xs font-medium text-app-fg/90'>
                                                    {ACTION_LABELS[action.type]}
                                                    {action.type === 'Extended' &&
                                                        action.minutes &&
                                                        ` · +${action.minutes} мин`}
                                                    {action.type === 'Closed' &&
                                                        action.amount !== null &&
                                                        ` · ${formatMoney(action.amount)}`}
                                                </p>
                                                <span className='text-[10px] text-app-subtle'>
                                                    {formatDateTime(action.createdAt)}
                                                </span>
                                            </div>
                                            {action.comment && (
                                                <p className='mt-1 text-xs text-app-subtle'>
                                                    {action.comment}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
