-- =====================================================
-- CORRECCIÓN: Eliminar columna incorrecta y crear tabla separada
-- Se agregó incorrectamente calidad_rangos_config como columna, debe ser tabla separada
-- =====================================================

-- 1. Eliminar columna incorrecta de productos
ALTER TABLE productos 
DROP COLUMN IF EXISTS calidad_rangos_config;

-- 2. Crear tabla separada de rangos de calidad
CREATE TABLE IF NOT EXISTS calidad_rangos_config (
    id SERIAL PRIMARY KEY,
    products_id VARCHAR(50) NOT NULL,
    envase_tipo VARCHAR(50) NOT NULL,
    brix_min DECIMAL(5,2) DEFAULT 0,
    brix_max DECIMAL(5,2) DEFAULT 0,
    ph_min DECIMAL(4,2) DEFAULT 0,
    ph_max DECIMAL(4,2) DEFAULT 0,
    acidez_min DECIMAL(5,2) DEFAULT 0,
    acidez_max DECIMAL(5,2) DEFAULT 0,
    consistencia_min DECIMAL(5,2) DEFAULT 0,
    consistencia_max DECIMAL(5,2) DEFAULT 0,
    ppm_so2_min INTEGER DEFAULT 0,
    ppm_so2_max INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (products_id) REFERENCES products(id) ON DELETE CASCADE,
    
    -- Constraints para asegurar datos válidos
    CONSTRAINT chk_brix_rango CHECK (brix_min <= brix_max),
    CONSTRAINT chk_ph_rango CHECK (ph_min <= ph_max),
    CONSTRAINT chk_acidez_rango CHECK (acidez_min <= acidez_max),
    CONSTRAINT chk_consistencia_rango CHECK (consistencia_min <= consistencia_max),
    CONSTRAINT chk_so2_rango CHECK (ppm_so2_min <= ppm_so2_max),
    CONSTRAINT chk_valores_positivos CHECK (
        brix_min >= 0 AND brix_max >= 0 AND
        ph_min >= 0 AND ph_max >= 0 AND
        acidez_min >= 0 AND acidez_max >= 0 AND
        consistencia_min >= 0 AND consistencia_max >= 0 AND
        ppm_so2_min >= 0 AND ppm_so2_max >= 0
    )
);

-- 3. Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_calidad_rangos_products_id ON calidad_rangos_config(products_id);
CREATE INDEX IF NOT EXISTS idx_calidad_rangos_envase_tipo ON calidad_rangos_config(envase_tipo);
CREATE UNIQUE INDEX IF NOT EXISTS idx_calidad_rangos_unique ON calidad_rangos_config(products_id, envase_tipo);

-- 4. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_calidad_rangos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_calidad_rangos_updated_at ON calidad_rangos_config;
CREATE TRIGGER trigger_calidad_rangos_updated_at
    BEFORE UPDATE ON calidad_rangos_config
    FOR EACH ROW
    EXECUTE FUNCTION update_calidad_rangos_timestamp();

-- 5. Verificar estructura final
SELECT 
    'ESTRUCTURA CORREGIDA' as status,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'productos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Verificar tabla creada
SELECT 
    'TABLA CALIDAD RANGOS CREADA' as status,
    COUNT(*) as total_registros
FROM calidad_rangos_config;

-- 7. Mostrar estructura de la nueva tabla
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'calidad_rangos_config' 
AND table_schema = 'public'
ORDER BY ordinal_position;
