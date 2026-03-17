import db from '@/lib/db';

export interface Equipo {
  id: number;
  area: 'Salsas' | 'Conservas';
  codigo: string;
  nombre: string;
  created_at: string;
  updated_at: string;
  partes?: Parte[];
}

export interface Parte {
  id: number;
  equipo_id: number;
  nombre: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export const equiposService = {
  // Obtener todos los equipos con sus partes
  async getAll(): Promise<Equipo[]> {
    try {
      const result = await db.query(`
        SELECT e.*, 
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', p.id,
                     'nombre', p.nombre,
                     'observaciones', p.observaciones,
                     'created_at', p.created_at,
                     'updated_at', p.updated_at
                   ) ORDER BY p.id
                 ) FILTER (WHERE p.id IS NOT NULL), 
                 '[]'
               ) as partes
        FROM equipos e
        LEFT JOIN equipo_partes p ON e.id = p.equipo_id
        GROUP BY e.id, e.area, e.codigo, e.nombre, e.created_at, e.updated_at
        ORDER BY e.codigo
      `);
      
      // Asegurar que los IDs sean números
      return result.rows.map(row => ({
        ...row,
        id: parseInt(row.id),
        partes: row.partes ? row.partes.map((parte: any) => ({
          ...parte,
          id: parseInt(parte.id),
          equipo_id: parseInt(parte.equipo_id)
        })) : []
      }));
    } catch (error) {
      console.error('Error al obtener equipos:', error);
      throw error;
    }
  },

  // Obtener un equipo por ID
  async getById(id: number): Promise<Equipo | null> {
    try {
      const result = await db.query(`
        SELECT e.*, 
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', p.id,
                     'nombre', p.nombre,
                     'observaciones', p.observaciones,
                     'created_at', p.created_at,
                     'updated_at', p.updated_at
                   ) ORDER BY p.id
                 ) FILTER (WHERE p.id IS NOT NULL), 
                 '[]'
               ) as partes
        FROM equipos e
        LEFT JOIN equipo_partes p ON e.id = p.equipo_id
        WHERE e.id = $1
        GROUP BY e.id, e.area, e.codigo, e.nombre, e.created_at, e.updated_at
      `, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      
      // Asegurar que los IDs sean números
      return {
        ...row,
        id: parseInt(row.id),
        partes: row.partes ? row.partes.map((parte: any) => ({
          ...parte,
          id: parseInt(parte.id),
          equipo_id: parseInt(parte.equipo_id)
        })) : []
      };
    } catch (error) {
      console.error('Error al obtener equipo:', error);
      throw error;
    }
  },

  // Obtener un equipo por código (string)
  async getByIdString(codigo: string): Promise<Equipo | null> {
    try {
      const result = await db.query(`
        SELECT e.*, 
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', p.id,
                     'nombre', p.nombre,
                     'observaciones', p.observaciones,
                     'created_at', p.created_at,
                     'updated_at', p.updated_at
                   ) ORDER BY p.id
                 ) FILTER (WHERE p.id IS NOT NULL), 
                 '[]'
               ) as partes
        FROM equipos e
        LEFT JOIN equipo_partes p ON e.id = p.equipo_id
        WHERE e.codigo = $1
        GROUP BY e.id, e.area, e.codigo, e.nombre, e.created_at, e.updated_at
      `, [codigo]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      
      // Asegurar que los IDs sean números
      return {
        ...row,
        id: parseInt(row.id),
        partes: row.partes ? row.partes.map((parte: any) => ({
          ...parte,
          id: parseInt(parte.id),
          equipo_id: parseInt(parte.equipo_id)
        })) : []
      };
    } catch (error) {
      console.error('Error al obtener equipo por código:', error);
      throw error;
    }
  },

  // Crear un nuevo equipo
  async create(equipo: Omit<Equipo, 'id' | 'created_at' | 'updated_at' | 'partes'>): Promise<Equipo> {
    try {
      const result = await db.query(
        'INSERT INTO equipos (area, codigo, nombre) VALUES ($1, $2, $3) RETURNING *',
        [equipo.area, equipo.codigo, equipo.nombre]
      );
      
      const row = result.rows[0];
      
      // Asegurar que el ID sea número
      return {
        ...row,
        id: parseInt(row.id)
      };
    } catch (error) {
      console.error('Error al crear equipo:', error);
      throw error;
    }
  },

  // Actualizar un equipo
  async update(id: number, equipo: Partial<Omit<Equipo, 'id' | 'created_at' | 'updated_at' | 'partes'>>): Promise<Equipo> {
    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;

      if (equipo.area !== undefined) {
        fields.push(`area = $${paramIndex++}`);
        values.push(equipo.area);
      }
      if (equipo.codigo !== undefined) {
        fields.push(`codigo = $${paramIndex++}`);
        values.push(equipo.codigo);
      }
      if (equipo.nombre !== undefined) {
        fields.push(`nombre = $${paramIndex++}`);
        values.push(equipo.nombre);
      }

      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }

      values.push(id);
      
      const result = await db.query(
        `UPDATE equipos SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );
      
      const row = result.rows[0];
      
      // Asegurar que el ID sea número
      return {
        ...row,
        id: parseInt(row.id)
      };
    } catch (error) {
      console.error('Error al actualizar equipo:', error);
      throw error;
    }
  },

  // Eliminar un equipo
  async delete(id: number): Promise<void> {
    try {
      await db.query('DELETE FROM equipos WHERE id = $1', [id]);
    } catch (error) {
      console.error('Error al eliminar equipo:', error);
      throw error;
    }
  },

  // Crear una parte para un equipo
  async createParte(parte: Omit<Parte, 'id' | 'created_at' | 'updated_at'>): Promise<Parte> {
    try {
      const result = await db.query(
        'INSERT INTO equipo_partes (equipo_id, nombre, observaciones) VALUES ($1, $2, $3) RETURNING *',
        [parte.equipo_id, parte.nombre, parte.observaciones || null]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error al crear parte:', error);
      throw error;
    }
  },

  // Actualizar una parte
  async updateParte(id: number, parte: Partial<Omit<Parte, 'id' | 'created_at' | 'updated_at'>>): Promise<Parte> {
    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;

      if (parte.nombre !== undefined) {
        fields.push(`nombre = $${paramIndex++}`);
        values.push(parte.nombre);
      }
      if (parte.observaciones !== undefined) {
        fields.push(`observaciones = $${paramIndex++}`);
        values.push(parte.observaciones);
      }

      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }

      values.push(id);
      
      const result = await db.query(
        `UPDATE equipo_partes SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error al actualizar parte:', error);
      throw error;
    }
  },

  // Eliminar una parte
  async deleteParte(id: number): Promise<void> {
    try {
      await db.query('DELETE FROM equipo_partes WHERE id = $1', [id]);
    } catch (error) {
      console.error('Error al eliminar parte:', error);
      throw error;
    }
  }
};
