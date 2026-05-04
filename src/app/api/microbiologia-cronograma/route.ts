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

// GET - Obtener tareas del cronograma
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = 'SELECT * FROM lab_microbiologia.microbiologia_cronograma';
    const params: any[] = [];

    if (date) {
      query += ' WHERE start_date = $1';
      params.push(date);
    } else if (startDate && endDate) {
      query += ' WHERE start_date >= $1 AND start_date <= $2';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY start_date DESC, created_at DESC';

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener tareas del cronograma:', error);
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
    } = body;

    // Validar campos obligatorios
    if (!title || !start_date || !tipo || !area) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: title, start_date, tipo, area' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO lab_microbiologia.microbiologia_cronograma (
        title, start_date, end_date, tipo, tipo_personalizado,
        area, area_personalizada, frecuencia, responsable,
        descripcion, status, all_day, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        title,
        start_date,
        end_date || start_date,
        tipo,
        tipo_personalizado || null,
        area,
        area_personalizada || null,
        frecuencia || 'Diaria',
        responsable || null,
        descripcion || null,
        status || 'pending',
        all_day !== undefined ? all_day : true,
        (user as any).email || (user as any).id || null,
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error al crear tarea del cronograma:', error);
    return NextResponse.json(
      { error: 'Error al crear la tarea del cronograma' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar tarea (se usa con ID en query param)
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

    // Construir query dinámica
    const fields = [
      'title', 'start_date', 'end_date', 'tipo', 'tipo_personalizado',
      'area', 'area_personalizada', 'frecuencia', 'responsable',
      'descripcion', 'status', 'all_day'
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

    paramCount++;
    values.push(id);

    const result = await pool.query(
      `UPDATE lab_microbiologia.microbiologia_cronograma SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar tarea del cronograma:', error);
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
      'DELETE FROM lab_microbiologia.microbiologia_cronograma WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Tarea eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar tarea del cronograma:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la tarea del cronograma' },
      { status: 500 }
    );
  }
}
