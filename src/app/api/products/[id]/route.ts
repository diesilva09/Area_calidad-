import { NextRequest, NextResponse } from 'next/server';
import { getProductById, updateProduct } from '@/lib/server-db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id') || undefined;

    const product = await getProductById(id, categoryId);
    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const name = body.name;
    const category_id = body.category_id ?? body.categoryId;
    const description = body.description;

    const pesos_config = body.pesos_config ?? body.pesosConfig;
    const temperaturas_config = body.temperaturas_config ?? body.temperaturasConfig;
    const calidad_rangos_config = body.calidad_rangos_config ?? body.calidadRangosConfig;

    const oldCategoryId = body.oldCategoryId ?? body.old_category_id;

    const updated = await updateProduct(
      id,
      {
        ...(name !== undefined ? { name } : {}),
        ...(category_id !== undefined ? { category_id } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(pesos_config !== undefined ? { pesos_config } : {}),
        ...(temperaturas_config !== undefined ? { temperaturas_config } : {}),
        ...(calidad_rangos_config !== undefined ? { calidad_rangos_config } : {}),
      },
      oldCategoryId
    );

    if (!updated) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Producto actualizado exitosamente' 
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
