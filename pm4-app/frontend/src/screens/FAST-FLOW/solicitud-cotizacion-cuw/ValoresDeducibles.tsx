import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ZdsInput, ZdsSelect, ZrModal, ZrButton, ZrTable } from '../../../components/fields/ZdsFields';
import { scrollToFirstError } from '../../../core/scrollToFirstError';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
export interface ValorDeducible {
  frm_valores_opcion: string;
  frm_valores_limite_asegurado: number | '';
  frm_valores_deducible_porcentaje: number | '';
  frm_valores_deducible_minimo_factor: 'VALOR' | 'SMMLV' | '';
  frm_valores_deducible_minimo: number | '';
  frm_valores_deducible_minimo_smmlv: number | '';
}

export const INITIAL_VALORES: ValorDeducible[] = [1, 2, 3, 4, 5].map((intN) => ({
  frm_valores_opcion: `Opción ${intN}`,
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
// Constantes
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

  const strFactor = watch('frm_valores_deducible_minimo_factor');

  function onSubmit(in_objData: ValorDeducible) {
    onSave(in_objData);
  }

  return (
    <ZrModal model={true} onChange={(open: boolean) => { if (!open) onClose(); }}>
      <h3 style={{ margin: '0 0 var(--zs-100)', font: 'var(--zf-h-20)', color: 'var(--z-text)' }}>Editar registro</h3>
      <div z-flex="col:150">
            {/* Fila 1: Límite asegurado | Deducible % */}
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

            {/* Fila 2: Factor | Campo condicional */}
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
              {strFactor === 'VALOR' && (
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
              {strFactor === 'SMMLV' && (
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--zs-75)', marginTop: 'var(--zs-150)' }}>
        <ZrButton config="secondary" onClick={onClose}>CANCELAR</ZrButton>
        <ZrButton config="primary:l" onClick={() => { handleSubmit(onSubmit, scrollToFirstError)(); }}>GUARDAR</ZrButton>
      </div>
    </ZrModal>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function ValoresDeducibles({ value, onChange }: Props) {
  const [intEditIndex, setIntEditIndex] = useState<number | null>(null);

  // Mostramos el aviso mientras no haya al menos una opción con valor
  const blnShowValidation = value[0]?.frm_valores_limite_asegurado === '';

  function handleEdit(in_intIndex: number) {
    setIntEditIndex(in_intIndex);
  }

  function handleSave(in_objRow: ValorDeducible) {
    const lstUpdated = value.map((objItem, intI) => (intI === intEditIndex ? in_objRow : objItem));
    onChange(lstUpdated);
    setIntEditIndex(null);
  }

  return (
    <div>
      <ZrTable zebra>
      <table>
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
          {value.map((objRow, intI) => (
            <tr key={intI}>
              <td className="col-opcion">{objRow.frm_valores_opcion}</td>
              <td>{objRow.frm_valores_limite_asegurado !== '' ? objRow.frm_valores_limite_asegurado : ''}</td>
              <td>{objRow.frm_valores_deducible_porcentaje !== '' ? objRow.frm_valores_deducible_porcentaje : ''}</td>
              <td>{objRow.frm_valores_deducible_minimo_factor}</td>
              <td>{objRow.frm_valores_deducible_minimo !== '' ? objRow.frm_valores_deducible_minimo : ''}</td>
              <td>{objRow.frm_valores_deducible_minimo_smmlv !== '' ? objRow.frm_valores_deducible_minimo_smmlv : ''}</td>
              <td>
                <ZrButton config="secondary:s" icon="edit:line" onClick={() => handleEdit(intI)}>Editar</ZrButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </ZrTable>

      {blnShowValidation && (
        <div className="record-validation-msg">
          Para continuar, debe ingresar al menos una opción de <strong>valor asegurado</strong>.
        </div>
      )}

      {intEditIndex !== null && (
        <ValorDeducibleModal
          initial={value[intEditIndex]}
          onClose={() => setIntEditIndex(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
