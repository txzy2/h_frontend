'use client';

import {useAuthStore} from '@/stores/auth.store';
import {LoginErrorResponse, LoginSuccessResponse} from '@/types/auth';
import axios from 'axios';
import {useRouter} from 'next/navigation';
import {useEffect} from 'react';

export default function Login() {
    const router = useRouter();

    useEffect(() => {
        const testApi = async () => {
            console.log('Отправка тестового запроса...');

            try {
                const response = await axios.post('/api/auth/login', {
                    login: 'txzy2',
                    password: 'Qwerty@123'
                });

                const result: LoginSuccessResponse | LoginErrorResponse = await response.data;

                if (result.success) {
                    // ✅ Теперь TypeScript знает, что result.data - это объект
                    console.log('USER ID:', result.data.userId);
                    console.log('EMAIL:', result.data.email);
                    console.log('NAME:', result.data.name);
                    console.log('ROLE:', result.data.role);

                    const {setUser} = useAuthStore.getState();
                    setUser(result.data);

                    await router.push('/');
                } else {
                    // ✅ TypeScript знает, что result.data - это string
                    console.log('ERROR:', result.data);
                }
            } catch (err) {
                console.error('❌ Error:', err);
            }
        };

        testApi();
    }, []);

    return (
        <div className='flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black'>
            <div className='text-white'>Проверьте консоль браузера (F12)</div>
        </div>
    );
}
