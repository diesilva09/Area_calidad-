import { NextRequest, NextResponse } from 'next/server';
import { getProductById, updateProduct } from '@/lib/server-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const productoId = searchParams.get('productoId');
    const envaseTipo = searchParams.get('envaseTipo');
    
    console.log('🌡️ API llamada:', { action, productoId, envaseTipo });

    if (!productoId) {
      return NextResponse.json(
        { error: 'ID de producto requerido' },
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

    const temperaturas = Array.isArray(product.temperaturas_config) ? product.temperaturas_config : [];

    // Endpoint: /api/temperatura-envasado?action=existe&productoId=000234
    if (action === 'existe') {
      const existe = temperaturas.length > 0;
      return NextResponse.json({ existe });
    }

    // Endpoint: /api/temperatura-envasado?action=rango&productoId=000234&envaseTipo=Vidrio
    if (action === 'rango') {
      if (!envaseTipo) {
        return NextResponse.json(
          { error: 'Tipo de envase requerido' },
          { status: 400 }
        );
      }

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
    }

    // Endpoint: /api/temperatura-envasado?action=envases&productoId=000234
    if (action === 'envases') {
      const envases = temperaturas
        .map((c: any) => c?.envase_tipo)
        .filter((v: any) => typeof v === 'string' && v.trim().length > 0);
      return NextResponse.json({ envases });
    }

    // Endpoint: /api/temperatura-envasado (obtener todos del producto)
    return NextResponse.json(temperaturas);

  } catch (error) {
    console.error('Error en API de temperaturas de envasado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { producto_id, envase_tipo, temperatura_min, temperatura_max } = body;

    if (!producto_id || !envase_tipo || temperatura_min === undefined || temperatura_max === undefined) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validar que temperatura_min sea menor que temperatura_max
    if (parseFloat(temperatura_min) >= parseFloat(temperatura_max)) {
      return NextResponse.json(
        { error: 'La temperatura mínima debe ser menor que la temperatura máxima' },
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

    const current = Array.isArray(product.temperaturas_config) ? product.temperaturas_config : [];
    const duplicate = current.some((c: any) =>
      String(c.envase_tipo || '').toLowerCase() === String(envase_tipo).toLowerCase()
    );

    if (duplicate) {
      return NextResponse.json(
        { error: 'Ya existe una configuración para este producto y envase' },
        { status: 409 }
      );
    }

    const newConfig = {
      envase_tipo,
      temperatura_min: parseFloat(temperatura_min),
      temperatura_max: parseFloat(temperatura_max),
    };

    await updateProduct(producto_id, { temperaturas_config: [...current, newConfig] });
    return NextResponse.json(newConfig, { status: 201 });

  } catch (error: any) {
    console.error('Error al crear temperatura de envasado:', error);
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
