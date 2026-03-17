import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tamanoLoteParam = searchParams.get('tamanoLote');

    const equipoIdNum = parseInt(id);
    if (isNaN(equipoIdNum)) {
      return NextResponse.json(
        { error: 'id inválido' },
        { status: 400 }
      );
    }

    const tamanoLote = parseInt(tamanoLoteParam || '');
    if (!tamanoLoteParam || isNaN(tamanoLote) || tamanoLote <= 0) {
      return NextResponse.json(
        { error: 'tamanoLote inválido' },
        { status: 400 }
      );
    }

    const result = await db.query(
      `
      SELECT nivel, unidades_revisar
      FROM equipo_sampling_rules
      WHERE equipo_id = $1
        AND is_active = true
        AND $2 BETWEEN lote_min AND lote_max
      ORDER BY (lote_max - lote_min) ASC
      LIMIT 1
      `,
      [equipoIdNum, tamanoLote]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No existe regla de muestreo para este equipo y tamaño de lote' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error en endpoint de sampling-rule:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error?.message },
      { status: 500 }
    );
  }
}
