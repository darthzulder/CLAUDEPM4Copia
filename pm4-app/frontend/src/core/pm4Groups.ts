import pm4 from '../api/pm4Client';

/** Opción de usuario para un select de reasignación: `id` es el user_id real de PM4. */
export interface Pm4GroupUser {
  value: string;
  label: string;
  id: string;
}

// Los nombres de grupo llegan con espacios sobrantes y capitalización inconsistente
// (vienen de catálogos mantenidos a mano), por eso se normalizan antes de comparar.
const normalizar = (in_gen: unknown) => String(in_gen ?? '').trim().toLowerCase();

/**
 * Resuelve los usuarios reales de un grupo PM4 a partir de su NOMBRE
 * (`GET /groups?filter=` + `GET /groups/{id}/users`), para poblar los selects de
 * reasignación/asignación. Devuelve `[]` si el grupo no existe.
 *
 * Se busca por nombre y no por id porque los ids son específicos de cada instancia
 * PM4 (ver "Registro de IDs PM4" en pm4-app/CLAUDE.md). Si el filtro devuelve varios
 * grupos se toma el que matchea exacto, y como último recurso el primero.
 *
 * OJO con `id`: pese a que el OpenAPI de este endpoint documenta la respuesta como
 * `users` puros, PM4 en la práctica devuelve registros con forma de GroupMember
 * (pivote): `id` es el id de LA FILA del pivote group_members, no el id real del
 * usuario — ese viaja en `member_id` (ver schemas groupMembers/getGroupMembersById
 * en docs (4).json). Se prioriza `member_id` y se cae a `id` solo si no viene (por si
 * alguna instancia sí devuelve el user plano).
 */
export async function fetchGroupUsers(in_strGroupName: string): Promise<Pm4GroupUser[]> {
  const objGroupsResp = await pm4.get('/groups', { params: { filter: in_strGroupName, per_page: 100 } });
  const lstGroups: { id: string; name?: string }[] = objGroupsResp.data?.data ?? [];
  const objGroup = lstGroups.find((objG) => normalizar(objG.name) === normalizar(in_strGroupName)) ?? lstGroups[0];
  if (!objGroup) return [];

  const objUsersResp = await pm4.get(`/groups/${objGroup.id}/users`, { params: { per_page: 100 } });
  const lstUsers: { id: number | string; member_id?: number | string; username: string; firstname?: string; lastname?: string }[]
    = objUsersResp.data?.data ?? [];
  return lstUsers
    .map((objUser) => ({
      value: objUser.username,
      label: `${objUser.firstname ?? ''} ${objUser.lastname ?? ''}`.trim() || objUser.username,
      id: String(objUser.member_id ?? objUser.id),
    }))
    .filter((objOpt) => !!objOpt.value);
}
