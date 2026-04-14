import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getMateriaPrimaTable, getPoolConfig } from '../../materia-prima-config';

export const runtime = 'nodejs';

const pool = new Pool(getPoolConfig());

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Intentar buscar en cada tabla
    const tables = [
      { name: 'inspeccion_vehiculo', formatId: 'recal-040' },
      { name: 'analisis_fisicoquimico_materia_prima', formatId: 'recal-038' },
      { name: 'analisis_materiales_empaque', formatId: 'recal-062' }
    ];

    for (const table of tables) {
      const query = `SELECT * FROM ${getMateriaPrimaTable(table.name as any)} WHERE id = $1`;
      const result = await pool.query(query, [id]);
      
      if (result.rows.length > 0) {
        const record = result.rows[0];
        return NextResponse.json({ ...record, "formatId": table.formatId });
      }
    }

    return NextResponse.json(
      { error: 'Registro no encontrado' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error al obtener registro de materia prima:', error);
    return NextResponse.json(
      { error: 'Error al obtener el registro de materia prima' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { formatId } = body;

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

      query = `
        UPDATE ${tableName}
        SET
          fecha = $1,
          proveedor = $2,
          producto = $3,
          nombre_conductor = $4,
          placa_vehiculo = $5,
          lote_proveedor = $6,
          responsable_calidad = $7,
          observaciones = $8,
          cumplimiento = $9,
          tipo_material = $10,
          checks = $11,
          c = $12,
          nc = $13,
          na = $14,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $15
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
        na || null,
        id
      ];
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

      query = `
        UPDATE ${tableName}
        SET
          materia_prima = $1,
          fecha_ingreso = $2,
          fecha_analisis = $3,
          proveedor = $4,
          producto = $5,
          fecha_vencimiento = $6,
          lote_interno = $7,
          lote_proveedor = $8,
          unds_analizar = $9,
          l = $10,
          brix = $11,
          indice_refraccion = $12,
          ph = $13,
          densidad = $14,
          acidez = $15,
          neto = $16,
          drenado = $17,
          sulfitos_soppm = $18,
          color = $19,
          olor = $20,
          sabor = $21,
          textura = $22,
          oxidacion = $23,
          abolladura = $24,
          filtracion = $25,
          etiqueta = $26,
          corrugado = $27,
          identificacion_lote = $28,
          und_analizar_visual = $29,
          und_recibidas = $30,
          realizado_por = $31,
          observaciones = $32,
          verificado_por = $33,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $34
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
        observaciones || null, verificado_por || null, id
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

      query = `
        UPDATE ${tableName}
        SET
          fecha_ingreso = $1,
          fecha_analisis = $2,
          proveedor = $3,
          producto = $4,
          lote_interno = $5,
          lote_proveedor = $6,
          unidades_analizar = $7,
          peso = $8,
          hermeticidad = $9,
          punto_llenado = $10,
          choque_termico = $11,
          ajuste_etiqueta = $12,
          verificacion_visual = $13,
          diametro = $14,
          largo = $15,
          ancho = $16,
          alto = $17,
          observaciones = $18,
          realizado_por = $19,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $20
        RETURNING *
      `;

      values = [
        fecha_ingreso, fecha_analisis, proveedor, producto, lote_interno || null,
        lote_proveedor || null, unidades_analizar || null, peso || null,
        hermeticidad || null, punto_llenado || null, choque_termico || null,
        ajuste_etiqueta || null, verificacion_visual || null, diametro || null,
        largo || null, ancho || null, alto || null, observaciones || null, realizado_por, id
      ];
    } else {
      return NextResponse.json(
        { error: 'formatId no válido' },
        { status: 400 }
      );
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    // Agregar formatId a la respuesta para que el frontend pueda identificar el tipo de registro
    const updatedRecord = {
      ...result.rows[0],
      "formatId": formatId
    };

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error('Error al actualizar registro de materia prima:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el registro de materia prima' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const formatId = searchParams.get('formatId');

    if (!formatId) {
      return NextResponse.json(
        { error: 'Falta el parámetro formatId' },
        { status: 400 }
      );
    }

    let tableName = '';

    if (formatId === 'recal-040') {
      tableName = getMateriaPrimaTable('inspeccion_vehiculo');
    } else if (formatId === 'recal-038') {
      tableName = getMateriaPrimaTable('analisis_fisicoquimico_materia_prima');
    } else if (formatId === 'recal-062') {
      tableName = getMateriaPrimaTable('analisis_materiales_empaque');
    } else {
      return NextResponse.json(
        { error: 'formatId no válido' },
        { status: 400 }
      );
    }

    const query = `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Registro eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar registro de materia prima:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el registro de materia prima' },
      { status: 500 }
    );
  }
}
