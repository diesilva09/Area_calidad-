import { NextRequest, NextResponse } from 'next/server';
import { equiposService } from '@/lib/equipos-service';

export async function GET() {
  try {
    const equipos = await equiposService.getAll();
    return NextResponse.json(equipos);
  } catch (error) {
    console.error('Error al obtener equipos:', error);
    return NextResponse.json(
      { error: 'No se pudieron obtener los equipos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const equipo = await equiposService.create(body);
    return NextResponse.json(equipo, { status: 201 });
  } catch (error) {
    console.error('Error al crear equipo:', error);
    return NextResponse.json(
      { error: 'No se pudo crear el equipo' },
      { status: 500 }
    );
  }
}
