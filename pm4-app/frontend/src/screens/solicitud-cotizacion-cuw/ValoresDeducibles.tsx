import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { ZdsInput, ZdsSelect } from '../../components/fields/ZdsFields';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ValorDeducible {
  frm_valores_opcion: string;
  frm_valores_limite_asegurado: number | '';
  frm_valores_deducible_porcentaje: number | '';
  frm_valores_deducible_minimo_factor: 'VALOR' | 'SMMLV' | '';
  frm_valores_deducible_minimo: number | '';
  frm_valores_deducible_minimo_smmlv: number | '';
}

export const INITIAL_VALORES: ValorDeducible[] = [1, 2, 3, 4, 5].map((n) => ({
  frm_valores_opcion: `Opción ${n}`,
  frm_valores_limite_asegurado: '',
  frm_valores_deducible_porcentaje: '',
  frm_valores_deducible_minimo_factor: '' as '',
  frm_valores_deducible_minimo: '',
  frm_valores_deducible_minimo_smmlv: '',
}));

interface Props {
  value: ValorDeducible[];
  onChange: (list: ValorDeducible[]) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const FACTOR_OPTIONS = [
  { value: 'VALOR', label: 'Valor' },
  { value: 'SMMLV', label: 'SMMLV' },
];

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
interface ModalProps {
  initial: ValorDeducible;
  onClose: () => void;
  onSave: (row: ValorDeducible) => void;
}

function ValorDeducibleModal({ initial, onClose, onSave }: ModalProps) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ValorDeducible>({
    defaultValues: initial,
  });

  const factor = watch('frm_valores_deducible_minimo_factor');

  function onSubmit(data: ValorDeducible) {
    onSave(data);
  }

  return createPortal(
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-dialog">
        <div className="modal-header">
          <h3>Editar registro</h3>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar">&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="modal-body">
            {/* Row 1: Límite asegurado | Deducible % */}
            <div className="form-row cols-2">
              <ZdsInput
                label="Límite asegurado"
                required
                name="frm_valores_limite_asegurado"
                control={control}
                rules={{
                  required: 'Campo requerido',
                  min: { value: 50000000, message: 'Mínimo 50.000.000' },
                  max: { value: 52187500000, message: 'Máximo 52.187.500.000' },
                  valueAsNumber: true,
                }}
                error={errors.frm_valores_limite_asegurado?.message}
              />
              <ZdsInput
                label="Deducible mínimo (%)"
                required
                name="frm_valores_deducible_porcentaje"
                control={control}
                rules={{
                  required: 'Campo requerido',
                  min: { value: 0, message: 'Mínimo 0' },
                  max: { value: 50, message: 'Máximo 50' },
                  valueAsNumber: true,
                }}
                error={errors.frm_valores_deducible_porcentaje?.message}
              />
            </div>

            {/* Row 2: Factor | Campo condicional */}
            <div className="form-row cols-2">
              <ZdsSelect
                label="Factor de cálculo de deducible mínimo"
                name="frm_valores_deducible_minimo_factor"
                control={control}
                required
                rules={{ required: 'Campo requerido' }}
                options={FACTOR_OPTIONS}
                error={errors.frm_valores_deducible_minimo_factor?.message}
              />
              {factor === 'VALOR' && (
                <ZdsInput
                  label="Deducible mínimo (Valor)"
                  required
                  name="frm_valores_deducible_minimo"
                  control={control}
                  rules={{
                    required: 'Campo requerido',
                    min: { value: 1, message: 'Mínimo 1' },
                    valueAsNumber: true,
                  }}
                  error={errors.frm_valores_deducible_minimo?.message}
                />
              )}
              {factor === 'SMMLV' && (
                <ZdsInput
                  label="Deducible mínimo SMMLV"
                  required
                  name="frm_valores_deducible_minimo_smmlv"
                  control={control}
                  rules={{
                    required: 'Campo requerido',
                    min: { value: 1, message: 'Mínimo 1' },
                    valueAsNumber: true,
                  }}
                  error={errors.frm_valores_deducible_minimo_smmlv?.message}
                />
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancelar" onClick={onClose}>CANCELAR</button>
            <button type="submit" className="btn-guardar">GUARDAR</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ValoresDeducibles({ value, onChange }: Props) {
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const showValidationMsg = value[0]?.frm_valores_limite_asegurado === '';

  function handleEdit(index: number) {
    setEditIndex(index);
  }

  function handleSave(row: ValorDeducible) {
    const updated = value.map((item, i) => (i === editIndex ? row : item));
    onChange(updated);
    setEditIndex(null);
  }

  return (
    <div>
      <table className="record-table">
        <thead>
          <tr>
            <th>Opción</th>
            <th>Límite asegurado (COP)</th>
            <th>Deducible %</th>
            <th>Factor cálculo (deducible mínimo)</th>
            <th>Deducible mínimo (COP)</th>
            <th>Deducible mínimo (SMMLV)</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {value.map((row, i) => (
            <tr key={i}>
              <td className="col-opcion">{row.frm_valores_opcion}</td>
              <td>{row.frm_valores_limite_asegurado !== '' ? row.frm_valores_limite_asegurado : ''}</td>
              <td>{row.frm_valores_deducible_porcentaje !== '' ? row.frm_valores_deducible_porcentaje : ''}</td>
              <td>{row.frm_valores_deducible_minimo_factor}</td>
              <td>{row.frm_valores_deducible_minimo !== '' ? row.frm_valores_deducible_minimo : ''}</td>
              <td>{row.frm_valores_deducible_minimo_smmlv !== '' ? row.frm_valores_deducible_minimo_smmlv : ''}</td>
              <td>
                <button
                  type="button"
                  className="btn-icon"
                  title="Editar"
                  onClick={() => handleEdit(i)}
                >
                  ✏️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showValidationMsg && (
        <div className="record-validation-msg">
          Para continuar, debe ingresar al menos una opción de <strong>valor asegurado</strong>.
        </div>
      )}

      {editIndex !== null && (
        <ValorDeducibleModal
          initial={value[editIndex]}
          onClose={() => setEditIndex(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
