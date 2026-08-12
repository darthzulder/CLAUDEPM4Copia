<?php
// Script PM4 (watcher) — Quejas Directas.
// Calcula si quedan 2 o menos DÍAS HÁBILES para vencer el SLA.
//
// Este script es SOLO la regla de negocio del SLA. Toda la lógica de días
// hábiles (fines de semana + feriados de Colombia, colección 48) vive en el
// script utilitario COL_UTIL_Dias_Habiles, que se invoca aquí vía el SDK $api
// de PM4 de forma síncrona.
//
// PORTABILIDAD: el útil NO se referencia por su id numérico (cambia al migrar
// de instancia), sino por su UUID, que se preserva en el export/import de
// paquetes de PM4. El id real se resuelve en runtime y se cachea en proceso.

// UUID estable del script COL_UTIL_Dias_Habiles (no cambia entre instancias).
const UTIL_DIAS_HABILES_UUID  = 'a26a713d-ea78-48b3-b829-5ddce63cfbd2';
// Título de respaldo por si el UUID no estuviera (p.ej. útil recreado a mano).
const UTIL_DIAS_HABILES_TITLE = 'COL_UTIL_Dias_Habiles';

$qd_strSlaAssigned = $data["qd_strSlaAssigned"];
$qd_strFilingDate  = $data["qd_strFilingDate"];

/**
 * Resuelve el ID actual de un script por su UUID (estable entre instancias),
 * con fallback al título. Cachea el resultado en proceso para no repetir la
 * búsqueda si se invoca al mismo script varias veces en esta ejecución.
 */
function resolveScriptId($api, $uuid, $title) {
    static $cache = [];
    $cacheKey = $uuid ?: $title;
    if (isset($cache[$cacheKey])) {
        return $cache[$cacheKey];
    }

    $scripts = $api->scripts();

    // Acotamos la búsqueda por título (filtro liviano) y confirmamos por UUID.
    // Si el título cambió tras migrar, caemos a un listado más amplio.
    $tryLists = [];
    $tryLists[] = $scripts->getScripts($title);   // filter = título
    $tryLists[] = $scripts->getScripts($uuid);    // por si el filtro indexa uuid

    foreach ($tryLists as $resp) {
        $list = ($resp && method_exists($resp, 'getData')) ? $resp->getData() : [];
        // 1º intento: match EXACTO por UUID (fuente de verdad).
        foreach (($list ?: []) as $s) {
            $sUuid = method_exists($s, 'getUuid') ? $s->getUuid() : ($s['uuid'] ?? null);
            if ($uuid && $sUuid === $uuid) {
                return $cache[$cacheKey] = (int)(method_exists($s, 'getId') ? $s->getId() : $s['id']);
            }
        }
    }
    // 2º intento (fallback): match exacto por título si el UUID no apareció.
    $resp = $scripts->getScripts($title);
    $list = ($resp && method_exists($resp, 'getData')) ? $resp->getData() : [];
    foreach (($list ?: []) as $s) {
        $sTitle = method_exists($s, 'getTitle') ? $s->getTitle() : ($s['title'] ?? null);
        if ($sTitle === $title) {
            return $cache[$cacheKey] = (int)(method_exists($s, 'getId') ? $s->getId() : $s['id']);
        }
    }

    return null; // no se encontró
}

/**
 * Ejecuta el script utilitario de días hábiles de forma SÍNCRONA vía $api y
 * devuelve su output (array). data va como STRING JSON (requisito de PM4).
 */
function callDiasHabiles($api, array $args) {
    $id = resolveScriptId($api, UTIL_DIAS_HABILES_UUID, UTIL_DIAS_HABILES_TITLE);
    if (!$id) {
        return null; // el útil no está disponible en esta instancia
    }
    $scripts = $api->scripts();
    $body = new \ProcessMaker\Client\Model\InlineObject13();
    $body->setData(json_encode($args));
    $body->setConfig(json_encode(new stdClass()));
    $body->setSync(true);
    $resp = $scripts->executeScript($id, $body);
    return $resp->getOutput(); // == el return del script utilitario
}

function calculateTimeLeft($api, $slaAssigned, $filingDate) {
    // 1. Deadline = fecha de radicación + SLA días HÁBILES.
    $add = callDiasHabiles($api, [
        "op"      => "add",
        "fecha"   => $filingDate,
        "dias"    => (int)$slaAssigned,
        "formato" => "d/m/Y",
    ]);
    if (!is_array($add) || !isset($add["fecha_fmt"])) {
        return 0; // útil no disponible o formato de radicación inválido -> degrada seguro
    }

    // 2. Días HÁBILES restantes desde hoy hasta el deadline (negativo si venció).
    $diff = callDiasHabiles($api, [
        "op"           => "diff",
        "fecha_inicio" => "today",
        "fecha_fin"    => $add["fecha_fmt"],
        "formato"      => "d/m/Y",
    ]);

    return (is_array($diff) && isset($diff["dias"])) ? $diff["dias"] : 0;
}

$timeLeft = calculateTimeLeft($api, $qd_strSlaAssigned, $qd_strFilingDate);
$qd_blnSlaAlert = $timeLeft <= 2;

return [
    "qd_blnSlaAlert" => $qd_blnSlaAlert,
    "timeLeft" => $timeLeft,
];
