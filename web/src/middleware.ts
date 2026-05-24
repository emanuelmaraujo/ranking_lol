import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Pass through all requests natively
    return NextResponse.next();
}

export const config = {
    matcher: '/api/:path*',
};
