// middleware.ts
import {NextRequest, NextResponse} from 'next/server';

export function middleware(request: NextRequest) {
    const accessToken = request.cookies.get('access_token')?.value;
    const {pathname} = request.nextUrl;

    const isDashboard = pathname.startsWith('/dashboard');
    const isAuth = pathname === '/login' || pathname === '/register';

    if (isDashboard && !accessToken) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isAuth && accessToken) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/login', '/register']
};
