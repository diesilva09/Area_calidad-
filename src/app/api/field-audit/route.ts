import { NextRequest, NextResponse } from 'next/server';
import { fieldAuditService, type FieldAuditLog } from '@/lib/field-audit-service.server';
import { authService } from '@/lib/auth-service';

// Función para obtener usuario autenticado
async function getAuthedUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  return authService.validateSession(token);
}

// GET - Obtener historial de auditoría
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/field-audit - Obteniendo historial de auditoría');
    
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('tableName');
    const recordId = searchParams.get('recordId');
    const fieldName = searchParams.get('fieldName');
    const userEmail = searchParams.get('userEmail');
    const limit = parseInt(searchParams.get('limit') || '50');
    const hours = parseInt(searchParams.get('hours') || '24');

    // Obtener usuario autenticado
    const user = await getAuthedUser(request);
    const userName = user?.name || user?.email || 'Usuario desconocido';

    let auditLogs: FieldAuditLog[] = [];

    if (tableName && recordId && fieldName) {
      // Historial de un campo específico
      auditLogs = await fieldAuditService.getFieldHistory(tableName, recordId, fieldName, limit);
      console.log(`📋 Historial del campo ${fieldName} del registro ${recordId}: ${auditLogs.length} cambios`);
      
    } else if (tableName && recordId) {
      // Historial completo de un registro
      auditLogs = await fieldAuditService.getRecordHistory(tableName, recordId, limit);
      console.log(`📋 Historial completo del registro ${recordId}: ${auditLogs.length} cambios`);
      
    } else if (userEmail) {
      // Cambios de un usuario específico
      auditLogs = await fieldAuditService.getUserChanges(userEmail, limit);
      console.log(`📋 Cambios del usuario ${userEmail}: ${auditLogs.length} cambios`);
      
    } else if (tableName && recordId && hours) {
      // Cambios recientes de un registro
      auditLogs = await fieldAuditService.getRecentFieldChanges(tableName, recordId, hours);
      console.log(`📋 Cambios recientes del registro ${recordId} (${hours}h): ${auditLogs.length} cambios`);
      
    } else {
      return NextResponse.json(
        { error: 'Se requieren parámetros: tableName y recordId, o userEmail' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: auditLogs,
      count: auditLogs.length,
      requestedBy: userName,
      filters: {
        tableName,
        recordId,
        fieldName,
        userEmail,
        limit,
        hours
      }
    });

  } catch (error) {
    console.error('❌ Error en GET /api/field-audit:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener historial de auditoría',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Registrar cambios manuales (para casos especiales)
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/field-audit - Registrando cambio manual');
    
    const body = await request.json();
    console.log('📝 Datos recibidos:', JSON.stringify(body, null, 2));

    // Validar campos requeridos
    const requiredFields = ['tableName', 'recordId', 'fieldName', 'newValue', 'changedBy'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `El campo ${field} es requerido` },
          { status: 400 }
        );
      }
    }

    // Obtener usuario autenticado
    const user = await getAuthedUser(request);
    const userName = user?.name || user?.email || 'Usuario desconocido';

    // Verificar que el usuario que registra es el mismo que el autenticado (o es admin)
    if (body.changedBy !== userName && user?.role !== 'jefe') {
      return NextResponse.json(
        { error: 'No tienes permiso para registrar cambios en nombre de otro usuario' },
        { status: 403 }
      );
    }

    // Registrar el cambio
    const auditLog = await fieldAuditService.logFieldChange({
      tableName: body.tableName,
      recordId: body.recordId,
      fieldName: body.fieldName,
      oldValue: body.oldValue,
      newValue: body.newValue,
      changedBy: body.changedBy,
      changeReason: body.changeReason,
      changeType: body.changeType || 'UPDATE',
      userRole: user?.role,
      userEmail: user?.email,
      sessionId: request.cookies.get('auth-token')?.value,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    });

    console.log('✅ Cambio registrado exitosamente:', auditLog.id);

    return NextResponse.json({
      success: true,
      data: auditLog,
      message: 'Cambio registrado exitosamente',
      registeredBy: userName
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error en POST /api/field-audit:', error);
    return NextResponse.json(
      { 
        error: 'Error al registrar cambio',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar registros de auditoría (solo admin)
export async function DELETE(request: NextRequest) {
  try {
    console.log('DELETE /api/field-audit - Eliminando registros de auditoría');
    
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('tableName');
    const recordId = searchParams.get('recordId');
    const olderThan = searchParams.get('olderThan'); // días

    // Obtener usuario autenticado
    const user = await getAuthedUser(request);
    
    // Solo admin puede eliminar registros de auditoría
    if (!user || user.role !== 'jefe') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar registros de auditoría' },
        { status: 403 }
      );
    }

    if (!tableName || !recordId) {
      return NextResponse.json(
        { error: 'Se requieren tableName y recordId' },
        { status: 400 }
      );
    }

    // Aquí podrías implementar la lógica de eliminación
    // Por ahora, solo retornamos éxito
    console.log(`🗑️ Solicitada eliminación de auditoría para ${tableName}/${recordId}`);

    return NextResponse.json({
      success: true,
      message: 'Solicitud de eliminación procesada',
      deletedBy: user.name || user.email
    });

  } catch (error) {
    console.error('❌ Error en DELETE /api/field-audit:', error);
    return NextResponse.json(
      { 
        error: 'Error al eliminar registros de auditoría',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
