import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ZdsInput, ZdsSelect, ZrModal, ZrButton, ZrTable } from '../../../components/fields/ZdsFields';
import { useCollection } from '../../../core/useCollection';
import type { CollectionDef } from '../../../core/useCollection';

// ---------------------------------------------------------------------------
// Types
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
// Constants
// ---------------------------------------------------------------------------
const NAIC_ADIC_DEF: CollectionDef = {
  id: 6,
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
  const isEdit = initial !== null;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AseguradoAdicional>({
    defaultValues: initial ?? EMPTY_ROW,
  });

  const { options: naicOptions, loading: naicLoading } = useCollection(NAIC_ADIC_DEF, {});

  const actividadLista = watch('frm_aseg_adic_actividad_lista');

  useEffect(() => {
    if (!actividadLista) return;
    const match = naicOptions.find((o) => o.value === actividadLista);
    setValue('frm_aseg_adic_codigo_naic', actividadLista);
    setValue('frm_aseg_adic_actividad', match?.label ?? '');
  }, [actividadLista, naicOptions, setValue]);

  function onSubmit(data: AseguradoAdicional) {
    onAccept(data);
  }

  return (
    <ZrModal model={true} onChange={(open: boolean) => { if (!open) onClose(); }}>
      <h3 style={{ margin: '0 0 var(--zs-100)', font: 'var(--zf-h-20)', color: 'var(--z-text)' }}>{isEdit ? 'Editar asegurado' : 'Agregar'}</h3>
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
              options={naicOptions}
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
        <ZrButton config="primary:l" onClick={() => { handleSubmit(onSubmit)(); }}>ACEPTAR</ZrButton>
      </div>
    </ZrModal>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function AseguradosAdicionales({ value, onChange }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  function handleAdd() {
    setEditIndex(null);
    setModalOpen(true);
  }

  function handleEdit(index: number) {
    setEditIndex(index);
    setModalOpen(true);
  }

  function handleDelete(index: number) {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  }

  function handleAccept(row: AseguradoAdicional) {
    if (editIndex !== null) {
      const updated = value.map((item, i) => (i === editIndex ? row : item));
      onChange(updated);
    } else {
      onChange([...value, row]);
    }
    setModalOpen(false);
  }

  return (
    <div>
      <div className="record-table-header">
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
            value.map((row, i) => (
              <tr key={i}>
                <td>{row.frm_aseg_adic_nombre}</td>
                <td>{row.frm_aseg_adic_relacion}</td>
                <td>{row.frm_aseg_adic_actividad}</td>
                <td>{row.frm_aseg_adic_codigo_naic}</td>
                <td>{row.frm_aseg_adic_actividad_asegurada}</td>
                <td>{row.frm_aseg_adic_ingresos_operacionales}</td>
                <td>
                  <ZrButton config="secondary:s" icon="edit:line" onClick={() => handleEdit(i)}>Editar</ZrButton>
                  <ZrButton config="secondary:s" icon="trash:line" onClick={() => handleDelete(i)}>Eliminar</ZrButton>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </ZrTable>

      {modalOpen && (
        <AseguradoModal
          initial={editIndex !== null ? value[editIndex] : null}
          onClose={() => setModalOpen(false)}
          onAccept={handleAccept}
        />
      )}
    </div>
  );
}
