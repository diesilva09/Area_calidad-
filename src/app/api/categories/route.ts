import { NextRequest, NextResponse } from 'next/server';
import {
  serverGetCategories,
  serverGetCategoryById,
  serverCreateCategory,
  serverUpdateCategory,
  serverDeleteCategory
} from '@/lib/server-actions';

export async function GET(request: NextRequest) {
  try {
    console.log('Intentando obtener categorías...');
    console.log('Configuración DB:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      database: process.env.DB_NAME || 'calidad_coruna',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD ? '***CONFIGURADO***' : 'NO CONFIGURADO'
    });
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'produccion' | 'embalaje' | null;
    
    console.log('Filtro de tipo:', type);
    
    let categories;
    if (type) {
      // Por ahora, ignorar el filtro y devolver todas las categorías
      categories = await serverGetCategories();
    } else {
      categories = await serverGetCategories();
    }
    
    console.log('Categorías obtenidas:', categories.length, 'categorías');
    console.log('Primera categoría:', categories[0]);
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    return NextResponse.json(
      { 
        error: 'Error al obtener categorías',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace available'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID y nombre son requeridos' },
        { status: 400 }
      );
    }

    const category = await serverCreateCategory({
      id,
      name,
      description
    });

    console.log('Categoría creada:', category);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    return NextResponse.json(
      { error: 'Error al crear categoría' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID es requerido' },
        { status: 400 }
      );
    }

    const category = await serverUpdateCategory(id, updateData);
    if (!category) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    return NextResponse.json(
      { error: 'Error al actualizar categoría' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    console.log('Intentando eliminar categoría con ID:', id);

    if (!id) {
      console.log('Error: ID no proporcionado');
      return NextResponse.json(
        { error: 'ID es requerido' },
        { status: 400 }
      );
    }

    console.log('Llamando a deleteCategory con ID:', id);
    const success = await serverDeleteCategory(id);
    console.log('Resultado de deleteCategory:', success);
    
    if (!success) {
      console.log('Error: Categoría no encontrada o no se pudo eliminar');
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    console.log('Categoría eliminada exitosamente');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    return NextResponse.json(
      { 
        error: 'Error al eliminar categoría',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace available'
      },
      { status: 500 }
    );
  }
}
