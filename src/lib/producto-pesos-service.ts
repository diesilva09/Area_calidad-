export interface ProductoPesosConfig {
  peso_drenado_declarado: number;
  peso_drenado_min: number;
  peso_drenado_max: number;
  peso_neto_declarado: number;
}

export class ProductoPesosService {
  // NUEVO: Método de debugging para ver todos los pesos de un producto
  static async debugPesosPorProducto(productoId: string): Promise<any[]> {
    try {
      console.log('🔍 DEBUG: Buscando TODOS los pesos para producto:', productoId);
      const response = await fetch(
        `/api/producto-pesos?productoId=${productoId}&debug=true`
      );
      
      if (!response.ok) {
        console.log('🔍 DEBUG: Response no ok:', response.statusText);
        return [];
      }
      
      const data = await response.json();
      console.log('🔍 DEBUG: Todos los pesos encontrados:', data);
      return data;
    } catch (error) {
      console.error('🔍 DEBUG: Error al obtener todos los pesos:', error);
      return [];
    }
  }

  // Obtener configuración de pesos para un producto y envase específicos
  static async obtenerPesosPorProductoYEnvase(
    productoId: string, 
    envaseTipo: string
  ): Promise<ProductoPesosConfig | null> {
    try {
      console.log('🔍 Buscando pesos:', productoId, envaseTipo);
      const response = await fetch(
        `/api/producto-pesos?productoId=${productoId}&envaseTipo=${encodeURIComponent(envaseTipo)}`
      );
      console.log('🔍 Response status:', response.status);
      
      if (!response.ok) {
        console.log('🔍 Response no ok:', response.statusText);
        return null;
      }
      
      const data = await response.json();
      console.log('🔍 Response data:', data);
      
      const pesoDrenadoDeclarado = data?.peso_drenado_declarado;
      const pesoDrenadoMin = data?.peso_drenado_min;
      const pesoDrenadoMax = data?.peso_drenado_max;
      const pesoNetoDeclarado = data?.peso_neto_declarado;

      const hasAnyPeso =
        pesoNetoDeclarado !== undefined && pesoNetoDeclarado !== null && String(pesoNetoDeclarado).trim() !== ''
          ? true
          : pesoDrenadoDeclarado !== undefined && pesoDrenadoDeclarado !== null && String(pesoDrenadoDeclarado).trim() !== '';

      if (data && hasAnyPeso) {
        return {
          peso_drenado_declarado: parseFloat(String(pesoDrenadoDeclarado ?? 0)),
          peso_drenado_min: parseFloat(String(pesoDrenadoMin ?? 0)),
          peso_drenado_max: parseFloat(String(pesoDrenadoMax ?? 0)),
          peso_neto_declarado: parseFloat(String(pesoNetoDeclarado ?? 0))
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error al obtener configuración de pesos:', error);
      return null;
    }
  }

  // NUEVO: Obtener configuración de pesos por categoría y ID de producto (más específico)
  static async obtenerPesosPorProductoYCategoria(
    productoId: string, 
    categoriaId: string,
    envaseTipo: string = "caja"
  ): Promise<ProductoPesosConfig | null> {
    try {
      console.log('🔍 Buscando pesos por categoría:', productoId, categoriaId, envaseTipo);
      const response = await fetch(
        `/api/producto-pesos?productoId=${productoId}&categoriaId=${categoriaId}&envaseTipo=${encodeURIComponent(envaseTipo)}`
      );
      console.log('🔍 Response status (categoría):', response.status);
      
      if (!response.ok) {
        console.log('🔍 Response no ok (categoría):', response.statusText);
        return null;
      }
      
      const data = await response.json();
      console.log('🔍 Response data (categoría):', data);
      
      const pesoDrenadoDeclarado = data?.peso_drenado_declarado;
      const pesoDrenadoMin = data?.peso_drenado_min;
      const pesoDrenadoMax = data?.peso_drenado_max;
      const pesoNetoDeclarado = data?.peso_neto_declarado;

      const hasAnyPeso =
        pesoNetoDeclarado !== undefined && pesoNetoDeclarado !== null && String(pesoNetoDeclarado).trim() !== ''
          ? true
          : pesoDrenadoDeclarado !== undefined && pesoDrenadoDeclarado !== null && String(pesoDrenadoDeclarado).trim() !== '';

      if (data && hasAnyPeso) {
        return {
          peso_drenado_declarado: parseFloat(String(pesoDrenadoDeclarado ?? 0)),
          peso_drenado_min: parseFloat(String(pesoDrenadoMin ?? 0)),
          peso_drenado_max: parseFloat(String(pesoDrenadoMax ?? 0)),
          peso_neto_declarado: parseFloat(String(pesoNetoDeclarado ?? 0))
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error al obtener configuración de pesos por categoría:', error);
      return null;
    }
  }

  // NUEVO: Búsqueda exhaustiva con múltiples envases
  static async buscarPesoExhaustivo(
    productoId: string, 
    categoriaId?: string
  ): Promise<ProductoPesosConfig | null> {
    try {
      console.log('🔍 Búsqueda exhaustiva para producto:', productoId, 'categoría:', categoriaId);
      
      // Lista de envases comunes en orden de prioridad
      const tiposEnvase = ["caja", "lata", "frasco", "bolsa", "botella", "PET", "Vidrio"];
      
      for (const envase of tiposEnvase) {
        console.log(`🔍 Intentando con envase: ${envase}`);
        
        let pesosConfig = null;
        
        // Primero intentar por categoría si está disponible
        if (categoriaId) {
          pesosConfig = await this.obtenerPesosPorProductoYCategoria(productoId, categoriaId, envase);
          if (pesosConfig) {
            console.log(`✅ Encontrado por categoría + ID con envase ${envase}:`, pesosConfig);
            return pesosConfig;
          }
        }
        
        // Si no funciona, intentar solo por ID
        pesosConfig = await this.obtenerPesosPorProductoYEnvase(productoId, envase);
        if (pesosConfig) {
          console.log(`✅ Encontrado solo por ID con envase ${envase}:`, pesosConfig);
          return pesosConfig;
        }
      }
      
      console.log(`❌ No se encontró configuración de pesos para el producto ${productoId}`);
      return null;
      
    } catch (error) {
      console.error('Error en búsqueda exhaustiva:', error);
      return null;
    }
  }

  // Verificar si un producto tiene pesos configurados para un envase
  static async productoTienePesosConfigurados(
    productoId: string, 
    envaseTipo: string
  ): Promise<boolean> {
    try {
      const pesos = await this.obtenerPesosPorProductoYEnvase(productoId, envaseTipo);
      return pesos !== null;
    } catch (error) {
      console.error('Error al verificar pesos configurados:', error);
      return false;
    }
  }
}
