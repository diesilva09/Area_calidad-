import { NextRequest, NextResponse } from 'next/server';
import {
  updateEmbalajeRecord, 
  getEmbalajeRecords,
  deleteEmbalajeRecord,
  type EmbalajeRecord 
} from '@/lib/server-db';
import { authService } from '@/lib/auth-service';
import { fieldAuditService } from '@/lib/field-audit-service.server';
import { detectFieldChanges } from '@/lib/audit-utils';

async function getAuthedUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  return authService.validateSession(token);
}

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

    // Obtener usuario autenticado
    const user = await getAuthedUser(request);
    const userName = user?.name || user?.email || 'Usuario desconocido';

    // Obtener registro actual para auditoría
    let existingRecord: EmbalajeRecord | null = null;
    try {
      const all = await getEmbalajeRecords();
      existingRecord = all.find(r => r.id === id) || null;
    } catch (e) {
      existingRecord = null;
    }

    // Regla de permisos:
    // - Si el registro está COMPLETADO, solo el rol 'jefe' puede editar.
    // - Si está PENDIENTE, se mantiene la lógica actual (para poder completarlo).
    if (existingRecord && String((existingRecord as any)?.status ?? '').toLowerCase() === 'completed') {
      if (!user || String((user as any).role ?? '').toLowerCase() !== 'jefe') {
        return NextResponse.json(
          { error: 'No tienes permisos para editar un registro completado' },
          { status: 403 }
        );
      }
    }

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
      updated_by: userName
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

    // AUDITORÍA: registrar solo cambios reales
    try {
      if (existingRecord) {
        const auditData: any = { ...updateData };
        delete auditData.updated_by;
        delete auditData.updated_at;

        // Filtrar undefined y vacíos que no representan cambio real
        for (const [key, value] of Object.entries(auditData)) {
          if (value === undefined) {
            delete auditData[key];
            continue;
          }
          if (value === '' && (existingRecord as any)[key] == null) {
            delete auditData[key];
            continue;
          }
        }

        const changes = detectFieldChanges(existingRecord, auditData, ['id', 'created_at', 'updated_at', 'created_by', 'updated_by']);
        if (changes.length > 0) {
          await fieldAuditService.logMultipleChanges(
            'embalaje_records',
            id,
            changes,
            userName,
            {
              userRole: user?.role,
              userEmail: user?.email || undefined,
              sessionId: request.cookies.get('auth-token')?.value || undefined,
              ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
            }
          );
        }
      }
    } catch (auditError) {
      console.error('❌ AUDITORÍA EMBALAJE - Error al registrar cambios:', auditError);
    }

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

// DELETE - Eliminar un registro de embalaje
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (String((user as any).role ?? '').toLowerCase() !== 'jefe') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar registros de embalaje' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;

    const deleted = await deleteEmbalajeRecord(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Registro eliminado exitosamente' });
  } catch (error) {
    console.error('Error en DELETE /api/embalaje-records/[id]:', error);
    return NextResponse.json(
      { error: 'Error al eliminar registro de embalaje' },
      { status: 500 }
    );
  }
}
