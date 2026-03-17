import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug Login: Iniciando debug...');
    
    // Intentar leer el body
    let body;
    try {
      body = await request.json();
      console.log('📋 Debug Login: Body parseado exitosamente:', body);
    } catch (parseError) {
      console.error('❌ Debug Login: Error parseando body:', parseError);
      return NextResponse.json({
        error: 'Error parseando JSON',
        details: parseError instanceof Error ? parseError.message : 'Error desconocido'
      }, { status: 400 });
    }

    // Validar que tenga los campos requeridos
    if (!body || typeof body !== 'object') {
      console.log('❌ Debug Login: Body no es un objeto válido');
      return NextResponse.json({
        error: 'Body inválido',
        received: body
      }, { status: 400 });
    }

    if (!body.email) {
      console.log('❌ Debug Login: Email faltante');
      return NextResponse.json({
        error: 'Email es requerido',
        received: body
      }, { status: 400 });
    }

    if (!body.password) {
      console.log('❌ Debug Login: Password faltante');
      return NextResponse.json({
        error: 'Password es requerido',
        received: body
      }, { status: 400 });
    }

    console.log('✅ Debug Login: Validación exitosa');
    console.log('📧 Debug Login: Email:', body.email);
    console.log('🔑 Debug Login: Password length:', body.password.length);

    return NextResponse.json({
      success: true,
      message: 'Debug login exitoso',
      received: {
        email: body.email,
        passwordLength: body.password.length,
        hasPassword: !!body.password
      }
    });

  } catch (error) {
    console.error('❌ Debug Login: Error general:', error);
    return NextResponse.json({
      error: 'Error interno del debug',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
