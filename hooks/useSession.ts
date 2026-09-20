// hooks/useSession.ts
import {SessionContext, SessionContextValue} from '@/components/providers/session-provider';
import {useContext} from 'react';

/**
 * Доступ к сессии из любого клиентского компонента.
 * Сама логика живёт в <SessionProvider> (подключён в корневом layout),
 * поэтому проверка/обновление токенов выполняется один раз на приложение.
 */
export function useSession(): SessionContextValue {
    const context = useContext(SessionContext);

    if (!context) {
        throw new Error('useSession must be used within <SessionProvider>');
    }

    return context;
}
