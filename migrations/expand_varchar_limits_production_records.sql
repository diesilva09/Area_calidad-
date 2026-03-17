-- Expande límites de columnas VARCHAR en production_records para soportar los valores actuales del modal RE-CAL-084
-- (evita error 22001: value too long for type character varying(50))

BEGIN;

-- Campos generales que pueden crecer (evitar límite 50)
ALTER TABLE production_records
  ALTER COLUMN mescorte TYPE TEXT,
  ALTER COLUMN tamano_lote TYPE TEXT;

-- Control de calidad (a veces pueden venir como strings más descriptivos)
ALTER TABLE production_records
  ALTER COLUMN liberacion_inicial TYPE TEXT,
  ALTER COLUMN verificacion_aleatoria TYPE TEXT;

-- Temperaturas / controles (por seguridad)
ALTER TABLE production_records
  ALTER COLUMN analisis_sensorial TYPE TEXT,
  ALTER COLUMN prueba_hermeticidad TYPE TEXT,
  ALTER COLUMN inspeccion_micropesaje_mezcla TYPE TEXT,
  ALTER COLUMN inspeccion_micropesaje_resultado TYPE TEXT;

-- Controles de peso (por seguridad, aunque varios son numéricos/contadores)
ALTER TABLE production_records
  ALTER COLUMN total_unidades_revisar_drenado TYPE TEXT,
  ALTER COLUMN peso_drenado_declarado TYPE TEXT,
  ALTER COLUMN rango_peso_drenado_min TYPE TEXT,
  ALTER COLUMN rango_peso_drenado_max TYPE TEXT,
  ALTER COLUMN promedio_peso_drenado TYPE TEXT,
  ALTER COLUMN encima_peso_drenado TYPE TEXT,
  ALTER COLUMN debajo_peso_drenado TYPE TEXT,
  ALTER COLUMN und_incumplen_rango_drenado TYPE TEXT,
  ALTER COLUMN porcentaje_incumplen_rango_drenado TYPE TEXT,
  ALTER COLUMN total_unidades_revisar_neto TYPE TEXT,
  ALTER COLUMN peso_neto_declarado TYPE TEXT,
  ALTER COLUMN promedio_peso_neto TYPE TEXT,
  ALTER COLUMN encima_peso_neto TYPE TEXT,
  ALTER COLUMN debajo_peso_neto TYPE TEXT,
  ALTER COLUMN und_incumplen_rango_neto TYPE TEXT,
  ALTER COLUMN porcentaje_incumplen_rango_neto TYPE TEXT;

-- Pruebas de vacío (CSV desde el modal puede superar 50 chars)
ALTER TABLE production_records
  ALTER COLUMN pruebas_vacio TYPE TEXT;

-- PT (por seguridad)
ALTER TABLE production_records
  ALTER COLUMN no_mezcla_pt TYPE TEXT,
  ALTER COLUMN vacio_pt TYPE TEXT,
  ALTER COLUMN peso_neto_real_pt TYPE TEXT,
  ALTER COLUMN peso_drenado_real_pt TYPE TEXT,
  ALTER COLUMN brix_pt TYPE TEXT,
  ALTER COLUMN ph_pt TYPE TEXT,
  ALTER COLUMN acidez_pt TYPE TEXT,
  ALTER COLUMN ppm_so2_pt TYPE TEXT,
  ALTER COLUMN consistencia_pt TYPE TEXT,
  ALTER COLUMN sensorial_pt TYPE TEXT,
  ALTER COLUMN tapado_cierre_pt TYPE TEXT,
  ALTER COLUMN etiqueta_pt TYPE TEXT,
  ALTER COLUMN presentacion_final_pt TYPE TEXT,
  ALTER COLUMN estado_pt TYPE TEXT;

COMMIT;
