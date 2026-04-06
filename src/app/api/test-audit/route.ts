import { NextRequest, NextResponse } from 'next/server';
import AuditService from '@/lib/audit-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableName, recordId, userName, userEmail } = body;
    
    // Simular un cambio para probar auditoría
    await AuditService.logChanges(
      tableName,
      recordId,
      { campo_viejo: 'valor anterior' },
      { campo_nuevo: 'valor nuevo' },
      userName,
      userEmail,
      'UPDATE'
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en test-audit:', error);
    return NextResponse.json(
      { error: 'Error al probar auditoría', details: error.message },
      { status: 500 }
    );
  }
}
