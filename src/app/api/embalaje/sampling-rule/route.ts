import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tamanoLoteParam = searchParams.get('tamanoLote');

    const tamanoLote = parseInt(tamanoLoteParam || '');
    if (!tamanoLoteParam || isNaN(tamanoLote) || tamanoLote <= 0) {
      return NextResponse.json({ error: 'tamanoLote inválido' }, { status: 400 });
    }

    const result = await db.query(
      `
      SELECT nivel, cajas_revisar
      FROM embalaje_sampling_rules
      WHERE is_active = true
        AND $1 BETWEEN lote_min AND lote_max
      ORDER BY (lote_max - lote_min) ASC
      LIMIT 1
      `,
      [tamanoLote]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No existe regla de muestreo para este tamaño de lote' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error en endpoint de sampling-rule de embalaje:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error?.message },
      { status: 500 }
    );
  }
}
