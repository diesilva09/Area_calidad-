// Servicio para interactuar con la API de temperaturas de envasado

export interface TemperaturaEnvasado {
  id: number;
  producto_id: string;
  envase_tipo: string;
  temperatura_min: number;
  temperatura_max: number;
  created_at: string;
}

export interface ValidationResult {
  valido: boolean;
  mensaje: string;
  detalles?: {
    campo: string;
    temperatura: number;
    rangoPermitido: string;
    estado: 'dentro' | 'fuera';
  }[];
}

export class TemperaturaEnvasadoService {
  // Verificar si un producto tiene temperaturas configuradas
  static async productoConfigurado(productoId: string): Promise<boolean> {
    try {
      console.log('🔍 Verificando producto:', productoId);
      const response = await fetch(`/api/temperatura-envasado?action=existe&productoId=${productoId}`);
      console.log('🔍 Response status:', response.status);
      
      if (!response.ok) {
        console.log('🔍 Response no ok:', response.statusText);
        return false;
      }
      const data = await response.json();
      console.log('🔍 Response data:', data);
      return data.existe;
    } catch (error) {
      console.error('Error al verificar configuración de temperaturas:', error);
      return false;
    }
  }

  // Obtener rango de temperatura para un producto y envase específicos
  static async obtenerRangoTemperatura(productoId: string, envaseTipo: string): Promise<{
    min: number;
    max: number;
  } | null> {
    try {
      console.log('🔍 Buscando rango:', productoId, envaseTipo);
      const response = await fetch(`/api/temperatura-envasado?action=rango&productoId=${productoId}&envaseTipo=${envaseTipo}`);
      console.log('🔍 Response status:', response.status);
      
      if (!response.ok) {
        console.log('🔍 Response no ok:', response.statusText);
        return null;
      }
      const data = await response.json();
      console.log('🔍 Response data:', data);
      
      const hasMin = data && data.temperatura_min !== undefined && data.temperatura_min !== null && String(data.temperatura_min).trim() !== '';
      const hasMax = data && data.temperatura_max !== undefined && data.temperatura_max !== null && String(data.temperatura_max).trim() !== '';

      if (hasMin && hasMax) {
        return {
          min: parseFloat(data.temperatura_min),
          max: parseFloat(data.temperatura_max)
        };
      }
      return null;
    } catch (error) {
      console.error('Error al obtener rango de temperatura:', error);
      return null;
    }
  }

  // Validar las 4 temperaturas contra el rango permitido
  static validarTemperaturas(
    temperaturas: {
      tempAM1: string;
      tempAM2: string;
      tempPM1: string;
      tempPM2: string;
    },
    rango: { min: number; max: number }
  ): ValidationResult {
    const detalles: ValidationResult['detalles'] = [];
    let todasValidas = true;

    // Mapeo de campos para mostrar en mensajes
    const campos = {
      tempAM1: 'T AM 1',
      tempAM2: 'T AM 2',
      tempPM1: 'T PM 1',
      tempPM2: 'T PM 2'
    };

    // Validar cada temperatura
    Object.entries(temperaturas).forEach(([campo, valor]) => {
      const temp = parseFloat(valor);
      
      if (!isNaN(temp)) {
        const dentroRango = temp >= rango.min && temp <= rango.max;
        
        detalles.push({
          campo: campos[campo as keyof typeof campos],
          temperatura: temp,
          rangoPermitido: `${rango.min}-${rango.max}°C`,
          estado: dentroRango ? 'dentro' : 'fuera'
        });

        if (!dentroRango) {
          todasValidas = false;
        }
      }
    });

    const temperaturasFueraRango = detalles.filter(d => d.estado === 'fuera');
    
    if (todasValidas) {
      return {
        valido: true,
        mensaje: 'Todas las temperaturas están dentro del rango permitido.',
        detalles
      };
    } else {
      const mensajesError = temperaturasFueraRango.map(d => 
        `${d.campo} (${d.temperatura}°C) está fuera del rango permitido (${d.rangoPermitido})`
      ).join(', ');
      
      return {
        valido: false,
        mensaje: `Temperaturas fuera de rango: ${mensajesError}`,
        detalles
      };
    }
  }

  // Validación completa: producto configurado + temperaturas
  static async validacionCompleta(
    productoId: string,
    envaseTipo: string,
    temperaturas: {
      tempAM1: string;
      tempAM2: string;
      tempPM1: string;
      tempPM2: string;
    }
  ): Promise<{
    productoConfigurado: boolean;
    rangoEncontrado: boolean;
    validacionTemperaturas: ValidationResult | null;
  }> {
    // 1. Verificar que el producto esté configurado
    const configurado = await this.productoConfigurado(productoId);
    
    if (!configurado) {
      return {
        productoConfigurado: false,
        rangoEncontrado: false,
        validacionTemperaturas: null
      };
    }

    // 2. Obtener rango de temperatura
    const rango = await this.obtenerRangoTemperatura(productoId, envaseTipo);
    
    if (!rango) {
      return {
        productoConfigurado: true,
        rangoEncontrado: false,
        validacionTemperaturas: null
      };
    }

    // 3. Validar temperaturas
    const validacion = this.validarTemperaturas(temperaturas, rango);
    
    return {
      productoConfigurado: true,
      rangoEncontrado: true,
      validacionTemperaturas: validacion
    };
  }

  // Obtener todos los envases disponibles para un producto
  static async obtenerEnvasesProducto(productoId: string): Promise<string[]> {
    try {
      const response = await fetch(`/api/temperatura-envasado?action=envases&productoId=${productoId}`);
      if (!response.ok) {
        return [];
      }
      const data = await response.json();
      return data.envases || [];
    } catch (error) {
      console.error('Error al obtener envases del producto:', error);
      return [];
    }
  }
}
