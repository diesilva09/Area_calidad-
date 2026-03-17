import { NextRequest, NextResponse } from 'next/server';
import { equiposService } from '@/lib/equipos-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`🔍 Buscando equipo con ID: ${id}`);
    
    // Intentar obtener como número primero
    let equipo;
    const idNumerico = parseInt(id);
    
    if (!isNaN(idNumerico)) {
      equipo = await equiposService.getById(idNumerico);
    } else {
      // Si no es número, buscar por string ID
      equipo = await equiposService.getByIdString(id);
    }
    
    if (!equipo) {
      console.log(`❌ Equipo no encontrado: ${id}`);
      return NextResponse.json(
        { error: 'Equipo no encontrado' },
        { status: 404 }
      );
    }
    
    console.log(`✅ Equipo encontrado: ${equipo.nombre}`);
    return NextResponse.json(equipo);
    
  } catch (error) {
    console.error('Error al obtener equipo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    // Validar que el ID sea un número válido
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID de equipo inválido' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const equipo = await equiposService.update(id, body);
    return NextResponse.json(equipo);
  } catch (error) {
    console.error('Error al actualizar equipo:', error);
    return NextResponse.json(
      { error: 'No se pudo actualizar el equipo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    // Validar que el ID sea un número válido
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID de equipo inválido' },
        { status: 400 }
      );
    }
    
    await equiposService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar equipo:', error);
    return NextResponse.json(
      { error: 'No se pudo eliminar el equipo' },
      { status: 500 }
    );
  }
}
