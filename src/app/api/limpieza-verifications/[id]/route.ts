import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  void request;
  void params;
  return NextResponse.json(
    { error: 'Endpoint de verificaciones de limpieza deshabilitado' },
    { status: 410 }
  );
}
