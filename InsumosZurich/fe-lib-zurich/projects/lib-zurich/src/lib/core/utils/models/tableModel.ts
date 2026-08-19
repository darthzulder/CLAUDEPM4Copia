import { SizelessIconAttr } from '@zurich/dev-utils/data';

export class TableModel {
  /**
   *
   * @param id El valor debe ser unico
   * @param title Item que representa el nombre de la columna
   * @param key Valor que representa al nombre del atributo  de la columna
   * @param actions
   * @param icon
   * @param iconClass
   * @param strong
   * @param tag
   * @param tagType
   * @param pipe
   * @param percentSing
   * @param statuData
   * @param centerText
   * @param formatDate
   * @param colTamanio
   * @param isName
   * @param showGroupLabel
   * @param groupLabel
   */
  constructor(
    public id?: boolean,
    public title?: string,
    public key?: string,
    public actions?: boolean,
    public icon?: boolean,
    public iconClass?: string,
    public strong?: boolean,
    public pipe?: string,
    public percentSing?: boolean,
    public statuData?: boolean,
    public centerText?: boolean,
    public formatDate?: string,
    public colTamanio?: string,
    public isName?: boolean,
    public showGroupLabel?: boolean,
    public groupLabel?: boolean,
    public rowspan?: number,
    public isSubGroup?: boolean,
    public subGroupIndice?: number,
    public subGroupkey?: string,
    public isTag?: boolean,
    public iconTag?: SizelessIconAttr | undefined,
    public iconRight?: boolean,
  ) {}
}
