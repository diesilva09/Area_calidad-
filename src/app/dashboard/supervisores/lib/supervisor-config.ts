// Configuración y constantes para el módulo de supervisores
export const SUPERVISOR_CONFIG = {
  // Límites y paginación
  MAX_ITEMS_PER_PAGE: 20,
  MAX_CHARACTERS_IN_TEXTAREA: 500,
  MAX_FILE_SIZE_MB: 5,
  
  // Tiempos de debounce (ms)
  DEBOUNCE_SEARCH: 300,
  DEBOUNCE_AUTO_SAVE: 1000,
  
  // Colores y estados
  STATUS_COLORS: {
    completed: 'green',
    pending: 'yellow',
    failed: 'red',
    in_progress: 'blue'
  },
  
  // Prioridades
  PRIORITY_LEVELS: {
    low: { label: 'Baja', color: 'gray' },
    normal: { label: 'Normal', color: 'blue' },
    high: { label: 'Alta', color: 'red' },
    critical: { label: 'Crítica', color: 'purple' }
  },
  
  // Tipos de verificación
  VERIFICATION_TYPES: [
    'Visual',
    'Instrumental',
    'Microbiológica',
    'Físico-Química',
    'Organoléptica'
  ],
  
  // Áreas predefinidas
  AREAS: [
    'Producción',
    'Embalaje',
    'Almacén',
    'Laboratorio',
    'Oficinas',
    'Baños',
    'Cocina',
    'Sala de Espera'
  ],
  
  // Líneas de producción
  PRODUCTION_LINES: [
    'Línea 1 - Envasado',
    'Línea 2 - Llenado',
    'Línea 3 - Etiquetado',
    'Línea 4 - Empacado',
    'Línea 5 - Control de Calidad'
  ]
} as const;

// Tipos de errores estandarizados
export enum SupervisorErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface SupervisorError {
  type: SupervisorErrorType;
  message: string;
  details?: any;
  timestamp: Date;
}

// Utilidades para manejo de errores
export class SupervisorErrorUtils {
  static createError(
    type: SupervisorErrorType,
    message: string,
    details?: any
  ): SupervisorError {
    return {
      type,
      message,
      details,
      timestamp: new Date()
    };
  }

  static getErrorMessage(error: SupervisorError): string {
    switch (error.type) {
      case SupervisorErrorType.VALIDATION_ERROR:
        return 'Error de validación: ' + error.message;
      case SupervisorErrorType.NETWORK_ERROR:
        return 'Error de conexión: ' + error.message;
      case SupervisorErrorType.PERMISSION_ERROR:
        return 'No tienes permisos para realizar esta acción';
      case SupervisorErrorType.NOT_FOUND_ERROR:
        return 'Recurso no encontrado: ' + error.message;
      case SupervisorErrorType.SERVER_ERROR:
        return 'Error del servidor: ' + error.message;
      default:
        return 'Error desconocido: ' + error.message;
    }
  }

  static isRetryable(error: SupervisorError): boolean {
    return [
      SupervisorErrorType.NETWORK_ERROR,
      SupervisorErrorType.SERVER_ERROR
    ].includes(error.type);
  }
}

// Utilidades de validación
export class SupervisorValidationUtils {
  static validateRequired(value: any, fieldName: string): string | null {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `El campo ${fieldName} es requerido`;
    }
    return null;
  }

  static validateMaxLength(value: string, maxLength: number, fieldName: string): string | null {
    if (value && value.length > maxLength) {
      return `El campo ${fieldName} no puede tener más de ${maxLength} caracteres`;
    }
    return null;
  }

  static validateEmail(email: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'El correo electrónico no es válido';
    }
    return null;
  }

  static validateDate(date: string): string | null {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return 'La fecha no es válida';
    }
    return null;
  }

  static validateFutureDate(date: string): string | null {
    const parsedDate = new Date(date);
    const now = new Date();
    if (parsedDate <= now) {
      return 'La fecha debe ser futura';
    }
    return null;
  }
}

// Utilidades de formato
export class SupervisorFormatUtils {
  static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  static formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  static formatPriority(priority: string): string {
    return SUPERVISOR_CONFIG.PRIORITY_LEVELS[priority as keyof typeof SUPERVISOR_CONFIG.PRIORITY_LEVELS]?.label || priority;
  }

  static getStatusColor(status: string): string {
    return SUPERVISOR_CONFIG.STATUS_COLORS[status as keyof typeof SUPERVISOR_CONFIG.STATUS_COLORS] || 'gray';
  }

  static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}

// Hooks personalizados base
export abstract class SupervisorBaseHook {
  protected handleError(error: any, context: string): SupervisorError {
    console.error(`Error in ${context}:`, error);
    
    if (error instanceof Error) {
      if (error.message.includes('Network')) {
        return SupervisorErrorUtils.createError(
          SupervisorErrorType.NETWORK_ERROR,
          error.message,
          { originalError: error }
        );
      }
      
      if (error.message.includes('403') || error.message.includes('permission')) {
        return SupervisorErrorUtils.createError(
          SupervisorErrorType.PERMISSION_ERROR,
          error.message,
          { originalError: error }
        );
      }
      
      if (error.message.includes('404')) {
        return SupervisorErrorUtils.createError(
          SupervisorErrorType.NOT_FOUND_ERROR,
          error.message,
          { originalError: error }
        );
      }
    }
    
    return SupervisorErrorUtils.createError(
      SupervisorErrorType.UNKNOWN_ERROR,
      error?.message || 'Error desconocido',
      { originalError: error }
    );
  }

  protected async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<{ data: T | null; error: SupervisorError | null }> {
    try {
      const data = await operation();
      return { data, error: null };
    } catch (error) {
      const supervisorError = this.handleError(error, context);
      return { data: null, error: supervisorError };
    }
  }
}
