import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { urlApi } from '../api/pm4Client';

/** Opción de usuario para un select de reasignación: `id` es el user_id real de PM4. */
export interface Pm4GroupUser {
  value: string;
  label: string;
  id: string;
}

// Los nombres de grupo llegan con espacios sobrantes y capitalización inconsistente (vienen de
// catálogos mantenidos a mano), por eso se normalizan antes de comparar.
function normalizar(in_gen: unknown): string {
  return String(in_gen ?? '')
    .trim()
    .toLowerCase();
}

/** Forma del grupo tal como lo devuelve `GET /groups`. Solo se usan estos dos campos. */
interface Pm4Group {
  id: string;
  name?: string;
}

/**
 * Forma de un registro de `GET /groups/{id}/users`.
 *
 * `member_id` es opcional **a propósito** y no es un descuido de tipado: es el eje de la trampa que
 * documenta `usuariosDeGrupo()`. Ver ahí.
 */
interface Pm4GroupMember {
  id: number | string;
  member_id?: number | string;
  username: string;
  firstname?: string;
  lastname?: string;
}

/**
 * Resuelve los usuarios reales de un grupo PM4 a partir de su NOMBRE. Port de `core/pm4Groups.ts`
 * de React, consumido por `ReasignarCasoModal` (SCR-0051) y `SeccionAsignacion` (OS-SCR-003).
 *
 * ── `providedIn: 'root'`, como `AttachmentsService` y por el mismo motivo ────────────────────────
 * No tiene estado: es una función asíncrona con un `HttpClient` adentro. Dos pantallas compartiendo
 * la instancia no pueden pisarse nada. (Contrastar con `CollectionService`/`FileRegistryService`,
 * que **sí** tienen estado y por eso se proveen por pantalla.)
 *
 * ── Por qué es un servicio y no una función suelta ──────────────────────────────────────────────
 * Igual que `AttachmentsService`: necesita `HttpClient`, y eso en Angular solo se obtiene por
 * inyección. El `normalizar` de acá sí queda como función de módulo, porque es puro.
 *
 * ── Se busca por NOMBRE, no por id ──────────────────────────────────────────────────────────────
 * Regla 6 del proyecto: los ids son específicos de cada instancia PM4. La diferencia con las
 * colecciones es que un grupo **no está en `pm4-registry.json`** —el catálogo de grupos lo mantiene
 * el área de negocio y cambia sin pasar por el repo—, así que la resolución es en vuelo contra
 * `GET /groups?filter=`. Es el mismo principio, resuelto en runtime en vez de en un registro.
 */
@Injectable({ providedIn: 'root' })
export class Pm4GroupsService {
  private readonly objHttp = inject(HttpClient);

  /**
   * Busca el grupo por nombre y devuelve sus usuarios como opciones de select.
   *
   * @param in_strGroupName Nombre del grupo tal como está en PM4. Se compara normalizado.
   * @returns `[]` si el grupo no existe — y en ese caso **no** se consulta el endpoint de usuarios.
   *
   * ── Cómo se elige el grupo cuando el filtro devuelve varios ───────────────────────────────────
   * `filter=` de PM4 es una búsqueda por substring, así que pedir "Siniestros" trae también
   * "Siniestros Autos". Se prefiere el que matchea **exacto** tras normalizar, y solo como último
   * recurso el primero de la lista. Ese fallback es deliberado: un select vacío no le dice nada al
   * usuario, mientras que la lista del grupo más parecido al menos es accionable.
   *
   * ── ⚠ OJO con `id`: el pivote GroupMember ─────────────────────────────────────────────────────
   * Pese a que el OpenAPI de este endpoint (`docs (4).json`) documenta la respuesta como `users`
   * puros, PM4 en la práctica devuelve registros con forma de **GroupMember (pivote)**: `id` es el
   * id de LA FILA de `group_members`, **no** el id real del usuario — ese viaja en `member_id`
   * (ver los schemas `groupMembers`/`getGroupMembersById`). Se prioriza `member_id` y se cae a `id`
   * solo si no viene, por si alguna instancia sí devuelve el usuario plano.
   *
   * Por qué importa tanto como para tener su propio caso de test: el `id` alimenta el `user_id` del
   * PUT de reasignación de `TaskService`. Usar el id del pivote reasigna la tarea **a otro usuario**
   * —o a ninguno— y PM4 responde 200 igual. Es una falla silenciosa que se descubre cuando alguien
   * reclama que el caso nunca le llegó.
   */
  public async usuariosDeGrupo(in_strGroupName: string): Promise<Pm4GroupUser[]> {
    const objGroupsResp = await firstValueFrom(
      this.objHttp.get<{ data?: Pm4Group[] }>(urlApi('/groups'), {
        params: { filter: in_strGroupName, per_page: 100 },
      }),
    );
    const lstGroups: Pm4Group[] = objGroupsResp?.data ?? [];
    const objGroup =
      lstGroups.find((in_objG) => normalizar(in_objG.name) === normalizar(in_strGroupName)) ??
      lstGroups[0];
    if (!objGroup) return [];

    const objUsersResp = await firstValueFrom(
      this.objHttp.get<{ data?: Pm4GroupMember[] }>(urlApi(`/groups/${objGroup.id}/users`), {
        params: { per_page: 100 },
      }),
    );
    const lstUsers: Pm4GroupMember[] = objUsersResp?.data ?? [];
    return lstUsers
      .map((in_objUser) => ({
        value: in_objUser.username,
        label:
          `${in_objUser.firstname ?? ''} ${in_objUser.lastname ?? ''}`.trim() || in_objUser.username,
        // Ver el ⚠ del docstring: `member_id` primero, `id` solo como respaldo.
        id: String(in_objUser.member_id ?? in_objUser.id),
      }))
      // Un registro sin username no sirve para reasignar (el `value` es lo que viaja al PUT), así
      // que se descarta en vez de ofrecer una opción que romperá al elegirla.
      .filter((in_objOpt) => !!in_objOpt.value);
  }
}
