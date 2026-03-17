-- =====================================================
-- CREAR TABLA DE RANGOS DE CALIDAD
-- Tabla separada para configuración de rangos de calidad por producto
-- =====================================================

-- 1. Crear tabla de rangos de calidad
CREATE TABLE IF NOT EXISTS calidad_rangos_config (
    id SERIAL PRIMARY KEY,
    producto_id VARCHAR(50) NOT NULL,
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
    FOREIGN KEY (producto_id) REFERENCES productos(producto_id) ON DELETE CASCADE,
    
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

-- 2. Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_calidad_rangos_producto_id ON calidad_rangos_config(producto_id);
CREATE INDEX IF NOT EXISTS idx_calidad_rangos_envase_tipo ON calidad_rangos_config(envase_tipo);
CREATE UNIQUE INDEX IF NOT EXISTS idx_calidad_rangos_unique ON calidad_rangos_config(producto_id, envase_tipo);

-- 3. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_calidad_rangos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_calidad_rangos_updated_at
    BEFORE UPDATE ON calidad_rangos_config
    FOR EACH ROW
    EXECUTE FUNCTION update_calidad_rangos_timestamp();

-- 4. Vista para consultas optimizadas (opcional)
CREATE OR REPLACE VIEW vista_productos_con_rangos AS
SELECT 
    p.*,
    COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'envase_tipo', cr.envase_tipo,
                'brix_min', cr.brix_min,
                'brix_max', cr.brix_max,
                'ph_min', cr.ph_min,
                'ph_max', cr.ph_max,
                'acidez_min', cr.acidez_min,
                'acidez_max', cr.acidez_max,
                'consistencia_min', cr.consistencia_min,
                'consistencia_max', cr.consistencia_max,
                'ppm_so2_min', cr.ppm_so2_min,
                'ppm_so2_max', cr.ppm_so2_max
            )
        ) FILTER (WHERE cr.envase_tipo IS NOT NULL), 
        '[]'
    ) as calidad_rangos_config
FROM productos p
LEFT JOIN calidad_rangos_config cr ON p.producto_id = cr.producto_id
GROUP BY p.producto_id, p.nombre, p.category_id, p.description, p.created_at, p.updated_at, p.is_active;

-- 5. Verificación
SELECT 
    'TABLA CALIDAD RANGOS CREADA' as status,
    COUNT(*) as total_registros
FROM calidad_rangos_config;
