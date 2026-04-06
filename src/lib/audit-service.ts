import pool from '@/lib/db';

interface AuditLogEntry {
  tableName: string;
  recordId: string;
  fieldName: string;
  fieldDisplayName?: string;
  oldValue?: any;
  newValue?: any;
  userName: string;
  userEmail?: string;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE';
}

interface FieldMapping {
  [key: string]: string;
}

// Mapeo de nombres de campos a nombres amigables para mostrar
const PRODUCTION_FIELD_NAMES: FieldMapping = {
  'fechaproduccion': 'Fecha Producción',
  'fechavencimiento': 'Fecha Vencimiento',
  'mescorte': 'Mes de Corte',
  'producto': 'Producto',
  'lote': 'Lote',
  'tamano_lote': 'Tamaño Lote',
  'area': 'Área',
  'equipo': 'Equipo',
  'liberacion_inicial': 'Liberación Inicial',
  'verificacion_aleatoria': 'Verificación Aleatoria',
  'tempam1': 'Temperatura AM 1',
  'tempam2': 'Temperatura AM 2',
  'tempm1': 'Temperatura PM 1',
  'tempm2': 'Temperatura PM 2',
  'analisis_sensorial': 'Análisis Sensorial',
  'prueba_hermeticidad': 'Prueba Hermeticidad',
  'inspeccion_micropesaje_mezcla': 'Inspección Micropesaje Mezcla',
  'inspeccion_micropesaje_resultado': 'Resultado Micropesaje',
  'total_unidades_revisar_drenado': 'Total Unidades Drenado',
  'peso_drenado_declarado': 'Peso Drenado Declarado',
  'promedio_peso_drenado': 'Promedio Peso Drenado',
  'total_unidades_revisar_neto': 'Total Unidades Revisar Neto',
  'peso_neto_declarado': 'Peso Neto Declarado',
  'promedio_peso_neto': 'Promedio Peso Neto',
  'pruebas_vacio': 'Pruebas Vacío',
  'responsable_produccion': 'Responsable Producción',
  'fecha_analisis_pt': 'Fecha Análisis PT',
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
  'responsable_analisis_pt': 'Responsable Análisis PT',
  'observaciones': 'Observaciones Generales',
  'status': 'Estado',
  'created_by': 'Creado Por',
  'updated_by': 'Actualizado Por'
};

const EMBALAJE_FIELD_NAMES: FieldMapping = {
  'fecha': 'Fecha',
  'mescorte': 'Mes de Corte',
  'producto': 'Producto',
  'presentacion': 'Presentación',
  'lote': 'Lote',
  'tamano_lote': 'Tamaño Lote',
  'nivel_inspeccion': 'Nivel Inspección',
  'cajas_revisadas': 'Cajas Revisadas',
  'total_unidades_revisadas': 'Total Unidades Revisadas',
  'total_unidades_revisadas_real': 'Total Unidades Revisadas Real',
  'unidades_faltantes': 'Unidades Faltantes',
  'porcentaje_faltantes': 'Porcentaje Faltantes',
  'etiqueta': 'Etiqueta',
  'porcentaje_etiqueta_no_conforme': '% Etiqueta No Conforme',
  'marcacion': 'Marcación',
  'porcentaje_marcacion_no_conforme': '% Marcación No Conforme',
  'presentacion_no_conforme': 'Presentación No Conforme',
  'porcentaje_presentacion_no_conforme': '% Presentación No Conforme',
  'cajas': 'Cajas',
  'porcentaje_cajas_no_conformes': '% Cajas No Conformes',
  'responsable_identificador_cajas': 'Responsable Identificador Cajas',
  'responsable_embalaje': 'Responsable Embalaje',
  'responsable_calidad': 'Responsable Calidad',
  'unidades_no_conformes': 'Unidades No Conformes',
  'porcentaje_incumplimiento': '% Incumplimiento',
  'observaciones_generales': 'Observaciones Generales',
  'status': 'Estado',
  'created_by': 'Creado Por',
  'updated_by': 'Actualizado Por'
};

class AuditService {
  /**
   * Registra un cambio en un campo específico
   */
  static async logFieldChange(entry: AuditLogEntry): Promise<void> {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO audit_log (
          table_name, record_id, field_name, field_display_name,
          old_value, new_value, user_name, user_email, action_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      
      await client.query(query, [
        entry.tableName,
        entry.recordId,
        entry.fieldName,
        entry.fieldDisplayName || entry.fieldName,
        entry.oldValue ? JSON.stringify(entry.oldValue) : null,
        entry.newValue ? JSON.stringify(entry.newValue) : null,
        entry.userName,
        entry.userEmail || null,
        entry.actionType
      ]);
      
      console.log(`🔍 Audit log: ${entry.actionType} ${entry.tableName}.${entry.fieldName} by ${entry.userName}`);
    } catch (error) {
      console.error('❌ Error al guardar audit log:', error);
    } finally {
      client.release();
    }
  }

  /**
   * Compara dos objetos y registra los campos que cambiaron
   */
  static async logChanges(
    tableName: string,
    recordId: string,
    oldData: any,
    newData: any,
    userName: string,
    userEmail?: string,
    actionType: 'CREATE' | 'UPDATE' = 'UPDATE'
  ): Promise<void> {
    const fieldNames = tableName === 'production_records' ? PRODUCTION_FIELD_NAMES : EMBALAJE_FIELD_NAMES;
    
    for (const [fieldName, newValue] of Object.entries(newData)) {
      const oldValue = oldData?.[fieldName];
      
      // Solo registrar si el valor cambió o es CREATE
      if (actionType === 'CREATE' || JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        await this.logFieldChange({
          tableName,
          recordId,
          fieldName,
          fieldDisplayName: fieldNames[fieldName],
          oldValue,
          newValue,
          userName,
          userEmail,
          actionType
        });
      }
    }
  }

  /**
   * Obtiene los logs de auditoría para un registro
   */
  static async getAuditLogs(tableName: string, recordId: string): Promise<any[]> {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          al.*,
          al.field_display_name,
          al.old_value,
          al.new_value,
          al.created_at
        FROM audit_log al
        WHERE al.table_name = $1 AND al.record_id = $2
        ORDER BY al.created_at DESC
      `;
      
      const result = await client.query(query, [tableName, recordId]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error al obtener audit logs:', error);
      return [];
    } finally {
      client.release();
    }
  }
}

export default AuditService;
