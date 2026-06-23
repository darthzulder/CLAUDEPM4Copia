import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ZdsInput, ZdsSelect, ZrModal, ZrButton, ZrTable } from '../../components/fields/ZdsFields';
import { useCollection } from '../../core/useCollection';
import type { CollectionDef } from '../../core/useCollection';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ExportacionRow {
  frm_exportacion_pais: string;
  frm_exportacion_pais_label: string;
  frm_exportacion_region_label: string;
  frm_exportacion_region_codigo: string;
  frm_exportacion_ventas: number | '';
  frm_exportacion_ventas_formateado: string;
  frm_exportacion_porcentaje: number | '';
  frm_exportacion_porcentaje_formateado: string;
}

interface Props {
  value: ExportacionRow[];
  onChange: (list: ExportacionRow[]) => void;
  moneda?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PAISES_DEF: CollectionDef = {
  id: 36,
  labelField: 'data.pais_reg_pais',
  valueField: 'id',
};

const EMPTY_ROW: ExportacionRow = {
  frm_exportacion_pais: '',
  frm_exportacion_pais_label: '',
  frm_exportacion_region_label: '',
  frm_exportacion_region_codigo: '',
  frm_exportacion_ventas: '',
  frm_exportacion_ventas_formateado: '',
  frm_exportacion_porcentaje: '',
  frm_exportacion_porcentaje_formateado: '',
};

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
interface ModalProps {
  initial: ExportacionRow | null;
  onClose: () => void;
  onAccept: (row: ExportacionRow) => void;
}

function ExportacionModal({ initial, onClose, onAccept }: ModalProps) {
  const isEdit = initial !== null;
  const { control, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<ExportacionRow>({ defaultValues: initial ?? EMPTY_ROW });

  const { options: paisOptions, loading: paisLoading, rawMap } = useCollection(PAISES_DEF, {});

  const paisValue = watch('frm_exportacion_pais');

  useEffect(() => {
    if (!paisValue || !rawMap[paisValue]) return;
    const rec = rawMap[paisValue] as { data?: Record<string, string> };
    setValue('frm_exportacion_pais_label', rec.data?.pais_reg_pais ?? '');
    setValue('frm_exportacion_region_label', rec.data?.pais_reg_region ?? '');
    setValue('frm_exportacion_region_codigo', rec.data?.pais_reg_codigo_region ?? '');
  }, [paisValue, rawMap, setValue]);

  function onSubmit(data: ExportacionRow) {
    const ventas = data.frm_exportacion_ventas as number;
    const pct = data.frm_exportacion_porcentaje as number;
    onAccept({
      ...data,
      frm_exportacion_ventas_formateado: ventas != null ? ventas.toLocaleString('es-CO') : '',
      frm_exportacion_porcentaje_formateado: pct != null ? `${pct} %` : '',
    });
  }

  return (
    <ZrModal model={true} onChange={(open: boolean) => { if (!open) onClose(); }}>
      <h3 style={{ margin: '0 0 var(--zs-100)', font: 'var(--zf-h-20)', color: 'var(--z-text)' }}>{isEdit ? 'Editar exportación' : 'Agregar exportación'}</h3>
      <div className="modal-form-body">
            <ZdsSelect<ExportacionRow>
              label="País"
              name="frm_exportacion_pais"
              control={control}
              required
              rules={{ required: 'Campo requerido' }}
              options={paisOptions}
              loading={paisLoading}
              error={errors.frm_exportacion_pais?.message}
            />
            <div className="form-row cols-2">
              <ZdsInput
                label="Región"
                name="frm_exportacion_region_label"
                control={control}
                readOnly
              />
              <ZdsInput
                label="Ventas"
                required
                name="frm_exportacion_ventas"
                control={control}
                rules={{
                  required: 'Campo requerido',
                  min: { value: 1, message: 'Mínimo 1' },
                  valueAsNumber: true,
                }}
                error={errors.frm_exportacion_ventas?.message}
              />
            </div>
            <ZdsInput
              label="Porcentaje de ventas (%)"
              required
              name="frm_exportacion_porcentaje"
              control={control}
              rules={{
                required: 'Campo requerido',
                min: { value: 1, message: 'Mínimo 1' },
                max: { value: 100, message: 'Máximo 100' },
                valueAsNumber: true,
              }}
              error={errors.frm_exportacion_porcentaje?.message}
            />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--zs-75)', marginTop: 'var(--zs-150)' }}>
        <ZrButton config="secondary" onClick={onClose}>CANCELAR</ZrButton>
        <ZrButton config="primary:l" onClick={() => { handleSubmit(onSubmit)(); }}>ACEPTAR</ZrButton>
      </div>
    </ZrModal>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function DetalleExportaciones({ value, onChange }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const totalVentas = value.reduce((s, r) => s + (Number(r.frm_exportacion_ventas) || 0), 0);
  const totalPct = value.reduce((s, r) => s + (Number(r.frm_exportacion_porcentaje) || 0), 0);

  function handleAccept(row: ExportacionRow) {
    if (editIndex !== null) {
      onChange(value.map((item, i) => (i === editIndex ? row : item)));
    } else {
      onChange([...value, row]);
    }
    setModalOpen(false);
  }

  return (
    <div>
      <div className="record-table-header">
        <ZrButton config="secondary:s" icon="plus:line" onClick={() => { setEditIndex(null); setModalOpen(true); }}>AGREGAR</ZrButton>
      </div>

      <ZrTable zebra>
      <table>
        <thead>
          <tr>
            <th>País</th>
            <th>Región</th>
            <th>Ventas</th>
            <th>Ventas (%)</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {value.length === 0 ? (
            <tr><td colSpan={5} className="record-empty">Sin exportaciones registradas</td></tr>
          ) : (
            value.map((row, i) => (
              <tr key={i}>
                <td>{row.frm_exportacion_pais_label}</td>
                <td>{row.frm_exportacion_region_label}</td>
                <td>{row.frm_exportacion_ventas_formateado}</td>
                <td>{row.frm_exportacion_porcentaje_formateado}</td>
                <td>
                  <ZrButton config="secondary:s" icon="edit:line" onClick={() => { setEditIndex(i); setModalOpen(true); }}>Editar</ZrButton>
                  <ZrButton config="secondary:s" icon="trash:line" onClick={() => onChange(value.filter((_, j) => j !== i))}>Eliminar</ZrButton>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </ZrTable>

      <div style={{ textAlign: 'right', font: 'var(--zf-capt-14)', color: 'var(--z-text)', marginTop: 8 }}>
        <span style={{ marginRight: 24 }}>Sumatoria de ventas: {totalVentas.toLocaleString('es-CO')}</span>
        <span>Sumatoria del porcentaje de ventas: {totalPct} %</span>
      </div>

      {modalOpen && (
        <ExportacionModal
          initial={editIndex !== null ? value[editIndex] : null}
          onClose={() => setModalOpen(false)}
          onAccept={handleAccept}
        />
      )}
    </div>
  );
}
