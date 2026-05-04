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

    // Obtener tareas del cronograma para el mes especificado
    const tareasQuery = `
      SELECT 
        t.id,
        t.tipo,
        t.tipo_personalizado,
        t.area,
        t.area_personalizada,
        t.responsable,
        t.start_date,
        t.end_date
      FROM ${getMicroTable('cronograma')} t
      WHERE t.start_date >= $1 AND t.start_date <= $2
      ORDER BY t.start_date
    `;

    console.log(` Buscando tareas del cronograma entre ${fechaInicio} y ${fechaFin}`);
    console.log(` Query: ${tareasQuery}`);
    console.log(` Tabla: ${getMicroTable('cronograma')}`);
    
    const tareasResult = await pool.query(tareasQuery, [fechaInicio, fechaFin]);
    const tareas = tareasResult.rows;

    console.log(` Encontradas ${tareas.length} tareas en el cronograma`);

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
        const tipoFinal = tarea.tipo_personalizado || tarea.tipo;
        const areaFinal = tarea.area_personalizada || tarea.area;
        const codigo = generateCodigoMuestra(nextNumero++);
        const muestraId = getMuestraIdFromTipo(tarea.tipo, areaFinal);
        
        // Usar la fecha de la tarea como fecha de toma de muestra
        const fechaTarea = tarea.start_date;

        console.log(`📝 Creando registro para tarea ${tarea.id}: ${codigo} - ${tipoFinal} - ${areaFinal}`);

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
            observaciones
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
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
          'Registro generado automáticamente desde cronograma PL-CAL-008'
        ];

        const insertResult = await pool.query(insertQuery, values);
        registrosCreados.push(insertResult.rows[0]);
        console.log(`✅ Registro creado: ${codigo}`);
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
