import { NextRequest, NextResponse } from 'next/server';
import { equiposService } from '@/lib/equipos-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Obtener el equipo con sus partes
    const equipo = await equiposService.getById(parseInt(id));
    
    if (!equipo) {
      return NextResponse.json(
        { error: 'Equipo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(equipo.partes || []);
  } catch (error) {
    console.error('Error al obtener partes del equipo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
