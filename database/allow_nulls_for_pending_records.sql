
-- Migración para permitir valores NULL en registros pendientes de producción
-- Esto permite guardar registros como 'pending' sin completar todos los campos

-- Modificar columnas de control de calidad para permitir NULL
ALTER TABLE production_records ALTER COLUMN liberacion_inicial DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN verificacion_aleatoria DROP NOT NULL;

-- Modificar columnas de temperaturas para permitir NULL
ALTER TABLE production_records ALTER COLUMN temp_am1 DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN temp_am2 DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN temp_pm1 DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN temp_pm2 DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN analisis_sensorial DROP NOT NULL;

-- Modificar columna de prueba de hermeticidad para permitir NULL
ALTER TABLE production_records ALTER COLUMN prueba_hermeticidad DROP NOT NULL;

-- Modificar columnas de inspección de micropesaje para permitir NULL
ALTER TABLE production_records ALTER COLUMN inspeccion_micropesaje_mezcla DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN inspeccion_micropesaje_resultado DROP NOT NULL;

-- Modificar columnas de control de peso drenado para permitir NULL
ALTER TABLE production_records ALTER COLUMN total_unidades_revisar_drenado DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN peso_drenado_declarado DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN rango_peso_drenado_min DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN rango_peso_drenado_max DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN pesos_drenados DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN promedio_peso_drenado DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN encima_peso_drenado DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN debajo_peso_drenado DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN und_incumplen_rango_drenado DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN porcentaje_incumplen_rango_drenado DROP NOT NULL;

-- Modificar columnas de control de peso neto para permitir NULL
ALTER TABLE production_records ALTER COLUMN total_unidades_revisar_neto DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN peso_neto_declarado DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN pesos_netos DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN promedio_peso_neto DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN encima_peso_neto DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN debajo_peso_neto DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN und_incumplen_rango_neto DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN porcentaje_incumplen_rango_neto DROP NOT NULL;

-- Modificar columna de pruebas de vacío para permitir NULL
ALTER TABLE production_records ALTER COLUMN pruebas_vacio DROP NOT NULL;

-- Modificar columna de supervisor para permitir NULL (se usará 'Pendiente' como valor por defecto)
ALTER TABLE production_records ALTER COLUMN supervisor_calidad DROP NOT NULL;

-- Modificar columnas de análisis PT para permitir NULL
ALTER TABLE production_records ALTER COLUMN fecha_analisis_pt DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN no_mezcla_pt DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN vacio_pt DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN peso_neto_real_pt DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN peso_drenado_real_pt DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN brix_pt DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN ph_pt DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN acidez_pt DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN ppm_so2_pt DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN consistencia_pt DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN sensorial_pt DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN tapado_cierre_pt DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN etiqueta_pt DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN presentacion_final_pt DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN ubicacion_muestra_pt DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN estado_pt DROP NOT NULL;
ALTER TABLE production_records ALTER COLUMN responsable_analisis_pt DROP NOT NULL;

-- Añadir columna status si no existe (ya debería existir de migraciones anteriores)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='production_records' 
        AND column_name='status'
    ) THEN
        ALTER TABLE production_records ADD COLUMN status VARCHAR(20) DEFAULT 'completed';
        CREATE INDEX IF NOT EXISTS idx_production_records_status ON production_records(status);
    END IF;
END $$;

-- Comentarios sobre la migración
COMMENT ON COLUMN production_records.liberacion_inicial IS 'Resultado de liberación inicial (permite NULL para registros pendientes)';
COMMENT ON COLUMN production_records.verificacion_aleatoria IS 'Resultado de verificación aleatoria (permite NULL para registros pendientes)';
COMMENT ON COLUMN production_records.status IS 'Estado del registro: pending o completed';

-- Confirmación de la migración
SELECT 'Migración completada: Se permiten valores NULL para registros pendientes' as resultado;
