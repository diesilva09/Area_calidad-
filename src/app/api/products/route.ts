import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth-service';
import { 
  getProducts, 
  getProductsByCategory,
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '@/lib/server-db';
import db from '@/lib/server-db';

async function getAuthedUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  return authService.validateSession(token);
}

function canManageCatalog(role: unknown): boolean {
  const r = String(role ?? '').toLowerCase();
  return r === 'jefe' || r === 'supervisor' || r === 'operario';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');
    
    let products;
    if (categoryId) {
      products = await getProductsByCategory(categoryId);
    } else {
      products = await getProducts();
    }
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (!canManageCatalog((user as any).role)) {
      return NextResponse.json({ error: 'No tienes permisos para crear productos' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, category_id, description } = body;

    const pesosConfig = body.pesosConfig ?? body.pesos_config;
    const temperaturasConfig = body.temperaturasConfig ?? body.temperaturas_config;
    const calidadRangosConfig = body.calidadRangosConfig ?? body.calidad_rangos_config;

    if (!id || !name || !category_id) {
      return NextResponse.json(
        { error: 'ID, nombre y categoría son requeridos' },
        { status: 400 }
      );
    }

    // Crear producto básico con configuración JSONB
    const product = await createProduct({ 
      id, 
      name, 
      category_id, 
      description,
      pesos_config: pesosConfig || [],
      temperaturas_config: temperaturasConfig || [],
      calidad_rangos_config: calidadRangosConfig || []
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error al crear producto:', error);
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (!canManageCatalog((user as any).role)) {
      return NextResponse.json({ error: 'No tienes permisos para editar productos' }, { status: 403 });
    }

    const body = await request.json();
    const { id, oldCategoryId, ...updateData } = body;

    const pesosConfig = body.pesosConfig ?? body.pesos_config;
    const temperaturasConfig = body.temperaturasConfig ?? body.temperaturas_config;
    const calidadRangosConfig = body.calidadRangosConfig ?? body.calidad_rangos_config;

    if (!id) {
      return NextResponse.json(
        { error: 'ID es requerido' },
        { status: 400 }
      );
    }

    // Incluir configuración en los datos de actualización
    const updateDataWithConfig = {
      ...updateData,
      ...(pesosConfig !== undefined ? { pesos_config: pesosConfig } : {}),
      ...(temperaturasConfig !== undefined ? { temperaturas_config: temperaturasConfig } : {}),
      ...(calidadRangosConfig !== undefined ? { calidad_rangos_config: calidadRangosConfig } : {}),
    };

    // Actualizar producto con toda la configuración
    const product = await updateProduct(id, updateDataWithConfig, oldCategoryId);
    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return NextResponse.json(
      { error: 'Error al actualizar producto' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (!canManageCatalog((user as any).role)) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar productos' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const categoryId = searchParams.get('categoryId');

    if (!id) {
      return NextResponse.json(
        { error: 'ID es requerido' },
        { status: 400 }
      );
    }

    const success = await deleteProduct(id, categoryId || undefined);
    if (!success) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return NextResponse.json(
      { error: 'Error al eliminar producto' },
      { status: 500 }
    );
  }
}
