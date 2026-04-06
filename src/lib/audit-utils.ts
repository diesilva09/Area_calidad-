import { type FieldChange } from './field-audit-service';

/**
 * Detecta cambios entre dos objetos y retorna un array de cambios
 */
export function detectFieldChanges(
  currentRecord: any,
  updatedRecord: any,
  excludeFields: string[] = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by']
): FieldChange[] {
  const changes: FieldChange[] = [];
  
  for (const [key, newValue] of Object.entries(updatedRecord)) {
    // Ignorar campos excluidos
    if (excludeFields.includes(key)) {
      continue;
    }
    
    const oldValue = currentRecord?.[key];
    
    // Si el valor cambió, lo registramos
    if (oldValue !== newValue) {
      changes.push({
        field: key,
        oldValue: oldValue,
        newValue: newValue
      });
    }
  }
  
  return changes;
}

/**
 * Filtra cambios importantes (campos críticos del negocio)
 */
export function getImportantChanges(changes: FieldChange[]): FieldChange[] {
  const importantFields = [
    'lote',
    'fechaproduccion',
    'fechavencimiento',
    'producto',
    'status',
    'responsable_produccion',
    'supervisor_calidad',
    'responsable_analisis_pt',
    'liberacion_inicial',
    'verificacion_aleatoria'
  ];
  
  return changes.filter(change => importantFields.includes(change.field));
}

/**
 * Formatea el valor para mostrar en la UI
 */
export function formatAuditValue(value: any): string {
  // Si el valor es null, undefined o string vacío, mostrar N/A
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }
  
  // Si es booleano, mostrar Sí/No
  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }
  
  // Si es un objeto Date, formatear la fecha
  if (typeof value === 'object' && value instanceof Date) {
    return value.toLocaleDateString('es-ES');
  }
  
  // Si es un string que parece fecha, formatearlo
  if (typeof value === 'string') {
    // Intentar parsear como fecha si tiene formato de fecha
    const dateRegex = /^\d{4}-\d{2}-\d{2}/;
    if (dateRegex.test(value)) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('es-ES');
        }
      } catch {
        // Si falla el parseo, continuar con el valor original
      }
    }
    
    // Para strings largos, truncar si es necesario
    if (value.length > 100) {
      return value.substring(0, 100) + '...';
    }
  }
  
  // Convertir a string para cualquier otro caso
  return String(value);
}

/**
 * Convierte camelCase a formato legible con espacios
 */
function camelCaseToReadable(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .replace(/^./, char => char.toUpperCase());
}

/**
 * Obtiene una descripción amigable del nombre del campo
 */
export function getFieldDisplayName(fieldName: string): string {
  const fieldNames: Record<string, string> = {
    'lote': 'Lote',
    'fechaproduccion': 'Fecha de Producción',
    'fechavencimiento': 'Fecha de Vencimiento',
    'producto': 'Producto',
    'mescorte': 'Mes de Corte',
    'envase': 'Envase',
    'tamano_lote': 'Tamaño de Lote',
    'area': 'Área',
    'equipo': 'Equipo',
    'status': 'Estado',
    'responsable_produccion': 'Responsable de Producción',
    'supervisor_calidad': 'Supervisor de Calidad',
    'responsable_analisis_pt': 'Responsable Análisis PT',
    'liberacion_inicial': 'Liberación Inicial',
    'verificacion_aleatoria': 'Verificación Aleatoria',
    'tempam1': 'Temperatura AM 1',
    'tempam2': 'Temperatura AM 2',
    'temppm1': 'Temperatura PM 1',
    'temppm2': 'Temperatura PM 2',
    'analisis_sensorial': 'Análisis Sensorial',
    'prueba_hermeticidad': 'Prueba Hermeticidad',
    'peso_neto_declarado': 'Peso Neto Declarado',
    'peso_drenado_declarado': 'Peso Drenado Declarado',
    'observaciones': 'Observaciones',
    'created_by': 'Creado por',
    'updated_by': 'Editado por',
    'CREATED_RECORD': 'Registro Creado',
    'DELETED_RECORD': 'Registro Eliminado',
    // Campos adicionales para observaciones específicas
    'observacionesPesoNeto': 'Observaciones Peso Neto',
    'observacionesPesoDrenado': 'Observaciones Peso Drenado',
    'observacionesAnalisisPruebas': 'Observaciones Análisis Pruebas',
    'analisisSensorial': 'Análisis Sensorial',
    'pruebaHermeticidad': 'Prueba Hermeticidad',
    'fechaProduccion': 'Fecha de Producción',
    'fechaVencimiento': 'Fecha de Vencimiento',
    'tamanoLote': 'Tamaño de Lote',
    'liberacionInicial': 'Liberación Inicial',
    'verificacionAleatoria': 'Verificación Aleatoria',
    'tempAM1': 'Temperatura AM 1',
    'tempAM2': 'Temperatura AM 2',
    'tempPM1': 'Temperatura PM 1',
    'tempPM2': 'Temperatura PM 2',
    'pesoNetoDeclarado': 'Peso Neto Declarado',
    'pesoDrenadoDeclarado': 'Peso Drenado Declarado',
    'responsableProduccion': 'Responsable de Producción',
    'supervisorCalidad': 'Supervisor de Calidad',
    'responsableAnalisisPT': 'Responsable Análisis PT',
    'fechaAnalisisPT': 'Fecha Análisis PT',
    'noMezclaPT': 'No Mezcla PT',
    'vacioPT': 'Vacío PT',
    'pesoNetoRealPT': 'Peso Neto Real PT',
    'pesoDrenadoRealPT': 'Peso Drenado Real PT',
    'brixPT': 'Brix PT',
    'phPT': 'pH PT',
    'acidezPT': 'Acidez PT',
    'ppmSO2PT': 'PPM SO2 PT',
    'consistenciaPT': 'Consistencia PT',
    'sensorialPT': 'Sensorial PT',
    'tapadoCierrePT': 'Tapado Cierre PT',
    'etiquetaPT': 'Etiqueta PT',
    'presentacionFinalPT': 'Presentación Final PT',
    'ubicacionMuestraPT': 'Ubicación Muestra PT',
    'estadoPT': 'Estado PT',
    'observacionesPT': 'Observaciones PT',
    'letratamano_muestra': 'Letra Tamaño Muestra',
    'inspeccion_micropesaje_mezcla': 'Inspección Micropesaje Mezcla',
    'inspeccion_micropesaje_resultado': 'Inspección Micropesaje Resultado',
    'total_unidades_revisar_drenado': 'Total Unidades Revisar Drenado',
    'rango_peso_drenado_min': 'Rango Peso Drenado Mínimo',
    'rango_peso_drenado_max': 'Rango Peso Drenado Máximo',
    'pesos_drenados': 'Pesos Drenados',
    'promedio_peso_drenado': 'Promedio Peso Drenado',
    'encima_peso_drenado': 'Encima Peso Drenado',
    'debajo_peso_drenado': 'Debajo Peso Drenado',
    'und_incumplen_rango_drenado': 'Unidades Incumplen Rango Drenado',
    'porcentaje_incumplen_rango_drenado': 'Porcentaje Incumplen Rango Drenado',
    'total_unidades_revisar_neto': 'Total Unidades Revisar Neto',
    'pesos_netos': 'Pesos Netos',
    'promedio_peso_neto': 'Promedio Peso Neto',
    'encima_peso_neto': 'Encima Peso Neto',
    'debajo_peso_neto': 'Debajo Peso Neto',
    'und_incumplen_rango_neto': 'Unidades Incumplen Rango Neto',
    'porcentaje_incumplen_rango_neto': 'Porcentaje Incumplen Rango Neto',
    'pruebas_vacio': 'Pruebas Vacío',
    'novedades_proceso': 'Novedades Proceso',
    'observaciones_acciones_correctivas': 'Observaciones Acciones Correctivas',
    'fechaanalisispt': 'Fecha Análisis PT',
    'no_mezcla_pt': 'No Mezcla PT',
    'vacio_pt': 'Vacío PT',
    'peso_neto_real_pt': 'Peso Neto Real PT',
    'peso_drenado_real_pt': 'Peso Drenado Real PT',
    'brix_pt': 'Brix PT',
    'ph_pt': 'pH PT',
    'acidez_pt': 'Acidez PT',
    'ppm_so2_pt': 'PPM SO2 PT',
    'consistencia_pt': 'Consistencia PT',
    'sensorial_pt': 'Sensorial PT',
    'tapado_cierre_pt': 'Tapado Cierre PT',
    'etiqueta_pt': 'Etiqueta PT',
    'presentacion_final_pt': 'Presentación Final PT',
    'ubicacion_muestra_pt': 'Ubicación Muestra PT',
    'estado_pt': 'Estado PT',
    'observaciones_pt': 'Observaciones PT',
    // Campos específicos de embalaje
    'fecha': 'Fecha',
    'nivel_inspeccion': 'Nivel de Inspección',
    'presentacion': 'Presentación',
    'presentacion_no_conforme': 'Presentación No Conforme',
    'etiqueta': 'Etiqueta',
    'marcacion': 'Marcación',
    'cajas': 'Cajas',
    'cajas_revisadas': 'Cajas Revisadas',
    'total_unidades_revisadas': 'Total Unidades Revisadas',
    'total_unidades_revisadas_real': 'Total Unidades Revisadas Real',
    'unidades_faltantes': 'Unidades Faltantes',
    'unidades_no_conformes': 'Unidades No Conformes',
    'porcentaje_faltantes': 'Porcentaje Faltantes',
    'porcentaje_incumplimiento': 'Porcentaje Incumplimiento',
    'porcentaje_etiqueta_no_conforme': 'Porcentaje Etiqueta No Conforme',
    'porcentaje_marcacion_no_conforme': 'Porcentaje Marcación No Conforme',
    'porcentaje_presentacion_no_conforme': 'Porcentaje Presentación No Conforme',
    'porcentaje_cajas_no_conformes': 'Porcentaje Cajas No Conformes',
    'observaciones_generales': 'Observaciones Generales',
    'observaciones_etiqueta': 'Observaciones Etiqueta',
    'observaciones_marcacion': 'Observaciones Marcación',
    'observaciones_presentacion': 'Observaciones Presentación',
    'observaciones_cajas': 'Observaciones Cajas',
    'observaciones_faltantes': 'Observaciones Faltantes',
    'correccion': 'Corrección',
    'responsable_identificador_cajas': 'Responsable Identificador Cajas',
    'responsable_embalaje': 'Responsable Embalaje',
    'responsable_calidad': 'Responsable Calidad',
    // Campos en camelCase para embalaje (solo los que no están ya)
    'nivelInspeccion': 'Nivel Inspección',
    'presentacionNoConforme': 'Presentación No Conforme',
    'cajasRevisadas': 'Cajas Revisadas',
    'totalUnidadesRevisadas': 'Total Unidades Revisadas',
    'totalUnidadesRevisadasReal': 'Total Unidades Revisadas Real',
    'unidadesFaltantes': 'Unidades Faltantes',
    'unidadesNoConformes': 'Unidades No Conformes',
    'porcentajeFaltantes': 'Porcentaje Faltantes',
    'porcentajeIncumplimiento': 'Porcentaje Incumplimiento',
    'porcentajeEtiquetaNoConforme': 'Porcentaje Etiqueta No Conforme',
    'porcentajeMarcacionNoConforme': 'Porcentaje Marcación No Conforme',
    'porcentajePresentacionNoConforme': 'Porcentaje Presentación No Conforme',
    'porcentajeCajasNoConformes': 'Porcentaje Cajas No Conformes',
    'observacionesGenerales': 'Observaciones Generales',
    'observacionesEtiqueta': 'Observaciones Etiqueta',
    'observacionesMarcacion': 'Observaciones Marcación',
    'observacionesPresentacion': 'Observaciones Presentación',
    'observacionesCajas': 'Observaciones Cajas',
    'observacionesFaltantes': 'Observaciones Faltantes',
    'responsableIdentificadorCajas': 'Responsable Identificador Cajas',
    'responsableEmbalaje': 'Responsable Embalaje',
    'responsableCalidad': 'Responsable Calidad'
  };
  
  // Si no encuentra el campo en el diccionario, intentar convertir camelCase automáticamente
  return fieldNames[fieldName] || camelCaseToReadable(fieldName);
}

/**
 * Determina si un cambio es reciente (últimas 24 horas)
 */
export function isRecentChange(changeDate: Date | string, hours: number = 24): boolean {
  const now = new Date();
  const date = changeDate instanceof Date ? changeDate : new Date(changeDate);
  
  // Verificar si la fecha es válida
  if (isNaN(date.getTime())) {
    return false;
  }
  
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  return diffInHours <= hours;
}

/**
 * Agrupa cambios por campo para mejor visualización
 */
export function groupChangesByField(changes: any[]): Record<string, any[]> {
  return changes.reduce((groups, change) => {
    const fieldName = change.field_name;
    if (!groups[fieldName]) {
      groups[fieldName] = [];
    }
    groups[fieldName].push(change);
    return groups;
  }, {} as Record<string, any[]>);
}

/**
 * Obtiene el color según la antigüedad del cambio
 */
export function getChangeColor(changeDate: Date | string): string {
  const now = new Date();
  const date = changeDate instanceof Date ? changeDate : new Date(changeDate);
  
  // Verificar si la fecha es válida
  if (isNaN(date.getTime())) {
    return 'text-gray-600 bg-gray-50 border-gray-200'; // Antiguo por defecto
  }
  
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours <= 1) return 'text-red-600 bg-red-50 border-red-200'; // Muy reciente
  if (diffInHours <= 24) return 'text-orange-600 bg-orange-50 border-orange-200'; // Reciente
  if (diffInHours <= 168) return 'text-blue-600 bg-blue-50 border-blue-200'; // Semana
  return 'text-gray-600 bg-gray-50 border-gray-200'; // Antiguo
}
