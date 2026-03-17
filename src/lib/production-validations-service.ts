// Servicio para obtener las validaciones de producción

export interface ProductionValidation {
  id: string;
  letra: string;
  muestras_requeridas: number;
  created_at: string;
  is_active: boolean;
}

class ProductionValidationsService {
  private baseUrl = '/api/production-validations';

  // Obtener todas las validaciones
  async getAll(): Promise<ProductionValidation[]> {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error('Error al obtener las validaciones de producción');
      }
      return response.json();
    } catch (error) {
      console.error('Error en ProductionValidationsService.getAll:', error);
      throw error;
    }
  }

  // Obtener validación por letra
  async getByLetra(letra: string): Promise<ProductionValidation | null> {
    try {
      const response = await fetch(`${this.baseUrl}/letra/${letra}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Error al obtener la validación por letra');
      }
      return response.json();
    } catch (error) {
      console.error('Error en ProductionValidationsService.getByLetra:', error);
      throw error;
    }
  }

  // Validar cantidad de pesos drenados según la letra
  async validarPesosDrenados(letra: string, pesosDrenados: string): Promise<{ valido: boolean; mensaje: string }> {
    try {
      const validation = await this.getByLetra(letra);
      
      if (!validation) {
        return {
          valido: false,
          mensaje: `Letra "${letra}" no encontrada en la tabla de validaciones`
        };
      }

      // Contar cuántos números hay en el campo pesosDrenados
      const numeros = pesosDrenados.split(/[\s,;]+/).filter(num => num.trim() !== '');
      const cantidadNumeros = numeros.length;

      if (cantidadNumeros !== validation.muestras_requeridas) {
        return {
          valido: false,
          mensaje: `La letra "${letra}" requiere ${validation.muestras_requeridas} muestras, pero se encontraron ${cantidadNumeros} valores en pesos drenados`
        };
      }

      // Validar que todos los valores sean números válidos
      for (const num of numeros) {
        if (isNaN(parseFloat(num))) {
          return {
            valido: false,
            mensaje: `"${num}" no es un número válido en pesos drenados`
          };
        }
      }

      return {
        valido: true,
        mensaje: `Validación correcta: ${cantidadNumeros} muestras encontradas para letra "${letra}"`
      };

    } catch (error) {
      console.error('Error en ProductionValidationsService.validarPesosDrenados:', error);
      return {
        valido: false,
        mensaje: 'Error al validar pesos drenados'
      };
    }
  }
}

export const productionValidationsService = new ProductionValidationsService();
