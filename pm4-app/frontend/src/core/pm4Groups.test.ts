import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchGroupUsers } from './pm4Groups';

// Se mockea el cliente HTTP: lo que se testea es el matcheo del grupo por nombre y la
// resolución del user_id real (member_id vs id), que es donde PM4 tiene la trampa.
// `vi.hoisted` es obligatorio acá: el import de `./pm4Groups` (que a su vez importa el
// cliente) se hoistea por encima de las const del archivo, así que un objeto declarado
// con `const` a secas todavía no existe cuando corre la factory del mock.
const OBJ_PM4 = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('../api/pm4Client', () => ({ default: OBJ_PM4 }));

const respuesta = (in_lstData: unknown[]) => Promise.resolve({ data: { data: in_lstData } });

beforeEach(() => {
  OBJ_PM4.get.mockReset();
});

describe('fetchGroupUsers', () => {
  it('prefiere el grupo con nombre exacto aunque el filtro devuelva varios', async () => {
    OBJ_PM4.get
      .mockImplementationOnce(() => respuesta([
        { id: '7', name: 'Siniestros Autos' },
        { id: '9', name: 'Siniestros' },
      ]))
      .mockImplementationOnce(() => respuesta([]));

    await fetchGroupUsers('Siniestros');

    expect(OBJ_PM4.get).toHaveBeenNthCalledWith(2, '/groups/9/users', expect.anything());
  });

  it('normaliza espacios y mayúsculas al comparar el nombre del grupo', async () => {
    OBJ_PM4.get
      .mockImplementationOnce(() => respuesta([{ id: '3', name: '  Jurídica ' }]))
      .mockImplementationOnce(() => respuesta([]));

    await fetchGroupUsers('jurídica');

    expect(OBJ_PM4.get).toHaveBeenNthCalledWith(2, '/groups/3/users', expect.anything());
  });

  it('cae al primer grupo del filtro si ninguno matchea exacto', async () => {
    OBJ_PM4.get
      .mockImplementationOnce(() => respuesta([{ id: '4', name: 'Pagos y Recaudos' }]))
      .mockImplementationOnce(() => respuesta([]));

    await fetchGroupUsers('Pagos');

    expect(OBJ_PM4.get).toHaveBeenNthCalledWith(2, '/groups/4/users', expect.anything());
  });

  it('devuelve [] y no consulta usuarios si el grupo no existe', async () => {
    OBJ_PM4.get.mockImplementationOnce(() => respuesta([]));

    await expect(fetchGroupUsers('Inexistente')).resolves.toEqual([]);
    expect(OBJ_PM4.get).toHaveBeenCalledTimes(1);
  });

  it('toma el user_id de member_id (el `id` es la fila del pivote group_members)', async () => {
    OBJ_PM4.get
      .mockImplementationOnce(() => respuesta([{ id: '9', name: 'SAC — Servicio al Cliente' }]))
      .mockImplementationOnce(() => respuesta([
        { id: 555, member_id: 42, username: 'aperez', firstname: 'Ana', lastname: 'Pérez' },
      ]));

    await expect(fetchGroupUsers('SAC — Servicio al Cliente')).resolves.toEqual([
      { value: 'aperez', label: 'Ana Pérez', id: '42' },
    ]);
  });

  it('cae a `id` si el usuario no trae member_id y etiqueta con el username sin nombre', async () => {
    OBJ_PM4.get
      .mockImplementationOnce(() => respuesta([{ id: '9', name: 'Producto' }]))
      .mockImplementationOnce(() => respuesta([{ id: 77, username: 'jlopez' }]));

    await expect(fetchGroupUsers('Producto')).resolves.toEqual([
      { value: 'jlopez', label: 'jlopez', id: '77' },
    ]);
  });

  it('descarta los registros sin username (no sirven para reasignar)', async () => {
    OBJ_PM4.get
      .mockImplementationOnce(() => respuesta([{ id: '9', name: 'Producto' }]))
      .mockImplementationOnce(() => respuesta([
        { id: 1, username: '', firstname: 'Sin', lastname: 'Usuario' },
        { id: 2, member_id: 8, username: 'ok' },
      ]));

    await expect(fetchGroupUsers('Producto')).resolves.toEqual([
      { value: 'ok', label: 'ok', id: '8' },
    ]);
  });
});
