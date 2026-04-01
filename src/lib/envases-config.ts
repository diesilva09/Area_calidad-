// Configuración fija de envases y vencimientos
// Más simple que una tabla para casos donde todos los productos comparten los mismos envases

export interface EnvaseConfig {
  id: string;
  tipo: string;
  mesesVencimiento: number;
}

export const ENVASES_CONFIG: EnvaseConfig[] = [
  { id: 'Bolsa_12', tipo: 'Bolsa', mesesVencimiento: 12 },
  { id: 'Lata_24', tipo: 'Lata', mesesVencimiento: 24 },
  { id: 'Vidrio_36', tipo: 'Vidrio', mesesVencimiento: 36 },
  { id: 'Vidrio_18', tipo: 'Vidrio', mesesVencimiento: 18 },
  { id: 'PET_36', tipo: 'PET', mesesVencimiento: 36 },
  { id: 'Vidrio_10', tipo: 'Vidrio', mesesVencimiento: 10 },
  { id: 'Galon_10', tipo: 'Galon', mesesVencimiento: 10 },
  { id: 'Doypack_10', tipo: 'Doypack', mesesVencimiento: 10 },
  { id: 'Doypack_12', tipo: 'Doypack', mesesVencimiento: 12 },
  { id: 'PET_24', tipo: 'PET', mesesVencimiento: 24 },
  { id: 'Doypack_18', tipo: 'Doypack', mesesVencimiento: 18 },
  { id: 'Galon_12', tipo: 'Galon', mesesVencimiento: 12 },
  { id: 'Galon_PET_12', tipo: 'Galon PET', mesesVencimiento: 12 },
  { id: 'Vidrio_24', tipo: 'Vidrio', mesesVencimiento: 24 },
  { id: 'PET_18', tipo: 'PET', mesesVencimiento: 18 },
  { id: 'Bolsa_18', tipo: 'Bolsa', mesesVencimiento: 18 },
];

export class EnvasesService {
  // Obtener todos los envases (sin dependencia de producto)
  static getTodosEnvases(): EnvaseConfig[] {
    return ENVASES_CONFIG;
  }

  static parseLocalISODate(dateStr: string): Date {
    const m = String(dateStr || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return new Date(dateStr);
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    return new Date(year, month - 1, day);
  }

  // Calcular fecha de vencimiento
  static calcularFechaVencimiento(fechaProduccion: string, meses: number): string {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔍 Calculando fecha vencimiento:', { fechaProduccion, meses });
      }
      
      let fechaCompleta: Date;
      
      // Detectar formato de entrada
      if (fechaProduccion.includes('-')) {
        // Formato YYYY-MM-DD (del DateInput)
        fechaCompleta = EnvasesService.parseLocalISODate(fechaProduccion);
      } else if (fechaProduccion.includes('/')) {
        // Formato DD/MM/AA o DD/MM/YYYY
        const partes = fechaProduccion.split('/');
        if (partes[2].length === 2) {
          // DD/MM/AA
          fechaCompleta = new Date(2000 + parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
        } else {
          // DD/MM/YYYY
          fechaCompleta = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
        }
      } else {
        throw new Error('Formato de fecha no reconocido');
      }
      
      // Validar que la fecha sea válida
      if (isNaN(fechaCompleta.getTime())) {
        throw new Error('Fecha inválida');
      }
      
      // Agregar los meses
      fechaCompleta.setMonth(fechaCompleta.getMonth() + meses);
      
      // Formatear de vuelta a YYYY-MM-DD (para DateInput)
      const nuevoDia = fechaCompleta.getDate().toString().padStart(2, '0');
      const nuevoMes = (fechaCompleta.getMonth() + 1).toString().padStart(2, '0');
      const nuevoAnio = fechaCompleta.getFullYear();
      
      const resultado = `${nuevoAnio}-${nuevoMes}-${nuevoDia}`;
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Fecha vencimiento calculada:', resultado);
      }
      
      return resultado;
    } catch (error) {
      console.error('❌ Error al calcular fecha de vencimiento:', error);
      return fechaProduccion;
    }
  }

  // Buscar envase por ID
  static getEnvasePorId(id: string): EnvaseConfig | undefined {
    return ENVASES_CONFIG.find(envase => envase.id === id);
  }
}
