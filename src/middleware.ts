import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from './lib/auth0';

export async function middleware(request: NextRequest) {
  console.log('middleware hit:', request.nextUrl.pathname);
  return await auth0.middleware(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};