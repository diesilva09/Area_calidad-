-- Script para crear categorías y productos iniciales
-- Ejecutar: psql -U postgres -d area_calidad -f database/init_categories_products.sql

-- Crear tabla categories si no existe
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  type VARCHAR(50) NOT NULL DEFAULT 'produccion',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Crear tabla products si no existe
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id VARCHAR(50) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  description TEXT,
  pesos_config JSONB DEFAULT '[]'::jsonb,
  temperaturas_config JSONB DEFAULT '[]'::jsonb,
  calidad_rangos_config JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Insertar categorías de Producción (RE-CAL-084)
INSERT INTO categories (id, name, type, description) VALUES
  ('PROD_CONSERVAS', 'Conservas', 'produccion', 'Productos en conserva'),
  ('PROD_SALSAS', 'Salsas', 'produccion', 'Salsas y derivados'),
  ('PROD_BEBIDAS', 'Bebidas', 'produccion', 'Bebidas y jugos'),
  ('PROD_LACTEOS', 'Lácteos', 'produccion', 'Productos lácteos'),
  ('PROD_CARNICOS', 'Cárnicos', 'produccion', 'Productos cárnicos')
ON CONFLICT (id) DO NOTHING;

-- Insertar categorías de Embalaje (RE-CAL-093)
INSERT INTO categories (id, name, type, description) VALUES
  ('EMB_CONSERVAS', 'Conservas', 'embalaje', 'Embalaje de conservas'),
  ('EMB_SALSAS', 'Salsas', 'embalaje', 'Embalaje de salsas'),
  ('EMB_BEBIDAS', 'Bebidas', 'embalaje', 'Embalaje de bebidas'),
  ('EMB_LACTEOS', 'Lácteos', 'embalaje', 'Embalaje de lácteos'),
  ('EMB_CARNICOS', 'Cárnicos', 'embalaje', 'Embalaje de cárnicos')
ON CONFLICT (id) DO NOTHING;

-- Insertar productos de ejemplo para Producción
INSERT INTO products (id, name, category_id) VALUES
  -- Conservas
  ('PROD_001', 'Cerezas en Almíbar', 'PROD_CONSERVAS'),
  ('PROD_002', 'Duraznos en Almíbar', 'PROD_CONSERVAS'),
  ('PROD_003', 'Piña en Almíbar', 'PROD_CONSERVAS'),
  ('PROD_004', 'Champignons en Salmuera', 'PROD_CONSERVAS'),
  -- Salsas
  ('PROD_005', 'Salsa de Tomate 500g', 'PROD_SALSAS'),
  ('PROD_006', 'Salsa de Tomate 1kg', 'PROD_SALSAS'),
  ('PROD_007', 'Ketchup 500ml', 'PROD_SALSAS'),
  ('PROD_008', 'Mayonesa 500ml', 'PROD_SALSAS'),
  -- Bebidas
  ('PROD_009', 'Jugo de Naranja 1L', 'PROD_BEBIDAS'),
  ('PROD_010', 'Jugo de Manzana 1L', 'PROD_BEBIDAS'),
  -- Lácteos
  ('PROD_011', 'Leche Entera 1L', 'PROD_LACTEOS'),
  ('PROD_012', 'Yogurt Natural 500g', 'PROD_LACTEOS'),
  -- Cárnicos
  ('PROD_013', 'Jamón de Pavo', 'PROD_CARNICOS'),
  ('PROD_014', 'Salchichas Frankfurt', 'PROD_CARNICOS')
ON CONFLICT (id) DO NOTHING;

-- Insertar productos de ejemplo para Embalaje
INSERT INTO products (id, name, category_id) VALUES
  -- Conservas
  ('EMB_001', 'Cerezas en Almíbar 500g', 'EMB_CONSERVAS'),
  ('EMB_002', 'Duraznos en Almíbar 500g', 'EMB_CONSERVAS'),
  ('EMB_003', 'Piña en Almíbar 500g', 'EMB_CONSERVAS'),
  -- Salsas
  ('EMB_004', 'Salsa de Tomate 500g', 'EMB_SALSAS'),
  ('EMB_005', 'Salsa de Tomate 1kg', 'EMB_SALSAS'),
  -- Bebidas
  ('EMB_006', 'Jugo de Naranja 1L', 'EMB_BEBIDAS'),
  -- Lácteos
  ('EMB_007', 'Leche Entera 1L', 'EMB_LACTEOS'),
  -- Cárnicos
  ('EMB_008', 'Jamón de Pavo 200g', 'EMB_CARNICOS')
ON CONFLICT (id) DO NOTHING;

-- Verificar datos insertados
SELECT 'Categorías creadas:' AS info, COUNT(*) AS total FROM categories;
SELECT 'Productos creados:' AS info, COUNT(*) AS total FROM products;
SELECT 'Categorías Producción:' AS info, COUNT(*) AS total FROM categories WHERE type = 'produccion';
SELECT 'Categorías Embalaje:' AS info, COUNT(*) AS total FROM categories WHERE type = 'embalaje';
