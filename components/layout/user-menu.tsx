'use client';

import Settings from '@/app/dashboard/settings/page';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {useAuthStore} from '@/stores/auth.store';
import {UserData} from '@/types/auth/jwt.types';
import {LogOut, Mail, Shield, User} from 'lucide-react';
import {useRouter} from 'next/navigation';

interface UserMenuProps {
    user: UserData;
    onLogout: () => void;
}

function getAvatarUrl(seed: string): string {
    return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function UserMenu({user, onLogout}: UserMenuProps) {
    const permissions = useAuthStore(state => state.permissions);
    console.log('[permissions]', permissions);

    const router = useRouter();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className='flex items-center gap-2.5 rounded-full px-2 py-1.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                    <Avatar className='h-8 w-8'>
                        <AvatarImage src={getAvatarUrl(user.name)} alt={user.name} />
                        <AvatarFallback className='text-xs'>
                            {getInitials(user.name)}
                        </AvatarFallback>
                    </Avatar>
                    <span className='text-sm font-medium'>{user.login}</span>
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align='end' className='w-56'>
                <DropdownMenuLabel className='font-normal'>
                    <div className='flex flex-col gap-1'>
                        <p className='text-sm font-medium'>{user.name}</p>
                        <p className='text-xs text-muted-foreground'>{user.email}</p>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() => router.push('/dashboard/settings')}
                    className='gap-2'
                >
                    <span>Настройки</span>
                </DropdownMenuItem>

                <DropdownMenuItem disabled className='gap-2'>
                    <User size={14} />
                    <span>{user.login}</span>
                </DropdownMenuItem>

                <DropdownMenuItem disabled className='gap-2'>
                    <Mail size={14} />
                    <span className='truncate'>{user.email}</span>
                </DropdownMenuItem>

                <DropdownMenuItem disabled className='gap-2'>
                    <Shield size={14} />
                    <span>{user.role}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={onLogout}
                    className='gap-2 text-destructive focus:text-destructive'
                >
                    <LogOut size={14} />
                    <span>Выйти</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
