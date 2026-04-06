import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Test API: Recibida solicitud');
    
    const body = await request.json();
    console.log('📋 Test API: Body recibido:', body);
    
    return NextResponse.json({
      message: 'Test API working',
      received: body
    });
  } catch (error) {
    console.error('❌ Error en test API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
