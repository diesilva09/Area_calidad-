import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await pool.query(
      `UPDATE production_records
         SET last_opened_at = NOW()
       WHERE id = $1 AND is_active = true AND status = 'pending'`,
      [id]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error actualizando last_opened_at:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
