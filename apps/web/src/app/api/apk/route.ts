import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL('/alledu-mobile.apk', request.url);
  return NextResponse.redirect(url, 307);
}
