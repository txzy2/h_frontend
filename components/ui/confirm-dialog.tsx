'use client';

import {Button} from '@/components/ui/button';
import {AlertTriangle, HelpCircle} from 'lucide-react';
import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState
} from 'react';

export interface ConfirmOptions {
    title: string;
    description?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'danger';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

interface DialogState extends ConfirmOptions {
    resolve: (value: boolean) => void;
}

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({children}: {children: ReactNode}) {
    const [dialog, setDialog] = useState<DialogState | null>(null);

    const confirm = useCallback<ConfirmFn>(options => {
        return new Promise<boolean>(resolve => {
            setDialog({...options, resolve});
        });
    }, []);

    const close = useCallback((value: boolean) => {
        setDialog(current => {
            current?.resolve(value);
            return null;
        });
    }, []);

    useEffect(() => {
        if (!dialog) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') close(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dialog, close]);

    const isDanger = dialog?.variant === 'danger';

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}

            {dialog && (
                <div
                    className='fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center'
                    onMouseDown={event => {
                        if (event.target === event.currentTarget) close(false);
                    }}
                >
                    <div
                        role='dialog'
                        aria-modal='true'
                        aria-labelledby='confirm-dialog-title'
                        className='w-full max-w-sm rounded-2xl border border-app-border bg-surface p-6 shadow-2xl'
                    >
                        <div className='flex items-start gap-3'>
                            <span
                                className={[
                                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                                    isDanger
                                        ? 'bg-red-500/10 text-red-400'
                                        : 'bg-brand/10 text-brand'
                                ].join(' ')}
                            >
                                {isDanger ? (
                                    <AlertTriangle size={20} />
                                ) : (
                                    <HelpCircle size={20} />
                                )}
                            </span>

                            <div className='min-w-0 flex-1 pt-0.5'>
                                <h2
                                    id='confirm-dialog-title'
                                    className='text-base font-semibold text-app-fg'
                                >
                                    {dialog.title}
                                </h2>
                                {dialog.description && (
                                    <div className='mt-1.5 text-sm text-app-subtle'>
                                        {dialog.description}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className='mt-5 flex gap-3'>
                            <Button
                                type='button'
                                variant='outline'
                                autoFocus
                                onClick={() => close(false)}
                                className='flex-1 border-app-border text-app-fg/80 hover:bg-surface-2 hover:text-app-fg'
                            >
                                {dialog.cancelLabel ?? 'Отмена'}
                            </Button>
                            <Button
                                type='button'
                                onClick={() => close(true)}
                                className={
                                    isDanger
                                        ? 'flex-1 bg-red-500 font-semibold text-white hover:bg-red-500/90'
                                        : 'flex-1 bg-brand font-semibold text-brand-fg hover:bg-brand/90'
                                }
                            >
                                {dialog.confirmLabel ?? 'Подтвердить'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

export function useConfirm(): ConfirmFn {
    const context = useContext(ConfirmContext);

    if (!context) {
        throw new Error('useConfirm must be used within ConfirmProvider');
    }

    return context;
}
