import { Pool } from 'pg';

// Configuración de la base de datos PostgreSQL
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
  max: 20, // máximo número de clientes en el pool
  idleTimeoutMillis: 30000, // tiempo de espera para clientes inactivos
  connectionTimeoutMillis: 2000, // tiempo de espera para conexión
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
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

// Funciones para categorías
export async function getCategories(): Promise<Category[]> {
  const result = await pool.query(
    'SELECT * FROM categories WHERE is_active = true ORDER BY name'
  );
  return result.rows;
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const result = await pool.query(
    'SELECT * FROM categories WHERE id = $1 AND is_active = true',
    [id]
  );
  return result.rows[0] || null;
}

export async function createCategory(category: Omit<Category, 'created_at' | 'updated_at' | 'is_active'>): Promise<Category> {
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
    return reactivated.rows[0];
  }

  const result = await pool.query(
    'INSERT INTO categories (id, name, description) VALUES ($1, $2, $3) RETURNING *',
    [category.id, category.name, category.description]
  );
  return result.rows[0];
}

export async function updateCategory(id: string, category: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>): Promise<Category | null> {
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
  const result = await pool.query(
    `UPDATE categories SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const result = await pool.query(
    'UPDATE categories SET is_active = false WHERE id = $1',
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}

// Funciones para productos
export async function getProducts(): Promise<Product[]> {
  const result = await pool.query(
    'SELECT * FROM products WHERE is_active = true ORDER BY category_id, name'
  );
  return result.rows;
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  const result = await pool.query(
    'SELECT * FROM products WHERE category_id = $1 AND is_active = true ORDER BY name',
    [categoryId]
  );
  return result.rows;
}

export async function getProductById(id: string): Promise<Product | null> {
  const result = await pool.query(
    'SELECT * FROM products WHERE id = $1 AND is_active = true',
    [id]
  );
  return result.rows[0] || null;
}

export async function createProduct(product: Omit<Product, 'created_at' | 'updated_at' | 'is_active'>): Promise<Product> {
  const result = await pool.query(
    'INSERT INTO products (id, name, category_id, description) VALUES ($1, $2, $3, $4) RETURNING *',
    [product.id, product.name, product.category_id, product.description]
  );
  return result.rows[0];
}

export async function updateProduct(id: string, product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Promise<Product | null> {
  const fields = [];
  const values = [];
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
  if (product.is_active !== undefined) {
    fields.push(`is_active = $${paramIndex++}`);
    values.push(product.is_active);
  }

  if (fields.length === 0) return null;

  values.push(id);
  const result = await pool.query(
    `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const result = await pool.query(
    'UPDATE products SET is_active = false WHERE id = $1',
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}

// Función para obtener categorías con sus productos (similar a la estructura actual)
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

export default pool;
