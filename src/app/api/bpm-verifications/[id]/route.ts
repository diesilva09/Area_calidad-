import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const result = await pool.query(
      'DELETE FROM verificacion_bpm.bpm_verifications WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Verificación BPM no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    console.error('Error al eliminar verificación BPM:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la verificación BPM' },
      { status: 500 }
    );
  }
}
