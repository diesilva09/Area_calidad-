import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authService } from '@/lib/auth-service';

async function getAuthedUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  return authService.validateSession(token);
}

async function getNextCodigoMuestra(fecha: string): Promise<string> {
  try {
    const date = new Date(fecha);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const lastDayStr = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    const result = await pool.query(
      `SELECT codigo FROM lab_microbiologia.custodia_muestras WHERE toma_muestra_fecha BETWEEN $1 AND $2`,
      [firstDay, lastDayStr]
    );
    
    const codigosM = result.rows
      .map((r: any) => r.codigo)
      .filter((c: string) => c && c.startsWith('M-'))
      .map((c: string) => parseInt(c.replace('M-', '')) || 0)
      .sort((a: number, b: number) => b - a);
    
    return `M-${(codigosM[0] || 0) + 1}`;
  } catch (error) {
    return 'M-1';
  }
}

function canManageCronograma(role: unknown): boolean {
  const r = String(role ?? '').toLowerCase();
  return r === 'jefe' || r === 'supervisor' || r === 'operario' || r === 'admin' || r === 'tecnico' || r === 'microbiologia';
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthedUser(request);
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const productoId = searchParams.get('productoId');

    let query = `
      SELECT cpte.*, cm.codigo as codigo_muestra
      FROM lab_microbiologia.cronograma_pt_externo cpte
      LEFT JOIN lab_microbiologia.custodia_muestras cm ON cm.cronograma_task_id = cpte.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (date) {
      conditions.push(`cpte.fecha_programada = $${params.length + 1}`);
      params.push(date);
    } else if (startDate && endDate) {
      conditions.push(`cpte.fecha_programada >= $${params.length + 1} AND cpte.fecha_programada <= $${params.length + 2}`);
      params.push(startDate, endDate);
    }

    if (productoId) {
      conditions.push(`cpte.producto_id = $${params.length + 1}`);
      params.push(productoId);
    }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY cpte.fecha_programada DESC, cpte.created_at DESC';

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener las tareas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthedUser(request);
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    if (!canManageCronograma((user as any).role)) return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });

    const body = await request.json();
    const { producto_id, producto_nombre, fecha_programada, area, responsable, estado, descripcion } = body;

    if (!producto_id || !fecha_programada) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO lab_microbiologia.cronograma_pt_externo 
         (producto_id, producto_nombre, fecha_programada, area, responsable, estado, descripcion, creado_por, actualizado_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [producto_id, producto_nombre || null, fecha_programada, area || null, responsable || null, estado || 'pending', descripcion || null, (user as any).email || null, (user as any).email || null]
      );

      const nuevaTarea = result.rows[0];
      const codigoMuestra = await getNextCodigoMuestra(fecha_programada);
      const now = new Date();
      const fechaActual = now.toISOString().split('T')[0];
      const horaActual = now.toTimeString().split(' ')[0].substring(0, 5);

      await client.query(
        `INSERT INTO lab_microbiologia.custodia_muestras 
         (codigo, tipo, muestra_id, area, temperatura, cantidad, motivo, toma_muestra_fecha, toma_muestra_hora, 
          recepcion_lab_fecha, recepcion_lab_hora, medio_transporte, responsable, observaciones, cronograma_task_id, estado, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [codigoMuestra, 'Producto Terminado Externo', producto_nombre || producto_id, area || 'BD PT', 'N/A', '1', 'control_rutinario',
         fecha_programada, horaActual, fechaActual, horaActual, 'N/A', responsable || 'PENDIENTE',
         'Generado desde PL-CAL-009 PT Externo v4', nuevaTarea.id, 'pendiente', now, now]
      );

      await client.query('COMMIT');
      return NextResponse.json({ ...nuevaTarea, codigo_muestra: codigoMuestra, registro_107_creado: true }, { status: 201 });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear la tarea' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthedUser(request);
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    if (!canManageCronograma((user as any).role)) return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const body = await request.json();
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    const fields = ['producto_id', 'producto_nombre', 'fecha_programada', 'area', 'responsable', 'estado', 'descripcion'];
    for (const field of fields) {
      if (body[field] !== undefined) {
        paramCount++;
        updates.push(`${field} = $${paramCount}`);
        values.push(body[field]);
      }
    }

    if (updates.length === 0) return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });

    paramCount++;
    updates.push(`actualizado_por = $${paramCount}`);
    values.push((user as any).email || null);
    values.push(id);

    const query = `UPDATE lab_microbiologia.cronograma_pt_externo SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthedUser(request);
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    if (!canManageCronograma((user as any).role)) return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const result = await pool.query('DELETE FROM lab_microbiologia.cronograma_pt_externo WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });

    return NextResponse.json({ message: 'Tarea eliminada' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
