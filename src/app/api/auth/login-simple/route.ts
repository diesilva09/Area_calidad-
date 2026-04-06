import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Login Simple API: Recibida solicitud');
    
    const body = await request.json();
    console.log('📋 Login Simple API: Body recibido:', { email: body.email });
    
    // Respuesta simple para pruebas
    return NextResponse.json({
      message: 'Login simple working',
      email: body.email
    });
  } catch (error) {
    console.error('❌ Error en login simple API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
