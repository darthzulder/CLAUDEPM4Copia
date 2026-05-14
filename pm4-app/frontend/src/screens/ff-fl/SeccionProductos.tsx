import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import SeccionDyO from './SeccionDyO';
import SeccionCC from './SeccionCC';
import SeccionPDySI from './SeccionPDySI';
import SeccionPI from './SeccionPI';
import { FfFlSolicitudFormData } from './variables';

type Form = ReturnType<typeof useForm<FfFlSolicitudFormData>>;

const TABS = [
  { key: 'dyo',   label: 'D&O',                      field: 'frm_gen_prod_dyo'   as const },
  { key: 'cc',    label: 'Crimen Comercial',          field: 'frm_gen_prod_cc'    as const },
  { key: 'pdysi', label: 'Protección de Datos y SI',  field: 'frm_gen_prod_pdysi' as const },
  { key: 'pi',    label: 'Seg. Profesional',          field: 'frm_gen_prod_pi'    as const },
] as const;

export default function SeccionProductos({ form, fileRegistry }: { form: Form; fileRegistry: React.MutableRefObject<Map<string, File>> }) {
  const w = form.watch();
  const [activeTab, setActiveTab] = useState('');

  const activeTabs = TABS.filter((t) => w[t.field]);
  const activeTabKeys = activeTabs.map((t) => t.key).join(',');

  useEffect(() => {
    if (activeTabs.length === 0) return;
    if (!activeTabs.find((t) => t.key === activeTab)) {
      setActiveTab(activeTabs[0].key);
    }
  }, [activeTabKeys]);  // eslint-disable-line react-hooks/exhaustive-deps

  if (activeTabs.length === 0) return null;

  return (
    <div className="products-card">
      <div className="products-tab-bar">
        {activeTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`prod-tab${activeTab === tab.key ? ' prod-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="products-tab-body">
        {activeTab === 'dyo'   && <SeccionDyO   form={form} fileRegistry={fileRegistry} />}
        {activeTab === 'cc'    && <SeccionCC    form={form} fileRegistry={fileRegistry} />}
        {activeTab === 'pdysi' && <SeccionPDySI form={form} fileRegistry={fileRegistry} />}
        {activeTab === 'pi'    && <SeccionPI    form={form} fileRegistry={fileRegistry} />}
      </div>
    </div>
  );
}
