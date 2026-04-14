import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getMateriaPrimaTable, getPoolConfig } from '../materia-prima-config';

export const runtime = 'nodejs';

const pool = new Pool(getPoolConfig());

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formatId = searchParams.get('formatId');
    const fechaInicio = searchParams.get('fecha_inicio');
    const fechaFin = searchParams.get('fecha_fin');

    let query = '';
    let params: any[] = [];

    if (formatId === 'recal-040') {
      query = `
        SELECT
          id,
          fecha,
          proveedor,
          producto,
          nombre_conductor,
          placa_vehiculo,
          lote_proveedor,
          responsable_calidad,
          observaciones,
          cumplimiento,
          tipo_material,
          checks,
          c,
          nc,
          na,
          created_at,
          updated_at,
          'recal-040' as "formatId"
        FROM ${getMateriaPrimaTable('inspeccion_vehiculo')}
      `;
    } else if (formatId === 'recal-038') {
      query = `
        SELECT
          id,
          materia_prima,
          fecha_ingreso,
          fecha_analisis,
          proveedor,
          producto,
          fecha_vencimiento,
          lote_interno,
          lote_proveedor,
          unds_analizar,
          l,
          brix,
          indice_refraccion,
          ph,
          densidad,
          acidez,
          neto,
          drenado,
          sulfitos_soppm,
          color,
          olor,
          sabor,
          textura,
          oxidacion,
          abolladura,
          filtracion,
          etiqueta,
          corrugado,
          identificacion_lote,
          und_analizar_visual,
          und_recibidas,
          realizado_por,
          observaciones,
          verificado_por,
          created_at,
          updated_at,
          'recal-038' as "formatId"
        FROM ${getMateriaPrimaTable('analisis_fisicoquimico_materia_prima')}
      `;
    } else if (formatId === 'recal-062') {
      query = `
        SELECT
          id,
          fecha_ingreso,
          fecha_analisis,
          proveedor,
          producto,
          lote_interno,
          lote_proveedor,
          unidades_analizar,
          peso,
          hermeticidad,
          punto_llenado,
          choque_termico,
          ajuste_etiqueta,
          verificacion_visual,
          diametro,
          largo,
          ancho,
          alto,
          observaciones,
          realizado_por,
          created_at,
          updated_at,
          'recal-062' as "formatId"
        FROM ${getMateriaPrimaTable('analisis_materiales_empaque')}
      `;
    } else {
      // Obtener todos los registros de todas las tablas
      const results: any[] = [];

      // RE-CAL-040
      try {
        const query040 = `
          SELECT
            id,
            fecha,
            proveedor,
            producto,
            nombre_conductor,
            placa_vehiculo,
            lote_proveedor,
            responsable_calidad,
            observaciones,
            cumplimiento,
            tipo_material,
            checks,
            c,
            nc,
            na,
            created_at,
            updated_at,
            'recal-040' as "formatId"
          FROM ${getMateriaPrimaTable('inspeccion_vehiculo')}
          ORDER BY fecha DESC
        `;
        const result040 = await pool.query(query040);
        results.push(...result040.rows);
      } catch (error) {
        console.error('Error al obtener registros RE-CAL-040:', error);
      }

      // RE-CAL-038
      try {
        const query038 = `
          SELECT
            id,
            materia_prima,
            fecha_ingreso,
            fecha_analisis,
            proveedor,
            producto,
            fecha_vencimiento,
            lote_interno,
            lote_proveedor,
            unds_analizar,
            l,
            brix,
            indice_refraccion,
            ph,
            densidad,
            acidez,
            neto,
            drenado,
            sulfitos_soppm,
            color,
            olor,
            sabor,
            textura,
            oxidacion,
            abolladura,
            filtracion,
            etiqueta,
            corrugado,
            identificacion_lote,
            und_analizar_visual,
            und_recibidas,
            realizado_por,
            observaciones,
            verificado_por,
            created_at,
            updated_at,
            'recal-038' as "formatId"
          FROM ${getMateriaPrimaTable('analisis_fisicoquimico_materia_prima')}
          ORDER BY fecha_analisis DESC
        `;
        const result038 = await pool.query(query038);
        results.push(...result038.rows);
      } catch (error) {
        console.error('Error al obtener registros RE-CAL-038:', error);
      }

      // RE-CAL-062
      try {
        const query062 = `
          SELECT
            id,
            fecha_ingreso,
            fecha_analisis,
            proveedor,
            producto,
            lote_interno,
            lote_proveedor,
            unidades_analizar,
            peso,
            hermeticidad,
            punto_llenado,
            choque_termico,
            ajuste_etiqueta,
            verificacion_visual,
            diametro,
            largo,
            ancho,
            alto,
            observaciones,
            realizado_por,
            created_at,
            updated_at,
            'recal-062' as "formatId"
          FROM ${getMateriaPrimaTable('analisis_materiales_empaque')}
          ORDER BY fecha_analisis DESC
        `;
        const result062 = await pool.query(query062);
        results.push(...result062.rows);
      } catch (error) {
        console.error('Error al obtener registros RE-CAL-062:', error);
      }

      return NextResponse.json(results);
    }

    // Filtros por fecha si se especifican
    const conditions: string[] = [];
    if (fechaInicio && fechaFin) {
      if (formatId === 'recal-040') {
        conditions.push('fecha BETWEEN $' + (conditions.length + 1) + ' AND $' + (conditions.length + 2));
      } else {
        conditions.push('fecha_analisis BETWEEN $' + (conditions.length + 1) + ' AND $' + (conditions.length + 2));
      }
      params.push(fechaInicio, fechaFin);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    if (formatId === 'recal-040') {
      query += ' ORDER BY fecha DESC';
    } else {
      query += ' ORDER BY fecha_analisis DESC';
    }

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener registros de materia prima:', error);
    return NextResponse.json(
      { error: 'Error al obtener los registros de materia prima' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formatId } = body;

    console.log('POST /api/materia-prima - formatId:', formatId);
    console.log('POST /api/materia-prima - body:', body);

    if (!formatId) {
      return NextResponse.json(
        { error: 'Falta el campo formatId' },
        { status: 400 }
      );
    }

    let query = '';
    let values: any[] = [];
    let tableName = '';

    if (formatId === 'recal-040') {
      tableName = getMateriaPrimaTable('inspeccion_vehiculo');
      console.log('POST /api/materia-prima - tableName:', tableName);
      const {
        fecha,
        proveedor,
        producto,
        nombreConductor,
        placaVehiculo,
        loteProveedor,
        responsableCalidad,
        observaciones,
        cumplimiento,
        tipoMaterial,
        checks,
        c,
        nc,
        na
      } = body;

      if (!fecha || !proveedor || !producto || !nombreConductor || !placaVehiculo || !responsableCalidad) {
        return NextResponse.json(
          { error: 'Faltan campos requeridos' },
          { status: 400 }
        );
      }

      query = `
        INSERT INTO ${tableName} (
          fecha, proveedor, producto, nombre_conductor, placa_vehiculo,
          lote_proveedor, responsable_calidad, observaciones, cumplimiento,
          tipo_material, checks, c, nc, na
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      values = [
        fecha,
        proveedor,
        producto,
        nombreConductor,
        placaVehiculo,
        loteProveedor || null,
        responsableCalidad,
        observaciones || null,
        cumplimiento || null,
        tipoMaterial || null,
        checks || null,
        c || null,
        nc || null,
        na || null
      ];

      console.log('POST /api/materia-prima - query:', query);
      console.log('POST /api/materia-prima - values:', values);
    } else if (formatId === 'recal-038') {
      tableName = getMateriaPrimaTable('analisis_fisicoquimico_materia_prima');
      const {
        materia_prima,
        fecha_ingreso,
        fecha_analisis,
        proveedor,
        producto,
        fecha_vencimiento,
        lote_interno,
        lote_proveedor,
        unds_analizar,
        l,
        brix,
        indice_refraccion,
        ph,
        densidad,
        acidez,
        neto,
        drenado,
        sulfitos_soppm,
        color,
        olor,
        sabor,
        textura,
        oxidacion,
        abolladura,
        filtracion,
        etiqueta,
        corrugado,
        identificacion_lote,
        und_analizar_visual,
        und_recibidas,
        realizado_por,
        observaciones,
        verificado_por
      } = body;

      if (!materia_prima || !fecha_ingreso || !fecha_analisis || !proveedor || !producto || !realizado_por) {
        return NextResponse.json(
          { error: 'Faltan campos requeridos' },
          { status: 400 }
        );
      }

      query = `
        INSERT INTO ${tableName} (
          materia_prima, fecha_ingreso, fecha_analisis, proveedor, producto,
          fecha_vencimiento, lote_interno, lote_proveedor, unds_analizar, l, brix,
          indice_refraccion, ph, densidad, acidez, neto, drenado, sulfitos_soppm,
          color, olor, sabor, textura, oxidacion, abolladura, filtracion, etiqueta,
          corrugado, identificacion_lote, und_analizar_visual, und_recibidas,
          realizado_por, observaciones, verificado_por
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
        RETURNING *
      `;

      values = [
        materia_prima, fecha_ingreso, fecha_analisis, proveedor, producto,
        fecha_vencimiento || null, lote_interno || null, lote_proveedor || null,
        unds_analizar || null, l || null, brix || null, indice_refraccion || null,
        ph || null, densidad || null, acidez || null, neto || null, drenado || null,
        sulfitos_soppm || null, color || null, olor || null, sabor || null,
        textura || null, oxidacion || null, abolladura || null, filtracion || null,
        etiqueta || null, corrugado || null, identificacion_lote || null,
        und_analizar_visual || null, und_recibidas || null, realizado_por,
        observaciones || null, verificado_por || null
      ];
    } else if (formatId === 'recal-062') {
      tableName = getMateriaPrimaTable('analisis_materiales_empaque');
      const {
        fecha_ingreso,
        fecha_analisis,
        proveedor,
        producto,
        lote_interno,
        lote_proveedor,
        unidades_analizar,
        peso,
        hermeticidad,
        punto_llenado,
        choque_termico,
        ajuste_etiqueta,
        verificacion_visual,
        diametro,
        largo,
        ancho,
        alto,
        observaciones,
        realizado_por
      } = body;

      if (!fecha_ingreso || !fecha_analisis || !proveedor || !producto || !realizado_por) {
        return NextResponse.json(
          { error: 'Faltan campos requeridos' },
          { status: 400 }
        );
      }

      query = `
        INSERT INTO ${tableName} (
          fecha_ingreso, fecha_analisis, proveedor, producto, lote_interno,
          lote_proveedor, unidades_analizar, peso, hermeticidad, punto_llenado,
          choque_termico, ajuste_etiqueta, verificacion_visual, diametro, largo,
          ancho, alto, observaciones, realizado_por
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *
      `;

      values = [
        fecha_ingreso, fecha_analisis, proveedor, producto, lote_interno || null,
        lote_proveedor || null, unidades_analizar || null, peso || null,
        hermeticidad || null, punto_llenado || null, choque_termico || null,
        ajuste_etiqueta || null, verificacion_visual || null, diametro || null,
        largo || null, ancho || null, alto || null, observaciones || null, realizado_por
      ];
    } else {
      return NextResponse.json(
        { error: 'formatId no válido' },
        { status: 400 }
      );
    }

    const result = await pool.query(query, values);
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error al crear registro de materia prima:', error);
    return NextResponse.json(
      { error: 'Error al crear el registro de materia prima' },
      { status: 500 }
    );
  }
}
