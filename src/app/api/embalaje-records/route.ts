import { NextRequest, NextResponse } from 'next/server';
import { 
  getEmbalajeRecords, 
  getEmbalajeRecordsByProduct, 
  createEmbalajeRecord,
  type EmbalajeRecord 
} from '@/lib/server-db';
import pool from '@/lib/db';
import { sendPushToAll } from '@/lib/push-service';
import AuditService from '@/lib/audit-service';
import { authService } from '@/lib/auth-service';

// Función para obtener usuario autenticado
async function getAuthedUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  return authService.validateSession(token);
}

// GET - Obtener todos los registros de embalaje
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/embalaje-records - Obteniendo registros de embalaje');
    
    const { searchParams } = new URL(request.url);
    const producto = searchParams.get('producto');
    
    let records: EmbalajeRecord[];
    
    if (producto) {
      records = await getEmbalajeRecordsByProduct(producto);
      console.log(`📋 Registros de embalaje para producto ${producto}:`, records.length);
    } else {
      records = await getEmbalajeRecords();
      console.log(`📋 Todos los registros de embalaje:`, records.length);
    }
    
    // Convertir Date a string para la respuesta JSON
    const serializedRecords = records.map(record => ({
      ...record,
      created_at: record.created_at.toISOString(),
      updated_at: record.updated_at.toISOString(),
      fecha: record.fecha.toISOString(),
    }));
    
    return NextResponse.json(serializedRecords);
  } catch (error) {
    console.error('Error en GET /api/embalaje-records:', error);
    return NextResponse.json(
      { error: 'Error al obtener registros de embalaje' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo registro de embalaje
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/embalaje-records - Iniciando creación de registro');
    
    const body = await request.json();
    console.log('📝 Datos recibidos en API:', body);
    console.log('🔍 DEBUG: Tipo de body.fecha:', typeof body.fecha, body.fecha);

    // Obtener usuario autenticado
    const user = await getAuthedUser(request);
    const userName = user?.name || user?.email || 'Usuario desconocido';

    const status = (body?.status ?? 'completed') as 'pending' | 'completed';
    
    // Validar campos requeridos
    const requiredFields = status === 'pending'
      ? ['fecha', 'mescorte', 'producto', 'lote']
      : [
          'fecha', 'mescorte', 'producto', 'presentacion', 'lote', 'tamano_lote',
          'nivel_inspeccion', 'cajas_revisadas', 'total_unidades_revisadas',
          'total_unidades_revisadas_real', 'unidades_faltantes', 'porcentaje_faltantes',
          'etiqueta', 'porcentaje_etiqueta_no_conforme', 'marcacion',
          'porcentaje_marcacion_no_conforme', 'presentacion_no_conforme',
          'porcentaje_presentacion_no_conforme', 'cajas', 'porcentaje_cajas_no_conformes',
          'responsable_identificador_cajas', 'responsable_embalaje', 'responsable_calidad',
          'unidades_no_conformes', 'porcentaje_incumplimiento'
        ];

    const isMissing = (value: any) => value === undefined || value === null || value === '';

    for (const field of requiredFields) {
      if (isMissing(body?.[field])) {
        console.error(`❌ Campo requerido faltante: ${field}`);
        return NextResponse.json(
          { error: `Campo requerido faltante: ${field}` },
          { status: 400 }
        );
      }
    }

    console.log('✅ Validación de campos exitosa');

    // Preparar el registro para la base de datos
    const recordData = {
      ...body,
      fecha: new Date(body.fecha), // Convertir string a Date
      created_by: userName,
      updated_by: body.updated_by || null,
      status,
    };
    
    console.log('🔍 DEBUG: Datos preparados para DB:', recordData);
    console.log('🔍 DEBUG: Tipo de recordData.fecha:', typeof recordData.fecha);

    const newRecord = await createEmbalajeRecord(recordData);
    
    // Registrar auditoría detallada de campos creados
    await AuditService.logChanges(
      'embalaje_records',
      newRecord.id,
      {},
      recordData,
      recordData.created_by || 'Usuario desconocido',
      body.userEmail,
      'CREATE'
    );

    console.log('✅ Registro de embalaje creado exitosamente en API:', newRecord.id);
    
    // Convertir Date a string para la respuesta JSON
    const serializedRecord = {
      ...newRecord,
      created_at: newRecord.created_at.toISOString(),
      updated_at: newRecord.updated_at.toISOString(),
      fecha: newRecord.fecha.toISOString(),
    };
    
    return NextResponse.json(serializedRecord, { status: 201 });
  } catch (error) {
    console.error('❌ ERROR en POST /api/embalaje-records:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Error al crear registro de embalaje',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
