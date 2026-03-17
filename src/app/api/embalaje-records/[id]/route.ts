import { NextRequest, NextResponse } from 'next/server';
import { 
  updateEmbalajeRecord, 
  type EmbalajeRecord 
} from '@/lib/server-db';

// PUT - Actualizar un registro de embalaje existente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔄 PUT /api/embalaje-records/[id] - Iniciando actualización de registro');
    
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    console.log('📝 ID del registro a actualizar:', id);

    const body = await request.json();
    console.log('📝 Datos recibidos para actualización:', body);

    // Validar campos básicos requeridos (los demás pueden ser opcionales en actualización)
    const basicRequiredFields = [
      'fecha', 'mescorte', 'producto', 'presentacion', 'lote'
    ];

    for (const field of basicRequiredFields) {
      if (!body[field]) {
        console.error(`❌ Campo básico requerido faltante: ${field}`);
        return NextResponse.json(
          { error: `Campo básico requerido faltante: ${field}` },
          { status: 400 }
        );
      }
    }

    console.log('✅ Validación básica pasada');

    // Preparar datos para la actualización
    const updateData = {
      ...body,
      fecha: new Date(body.fecha), // Convertir string a Date si es necesario
      updated_at: new Date(),
      updated_by: body.updated_by || 'user'
    };

    console.log('🔄 Datos para actualizar:', updateData);

    // Actualizar el registro
    const updatedRecord = await updateEmbalajeRecord(id, updateData);
    
    if (!updatedRecord) {
      console.error('❌ Registro no encontrado o error al actualizar');
      return NextResponse.json(
        { error: 'Registro de embalaje no encontrado o error al actualizar' },
        { status: 404 }
      );
    }

    console.log('✅ Registro de embalaje actualizado exitosamente:', updatedRecord);

    // Convertir Date a string para la respuesta JSON
    const serializedRecord = {
      ...updatedRecord,
      created_at: updatedRecord.created_at.toISOString(),
      updated_at: updatedRecord.updated_at.toISOString(),
      fecha: updatedRecord.fecha.toISOString()
    };

    return NextResponse.json(serializedRecord);

  } catch (error) {
    console.error('❌ Error en PUT /api/embalaje-records/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
