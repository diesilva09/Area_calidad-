-- ========================================
-- RE-CAL-107: Crear tabla custodia_muestras con cronograma_task_id
-- ========================================

-- 1. Crear la tabla principal (si no existe)
CREATE TABLE IF NOT EXISTS custodia_muestras (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    muestra_id VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    temperatura VARCHAR(50) NOT NULL,
    cantidad VARCHAR(100) NOT NULL,
    motivo TEXT NOT NULL,
    tipo_analisis_sl VARCHAR(10),
    tipo_analisis_bc VARCHAR(10),
    tipo_analisis_ym VARCHAR(10),
    tipo_analisis_tc VARCHAR(10),
    tipo_analisis_ec VARCHAR(10),
    tipo_analisis_ls VARCHAR(10),
    tipo_analisis_etb VARCHAR(10),
    tipo_analisis_xsa VARCHAR(10),
    toma_muestra_fecha DATE NOT NULL,
    toma_muestra_hora TIME NOT NULL,
    recepcion_lab_fecha DATE NOT NULL,
    recepcion_lab_hora TIME NOT NULL,
    medio_transporte VARCHAR(255) NOT NULL,
    responsable VARCHAR(255) NOT NULL,
    observaciones TEXT,
    cronograma_task_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear índices
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_codigo ON custodia_muestras(codigo);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_muestra_id ON custodia_muestras(muestra_id);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_area ON custodia_muestras(area);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_tipo ON custodia_muestras(tipo);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_toma_fecha ON custodia_muestras(toma_muestra_fecha);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_recepcion_fecha ON custodia_muestras(recepcion_lab_fecha);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_responsable ON custodia_muestras(responsable);

-- Índices para tipos de análisis
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_sl ON custodia_muestras(tipo_analisis_sl);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_bc ON custodia_muestras(tipo_analisis_bc);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_ym ON custodia_muestras(tipo_analisis_ym);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_tc ON custodia_muestras(tipo_analisis_tc);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_ec ON custodia_muestras(tipo_analisis_ec);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_ls ON custodia_muestras(tipo_analisis_ls);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_etb ON custodia_muestras(tipo_analisis_etb);
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_xsa ON custodia_muestras(tipo_analisis_xsa);

-- Índice para relación con cronograma
CREATE INDEX IF NOT EXISTS idx_custodia_muestras_cronograma_task_id ON custodia_muestras(cronograma_task_id);
