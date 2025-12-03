export interface DashboardResponse {
  estadisticas: Estadisticas;
  finanzas: Finanzas;
  clientes_mascotas: ClientesMascotas;
  servicios: Servicios;
}

/* -------------------- ESTADÍSTICAS -------------------- */
export interface Estadisticas {
  ingresos_totales: number;
  clientes_activos: number;
  total_mascotas: number;
  promedio_por_cliente: number;
}

/* -------------------- FINANZAS -------------------- */
export interface Finanzas {
  ingreso_mensual_por_servicio: IngresoMensualServicio[];
  distribucion_egresos: Egreso[];
  rentabilidad_servicios: Rentabilidad[];
}

export interface IngresoMensualServicio {
  servicio: string;
  mes: string;
  total: number;
}

export interface Egreso {
  motivo?: string;
  total?: number;
}

export interface Rentabilidad {
  servicio: string;
  ingresos: number;
  costos: number;
  porcentaje: number;
}

/* -------------------- CLIENTES Y MASCOTAS -------------------- */
export interface ClientesMascotas {
  nuevos_clientes_6_meses: NuevosClientes[];
  promedio_clientes_6_meses: number;
  mascotas_por_especie: MascotaEspecie[];
  frecuencia_visitas: number;
  tasa_retencion: number;
}

export interface NuevosClientes {
  mes: string;
  total: number;
}

export interface MascotaEspecie {
  especie: string;
  total: number;
}

/* -------------------- SERVICIOS -------------------- */
export interface Servicios {
  mas_solicitados: ServicioMasSolicitado[];
  promedio_gasto: PromedioGasto;
  tendencia_6_meses: TendenciaServicio[];
}

export interface ServicioMasSolicitado {
  servicio: string;
  visitas: number;
}

export interface TendenciaServicio {
  mes: string;
  total: number;
}

export interface PromedioGasto {
  por_visita: number;
  mensual: number;
  anual: number;
}
