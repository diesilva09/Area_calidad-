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
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      console.log('🔍 [API Categories] Intentando obtener categorías...');
      console.log('🔍 [API Categories] Configuración DB:', {
        DB_HOST: process.env.DB_HOST || 'localhost',
        DB_PORT: process.env.DB_PORT || '5432',
        DB_NAME: process.env.DB_NAME || 'calidad_coruna',
        DB_USER: process.env.DB_USER || 'postgres',
        DB_PASSWORD: process.env.DB_PASSWORD ? '***CONFIGURADA***' : 'NO CONFIGURADA',
        NODE_ENV: process.env.NODE_ENV || 'no definido',
      });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'produccion' | 'embalaje' | null;

    if (isDev) {
      console.log('🔍 [API Categories] Filtro de tipo:', type);
    }

    let categories;
    if (type) {
      // Por ahora, ignorar el filtro y devolver todas las categorías
      categories = await serverGetCategories();
    } else {
      categories = await serverGetCategories();
    }

    if (isDev) {
      console.log('✅ [API Categories] Categorías obtenidas:', categories.length, 'categorías');
      if (categories.length > 0) {
        console.log('📦 [API Categories] Primera categoría:', categories[0]);
      }
    }

    return NextResponse.json(categories);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ [API Categories] Error al obtener categorías:', error);
      console.error('❌ [API Categories] Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    }
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

    if (process.env.NODE_ENV !== 'production') {
      console.log('Categoría creada:', category);
    }
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al crear categoría:', error);
    }
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
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al actualizar categoría:', error);
    }
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

    if (process.env.NODE_ENV !== 'production') {
      console.log('Intentando eliminar categoría con ID:', id);
    }

    if (!id) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Error: ID no proporcionado');
      }
      return NextResponse.json(
        { error: 'ID es requerido' },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('Llamando a deleteCategory con ID:', id);
    }
    const success = await serverDeleteCategory(id);
    if (process.env.NODE_ENV !== 'production') {
      console.log('Resultado de deleteCategory:', success);
    }
    
    if (!success) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Error: Categoría no encontrada o no se pudo eliminar');
      }
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('Categoría eliminada exitosamente');
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al eliminar categoría:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    }
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
