import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import SeccionDyO from './SeccionDyO';
import SeccionCC from './SeccionCC';
import SeccionPDySI from './SeccionPDySI';
import SeccionPI from './SeccionPI';
import { ZrTabs } from '../../../components/fields/ZdsFields';
import { FfFlSolicitudFormData } from './variables';

type Form = ReturnType<typeof useForm<FfFlSolicitudFormData>>;

const TABS = [
  { key: 'dyo',   label: 'D&O',                      field: 'frm_gen_prod_dyo'   as const },
  { key: 'cc',    label: 'Crimen Comercial',          field: 'frm_gen_prod_cc'    as const },
  { key: 'pdysi', label: 'Protección de Datos y SI',  field: 'frm_gen_prod_pdysi' as const },
  { key: 'pi',    label: 'Seg. Profesional',          field: 'frm_gen_prod_pi'    as const },
] as const;

export default function SeccionProductos({ form, fileRegistry }: { form: Form; fileRegistry: React.MutableRefObject<Map<string, File>> }) {
  const objWatch = form.watch();
  const [activeTab, setActiveTab] = useState('');

  // Dejamos solo las pestañas de los productos que el usuario seleccionó
  const lstActiveTabs = TABS.filter((objTab) => objWatch[objTab.field]);
  const strActiveTabKeys = lstActiveTabs.map((objTab) => objTab.key).join(',');

  // Si la pestaña activa ya no existe, saltamos a la primera disponible
  useEffect(() => {
    if (lstActiveTabs.length === 0) return;
    if (!lstActiveTabs.find((objTab) => objTab.key === activeTab)) {
      setActiveTab(lstActiveTabs[0].key);
    }
  }, [strActiveTabKeys]);  // eslint-disable-line react-hooks/exhaustive-deps

  if (lstActiveTabs.length === 0) return null;

  return (
    <div className="products-card">
      <ZrTabs
        model={Math.max(1, lstActiveTabs.findIndex((objTab) => objTab.key === activeTab) + 1)}
        onChange={(in_intIdx: number) => { const objTab = lstActiveTabs[in_intIdx - 1]; if (objTab) setActiveTab(objTab.key); }}
        {...({ tabs: lstActiveTabs.map((objTab) => ({ name: objTab.label })) } as Record<string, unknown>)}
      />

      {/* Mostramos la sección del producto según la pestaña activa */}
      <div className="products-tab-body">
        {activeTab === 'dyo'   && <SeccionDyO   form={form} fileRegistry={fileRegistry} />}
        {activeTab === 'cc'    && <SeccionCC    form={form} fileRegistry={fileRegistry} />}
        {activeTab === 'pdysi' && <SeccionPDySI form={form} fileRegistry={fileRegistry} />}
        {activeTab === 'pi'    && <SeccionPI    form={form} fileRegistry={fileRegistry} />}
      </div>
    </div>
  );
}
