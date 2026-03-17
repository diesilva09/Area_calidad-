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
    
    // Filtrar registros que tienen campos con valor "Pendiente"
    const pendingRecords = allRecords.filter((record: EmbalajeRecord) => {
      return record.presentacion === 'Pendiente' ||
             record.nivel_inspeccion === 'Pendiente' ||
             record.etiqueta === 'Pendiente' ||
             record.marcacion === 'Pendiente' ||
             record.presentacion_no_conforme === 'Pendiente' ||
             record.cajas === 'Pendiente' ||
             record.responsable_identificador_cajas === 'Pendiente' ||
             record.responsable_embalaje === 'Pendiente' ||
             record.responsable_calidad === 'Pendiente';
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
