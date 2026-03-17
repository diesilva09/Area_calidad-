// Configuración de áreas y equipos - Ahora conectado a la base de datos
export interface EquipoConfig {
  id: string;
  nombre: string;
}

export interface AreaConfig {
  id: string;
  nombre: string;
}

// Áreas fijas (definidas por el negocio)
export const AREAS_FIJAS: AreaConfig[] = [
  {
    id: 'salsas',
    nombre: 'Salsas'
  },
  {
    id: 'conservas', 
    nombre: 'Conservas'
  }
];

export class AreasEquiposService {
  // Obtener todas las áreas (fijas)
  static getTodasAreas(): AreaConfig[] {
    return AREAS_FIJAS;
  }

  // Obtener equipos por área desde la base de datos
  static async getEquiposPorArea(areaId: string): Promise<EquipoConfig[]> {
    try {
      const response = await fetch(`/api/equipos/area?area=${areaId}`);
      if (!response.ok) {
        throw new Error('Error al cargar equipos');
      }
      const equipos = await response.json();
      
      // Convertir al formato esperado por el componente (solo nombre)
      return equipos.map((equipo: any) => ({
        id: equipo.id.toString(),
        nombre: equipo.nombre
      }));
    } catch (error) {
      console.error('Error al cargar equipos por área:', error);
      // Retornar equipos vacíos en caso de error
      return [];
    }
  }

  // Obtener área por ID
  static getAreaPorId(areaId: string): AreaConfig | undefined {
    return AREAS_FIJAS.find(a => a.id === areaId);
  }

  // Obtener equipo por ID (opcional, si se necesita)
  static async getEquipoPorId(equipoId: string): Promise<EquipoConfig | undefined> {
    try {
      const response = await fetch(`/api/equipos/${equipoId}`);
      if (!response.ok) {
        return undefined;
      }
      const equipo = await response.json();
      
      return {
        id: equipo.id.toString(),
        nombre: equipo.nombre
      };
    } catch (error) {
      console.error('Error al obtener equipo por ID:', error);
      return undefined;
    }
  }
}
