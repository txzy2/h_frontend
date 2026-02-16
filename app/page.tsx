'use client';

import {Badge} from '@/components/ui/badge';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {useAuthStore} from '@/stores/auth.store';
import {AuthState} from '@/stores/auth.store';
import {LoginSuccessResponse, PermissionsData, UserPermissionsResult} from '@/types/auth';
import axios from 'axios';
import {useRouter} from 'next/navigation';
import {useEffect} from 'react';

export default function Home() {
    const {setUser, clearUser, setPermissions, clearPermissions} = useAuthStore();
    const user = useAuthStore((state: AuthState) => state.user);
    const permissions = useAuthStore((state: AuthState) => state.permissions);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            try {
                const {data} = await axios.get<LoginSuccessResponse>('/api/auth/me');
                if (data.success) {
                    setUser(data.data);

                    const {data: permissionsData} =
                        await axios.get<PermissionsData>(`/api/users/permissions`);
                    if (permissionsData.success) {
                        const list = Array.isArray(permissionsData.data)
                            ? permissionsData.data
                            : ((permissionsData.data as {permissions?: UserPermissionsResult[]})
                                  ?.permissions ?? []);
                        setPermissions(list);
                    }
                } else router.push('/login');
            } catch (e) {
                const status = axios.isAxiosError(e) ? e.response?.status : undefined;
                if (status === 503 || status === 401) {
                    clearUser();
                    clearPermissions();

                    //TODO: Сделать зарос на refresh токена и далее снова получение ползователя через me
                }
            }
        };

        checkUser();
    }, []);

    return (
        <div className='flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-4'>
            <h1 className='text-xl font-semibold'>Main Page</h1>

            <Card className='w-full max-w-md'>
                <CardHeader>
                    <CardTitle>Профиль</CardTitle>
                </CardHeader>
                <CardContent>
                    {user ? (
                        <div className='flex flex-col gap-3'>
                            <div className='flex justify-between gap-4'>
                                <span className='text-muted-foreground'>ID</span>
                                <span className='font-mono text-sm'>{user.userId}</span>
                            </div>
                            <div className='flex justify-between gap-4'>
                                <span className='text-muted-foreground'>Пользователь</span>
                                <span>
                                    {user.name} ({user.role})
                                </span>
                            </div>
                            <div className='flex justify-between gap-4'>
                                <span className='text-muted-foreground'>Email</span>
                                <span>{user.email}</span>
                            </div>
                            <div className='flex justify-between gap-4'>
                                <span className='text-muted-foreground'>Login</span>
                                <span>{user.login}</span>
                            </div>
                        </div>
                    ) : (
                        <p className='text-muted-foreground'>Пользователь не авторизован</p>
                    )}
                </CardContent>
            </Card>

            <Card className='w-full max-w-md'>
                <CardHeader>
                    <CardTitle>Права доступа</CardTitle>
                </CardHeader>
                <CardContent>
                    {permissions.length === 0 ? (
                        <p className='text-sm text-muted-foreground'>Нет назначенных прав</p>
                    ) : (
                        <div className='flex flex-wrap gap-2'>
                            {permissions.map(permission => (
                                <Badge
                                    key={permission.name}
                                    variant='secondary'
                                    title={permission.name ?? undefined}
                                >
                                    {permission.description ?? permission.name}
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
