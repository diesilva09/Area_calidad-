import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authService } from '@/lib/auth-service';

async function getAuthedUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  return authService.validateSession(token);
}

function canManageCronograma(role: unknown): boolean {
  const r = String(role ?? '').toLowerCase();
  return r === 'jefe' || r === 'supervisor' || r === 'operario';
}

// GET - Obtener una tarea específica por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const result = await pool.query(
      'SELECT * FROM lab_microbiologia.microbiologia_cronograma WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(`Error al obtener tarea ${(await params).id}:`, error);
    return NextResponse.json(
      { error: 'Error al obtener la tarea del cronograma' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar tarea completa
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (!canManageCronograma((user as any).role)) {
      return NextResponse.json({ error: 'No tienes permisos para actualizar tareas' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      start_date,
      end_date,
      tipo,
      tipo_personalizado,
      area,
      area_personalizada,
      frecuencia,
      responsable,
      descripcion,
      status,
      all_day,
      marcaManual,
    } = body;

    // Construir query dinámicamente para manejar marca_manual
    let marcaManualClause = '';
    let marcaManualValue = null;
    const baseParamCount = 13; // 12 campos + 1 para id
    let paramIndex = baseParamCount; // 13 -> WHERE id = $13

    if ('marcaManual' in body) {
      marcaManualClause = `, marca_manual = $${baseParamCount}::varchar`;
      marcaManualValue = marcaManual; // puede ser null, 'externo', o 'alergenos'
      paramIndex = baseParamCount + 1; // 14 -> WHERE id = $14
    }

    const result = await pool.query(
      `UPDATE lab_microbiologia.microbiologia_cronograma SET
        title = COALESCE($1, title),
        start_date = COALESCE($2, start_date),
        end_date = COALESCE($3, end_date),
        tipo = COALESCE($4, tipo),
        tipo_personalizado = COALESCE($5, tipo_personalizado),
        area = COALESCE($6, area),
        area_personalizada = COALESCE($7, area_personalizada),
        frecuencia = COALESCE($8, frecuencia),
        responsable = COALESCE($9, responsable),
        descripcion = COALESCE($10, descripcion),
        status = COALESCE($11, status),
        all_day = COALESCE($12, all_day)${marcaManualClause}
      WHERE id = $${paramIndex}
      RETURNING *`,
      [
        title,
        start_date,
        end_date,
        tipo,
        tipo_personalizado,
        area,
        area_personalizada,
        frecuencia,
        responsable,
        descripcion,
        status,
        all_day,
        ...(marcaManualClause ? [marcaManualValue] : []),
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(`Error al actualizar tarea ${(await params).id}:`, error);
    return NextResponse.json(
      { error: 'Error al actualizar la tarea del cronograma' },
      { status: 500 }
    );
  }
}

// PATCH - Toggle status (cambiar entre pending y completed)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (!canManageCronograma((user as any).role)) {
      return NextResponse.json({ error: 'No tienes permisos para actualizar tareas' }, { status: 403 });
    }

    const { id } = await params;
    
    // Obtener tarea actual
    const currentTask = await pool.query(
      'SELECT status FROM lab_microbiologia.microbiologia_cronograma WHERE id = $1',
      [id]
    );

    if (currentTask.rows.length === 0) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    // Toggle entre pending y completed
    const newStatus = currentTask.rows[0].status === 'completed' ? 'pending' : 'completed';

    const result = await pool.query(
      'UPDATE lab_microbiologia.microbiologia_cronograma SET status = $1 WHERE id = $2 RETURNING *',
      [newStatus, id]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(`Error al cambiar estado de tarea ${(await params).id}:`, error);
    return NextResponse.json(
      { error: 'Error al cambiar el estado de la tarea' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar tarea
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (!canManageCronograma((user as any).role)) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar tareas' }, { status: 403 });
    }

    const { id } = await params;

    const result = await pool.query(
      'DELETE FROM lab_microbiologia.microbiologia_cronograma WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Tarea eliminada correctamente' });
  } catch (error) {
    console.error(`Error al eliminar tarea ${(await params).id}:`, error);
    return NextResponse.json(
      { error: 'Error al eliminar la tarea del cronograma' },
      { status: 500 }
    );
  }
}
