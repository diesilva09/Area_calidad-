-- Nuevas tablas para soportar 1 Registro de Limpieza (padre) con múltiples Liberaciones (hijas)

CREATE TABLE IF NOT EXISTS limpieza_registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  mes_corte VARCHAR(50),
  detalles TEXT,
  lote VARCHAR(255),
  producto VARCHAR(255),
  origin VARCHAR(20) DEFAULT 'manual' CHECK (origin IN ('manual', 'produccion')),
  generated_from_production_record_id UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_limpieza_registros_fecha ON limpieza_registros(fecha);
CREATE INDEX IF NOT EXISTS idx_limpieza_registros_status ON limpieza_registros(status);

CREATE TABLE IF NOT EXISTS limpieza_liberaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_id UUID NOT NULL REFERENCES limpieza_registros(id) ON DELETE CASCADE,

  hora TIME,
  tipo_verificacion VARCHAR(255),

  linea VARCHAR(255),
  superficie VARCHAR(255),

  estado_filtro INTEGER CHECK (estado_filtro IN (0, 1)),
  novedades_filtro TEXT,
  correcciones_filtro TEXT,

  presencia_elementos_extranos VARCHAR(255),
  detalle_elementos_extranos TEXT,

  resultados_atp_ri VARCHAR(255),
  resultados_atp_ac VARCHAR(255),
  resultados_atp_rf VARCHAR(255),
  lote_hisopo_atp VARCHAR(255),
  observacion_atp TEXT,

  deteccion_alergenos_ri VARCHAR(255),
  deteccion_alergenos_ac VARCHAR(255),
  deteccion_alergenos_rf VARCHAR(255),
  lote_hisopo_alergenos VARCHAR(255),
  observacion_alergenos TEXT,

  detergente VARCHAR(255),
  desinfectante VARCHAR(255),

  verificacion_visual INTEGER CHECK (verificacion_visual IN (0, 1)),
  observacion_visual TEXT,

  verificado_por VARCHAR(255),
  responsable_produccion VARCHAR(255),
  responsable_mantenimiento VARCHAR(255),

  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_limpieza_liberaciones_registro_id ON limpieza_liberaciones(registro_id);
CREATE INDEX IF NOT EXISTS idx_limpieza_liberaciones_status ON limpieza_liberaciones(status);

-- Trigger para updated_at (usa update_updated_at_column() ya existente en el proyecto)
CREATE TRIGGER update_limpieza_registros_updated_at
    BEFORE UPDATE ON limpieza_registros
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_limpieza_liberaciones_updated_at
    BEFORE UPDATE ON limpieza_liberaciones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

