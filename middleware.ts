// middleware.ts
import {NextRequest, NextResponse} from 'next/server';

export function middleware(request: NextRequest) {
    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;
    const {pathname} = request.nextUrl;

    // Сессия жива, пока есть хотя бы один токен:
    // access живёт 15 минут и может отсутствовать при валидном refresh.
    const hasSession = Boolean(accessToken || refreshToken);

    const isDashboard = pathname.startsWith('/dashboard');
    const isAuth = pathname === '/login' || pathname === '/register';

    if (isDashboard && !hasSession) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isAuth && hasSession) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/login', '/register']
};
