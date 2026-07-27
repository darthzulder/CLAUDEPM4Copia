import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCollection, type CollectionOption } from '../../../../core/useCollection';
import ScreenHeader from '../../../../components/ScreenHeader';
import FormSection from '../../../../components/FormSection';
import { ZdsSelect, ZdsInput, ZrButton, ZrAlert, ZrLoader } from '../../../../components/fields/ZdsFields';
import TablaCasos from './TablaCasos';
import DetalleCasoModal from './DetalleCasoModal';
import { useCasosDashboard } from './useCasosDashboard';
import { SAMPLE_CASES, calcularKpis, casosToCSV } from './dashboardHelpers';
import {
  QD_COLLECTIONS, SCR013_OPTIONS_ESTADO as OPTIONS_ESTADO,
  SCR013_FILTROS_DEFAULT as FILTROS_DEFAULT, SCR013_PAGE_SIZE as PAGE_SIZE,
} from '../fields/fields';
import type { CasoDashboard, FiltrosDashboard } from '../fields/types';

// Colección de opciones → {options con "Todos", map código→label}.
function useFilterCatalog(def: Parameters<typeof useCollection>[0], todos: string) {
  const { options } = useCollection(def);
  const conTodos = useMemo(
    () => [{ value: '', label: todos }, ...options.map((o: CollectionOption) => ({ value: o.value, label: o.label }))],
    [options, todos],
  );
  const map = useMemo(
    () => Object.fromEntries(options.map((o: CollectionOption) => [o.value, o.label])),
    [options],
  );
  return { options: conTodos, map };
}

// Descarga un CSV con los casos ya filtrados (búsqueda actual).
function descargarCSV(casos: CasoDashboard[], tipoMap: Record<string, string>, areaMap: Record<string, string>) {
  const csv = casosToCSV(casos, tipoMap, areaMap);
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'reporte-casos-quejas-directas.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function DashboardGestionCasos() {
  const { casos: casosApi, loading, error } = useCasosDashboard();

  // Filtros catalogados desde colecciones PM4 (Tipo id 18, Área id 35). Estado es operativo.
  const tipo = useFilterCatalog(QD_COLLECTIONS.requestType, 'Todos');
  const area = useFilterCatalog(QD_COLLECTIONS.area, 'Todas');

  const { control, watch, reset } = useForm<FiltrosDashboard>({ defaultValues: FILTROS_DEFAULT });
  const draft = watch();

  const [aplicados, setAplicados] = useState<FiltrosDashboard>(FILTROS_DEFAULT);
  const [page, setPage] = useState(1);
  const [casoSel, setCasoSel] = useState<CasoDashboard | null>(null);

  // Fallback a datos de ejemplo solo si la API no devolvió casos (p.ej. dev sin token real).
  const casos: CasoDashboard[] = casosApi.length > 0 ? casosApi : SAMPLE_CASES;

  const kpis = useMemo(() => calcularKpis(casos), [casos]);

  // Filtrado cliente-side sobre los filtros ya aplicados (comparando códigos de colección).
  const filtrados = useMemo(() => {
    const q = aplicados.filtroBuscar.trim().toLowerCase();
    return casos.filter((c) => {
      if (aplicados.filtroTipo && c.tipoSolicitud !== aplicados.filtroTipo) return false;
      if (aplicados.filtroEstado && c.estado !== aplicados.filtroEstado) return false;
      if (aplicados.filtroArea && c.areaResponsable !== aplicados.filtroArea) return false;
      if (q && !`${c.numeroCaso} ${c.responsable} ${tipo.map[c.tipoSolicitud] ?? c.tipoSolicitud}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [casos, aplicados, tipo.map]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginaActual = Math.min(page, totalPaginas);
  const inicio = (paginaActual - 1) * PAGE_SIZE;
  const pagina = filtrados.slice(inicio, inicio + PAGE_SIZE);

  const aplicarFiltros = () => { setAplicados(draft); setPage(1); };
  const limpiarFiltros = () => { reset(FILTROS_DEFAULT); setAplicados(FILTROS_DEFAULT); setPage(1); };

  if (loading) {
    return <div className="screen-wrapper"><div className="screen-loading"><ZrLoader /></div></div>;
  }

  return (
    <div className="screen-wrapper">
      <ScreenHeader
        title="Dashboard — Gestión de Casos"      />

      <div className="screen-content">
        {/* Aviso informativo (mockup: alerta superior). */}
        <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
          Vista en tiempo real de todos los casos activos. Los contadores se actualizan
          automáticamente. Los casos <strong>Vencidos</strong> requieren atención inmediata.
        </ZrAlert>

        {/* Si PM4 no entregó datos, se muestran casos de ejemplo. */}
        {error && (
          <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
            No se pudieron cargar los casos desde PM4 ({error}). Mostrando datos de ejemplo.
          </ZrAlert>
        )}

        {/* Barra superior: título de trabajo + Descargar reporte. */}
        <div className="dashboard-toolbar">
          <h2 className="section-title" style={{ margin: 0 }}>Gestión de Casos</h2>
          <ZrButton
            config="primary:s"
            icon="download:line"
            disabled={filtrados.length === 0}
            onClick={() => descargarCSV(filtrados, tipo.map, area.map)}
          >
            Descargar reporte
          </ZrButton>
        </div>

        {/* KPIs de SLA. */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-card-label">Casos abiertos</span>
            <span className="kpi-card-value">{kpis.abiertos}</span>
          </div>
          <div className="kpi-card kpi-card--warn">
            <span className="kpi-card-label">Próximos a vencer</span>
            <span className="kpi-card-value">{kpis.porVencer}</span>
          </div>
          <div className="kpi-card kpi-card--danger">
            <span className="kpi-card-label">Vencidos</span>
            <span className="kpi-card-value">{kpis.vencidos}</span>
          </div>
          <div className="kpi-card kpi-card--ok">
            <span className="kpi-card-label">Cerrados</span>
            <span className="kpi-card-value">{kpis.cerrados}</span>
          </div>
        </div>

        {/* Filtros. */}
        <FormSection title="Filtros">
          <div className="form-row cols-4">
            <ZdsSelect name="filtroTipo" control={control} label="Tipo de solicitud" options={tipo.options} withSearch />
            <ZdsSelect name="filtroEstado" control={control} label="Estado" options={OPTIONS_ESTADO} />
            <ZdsSelect name="filtroArea" control={control} label="Área responsable" options={area.options} withSearch />
            <ZdsInput name="filtroBuscar" control={control} label="Buscar por caso o responsable" icon="search:line" />
          </div>
          <div z-flex="75" z-align="right:center" style={{ marginTop: 'var(--zs-100)' }}>
            <ZrButton config="secondary:s" onClick={limpiarFiltros}>Limpiar</ZrButton>
            <ZrButton config="primary:s" onClick={aplicarFiltros}>Aplicar filtros</ZrButton>
          </div>
        </FormSection>

        {/* Tabla de casos. */}
        <TablaCasos casos={pagina} tipoMap={tipo.map} areaMap={area.map} onVer={setCasoSel} />

        {/* Paginación. */}
        <div className="dashboard-pagination">
          <span className="field-hint">
            {filtrados.length === 0
              ? 'Sin casos'
              : `Mostrando ${inicio + 1}–${Math.min(inicio + PAGE_SIZE, filtrados.length)} de ${filtrados.length} casos`}
          </span>
          <div z-flex="50" z-align="right:center">
            <ZrButton config="secondary:s" disabled={paginaActual <= 1} onClick={() => setPage(paginaActual - 1)}>
              ‹ Anterior
            </ZrButton>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
              <ZrButton
                key={n}
                config={n === paginaActual ? 'primary:s' : 'secondary:s'}
                onClick={() => setPage(n)}
              >
                {String(n)}
              </ZrButton>
            ))}
            <ZrButton config="secondary:s" disabled={paginaActual >= totalPaginas} onClick={() => setPage(paginaActual + 1)}>
              Siguiente ›
            </ZrButton>
          </div>
        </div>
      </div>

      {/* Modal de detalle de caso. */}
      {casoSel && (
        <DetalleCasoModal
          caso={casoSel}
          tipoMap={tipo.map}
          areaMap={area.map}
          onClose={() => setCasoSel(null)}
        />
      )}
    </div>
  );
}
