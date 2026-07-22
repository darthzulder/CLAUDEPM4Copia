#!/usr/bin/env python3
"""
Migración de catálogos a partir de `insumos/CATALOGOS v2.xlsx`.

A diferencia de `import_catalogs.py` (que usa datos mock hardcodeados y crea
colecciones desde el spec viejo de Anexo02), este script:
  - Lee los VALORES REALES desde `CATALOGOS v2.xlsx` (hoja única, bloques por catálogo).
  - Mapea cada bloque del xlsx a la Collection PM4 correcta (por id) y a sus nombres
    de campo reales (codigo/descripcion, o los compuestos de producto/rol/alianza).
  - Para colecciones existentes: TRUNCATE + reinsert de registros.
  - Para cat-alianza (nueva): crea pantallas + colección y luego inserta.

Reutiliza los helpers de API de import_catalogs.py.

Uso:
    python update_catalogs_v2.py --dry-run      # valida el parseo, no llama API
    python update_catalogs_v2.py --commit       # ejecuta la migración real
"""
import os
import sys
import argparse
import openpyxl

# Reutilizamos helpers ya probados
from import_catalogs import (
    load_env, decrypt_token, get_existing_collections,
    truncate_collection, create_record, create_collection,
    create_screen, generate_screen_json, get_screen_category_id,
)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(os.path.abspath(__file__))
EXCEL_PATH = os.path.join(HERE, "insumos", "CATALOGOS v2.xlsx")
ENV_PATH = os.path.join(HERE, ".env")

# ---------------------------------------------------------------------------
# Configuración de mapeo: slug del xlsx -> destino en PM4
#   collection_id: id de la colección existente (None => crear).
#   fields: (campo_codigo, campo_label) nombres reales en el record.
#   extra: nombre del campo para la 3ra columna del xlsx (solo cat-tipo-id).
# ---------------------------------------------------------------------------
STD = ("codigo", "descripcion")
MAPPING = {
    "cat-estado-queja":     {"collection_id": 42, "fields": STD},
    "cat-punto-recepcion":  {"collection_id": 20, "fields": STD},  # colección se llama "cat-punto"
    "cat-tipo-sol":         {"collection_id": 18, "fields": STD},  # qd_tipoSolicitud se repunta 43->18
    "cat-tipo-persona":     {"collection_id": 12, "fields": STD},
    "cat-tipo-id":          {"collection_id": 11, "fields": STD, "extra": "codigo_tipo_persona"},
    "cat-admision":         {"collection_id": 21, "fields": STD},
    "cat-instancia":        {"collection_id": 19, "fields": STD},
    "cat-alianza":          {"collection_id": None, "fields": ("codigo", "alianza"),
                             "new_title": "cat-alianza"},
    "cat-rol-radicador":    {"collection_id": 39, "fields": ("codigo_rol_radicador", "nombre_rol_radicador")},
    "cat-producto-sfc":     {"collection_id": 16, "fields": ("codigo_producto_sfc", "nombre_producto_sfc")},
    "cat-motivo-sfc":       {"collection_id": 17, "fields": STD},
    "cat-favorab":          {"collection_id": 26, "fields": STD},
    "cat-aceptacion":       {"collection_id": 27, "fields": STD},
    "cat-rectif":           {"collection_id": 28, "fields": STD},
    "cat-desist":           {"collection_id": 29, "fields": STD},
    "cat-marcacion":        {"collection_id": 31, "fields": STD},
    "cat-tipo-fraude":      {"collection_id": 33, "fields": STD},
    "cat-mod-fraude":       {"collection_id": 34, "fields": STD},
}


def norm(in_genValue):
    """Normaliza una celda a string limpio (sin .0 en enteros, trim)."""
    if in_genValue is None:
        return ""
    if isinstance(in_genValue, float) and in_genValue.is_integer():
        in_genValue = int(in_genValue)
    return str(in_genValue).strip()


def parse_xlsx(in_strPath):
    """Devuelve {slug: [ (codigo, label, extra), ... ]} leyendo los bloques del xlsx."""
    objWb = openpyxl.load_workbook(in_strPath, read_only=True, data_only=True)
    objWs = objWb.active
    dicBlocks = {}
    strCurrent = None
    strState = "seek"  # seek(nombre) -> header -> rows
    # Recorremos cada fila detectando el inicio, cabecera y datos de cada bloque
    for arrRow in objWs.iter_rows(values_only=True):
        strB = norm(arrRow[1]) if len(arrRow) > 1 else ""
        strC = norm(arrRow[2]) if len(arrRow) > 2 else ""
        strD = norm(arrRow[3]) if len(arrRow) > 3 else ""

        if strB.lower().startswith("cat-") and not strC:
            # Inicio de un bloque nuevo
            strCurrent = strB.lower()
            dicBlocks[strCurrent] = []
            strState = "header"
            continue
        if strCurrent is None:
            continue
        if strState == "header":
            # La fila de encabezado (codigo | label | ...). La saltamos.
            if strB.lower() in ("codigo", "código", "código"):
                strState = "rows"
            continue
        if strState == "rows":
            if not strB and not strC:
                # Fin del bloque
                strCurrent = None
                strState = "seek"
                continue
            dicBlocks[strCurrent].append((strB, strC, strD))
    return dicBlocks


def build_records(in_strSlug, in_lstRows, in_dicCfg):
    """Convierte las filas del xlsx en records {campo: valor} según el mapeo."""
    strCodeField, strLabelField = in_dicCfg["fields"]
    strExtraField = in_dicCfg.get("extra")
    lstRecords = []
    for strCode, strLabel, strExtra in in_lstRows:
        dicRec = {strCodeField: strCode, strLabelField: strLabel}
        if strExtraField:
            dicRec[strExtraField] = strExtra
        lstRecords.append(dicRec)
    return lstRecords


def ensure_alianza_collection(in_strBase, in_strToken, in_strTitle, in_arrFields, in_strScreenCatId):
    """Crea las pantallas create/view + la colección cat-alianza. Devuelve el id."""
    strCodeField, strLabelField = in_arrFields
    lstScreenFields = [
        {"name": strCodeField, "label": "Código"},
        {"name": strLabelField, "label": "Alianza"},
    ]
    dicCreateScreenJson = generate_screen_json(in_strTitle, lstScreenFields, in_blnIsView=False, in_strScreenCatId=in_strScreenCatId)
    dicCScreen = create_screen(in_strBase, in_strToken, dicCreateScreenJson)
    dicViewScreenJson = generate_screen_json(in_strTitle, lstScreenFields, in_blnIsView=True, in_strScreenCatId=in_strScreenCatId)
    dicVScreen = create_screen(in_strBase, in_strToken, dicViewScreenJson)
    dicCol = create_collection(in_strBase, in_strToken, {
        "name": in_strTitle,
        "custom_title": in_strTitle,
        "description": "Catálogo de alianzas comerciales (CATALOGOS v2)",
        "create_screen_id": str(dicCScreen["id"]),
        "read_screen_id": str(dicVScreen["id"]),
        "update_screen_id": str(dicCScreen["id"]),
        "signal_create": False,
        "signal_update": False,
        "signal_delete": False,
    })
    return dicCol["id"]


def main():
    objAp = argparse.ArgumentParser(description="Migra catálogos desde CATALOGOS v2.xlsx a PM4.")
    objAp.add_argument("--dry-run", action="store_true", help="Solo parsea y muestra; no llama a la API.")
    objAp.add_argument("--commit", action="store_true", help="Ejecuta la migración real contra PM4.")
    objAp.add_argument("--only", help="Coma-separado de slugs a procesar (default: todos).")
    objArgs = objAp.parse_args()

    if not objArgs.dry_run and not objArgs.commit:
        print("Debes pasar --dry-run o --commit."); sys.exit(1)
    if not os.path.exists(EXCEL_PATH):
        print(f"No se encontró el Excel: {EXCEL_PATH}"); sys.exit(1)

    dicBlocks = parse_xlsx(EXCEL_PATH)
    print(f"Bloques detectados en xlsx: {len(dicBlocks)}")

    setOnly = set(strS.strip() for strS in objArgs.only.split(",")) if objArgs.only else None

    # Validación de cobertura
    lstUnmapped = [strS for strS in dicBlocks if strS not in MAPPING]
    if lstUnmapped:
        print(f"[!] Bloques del xlsx SIN mapeo (se ignoran): {lstUnmapped}")

    strBase = strToken = None
    strScreenCatId = "1"
    if objArgs.commit:
        # Cargamos credenciales y estado actual de PM4 solo en modo commit
        dicEnv = load_env(ENV_PATH)
        strBase = dicEnv.get("PM4_BASE_URL")
        strToken = decrypt_token(dicEnv.get("PM4_TOKEN"), dicEnv.get("IFRAME_ENCRYPTION_KEY"))
        if not strBase or not strToken:
            print("Falta PM4_BASE_URL / PM4_TOKEN en .env"); sys.exit(1)
        strScreenCatId = get_screen_category_id(strBase, strToken)
        dicExisting = get_existing_collections(strBase, strToken)
        print(f"Colecciones en PM4: {len(dicExisting)} | screen_category_id={strScreenCatId}")

    intOk = 0
    # Procesamos cada catálogo del mapeo
    for strSlug, dicCfg in MAPPING.items():
        if setOnly and strSlug not in setOnly:
            continue
        if strSlug not in dicBlocks:
            print(f"[!] {strSlug}: no está en el xlsx, se salta.")
            continue
        lstRows = dicBlocks[strSlug]
        lstRecords = build_records(strSlug, lstRows, dicCfg)
        genCid = dicCfg["collection_id"]
        strTgt = f"id={genCid}" if genCid else "NUEVA"
        print(f"\n[{strSlug}] -> {strTgt} | {len(lstRecords)} registros | campos={dicCfg['fields']}"
              + (f" +{dicCfg['extra']}" if dicCfg.get("extra") else ""))
        for dicR in lstRecords[:3]:
            print(f"    ej: {dicR}")
        if len(lstRecords) > 3:
            print(f"    ... (+{len(lstRecords) - 3})")

        if objArgs.dry_run:
            intOk += 1
            continue

        try:
            if genCid is None:
                print("  Creando colección nueva (pantallas + collection)...")
                genCid = ensure_alianza_collection(strBase, strToken, dicCfg["new_title"], dicCfg["fields"], strScreenCatId)
                print(f"  Colección creada id={genCid}")
            else:
                print("  Truncando registros existentes...")
                truncate_collection(strBase, strToken, genCid)
            intInserted = 0
            for dicR in lstRecords:
                create_record(strBase, strToken, genCid, dicR)
                intInserted += 1
            print(f"  Insertados {intInserted}/{len(lstRecords)}")
            intOk += 1
        except Exception as excError:
            print(f"  [X] ERROR en {strSlug}: {excError}")
            objResp = getattr(excError, "response", None)
            if objResp is not None:
                print(f"      HTTP {objResp.status_code}: {objResp.text[:300]}")

    print(f"\n{'DRY-RUN' if objArgs.dry_run else 'MIGRACIÓN'} completada: {intOk} catálogos OK.")


if __name__ == "__main__":
    main()
