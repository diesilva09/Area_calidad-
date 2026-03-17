import { NextRequest, NextResponse } from 'next/server';
import { serverGetCategories } from '@/lib/server-actions';

export async function POST(request: NextRequest) {
  try {
    const { code, excludeId } = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { error: 'Código es requerido' },
        { status: 400 }
      );
    }

    const categories = await serverGetCategories();
    
    // Check if code exists (excluding the current ID if editing)
    const exists = categories.some((category: any) => 
      category.id === code && category.id !== excludeId
    );

    return NextResponse.json({ exists });
  } catch (error) {
    console.error('Error al verificar código de categoría:', error);
    return NextResponse.json(
      { error: 'Error al verificar código de categoría' },
      { status: 500 }
    );
  }
}
