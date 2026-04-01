import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  void request;
  return NextResponse.json(
    { error: 'Endpoint de verificaciones de limpieza deshabilitado' },
    { status: 410 }
  );
}

export async function POST(request: NextRequest) {
  void request;
  return NextResponse.json(
    { error: 'Endpoint de verificaciones de limpieza deshabilitado' },
    { status: 410 }
  );
}

export async function PUT(request: NextRequest) {
  void request;
  return NextResponse.json(
    { error: 'Endpoint de verificaciones de limpieza deshabilitado' },
    { status: 410 }
  );
}
