import { Pool } from 'pg';

// Configuración de la base de datos PostgreSQL (solo servidor)
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'calidad_coruna',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  // SSL: Solo en producción, con detección automática de soporte
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false, // Deshabilitado en desarrollo ya que PostgreSQL local no soporta SSL
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Tipos para la base de datos
export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface Product {
  id: string;
  name: string;
  category_id: string;
  description?: string;
  pesos_config?: ProductPesosConfig[];
  temperaturas_config?: ProductTemperaturasConfig[];
  calidad_rangos_config?: ProductCalidadRangosConfig[];
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

// Tipos para configuración de pesos en productos
export interface ProductPesosConfig {
  envase_tipo: string;
  peso_drenado_declarado: number | null;
  peso_drenado_min: number | null;
  peso_drenado_max: number | null;
  peso_neto_declarado: number | null;
  categoria_id?: string;
}

// Tipos para configuración de temperaturas en productos
export interface ProductTemperaturasConfig {
  envase_tipo: string;
  temperatura_min: number;
  temperatura_max: number;
}

// Tipos para configuración de rangos de calidad en productos
export interface ProductCalidadRangosConfig {
  envase_tipo: string;
  referencia?: string;
  vacios?: string;
  brix_min: number | null;
  brix_max: number | null;
  ph_min: number | null;
  ph_max: number | null;
  acidez_min: number | null;
  acidez_max: number | null;
  consistencia_min: number | null;
  consistencia_max: number | null;
  ppm_so2_min: number | null;
  ppm_so2_max: number | null;
}

// Tipos para registros de producción
export interface ProductionRecord {
  id: string;
  fechaproduccion: Date;
  fechavencimiento: Date;
  mescorte: string;
  producto: string;
  producto_nombre?: string;
  envase?: string | null;
  responsable_produccion?: string | null;
  lote: string;
  tamano_lote: string;
  letratamano_muestra: string;
  area: string;
  equipo: string;
  liberacion_inicial: string;
  verificacion_aleatoria: string;
  observaciones?: string;
  tempam1: string;
  tempam2: string;
  temppm1: string;
  temppm2: string;
  analisis_sensorial: string;
  prueba_hermeticidad: string;
  inspeccion_micropesaje_mezcla: string;
  inspeccion_micropesaje_resultado: string;
  total_unidades_revisar_drenado: string;
  peso_drenado_declarado: string;
  rango_peso_drenado_min: string;
  rango_peso_drenado_max: string;
  pesos_drenados: string;
  promedio_peso_drenado: string;
  encima_peso_drenado: string;
  debajo_peso_drenado: string;
  und_incumplen_rango_drenado: string;
  porcentaje_incumplen_rango_drenado: string;
  total_unidades_revisar_neto: string;
  peso_neto_declarado: string;
  pesos_netos: string;
  promedio_peso_neto: string;
  encima_peso_neto: string;
  debajo_peso_neto: string;
  und_incumplen_rango_neto: string;
  porcentaje_incumplen_rango_neto: string;
  pruebas_vacio: string;
  novedades_proceso?: string;
  observaciones_acciones_correctivas?: string;
  supervisor_calidad: string;
  fechaanalisispt: Date;
  no_mezcla_pt: string;
  vacio_pt: string;
  peso_neto_real_pt: string;
  peso_drenado_real_pt: string;
  brix_pt: string;
  ph_pt: string;
  acidez_pt: string;
  ppm_so2_pt: string;
  consistencia_pt: string;
  sensorial_pt: string;
  tapado_cierre_pt: string;
  etiqueta_pt: string;
  presentacion_final_pt: string;
  ubicacion_muestra_pt: string;
  estado_pt: string;
  observaciones_pt?: string;
  responsable_analisis_pt: string;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
  is_active: boolean;
  status?: 'pending' | 'completed';
}

// Tipos para registros de embalaje
export interface EmbalajeRecord {
  id: string;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
  is_active: boolean;
  status?: 'pending' | 'completed';
  fecha: Date;
  mescorte: string;
  producto: string;
  presentacion: string;
  lote: string;
  tamano_lote: string;
  nivel_inspeccion: string;
  cajas_revisadas: string;
  total_unidades_revisadas: string;
  total_unidades_revisadas_real: string;
  observaciones_generales?: string;
  unidades_faltantes: string;
  porcentaje_faltantes: string;
  observaciones_faltantes?: string;
  etiqueta: string;
  porcentaje_etiqueta_no_conforme: string;
  observaciones_etiqueta?: string;
  marcacion: string;
  porcentaje_marcacion_no_conforme: string;
  observaciones_marcacion?: string;
  presentacion_no_conforme: string;
  porcentaje_presentacion_no_conforme: string;
  observaciones_presentacion?: string;
  cajas: string;
  porcentaje_cajas_no_conformes: string;
  observaciones_cajas?: string;
  correccion?: string;
  responsable_identificador_cajas: string;
  responsable_embalaje: string;
  responsable_calidad: string;
  unidades_no_conformes: string;
  porcentaje_incumplimiento: string;
}

// Funciones para categorías
export async function getCategories(): Promise<Category[]> {
  try {
    console.log('Conectando a la base de datos...');
    console.log('Query: SELECT * FROM categories WHERE is_active = true ORDER BY name');
    
    const result = await pool.query(
      'SELECT * FROM categories WHERE is_active = true ORDER BY name'
    );
    
    console.log('Query ejecutado exitosamente');
    console.log('Filas devueltas:', result.rows.length);
    
    return result.rows;
  } catch (error) {
    console.error('Error en getCategories:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const result = await pool.query(
    'SELECT * FROM categories WHERE id = $1 AND is_active = true',
    [id]
  );
  return result.rows[0] || null;
}

export async function createCategory(category: Omit<Category, 'created_at' | 'updated_at' | 'is_active' | 'type'>): Promise<Category> {
  try {
    console.log('Creando categoría:', category);

    const existingCategory = await pool.query(
      'SELECT id, is_active FROM categories WHERE id = $1 LIMIT 1',
      [category.id]
    );

    if (existingCategory.rows.length > 0) {
      const existing = existingCategory.rows[0] as { id: string; is_active: boolean };
      if (existing.is_active) {
        throw new Error(`La categoría con ID ${category.id} ya existe`);
      }

      const reactivated = await pool.query(
        `UPDATE categories
         SET
           name = $2,
           description = $3,
           is_active = true,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [category.id, category.name, category.description]
      );

      console.log('Categoría reactivada exitosamente:', reactivated.rows[0]);
      return reactivated.rows[0];
    }

    const result = await pool.query(
      'INSERT INTO categories (id, name, description) VALUES ($1, $2, $3) RETURNING *',
      [category.id, category.name, category.description]
    );
    console.log('Categoría creada exitosamente:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error al crear categoría:', error);
    throw error;
  }
}

export async function updateCategory(id: string, category: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>): Promise<Category | null> {
  try {
    console.log('Actualizando categoría:', { id, category });
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (category.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(category.name);
    }
    if (category.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(category.description);
    }
    if (category.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(category.is_active);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `UPDATE categories SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    console.log('Query UPDATE:', query);
    console.log('Values:', values);
    
    const result = await pool.query(query, values);
    console.log('Categoría actualizada exitosamente:', result.rows[0]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    throw error;
  }
}

export async function deleteCategory(id: string): Promise<boolean> {
  try {
    console.log('Eliminando categoría (soft delete):', id);
    const result = await pool.query(
      'UPDATE categories SET is_active = false WHERE id = $1',
      [id]
    );
    console.log('Categoría desactivada. Filas afectadas:', result.rowCount);
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    throw error;
  }
}

// Funciones para productos
export async function getProducts(): Promise<Product[]> {
  const result = await pool.query(`
    SELECT
      p.*,
      COALESCE(p.pesos_config, '[]'::jsonb) as pesos_config,
      COALESCE(p.temperaturas_config, '[]'::jsonb) as temperaturas_config,
      COALESCE(p.calidad_rangos_config, '[]'::jsonb) as calidad_rangos_config
    FROM products p
    WHERE p.is_active = true
    ORDER BY p.name
  `);
  return result.rows;
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  const result = await pool.query(`
    SELECT
      p.*,
      COALESCE(p.pesos_config, '[]'::jsonb) as pesos_config,
      COALESCE(p.temperaturas_config, '[]'::jsonb) as temperaturas_config,
      COALESCE(p.calidad_rangos_config, '[]'::jsonb) as calidad_rangos_config
    FROM products p
    WHERE p.category_id = $1 AND p.is_active = true
    ORDER BY p.name
  `, [categoryId]);
  return result.rows;
}

export async function getProductById(id: string, categoryId?: string): Promise<Product | null> {
  let query = `
    SELECT
      p.*,
      COALESCE(p.pesos_config, '[]'::jsonb) as pesos_config,
      COALESCE(p.temperaturas_config, '[]'::jsonb) as temperaturas_config,
      COALESCE(p.calidad_rangos_config, '[]'::jsonb) as calidad_rangos_config
    FROM products p
    WHERE p.id = $1 AND p.is_active = true
  `;
  const params: any[] = [id];
  
  if (categoryId) {
    query += ' AND p.category_id = $2';
    params.push(categoryId);
  }
  
  query += ' LIMIT 1';
  
  const result = await pool.query(query, params);
  return result.rows[0] || null;
}

export async function createProduct(product: Omit<Product, 'created_at' | 'updated_at' | 'is_active'>): Promise<Product> {
  try {
    console.log('Creando producto:', product);
    
    // Verificar si el ID ya existe en la misma categoría
    const existingProduct = await pool.query(
      'SELECT id, is_active FROM products WHERE id = $1 AND category_id = $2 LIMIT 1',
      [product.id, product.category_id]
    );

    if (existingProduct.rows.length > 0) {
      const existing = existingProduct.rows[0] as { id: string; is_active: boolean };
      if (existing.is_active) {
        throw new Error(`El producto con ID ${product.id} ya existe en esta categoría`);
      }

      const reactivated = await pool.query(
        `UPDATE products
         SET
           name = $3,
           description = $4,
           pesos_config = $5,
           temperaturas_config = $6,
           calidad_rangos_config = $7,
           is_active = true,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND category_id = $2
         RETURNING *`,
        [
          product.id,
          product.category_id,
          product.name,
          product.description,
          JSON.stringify(product.pesos_config ?? []),
          JSON.stringify(product.temperaturas_config ?? []),
          JSON.stringify(product.calidad_rangos_config ?? []),
        ]
      );

      console.log('Producto reactivado exitosamente:', reactivated.rows[0]);
      return reactivated.rows[0];
    }
    
    const result = await pool.query(`
      INSERT INTO products (
        id,
        name,
        category_id,
        description,
        pesos_config,
        temperaturas_config,
        calidad_rangos_config,
        is_active,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `, [
      product.id,
      product.name,
      product.category_id,
      product.description,
      JSON.stringify(product.pesos_config ?? []),
      JSON.stringify(product.temperaturas_config ?? []),
      JSON.stringify(product.calidad_rangos_config ?? []),
    ]);
    
    console.log('Producto creado exitosamente:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error al crear producto:', error);
    throw error;
  }
}

export async function updateProduct(id: string, product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>, oldCategoryId?: string): Promise<Product | null> {
  try {
    console.log('Actualizando producto:', { id, product, oldCategoryId });
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (product.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(product.name);
    }
    if (product.category_id !== undefined) {
      fields.push(`category_id = $${paramIndex++}`);
      values.push(product.category_id);
    }
    if (product.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(product.description);
    }
    if (product.pesos_config !== undefined) {
      fields.push(`pesos_config = $${paramIndex++}`);
      values.push(JSON.stringify(product.pesos_config ?? []));
    }
    if (product.temperaturas_config !== undefined) {
      fields.push(`temperaturas_config = $${paramIndex++}`);
      values.push(JSON.stringify(product.temperaturas_config ?? []));
    }
    if (product.calidad_rangos_config !== undefined) {
      fields.push(`calidad_rangos_config = $${paramIndex++}`);
      values.push(JSON.stringify(product.calidad_rangos_config ?? []));
    }
    if (product.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(product.is_active);
    }

    if (fields.length === 0) return null;

    // Para el WHERE clause, necesitamos tanto el id como el category_id original (si se pasa)
    let query = `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
    values.push(id);
    paramIndex++;

    if (oldCategoryId) {
      query += ` AND category_id = $${paramIndex}`;
      values.push(oldCategoryId);
    }

    query += ' RETURNING *';
    
    console.log('Query UPDATE producto:', query);
    console.log('Values:', values);
    
    const result = await pool.query(query, values);
    console.log('Producto actualizado exitosamente:', result.rows[0]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    throw error;
  }
}

export async function deleteProduct(id: string, categoryId?: string): Promise<boolean> {
  try {
    console.log('Eliminando producto (soft delete):', { id, categoryId });
    let query = 'UPDATE products SET is_active = false WHERE id = $1';
    const params = [id];
    
    if (categoryId) {
      query += ' AND category_id = $2';
      params.push(categoryId);
    }
    
    const result = await pool.query(query, params);
    console.log('Producto desactivado. Filas afectadas:', result.rowCount);
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    throw error;
  }
}

// Función para obtener categorías con sus productos
export async function getCategoriesWithProducts(): Promise<Array<{
  id: string;
  name: string;
  description?: string;
  products: Array<{
    id: string;
    name: string;
  }>;
}>> {
  const result = await pool.query(`
    SELECT 
      c.id,
      c.name,
      c.description,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', p.id,
            'name', p.name
          ) ORDER BY p.name
        ) FILTER (WHERE p.id IS NOT NULL),
        '[]'::json
      ) as products
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
    WHERE c.is_active = true
    GROUP BY c.id, c.name, c.description
    ORDER BY c.name
  `);

  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    products: row.products
  }));
}

// Función de prueba de conexión
export async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Conexión a PostgreSQL exitosa:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Error al conectar a PostgreSQL:', error);
    return false;
  }
}

// Funciones para registros de producción
export async function getProductionRecords(): Promise<ProductionRecord[]> {
  try {
    console.log('Obteniendo registros de producción...');
    
    // Try to query with v2 schema first (fechaproduccion without underscore)
    let result;
    try {
      result = await pool.query(
        'SELECT * FROM production_records WHERE is_active = true ORDER BY fechaproduccion DESC'
      );
    } catch (error) {
      console.log('❌ Error con v2 schema, intentando con v1 schema (fecha_produccion)');
      // If v2 fails, try with v1 schema (fecha_produccion with underscore)
      result = await pool.query(
        'SELECT * FROM production_records WHERE is_active = true ORDER BY fecha_produccion DESC'
      );
    }
    
    console.log('Registros de producción obtenidos:', result.rows.length);
    return result.rows;
  } catch (error) {
    console.error('Error en getProductionRecords:', error);
    throw error;
  }
}

export async function getProductionRecordsByCreatedDate(createdDate: string): Promise<ProductionRecord[]> {
  try {
    const date = String(createdDate || '').trim();
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      throw new Error('createdDate inválido. Use formato YYYY-MM-DD');
    }

    const result = await pool.query(
      `SELECT *
       FROM production_records
       WHERE is_active = true
         AND (created_at AT TIME ZONE 'America/Bogota')::date = $1::date
       ORDER BY created_at DESC`,
      [date]
    );

    return result.rows;
  } catch (error) {
    console.error('Error en getProductionRecordsByCreatedDate:', error);
    throw error;
  }
}

export async function getProductionRecordsByProduct(productName: string): Promise<ProductionRecord[]> {
  try {
    console.log(`Obteniendo registros de producción para producto: ${productName}`);
    
    // Try to query with v2 schema first (fechaproduccion without underscore)
    let result;
    try {
      result = await pool.query(
        'SELECT * FROM production_records WHERE producto = $1 AND is_active = true ORDER BY fechaproduccion DESC',
        [productName]
      );
    } catch (error) {
      console.log('❌ Error con v2 schema, intentando con v1 schema (fecha_produccion)');
      // If v2 fails, try with v1 schema (fecha_produccion with underscore)
      result = await pool.query(
        'SELECT * FROM production_records WHERE producto = $1 AND is_active = true ORDER BY fecha_produccion DESC',
        [productName]
      );
    }
    
    console.log(`Registros de producción para ${productName}:`, result.rows.length);
    return result.rows;
  } catch (error) {
    console.error('Error en getProductionRecordsByProduct:', error);
    throw error;
  }
}

export async function getProductionRecordsByProductId(productId: string): Promise<ProductionRecord[]> {
  try {
    console.log(`Obteniendo registros de producción para productId: ${productId}`);
    
    // Retrocompatibilidad: registros antiguos pudieron guardarse con producto = nombre.
    // Si el productId existe en tabla products, buscamos por id OR name.
    let productName: string | null = null;
    try {
      const product = await getProductById(productId);
      productName = product?.name || null;
    } catch (error) {
      console.log('⚠️ No se pudo obtener nombre de producto para retrocompatibilidad:', error);
    }
    
    // Try to query with v2 schema first (fechaproduccion without underscore)
    let result;
    try {
      if (productName) {
        result = await pool.query(
          'SELECT * FROM production_records WHERE (producto = $1 OR producto = $2) AND is_active = true ORDER BY fechaproduccion DESC',
          [productId, productName]
        );
      } else {
        result = await pool.query(
          'SELECT * FROM production_records WHERE producto = $1 AND is_active = true ORDER BY fechaproduccion DESC',
          [productId]
        );
      }
    } catch (error) {
      console.log('❌ Error con v2 schema, intentando con v1 schema (fecha_produccion)');
      // If v2 fails, try with v1 schema (fecha_produccion with underscore)
      if (productName) {
        result = await pool.query(
          'SELECT * FROM production_records WHERE (producto = $1 OR producto = $2) AND is_active = true ORDER BY fecha_produccion DESC',
          [productId, productName]
        );
      } else {
        result = await pool.query(
          'SELECT * FROM production_records WHERE producto = $1 AND is_active = true ORDER BY fecha_produccion DESC',
          [productId]
        );
      }
    }
    
    console.log(`Registros de producción para productId ${productId}:`, result.rows.length);
    return result.rows;
  } catch (error) {
    console.error('Error en getProductionRecordsByProductId:', error);
    throw error;
  }
}

export async function getProductionRecordById(id: string): Promise<ProductionRecord | null> {
  try {
    console.log(`Obteniendo registro de producción con ID: ${id}`);
    
    const result = await pool.query(`
      SELECT * FROM production_records 
      WHERE id = $1 AND is_active = true
    `, [id]);
    
    if (result.rows.length === 0) {
      console.log(`No se encontró registro de producción con ID: ${id}`);
      return null;
    }
    
    console.log(`Registro de producción encontrado con ID: ${id}`);
    return result.rows[0];
  } catch (error) {
    console.error('Error en getProductionRecordById:', error);
    throw error;
  }
}

export async function createProductionRecord(record: Omit<ProductionRecord, 'id' | 'created_at' | 'updated_at' | 'is_active'>): Promise<ProductionRecord> {
  const client = await pool.connect();
  try {
    console.log('Creando registro de producción:', record);

    await client.query('BEGIN');

    const dateOnly = (() => {
      const raw: any = (record as any)?.fechaproduccion;
      if (!raw) return null;
      if (raw instanceof Date) return raw.toISOString().slice(0, 10);
      const s = String(raw);
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
      const d = new Date(s);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().slice(0, 10);
    })();

    const dedupeKey = `production_records|${String(record.producto ?? '').trim()}|${String(record.lote ?? '').trim()}|${String(dateOnly ?? '')}`;
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [dedupeKey]);

    // Si ya existe un registro para el mismo producto+lote+fecha, retornarlo para evitar duplicados
    if (dateOnly) {
      try {
        const existing = await client.query(
          `SELECT *
           FROM production_records
           WHERE is_active = true
             AND producto = $1
             AND lote = $2
             AND fechaproduccion::date = $3::date
           ORDER BY created_at DESC
           LIMIT 1`,
          [record.producto, record.lote, dateOnly]
        );
        if (existing.rows.length > 0) {
          await client.query('COMMIT');
          return existing.rows[0];
        }
      } catch (error) {
        // Si la columna fechaproduccion no existe (schema viejo), intentamos con fecha_produccion
        const existingFallback = await client.query(
          `SELECT *
           FROM production_records
           WHERE is_active = true
             AND producto = $1
             AND lote = $2
             AND fecha_produccion::date = $3::date
           ORDER BY created_at DESC
           LIMIT 1`,
          [record.producto, record.lote, dateOnly]
        );
        if (existingFallback.rows.length > 0) {
          await client.query('COMMIT');
          return existingFallback.rows[0];
        }
      }
    }

    let result;
    try {
      result = await client.query(
        `INSERT INTO production_records (
          fechaproduccion, fechavencimiento, mescorte, producto, envase, lote, tamano_lote,
          letratamano_muestra, area, equipo, liberacion_inicial, verificacion_aleatoria,
          observaciones, tempam1, tempam2, temppm1, temppm2, analisis_sensorial,
          prueba_hermeticidad, inspeccion_micropesaje_mezcla, inspeccion_micropesaje_resultado,
          total_unidades_revisar_drenado, peso_drenado_declarado, rango_peso_drenado_min,
          rango_peso_drenado_max, pesos_drenados, promedio_peso_drenado, encima_peso_drenado,
          debajo_peso_drenado, und_incumplen_rango_drenado, porcentaje_incumplen_rango_drenado,
          total_unidades_revisar_neto, peso_neto_declarado, pesos_netos, promedio_peso_neto,
          encima_peso_neto, debajo_peso_neto, und_incumplen_rango_neto, porcentaje_incumplen_rango_neto,
          pruebas_vacio, novedades_proceso, observaciones_acciones_correctivas, supervisor_calidad,
          fechaanalisispt, no_mezcla_pt, vacio_pt, peso_neto_real_pt, peso_drenado_real_pt,
          brix_pt, ph_pt, acidez_pt, ppm_so2_pt, consistencia_pt, sensorial_pt,
          tapado_cierre_pt, etiqueta_pt, presentacion_final_pt, ubicacion_muestra_pt,
          estado_pt, observaciones_pt, responsable_analisis_pt, created_by, updated_by, status, responsable_produccion
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
          $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35,
          $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50,
          $51, $52, $53, $54, $55, $56, $57, $58, $59, $60, $61, $62, $63, $64, $65
        ) RETURNING *`,
        [
          record.fechaproduccion, record.fechavencimiento, record.mescorte, record.producto, record.envase,
          record.lote, record.tamano_lote, record.letratamano_muestra, record.area, record.equipo,
          record.liberacion_inicial, record.verificacion_aleatoria, record.observaciones,
          record.tempam1, record.tempam2, record.temppm1, record.temppm2, record.analisis_sensorial,
          record.prueba_hermeticidad, record.inspeccion_micropesaje_mezcla, record.inspeccion_micropesaje_resultado,
          record.total_unidades_revisar_drenado, record.peso_drenado_declarado, record.rango_peso_drenado_min,
          record.rango_peso_drenado_max, record.pesos_drenados, record.promedio_peso_drenado, record.encima_peso_drenado,
          record.debajo_peso_drenado, record.und_incumplen_rango_drenado, record.porcentaje_incumplen_rango_drenado,
          record.total_unidades_revisar_neto, record.peso_neto_declarado, record.pesos_netos, record.promedio_peso_neto,
          record.encima_peso_neto, record.debajo_peso_neto, record.und_incumplen_rango_neto, record.porcentaje_incumplen_rango_neto,
          record.pruebas_vacio, record.novedades_proceso, record.observaciones_acciones_correctivas, record.supervisor_calidad,
          record.fechaanalisispt, record.no_mezcla_pt, record.vacio_pt, record.peso_neto_real_pt, record.peso_drenado_real_pt,
          record.brix_pt, record.ph_pt, record.acidez_pt, record.ppm_so2_pt, record.consistencia_pt, record.sensorial_pt,
          record.tapado_cierre_pt, record.etiqueta_pt, record.presentacion_final_pt, record.ubicacion_muestra_pt,
          record.estado_pt, record.observaciones_pt, record.responsable_analisis_pt, record.created_by, record.updated_by, record.status, record.responsable_produccion
        ]
      );
    } catch (err: any) {
      const missingColumnName = String(err?.message || '').toLowerCase();
      const isMissingColumnError = err?.code === '42703' || String(err?.message || '').includes('42703');
      const isMissingEnvase = isMissingColumnError && missingColumnName.includes('envase');
      const isMissingStatus = isMissingColumnError && missingColumnName.includes('status');
      const isMissingResponsableProduccion =
        isMissingColumnError && missingColumnName.includes('responsable_produccion');

      if (!isMissingEnvase && !isMissingStatus && !isMissingResponsableProduccion) throw err;

      const includeEnvase = !isMissingEnvase;
      const includeStatus = !isMissingStatus;
      const includeResponsableProduccion = !isMissingResponsableProduccion;

      console.warn(
        `⚠️ Reintentando INSERT en production_records sin columna(s): ${[
          !includeEnvase ? 'envase' : null,
          !includeStatus ? 'status' : null,
          !includeResponsableProduccion ? 'responsable_produccion' : null,
        ]
          .filter(Boolean)
          .join(', ')}`
      );

      const columns = [
        'fechaproduccion',
        'fechavencimiento',
        'mescorte',
        'producto',
        'producto_nombre',
        ...(includeEnvase ? ['envase'] : []),
        'lote',
        'tamano_lote',
        'letratamano_muestra',
        'area',
        'equipo',
        ...(includeResponsableProduccion ? ['responsable_produccion'] : []),
        'liberacion_inicial',
        'verificacion_aleatoria',
        'observaciones',
        'tempam1',
        'tempam2',
        'temppm1',
        'temppm2',
        'analisis_sensorial',
        'prueba_hermeticidad',
        'inspeccion_micropesaje_mezcla',
        'inspeccion_micropesaje_resultado',
        'total_unidades_revisar_drenado',
        'peso_drenado_declarado',
        'rango_peso_drenado_min',
        'rango_peso_drenado_max',
        'pesos_drenados',
        'promedio_peso_drenado',
        'encima_peso_drenado',
        'debajo_peso_drenado',
        'und_incumplen_rango_drenado',
        'porcentaje_incumplen_rango_drenado',
        'total_unidades_revisar_neto',
        'peso_neto_declarado',
        'pesos_netos',
        'promedio_peso_neto',
        'encima_peso_neto',
        'debajo_peso_neto',
        'und_incumplen_rango_neto',
        'porcentaje_incumplen_rango_neto',
        'pruebas_vacio',
        'novedades_proceso',
        'observaciones_acciones_correctivas',
        'supervisor_calidad',
        'fechaanalisispt',
        'no_mezcla_pt',
        'vacio_pt',
        'peso_neto_real_pt',
        'peso_drenado_real_pt',
        'brix_pt',
        'ph_pt',
        'acidez_pt',
        'ppm_so2_pt',
        'consistencia_pt',
        'sensorial_pt',
        'tapado_cierre_pt',
        'etiqueta_pt',
        'presentacion_final_pt',
        'ubicacion_muestra_pt',
        'estado_pt',
        'observaciones_pt',
        'responsable_analisis_pt',
        'created_by',
        'updated_by',
        ...(includeStatus ? ['status'] : []),
      ];

      const values = [
        record.fechaproduccion,
        record.fechavencimiento,
        record.mescorte,
        record.producto,
        record.producto_nombre,
        ...(includeEnvase ? [record.envase] : []),
        record.lote,
        record.tamano_lote,
        record.letratamano_muestra,
        record.area,
        record.equipo,
        ...(includeResponsableProduccion ? [record.responsable_produccion] : []),
        record.liberacion_inicial,
        record.verificacion_aleatoria,
        record.observaciones,
        record.tempam1,
        record.tempam2,
        record.temppm1,
        record.temppm2,
        record.analisis_sensorial,
        record.prueba_hermeticidad,
        record.inspeccion_micropesaje_mezcla,
        record.inspeccion_micropesaje_resultado,
        record.total_unidades_revisar_drenado,
        record.peso_drenado_declarado,
        record.rango_peso_drenado_min,
        record.rango_peso_drenado_max,
        record.pesos_drenados,
        record.promedio_peso_drenado,
        record.encima_peso_drenado,
        record.debajo_peso_drenado,
        record.und_incumplen_rango_drenado,
        record.porcentaje_incumplen_rango_drenado,
        record.total_unidades_revisar_neto,
        record.peso_neto_declarado,
        record.pesos_netos,
        record.promedio_peso_neto,
        record.encima_peso_neto,
        record.debajo_peso_neto,
        record.und_incumplen_rango_neto,
        record.porcentaje_incumplen_rango_neto,
        record.pruebas_vacio,
        record.novedades_proceso,
        record.observaciones_acciones_correctivas,
        record.supervisor_calidad,
        record.fechaanalisispt,
        record.no_mezcla_pt,
        record.vacio_pt,
        record.peso_neto_real_pt,
        record.peso_drenado_real_pt,
        record.brix_pt,
        record.ph_pt,
        record.acidez_pt,
        record.ppm_so2_pt,
        record.consistencia_pt,
        record.sensorial_pt,
        record.tapado_cierre_pt,
        record.etiqueta_pt,
        record.presentacion_final_pt,
        record.ubicacion_muestra_pt,
        record.estado_pt,
        record.observaciones_pt,
        record.responsable_analisis_pt,
        record.created_by,
        record.updated_by,
        ...(includeStatus ? [record.status] : []),
      ];

      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const query = `INSERT INTO production_records (\n          ${columns.join(', ')}\n        ) VALUES (\n          ${placeholders}\n        ) RETURNING *`;

      result = await client.query(query, values);
    }
    console.log('Registro de producción creado exitosamente:', result.rows[0]);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore
    }
    console.error('Error al crear registro de producción:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function updateProductionRecord(id: string, record: Partial<Omit<ProductionRecord, 'id' | 'created_at' | 'updated_at'>>): Promise<ProductionRecord | null> {
  try {
    console.log('🔄 Actualizando registro de producción:', { id, record });
    console.log('🔄 Status en el record a actualizar:', record.status);
    if (!record || typeof record !== 'object') {
      throw new Error('Invalid update payload');
    }
    const hasStatusColumn = await (async () => {
      try {
        const res = await pool.query(
          `
            SELECT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = 'production_records'
                AND column_name = 'status'
            ) AS exists;
          `
        );
        return Boolean(res.rows?.[0]?.exists);
      } catch {
        return false;
      }
    })();

    const existingColumns = await (async () => {
      try {
        const res = await pool.query(
          `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'production_records'
          `
        );
        return new Set<string>((res.rows || []).map((r: any) => String(r?.column_name ?? '').trim()).filter(Boolean));
      } catch {
        return new Set<string>();
      }
    })();

    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    Object.keys(record ?? {}).forEach((key) => {
      const value = (record as any)[key];
      if (value === undefined) return;
      if (!existingColumns.has(key)) return;
      if (key === 'status' && !hasStatusColumn) return;

      fields.push(`${key} = $${paramIndex++}`);
      values.push(value);
      console.log(`🔄 Campo ${key} = ${value}`);
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id); // Para el WHERE clause

    const query = `UPDATE production_records SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    console.log('🔄 Query SQL:', query);
    console.log('🔄 Values para SQL:', values);

    const result = await pool.query(query, values);
    console.log('✅ Registro de producción actualizado:', result.rows[0]);
    console.log('✅ Status después de actualizar:', result.rows[0]?.status);
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Error al actualizar registro de producción:', error);
    throw error;
  }
}

export async function deleteProductionRecord(id: string): Promise<boolean> {
  try {
    console.log('Eliminando registro de producción:', id);
    const result = await pool.query('DELETE FROM production_records WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Error al eliminar registro de producción:', error);
    throw error;
  }
}

// Funciones para registros de embalaje
export async function getEmbalajeRecords(): Promise<EmbalajeRecord[]> {
  try {
    console.log('Obteniendo registros de embalaje...');
    const result = await pool.query(
      'SELECT * FROM embalaje_records WHERE is_active = true ORDER BY fecha DESC'
    );
    console.log('Registros de embalaje obtenidos:', result.rows.length);
    return result.rows;
  } catch (error) {
    console.error('Error en getEmbalajeRecords:', error);
    throw error;
  }
}

export async function getEmbalajeRecordsByProduct(productName: string): Promise<EmbalajeRecord[]> {
  try {
    console.log(`Obteniendo registros de embalaje para producto: ${productName}`);
    const result = await pool.query(
      'SELECT * FROM embalaje_records WHERE producto = $1 AND is_active = true ORDER BY fecha DESC',
      [productName]
    );
    console.log(`Registros de embalaje para ${productName}:`, result.rows.length);
    return result.rows;
  } catch (error) {
    console.error('Error en getEmbalajeRecordsByProduct:', error);
    throw error;
  }
}

export async function createEmbalajeRecord(record: Omit<EmbalajeRecord, 'id' | 'created_at' | 'updated_at' | 'is_active'>): Promise<EmbalajeRecord> {
  const client = await pool.connect();
  try {
    console.log('🔍 DEBUG: Creando registro de embalaje:', record);
    console.log('🔍 DEBUG: Tipo de fecha:', typeof record.fecha, record.fecha);

    await client.query('BEGIN');

    const dateOnly = (() => {
      const raw: any = (record as any)?.fecha;
      if (!raw) return null;
      if (raw instanceof Date) return raw.toISOString().slice(0, 10);
      const s = String(raw);
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
      const d = new Date(s);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().slice(0, 10);
    })();

    const dedupeKey = `embalaje_records|${String(record.producto ?? '').trim()}|${String(record.lote ?? '').trim()}|${String(dateOnly ?? '')}`;
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [dedupeKey]);

    if (dateOnly) {
      const existing = await client.query(
        `SELECT *
         FROM embalaje_records
         WHERE is_active = true
           AND producto = $1
           AND lote = $2
           AND fecha::date = $3::date
         ORDER BY created_at DESC
         LIMIT 1`,
        [record.producto, record.lote, dateOnly]
      );
      if (existing.rows.length > 0) {
        await client.query('COMMIT');
        return existing.rows[0];
      }
    }

    const hasStatusColumn = await (async () => {
      try {
        const res = await client.query(
          `
            SELECT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = 'embalaje_records'
                AND column_name = 'status'
            ) AS exists;
          `
        );
        return Boolean(res.rows?.[0]?.exists);
      } catch {
        return false;
      }
    })();
    
    const insertQuery = hasStatusColumn
      ? `INSERT INTO embalaje_records (
          fecha, mescorte, producto, presentacion, lote, tamano_lote,
          nivel_inspeccion, cajas_revisadas, total_unidades_revisadas, total_unidades_revisadas_real,
          observaciones_generales, unidades_faltantes, porcentaje_faltantes, observaciones_faltantes,
          etiqueta, porcentaje_etiqueta_no_conforme, observaciones_etiqueta,
          marcacion, porcentaje_marcacion_no_conforme, observaciones_marcacion,
          presentacion_no_conforme, porcentaje_presentacion_no_conforme, observaciones_presentacion,
          cajas, porcentaje_cajas_no_conformes, observaciones_cajas, correccion,
          responsable_identificador_cajas, responsable_embalaje, responsable_calidad,
          unidades_no_conformes, porcentaje_incumplimiento, created_by, updated_by,
          status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34,
          $35
        ) RETURNING *`
      : `INSERT INTO embalaje_records (
          fecha, mescorte, producto, presentacion, lote, tamano_lote,
          nivel_inspeccion, cajas_revisadas, total_unidades_revisadas, total_unidades_revisadas_real,
          observaciones_generales, unidades_faltantes, porcentaje_faltantes, observaciones_faltantes,
          etiqueta, porcentaje_etiqueta_no_conforme, observaciones_etiqueta,
          marcacion, porcentaje_marcacion_no_conforme, observaciones_marcacion,
          presentacion_no_conforme, porcentaje_presentacion_no_conforme, observaciones_presentacion,
          cajas, porcentaje_cajas_no_conformes, observaciones_cajas, correccion,
          responsable_identificador_cajas, responsable_embalaje, responsable_calidad,
          unidades_no_conformes, porcentaje_incumplimiento, created_by, updated_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34
        ) RETURNING *`;

    const insertValues: any[] = [
      record.fecha, record.mescorte, record.producto, record.presentacion, record.lote,
      record.tamano_lote, record.nivel_inspeccion, record.cajas_revisadas,
      record.total_unidades_revisadas, record.total_unidades_revisadas_real,
      record.observaciones_generales, record.unidades_faltantes, record.porcentaje_faltantes,
      record.observaciones_faltantes, record.etiqueta, record.porcentaje_etiqueta_no_conforme,
      record.observaciones_etiqueta, record.marcacion, record.porcentaje_marcacion_no_conforme,
      record.observaciones_marcacion, record.presentacion_no_conforme,
      record.porcentaje_presentacion_no_conforme, record.observaciones_presentacion,
      record.cajas, record.porcentaje_cajas_no_conformes, record.observaciones_cajas,
      record.correccion, record.responsable_identificador_cajas, record.responsable_embalaje,
      record.responsable_calidad, record.unidades_no_conformes, record.porcentaje_incumplimiento,
      record.created_by, record.updated_by,
    ];

    if (hasStatusColumn) {
      insertValues.push((record as any).status ?? 'completed');
    }

    const result = await client.query(insertQuery, insertValues);
    console.log('✅ Registro de embalaje creado exitosamente:', result.rows[0]);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore
    }
    console.error('❌ ERROR en createEmbalajeRecord:', error);
    console.error('❌ Detalles del error:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateEmbalajeRecord(id: string, record: Partial<Omit<EmbalajeRecord, 'id' | 'created_at' | 'updated_at'>>): Promise<EmbalajeRecord | null> {
  try {
    console.log('🔄 Actualizando registro de embalaje:', { id, record });
    if (!record || typeof record !== 'object') {
      throw new Error('Invalid update payload');
    }

    const hasStatusColumn = await (async () => {
      try {
        const res = await pool.query(
          `
            SELECT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = 'embalaje_records'
                AND column_name = 'status'
            ) AS exists;
          `
        );
        return Boolean(res.rows?.[0]?.exists);
      } catch {
        return false;
      }
    })();

    const existingColumns = await (async () => {
      try {
        const res = await pool.query(
          `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'embalaje_records'
          `
        );
        return new Set<string>((res.rows || []).map((r: any) => String(r?.column_name ?? '').trim()).filter(Boolean));
      } catch {
        return new Set<string>();
      }
    })();

    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    Object.keys(record ?? {}).forEach((key) => {
      const value = (record as any)[key];
      if (value === undefined) return;
      if (!existingColumns.has(key)) return;
      if (key === 'status' && !hasStatusColumn) return;

      fields.push(`${key} = $${paramIndex++}`);
      values.push(value);
      console.log(`🔄 Campo ${key} = ${value}`);
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id); // Para el WHERE clause

    const query = `UPDATE embalaje_records SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    console.log('Query:', query);
    console.log('Values:', values);

    const result = await pool.query(query, values);
    console.log('Registro de embalaje actualizado:', result.rows[0]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error al actualizar registro de embalaje:', error);
    throw error;
  }
}

export async function deleteEmbalajeRecord(id: string): Promise<boolean> {
  try {
    console.log('Eliminando registro de embalaje:', id);
    const result = await pool.query('DELETE FROM embalaje_records WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Error al eliminar registro de embalaje:', error);
    throw error;
  }
}

export default pool;
