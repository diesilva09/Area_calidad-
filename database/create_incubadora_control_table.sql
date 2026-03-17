-- ========================================
-- RE-CAL-089: Registro de Operación y Control de Incubadora
-- Script para crear la tabla en PostgreSQL
-- ========================================

-- 1. Crear la tabla principal
CREATE TABLE IF NOT EXISTS incubadora_control (
    id SERIAL PRIMARY KEY,
    muestra VARCHAR(100) NOT NULL, -- Identificador de la muestra
    fecha_ingreso DATE NOT NULL, -- Fecha de ingreso a la incubadora
    hora_ingreso TIME NOT NULL, -- Hora de ingreso a la incubadora
    fecha_salida DATE NOT NULL, -- Fecha de salida de la incubadora
    hora_salida TIME NOT NULL, -- Hora de salida de la incubadora
    responsable VARCHAR(255) NOT NULL, -- Nombre del responsable
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_incubadora_control_muestra ON incubadora_control(muestra);
CREATE INDEX IF NOT EXISTS idx_incubadora_control_fecha_ingreso ON incubadora_control(fecha_ingreso);
CREATE INDEX IF NOT EXISTS idx_incubadora_control_fecha_salida ON incubadora_control(fecha_salida);
CREATE INDEX IF NOT EXISTS idx_incubadora_control_responsable ON incubadora_control(responsable);
CREATE INDEX IF NOT EXISTS idx_incubadora_control_created_at ON incubadora_control(created_at);

-- 3. Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_incubadora_control_updated_at ON incubadora_control;
CREATE TRIGGER update_incubadora_control_updated_at 
    BEFORE UPDATE ON incubadora_control 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Insertar datos de ejemplo (opcional)
INSERT INTO incubadora_control (
    muestra, 
    fecha_ingreso, 
    hora_ingreso, 
    fecha_salida, 
    hora_salida, 
    responsable, 
    observaciones
) VALUES
    (
        'M-001', 
        '2024-01-15', 
        '08:30:00', 
        '2024-01-18', 
        '14:30:00', 
        'Juan David Castañeda Ortiz', 
        'Muestra de agua para análisis microbiológico estándar'
    ),
    (
        'AGUA-002', 
        '2024-01-16', 
        '09:15:00', 
        '2024-01-19', 
        '10:45:00', 
        'Ana María García López', 
        'Control de calidad de agua de proceso'
    ),
    (
        'ALIM-003', 
        '2024-01-17', 
        '07:45:00', 
        '2024-01-20', 
        '16:20:00', 
        'Carlos Rodríguez Martínez', 
        'Muestra de producto terminado para análisis'
    ),
    (
        'SUPERFICIE-004', 
        '2024-01-18', 
        '10:30:00', 
        '2024-01-21', 
        '11:15:00', 
        'María Fernanda Castro', 
        'Hisopado de superficie de equipo de producción'
    ),
    (
        'M-005', 
        '2024-01-19', 
        '08:00:00', 
        '2024-01-22', 
        '15:30:00', 
        'Luis Alberto Torres', 
        'Muestra repetida por resultados anómalos'
    ),
    (
        'CONTROL-006', 
        '2024-01-20', 
        '11:45:00', 
        '2024-01-23', 
        '09:00:00', 
        'Patricia Morales Díaz', 
        'Muestra de control positivo para validación'
    ),
    (
        'PRODUCCION-007', 
        '2024-01-21', 
        '06:30:00', 
        '2024-01-24', 
        '17:45:00', 
        'Roberto Sánchez Pérez', 
        'Muestra de línea de producción en proceso'
    ),
    (
        'LAB-008', 
        '2024-01-22', 
        '13:20:00', 
        '2024-01-25', 
        '12:00:00', 
        'Laura Gómez Hernández', 
        'Muestra de control de ambiente de laboratorio'
    )
ON CONFLICT DO NOTHING;

-- 6. Agregar comentarios descriptivos
COMMENT ON TABLE incubadora_control IS 'RE-CAL-089: Registro de operación y control de incubadora';
COMMENT ON COLUMN incubadora_control.muestra IS 'Identificador único de la muestra en la incubadora';
COMMENT ON COLUMN incubadora_control.fecha_ingreso IS 'Fecha en que la muestra ingresó a la incubadora';
COMMENT ON COLUMN incubadora_control.hora_ingreso IS 'Hora exacta en que la muestra ingresó a la incubadora';
COMMENT ON COLUMN incubadora_control.fecha_salida IS 'Fecha en que la muestra salió de la incubadora';
COMMENT ON COLUMN incubadora_control.hora_salida IS 'Hora exacta en que la muestra salió de la incubadora';
COMMENT ON COLUMN incubadora_control.responsable IS 'Nombre completo de la persona responsable del control';
COMMENT ON COLUMN incubadora_control.observaciones IS 'Notas adicionales sobre la operación de la incubadora';

-- 7. Verificación
SELECT 'Tabla incubadora_control creada exitosamente' AS status;
SELECT COUNT(*) as registros_ejemplo_creados FROM incubadora_control;

CREATE TABLE nivel_inspeccion (
    id PRIMARY key
    lote_min INT 
    lote_max INT
    nivel_inspeccion VARCHAR(5)
    unidades_revisar INT 
);

INSERT TABLE nivel_inspeccion (id, lote_min, lote_max, nivel_inspeccion, unidades_revisar)
VALUES 
('', '16', '25', 'B', '3'),
('', '26', '50', 'B', '3'),
('', '51', '90', 'C', '5'),
('', '91', '150', 'C', '5'),
('', '151', '280', 'D', '8'),
('', '281', '500', 'D', '8'),
('', '510', '1200', 'E', '13'),
('', '1201', '3200', 'F', '20'),
('', '3201', '10000', 'F', '20'),
('', '100001', '35000', 'F', '20')
