import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Fixed URL — never derived from request.url to prevent open redirect
const APK_URL = process.env.NEXT_PUBLIC_APK_URL ?? '/alledu-mobile.apk';

export async function GET() {
  // Only allow relative paths or known safe absolute HTTPS URLs
  const target = APK_URL.startsWith('https://') ? APK_URL : '/alledu-mobile.apk';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alledu.in';
  return NextResponse.redirect(new URL(target, baseUrl), 307);
}
