-- ========================================
-- RE-CAL-022: Registro de Preparación de Medios de Cultivo y Control Negativo
-- Script para crear la tabla en PostgreSQL
-- ========================================

-- 1. Crear la tabla principal
CREATE TABLE IF NOT EXISTS medios_cultivo (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL, -- Fecha del registro
    medio_cultivo VARCHAR(255) NOT NULL, -- Nombre del medio de cultivo
    cantidad_ml DECIMAL(10,2) NOT NULL, -- Cantidad en mililitros
    cantidad_medio_cultivo_g DECIMAL(10,2) NOT NULL, -- Cantidad del medio de cultivo en gramos
    control_negativo_inicio VARCHAR(255) NOT NULL, -- Control negativo al inicio
    control_negativo_final VARCHAR(255) NOT NULL, -- Control negativo al final
    control_negativo_cumple VARCHAR(10) NOT NULL, -- Control negativo cumple (Sí/No)
    control_negativo_no_cumple VARCHAR(10) NOT NULL, -- Control negativo no cumple (Sí/No)
    accion_correctiva TEXT, -- Acción correctiva realizada
    observaciones TEXT,
    responsable VARCHAR(255) NOT NULL, -- Nombre del responsable
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_medios_cultivo_fecha ON medios_cultivo(fecha);
CREATE INDEX IF NOT EXISTS idx_medios_cultivo_medio ON medios_cultivo(medio_cultivo);
CREATE INDEX IF NOT EXISTS idx_medios_cultivo_responsable ON medios_cultivo(responsable);

-- 3. Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP; 
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_medios_cultivo_updated_at ON medios_cultivo;
CREATE TRIGGER update_medios_cultivo_updated_at 
    BEFORE UPDATE ON medios_cultivo 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Insertar datos de ejemplo (opcional)
INSERT INTO medios_cultivo (
    fecha, 
    medio_cultivo, 
    cantidad_ml, 
    cantidad_medio_cultivo_g, 
    control_negativo_inicio, 
    control_negativo_final, 
    control_negativo_cumple, 
    control_negativo_no_cumple, 
    accion_correctiva, 
    responsable, 
    observaciones
) VALUES
    (
        '2024-01-15', 
        'TSA', 
        500.00, 
        25.50, 
        'E. coli ATCC 25922', 
        'E. coli ATCC 25922', 
        'Sí', 
        'No', 
        'Control exitoso, no se requiere acción correctiva', 
        'Juan David Castañeda Ortiz', 
        'Medio preparado para control de calidad diario'
    ),
    (
        '2024-01-16', 
        'McConkey', 
        750.00, 
        37.50, 
        'Salmonella ATCC 14028', 
        'Salmonella ATCC 14028', 
        'No', 
        'Sí', 
        'Repetir proceso de esterilización, verificar concentración del medio', 
        'Ana María García López', 
        'Control fallido, se repite el proceso'
    ),
    (
        '2024-01-17', 
        'SSA', 
        1000.00, 
        50.00, 
        'Staphylococcus aureus ATCC 25923', 
        'Staphylococcus aureus ATCC 25923', 
        'Sí', 
        'No', 
        'Control exitoso', 
        'Carlos Rodríguez Martínez', 
        'Medio selectivo para hongos'
    ),
    (
        '2024-01-18', 
        'Agar Sangre', 
        300.00, 
        15.00, 
        'Streptococcus pyogenes ATCC 19615', 
        'Streptococcus pyogenes ATCC 19615', 
        'Sí', 
        'No', 
        'Control exitoso', 
        'María Fernanda Castro', 
        'Medio enriquecido para cocos gram positivos'
    ),
    (
        '2024-01-19', 
        'Czapek-Dox', 
        2000.00, 
        100.00, 
        'Aspergillus niger ATCC 9642', 
        'Aspergillus niger ATCC 9642', 
        'No', 
        'Sí', 
        'Ajustar pH del medio a 5.5', 
        'Luis Alberto Torres', 
        'Medio para hongos filamentosos'
    ),
    (
        '2024-01-20', 
        'TSI', 
        400.00, 
        20.00, 
        'Pseudomonas aeruginosa ATCC 27853', 
        'Pseudomonas aeruginosa ATCC 27853', 
        'Sí', 
        'No', 
        'Control exitoso', 
        'Patricia Morales Díaz', 
        'Medio triple azúcar con indicador'
    )
ON CONFLICT DO NOTHING;

-- 6. Agregar comentarios descriptivos
COMMENT ON TABLE medios_cultivo IS 'RE-CAL-022: Registro de preparación de medios de cultivo y control negativo';
COMMENT ON COLUMN medios_cultivo.fecha IS 'Fecha de preparación del medio de cultivo';
COMMENT ON COLUMN medios_cultivo.medio_cultivo IS 'Nombre del medio de cultivo (ej: TSA, McConkey, SSA, etc.)';
COMMENT ON COLUMN medios_cultivo.cantidad_ml IS 'Cantidad del medio de cultivo en mililitros';
COMMENT ON COLUMN medios_cultivo.cantidad_medio_cultivo_g IS 'Cantidad del medio de cultivo en gramos';
COMMENT ON COLUMN medios_cultivo.control_negativo_inicio IS 'Control negativo al inicio';
COMMENT ON COLUMN medios_cultivo.control_negativo_final IS 'Control negativo al final';
COMMENT ON COLUMN medios_cultivo.control_negativo_cumple IS 'Control negativo cumple (Sí/No)';
COMMENT ON COLUMN medios_cultivo.control_negativo_no_cumple IS 'Control negativo no cumple (Sí/No)';
COMMENT ON COLUMN medios_cultivo.accion_correctiva IS 'Acción correctiva realizada';
COMMENT ON COLUMN medios_cultivo.lote IS 'Número de lote del medio de cultivo';
COMMENT ON COLUMN medios_cultivo.fecha_vencimiento IS 'Fecha de vencimiento del medio de cultivo';
COMMENT ON COLUMN medios_cultivo.preparado_por IS 'Nombre completo de la persona que preparó el medio';
COMMENT ON COLUMN medios_cultivo.autoclave IS 'Identificación del autoclave utilizado para esterilización';
COMMENT ON COLUMN medios_cultivo.temperatura IS 'Temperatura de esterilización en grados Celsius';
COMMENT ON COLUMN medios_cultivo.presion IS 'Presión de esterilización en libras por pulgada cuadrada (psi)';
COMMENT ON COLUMN medios_cultivo.tiempo IS 'Tiempo de esterilización en minutos';
COMMENT ON COLUMN medios_cultivo.control_negativo IS 'Control negativo utilizado para verificación (ej: E. coli ATCC 25922)';
COMMENT ON COLUMN medios_cultivo.observaciones IS 'Notas adicionales sobre la preparación del medio';

-- 7. Verificación
SELECT 'Tabla medios_cultivo creada exitosamente' AS status;
SELECT COUNT(*) as registros_ejemplo_creados FROM medios_cultivo;
