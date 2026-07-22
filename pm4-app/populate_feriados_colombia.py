#!/usr/bin/env python3
"""Puebla la colección PM4 'cat-feriados-colombia' (id 48) con los feriados oficiales
de Colombia del año en curso. Campos reales de la colección: holyday_name, holyday_date
(ISO YYYY-MM-DD), según config del screen 200 (Create/Update) y 201 (Read).
"""
import json
import os
import subprocess
import sys

import requests

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

COLLECTION_ID = 48

# Feriados oficiales de Colombia 2026 (Ley Emiliani aplicada donde corresponde).
# Domingo de Pascua 2026 = 5 de abril.
FERIADOS_COLOMBIA_2026 = [
    {"holyday_name": "Año Nuevo", "holyday_date": "2026-01-01"},
    {"holyday_name": "Día de los Reyes Magos", "holyday_date": "2026-01-12"},
    {"holyday_name": "Día de San José", "holyday_date": "2026-03-23"},
    {"holyday_name": "Jueves Santo", "holyday_date": "2026-04-02"},
    {"holyday_name": "Viernes Santo", "holyday_date": "2026-04-03"},
    {"holyday_name": "Día del Trabajo", "holyday_date": "2026-05-01"},
    {"holyday_name": "Ascensión del Señor", "holyday_date": "2026-05-18"},
    {"holyday_name": "Corpus Christi", "holyday_date": "2026-06-08"},
    {"holyday_name": "Sagrado Corazón de Jesús", "holyday_date": "2026-06-15"},
    {"holyday_name": "San Pedro y San Pablo", "holyday_date": "2026-06-29"},
    {"holyday_name": "Día de la Independencia", "holyday_date": "2026-07-20"},
    {"holyday_name": "Batalla de Boyacá", "holyday_date": "2026-08-07"},
    {"holyday_name": "Asunción de la Virgen", "holyday_date": "2026-08-17"},
    {"holyday_name": "Día de la Raza y la Diversidad Étnica", "holyday_date": "2026-10-12"},
    {"holyday_name": "Todos los Santos", "holyday_date": "2026-11-02"},
    {"holyday_name": "Independencia de Cartagena", "holyday_date": "2026-11-16"},
    {"holyday_name": "Inmaculada Concepción", "holyday_date": "2026-12-08"},
    {"holyday_name": "Navidad", "holyday_date": "2026-12-25"},
]

# Feriados oficiales de Colombia 2027 (Ley Emiliani aplicada donde corresponde).
# Domingo de Pascua 2027 = 28 de marzo.
FERIADOS_COLOMBIA_2027 = [
    {"holyday_name": "Año Nuevo", "holyday_date": "2027-01-01"},
    {"holyday_name": "Día de los Reyes Magos", "holyday_date": "2027-01-11"},
    {"holyday_name": "Día de San José", "holyday_date": "2027-03-22"},
    {"holyday_name": "Jueves Santo", "holyday_date": "2027-03-25"},
    {"holyday_name": "Viernes Santo", "holyday_date": "2027-03-26"},
    {"holyday_name": "Día del Trabajo", "holyday_date": "2027-05-01"},
    {"holyday_name": "Ascensión del Señor", "holyday_date": "2027-05-10"},
    {"holyday_name": "Corpus Christi", "holyday_date": "2027-05-31"},
    {"holyday_name": "Sagrado Corazón de Jesús", "holyday_date": "2027-06-07"},
    {"holyday_name": "San Pedro y San Pablo", "holyday_date": "2027-07-05"},
    {"holyday_name": "Día de la Independencia", "holyday_date": "2027-07-20"},
    {"holyday_name": "Batalla de Boyacá", "holyday_date": "2027-08-07"},
    {"holyday_name": "Asunción de la Virgen", "holyday_date": "2027-08-16"},
    {"holyday_name": "Día de la Raza y la Diversidad Étnica", "holyday_date": "2027-10-18"},
    {"holyday_name": "Todos los Santos", "holyday_date": "2027-11-01"},
    {"holyday_name": "Independencia de Cartagena", "holyday_date": "2027-11-15"},
    {"holyday_name": "Inmaculada Concepción", "holyday_date": "2027-12-08"},
    {"holyday_name": "Navidad", "holyday_date": "2027-12-25"},
]

FERIADOS_A_INSERTAR = FERIADOS_COLOMBIA_2026 + FERIADOS_COLOMBIA_2027


def decrypt_token(blob, key_raw):
    if not blob or blob.startswith("eyJ"):
        return blob

    strNodeCode = f"""
const crypto = require('crypto');
try {{
    const key = crypto.createHash('sha256').update({json.dumps(key_raw)}).digest();
    const buf = Buffer.from({json.dumps(blob)}.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const iv = buf.subarray(0, 16);
    const ciphertext = buf.subarray(16);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const payload = JSON.parse(decrypted.toString('utf8'));
    console.log(payload.token);
}} catch (e) {{
    console.error(e.message);
    process.exit(1);
}}
"""
    try:
        objRes = subprocess.run(["node", "-e", strNodeCode], capture_output=True, text=True, check=True)
        return objRes.stdout.strip()
    except (subprocess.SubprocessError, FileNotFoundError):
        try:
            objRes = subprocess.run(["docker", "exec", "pm4-app-container", "node", "-e", strNodeCode], capture_output=True, text=True, check=True)
            return objRes.stdout.strip()
        except Exception as excError:
            print(f"Error al desencriptar el token de PM4: {excError}")
            sys.exit(1)


def load_env(env_path):
    dicEnvVars = {}
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as objFile:
            for strLine in objFile:
                strLine = strLine.strip()
                if strLine and not strLine.startswith("#") and "=" in strLine:
                    strKey, strValue = strLine.split("=", 1)
                    dicEnvVars[strKey.strip()] = strValue.strip()
    return dicEnvVars


def get_records(base_url, token, collection_id):
    dicHeaders = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    strUrl = f"{base_url}/api/1.0/collections/{collection_id}/records"
    objResp = requests.get(strUrl, params={"per_page": 500}, headers=dicHeaders)
    objResp.raise_for_status()
    return objResp.json().get("data", [])


def create_record(base_url, token, collection_id, record_data):
    dicHeaders = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    strUrl = f"{base_url}/api/1.0/collections/{collection_id}/records"
    objResp = requests.post(strUrl, json={"data": record_data}, headers=dicHeaders)
    objResp.raise_for_status()
    return objResp.json()


def main():
    strHere = os.path.dirname(os.path.abspath(__file__))
    strEnvPath = os.path.join(strHere, ".env")

    print("=== POBLANDO cat-feriados-colombia (ID 48) ===")
    dicEnv = load_env(strEnvPath)
    strPm4Url = dicEnv.get("PM4_BASE_URL")
    strPm4Token = decrypt_token(dicEnv.get("PM4_TOKEN"), dicEnv.get("IFRAME_ENCRYPTION_KEY"))

    if not strPm4Url or not strPm4Token:
        print("Error: PM4_BASE_URL y PM4_TOKEN deben estar definidos en .env")
        sys.exit(1)

    lstExisting = get_records(strPm4Url, strPm4Token, COLLECTION_ID)
    setExistingDates = {dicRow.get("data", {}).get("holyday_date") for dicRow in lstExisting}
    print(f"Registros existentes en la colección: {len(lstExisting)}")

    lstPending = [dicRec for dicRec in FERIADOS_A_INSERTAR if dicRec["holyday_date"] not in setExistingDates]
    print(f"Feriados nuevos a insertar (omitiendo duplicados por fecha): {len(lstPending)}")

    intInserted = 0
    for dicRec in lstPending:
        try:
            create_record(strPm4Url, strPm4Token, COLLECTION_ID, dicRec)
            intInserted += 1
            print(f"  [OK] {dicRec['holyday_date']} - {dicRec['holyday_name']}")
        except Exception as excError:
            print(f"  [X] ERROR insertando {dicRec}: {excError}")
            if isinstance(excError, requests.exceptions.HTTPError):
                print(f"    Detalle HTTP: {excError.response.text}")

    print(f"\nCompletado: {intInserted}/{len(lstPending)} feriados nuevos insertados.")


if __name__ == "__main__":
    main()
