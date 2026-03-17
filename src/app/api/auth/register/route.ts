import { NextRequest, NextResponse } from 'next/server';
import { authService, type RegisterRequest } from '@/lib/auth-service';

export async function POST(request: NextRequest) {
  try {
    // REGISTRO PÚBLICO DESHABILITADO
    // Solo se pueden registrar usuarios directamente en la base de datos SQL
    
    return NextResponse.json(
      { error: 'El registro público está deshabilitado. Contacte al administrador del sistema.' },
      { status: 403 }
    );

  } catch (error) {
    console.error('Error en register API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
