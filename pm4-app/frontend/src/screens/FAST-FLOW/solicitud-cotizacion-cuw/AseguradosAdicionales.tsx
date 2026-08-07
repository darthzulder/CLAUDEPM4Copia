import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ZdsInput, ZdsSelect, ZrModal, ZrButton, ZrTable } from '../../../components/fields/ZdsFields';
import { useCollection } from '../../../core/useCollection';
import type { CollectionDef } from '../../../core/useCollection';
import { scrollToFirstError } from '../../../core/scrollToFirstError';
import { resolveCollectionId } from '../../../core/pm4Resolve';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
export interface AseguradoAdicional {
  frm_aseg_adic_nombre: string;
  frm_aseg_adic_relacion: string;
  frm_aseg_adic_actividad_lista: string;
  frm_aseg_adic_actividad: string;
  frm_aseg_adic_codigo_naic: string;
  frm_aseg_adic_actividad_asegurada: 'SI' | 'NO';
  frm_aseg_adic_ingresos_operacionales: number | '';
}

interface Props {
  value: AseguradoAdicional[];
  onChange: (list: AseguradoAdicional[]) => void;
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------
// ⚠️ VERIFICADO CONTRA PM4 REAL (2026-08-04) — id 6 es "Actividades CIIU Crime" (carga sin
// error, mismo shape) pero no un NAIC genérico CO — mismo caso ambiguo que actividadNaic
// en variables.ts. FAST-FLOW legado, diferido.
const NAIC_ADIC_DEF: CollectionDef = {
  id: resolveCollectionId('actividadNaic', 6),
  labelField: 'data.frm_actividad',
  valueField: 'data.frm_codigo',
  pmqlTemplate: 'data.frm_pais = "CO"',
};

const ACTIVIDAD_ASEGURADA_OPTIONS = [
  { value: 'SI', label: 'Sí' },
  { value: 'NO', label: 'No' },
];

const NOMBRE_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9]+(?: [A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9]+)*$/;

const EMPTY_ROW: AseguradoAdicional = {
  frm_aseg_adic_nombre: '',
  frm_aseg_adic_relacion: '',
  frm_aseg_adic_actividad_lista: '',
  frm_aseg_adic_actividad: '',
  frm_aseg_adic_codigo_naic: '',
  frm_aseg_adic_actividad_asegurada: 'SI',
  frm_aseg_adic_ingresos_operacionales: '',
};

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
interface ModalProps {
  initial: AseguradoAdicional | null;
  onClose: () => void;
  onAccept: (row: AseguradoAdicional) => void;
}

function AseguradoModal({ initial, onClose, onAccept }: ModalProps) {
  const blnIsEdit = initial !== null;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AseguradoAdicional>({
    defaultValues: initial ?? EMPTY_ROW,
  });

  const { options: cllNaic, loading: naicLoading } = useCollection(NAIC_ADIC_DEF, {});

  const strActivityList = watch('frm_aseg_adic_actividad_lista');

  // Al elegir la actividad, autocompletamos el código y el nombre NAIC
  useEffect(() => {
    if (!strActivityList) return;
    const objMatch = cllNaic.find((objOpt) => objOpt.value === strActivityList);
    setValue('frm_aseg_adic_codigo_naic', strActivityList);
    setValue('frm_aseg_adic_actividad', objMatch?.label ?? '');
  }, [strActivityList, cllNaic, setValue]);

  function onSubmit(in_objData: AseguradoAdicional) {
    onAccept(in_objData);
  }

  return (
    <ZrModal model={true} onChange={(open: boolean) => { if (!open) onClose(); }}>
      <h3 style={{ margin: '0 0 var(--zs-100)', font: 'var(--zf-h-20)', color: 'var(--z-text)' }}>{blnIsEdit ? 'Editar asegurado' : 'Agregar'}</h3>
      <div z-flex="col:150">
            {/* 1. Nombre */}
            <ZdsInput
              label="Nombre del asegurado"
              required
              name="frm_aseg_adic_nombre"
              control={control}
              rules={{
                required: 'Campo requerido',
                pattern: {
                  value: NOMBRE_REGEX,
                  message: 'Solo letras, números y espacios simples entre palabras',
                },
              }}
              error={errors.frm_aseg_adic_nombre?.message}
            />

            {/* 2. Relación */}
            <ZdsInput
              label="Relación con el asegurado principal"
              required
              name="frm_aseg_adic_relacion"
              control={control}
              rules={{ required: 'Campo requerido' }}
              error={errors.frm_aseg_adic_relacion?.message}
            />

            {/* 3. Actividad (NAIC suggest) */}
            <ZdsSelect
              label="Actividad"
              name="frm_aseg_adic_actividad_lista"
              control={control}
              required
              rules={{ required: 'Campo requerido' }}
              options={cllNaic}
              loading={naicLoading}
              error={errors.frm_aseg_adic_actividad_lista?.message}
            />

            {/* 4. Código NAIC (readonly) + Actividad asegurada */}
            <div className="form-row cols-2">
              <ZdsInput
                label="Código NAIC"
                name="frm_aseg_adic_codigo_naic"
                control={control}
                readOnly
              />
              <ZdsSelect
                label="Actividad asegurada"
                name="frm_aseg_adic_actividad_asegurada"
                control={control}
                options={ACTIVIDAD_ASEGURADA_OPTIONS}
                error={errors.frm_aseg_adic_actividad_asegurada?.message}
              />
            </div>

            {/* 5. Ingresos operacionales */}
            <ZdsInput
              label="Ingresos operacionales anuales (COP)"
              required
              name="frm_aseg_adic_ingresos_operacionales"
              control={control}
              rules={{
                required: 'Campo requerido',
                min: { value: 500000000, message: 'Mínimo 500.000.000' },
                max: { value: 417500000000, message: 'Máximo 417.500.000.000' },
                valueAsNumber: true,
              }}
              error={errors.frm_aseg_adic_ingresos_operacionales?.message}
            />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--zs-75)', marginTop: 'var(--zs-150)' }}>
        <ZrButton config="secondary" onClick={onClose}>CANCELAR</ZrButton>
        <ZrButton config="primary:l" onClick={() => { handleSubmit(onSubmit, scrollToFirstError)(); }}>ACEPTAR</ZrButton>
      </div>
    </ZrModal>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function AseguradosAdicionales({ value, onChange }: Props) {
  const [blnModalOpen, setBlnModalOpen] = useState(false);
  const [intEditIndex, setIntEditIndex] = useState<number | null>(null);

  function handleAdd() {
    setIntEditIndex(null);
    setBlnModalOpen(true);
  }

  function handleEdit(in_intIndex: number) {
    setIntEditIndex(in_intIndex);
    setBlnModalOpen(true);
  }

  function handleDelete(in_intIndex: number) {
    const lstUpdated = value.filter((_, intI) => intI !== in_intIndex);
    onChange(lstUpdated);
  }

  function handleAccept(in_objRow: AseguradoAdicional) {
    if (intEditIndex !== null) {
      // Reemplazamos la fila en edición
      const lstUpdated = value.map((objItem, intI) => (intI === intEditIndex ? in_objRow : objItem));
      onChange(lstUpdated);
    } else {
      // Agregamos una fila nueva al final
      onChange([...value, in_objRow]);
    }
    setBlnModalOpen(false);
  }

  return (
    <div>
      <div z-flex z-align="right" style={{ marginBottom: 'var(--zs-50)' }}>
        <ZrButton config="secondary:s" icon="plus:line" onClick={handleAdd}>AGREGAR</ZrButton>
      </div>

      <ZrTable zebra>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Relación con el asegurado principal</th>
            <th>Actividad</th>
            <th>Código NAIC</th>
            <th>Actividad asegurada</th>
            <th>Ingresos operacionales (COP)</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {value.length === 0 ? (
            <tr>
              <td colSpan={7} className="record-empty">Sin asegurados adicionales</td>
            </tr>
          ) : (
            value.map((objRow, intI) => (
              <tr key={intI}>
                <td>{objRow.frm_aseg_adic_nombre}</td>
                <td>{objRow.frm_aseg_adic_relacion}</td>
                <td>{objRow.frm_aseg_adic_actividad}</td>
                <td>{objRow.frm_aseg_adic_codigo_naic}</td>
                <td>{objRow.frm_aseg_adic_actividad_asegurada}</td>
                <td>{objRow.frm_aseg_adic_ingresos_operacionales}</td>
                <td>
                  <ZrButton config="secondary:s" icon="edit:line" onClick={() => handleEdit(intI)}>Editar</ZrButton>
                  <ZrButton config="secondary:s" icon="trash:line" onClick={() => handleDelete(intI)}>Eliminar</ZrButton>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </ZrTable>

      {blnModalOpen && (
        <AseguradoModal
          initial={intEditIndex !== null ? value[intEditIndex] : null}
          onClose={() => setBlnModalOpen(false)}
          onAccept={handleAccept}
        />
      )}
    </div>
  );
}
