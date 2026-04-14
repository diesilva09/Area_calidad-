import { type FieldChange } from './field-audit-service';

/**
 * Detecta cambios entre dos objetos y retorna un array de cambios
 * MEJORADO: Ultra preciso para evitar falsos positivos
 */
export function detectFieldChanges(
  currentRecord: any,
  updatedRecord: any,
  excludeFields: string[] = ['id', 'created_at', 'updated_at']
): FieldChange[] {
  const changes: FieldChange[] = [];
  
  console.log('=== DETECCIÓN DE CAMBIOS ULTRA PRECISA ===');
  console.log('Registro actual:', JSON.stringify(currentRecord, null, 2));
  console.log('Datos nuevos:', JSON.stringify(updatedRecord, null, 2));
  
  // Si no hay registro actual, no hay cambios que detectar
  if (!currentRecord) {
    console.log('No hay registro actual - no se detectan cambios');
    return [];
  }
  
  for (const [key, newValue] of Object.entries(updatedRecord)) {
    // Ignorar campos excluidos
    if (excludeFields.includes(key)) {
      console.log(`Ignorando campo excluido: ${key}`);
      continue;
    }
    
    const oldValue = currentRecord?.[key];
    
    // Detección ultra precisa
    const hasChanged = detectValueChangeUltraPrecise(oldValue, newValue, key);
    
    if (hasChanged.changed) {
      console.log(`CAMBIO REAL DETECTADO - ${key}:`);
      console.log(`  Anterior: "${oldValue}" (${typeof oldValue})`);
      console.log(`  Nuevo: "${newValue}" (${typeof newValue})`);
      console.log(`  Razón: ${hasChanged.details}`);
      
      changes.push({
        field: key,
        oldValue: oldValue,
        newValue: newValue
      });
    } else {
      console.log(`Sin cambios reales en ${key}: ${hasChanged.details}`);
    }
  }
  
  console.log(`=== TOTAL DE CAMBIOS REALES: ${changes.length} ===`);
  
  // Filtrar solo cambios significativos
  const significantChanges = changes.filter(change => 
    isSignificantChange(change.field, change.oldValue, change.newValue)
  );
  
  console.log(`=== CAMBIOS SIGNIFICATIVOS: ${significantChanges.length} ===`);
  
  return significantChanges;
}

/**
 * Función ultra precisa para detectar cambios de valores
 * EVITA FALSOS POSITIVOS
 */
function detectValueChangeUltraPrecise(oldValue: any, newValue: any, fieldName: string): { changed: boolean; details: string } {
  // Caso 1: Ambos son exactamente iguales (mismo valor y mismo tipo)
  if (oldValue === newValue) {
    return { changed: false, details: 'Valores idénticos (===)' };
  }
  
  // Caso 2: Ambos son null/undefined
  if (oldValue == null && newValue == null) {
    return { changed: false, details: 'Ambos son nulos' };
  }
  
  // Caso 3: Uno es null/undefined y el otro no
  if ((oldValue == null && newValue != null) || (oldValue != null && newValue == null)) {
    return { changed: true, details: 'Uno es nulo y el otro no' };
  }
  
  // Caso 4: Comparación profunda para strings
  if (typeof oldValue === 'string' && typeof newValue === 'string') {
    const oldTrim = oldValue.trim();
    const newTrim = newValue.trim();
    
    // Si son iguales después de trim, no hay cambio
    if (oldTrim === newTrim) {
      return { changed: false, details: 'Strings iguales después de trim' };
    }
    
    // Si uno está vacío y el otro no, hay cambio
    if (oldTrim === '' && newTrim !== '') {
      return { changed: true, details: 'String vacío -> con contenido' };
    }
    
    if (oldTrim !== '' && newTrim === '') {
      return { changed: true, details: 'String con contenido -> vacío' };
    }
    
    // Comparación case-insensitive para campos específicos
    const caseInsensitiveFields = ['observaciones', 'descripcion', 'notas'];
    if (caseInsensitiveFields.includes(fieldName.toLowerCase())) {
      if (oldTrim.toLowerCase() === newTrim.toLowerCase()) {
        return { changed: false, details: 'Strings iguales (case-insensitive)' };
      }
    }
    
    return { changed: true, details: `Strings diferentes: "${oldTrim}" vs "${newTrim}"` };
  }
  
  // Caso 5: Comparación para números
  if (typeof oldValue === 'number' && typeof newValue === 'number') {
    // Permitir pequeñas diferencias de punto flotante
    const epsilon = 0.0001;
    if (Math.abs(oldValue - newValue) < epsilon) {
      return { changed: false, details: 'Números prácticamente iguales' };
    }
    
    return { changed: true, details: `Números diferentes: ${oldValue} vs ${newValue}` };
  }
  
  // Caso 6: Comparación para booleanos
  if (typeof oldValue === 'boolean' && typeof newValue === 'boolean') {
    return { changed: true, details: `Booleanos diferentes: ${oldValue} vs ${newValue}` };
  }
  
  // Caso 7: Comparación para fechas
  if (oldValue instanceof Date && newValue instanceof Date) {
    const timeDiff = Math.abs(oldValue.getTime() - newValue.getTime());
    if (timeDiff < 1000) { // Menos de 1 segundo de diferencia
      return { changed: false, details: 'Fechas prácticamente iguales' };
    }
    
    return { changed: true, details: `Fechas diferentes: ${oldValue.toISOString()} vs ${newValue.toISOString()}` };
  }
  
  // Caso 8: Strings que parecen fechas
  if (typeof oldValue === 'string' && typeof newValue === 'string') {
    const oldDate = new Date(oldValue);
    const newDate = new Date(newValue);
    
    if (!isNaN(oldDate.getTime()) && !isNaN(newDate.getTime())) {
      const timeDiff = Math.abs(oldDate.getTime() - newDate.getTime());
      if (timeDiff < 1000) {
        return { changed: false, details: 'Fechas (string) prácticamente iguales' };
      }
      
      return { changed: true, details: `Fechas (string) diferentes: ${oldDate.toISOString()} vs ${newDate.toISOString()}` };
    }
  }
  
  // Caso 9: Comparación de arrays
  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    if (oldValue.length !== newValue.length) {
      return { changed: true, details: `Arrays de diferente longitud: ${oldValue.length} vs ${newValue.length}` };
    }
    
    // Comparación elemento por elemento
    for (let i = 0; i < oldValue.length; i++) {
      if (oldValue[i] !== newValue[i]) {
        return { changed: true, details: `Arrays diferentes en elemento ${i}: ${oldValue[i]} vs ${newValue[i]}` };
      }
    }
    
    return { changed: false, details: 'Arrays idénticos' };
  }
  
  // Caso 10: Comparación de objetos simples
  if (typeof oldValue === 'object' && typeof newValue === 'object' && 
      oldValue !== null && newValue !== null && 
      !Array.isArray(oldValue) && !Array.isArray(newValue)) {
    
    const oldKeys = Object.keys(oldValue);
    const newKeys = Object.keys(newValue);
    
    if (oldKeys.length !== newKeys.length) {
      return { changed: true, details: `Objetos con diferente número de propiedades` };
    }
    
    for (const key of oldKeys) {
      if (!newKeys.includes(key) || oldValue[key] !== newValue[key]) {
        return { changed: true, details: `Objetos diferentes en propiedad ${key}` };
      }
    }
    
    return { changed: false, details: 'Objetos idénticos' };
  }
  
  // Caso 11: Conversión a string y comparación final
  const oldStr = String(oldValue).trim();
  const newStr = String(newValue).trim();
  
  if (oldStr === newStr) {
    return { changed: false, details: 'Conversión a string: valores iguales' };
  }
  
  return { changed: true, details: `Valores diferentes: "${oldStr}" vs "${newStr}"` };
}

/**
 * Determina si un cambio es significativo
 * Filtra cambios triviales o sin importancia
 */
function isSignificantChange(fieldName: string, oldValue: any, newValue: any): boolean {
  // Ignorar cambios de espacios en blanco puros
  if (typeof oldValue === 'string' && typeof newValue === 'string') {
    const oldTrim = oldValue.trim();
    const newTrim = newValue.trim();
    
    // Si el cambio es solo espacios en blanco
    if (oldTrim === newTrim && oldValue !== newValue) {
      console.log(`Cambio ignorado (${fieldName}): solo espacios en blanco`);
      return false;
    }
  }
  
  // Ignorar cambios numéricos muy pequeños
  if (typeof oldValue === 'number' && typeof newValue === 'number') {
    const diff = Math.abs(oldValue - newValue);
    const epsilon = 0.0001;
    
    if (diff < epsilon) {
      console.log(`Cambio ignorado (${fieldName}): diferencia numérica muy pequeña: ${diff}`);
      return false;
    }
  }
  
  // Ignorar cambios de formato de fecha sin cambio real
  if (typeof oldValue === 'string' && typeof newValue === 'string') {
    const oldDate = new Date(oldValue);
    const newDate = new Date(newValue);
    
    if (!isNaN(oldDate.getTime()) && !isNaN(newDate.getTime())) {
      const timeDiff = Math.abs(oldDate.getTime() - newDate.getTime());
      if (timeDiff < 1000) {
        console.log(`Cambio ignorado (${fieldName}): diferencia de fecha menor a 1 segundo`);
        return false;
      }
    }
  }
  
  // Para observaciones, solo considerar cambios significativos
  if (fieldName.toLowerCase().includes('observacion') || 
      fieldName.toLowerCase().includes('descripcion') || 
      fieldName.toLowerCase().includes('nota')) {
    
    if (typeof oldValue === 'string' && typeof newValue === 'string') {
      const oldTrim = oldValue.trim();
      const newTrim = newValue.trim();
      
      // Si el cambio es menor a 3 caracteres, ignorar
      const diff = Math.abs(oldTrim.length - newTrim.length);
      if (diff < 3 && oldTrim !== '' && newTrim !== '') {
        console.log(`Cambio ignorado (${fieldName}): cambio menor a 3 caracteres`);
        return false;
      }
      
      // Si es solo mayúsculas/minúsculas, ignorar
      if (oldTrim.toLowerCase() === newTrim.toLowerCase()) {
        console.log(`Cambio ignorado (${fieldName}): solo mayúsculas/minúsculas`);
        return false;
      }
    }
  }
  
  console.log(`Cambio significativo detectado en ${fieldName}`);
  return true;
}

/**
 * Filtra cambios importantes (campos críticos del negocio)
 * MEJORADO: Más campos importantes
 */
export function getImportantChanges(changes: FieldChange[]): FieldChange[] {
  const importantFields = [
    // Campos principales del producto
    'lote',
    'producto',
    'producto_id',
    'envase',
    'envase_tipo',
    'presentacion',
    
    // Fechas importantes
    'fechaproduccion',
    'fechavencimiento',
    'fecha_produccion',
    'fecha_vencimiento',
    
    // Responsables
    'responsable_produccion',
    'supervisor_calidad',
    'responsable_analisis_pt',
    'created_by',
    'updated_by',
    
    // Estado y liberación
    'status',
    'liberacion_inicial',
    'verificacion_aleatoria',
    'liberado',
    
    // Campos de calidad
    'observaciones',
    'ph',
    'brix',
    'acidez',
    'temperatura',
    'temperatura_envasado',
    
    // Campos de análisis PT
    'no_mezcla_pt',
    'vacio_pt',
    'peso_neto_real_pt',
    'peso_drenado_real_pt',
    'brix_pt',
    'ph_pt',
    'acidez_pt',
    'ppm_so2_pt',
    'consistencia_pt',
    'sensorial_pt',
    'tapado_cierre_pt',
    'etiqueta_pt',
    'presentacion_final_pt',
    'ubicacion_muestra_pt',
    'estado_pt',
    'observaciones_pt',
    
    // Campos de pesos
    'peso_neto_declarado',
    'peso_drenado_declarado',
    'peso_neto_real',
    'peso_drenado_real',
    
    // Campos de verificaciones
    'analisis_sensorial',
    'prueba_hermeticidad',
    'verificacion_bpm',
    'verificacion_haccp'
  ];
  
  const filtered = changes.filter(change => importantFields.includes(change.field));
  console.log(`CAMBIOS IMPORTANTES: ${filtered.length} de ${changes.length}`);
  
  return filtered;
}

/**
 * Formatea el valor para mostrar en la UI
 * MEJORADO: Mejor manejo de diferentes tipos de datos
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
    return value.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Si es un string que parece fecha, formatearlo
  if (typeof value === 'string') {
    const PT_ANALYSES_MARKER = '__PT_ANALYSES_JSON__';
    const markerIdx = value.indexOf(PT_ANALYSES_MARKER);
    if (markerIdx !== -1) {
      const base = String(value.slice(0, markerIdx)).trim();
      const after = String(value.slice(markerIdx + PT_ANALYSES_MARKER.length)).trim();
      try {
        const parsed = JSON.parse(after);
        const extras = Array.isArray(parsed) ? parsed : [];
        const count = extras.length;
        if (base) {
          return `${base} (Análisis PT adicionales: ${count})`;
        }
        return `Análisis PT adicionales: ${count}`;
      } catch {
        if (base) return base;
        return 'Análisis PT adicionales';
      }
    }

    // Intentar parsear como fecha si tiene formato de fecha
    const dateRegex = /^\d{4}-\d{2}-\d{2}/;
    if (dateRegex.test(value)) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      } catch (e) {
        // Si falla, continuar con el valor original
      }
    }
    
    // Para strings muy largos, truncar
    if (value.length > 100) {
      return value.substring(0, 100) + '...';
    }
  }
  
  // Para números, formatear apropiadamente
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return value.toLocaleString('es-ES');
    } else {
      return value.toLocaleString('es-ES', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      });
    }
  }
  
  // Para arrays, mostrar como lista
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return value.map(v => formatAuditValue(v)).join(', ');
  }
  
  // Para objetos, mostrar como JSON formateado
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return '[Objeto]';
    }
  }
  
  // Por defecto, convertir a string
  return String(value);
}

/**
 * Convierte camelCase a texto legible
 */
function camelCaseToReadable(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function snakeCaseToReadable(str: string): string {
  const acronyms: Record<string, string> = {
    pt: 'PT',
    ph: 'pH',
    ppm: 'PPM',
    so2: 'SO2',
    am: 'AM',
    pm: 'PM'
  };

  const parts = str
    .split('_')
    .filter(Boolean)
    .map((p) => {
      const lower = p.toLowerCase();
      if (acronyms[lower]) return acronyms[lower];
      return lower;
    });

  if (parts.length === 0) return '';

  const first = parts[0];
  const rest = parts.slice(1);

  const capFirst = first === first.toUpperCase() ? first : first.charAt(0).toUpperCase() + first.slice(1);
  return [capFirst, ...rest].join(' ');
}

/**
 * Mapeo de nombres de campos a nombres amigables
 * MEJORADO: Más campos y mejor organización
 */
const fieldNames: Record<string, string> = {
  // Campos principales
  'id': 'ID',
  'lote': 'Lote',
  'producto': 'Producto',
  'producto_id': 'ID Producto',
  'envase': 'Envase',
  'envase_tipo': 'Tipo de Envase',
  'presentacion': 'Presentación',
  'status': 'Estado',
  'observaciones': 'Observaciones',
  
  // Fechas
  'fechaproduccion': 'Fecha de Producción',
  'fechavencimiento': 'Fecha de Vencimiento',
  'fecha_produccion': 'Fecha de Producción',
  'fecha_vencimiento': 'Fecha de Vencimiento',
  'fecha_analisis_pt': 'Fecha Análisis PT',
  'created_at': 'Fecha de Creación',
  'updated_at': 'Fecha de Actualización',
  
  // Responsables
  'responsable_produccion': 'Responsable de Producción',
  'supervisor_calidad': 'Supervisor de Calidad',
  'responsable_analisis_pt': 'Responsable Análisis PT',
  'created_by': 'Creado por',
  'updated_by': 'Editado por',
  
  // Campos de calidad
  'ph': 'pH',
  'brix': 'Brix',
  'acidez': 'Acidez',
  'temperatura': 'Temperatura',
  'temperatura_envasado': 'Temperatura de Envasado',
  'tempam1': 'Temperatura AM 1',
  'tempam2': 'Temperatura AM 2',
  'temppm1': 'Temperatura PM 1',
  'temppm2': 'Temperatura PM 2',
  
  // Campos de pesos
  'peso_neto_declarado': 'Peso Neto Declarado',
  'peso_drenado_declarado': 'Peso Drenado Declarado',
  'peso_neto_real': 'Peso Neto Real',
  'peso_drenado_real': 'Peso Drenado Real',

  // Producción - Pesos drenados (labels del modal)
  'total_unidades_revisar_drenado': 'Nº Unidades a Revisar',
  'rango_peso_drenado_min': 'Rango Peso (Mín)',
  'rango_peso_drenado_max': 'Rango Peso (Max)',
  'pesos_drenados': 'Pesos Drenados',
  'promedio_peso_drenado': 'Promedio de Peso',
  'encima_peso_drenado': 'Pesos por Encima',
  'debajo_peso_drenado': 'Pesos por Debajo',
  'und_incumplen_rango_drenado': '# Und. Incumplen',
  'porcentaje_incumplen_rango_drenado': '% Und. Incumplen',

  // Producción - Pesos netos (labels del modal)
  'total_unidades_revisar_neto': 'Nº Unidades a Revisar',
  'pesos_netos': 'Pesos Netos',
  'promedio_peso_neto': 'Promedio de Peso',
  'encima_peso_neto': 'Pesos por Encima',
  'debajo_peso_neto': 'Pesos por Debajo',
  'und_incumplen_rango_neto': '# Und. Incumplen',
  'porcentaje_incumplen_rango_neto': '% Und. Incumplen',
  
  // Campos de liberación
  'liberacion_inicial': 'Liberación Inicial',
  'verificacion_aleatoria': 'Verificación Aleatoria',
  'liberado': 'Liberado',
  
  // Campos de análisis PT
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
  
  // Campos de verificación
  'analisis_sensorial': 'Análisis Sensorial',
  'prueba_hermeticidad': 'Prueba Hermeticidad',
  'verificacion_bpm': 'Verificación BPM',
  'verificacion_haccp': 'Verificación HACCP',
  
  // Campos especiales
  'CREATED_RECORD': 'Registro Creado',
  'DELETED_RECORD': 'Registro Eliminado',
  'UPDATED_RECORD': 'Registro Actualizado',
  
  // Campos adicionales
  'tamano_lote': 'Tamaño de Lote',
  'letratamano_muestra': 'Letra Tamaño Muestra',
  'inspeccion_micropesaje_mezcla': 'Inspección Micropesaje Mezcla',
  'inspeccion_micropesaje_despulpado': 'Inspección Micropesaje Despulpado',
  'inspeccion_micropesaje_refinado': 'Inspección Micropesaje Refinado',
  'inspeccion_micropesaje_filtrado': 'Inspección Micropesaje Filtrado',
  'inspeccion_micropesaje_pasteurizacion': 'Inspección Micropesaje Pasteurización',
  'inspeccion_micropesaje_envasado': 'Inspección Micropesaje Envasado',
  'inspeccion_micropesaje_etiquetado': 'Inspección Micropesaje Etiquetado',
  'inspeccion_micropesaje_empacado': 'Inspección Micropesaje Empacado',
  'inspeccion_micropesaje_almacenamiento': 'Inspección Micropesaje Almacenamiento',
  'inspeccion_micropesaje_distribucion': 'Inspección Micropesaje Distribución',
  
  // Observaciones específicas
  'observacionesPesoNeto': 'Observaciones Peso Neto',
  'observacionesPesoDrenado': 'Observaciones Peso Drenado',
  'observacionesAnalisisPruebas': 'Observaciones Análisis Pruebas',
  'observaciones_generales': 'Observaciones Generales',
  'observaciones_calidad': 'Observaciones Calidad',
  'observaciones_produccion': 'Observaciones Producción',

  // Embalaje (labels del formato/modal)
  'fecha': 'Fecha',
  'nivel_inspeccion': 'Nivel Inspección',
  'cajas_revisadas': 'Cajas Revisadas',
  'total_unidades_revisadas': 'Total Unidades Revisadas',
  'total_unidades_revisadas_real': 'Total Unidades Revisadas Real',
  'unidades_faltantes': 'Unidades Faltantes',
  'porcentaje_faltantes': 'Porcentaje Faltantes',
  'observaciones_faltantes': 'Observaciones Faltantes',
  'etiqueta': 'Etiqueta',
  'porcentaje_etiqueta_no_conforme': '% Etiqueta No Conforme',
  'observaciones_etiqueta': 'Observaciones Etiqueta',
  'marcacion': 'Marcación',
  'porcentaje_marcacion_no_conforme': '% Marcación No Conforme',
  'observaciones_marcacion': 'Observaciones Marcación',
  'presentacion_no_conforme': 'Presentación No Conforme',
  'porcentaje_presentacion_no_conforme': '% Presentación No Conforme',
  'observaciones_presentacion': 'Observaciones Presentación',
  'cajas': 'Cajas',
  'porcentaje_cajas_no_conformes': '% Cajas No Conformes',
  'observaciones_cajas': 'Observaciones Cajas',
  'correccion': 'Acciones Correctivas',
  'responsable_identificador_cajas': 'Responsable Identificador Cajas',
  'responsable_embalaje': 'Responsable Embalaje',
  'responsable_calidad': 'Responsable Calidad',
  'unidades_no_conformes': 'Unidades No Conformes',
  'porcentaje_incumplimiento': '% Incumplimiento',
  'limpieza_area': 'Limpieza Área',
  'responsable_limpieza': 'Responsable Limpieza',
  'fecha_limpieza': 'Fecha Limpieza',
  'observaciones_limpieza': 'Observaciones Limpieza',
  'cronograma_implementacion': 'Cronograma Implementación',
  'fecha_inicio_cronograma': 'Fecha Inicio Cronograma',
  'fecha_fin_cronograma': 'Fecha Fin Cronograma',
  'responsable_cronograma': 'Responsable Cronograma',
  
  // Campos de control
  'control_temperatura': 'Control Temperatura',
  'control_ph': 'Control pH',
  'control_brix': 'Control Brix',
  'control_acidez': 'Control Acidez',
  'control_peso': 'Control Peso',
  'control_volumen': 'Control Volumen',
  'control_presion': 'Control Presión',
  'control_humedad': 'Control Humedad',
  'control_tiempo': 'Control Tiempo',
  'control_velocidad': 'Control Velocidad',
  'control_flujo': 'Control Flujo',
  'control_nivel': 'Control Nivel',
  'control_concentracion': 'Control Concentración',
  'control_densidad': 'Control Densidad',
  'control_viscosidad': 'Control Viscosidad',
  'control_color': 'Control Color',
  'control_olor': 'Control Olor',
  'control_sabor': 'Control Sabor',
  'control_textura': 'Control Textura',
  'control_apariencia': 'Control Apariencia',
  'control_pureza': 'Control Pureza',
  'control_calidad': 'Control Calidad',
  'control_seguridad': 'Control Seguridad',
  'control_higiene': 'Control Higiene',
  'control_limpieza': 'Control Limpieza',
  'control_desinfeccion': 'Control Desinfección',
  'control_esterilizacion': 'Control Esterilización',
  'control_sanitizacion': 'Control Sanitización',
  'control_mantenimiento': 'Control Mantenimiento',
  'control_calibracion': 'Control Calibración',
  'control_validacion': 'Control Validación',
  'control_verificacion': 'Control Verificación',
  'control_documentacion': 'Control Documentación',
  'control_registro': 'Control Registro',
  'control_reporte': 'Control Reporte',
  'control_analisis': 'Control Análisis',
  'control_evaluacion': 'Control Evaluación',
  'control_seguimiento': 'Control Seguimiento',
  'control_monitoreo': 'Control Monitoreo',
  'control_auditoria': 'Control Auditoría',
  'control_inspeccion': 'Control Inspección',
  'control_revision': 'Control Revisión',
  'control_aprobacion': 'Control Aprobación',
  'control_rechazo': 'Control Rechazo',
  'control_devolucion': 'Control Devolución',
  'control_retencion': 'Control Retención',
  'control_liberacion': 'Control Liberación',
  'control_cuarentena': 'Control Cuarentena',
  'control_destruccion': 'Control Destrucción',
  'control_reproceso': 'Control Reproceso',
  'control_reciclaje': 'Control Reciclaje',
  'control_recuperacion': 'Control Recuperación',
  'control_reutilizacion': 'Control Reutilización'
};

/**
 * Obtiene el nombre amigable de un campo
 */
export function getFieldDisplayName(fieldName: string): string {
  // Buscar primero en el diccionario
  if (fieldNames[fieldName]) {
    return fieldNames[fieldName];
  }
  
  // Si no encuentra el campo en el diccionario, convertir automáticamente
  if (fieldName.includes('_')) {
    return snakeCaseToReadable(fieldName);
  }

  return camelCaseToReadable(fieldName);
}

/**
 * Determina si un cambio es reciente (últimas 24 horas)
 * MEJORADO: Más preciso y configurable
 */
export function isRecentChange(changeDate: Date | string, hours: number = 24): boolean {
  const now = new Date();
  const date = changeDate instanceof Date ? changeDate : new Date(changeDate);
  
  // Verificar si la fecha es válida
  if (isNaN(date.getTime())) {
    console.warn('Fecha inválida en isRecentChange:', changeDate);
    return false;
  }
  
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  const isRecent = diffInHours <= hours;
  
  return isRecent;
}

/**
 * Agrupa cambios por campo para mejor visualización
 * MEJORADO: Mejor ordenamiento y agrupación
 */
export function groupChangesByField(changes: any[]): Record<string, any[]> {
  const grouped = changes.reduce((groups, change) => {
    const fieldName = change.field_name || change.field;
    if (!groups[fieldName]) {
      groups[fieldName] = [];
    }
    groups[fieldName].push(change);
    return groups;
  }, {} as Record<string, any[]>);
  
  // Ordenar los campos alfabéticamente
  const sortedGroups: Record<string, any[]> = {};
  Object.keys(grouped)
    .sort()
    .forEach(key => {
      sortedGroups[key] = grouped[key];
    });
  
  return sortedGroups;
}

/**
 * Obtiene el color según la antigüedad del cambio
 * MEJORADO: Más granularidad y mejor visual
 */
export function getChangeColor(changeDate: Date | string): string {
  const now = new Date();
  const date = changeDate instanceof Date ? changeDate : new Date(changeDate);
  
  // Verificar si la fecha es válida
  if (isNaN(date.getTime())) {
    return 'text-gray-600 bg-gray-50 border-gray-200'; // Antiguo por defecto
  }
  
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours <= 0.5) return 'text-red-700 bg-red-100 border-red-300'; // Últimos 30 min
  if (diffInHours <= 1) return 'text-red-600 bg-red-50 border-red-200'; // Última hora
  if (diffInHours <= 6) return 'text-orange-600 bg-orange-50 border-orange-200'; // Últimas 6h
  if (diffInHours <= 24) return 'text-orange-500 bg-orange-50 border-orange-200'; // Últimas 24h
  if (diffInHours <= 72) return 'text-blue-600 bg-blue-50 border-blue-200'; // Últimos 3 días
  if (diffInHours <= 168) return 'text-blue-500 bg-blue-50 border-blue-200'; // Última semana
  
  return 'text-gray-600 bg-gray-50 border-gray-200'; // Más antiguo
}

/**
 * Obtiene una descripción del cambio
 */
export function getChangeDescription(change: any): string {
  const fieldName = getFieldDisplayName(change.field_name || change.field);
  const oldValue = formatAuditValue(change.old_value);
  const newValue = formatAuditValue(change.new_value);
  
  if (change.field_name === 'CREATED_RECORD') {
    return `Registro creado por ${change.changed_by}`;
  }
  
  if (change.field_name === 'DELETED_RECORD') {
    return `Registro eliminado por ${change.changed_by}`;
  }
  
  if (change.field_name === 'UPDATED_RECORD') {
    return `Registro actualizado por ${change.changed_by}`;
  }
  
  if (oldValue === 'N/A' || oldValue === null || oldValue === undefined) {
    return `${fieldName}: establecido como "${newValue}"`;
  }
  
  if (newValue === 'N/A' || newValue === null || newValue === undefined) {
    return `${fieldName}: eliminado (era "${oldValue}")`;
  }
  
  return `${fieldName}: cambiado de "${oldValue}" a "${newValue}"`;
}

/**
 * Filtra cambios por tipo
 */
export function filterChangesByType(changes: any[], type: 'important' | 'recent' | 'all'): any[] {
  switch (type) {
    case 'important':
      return getImportantChanges(changes.map(c => ({
        field: c.field_name || c.field,
        oldValue: c.old_value,
        newValue: c.new_value
      })));
    
    case 'recent':
      return changes.filter(change => 
        isRecentChange(change.created_at, 24)
      );
    
    case 'all':
    default:
      return changes;
  }
}

/**
 * Estadísticas de cambios
 */
export function getChangeStats(changes: any[]): {
  total: number;
  recent: number;
  important: number;
  byField: Record<string, number>;
  byUser: Record<string, number>;
} {
  const now = new Date();
  const recent = changes.filter(change => 
    isRecentChange(change.created_at, 24)
  );
  
  const important = getImportantChanges(changes.map(c => ({
    field: c.field_name || c.field,
    oldValue: c.old_value,
    newValue: c.new_value
  })));
  
  const byField: Record<string, number> = {};
  const byUser: Record<string, number> = {};
  
  changes.forEach(change => {
    const field = change.field_name || change.field;
    const user = change.changed_by;
    
    byField[field] = (byField[field] || 0) + 1;
    byUser[user] = (byUser[user] || 0) + 1;
  });
  
  return {
    total: changes.length,
    recent: recent.length,
    important: important.length,
    byField,
    byUser
  };
}
