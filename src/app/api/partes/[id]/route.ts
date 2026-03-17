import { NextRequest, NextResponse } from 'next/server';
import { equiposService } from '@/lib/equipos-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID de parte inválido' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const parte = await equiposService.updateParte(id, body);
    return NextResponse.json(parte);
  } catch (error) {
    console.error('Error al actualizar parte:', error);
    return NextResponse.json(
      { error: 'No se pudo actualizar la parte' },
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
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID de parte inválido' },
        { status: 400 }
      );
    }
    
    await equiposService.deleteParte(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar parte:', error);
    return NextResponse.json(
      { error: 'No se pudo eliminar la parte' },
      { status: 500 }
    );
  }
}
