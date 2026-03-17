import { NextRequest, NextResponse } from 'next/server';
import { equiposService } from '@/lib/equipos-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area');
    
    if (!area) {
      // Si no se especifica área, devolver todos los equipos
      const equipos = await equiposService.getAll();
      return NextResponse.json(equipos);
    }
    
    // Mapear el área del formulario a la base de datos
    const areaMap: { [key: string]: string } = {
      'salsas': 'Salsas',
      'conservas': 'Conservas'
    };
    
    const areaDb = areaMap[area.toLowerCase()] || area;
    
    // Filtrar equipos por área
    const equipos = await equiposService.getAll();
    const equiposFiltrados = equipos.filter(equipo => 
      equipo.area === areaDb
    );
    
    return NextResponse.json(equiposFiltrados);
  } catch (error) {
    console.error('Error al obtener equipos por área:', error);
    return NextResponse.json(
      { error: 'No se pudieron obtener los equipos' },
      { status: 500 }
    );
  }
}
