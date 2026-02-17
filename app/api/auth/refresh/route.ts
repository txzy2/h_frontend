// app/api/auth/refresh/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {AuthService, AuthenticationError} from '@/lib/auth/auth.service';
import {CookieService} from '@/lib/auth/cookie.service';
import {RefreshResponse} from '@/types/auth';

export async function POST(request: NextRequest): Promise<NextResponse<RefreshResponse>> {
    const refreshToken = CookieService.getRefreshToken(request);

    if (!refreshToken) {
        return createFailedResponse('No refresh token', 401);
    }

    try {
        const tokens = await AuthService.refreshTokens(refreshToken);

        const response = NextResponse.json<RefreshResponse>(
            {success: true, data: 'Tokens refreshed'},
            {status: 200}
        );

        CookieService.setAuthTokens(response, tokens);
        return response;
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return createFailedResponse(error.message, error.statusCode);
        }
        return createFailedResponse('Refresh failed', 500);
    }
}

function createFailedResponse(message: string, status: number): NextResponse<RefreshResponse> {
    const response = NextResponse.json<RefreshResponse>({success: false, data: message}, {status});
    CookieService.clearAuthTokens(response);
    return response;
}
