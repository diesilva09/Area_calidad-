import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authService } from '@/lib/auth-service';

async function getAuthedUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  return authService.validateSession(token);
}

// Función para obtener el siguiente código de muestra M-X
async function getNextCodigoMuestra(fecha: string): Promise<string> {
  try {
    const date = new Date(fecha);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    // Obtener todos los registros de custodia de muestras del mes de la fecha
    const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const lastDayStr = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    const result = await pool.query(
      `SELECT codigo FROM lab_microbiologia.custodia_muestras 
       WHERE toma_muestra_fecha BETWEEN $1 AND $2`,
      [firstDay, lastDayStr]
    );
    
    // Filtrar códigos que empiezan con M-
    const codigosM = result.rows
      .map((r: any) => r.codigo)
      .filter((c: string) => c && c.startsWith('M-'))
      .map((c: string) => {
        const num = parseInt(c.replace('M-', ''));
        return isNaN(num) ? 0 : num;
      })
      .sort((a: number, b: number) => b - a); // Ordenar descendente
    
    const lastNumber = codigosM.length > 0 ? codigosM[0] : 0;
    return `M-${lastNumber + 1}`;
  } catch (error) {
    console.error('Error al obtener siguiente código:', error);
    return 'M-1';
  }
}

function canManageCronograma(role: unknown): boolean {
  const r = String(role ?? '').toLowerCase();
  return r === 'jefe' || r === 'supervisor' || r === 'operario' || r === 'admin';
}

// GET - Obtener tareas del cronograma de producto terminado
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const productoId = searchParams.get('productoId');

    // Query con LEFT JOIN para obtener el código de muestra de RE-CAL-107
    let query = `
      SELECT 
        cpt.*,
        cm.codigo as codigo_muestra
      FROM lab_microbiologia.cronograma_producto_terminado cpt
      LEFT JOIN lab_microbiologia.custodia_muestras cm 
        ON cm.cronograma_task_id = cpt.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (date) {
      conditions.push(`cpt.fecha_programada = $${params.length + 1}`);
      params.push(date);
    } else if (startDate && endDate) {
      conditions.push(`cpt.fecha_programada >= $${params.length + 1} AND cpt.fecha_programada <= $${params.length + 2}`);
      params.push(startDate, endDate);
    }

    if (productoId) {
      conditions.push(`cpt.producto_id = $${params.length + 1}`);
      params.push(productoId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY cpt.fecha_programada DESC, cpt.fecha_creacion DESC';

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener tareas del cronograma PT:', error);
    return NextResponse.json(
      { error: 'Error al obtener las tareas del cronograma' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva tarea
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (!canManageCronograma((user as any).role)) {
      return NextResponse.json({ error: 'No tienes permisos para crear tareas' }, { status: 403 });
    }

    const body = await request.json();
    const {
      producto_id,
      producto_nombre,
      fecha_programada,
      area,
      responsable,
      estado,
    } = body;

    // Validar campos obligatorios
    if (!producto_id || !fecha_programada) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: producto_id, fecha_programada' },
        { status: 400 }
      );
    }

    // Iniciar transacción para crear tarea y registro de custodia
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Crear la tarea en cronograma_producto_terminado
      const result = await client.query(
        `INSERT INTO lab_microbiologia.cronograma_producto_terminado (
          producto_id, producto_nombre, fecha_programada, area, responsable, estado,
          creado_por, actualizado_por
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          producto_id,
          producto_nombre || null,
          fecha_programada,
          area || null,
          responsable || null,
          estado || 'pending',
          (user as any).email || (user as any).id || null,
          (user as any).email || (user as any).id || null,
        ]
      );

      const nuevaTarea = result.rows[0];

      // 2. Generar el siguiente código de muestra M-X
      const codigoMuestra = await getNextCodigoMuestra(fecha_programada);

      // 3. Crear registro automático en RE-CAL-107 (custodia_muestras)
      const now = new Date();
      const fechaActual = now.toISOString().split('T')[0];
      const horaActual = now.toTimeString().split(' ')[0].substring(0, 5);

      await client.query(
        `INSERT INTO lab_microbiologia.custodia_muestras (
          codigo, tipo, muestra_id, area, temperatura, cantidad, motivo,
          toma_muestra_fecha, toma_muestra_hora, recepcion_lab_fecha, recepcion_lab_hora,
          medio_transporte, responsable, observaciones, cronograma_task_id, estado,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          codigoMuestra,                           // $1: código M-X
          'Producto Terminado',                    // $2: tipo (producto terminado)
          producto_nombre || producto_id,          // $3: muestra_id (nombre del producto)
          area || 'BD PT (Bodega Producto Terminado)', // $4: área
          'N/A',                                   // $5: temperatura
          '1',                                     // $6: cantidad
          'control_rutinario',                     // $7: motivo
          fecha_programada,                       // $8: fecha toma muestra
          horaActual,                              // $9: hora toma muestra
          fechaActual,                             // $10: fecha recepción lab
          horaActual,                              // $11: hora recepción lab
          'N/A',                                   // $12: medio transporte
          responsable || 'PENDIENTE',              // $13: responsable
          'Generado automáticamente desde cronograma PL-CAL-009', // $14: observaciones
          nuevaTarea.id,                           // $15: cronograma_task_id (ID de la tarea 009)
          'pendiente',                             // $16: estado
          now,                                     // $17: created_at
          now                                      // $18: updated_at
        ]
      );

      await client.query('COMMIT');

      // Agregar info del código de muestra a la respuesta
      return NextResponse.json({
        ...nuevaTarea,
        codigo_muestra: codigoMuestra,
        registro_107_creado: true
      }, { status: 201 });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al crear tarea del cronograma PT:', error);
    return NextResponse.json(
      { error: 'Error al crear la tarea del cronograma' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar tarea
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (!canManageCronograma((user as any).role)) {
      return NextResponse.json({ error: 'No tienes permisos para actualizar tareas' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID de tarea requerido' }, { status: 400 });
    }

    const body = await request.json();
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    // Campos permitidos para actualizar
    const fields = [
      'producto_id',
      'producto_nombre',
      'fecha_programada',
      'area',
      'responsable',
      'estado',
      'marca_manual',
    ];

    for (const field of fields) {
      if (body[field] !== undefined) {
        paramCount++;
        updates.push(`${field} = $${paramCount}`);
        values.push(body[field]);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    // Agregar actualizado_por
    paramCount++;
    updates.push(`actualizado_por = $${paramCount}`);
    values.push((user as any).email || (user as any).id || null);

    paramCount++;
    values.push(id);

    const result = await pool.query(
      `UPDATE lab_microbiologia.cronograma_producto_terminado SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar tarea del cronograma PT:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la tarea del cronograma' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar tarea
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (!canManageCronograma((user as any).role)) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar tareas' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID de tarea requerido' }, { status: 400 });
    }

    const result = await pool.query(
      'DELETE FROM lab_microbiologia.cronograma_producto_terminado WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Tarea eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar tarea del cronograma PT:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la tarea del cronograma' },
      { status: 500 }
    );
  }
}
