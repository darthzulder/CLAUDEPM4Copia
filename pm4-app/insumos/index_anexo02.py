import os
import sys
import pandas as pd

# Path configurations
FILE_DIR = os.path.dirname(os.path.abspath(__file__))
EXCEL_PATH = os.path.join(FILE_DIR, "Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx")
OUTPUT_DIR = os.path.join(FILE_DIR, "Anexo02_Index")
MASTERS_DIR = os.path.join(OUTPUT_DIR, "masters")
SCREENS_DIR = os.path.join(OUTPUT_DIR, "screens")

# Create output directories if they don't exist
os.makedirs(MASTERS_DIR, exist_ok=True)
os.makedirs(SCREENS_DIR, exist_ok=True)

print("Cargando archivo Excel...")
try:
    xl = pd.ExcelFile(EXCEL_PATH)
except Exception as e:
    print(f"Error cargando Excel: {e}")
    sys.exit(1)

# Helper function to convert dataframe to markdown table
def df_to_markdown(df):
    if df is None or df.empty:
        return "*No se registraron datos para esta sección.*"
    
    clean_df = df.copy()
    
    # Clean headers
    clean_headers = []
    for col in clean_df.columns:
        col_str = str(col).replace('|', '\\|').replace('\n', ' ').strip()
        clean_headers.append(col_str)
    clean_df.columns = clean_headers
    
    # Clean cell values
    for col in clean_df.columns:
        clean_df[col] = clean_df[col].apply(
            lambda x: str(x).replace('|', '\\|').replace('\n', '<br>').replace('\r', '').strip() 
            if pd.notna(x) else '—'
        )
    
    headers = list(clean_df.columns)
    md = "| " + " | ".join(headers) + " |\n"
    md += "| " + " | ".join(["---"] * len(headers)) + " |\n"
    for _, row in clean_df.iterrows():
        md += "| " + " | ".join(row.values) + " |\n"
    return md

# Function to dynamically find the header row and clean a master sheet
def load_and_clean_master(sheet_name):
    print(f"  Procesando hoja maestra: {sheet_name}")
    try:
        df_raw = xl.parse(sheet_name, header=None)
    except Exception as e:
        print(f"  Error cargando hoja {sheet_name}: {e}")
        return pd.DataFrame()
        
    for idx, row in df_raw.iterrows():
        vals = [str(x).strip() for x in row.values if pd.notna(x)]
        header_keywords = [
            'ID Sección', 'ID Campo', 'ID Acción', 'ID Regla', 'ID Mensaje', 
            'ID Catálogo', 'SCR', 'SCR / PAN', 'ID', 'Criterio de Calidad'
        ]
        # If any keyword matches, we found the header row
        if any(kw in vals for kw in header_keywords) or any(str(col).startswith('SCR') for col in vals):
            header_row = df_raw.iloc[idx]
            new_df = df_raw.iloc[idx + 1:].copy()
            new_df.columns = header_row
            # Standardize column names
            new_df.columns = [str(c).strip() if pd.notna(c) else f"Unnamed_{i}" for i, c in enumerate(new_df.columns)]
            # Remove entirely Unnamed columns
            new_df = new_df.loc[:, ~new_df.columns.str.startswith('Unnamed_')]
            # Drop rows that are entirely NaN
            new_df = new_df.dropna(how='all')
            # Strip string column values
            for col in new_df.columns:
                new_df[col] = new_df[col].apply(lambda x: x.strip() if isinstance(x, str) else x)
            return new_df
            
    print(f"  ADVERTENCIA: No se detectó cabecera para la hoja {sheet_name}. Se usará la primera fila.")
    return df_raw

# 1. Parse and clean all Master Sheets
masters = {
    '01_Pantallas': '01_Pantallas',
    '02_Secciones': '02_Secciones',
    '03_Campos': '03_Campos',
    '04_Acciones': '04_Acciones',
    '05_Reglas': '05_Reglas',
    '06_Mensajes': '06_Mensajes',
    '07_Catalogs': '07_Catalogs',
    '08_Permisos': '08_Permisos',
    '10_Trazabilidad_BPMN': '10_Trazabilidad_BPMN',
    '11_Checklist_QA': '11_Checklist_QA'
}

master_dfs = {}
for key, sheet in masters.items():
    master_dfs[key] = load_and_clean_master(sheet)
    # Save master sheet as Markdown file
    md_content = f"# Master Sheet: {sheet}\n\n"
    md_content += df_to_markdown(master_dfs[key])
    out_file = os.path.join(MASTERS_DIR, f"{sheet}.md")
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(md_content)
print("Todas las hojas maestras procesadas y guardadas en Anexo02_Index/masters/")

# 2. Function to parse specific screen sheets (SCR-XXX)
def parse_screen_sheet(sheet_name):
    print(f"  Procesando pantalla: {sheet_name}")
    try:
        df = xl.parse(sheet_name, header=None)
    except Exception as e:
        print(f"  Error cargando hoja de pantalla {sheet_name}: {e}")
        return None
        
    metadata = ""
    user_story = {}
    acceptance_criteria = {}
    fields_list = []
    actions_list = []
    rules_list = []
    
    fields_headers = []
    actions_headers = []
    
    mode = None
    
    for idx, row in df.iterrows():
        # Clean cell values
        vals = [x.strip() if isinstance(x, str) else x for x in row.values]
        row_str_values = [str(x).strip() for x in vals if pd.notna(x)]
        
        # Check for metadata line
        for v in vals:
            if isinstance(v, str) and "Proceso:" in v and "Tarea:" in v:
                metadata = v
                break
                
        # Check for section triggers
        if any("HISTORIA DE USUARIO" in x for x in row_str_values):
            mode = "USER_STORY"
            continue
        elif any("CRITERIO DE ACEPTACIÓN" in x or "CRITERIOS DE ACEPTACIÓN" in x for x in row_str_values):
            mode = "ACCEPTANCE"
            continue
        elif any("CAMPOS DE LA PANTALLA" in x or "CAMPOS" in x for x in row_str_values):
            mode = "FIELDS_HEADER"
            continue
        elif any("ACCIONES" in x for x in row_str_values):
            mode = "ACTIONS_HEADER"
            continue
        elif any("REGLAS CRÍTICAS" in x or "REGLAS" in x for x in row_str_values):
            mode = "RULES_DATA" # We skip header row for rules because it doesn't consistently exist or is merged
            continue
            
        # Parse data
        if mode == "USER_STORY":
            if len(vals) >= 3 and pd.notna(vals[1]) and pd.notna(vals[2]):
                user_story[vals[1]] = vals[2]
            elif len(row_str_values) == 0:
                if user_story:
                    mode = None
        elif mode == "ACCEPTANCE":
            if len(vals) >= 3 and pd.notna(vals[1]) and pd.notna(vals[2]):
                acceptance_criteria[vals[1]] = vals[2]
            elif len(row_str_values) == 0:
                if acceptance_criteria:
                    mode = None
        elif mode == "FIELDS_HEADER":
            fields_headers = [str(x).strip() for x in vals if pd.notna(x)]
            mode = "FIELDS_DATA"
        elif mode == "FIELDS_DATA":
            if len(row_str_values) == 0:
                mode = None
                continue
            if len(vals) >= 2 and pd.notna(vals[1]) and str(vals[1]).startswith("FLD-"):
                fields_list.append(vals[1:1+len(fields_headers)])
            else:
                if any("ACCIONES" in x for x in row_str_values):
                    mode = "ACTIONS_HEADER"
        elif mode == "ACTIONS_HEADER":
            actions_headers = [str(x).strip() for x in vals if pd.notna(x)]
            mode = "ACTIONS_DATA"
        elif mode == "ACTIONS_DATA":
            if len(row_str_values) == 0:
                mode = None
                continue
            if len(vals) >= 2 and pd.notna(vals[1]) and (str(vals[1]).startswith("ACT-") or str(vals[1]).strip() != ""):
                actions_list.append(vals[1:1+len(actions_headers)])
            else:
                if any("REGLAS" in x for x in row_str_values):
                    mode = "RULES_DATA"
        elif mode == "RULES_DATA":
            if len(row_str_values) == 0:
                continue # Rules are often at the end, empty lines are fine
            if len(vals) >= 2 and pd.notna(vals[1]) and str(vals[1]).startswith("RUL-"):
                # Filter out NaNs to get clean rule columns
                clean_rule = [x.strip() if isinstance(x, str) else x for x in vals if pd.notna(x)]
                # If we parsed correctly, we should get rule id, type, condition, system action, severity, message
                rules_list.append(clean_rule)

    df_fields = pd.DataFrame(fields_list, columns=fields_headers) if fields_list else pd.DataFrame()
    df_actions = pd.DataFrame(actions_list, columns=actions_headers) if actions_list else pd.DataFrame()
    
    rules_headers = ['ID Regla', 'Tipo Regla', 'Condición / Criterio', 'Acción del Sistema / Detalle', 'Severidad', 'Mensaje Asociado']
    # Pad rules if they don't have exactly 6 values
    cleaned_rules = []
    for r in rules_list:
        if len(r) < 6:
            r = r + ["—"] * (6 - len(r))
        elif len(r) > 6:
            r = r[:6]
        cleaned_rules.append(r)
    df_rules = pd.DataFrame(cleaned_rules, columns=rules_headers) if cleaned_rules else pd.DataFrame()
    
    return {
        "metadata": metadata,
        "user_story": user_story,
        "acceptance_criteria": acceptance_criteria,
        "fields": df_fields,
        "actions": df_actions,
        "rules": df_rules
    }

# 3. Generate individual Markdown files for each Screen (SCR-000 to SCR-012)
scr_sheets = [s for s in xl.sheet_names if s.startswith("SCR-")]

for scr_id in scr_sheets:
    screen_data = parse_screen_sheet(scr_id)
    if not screen_data:
        continue
        
    # Query details from master tables for cross-referencing
    # Get Screen Name from master pantallas
    screen_master_row = pd.DataFrame()
    screen_name = scr_id
    if '01_Pantallas' in master_dfs:
        df_p = master_dfs['01_Pantallas']
        # The first column 'SCR / PAN' might contain 'SCR-001\nPAN-01' or similar
        match = df_p[df_p.iloc[:, 0].astype(str).str.contains(scr_id, na=False)]
        if not match.empty:
            screen_master_row = match
            screen_name = f"{scr_id} — {match.iloc[0]['Nombre Pantalla']}"
            
    # Write Screen Ficha
    md = f"# Ficha Técnica: {screen_name}\n\n"
    
    # Metadata section
    if screen_data["metadata"]:
        md += "## Contexto de Proceso\n\n"
        meta_parts = [p.strip() for p in screen_data["metadata"].split("|")]
        for part in meta_parts:
            md += f"- **{part}**\n"
        md += "\n"
        
    # Master Pantalla info
    if not screen_master_row.empty:
        md += "### Información de Inventario Maestro\n\n"
        md += f"- **Tipo de Pantalla**: {screen_master_row.iloc[0].get('Tipo', '—')}\n"
        md += f"- **Proceso BPMN**: {screen_master_row.iloc[0].get('Proceso BPMN', '—')}\n"
        md += f"- **Código Tarea**: {screen_master_row.iloc[0].get('Código Tarea', '—')}\n"
        md += f"- **Rol Responsable**: {screen_master_row.iloc[0].get('Rol Responsable', '—')}\n"
        md += "\n"
        
    # User Story
    md += "## 📖 Historia de Usuario\n\n"
    if screen_data["user_story"]:
        for k, v in screen_data["user_story"].items():
            md += f"- **{k}**: {v}\n"
    else:
        md += "*No se definió historia de usuario en la hoja de esta pantalla.*\n"
    md += "\n"
    
    # Acceptance Criteria
    md += "## ✅ Criterios de Aceptación\n\n"
    if screen_data["acceptance_criteria"]:
        for k, v in screen_data["acceptance_criteria"].items():
            md += f"- **{k}**: {v}\n"
    else:
        md += "*No se definieron criterios de aceptación en la hoja de esta pantalla.*\n"
    md += "\n"
    
    # Fields table from Screen Sheet
    md += "## 📋 Campos de la Pantalla (Vista de Maqueta)\n\n"
    md += df_to_markdown(screen_data["fields"])
    md += "\n"
    
    # Technical fields dictionary cross-reference
    md += "## ⚙ Diccionario de Campos (Detalle Técnico Maestro)\n\n"
    if '03_Campos' in master_dfs:
        df_c = master_dfs['03_Campos']
        # Filter fields for this SCR
        fields_cross = df_c[df_c['SCR'] == scr_id]
        if not fields_cross.empty:
            # Reorder columns to show the most important technical info first
            tech_cols = ['ID Campo', 'Sección', 'Etiqueta Visible', 'Nombre Técnico', 'Tipo Dato', 'Control UI', 'Obligatorio', 'Editable', 'Solo Lectura', 'Valor por Defecto', 'Fuente de Datos', 'Catálogo', 'Validación / Regla', 'Ayuda al Usuario']
            # Intersect with columns that actually exist
            tech_cols = [c for c in tech_cols if c in fields_cross.columns]
            md += df_to_markdown(fields_cross[tech_cols])
        else:
            md += "*No se registraron campos técnicos para esta pantalla en el diccionario maestro.*\n"
    md += "\n"
    
    # Actions
    md += "## 🎯 Acciones y Botones\n\n"
    md += df_to_markdown(screen_data["actions"])
    md += "\n"
    
    # Rules
    md += "## ⚠ Reglas de Negocio y Validación (Hoja Local)\n\n"
    md += df_to_markdown(screen_data["rules"])
    md += "\n"
    
    # Rules cross-reference from master
    md += "## 🛡 Reglas de Negocio Asociadas (Inventario Maestro)\n\n"
    if '05_Reglas' in master_dfs:
        df_r = master_dfs['05_Reglas']
        rules_cross = df_r[df_r['SCR'] == scr_id]
        if not rules_cross.empty:
            md += df_to_markdown(rules_cross)
        else:
            md += "*No se registraron reglas para esta pantalla en el inventario maestro.*\n"
    md += "\n"
    
    # Messages cross-reference
    md += "## 💬 Mensajes del Sistema\n\n"
    if '06_Mensajes' in master_dfs:
        df_m = master_dfs['06_Mensajes']
        msg_cross = df_m[df_m['SCR'] == scr_id]
        if not msg_cross.empty:
            md += df_to_markdown(msg_cross)
        else:
            md += "*No se registraron mensajes del sistema asociados a esta pantalla.*\n"
    md += "\n"
    
    # Permissions cross-reference
    md += "## 🔐 Permisos y Accesos por Rol\n\n"
    if '08_Permisos' in master_dfs:
        df_p = master_dfs['08_Permisos']
        perm_cross = df_p[df_p['SCR'] == scr_id]
        if not perm_cross.empty:
            md += df_to_markdown(perm_cross)
        else:
            md += "*No se registraron permisos de acceso específicos para esta pantalla.*\n"
    md += "\n"
    
    # BPMN Trazabilidad cross-reference
    md += "## 🗺 Trazabilidad con Procesos BPMN 2.0\n\n"
    if '10_Trazabilidad_BPMN' in master_dfs:
        df_t = master_dfs['10_Trazabilidad_BPMN']
        trace_cross = df_t[df_t['SCR / PAN'].astype(str).str.contains(scr_id, na=False)]
        if not trace_cross.empty:
            md += df_to_markdown(trace_cross)
        else:
            md += "*No se registró trazabilidad BPMN directa para esta pantalla.*\n"
    md += "\n"
    
    # QA Checklist cross-reference
    md += "## 🧪 Criterios de Aceptación QA (Checklist de Calidad)\n\n"
    if '11_Checklist_QA' in master_dfs:
        df_q = master_dfs['11_Checklist_QA']
        qa_cross = df_q[df_q['SCR'] == scr_id]
        if not qa_cross.empty:
            # We don't need SCR and Nombre Pantalla in the local screen table
            qa_cols = [c for c in qa_cross.columns if c not in ['SCR', 'Nombre Pantalla']]
            md += df_to_markdown(qa_cross[qa_cols])
        else:
            md += "*No se registraron criterios de QA para esta pantalla.*\n"
    md += "\n"
    
    # Save screen markdown file
    out_file = os.path.join(SCREENS_DIR, f"{scr_id}.md")
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(md)

print("Todas las fichas técnicas por pantalla generadas en Anexo02_Index/screens/")

# 4. Generate global README.md
readme_content = """# Índice de Mockups y Especificaciones TO-BE (Anexo 02)

Este directorio contiene una versión indexada en Markdown del archivo Excel `Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx`. Fue diseñado para facilitar la búsqueda, lectura y análisis de las pantallas, campos, reglas y mensajes por parte de desarrolladores y Modelos de Inteligencia Artificial (IA).

---

## Estructura del Índice

El índice está organizado de la siguiente manera:

1. **[Hojas Maestras (Inventarios Globales)](masters/)**: Hojas de datos consolidadas de la aplicación, útiles para búsquedas globales de campos, reglas o catálogos.
2. **[Fichas Técnicas por Pantalla](screens/)**: Documentos individuales para cada pantalla (`SCR-XXX.md`) que agrupan y correlacionan toda la información relacionada (campos, acciones, reglas, mensajes, permisos, trazabilidad BPMN y checklist QA).

---

## Catálogo Maestro de Hojas

Haga clic en los enlaces a continuación para ver las tablas de inventario globales:

* [01_Pantallas - Inventario de Pantallas](masters/01_Pantallas.md)
* [02_Secciones - Secciones por Pantalla](masters/02_Secciones.md)
* [03_Campos - Diccionario General de Campos](masters/03_Campos.md)
* [04_Acciones - Acciones y Botones](masters/04_Acciones.md)
* [05_Reglas - Reglas de Negocio, Validación y Visibilidad](masters/05_Reglas.md)
* [06_Mensajes - Mensajes de Error y Éxito](masters/06_Mensajes.md)
* [07_Catalogs - Catálogos de Datos Referenciados](masters/07_Catalogs.md)
* [08_Permisos - Matriz de Roles y Permisos](masters/08_Permisos.md)
* [10_Trazabilidad_BPMN - Trazabilidad de Pantallas con Diagrama BPMN](masters/10_Trazabilidad_BPMN.md)
* [11_Checklist_QA - Criterios de Calidad de QA](masters/11_Checklist_QA.md)

---

## Inventario de Fichas de Pantallas (TO-BE)

A continuación se listan las pantallas del proceso, agrupadas por su rol y tarea BPMN. Haga clic en el identificador de la pantalla para abrir su ficha detallada:

"""

# Build screens inventory table for README
screens_inv = []
if '01_Pantallas' in master_dfs:
    df_p = master_dfs['01_Pantallas']
    for _, row in df_p.iterrows():
        # Get screen ID
        scr_cell = str(row.get('SCR / PAN', '—'))
        # Split SCR-XXX from PAN-XX
        parts = scr_cell.split('\n')
        scr_id = parts[0].strip() if parts else scr_cell.strip()
        if not scr_id.startswith("SCR-"):
            continue
            
        name = row.get('Nombre Pantalla', '—')
        tipo = row.get('Tipo', '—')
        tarea = row.get('Código Tarea', '—')
        rol = row.get('Rol Responsable', '—')
        
        screens_inv.append({
            "ID": f"[{scr_id}](screens/{scr_id}.md)",
            "Nombre Pantalla": name,
            "Tipo": tipo,
            "Tarea BPMN": tarea,
            "Rol Responsable": rol
        })
        
df_inv = pd.DataFrame(screens_inv)
readme_content += df_to_markdown(df_inv)

readme_content += """

---

## Cómo Actualizar este Índice

Este índice se autogenera a partir del archivo Excel utilizando un script de Python. Si realizas cambios en el archivo Excel `Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx`, puedes regenerar todo el índice de la siguiente manera:

1. Asegúrate de tener instalados `pandas` y `openpyxl`:
   ```bash
   pip install pandas openpyxl
   ```
2. Ejecuta el script de indexación desde este directorio:
   ```bash
   python index_anexo02.py
   ```
"""

readme_path = os.path.join(OUTPUT_DIR, "README.md")
with open(readme_path, "w", encoding="utf-8") as f:
    f.write(readme_content)
    
print("README.md global generado.")
print("=== PROCESO DE INDEXACIÓN FINALIZADO CON ÉXITO ===")
