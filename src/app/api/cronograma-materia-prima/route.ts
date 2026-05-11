import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authService } from '@/lib/auth-service';

// Verificar si el usuario puede gestionar el cronograma
function canManageCronograma(role: unknown): boolean {
  const r = String(role ?? '').toLowerCase();
  return r === 'jefe' || r === 'supervisor' || r === 'operario' || r === 'admin' || r === 'tecnico' || r === 'microbiologia';
}

// Función para obtener usuario autenticado
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

    const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const lastDayStr = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

    const result = await pool.query(
      `SELECT codigo FROM lab_microbiologia.custodia_muestras
       WHERE toma_muestra_fecha BETWEEN $1 AND $2`,
      [firstDay, lastDayStr]
    );

    const codigosM = result.rows
      .map((r: any) => r.codigo)
      .filter((c: string) => c && c.startsWith('M-'))
      .map((c: string) => {
        const num = parseInt(c.replace('M-', ''));
        return isNaN(num) ? 0 : num;
      })
      .sort((a: number, b: number) => b - a);

    const lastNumber = codigosM.length > 0 ? codigosM[0] : 0;
    return `M-${lastNumber + 1}`;
  } catch (error) {
    console.error('Error al obtener siguiente código:', error);
    return 'M-1';
  }
}

// GET - Obtener todas las tareas del cronograma de materia prima
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Si se pasa un ID, obtener una tarea específica
    if (id) {
      const result = await pool.query(
        `SELECT * FROM lab_microbiologia.cronograma_materia_prima WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
      }

      return NextResponse.json(result.rows[0]);
    }

    // Obtener todas las tareas con código de muestra
    const result = await pool.query(
      `SELECT DISTINCT ON (cmp.id)
        cmp.*,
        cm.codigo as codigo_muestra
      FROM lab_microbiologia.cronograma_materia_prima cmp
      LEFT JOIN lab_microbiologia.custodia_muestras cm 
        ON cm.cronograma_task_id = cmp.id
      ORDER BY cmp.id, cmp.fecha_programada DESC`
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener tareas de materia prima:', error);
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
    
    // Debug: log user role
    console.log('👤 Usuario autenticado:', { 
      id: (user as any).id, 
      email: (user as any).email, 
      role: (user as any).role 
    });
    
    if (!canManageCronograma((user as any).role)) {
      return NextResponse.json({ 
        error: 'No tienes permisos',
        role: (user as any).role,
        requiredRoles: ['admin', 'supervisor', 'tecnico', 'microbiologia']
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      producto_id,
      producto_nombre,
      tipo_materia,
      fecha_programada,
      responsable,
      estado,
      descripcion,
    } = body;

    if (!producto_id || !tipo_materia || !fecha_programada) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: producto_id, tipo_materia, fecha_programada' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Crear la tarea en cronograma_materia_prima
      const result = await client.query(
        `INSERT INTO lab_microbiologia.cronograma_materia_prima (
          producto_id, producto_nombre, tipo_materia, fecha_programada, responsable, estado, descripcion,
          creado_por, actualizado_por
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          producto_id,
          producto_nombre || null,
          tipo_materia,
          fecha_programada,
          responsable || null,
          estado || 'pending',
          descripcion || null,
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
          cronograma_codigo, cronograma_tipo, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
        [
          codigoMuestra,                           // $1: código M-X
          'Materia Prima',                         // $2: tipo
          producto_nombre || producto_id,           // $3: muestra_id (nombre del producto)
          tipo_materia || 'Materia Prima',         // $4: área (tipo de materia)
          'N/A',                                   // $5: temperatura
          '1',                                     // $6: cantidad
          'control_rutinario',                   // $7: motivo
          fecha_programada,                        // $8: fecha toma muestra
          horaActual,                              // $9: hora toma muestra
          fechaActual,                             // $10: fecha recepción lab
          horaActual,                              // $11: hora recepción lab
          'N/A',                                   // $12: medio transporte
          responsable || 'PENDIENTE',            // $13: responsable
          '',                                       // $14: observaciones
          nuevaTarea.id,                           // $15: cronograma_task_id
          'pendiente',                             // $16: estado
          'PL-CAL-010',                            // $17: cronograma_codigo
          'externo',                               // $18: cronograma_tipo
          now,                                     // $19: created_at
          now                                      // $20: updated_at
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
    console.error('Error al crear tarea de agua potable:', error);
    return NextResponse.json(
      { error: 'Error al crear la tarea del cronograma' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar tarea existente
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (!canManageCronograma((user as any).role)) {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const body = await request.json();
    
    console.log('🔍 PUT cronograma-materia-prima - ID:', id, 'Body:', body);

    // Campos permitidos para actualizar
    const fields = [
      'producto_id',
      'producto_nombre',
      'tipo_materia',
      'fecha_programada',
      'responsable',
      'estado',
      'descripcion',
      'marca_manual',
    ];

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    for (const field of fields) {
      if (body[field] !== undefined) {
        console.log(`✅ Campo detectado: ${field} = ${body[field]}`);
        updates.push(`${field} = $${paramCount}`);
        values.push(body[field]);
        paramCount++;
      }
    }

    // Siempre actualizar updated_at y actualizado_por
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    updates.push(`actualizado_por = $${paramCount}`);
    values.push((user as any).email || (user as any).id || null);
    paramCount++;

    values.push(id);

    console.log(`🔍 Updates detectados: ${updates.length - 2}, Total updates: ${updates.length}`);
    console.log(`🔍 Query construida:`, updates.join(', '));

    if (updates.length === 2) {
      console.log('❌ No hay campos para actualizar (solo updated_at y actualizado_por)');
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    // FIX: Usar values.length para obtener el índice correcto del ID
    const query = `
      UPDATE lab_microbiologia.cronograma_materia_prima
      SET ${updates.join(', ')}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('❌ Error al actualizar tarea de materia prima:', error);
    console.error('❌ Error detalles:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Error específico si la columna no existe
    if (error.message?.includes('column "marca_manual" does not exist')) {
      return NextResponse.json(
        { error: 'La columna marca_manual no existe en la tabla. Ejecute la migración SQL.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al actualizar la tarea', details: error.message },
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
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const result = await pool.query(
      `DELETE FROM lab_microbiologia.cronograma_materia_prima WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Tarea eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar tarea de materia prima:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la tarea' },
      { status: 500 }
    );
  }
}
