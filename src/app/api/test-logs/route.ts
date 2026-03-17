import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Test de logs - Iniciando...');
    
    // Importar y probar createProductionRecord con datos mínimos
    const { createProductionRecord } = await import('@/lib/server-db');
    
    const testData = {
      fechaproduccion: new Date('2024-01-15'),
      fechavencimiento: new Date('2024-06-15'),
      mescorte: 'ENERO',
      producto: 'Producto Test',
      lote: 'LOTE001',
      tamano_lote: '1000',
      letratamano_muestra: 'A',
      area: 'PRODUCCION',
      equipo: 'EQUIPO01',
      liberacion_inicial: 'Aprobado',
      verificacion_aleatoria: 'OK',
      observaciones: undefined,
      tempam1: '25',
      tempam2: '26',
      temppm1: '24',
      temppm2: '25',
      analisis_sensorial: 'OK',
      prueba_hermeticidad: 'OK',
      inspeccion_micropesaje_mezcla: 'OK',
      inspeccion_micropesaje_resultado: 'OK',
      total_unidades_revisar_drenado: '100',
      peso_drenado_declarado: '500',
      rango_peso_drenado_min: '450',
      rango_peso_drenado_max: '550',
      pesos_drenados: '480,490,510',
      promedio_peso_drenado: '493',
      encima_peso_drenado: '10',
      debajo_peso_drenado: '5',
      und_incumplen_rango_drenado: '15',
      porcentaje_incumplen_rango_drenado: '15',
      total_unidades_revisar_neto: '100',
      peso_neto_declarado: '450',
      pesos_netos: '430,440,460',
      promedio_peso_neto: '443',
      encima_peso_neto: '8',
      debajo_peso_neto: '7',
      und_incumplen_rango_neto: '15',
      porcentaje_incumplen_rango_neto: '15',
      pruebas_vacio: 'OK',
      novedades_proceso: undefined,
      observaciones_acciones_correctivas: undefined,
      supervisor_calidad: 'Juan Pérez',
      fechaanalisispt: new Date('2024-01-16'),
      no_mezcla_pt: 'OK',
      vacio_pt: 'OK',
      peso_neto_real_pt: '443',
      peso_drenado_real_pt: '493',
      brix_pt: '12',
      ph_pt: '3.5',
      acidez_pt: '0.5',
      ppm_so2_pt: '200',
      consistencia_pt: 'OK',
      sensorial_pt: 'OK',
      tapado_cierre_pt: 'OK',
      etiqueta_pt: 'OK',
      presentacion_final_pt: 'OK',
      ubicacion_muestra_pt: 'Laboratorio',
      estado_pt: 'Aprobado',
      observaciones_pt: undefined,
      responsable_analisis_pt: 'Ana García',
      created_by: 'system',
      updated_by: 'system'
    };
    
    console.log('📦 Datos de prueba preparados:', JSON.stringify(testData, null, 2));
    
    const result = await createProductionRecord(testData);
    console.log('✅ Registro creado exitosamente:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Test de creación exitoso',
      result: result
    });
    
  } catch (error) {
    console.error('❌ Error en test de logs:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace available'
    }, { status: 500 });
  }
}
