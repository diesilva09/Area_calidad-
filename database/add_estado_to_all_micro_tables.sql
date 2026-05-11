-- ========================================
-- Agregar columna estado a todas las tablas de microbiología
-- NOTA: Las tablas están en el esquema lab_microbiologia
-- ========================================

-- RE-CAL-021: Condiciones Ambientales
ALTER TABLE lab_microbiologia.condiciones_ambientales ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'completado';
CREATE INDEX IF NOT EXISTS idx_condiciones_ambientales_estado ON lab_microbiologia.condiciones_ambientales(estado);
UPDATE lab_microbiologia.condiciones_ambientales SET estado = 'completado' WHERE estado IS NULL;

-- RE-CAL-016: Temperatura Equipos
ALTER TABLE lab_microbiologia.temperatura_equipos ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'completado';
CREATE INDEX IF NOT EXISTS idx_temperatura_equipos_estado ON lab_microbiologia.temperatura_equipos(estado);
UPDATE lab_microbiologia.temperatura_equipos SET estado = 'completado' WHERE estado IS NULL;

-- RE-CAL-017: Esterilización Autoclave
ALTER TABLE lab_microbiologia.esterilizacion_autoclave ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'completado';
CREATE INDEX IF NOT EXISTS idx_esterilizacion_autoclave_estado ON lab_microbiologia.esterilizacion_autoclave(estado);
UPDATE lab_microbiologia.esterilizacion_autoclave SET estado = 'completado' WHERE estado IS NULL;

-- RE-CAL-038: Incubadora Control
ALTER TABLE lab_microbiologia.incubadora_control ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'completado';
CREATE INDEX IF NOT EXISTS idx_incubadora_control_estado ON lab_microbiologia.incubadora_control(estado);
UPDATE lab_microbiologia.incubadora_control SET estado = 'completado' WHERE estado IS NULL;

-- RE-CAL-015: Medios de Cultivo
ALTER TABLE lab_microbiologia.medios_cultivo ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'completado';
CREATE INDEX IF NOT EXISTS idx_medios_cultivo_estado ON lab_microbiologia.medios_cultivo(estado);
UPDATE lab_microbiologia.medios_cultivo SET estado = 'completado' WHERE estado IS NULL;

-- RE-CAL-044: Registros Recepción Formatos
ALTER TABLE lab_microbiologia.registros_recepcion_formatos ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'completado';
CREATE INDEX IF NOT EXISTS idx_registros_recepcion_formatos_estado ON lab_microbiologia.registros_recepcion_formatos(estado);
UPDATE lab_microbiologia.registros_recepcion_formatos SET estado = 'completado' WHERE estado IS NULL;

-- RE-CAL-046: Resultados Microbiológicos
ALTER TABLE lab_microbiologia.resultados_microbiologicos ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'completado';
CREATE INDEX IF NOT EXISTS idx_resultados_microbiologicos_estado ON lab_microbiologia.resultados_microbiologicos(estado);
UPDATE lab_microbiologia.resultados_microbiologicos SET estado = 'completado' WHERE estado IS NULL;

-- RE-CAL-011: Control Lavado Inactivación
ALTER TABLE lab_microbiologia.control_lavado_inactivacion ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'completado';
CREATE INDEX IF NOT EXISTS idx_control_lavado_inactivacion_estado ON lab_microbiologia.control_lavado_inactivacion(estado);
UPDATE lab_microbiologia.control_lavado_inactivacion SET estado = 'completado' WHERE estado IS NULL;

-- RE-CAL-107: Custodia Muestras (ya tiene estado, solo verificar)
ALTER TABLE lab_microbiologia.custodia_muestras ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'completado';
UPDATE lab_microbiologia.custodia_muestras SET estado = 'completado' WHERE estado IS NULL;

-- Verificar que las columnas fueron agregadas
SELECT 
    table_schema,
    table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'lab_microbiologia'
AND table_name IN (
    'condiciones_ambientales',
    'temperatura_equipos',
    'esterilizacion_autoclave',
    'incubadora_control',
    'medios_cultivo',
    'registros_recepcion_formatos',
    'resultados_microbiologicos',
    'control_lavado_inactivacion',
    'custodia_muestras'
)
AND column_name = 'estado'
ORDER BY table_name;