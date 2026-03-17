import { NextRequest, NextResponse } from 'next/server';
import { getProductById } from '@/lib/server-db';

export async function GET(
  request: NextRequest,
  { params }: { params: { productoId: string; envaseTipo: string } }
) {
  try {
    const { productoId, envaseTipo } = params;
    
    console.log('🌡️ Buscando rango:', productoId, envaseTipo);
    
    if (!productoId || !envaseTipo) {
      return NextResponse.json({ error: 'ID de producto y tipo de envase requeridos' }, { status: 400 });
    }

    const product = await getProductById(productoId);
    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    const temperaturas = Array.isArray(product.temperaturas_config) ? product.temperaturas_config : [];
    const match = temperaturas.find((c: any) =>
      String(c.envase_tipo || '').toLowerCase() === String(envaseTipo).toLowerCase()
    );

    if (!match) {
      return NextResponse.json(
        { error: 'No se encontró configuración para este producto y envase' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      temperatura_min: match.temperatura_min,
      temperatura_max: match.temperatura_max,
    });

  } catch (error) {
    console.error('Error obteniendo rango de temperatura:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
