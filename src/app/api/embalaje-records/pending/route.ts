import { NextRequest, NextResponse } from 'next/server';
import { 
  getEmbalajeRecords, 
  type EmbalajeRecord 
} from '@/lib/server-db';

// GET - Obtener registros de embalaje pendientes
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/embalaje-records/pending - Obteniendo registros pendientes');
    
    // Obtener todos los registros de embalaje
    const allRecords = await getEmbalajeRecords();
    
    // Preferir status explícito cuando exista.
    // Fallback: filtrar registros que tienen campos con valor "Pendiente" (legado).
    const pendingRecords = allRecords.filter((record: EmbalajeRecord) => {
      const status = (record as any)?.status as string | undefined;
      if (status === 'pending') return true;

      const hasLegacyPendingFields =
        record.presentacion === 'Pendiente' ||
        record.nivel_inspeccion === 'Pendiente' ||
        record.etiqueta === 'Pendiente' ||
        record.marcacion === 'Pendiente' ||
        record.presentacion_no_conforme === 'Pendiente' ||
        record.cajas === 'Pendiente' ||
        record.responsable_identificador_cajas === 'Pendiente' ||
        record.responsable_embalaje === 'Pendiente' ||
        record.responsable_calidad === 'Pendiente';

      // Nota: si existe una migración/backfill que dejó status='completed' en registros
      // que aún tienen campos "Pendiente" (legado), igual deben aparecer como pendientes.
      if (status === 'completed') return hasLegacyPendingFields;

      return hasLegacyPendingFields;
    });
    
    console.log(`📋 Registros pendientes encontrados: ${pendingRecords.length}`);
    
    // Convertir Date a string para la respuesta JSON
    const serializedRecords = pendingRecords.map(record => ({
      ...record,
      created_at: record.created_at.toISOString(),
      updated_at: record.updated_at.toISOString(),
      fecha: record.fecha.toISOString(),
    }));
    
    return NextResponse.json(serializedRecords);
  } catch (error) {
    console.error('Error en GET /api/embalaje-records/pending:', error);
    return NextResponse.json(
      { error: 'Error al obtener registros pendientes de embalaje' },
      { status: 500 }
    );
  }
}
