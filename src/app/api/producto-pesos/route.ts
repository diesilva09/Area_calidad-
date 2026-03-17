import { NextRequest, NextResponse } from 'next/server';
import { getProductById, updateProduct } from '@/lib/server-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productoId = searchParams.get('productoId');
    const categoriaId = searchParams.get('categoriaId'); 
    const envaseTipo = searchParams.get('envaseTipo');
    const debug = searchParams.get('debug'); // NUEVO: modo debug
    
    console.log('⚖️ Buscando pesos:', { productoId, categoriaId, envaseTipo, debug });
    
    if (!productoId) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: productoId' },
        { status: 400 }
      );
    }

    const product = await getProductById(productoId);
    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    const pesosConfig = Array.isArray(product.pesos_config) ? product.pesos_config : [];

    // MODO DEBUG: Devolver TODOS los registros del producto
    if (debug === 'true') {
      console.log('⚖️ DEBUG: Todos los registros del producto:', pesosConfig);
      return NextResponse.json(pesosConfig);
    }
    
    // Si solo se busca por producto_id sin envase_tipo, devolver todos los registros del producto
    if (!envaseTipo) {
      return NextResponse.json(pesosConfig);
    }

    const match = pesosConfig.find((c: any) => {
      const envaseMatch = String(c.envase_tipo || '').toLowerCase() === String(envaseTipo).toLowerCase();
      if (!envaseMatch) return false;
      if (!categoriaId) return true;
      return String(c.categoria_id || '') === String(categoriaId);
    });

    if (!match) {
      return NextResponse.json(
        { error: 'No se encontró configuración de pesos para este producto y envase' },
        { status: 404 }
      );
    }

    return NextResponse.json(match);
    
  } catch (error: any) {
    console.error('⚖️ Error en API de pesos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Crear configuración de pesos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { producto_id, categoria_id, envase_tipo, peso_drenado_declarado, peso_drenado_min, peso_drenado_max, peso_neto_declarado } = body;

    console.log('⚖️ Creando configuración de pesos:', { producto_id, categoria_id, envase_tipo, peso_drenado_declarado, peso_drenado_min, peso_drenado_max, peso_neto_declarado });

    // Validaciones
    if (!producto_id || !envase_tipo || peso_drenado_declarado === undefined || peso_drenado_min === undefined || peso_drenado_max === undefined || peso_neto_declarado === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validar que los pesos sean números válidos
    const pesos = [peso_drenado_declarado, peso_drenado_min, peso_drenado_max, peso_neto_declarado];
    for (const peso of pesos) {
      if (isNaN(peso) || peso < 0) {
        return NextResponse.json(
          { error: 'Los pesos deben ser números válidos y mayores o iguales a 0' },
          { status: 400 }
        );
      }
    }

    // Validar que el mínimo sea menor o igual al declarado y este sea menor o igual al máximo
    if (peso_drenado_min > peso_drenado_declarado || peso_drenado_declarado > peso_drenado_max) {
      return NextResponse.json(
        { error: 'El peso drenado mínimo debe ser <= al declarado y este debe ser <= al máximo' },
        { status: 400 }
      );
    }

    const product = await getProductById(producto_id);
    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    const current = Array.isArray(product.pesos_config) ? product.pesos_config : [];
    const duplicate = current.some((c: any) => {
      const envaseMatch = String(c.envase_tipo || '').toLowerCase() === String(envase_tipo).toLowerCase();
      const categoriaMatch = String(c.categoria_id || '') === String(categoria_id || '');
      return envaseMatch && categoriaMatch;
    });

    if (duplicate) {
      return NextResponse.json(
        { error: 'Ya existe una configuración para este producto y tipo de envase' },
        { status: 409 }
      );
    }

    const newConfig = {
      envase_tipo,
      peso_drenado_declarado,
      peso_drenado_min,
      peso_drenado_max,
      peso_neto_declarado,
      ...(categoria_id ? { categoria_id } : {}),
    };

    const updated = await updateProduct(producto_id, { pesos_config: [...current, newConfig] });
    if (!updated) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(newConfig, { status: 201 });
  } catch (error: any) {
    console.error('⚖️ Error al crear configuración de pesos:', error);
    
    // Manejar error de constraint única
    if (error.message?.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Ya existe una configuración para este producto y tipo de envase' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al crear configuración de pesos', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración de pesos
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, producto_id, categoria_id, envase_tipo, peso_drenado_declarado, peso_drenado_min, peso_drenado_max, peso_neto_declarado } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de configuración requerido' },
        { status: 400 }
      );
    }

    // Validaciones
    if (!producto_id || !envase_tipo || peso_drenado_declarado === undefined || peso_drenado_min === undefined || peso_drenado_max === undefined || peso_neto_declarado === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validar que los pesos sean números válidos
    const pesos = [peso_drenado_declarado, peso_drenado_min, peso_drenado_max, peso_neto_declarado];
    for (const peso of pesos) {
      if (isNaN(peso) || peso < 0) {
        return NextResponse.json(
          { error: 'Los pesos deben ser números válidos y mayores o iguales a 0' },
          { status: 400 }
        );
      }
    }

    // Validar que el mínimo sea menor o igual al declarado y este sea menor o igual al máximo
    if (peso_drenado_min > peso_drenado_declarado || peso_drenado_declarado > peso_drenado_max) {
      return NextResponse.json(
        { error: 'El peso drenado mínimo debe ser <= al declarado y este debe ser <= al máximo' },
        { status: 400 }
      );
    }

    const product = await getProductById(producto_id);
    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    const current = Array.isArray(product.pesos_config) ? product.pesos_config : [];
    const index = current.findIndex((c: any, i: number) => String(i) === String(id));
    if (index === -1) {
      return NextResponse.json(
        { error: 'Configuración de pesos no encontrada' },
        { status: 404 }
      );
    }

    const updatedConfig = {
      envase_tipo,
      peso_drenado_declarado,
      peso_drenado_min,
      peso_drenado_max,
      peso_neto_declarado,
      ...(categoria_id ? { categoria_id } : {}),
    };

    const next = [...current];
    next[index] = updatedConfig;

    const updatedProduct = await updateProduct(producto_id, { pesos_config: next });
    if (!updatedProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedConfig);
  } catch (error: any) {
    console.error('⚖️ Error al actualizar configuración de pesos:', error);
    
    // Manejar error de constraint única
    if (error.message?.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Ya existe una configuración para este producto y tipo de envase' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al actualizar configuración de pesos', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar configuración de pesos
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const productoId = searchParams.get('productoId');

    if (!productoId) {
      return NextResponse.json(
        { error: 'Se requiere ID de producto (productoId)' },
        { status: 400 }
      );
    }

    const product = await getProductById(productoId);
    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    const current = Array.isArray(product.pesos_config) ? product.pesos_config : [];

    if (id) {
      const index = current.findIndex((c: any, i: number) => String(i) === String(id));
      if (index === -1) {
        return NextResponse.json(
          { error: 'Configuración de pesos no encontrada' },
          { status: 404 }
        );
      }

      const next = current.filter((_: any, i: number) => i !== index);
      await updateProduct(productoId, { pesos_config: next });
      return NextResponse.json({ message: 'Configuración de pesos eliminada exitosamente' });
    }

    await updateProduct(productoId, { pesos_config: [] });
    return NextResponse.json({ message: `Se eliminaron ${current.length} configuraciones de pesos del producto ${productoId}` });
  } catch (error: any) {
    console.error('⚖️ Error al eliminar configuración de pesos:', error);
    return NextResponse.json(
      { error: 'Error al eliminar configuración de pesos', details: error.message },
      { status: 500 }
    );
  }
}
