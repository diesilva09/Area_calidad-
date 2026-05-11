import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getMicroTable, getPoolConfig } from '../../micro-config';

const pool = new Pool(getPoolConfig());

// Función para generar código M-X
function generateCodigoMuestra(index: number): string {
  return `M-${index}`;
}

// Función para obtener descripción del labor según tipo
function getMuestraIdFromTipo(tipo: string, area: string): string {
  const tipoLower = tipo.toLowerCase();
  
  switch (tipoLower) {
    case 'manipuladores':
      return `Frotis de mano - Análisis de manipuladores - ${area}`;
    case 'superficies':
      return `Frotis de superficie - Control de higiene - ${area}`;
    case 'ambientes':
      return `Muestreo de ambiente - Control ambiental - ${area}`;
    case 'otro':
      return `Labor personalizado - ${area}`;
    default:
      return `Muestreo de ${tipo} - ${area}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = parseInt(searchParams.get('mes') || '');
    const anio = parseInt(searchParams.get('anio') || '');

    if (!mes || !anio || mes < 1 || mes > 12) {
      return NextResponse.json(
        { error: 'Mes y año son requeridos y deben ser válidos' },
        { status: 400 }
      );
    }

    // Fechas del mes
    const fechaInicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
    const fechaFin = new Date(anio, mes, 0).toISOString().split('T')[0];

    // Obtener tareas de todos los cronogramas para el mes especificado
    const tareasAguaPotableQuery = `
      SELECT 
        id,
        'agua_potable' as tipo_origen,
        area,
        responsable,
        fecha_programada as start_date,
        'PL-CAL-009' as cronograma_codigo,
        cronograma_tipo
      FROM lab_microbiologia.cronograma_agua_potable
      WHERE fecha_programada >= $1 AND fecha_programada <= $2
        AND estado != 'cancelled'
    `;

    const tareasMateriaPrimaQuery = `
      SELECT 
        id,
        'materia_prima' as tipo_origen,
        tipo_materia as area,
        responsable,
        fecha_programada as start_date,
        'PL-CAL-010' as cronograma_codigo,
        cronograma_tipo
      FROM lab_microbiologia.cronograma_materia_prima
      WHERE fecha_programada >= $1 AND fecha_programada <= $2
        AND estado != 'cancelled'
    `;

    const tareasPTExternoQuery = `
      SELECT 
        id,
        'producto_terminado_externo' as tipo_origen,
        area,
        responsable,
        fecha_programada as start_date,
        'PL-CAL-009' as cronograma_codigo,
        cronograma_tipo
      FROM lab_microbiologia.cronograma_pt_externo
      WHERE fecha_programada >= $1 AND fecha_programada <= $2
        AND estado != 'cancelled'
    `;

    const tareasCronogramaGeneralQuery = `
      SELECT 
        id,
        'general' as tipo_origen,
        tipo as area,
        responsable,
        start_date,
        cronograma_codigo,
        cronograma_tipo
      FROM ${getMicroTable('cronograma')}
      WHERE start_date >= $1 AND start_date <= $2
    `;

    console.log(` Buscando tareas de cronogramas entre ${fechaInicio} y ${fechaFin}`);
    
    const [aguaPotableResult, materiaPrimaResult, ptExternoResult, cronogramaGeneralResult] = await Promise.all([
      pool.query(tareasAguaPotableQuery, [fechaInicio, fechaFin]),
      pool.query(tareasMateriaPrimaQuery, [fechaInicio, fechaFin]),
      pool.query(tareasPTExternoQuery, [fechaInicio, fechaFin]),
      pool.query(tareasCronogramaGeneralQuery, [fechaInicio, fechaFin])
    ]);

    const tareas = [
      ...aguaPotableResult.rows.map(t => ({ ...t, tipo: 'Agua Potable' })),
      ...materiaPrimaResult.rows.map(t => ({ ...t, tipo: 'Materia Prima' })),
      ...ptExternoResult.rows.map(t => ({ ...t, tipo: 'Producto Terminado Externo' })),
      ...cronogramaGeneralResult.rows.map(t => ({ ...t, tipo: t.area }))
    ];

    console.log(` Encontradas ${tareas.length} tareas en los cronogramas`);

    if (tareas.length === 0) {
      return NextResponse.json({
        message: 'No hay tareas en el cronograma para este mes',
        creados: 0,
        tareas: []
      });
    }

    // Verificar qué tareas ya tienen registro de custodia de muestras
    const tareasConRegistroQuery = `
      SELECT cronograma_task_id
      FROM ${getMicroTable('custodia_muestras')}
      WHERE cronograma_task_id = ANY($1)
    `;

    const tareaIds = tareas.map((t: any) => t.id);
    const existentesResult = await pool.query(tareasConRegistroQuery, [tareaIds]);
    const tareasExistentes = new Set(existentesResult.rows.map((r: any) => r.cronograma_task_id));

    // Filtrar tareas que no tienen registro
    const tareasSinRegistro = tareas.filter((t: any) => !tareasExistentes.has(t.id));

    if (tareasSinRegistro.length === 0) {
      return NextResponse.json({
        message: 'Todas las tareas del mes ya tienen registro de custodia de muestras',
        creados: 0,
        tareas: []
      });
    }

    // Obtener el último código M-X
    const codigoQuery = `
      SELECT codigo 
      FROM ${getMicroTable('custodia_muestras')}
      WHERE codigo LIKE 'M-%'
      ORDER BY 
        CAST(SUBSTRING(codigo FROM 3) AS INTEGER) DESC
      LIMIT 1
    `;

    const codigoResult = await pool.query(codigoQuery);
    let nextNumero = 1;
    
    if (codigoResult.rows.length > 0) {
      const lastCodigo = codigoResult.rows[0].codigo;
      const match = lastCodigo.match(/M-(\d+)/);
      if (match) {
        nextNumero = parseInt(match[1]) + 1;
      }
    }

    // Crear registros pendientes para cada tarea sin registro
    const registrosCreados: any[] = [];
    
    for (const tarea of tareasSinRegistro) {
      try {
        const tipoFinal = tarea.tipo; // Ya viene normalizado desde las queries
        const areaFinal = tarea.area; // Ya viene normalizado desde las queries
        const codigo = generateCodigoMuestra(nextNumero++);
        const muestraId = getMuestraIdFromTipo(tipoFinal, areaFinal);
        
        // Usar la fecha de la tarea como fecha de toma de muestra
        const fechaTarea = tarea.start_date;

        // Determinar cronograma_codigo y cronograma_tipo
        let cronogramaCodigo = tarea.cronograma_codigo || 'PL-CAL-008';
        let cronogramaTipo = tarea.cronograma_tipo;

        // Si cronograma_tipo es NULL, determinarlo basado en el tipo_origen
        if (!cronogramaTipo) {
          if (tarea.tipo_origen === 'agua_potable') {
            cronogramaTipo = 'externo';
            cronogramaCodigo = 'PL-CAL-009';
          } else if (tarea.tipo_origen === 'materia_prima') {
            cronogramaTipo = 'externo';
            cronogramaCodigo = 'PL-CAL-010';
          } else if (tarea.tipo_origen === 'producto_terminado_externo') {
            cronogramaTipo = 'externo';
            cronogramaCodigo = 'PL-CAL-009';
          } else if (tarea.tipo_origen === 'general') {
            cronogramaTipo = 'interno';
            cronogramaCodigo = 'PL-CAL-008';
          } else {
            cronogramaTipo = 'interno';
            cronogramaCodigo = 'PL-CAL-008';
          }
        }

        console.log(`📝 Creando registro para tarea ${tarea.id}: ${codigo} - ${tipoFinal} - ${areaFinal} - ${cronogramaCodigo} (${cronogramaTipo})`);

        const insertQuery = `
          INSERT INTO ${getMicroTable('custodia_muestras')} (
            codigo,
            tipo,
            muestra_id,
            area,
            temperatura,
            cantidad,
            motivo,
            toma_muestra_fecha,
            toma_muestra_hora,
            recepcion_lab_fecha,
            recepcion_lab_hora,
            medio_transporte,
            responsable,
            cronograma_task_id,
            estado,
            observaciones,
            cronograma_codigo,
            cronograma_tipo
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          RETURNING *
        `;

        const values = [
          codigo,
          tipoFinal,
          muestraId,
          areaFinal,
          '', // temperatura vacía (pendiente de completar)
          '', // cantidad vacía (pendiente de completar)
          'control_rutinario', // motivo por defecto
          fechaTarea,
          null, // hora vacía (pendiente de completar) - usar null para campos TIME
          fechaTarea,
          null, // hora vacía (pendiente de completar) - usar null para campos TIME
          '', // medio_transporte vacío (pendiente de completar)
          tarea.responsable || '',
          tarea.id,
          'pendiente',
          `Registro generado automáticamente desde cronograma ${cronogramaCodigo}`,
          cronogramaCodigo,
          cronogramaTipo
        ];

        const insertResult = await pool.query(insertQuery, values);
        registrosCreados.push(insertResult.rows[0]);
        console.log(`✅ Registro creado: ${codigo} - ${cronogramaCodigo} (${cronogramaTipo})`);
      } catch (insertError: any) {
        console.error(`❌ Error al crear registro para tarea ${tarea.id}:`, insertError.message);
        throw insertError; // Re-lanzar para que se maneje en el catch general
      }
    }

    return NextResponse.json({
      message: `Se crearon ${registrosCreados.length} registros pendientes`,
      creados: registrosCreados.length,
      tareas: registrosCreados
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error al generar registros desde cronograma:', error);
    console.error('Detalle del error:', error.message);
    if (error.code) {
      console.error('Código de error PostgreSQL:', error.code);
    }
    return NextResponse.json(
      { error: 'Error al generar registros desde el cronograma', detail: error.message },
      { status: 500 }
    );
  }
}
