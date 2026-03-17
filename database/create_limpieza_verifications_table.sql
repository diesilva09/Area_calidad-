-- Crear tabla para verificaciones de limpieza detalladas
CREATE TABLE IF NOT EXISTS limpieza_verifications (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  mes_corte VARCHAR(50),
  hora TIME,
  tipo_verificacion VARCHAR(255) NOT NULL,
  linea VARCHAR(255),
  superficie VARCHAR(255),
  estado_filtro INTEGER CHECK (estado_filtro IN (0, 1)), -- 1: CUMPLE, 0: NO CUMPLE
  presencia_elementos_extranos VARCHAR(255),
  detalle_elementos_extranos TEXT,
  resultados_atp_ri VARCHAR(255), -- URL
  resultados_atp_ac VARCHAR(255),
  resultados_atp_rf VARCHAR(255), -- URL
  lote_hisopo VARCHAR(255),
  observacion_atp TEXT,
  deteccion_alergenos_ri VARCHAR(255), -- URL
  deteccion_alergenos_ac VARCHAR(255),
  deteccion_alergenos_rf VARCHAR(255), -- URL
  lote_hisopo2 VARCHAR(255),
  observacion_alergenos TEXT,
  detergente VARCHAR(255),
  desinfectante VARCHAR(255),
  verificacion_visual INTEGER CHECK (verificacion_visual IN (0, 1)), -- 1: CUMPLE, 0: NO CUMPLE
  observacion_visual TEXT,
  verificado_por VARCHAR(255) NOT NULL,
  responsable_produccion VARCHAR(255),
  responsable_mantenimiento VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_limpieza_ver_fecha ON limpieza_verifications(fecha);
CREATE INDEX IF NOT EXISTS idx_limpieza_ver_linea ON limpieza_verifications(linea);
CREATE INDEX IF NOT EXISTS idx_limpieza_ver_tipo ON limpieza_verifications(tipo_verificacion);

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_limpieza_verifications_updated_at 
    BEFORE UPDATE ON limpieza_verifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de ejemplo para pruebas
INSERT INTO limpieza_verifications (
  fecha, mes_corte, hora, tipo_verificacion, linea, superficie, estado_filtro,
  presencia_elementos_extranos, resultados_atp_ac, detergente, desinfectante,
  verificacion_visual, verificado_por, responsable_produccion, created_by
) VALUES
(
  CURRENT_DATE, 
  'ENERO 2026', 
  '08:00:00', 
  'LIMPIEZA DIARIA', 
  'ENVASADO DE CONSERVAS (TECNOPACK)', 
  'BANDA TRANSPORTADORA', 
  1, 
  'NO', 
  '150 RLU', 
  'DETERGENTE A', 
  'CLORO 200PPM', 
  1, 
  'JUAN PEREZ', 
  'MARIA GONZALEZ', 
  'demo@calidadcoruna.com'
),
(
  CURRENT_DATE - INTERVAL '1 day', 
  'ENERO 2026', 
  '14:30:00', 
  'LIMPIEZA SEMANAL', 
  'PREPARACIÓN DE SALSAS', 
  'TANQUE DE MEZCLA', 
  0, 
  'SI', 
  '250 RLU', 
  'DETERGENTE B', 
  'ALCOHOL 70%', 
  0, 
  'ANA RODRIGUEZ', 
  'CARLOS MENDOZA', 
  'demo@calidadcoruna.com'
);
