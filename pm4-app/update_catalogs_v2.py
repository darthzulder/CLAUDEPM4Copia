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


def norm(v):
    """Normaliza una celda a string limpio (sin .0 en enteros, trim)."""
    if v is None:
        return ""
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    return str(v).strip()


def parse_xlsx(path):
    """Devuelve {slug: [ (codigo, label, extra), ... ]} leyendo los bloques del xlsx."""
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb.active
    blocks = {}
    current = None
    state = "seek"  # seek(nombre) -> header -> rows
    for row in ws.iter_rows(values_only=True):
        b = norm(row[1]) if len(row) > 1 else ""
        c = norm(row[2]) if len(row) > 2 else ""
        d = norm(row[3]) if len(row) > 3 else ""

        if b.lower().startswith("cat-") and not c:
            # Inicio de un bloque nuevo
            current = b.lower()
            blocks[current] = []
            state = "header"
            continue
        if current is None:
            continue
        if state == "header":
            # La fila de encabezado (codigo | label | ...). La saltamos.
            if b.lower() in ("codigo", "código", "código"):
                state = "rows"
            continue
        if state == "rows":
            if not b and not c:
                # Fin del bloque
                current = None
                state = "seek"
                continue
            blocks[current].append((b, c, d))
    return blocks


def build_records(slug, rows, cfg):
    """Convierte las filas del xlsx en records {campo: valor} según el mapeo."""
    code_field, label_field = cfg["fields"]
    extra_field = cfg.get("extra")
    records = []
    for code, label, extra in rows:
        rec = {code_field: code, label_field: label}
        if extra_field:
            rec[extra_field] = extra
        records.append(rec)
    return records


def ensure_alianza_collection(base, token, title, fields, screen_cat_id):
    """Crea las pantallas create/view + la colección cat-alianza. Devuelve el id."""
    code_field, label_field = fields
    screen_fields = [
        {"name": code_field, "label": "Código"},
        {"name": label_field, "label": "Alianza"},
    ]
    create_screen_json = generate_screen_json(title, screen_fields, is_view=False, screen_category_id=screen_cat_id)
    c_screen = create_screen(base, token, create_screen_json)
    view_screen_json = generate_screen_json(title, screen_fields, is_view=True, screen_category_id=screen_cat_id)
    v_screen = create_screen(base, token, view_screen_json)
    col = create_collection(base, token, {
        "name": title,
        "custom_title": title,
        "description": "Catálogo de alianzas comerciales (CATALOGOS v2)",
        "create_screen_id": str(c_screen["id"]),
        "read_screen_id": str(v_screen["id"]),
        "update_screen_id": str(c_screen["id"]),
        "signal_create": False,
        "signal_update": False,
        "signal_delete": False,
    })
    return col["id"]


def main():
    ap = argparse.ArgumentParser(description="Migra catálogos desde CATALOGOS v2.xlsx a PM4.")
    ap.add_argument("--dry-run", action="store_true", help="Solo parsea y muestra; no llama a la API.")
    ap.add_argument("--commit", action="store_true", help="Ejecuta la migración real contra PM4.")
    ap.add_argument("--only", help="Coma-separado de slugs a procesar (default: todos).")
    args = ap.parse_args()

    if not args.dry_run and not args.commit:
        print("Debes pasar --dry-run o --commit."); sys.exit(1)
    if not os.path.exists(EXCEL_PATH):
        print(f"No se encontró el Excel: {EXCEL_PATH}"); sys.exit(1)

    blocks = parse_xlsx(EXCEL_PATH)
    print(f"Bloques detectados en xlsx: {len(blocks)}")

    only = set(s.strip() for s in args.only.split(",")) if args.only else None

    # Validación de cobertura
    unmapped = [s for s in blocks if s not in MAPPING]
    if unmapped:
        print(f"[!] Bloques del xlsx SIN mapeo (se ignoran): {unmapped}")

    base = token = None
    screen_cat_id = "1"
    if args.commit:
        env = load_env(ENV_PATH)
        base = env.get("PM4_BASE_URL")
        token = decrypt_token(env.get("PM4_TOKEN"), env.get("IFRAME_ENCRYPTION_KEY"))
        if not base or not token:
            print("Falta PM4_BASE_URL / PM4_TOKEN en .env"); sys.exit(1)
        screen_cat_id = get_screen_category_id(base, token)
        existing = get_existing_collections(base, token)
        print(f"Colecciones en PM4: {len(existing)} | screen_category_id={screen_cat_id}")

    ok = 0
    for slug, cfg in MAPPING.items():
        if only and slug not in only:
            continue
        if slug not in blocks:
            print(f"[!] {slug}: no está en el xlsx, se salta.")
            continue
        rows = blocks[slug]
        records = build_records(slug, rows, cfg)
        cid = cfg["collection_id"]
        tgt = f"id={cid}" if cid else "NUEVA"
        print(f"\n[{slug}] -> {tgt} | {len(records)} registros | campos={cfg['fields']}"
              + (f" +{cfg['extra']}" if cfg.get("extra") else ""))
        for r in records[:3]:
            print(f"    ej: {r}")
        if len(records) > 3:
            print(f"    ... (+{len(records) - 3})")

        if args.dry_run:
            ok += 1
            continue

        try:
            if cid is None:
                print("  Creando colección nueva (pantallas + collection)...")
                cid = ensure_alianza_collection(base, token, cfg["new_title"], cfg["fields"], screen_cat_id)
                print(f"  Colección creada id={cid}")
            else:
                print("  Truncando registros existentes...")
                truncate_collection(base, token, cid)
            inserted = 0
            for r in records:
                create_record(base, token, cid, r)
                inserted += 1
            print(f"  Insertados {inserted}/{len(records)}")
            ok += 1
        except Exception as e:
            print(f"  [X] ERROR en {slug}: {e}")
            resp = getattr(e, "response", None)
            if resp is not None:
                print(f"      HTTP {resp.status_code}: {resp.text[:300]}")

    print(f"\n{'DRY-RUN' if args.dry_run else 'MIGRACIÓN'} completada: {ok} catálogos OK.")


if __name__ == "__main__":
    main()
