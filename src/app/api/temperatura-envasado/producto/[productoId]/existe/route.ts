import { NextRequest, NextResponse } from 'next/server';
import { getProductById } from '@/lib/server-db';

export async function GET(
  request: NextRequest,
  { params }: { params: { productoId: string } }
) {
  try {
    const { productoId } = params;
    
    console.log('🌡️ Verificando producto:', productoId);
    
    if (!productoId) {
      return NextResponse.json({ error: 'ID de producto requerido' }, { status: 400 });
    }

    const product = await getProductById(productoId);
    if (!product) {
      return NextResponse.json({ existe: false });
    }

    const temperaturas = Array.isArray(product.temperaturas_config) ? product.temperaturas_config : [];
    const existe = temperaturas.length > 0;
    
    console.log('🌡️ Producto existe:', existe);
    
    return NextResponse.json({ existe });

  } catch (error) {
    console.error('Error verificando producto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
