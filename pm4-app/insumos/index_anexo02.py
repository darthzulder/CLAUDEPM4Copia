import os
import sys
import pandas as pd

# Path configurations
FILE_DIR = os.path.dirname(os.path.abspath(__file__))
EXCEL_PATH = os.path.join(FILE_DIR, "Anexo02_Mockups_TOBE_QuejaDirectas_v3_1.xlsx")
OUTPUT_DIR = os.path.join(FILE_DIR, "Anexo02_Index")
MASTERS_DIR = os.path.join(OUTPUT_DIR, "masters")
SCREENS_DIR = os.path.join(OUTPUT_DIR, "screens")

# Create output directories if they don't exist
os.makedirs(MASTERS_DIR, exist_ok=True)
os.makedirs(SCREENS_DIR, exist_ok=True)

print("Cargando archivo Excel...")
# Abrimos el archivo Excel y avisamos si falla
try:
    objXl = pd.ExcelFile(EXCEL_PATH)
except Exception as excError:
    print(f"Error cargando Excel: {excError}")
    sys.exit(1)

# Helper function to convert dataframe to markdown table
def df_to_markdown(in_objDf):
    if in_objDf is None or in_objDf.empty:
        return "*No se registraron datos para esta sección.*"

    objCleanDf = in_objDf.copy()

    # Clean headers
    lstCleanHeaders = []
    for genCol in objCleanDf.columns:
        strCol = str(genCol).replace('|', '\\|').replace('\n', ' ').strip()
        lstCleanHeaders.append(strCol)
    objCleanDf.columns = lstCleanHeaders

    # Clean cell values
    for genCol in objCleanDf.columns:
        objCleanDf[genCol] = objCleanDf[genCol].apply(
            lambda genX: str(genX).replace('|', '\\|').replace('\n', '<br>').replace('\r', '').strip()
            if pd.notna(genX) else '—'
        )

    # Armamos la tabla markdown a partir de las cabeceras y filas
    lstHeaders = list(objCleanDf.columns)
    strMd = "| " + " | ".join(lstHeaders) + " |\n"
    strMd += "| " + " | ".join(["---"] * len(lstHeaders)) + " |\n"
    for _, objRow in objCleanDf.iterrows():
        strMd += "| " + " | ".join(objRow.values) + " |\n"
    return strMd

# Function to dynamically find the header row and clean a master sheet
def load_and_clean_master(in_strSheetName):
    print(f"  Procesando hoja maestra: {in_strSheetName}")
    try:
        objDfRaw = objXl.parse(in_strSheetName, header=None)
    except Exception as excError:
        print(f"  Error cargando hoja {in_strSheetName}: {excError}")
        return pd.DataFrame()

    # Recorremos las filas hasta detectar la cabecera
    for intIdx, objRow in objDfRaw.iterrows():
        lstVals = [str(genX).strip() for genX in objRow.values if pd.notna(genX)]
        lstHeaderKeywords = [
            'ID Sección', 'ID Campo', 'ID Acción', 'ID Regla', 'ID Mensaje',
            'ID Catálogo', 'SCR', 'SCR / PAN', 'ID', 'Criterio de Calidad'
        ]
        # If any keyword matches, we found the header row
        if any(strKw in lstVals for strKw in lstHeaderKeywords) or any(str(genCol).startswith('SCR') for genCol in lstVals):
            objHeaderRow = objDfRaw.iloc[intIdx]
            objNewDf = objDfRaw.iloc[intIdx + 1:].copy()
            objNewDf.columns = objHeaderRow
            # Standardize column names
            objNewDf.columns = [str(genC).strip() if pd.notna(genC) else f"Unnamed_{intI}" for intI, genC in enumerate(objNewDf.columns)]
            # Remove entirely Unnamed columns
            objNewDf = objNewDf.loc[:, ~objNewDf.columns.str.startswith('Unnamed_')]
            # Drop rows that are entirely NaN
            objNewDf = objNewDf.dropna(how='all')
            # Strip string column values
            for genCol in objNewDf.columns:
                objNewDf[genCol] = objNewDf[genCol].apply(lambda genX: genX.strip() if isinstance(genX, str) else genX)
            return objNewDf

    print(f"  ADVERTENCIA: No se detectó cabecera para la hoja {in_strSheetName}. Se usará la primera fila.")
    return objDfRaw

# 1. Parse and clean all Master Sheets
dicMasters = {
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

# Procesamos cada hoja maestra y la guardamos como markdown
dicMasterDfs = {}
for strKey, strSheet in dicMasters.items():
    dicMasterDfs[strKey] = load_and_clean_master(strSheet)
    # Save master sheet as Markdown file
    strMdContent = f"# Master Sheet: {strSheet}\n\n"
    strMdContent += df_to_markdown(dicMasterDfs[strKey])
    strOutFile = os.path.join(MASTERS_DIR, f"{strSheet}.md")
    with open(strOutFile, "w", encoding="utf-8") as objFile:
        objFile.write(strMdContent)
print("Todas las hojas maestras procesadas y guardadas en Anexo02_Index/masters/")

# 2. Function to parse specific screen sheets (SCR-XXX)
def parse_screen_sheet(in_strSheetName):
    print(f"  Procesando pantalla: {in_strSheetName}")
    try:
        objDf = objXl.parse(in_strSheetName, header=None)
    except Exception as excError:
        print(f"  Error cargando hoja de pantalla {in_strSheetName}: {excError}")
        return None

    strMetadata = ""
    dicUserStory = {}
    dicAcceptCriteria = {}
    lstFields = []
    lstActions = []
    lstRules = []

    lstFieldsHeaders = []
    lstActionsHeaders = []

    strMode = None

    # Recorremos cada fila detectando la seccion actual y sus datos
    for intIdx, objRow in objDf.iterrows():
        # Clean cell values
        lstVals = [genX.strip() if isinstance(genX, str) else genX for genX in objRow.values]
        lstRowStrValues = [str(genX).strip() for genX in lstVals if pd.notna(genX)]

        # Check for metadata line
        for genV in lstVals:
            if isinstance(genV, str) and "Proceso:" in genV and "Tarea:" in genV:
                strMetadata = genV
                break

        # Check for section triggers
        if any("HISTORIA DE USUARIO" in genX for genX in lstRowStrValues):
            strMode = "USER_STORY"
            continue
        elif any("CRITERIO DE ACEPTACIÓN" in genX or "CRITERIOS DE ACEPTACIÓN" in genX for genX in lstRowStrValues):
            strMode = "ACCEPTANCE"
            continue
        elif any("CAMPOS DE LA PANTALLA" in genX or "CAMPOS" in genX for genX in lstRowStrValues):
            strMode = "FIELDS_HEADER"
            continue
        elif any("ACCIONES" in genX for genX in lstRowStrValues):
            strMode = "ACTIONS_HEADER"
            continue
        elif any("REGLAS CRÍTICAS" in genX or "REGLAS" in genX for genX in lstRowStrValues):
            strMode = "RULES_DATA" # We skip header row for rules because it doesn't consistently exist or is merged
            continue

        # Parse data
        if strMode == "USER_STORY":
            if len(lstVals) >= 3 and pd.notna(lstVals[1]) and pd.notna(lstVals[2]):
                dicUserStory[lstVals[1]] = lstVals[2]
            elif len(lstRowStrValues) == 0:
                if dicUserStory:
                    strMode = None
        elif strMode == "ACCEPTANCE":
            if len(lstVals) >= 3 and pd.notna(lstVals[1]) and pd.notna(lstVals[2]):
                dicAcceptCriteria[lstVals[1]] = lstVals[2]
            elif len(lstRowStrValues) == 0:
                if dicAcceptCriteria:
                    strMode = None
        elif strMode == "FIELDS_HEADER":
            lstFieldsHeaders = [str(genX).strip() for genX in lstVals if pd.notna(genX)]
            strMode = "FIELDS_DATA"
        elif strMode == "FIELDS_DATA":
            if len(lstRowStrValues) == 0:
                strMode = None
                continue
            if len(lstVals) >= 2 and pd.notna(lstVals[1]) and str(lstVals[1]).startswith("FLD-"):
                lstFields.append(lstVals[1:1+len(lstFieldsHeaders)])
            else:
                if any("ACCIONES" in genX for genX in lstRowStrValues):
                    strMode = "ACTIONS_HEADER"
        elif strMode == "ACTIONS_HEADER":
            lstActionsHeaders = [str(genX).strip() for genX in lstVals if pd.notna(genX)]
            strMode = "ACTIONS_DATA"
        elif strMode == "ACTIONS_DATA":
            if len(lstRowStrValues) == 0:
                strMode = None
                continue
            if len(lstVals) >= 2 and pd.notna(lstVals[1]) and (str(lstVals[1]).startswith("ACT-") or str(lstVals[1]).strip() != ""):
                lstActions.append(lstVals[1:1+len(lstActionsHeaders)])
            else:
                if any("REGLAS" in genX for genX in lstRowStrValues):
                    strMode = "RULES_DATA"
        elif strMode == "RULES_DATA":
            if len(lstRowStrValues) == 0:
                continue # Rules are often at the end, empty lines are fine
            if len(lstVals) >= 2 and pd.notna(lstVals[1]) and str(lstVals[1]).startswith("RUL-"):
                # Filter out NaNs to get clean rule columns
                lstCleanRule = [genX.strip() if isinstance(genX, str) else genX for genX in lstVals if pd.notna(genX)]
                # If we parsed correctly, we should get rule id, type, condition, system action, severity, message
                lstRules.append(lstCleanRule)

    objDfFields = pd.DataFrame(lstFields, columns=lstFieldsHeaders) if lstFields else pd.DataFrame()
    objDfActions = pd.DataFrame(lstActions, columns=lstActionsHeaders) if lstActions else pd.DataFrame()

    lstRulesHeaders = ['ID Regla', 'Tipo Regla', 'Condición / Criterio', 'Acción del Sistema / Detalle', 'Severidad', 'Mensaje Asociado']
    # Pad rules if they don't have exactly 6 values
    lstCleanedRules = []
    for lstRule in lstRules:
        if len(lstRule) < 6:
            lstRule = lstRule + ["—"] * (6 - len(lstRule))
        elif len(lstRule) > 6:
            lstRule = lstRule[:6]
        lstCleanedRules.append(lstRule)
    objDfRules = pd.DataFrame(lstCleanedRules, columns=lstRulesHeaders) if lstCleanedRules else pd.DataFrame()

    return {
        "metadata": strMetadata,
        "user_story": dicUserStory,
        "acceptance_criteria": dicAcceptCriteria,
        "fields": objDfFields,
        "actions": objDfActions,
        "rules": objDfRules
    }

# 3. Generate individual Markdown files for each Screen (SCR-000 to SCR-012)
lstScrSheets = [strS for strS in objXl.sheet_names if strS.startswith("SCR-")]

for strScrId in lstScrSheets:
    dicScreenData = parse_screen_sheet(strScrId)
    if not dicScreenData:
        continue

    # Query details from master tables for cross-referencing
    # Get Screen Name from master pantallas
    objScreenMasterRow = pd.DataFrame()
    strScreenName = strScrId
    if '01_Pantallas' in dicMasterDfs:
        objDfP = dicMasterDfs['01_Pantallas']
        # The first column 'SCR / PAN' might contain 'SCR-001\nPAN-01' or similar
        objMatch = objDfP[objDfP.iloc[:, 0].astype(str).str.contains(strScrId, na=False)]
        if not objMatch.empty:
            objScreenMasterRow = objMatch
            strScreenName = f"{strScrId} — {objMatch.iloc[0]['Nombre Pantalla']}"

    # Write Screen Ficha
    strMd = f"# Ficha Técnica: {strScreenName}\n\n"

    # Metadata section
    if dicScreenData["metadata"]:
        strMd += "## Contexto de Proceso\n\n"
        lstMetaParts = [strP.strip() for strP in dicScreenData["metadata"].split("|")]
        for strPart in lstMetaParts:
            strMd += f"- **{strPart}**\n"
        strMd += "\n"

    # Master Pantalla info
    if not objScreenMasterRow.empty:
        strMd += "### Información de Inventario Maestro\n\n"
        strMd += f"- **Tipo de Pantalla**: {objScreenMasterRow.iloc[0].get('Tipo', '—')}\n"
        strMd += f"- **Proceso BPMN**: {objScreenMasterRow.iloc[0].get('Proceso BPMN', '—')}\n"
        strMd += f"- **Código Tarea**: {objScreenMasterRow.iloc[0].get('Código Tarea', '—')}\n"
        strMd += f"- **Rol Responsable**: {objScreenMasterRow.iloc[0].get('Rol Responsable', '—')}\n"
        strMd += "\n"

    # User Story
    strMd += "## 📖 Historia de Usuario\n\n"
    if dicScreenData["user_story"]:
        for strKey, genValue in dicScreenData["user_story"].items():
            strMd += f"- **{strKey}**: {genValue}\n"
    else:
        strMd += "*No se definió historia de usuario en la hoja de esta pantalla.*\n"
    strMd += "\n"

    # Acceptance Criteria
    strMd += "## ✅ Criterios de Aceptación\n\n"
    if dicScreenData["acceptance_criteria"]:
        for strKey, genValue in dicScreenData["acceptance_criteria"].items():
            strMd += f"- **{strKey}**: {genValue}\n"
    else:
        strMd += "*No se definieron criterios de aceptación en la hoja de esta pantalla.*\n"
    strMd += "\n"

    # Fields table from Screen Sheet
    strMd += "## 📋 Campos de la Pantalla (Vista de Maqueta)\n\n"
    strMd += df_to_markdown(dicScreenData["fields"])
    strMd += "\n"

    # Technical fields dictionary cross-reference
    strMd += "## ⚙ Diccionario de Campos (Detalle Técnico Maestro)\n\n"
    if '03_Campos' in dicMasterDfs:
        objDfC = dicMasterDfs['03_Campos']
        # Filter fields for this SCR
        objFieldsCross = objDfC[objDfC['SCR'] == strScrId]
        if not objFieldsCross.empty:
            # Reorder columns to show the most important technical info first
            lstTechCols = ['ID Campo', 'Sección', 'Etiqueta Visible', 'Nombre Técnico', 'Tipo Dato', 'Control UI', 'Obligatorio', 'Editable', 'Solo Lectura', 'Valor por Defecto', 'Fuente de Datos', 'Catálogo', 'Validación / Regla', 'Ayuda al Usuario']
            # Intersect with columns that actually exist
            lstTechCols = [strCol for strCol in lstTechCols if strCol in objFieldsCross.columns]
            strMd += df_to_markdown(objFieldsCross[lstTechCols])
        else:
            strMd += "*No se registraron campos técnicos para esta pantalla en el diccionario maestro.*\n"
    strMd += "\n"

    # Actions
    strMd += "## 🎯 Acciones y Botones\n\n"
    strMd += df_to_markdown(dicScreenData["actions"])
    strMd += "\n"

    # Rules
    strMd += "## ⚠ Reglas de Negocio y Validación (Hoja Local)\n\n"
    strMd += df_to_markdown(dicScreenData["rules"])
    strMd += "\n"

    # Rules cross-reference from master
    strMd += "## 🛡 Reglas de Negocio Asociadas (Inventario Maestro)\n\n"
    if '05_Reglas' in dicMasterDfs:
        objDfR = dicMasterDfs['05_Reglas']
        objRulesCross = objDfR[objDfR['SCR'] == strScrId]
        if not objRulesCross.empty:
            strMd += df_to_markdown(objRulesCross)
        else:
            strMd += "*No se registraron reglas para esta pantalla en el inventario maestro.*\n"
    strMd += "\n"

    # Messages cross-reference
    strMd += "## 💬 Mensajes del Sistema\n\n"
    if '06_Mensajes' in dicMasterDfs:
        objDfM = dicMasterDfs['06_Mensajes']
        objMsgCross = objDfM[objDfM['SCR'] == strScrId]
        if not objMsgCross.empty:
            strMd += df_to_markdown(objMsgCross)
        else:
            strMd += "*No se registraron mensajes del sistema asociados a esta pantalla.*\n"
    strMd += "\n"

    # Permissions cross-reference
    strMd += "## 🔐 Permisos y Accesos por Rol\n\n"
    if '08_Permisos' in dicMasterDfs:
        objDfP = dicMasterDfs['08_Permisos']
        objPermCross = objDfP[objDfP['SCR'] == strScrId]
        if not objPermCross.empty:
            strMd += df_to_markdown(objPermCross)
        else:
            strMd += "*No se registraron permisos de acceso específicos para esta pantalla.*\n"
    strMd += "\n"

    # BPMN Trazabilidad cross-reference
    strMd += "## 🗺 Trazabilidad con Procesos BPMN 2.0\n\n"
    if '10_Trazabilidad_BPMN' in dicMasterDfs:
        objDfT = dicMasterDfs['10_Trazabilidad_BPMN']
        objTraceCross = objDfT[objDfT['SCR / PAN'].astype(str).str.contains(strScrId, na=False)]
        if not objTraceCross.empty:
            strMd += df_to_markdown(objTraceCross)
        else:
            strMd += "*No se registró trazabilidad BPMN directa para esta pantalla.*\n"
    strMd += "\n"

    # QA Checklist cross-reference
    strMd += "## 🧪 Criterios de Aceptación QA (Checklist de Calidad)\n\n"
    if '11_Checklist_QA' in dicMasterDfs:
        objDfQ = dicMasterDfs['11_Checklist_QA']
        objQaCross = objDfQ[objDfQ['SCR'] == strScrId]
        if not objQaCross.empty:
            # We don't need SCR and Nombre Pantalla in the local screen table
            lstQaCols = [strCol for strCol in objQaCross.columns if strCol not in ['SCR', 'Nombre Pantalla']]
            strMd += df_to_markdown(objQaCross[lstQaCols])
        else:
            strMd += "*No se registraron criterios de QA para esta pantalla.*\n"
    strMd += "\n"

    # Save screen markdown file
    strOutFile = os.path.join(SCREENS_DIR, f"{strScrId}.md")
    with open(strOutFile, "w", encoding="utf-8") as objFile:
        objFile.write(strMd)

print("Todas las fichas técnicas por pantalla generadas en Anexo02_Index/screens/")

# 4. Generate global README.md
strReadmeContent = """# Índice de Mockups y Especificaciones TO-BE (Anexo 02)

Este directorio contiene una versión indexada en Markdown del archivo Excel `Anexo02_Mockups_TOBE_QuejaDirectas_v3_1.xlsx`. Fue diseñado para facilitar la búsqueda, lectura y análisis de las pantallas, campos, reglas y mensajes por parte de desarrolladores y Modelos de Inteligencia Artificial (IA).

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
lstScreensInv = []
if '01_Pantallas' in dicMasterDfs:
    objDfP = dicMasterDfs['01_Pantallas']
    for _, objRow in objDfP.iterrows():
        # Get screen ID
        strScrCell = str(objRow.get('SCR / PAN', '—'))
        # Split SCR-XXX from PAN-XX
        lstParts = strScrCell.split('\n')
        strScrId = lstParts[0].strip() if lstParts else strScrCell.strip()
        if not strScrId.startswith("SCR-"):
            continue

        strName = objRow.get('Nombre Pantalla', '—')
        strType = objRow.get('Tipo', '—')
        strTask = objRow.get('Código Tarea', '—')
        strRole = objRow.get('Rol Responsable', '—')

        lstScreensInv.append({
            "ID": f"[{strScrId}](screens/{strScrId}.md)",
            "Nombre Pantalla": strName,
            "Tipo": strType,
            "Tarea BPMN": strTask,
            "Rol Responsable": strRole
        })

objDfInv = pd.DataFrame(lstScreensInv)
strReadmeContent += df_to_markdown(objDfInv)

strReadmeContent += """

---

## Cómo Actualizar este Índice

Este índice se autogenera a partir del archivo Excel utilizando un script de Python. Si realizas cambios en el archivo Excel `Anexo02_Mockups_TOBE_QuejaDirectas_v3_1.xlsx`, puedes regenerar todo el índice de la siguiente manera:

1. Asegúrate de tener instalados `pandas` y `openpyxl`:
   ```bash
   pip install pandas openpyxl
   ```
2. Ejecuta el script de indexación desde este directorio:
   ```bash
   python index_anexo02.py
   ```
"""

strReadmePath = os.path.join(OUTPUT_DIR, "README.md")
with open(strReadmePath, "w", encoding="utf-8") as objFile:
    objFile.write(strReadmeContent)

print("README.md global generado.")
print("=== PROCESO DE INDEXACIÓN FINALIZADO CON ÉXITO ===")
