import { NextRequest, NextResponse } from 'next/server';
import { equiposService } from '@/lib/equipos-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parte = await equiposService.createParte(body);
    return NextResponse.json(parte, { status: 201 });
  } catch (error) {
    console.error('Error al crear parte:', error);
    return NextResponse.json(
      { error: 'No se pudo crear la parte' },
      { status: 500 }
    );
  }
}
