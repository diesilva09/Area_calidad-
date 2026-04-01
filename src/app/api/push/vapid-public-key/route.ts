import { NextResponse } from 'next/server';
import { getVapidPublicKey } from '@/lib/push-service';

export async function GET() {
  try {
    const key = await getVapidPublicKey();
    return NextResponse.json({ publicKey: key });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'VAPID no configurado' }, { status: 500 });
  }
}
