import { NextRequest, NextResponse } from 'next/server';
import {
  getProductionRecords,
  getProductionRecordsByCreatedDate,
  getProductionRecordsByProduct,
  getProductionRecordsByProductId,
  getProductionRecordById,
  createProductionRecord,
  updateProductionRecord,
  deleteProductionRecord,
  type ProductionRecord
} from '@/lib/server-db';
import {
  createEmbalajeRecord,
  type EmbalajeRecord
} from '@/lib/server-db';
import { getFechaActual } from '@/lib/date-utils';
import AuditService from '@/lib/audit-service';
import { authService } from '@/lib/auth-service';
import { fieldAuditService } from '@/lib/field-audit-service.server';
import { detectFieldChanges } from '@/lib/audit-utils';

// Función para obtener usuario autenticado
async function getAuthedUser(request: NextRequest) {
  console.log('🔍 getAuthedUser - Iniciando búsqueda de token...');
  
  // Primero intentar obtener token de cookie
  let token = request.cookies.get('auth-token')?.value;
  console.log('🍪 getAuthedUser - Token desde cookie:', !!token);
  
  // Si no hay cookie, intentar obtener del Authorization header
  if (!token) {
    const authHeader = request.headers.get('authorization');
    console.log('🔐 getAuthedUser - Authorization header:', authHeader);
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remover 'Bearer ' prefix
      console.log('🔐 Backend: Token obtenido desde Authorization header (fallback):', !!token);
    }
  } else {
    console.log('🔐 Backend: Token obtenido desde cookie');
  }
  
  if (!token) {
    console.log('❌ Backend: No se encontró token de autenticación');
    return null;
  }
  
  console.log('🔑 getAuthedUser - Token encontrado, validando sesión...');
  const user = await authService.validateSession(token);
  console.log('👤 getAuthedUser - Resultado de validateSession:', user ? {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  } : 'NULL');
  
  return user;
}

// GET - Obtener todos los registros de producción o un registro específico por ID
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/production-records - Obteniendo registros de producción');
    
    const { searchParams } = new URL(request.url);
    const productName = searchParams.get('productName');
    const productId = searchParams.get('productId');
    const recordId = searchParams.get('id');
    const createdDate = searchParams.get('createdDate');
    
    // Si se solicita un registro específico por ID
    if (recordId) {
      console.log('🔍 Buscando registro específico con ID:', recordId);
      
      try {
        // Importar la función para obtener un registro por ID
        const { getProductionRecordById } = await import('@/lib/server-db');
        const record = await getProductionRecordById(recordId);
        
        if (!record) {
          console.log('❌ Registro no encontrado con ID:', recordId);
          return NextResponse.json(
            { error: 'Registro no encontrado' },
            { status: 404 }
          );
        }
        
        console.log('✅ Registro encontrado:', record.id, record.lote);
        return NextResponse.json(record);
      } catch (dbError) {
        console.error('❌ Error al obtener registro por ID:', dbError);
        return NextResponse.json(
          { error: 'Error al obtener registro específico' },
          { status: 500 }
        );
      }
    }
    
    // Si se solicitan registros por producto o todos los registros
    let records: ProductionRecord[];

    if (createdDate) {
      records = await getProductionRecordsByCreatedDate(createdDate);
    } else if (productId) {
      console.log('🔍 API: Usando productId para buscar registros:', productId);
      try {
        records = await getProductionRecordsByProductId(productId);
        console.log('✅ API: Registros obtenidos con productId:', records.length);
      } catch (error) {
        console.error('❌ API: Error al obtener registros con productId:', error);
        throw error;
      }
    } else if (productName) {
      records = await getProductionRecordsByProduct(productName);
    } else {
      records = await getProductionRecords();
    }
    
    // Log para verificar los campos devueltos
    console.log('📋 Campos de registros devueltos:', records.length > 0 ? Object.keys(records[0]) : 'No records');
    if (records.length > 0) {
      console.log('🔍 Ejemplo de registro:', {
        id: records[0].id,
        equipo: records[0].equipo,
        producto: records[0].producto,
        lote: records[0].lote
      });
    }
    
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error en GET /api/production-records:', error);
    return NextResponse.json(
      { error: 'Error al obtener registros de producción' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo registro de producción
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/production-records - Iniciando creación de registro');
    
    const body = await request.json();
    console.log('📥 Datos recibidos en API:', JSON.stringify(body, null, 2));
    console.log('🔍 ESPECÍFICO - body.tempAM1:', body.tempAM1, typeof body.tempAM1);
    console.log('🔍 ESPECÍFICO - !body.tempAM1:', !body.tempAM1);
    
    // Validar campos requeridos
    // Si el status es 'pending', solo validar campos básicos
    const isPending = body.status === 'pending';
    
    const requiredFields = isPending ? [
      'fechaProduccion', 'mesCorte', 'producto', 'envase', 'lote',
      'tamanoLote', 'area', 'equipo', 'responsableProduccion'
    ] : [
      'fechaProduccion', 'fechaVencimiento', 'mesCorte', 'producto', 'lote',
      'tamanoLote', 'letraTamanoMuestra', 'area', 'equipo', 'liberacionInicial',
      'verificacionAleatoria', 'tempAM1', 'tempAM2', 'tempPM1', 'tempPM2',
      'analisisSensorial', 'pruebaHermeticidad', 'inspeccionMicropesajeMezcla',
      'inspeccionMicropesajeResultado', 'totalUnidadesRevisarDrenado',
      'pesoDrenadoDeclarado', 'rangoPesoDrenadoMin', 'rangoPesoDrenadoMax',
      'pesosDrenados', 'promedioPesoDrenado', 'encimaPesoDrenado',
      'debajoPesoDrenado', 'undIncumplenRangoDrenado', 'porcentajeIncumplenRangoDrenado',
      'totalUnidadesRevisarNeto', 'pesoNetoDeclarado', 'pesosNetos', 'promedioPesoNeto',
      'encimaPesoNeto', 'debajoPesoNeto', 'undIncumplenRangoNeto', 'porcentajeIncumplenRangoNeto',
      'pruebasVacio', 'responsableProduccion', 'fechaAnalisisPT', 'noMezclaPT',
      'vacioPT', 'pesoNetoRealPT', 'pesoDrenadoRealPT', 'brixPT', 'phPT',
      'acidezPT', 'ppmSo2PT', 'consistenciaPT', 'sensorialPT', 'tapadoCierrePT',
      'etiquetaPT', 'presentacionFinalPT', 'ubicacionMuestraPT', 'estadoPT',
      'responsableAnalisisPT'
    ];
    
    console.log('🔍 Validando campos requeridos...');
    console.log(`📋 Status: ${isPending ? 'PENDING' : 'COMPLETED'} - Validando ${requiredFields.length} campos`);
    console.log('📋 Campos requeridos:', requiredFields);
    
    for (const field of requiredFields) {
      const value = body[field];
      const isMissing = value === undefined || value === null || value === '';
      if (isMissing) {
        console.error(`❌ Campo faltante: ${field}`);
        return NextResponse.json(
          { error: `El campo ${field} es requerido` },
          { status: 400 }
        );
      }
    }
    console.log('✅ Todos los campos requeridos están presentes');
    
    // Convertir nombres de campos de camelCase a snake_case para la BD
    console.log('🔄 Convirtiendo nombres de campos...');
    
    // Función para formatear fechas a Date objects
    const formatDateForDB = (dateString: string) => {
      if (!dateString) return new Date(); // Default a hoy si es null
      try {
        // Si ya está en formato YYYY-MM-DD, crear Date desde ahí
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [y, m, d] = dateString.split('-').map(Number);
          // Date local (sin Z) para evitar cambio de día por zona horaria
          return new Date(y, m - 1, d);
        }
        // Convertir de formato ISO a Date
        return new Date(dateString);
      } catch (error) {
        console.error('Error formateando fecha:', dateString, error);
        return new Date(); // Devolver fecha actual si hay error
      }
    };
    
    // Función para manejar campos requeridos vs opcionales
    const handleField = (value: any, fieldName: string, isRequiredForCompleted: boolean = true) => {
      if (isPending) {
        // Para registros pendientes, mantener 'Pendiente' como valor válido
        // Solo convertir a null valores realmente vacíos
        if (value === undefined || value === null || value === '' || value === 'N/A') {
          return null;
        }
        // Mantener 'Pendiente' y otros valores no vacíos
        return value;
      } else {
        // Para registros completados, los campos requeridos no pueden ser nulos
        if (isRequiredForCompleted && (value === undefined || value === null || value === '')) {
          throw new Error(`El campo ${fieldName} es requerido para registros completados`);
        }
        return value;
      }
    };
    
    // Obtener usuario autenticado
    const user = await getAuthedUser(request);
    const userName = user?.name || user?.email || 'Usuario desconocido';
    
    // Debug: Log del usuario autenticado
    console.log('🔍 Debug POST - Usuario autenticado:', {
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      } : null,
      userName: userName,
      hasToken: !!request.cookies.get('auth-token')?.value
    });

    const recordData: any = {
      ...(body.fechaProduccion !== undefined ? { fechaproduccion: formatDateForDB(body.fechaProduccion) } : {}),
      ...(body.fechaVencimiento !== undefined ? { fechavencimiento: formatDateForDB(body.fechaVencimiento) } : {}),
      ...(body.mesCorte !== undefined ? { mescorte: body.mesCorte } : {}),
      ...(body.producto !== undefined ? { producto: body.producto } : {}),
      ...(body.productoNombre !== undefined || body.producto_nombre !== undefined
        ? { producto_nombre: body.productoNombre ?? body.producto_nombre }
        : {}),
      ...(body.envase !== undefined ? { envase: body.envase } : {}),
      ...(body.lote !== undefined ? { lote: body.lote } : {}),
      ...(body.tamanoLote !== undefined ? { tamano_lote: body.tamanoLote } : {}),
      ...(body.letraTamanoMuestra !== undefined ? { letratamano_muestra: body.letraTamanoMuestra } : {}),
      ...(body.area !== undefined ? { area: body.area } : {}),
      ...(body.equipo !== undefined ? { equipo: body.equipo } : {}),
      equipo: body.equipo,
      ...(body.responsableProduccion !== undefined ? { responsable_produccion: body.responsableProduccion } : {}),
      liberacion_inicial: (() => {
        const value = handleField(body.liberacionInicial, 'liberacion_inicial', false);
        // Forzar 'Pendiente' si el resultado es null (para cumplir NOT NULL)
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      verificacion_aleatoria: (() => {
        const value = handleField(body.verificacionAleatoria, 'verificacion_aleatoria', false);
        // Forzar 'Pendiente' si el resultado es null (para cumplir NOT NULL)
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      observaciones: body.observaciones || null,
      created_by: (() => {
        console.log('🔍 POST - Asignando created_by. userName:', userName);
        console.log('🔍 POST - Tipo de userName:', typeof userName);
        console.log('🔍 POST - Valor de userName:', JSON.stringify(userName));
        return userName;
      })(),
      tempam1: (() => {
        const value = handleField(body.tempAM1, 'tempam1', false);
        // Forzar 'Pendiente' si el resultado es null (para cumplir NOT NULL)
        if (isPending && (value === null || value === undefined || value === '')) {
          console.log('🚫 Forzando tempam1 a "Pendiente" porque llegó:', value);
          return 'Pendiente';
        }
        return value;
      })(),
      tempam2: (() => {
        const value = handleField(body.tempAM2, 'tempam2', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      temppm1: (() => {
        const value = handleField(body.tempPM1, 'temppm1', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      temppm2: (() => {
        const value = handleField(body.tempPM2, 'temppm2', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      analisis_sensorial: (() => {
        const value = handleField(body.analisisSensorial, 'analisis_sensorial', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      prueba_hermeticidad: (() => {
        const value = handleField(body.pruebaHermeticidad, 'prueba_hermeticidad', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      inspeccion_micropesaje_mezcla: (() => {
        const value = handleField(body.inspeccionMicropesajeMezcla, 'inspeccion_micropesaje_mezcla', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      inspeccion_micropesaje_resultado: (() => {
        const value = handleField(body.inspeccionMicropesajeResultado, 'inspeccion_micropesaje_resultado', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      total_unidades_revisar_drenado: (() => {
        const value = handleField(body.totalUnidadesRevisarDrenado, 'total_unidades_revisar_drenado', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      peso_drenado_declarado: (() => {
        const value = handleField(body.pesoDrenadoDeclarado, 'peso_drenado_declarado', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      rango_peso_drenado_min: (() => {
        const value = handleField(body.rangoPesoDrenadoMin, 'rango_peso_drenado_min', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      rango_peso_drenado_max: (() => {
        const value = handleField(body.rangoPesoDrenadoMax, 'rango_peso_drenado_max', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      pesos_drenados: (() => {
        const value = handleField(body.pesosDrenados, 'pesos_drenados', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      promedio_peso_drenado: (() => {
        const value = handleField(body.promedioPesoDrenado, 'promedio_peso_drenado', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      encima_peso_drenado: (() => {
        const value = handleField(body.encimaPesoDrenado, 'encima_peso_drenado', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      debajo_peso_drenado: (() => {
        const value = handleField(body.debajoPesoDrenado, 'debajo_peso_drenado', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      und_incumplen_rango_drenado: (() => {
        const value = handleField(body.undIncumplenRangoDrenado, 'und_incumplen_rango_drenado', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      porcentaje_incumplen_rango_drenado: (() => {
        const value = handleField(body.porcentajeIncumplenRangoDrenado, 'porcentaje_incumplen_rango_drenado', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      total_unidades_revisar_neto: (() => {
        const value = handleField(body.totalUnidadesRevisarNeto, 'total_unidades_revisar_neto', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      peso_neto_declarado: (() => {
        const value = handleField(body.pesoNetoDeclarado, 'peso_neto_declarado', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      pesos_netos: (() => {
        const value = handleField(body.pesosNetos, 'pesos_netos', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      promedio_peso_neto: (() => {
        const value = handleField(body.promedioPesoNeto, 'promedio_peso_neto', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      encima_peso_neto: (() => {
        const value = handleField(body.encimaPesoNeto, 'encima_peso_neto', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      debajo_peso_neto: (() => {
        const value = handleField(body.debajoPesoNeto, 'debajo_peso_neto', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      und_incumplen_rango_neto: (() => {
        const value = handleField(body.undIncumplenRangoNeto, 'und_incumplen_rango_neto', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      porcentaje_incumplen_rango_neto: (() => {
        const value = handleField(body.porcentajeIncumplenRangoNeto, 'porcentaje_incumplen_rango_neto', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      pruebas_vacio: (() => {
        const value = handleField(body.pruebasVacio, 'pruebas_vacio', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      novedades_proceso: body.novedadesProceso || null,
      observaciones_acciones_correctivas: body.observacionesAccionesCorrectivas || null,
      observaciones_analisis_pruebas: body.observacionesAnalisisPruebasTexto || null,
      observaciones_peso_drenado: body.observacionesPesoDrenadoTexto || null,
      observaciones_peso_neto: body.observacionesPesoNetoTexto || null,
      supervisor_calidad: (() => {
        const value = handleField(body.supervisorCalidad, 'supervisor_calidad', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      fechaanalisispt: (() => {
        const value = handleField(body.fechaAnalisisPT, 'fechaanalisispt', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return getFechaActual(); // Para fechas usar fecha actual
        }
        return value;
      })(),
      no_mezcla_pt: (() => {
        const value = handleField(body.noMezclaPT, 'no_mezcla_pt', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        if (value === null || value === undefined || value === '') {
          return null;
        }
        return value;
      })(),
      vacio_pt: (() => {
        const value = handleField(body.vacioPT, 'vacio_pt', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      peso_neto_real_pt: (() => {
        const value = handleField(body.pesoNetoRealPT, 'peso_neto_real_pt', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      peso_drenado_real_pt: (() => {
        const value = handleField(body.pesoDrenadoRealPT, 'peso_drenado_real_pt', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      brix_pt: (() => {
        const value = handleField(body.brixPT, 'brix_pt', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      ph_pt: (() => {
        const value = handleField(body.phPT, 'ph_pt', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      acidez_pt: (() => {
        const value = handleField(body.acidezPT, 'acidez_pt', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      ppm_so2_pt: (() => {
        const value = handleField(body.ppmSo2PT, 'ppm_so2_pt', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      consistencia_pt: (() => {
        const value = handleField(body.consistenciaPT, 'consistencia_pt', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      sensorial_pt: (() => {
        const value = handleField(body.sensorialPT, 'sensorial_pt', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      tapado_cierre_pt: (() => {
        const value = handleField(body.tapadoCierrePT, 'tapado_cierre_pt', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      etiqueta_pt: (() => {
        const value = handleField(body.etiquetaPT, 'etiqueta_pt', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      presentacion_final_pt: (() => {
        const value = handleField(body.presentacionFinalPT, 'presentacion_final_pt', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      ubicacion_muestra_pt: (() => {
        const value = handleField(body.ubicacionMuestraPT, 'ubicacion_muestra_pt', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      estado_pt: (() => {
        const value = handleField(body.estadoPT, 'estado_pt', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      responsable_analisis_pt: (() => {
        const value = handleField(body.responsableAnalisisPT, 'responsable_analisis_pt', false);
        if (isPending && (value === null || value === undefined || value === '')) {
          return 'Pendiente';
        }
        return value;
      })(),
      observaciones_pt: body.observacionesPT || null,
      updated_by: userName,
      status: body.status || 'completed'
    };
    
    console.log('📦 Datos convertidos para BD:', JSON.stringify(recordData, null, 2));

    console.log('💾 Llamando a createProductionRecord...');

    // Crear el registro de producción
    const newRecord = await createProductionRecord(recordData);
    console.log('✅ Registro de producción creado exitosamente:', newRecord.id);

    // Función para formatear fechas a Date objects
    const parseDateOnlyToDate = (raw: any): Date => {
      const fallback = getFechaActual(); // YYYY-MM-DD

      const asDateOnly = (() => {
        if (!raw) return fallback;
        if (typeof raw === 'string') {
          const dateOnly = raw.slice(0, 10);
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return dateOnly;
          const parsed = new Date(raw);
          if (isNaN(parsed.getTime())) return fallback;
          return parsed.toISOString().slice(0, 10);
        }
        if (raw instanceof Date) return raw.toISOString().slice(0, 10);
        return fallback;
      })();

      const [y, m, d] = asDateOnly.split('-').map(Number);
      // Date local (sin Z) para evitar cambio de día por zona horaria
      return new Date(y, m - 1, d);
    };

    // Para evitar desfases por zona horaria al leer la fecha desde DB,
    // usamos prioritariamente la fecha que envía el frontend.
    const fechaProduccionInput =
      typeof body?.fechaProduccion === 'string' && body.fechaProduccion.trim()
        ? body.fechaProduccion.trim()
        : null;

    // Calcular presentación automática basada en el peso neto declarado
    const presentacionAuto = recordData.peso_neto_declarado
      ? `${recordData.peso_neto_declarado}g`
      : 'Pendiente';

    const embalajeData = {
      fecha: parseDateOnlyToDate(fechaProduccionInput || recordData.fechaproduccion), // Igual a Producción
      mescorte: recordData.mescorte, // Mismo mes de corte
      producto: recordData.producto, // Mismo producto
      presentacion: presentacionAuto, // Autocompletar si hay peso neto
      lote: recordData.lote, // Mismo lote
      tamano_lote: 'Pendiente',
      nivel_inspeccion: 'Pendiente',
      cajas_revisadas: '0',
      total_unidades_revisadas: '0',
      total_unidades_revisadas_real: '0',
      unidades_faltantes: '0',
      porcentaje_faltantes: '0',
      etiqueta: 'Pendiente',
      porcentaje_etiqueta_no_conforme: '0',
      marcacion: 'Pendiente',
      porcentaje_marcacion_no_conforme: '0',
      presentacion_no_conforme: 'Pendiente',
      porcentaje_presentacion_no_conforme: '0',
      cajas: 'Pendiente',
      porcentaje_cajas_no_conformes: '0',
      responsable_identificador_cajas: 'Pendiente',
      responsable_embalaje: 'Pendiente',
      responsable_calidad: 'Pendiente',
      unidades_no_conformes: '0',
      porcentaje_incumplimiento: '0',
      created_by: '(Generado automáticamente)',
      updated_by: '(Generado automáticamente)'
    };

    console.log('📦 Datos del registro de embalaje pendiente:', {
      fecha: embalajeData.fecha,
      mescorte: embalajeData.mescorte,
      producto: embalajeData.producto,
      lote: embalajeData.lote,
      tamano_lote: embalajeData.tamano_lote
    });

    try {
      const newEmbalajeRecord = await createEmbalajeRecord(embalajeData);
      console.log('✅ Registro de embalaje pendiente creado exitosamente:', JSON.stringify(newEmbalajeRecord, null, 2));

      // Retornar ambos registros
      return NextResponse.json({
        productionRecord: newRecord,
        embalajeRecord: newEmbalajeRecord,
        message: 'Registro de producción y embalaje pendiente creados exitosamente'
      }, { status: 201 });
    } catch (embalajeError) {
      console.error('❌ Error al crear registro de embalaje pendiente:', embalajeError);
      // Si falla la creación del registro de embalaje, aún retornamos el registro de producción
      return NextResponse.json({
        productionRecord: newRecord,
        warning: 'Registro de producción creado, pero hubo un error al crear el registro de embalaje pendiente',
        embalajeError: embalajeError instanceof Error ? embalajeError.message : 'Unknown error'
      }, { status: 201 });
    }
  } catch (error) {
    console.error('❌ Error en POST /api/production-records:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    return NextResponse.json(
      { 
        error: 'Error al crear registro de producción',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace available'
      },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un registro de producción existente
export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/production-records - Actualizando registro de producción');
    
    const body = await request.json();
    const { id, ...updateData } = body;
    
    // Obtener usuario autenticado
    const user = await getAuthedUser(request);
    const userName = user?.name || user?.email || 'Usuario desconocido';
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID del registro es requerido' },
        { status: 400 }
      );
    }

    const existingRecord = await getProductionRecordById(id);
    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    // Regla de permisos:
    // - Si el registro está COMPLETADO, solo el rol 'jefe' puede editar.
    // - Si el registro está PENDIENTE, se mantiene la lógica actual (para poder completarlo).
    if (String((existingRecord as any)?.status ?? '').toLowerCase() === 'completed') {
      if (!user || String((user as any).role ?? '').toLowerCase() !== 'jefe') {
        return NextResponse.json(
          { error: 'No tienes permisos para editar un registro completado' },
          { status: 403 }
        );
      }
    }

    // Mapeo explícito de SOLO campos que existen en la tabla production_records
    // Basado en create_production_records_table_v2.sql
    const fieldMapping: Record<string, string | null> = {
      fechaProduccion: 'fechaproduccion',
      fechaVencimiento: 'fechavencimiento',
      mesCorte: 'mescorte',
      tamanoLote: 'tamano_lote',
      letraTamanoMuestra: 'letratamano_muestra',
      area: 'area',
      equipo: 'equipo',

      // Control de calidad (sin campos _obs)
      liberacionInicial: 'liberacion_inicial',
      verificacionAleatoria: 'verificacion_aleatoria',
      observaciones: 'observaciones',

      // Temperaturas
      tempAM1: 'tempam1',
      tempAM2: 'tempam2',
      tempPM1: 'temppm1',
      tempPM2: 'temppm2',
      analisisSensorial: 'analisis_sensorial',

      // Hermeticidad
      pruebaHermeticidad: 'prueba_hermeticidad',

      // Micropesaje
      inspeccionMicropesajeMezcla: 'inspeccion_micropesaje_mezcla',
      inspeccionMicropesajeResultado: 'inspeccion_micropesaje_resultado',

      // Peso drenado
      totalUnidadesRevisarDrenado: 'total_unidades_revisar_drenado',
      pesoDrenadoDeclarado: 'peso_drenado_declarado',
      rangoPesoDrenadoMin: 'rango_peso_drenado_min',
      rangoPesoDrenadoMax: 'rango_peso_drenado_max',
      pesosDrenados: 'pesos_drenados',
      promedioPesoDrenado: 'promedio_peso_drenado',
      encimaPesoDrenado: 'encima_peso_drenado',
      debajoPesoDrenado: 'debajo_peso_drenado',
      undIncumplenRangoDrenado: 'und_incumplen_rango_drenado',
      porcentajeIncumplenRangoDrenado: 'porcentaje_incumplen_rango_drenado',

      // Peso neto
      totalUnidadesRevisarNeto: 'total_unidades_revisar_neto',
      pesoNetoDeclarado: 'peso_neto_declarado',
      pesosNetos: 'pesos_netos',
      promedioPesoNeto: 'promedio_peso_neto',
      encimaPesoNeto: 'encima_peso_neto',
      debajoPesoNeto: 'debajo_peso_neto',
      undIncumplenRangoNeto: 'und_incumplen_rango_neto',
      porcentajeIncumplenRangoNeto: 'porcentaje_incumplen_rango_neto',

      // Pruebas y observaciones finales
      pruebasVacio: 'pruebas_vacio',
      novedadesProceso: 'novedades_proceso',
      observacionesAccionesCorrectivas: 'observaciones_acciones_correctivas',
      observacionesAnalisisPruebas: 'observaciones_analisis_pruebas',
      observacionesPesoDrenado: 'observaciones_peso_drenado',
      observacionesPesoNeto: 'observaciones_peso_neto',
      supervisorCalidad: 'supervisor_calidad',
      responsableProduccion: 'responsable_produccion',

      // Análisis PT
      fechaAnalisisPT: 'fechaanalisispt',
      noMezclaPT: 'no_mezcla_pt',
      vacioPT: 'vacio_pt',
      pesoNetoRealPT: 'peso_neto_real_pt',
      pesoDrenadoRealPT: 'peso_drenado_real_pt',
      brixPT: 'brix_pt',
      phPT: 'ph_pt',
      acidezPT: 'acidez_pt',
      ppmSo2PT: 'ppm_so2_pt',
      consistenciaPT: 'consistencia_pt',
      sensorialPT: 'sensorial_pt',
      tapadoCierrePT: 'tapado_cierre_pt',
      etiquetaPT: 'etiqueta_pt',
      presentacionFinalPT: 'presentacion_final_pt',
      ubicacionMuestraPT: 'ubicacion_muestra_pt',
      estadoPT: 'estado_pt',
      observacionesPT: 'observaciones_pt',
      responsableAnalisisPT: 'responsable_analisis_pt',

      // Control y auditoría
      createdBy: 'created_by',
      updatedBy: 'updated_by',
      status: 'status',
      producto: 'producto',

      // Campos que NO existen en la BD - ignorar completamente
      productoNombre: null,
      envase: 'envase',
      liberacionInicialObs: null,
      verificacionAleatoriaObs: null,
      analisisSensorialObs: null,
      analisisSensorialCorreccion: null,
      pruebaHermeticidadObs: null,
      pruebaHermeticidadCorreccion: null,
      inspeccionMicropesajeMezclaObs: null,
      inspeccionMicropesajeMezclaCorreccion: null,
      inspeccionMicropesajeResultadoObs: null,
      inspeccionMicropesajeResultadoCorreccion: null,
      envaseTemperatura: null,
    };
    // Convertir nombres de campos usando el mapeo explícito
    const convertedData: any = {};
    
    Object.keys(updateData).forEach(key => {
      if (Object.prototype.hasOwnProperty.call(fieldMapping, key)) {
        const mappedKey = fieldMapping[key];
        // Solo agregar si el campo existe en BD
        if (mappedKey) {
          convertedData[mappedKey] = updateData[key];
        }
      } else {
        // Campos completamente desconocidos
        console.warn(`⚠️ Campo desconocido ignorado: ${key}`);
      }
    });
    
    // Agregar usuario que actualiza el registro
    convertedData.updated_by = userName;
    
    console.log('🔄 Datos convertidos para actualización:', convertedData);

    let updatedRecord: any;
    try {
      updatedRecord = await updateProductionRecord(id, convertedData);
    } catch (err: any) {
      // Compatibilidad: algunas instalaciones no tienen la columna `envase` en production_records
      const isMissingColumnEnvase =
        (err?.code === '42703' || String(err?.message || '').includes('42703')) &&
        String(err?.message || '').toLowerCase().includes('envase');

      const isMissingColumnResponsableProduccion =
        (err?.code === '42703' || String(err?.message || '').includes('42703')) &&
        (String(err?.message || '').toLowerCase().includes('responsable_produccion') ||
          String(err?.message || '').toLowerCase().includes('responsableproduccion'));

      if (isMissingColumnEnvase && Object.prototype.hasOwnProperty.call(convertedData, 'envase')) {
        console.warn('⚠️ Columna envase no existe en production_records. Reintentando PUT sin envase...');
        const { envase, ...withoutEnvase } = convertedData;
        updatedRecord = await updateProductionRecord(id, withoutEnvase);
      } else if (
        isMissingColumnResponsableProduccion &&
        Object.prototype.hasOwnProperty.call(convertedData, 'responsable_produccion')
      ) {
        console.warn(
          '⚠️ Columna responsable_produccion no existe en production_records. Reintentando PUT sin responsable_produccion...'
        );
        const { responsable_produccion, ...withoutResp } = convertedData;
        updatedRecord = await updateProductionRecord(id, withoutResp);
      } else {
        throw err;
      }
    }
    
    if (!updatedRecord) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    // 🔍 AUDITORÍA: Detectar y registrar cambios
    try {
      console.log('🔍 AUDITORÍA - Detectando cambios en el registro...');
      
      // Detectar cambios SOLO sobre campos reales de BD.
      // Importante: el frontend puede enviar payloads con valores vacíos/default al abrir,
      // lo cual causaba falsos positivos ("establecido como N/A").
      const auditData: any = { ...convertedData };
      // Nunca auditar metadatos/control
      delete auditData.updated_by;

      // Filtrar valores vacíos que no representan un cambio real (p.ej. '' cuando antes era null/undefined)
      for (const [key, value] of Object.entries(auditData)) {
        if (value === undefined) {
          delete auditData[key];
          continue;
        }

        if (value === '' && (existingRecord?.[key] === null || existingRecord?.[key] === undefined || existingRecord?.[key] === '')) {
          delete auditData[key];
          continue;
        }
      }

      // Detectar cambios entre el registro original y lo que realmente se intenta actualizar
      const changes = detectFieldChanges(existingRecord, auditData, ['id', 'created_at', 'updated_at', 'created_by', 'updated_by']);
      
      if (changes.length > 0) {
        console.log(`📝 AUDITORÍA - Se detectaron ${changes.length} cambios:`, changes);
        
        // Registrar cada cambio en la tabla de auditoría
        await fieldAuditService.logMultipleChanges(
          'production_records',
          id,
          changes,
          userName,
          {
            userRole: user?.role,
            userEmail: user?.email || undefined,
            sessionId: request.cookies.get('auth-token')?.value || undefined,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
          }
        );
        
        console.log('✅ AUDITORÍA - Cambios registrados exitosamente');
      } else {
        console.log('ℹ️ AUDITORÍA - No se detectaron cambios en el registro');
      }
    } catch (auditError) {
      console.error('❌ AUDITORÍA - Error al registrar cambios:', auditError);
      // No fallamos la actualización si la auditoría falla
    }
    
    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error('Error en PUT /api/production-records:', error);
    return NextResponse.json(
      { error: 'Error al actualizar registro de producción' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un registro de producción
export async function DELETE(request: NextRequest) {
  try {
    console.log('DELETE /api/production-records - Eliminando registro de producción');

    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (String((user as any).role ?? '').toLowerCase() !== 'jefe') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar registros de producción' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID del registro es requerido' },
        { status: 400 }
      );
    }
    
    const deleted = await deleteProductionRecord(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Registro eliminado exitosamente' });
  } catch (error) {
    console.error('Error en DELETE /api/production-records:', error);
    return NextResponse.json(
      { error: 'Error al eliminar registro de producción' },
      { status: 500 }
    );
  }
}
