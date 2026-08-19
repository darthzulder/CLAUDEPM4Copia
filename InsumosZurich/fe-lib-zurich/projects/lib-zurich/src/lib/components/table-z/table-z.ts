import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ContentChildren,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  PLATFORM_ID,
  QueryList,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ZaPagination, ZaTable } from '@zurich/angular-components';
import { TableModel } from '../../core/utils/models/tableModel';
import { ZTemplate } from '../../derective/z-template';
import {
  CommonModule,
  CurrencyPipe,
  DatePipe,
  isPlatformBrowser,
  UpperCasePipe,
} from '@angular/common';
import { CheckboxZ } from '../checkbox-z/checkbox-z';
import { TagZ } from '../tag-z/tag-z';
import { TABLE_CONSTANTS } from '../../core/constants/table-constants';
import { DynamicPipe } from '../../core/pipes/dinamic-pipes';

// Añadimos tipos auxiliares para no contaminar tu data de negocio:
type RowWithGroup<T> = T & {
  [prop: string]: any;
  _groupValue?: string | number;
  _rowspan?: number;
  _showGroup?: boolean; // true: es la 1ª fila del grupo y debe pintar la celda con rowspan
};

@Component({
  selector: 'lib-table-z',
  standalone: true,
  imports: [
    CommonModule,
    ZaTable,
    ZaPagination,
    CheckboxZ,
    ZTemplate,
    TagZ,
    DynamicPipe,
  ],
  templateUrl: './table-z.html',
  styleUrl: './table-z.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [DatePipe, CurrencyPipe, UpperCasePipe],
})
export class TableZ
  implements OnInit, AfterContentInit, AfterViewInit, OnChanges
{
  @Input() headers: Array<TableModel> = new Array<any>();
  @Input() data: Array<any> = new Array<any>();
  @Input() typeStyle: string = '';
  @Input() pages: number = 0;
  @Input() disablePage: boolean = false;
  @Input() showGenericStart: boolean = false;
  @Input() genericStartName: string = '';
  @Input() showGenericEnd: boolean = false;
  @Input() generciEndName: string = '';
  @Input() hideHeader: boolean = false;
  @Output() eventChangePages: EventEmitter<any> = new EventEmitter();
  @Input() tableCheck: boolean = false;
  @Output() selectedItemsList: EventEmitter<any> = new EventEmitter();

  @ContentChildren(ZTemplate) template!: QueryList<ZTemplate>;

  @ViewChild('checkAll') checkAll!: ElementRef;

  public genericStartT: any;
  public genericEndT: any;
  public page: number = 1;
  public selectedItems: Array<any> = [];
  public selectAllItems: boolean = false;
  public checkAllItem: any;
  public columnTemplates: { [key: string]: TemplateRef<any> } = {};
  public viewData: Array<RowWithGroup<any>> = [];
  public TABLE_CONSTANTS = TABLE_CONSTANTS;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnChanges(changes: any): void {
    if (changes.data) {
      this.orderData();
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const allITems = document.querySelector('.checkAll');
      setTimeout(() => {
        if (allITems) {
          this.checkAllItem =
            allITems.children[0].children[0].shadowRoot?.querySelector(
              'input',
            ) as HTMLInputElement;
        }
      });
    }
  }

  ngAfterContentInit(): void {
    this.template.forEach((item) => {
      switch (item.id) {
        case 'start':
          this.genericStartT = item.template;
          break;
        case 'end':
          this.genericEndT = item.template;
          break;
        default:
          this.columnTemplates[item.id] = item.template;
          break;
      }
    });
  }

  ngOnInit(): void {
    this.orderData();
  }

  private orderData() {
    const groupHeader = this.headers.find((h) => h.groupLabel);
    if (!groupHeader || !groupHeader.key) {
      // Si no hay columna marcada para agrupar, usa la data tal cual
      this.viewData = [...this.data];
      return;
    }

    const key = groupHeader.key;

    // 1) Ordenar por la clave de agrupación (si es string, usa localeCompare)
    this.viewData = [...this.data].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (typeof av === 'string' && typeof bv === 'string') {
        return av.localeCompare(bv);
      }
      // fallback numérico / genérico
      if (av < bv) return -1;
      if (av > bv) return 1;
      return 0;
    });

    // 2) Calcular metadatos de grupo: _showGroup y _rowspan
    this.buildGroupingMeta(this.viewData, key);
  }

  private buildGroupingMeta<T extends object>(
    rows: Array<RowWithGroup<T>>,
    key: string,
  ) {
    if (!rows.length) return;

    let currentValue: any = rows[0][key];
    let startIndex = 0;
    let count = 1;

    // Inicializa la primera fila como potencial inicio de grupo
    rows[0]._showGroup = true;
    rows[0]._groupValue = currentValue;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const value = row[key];

      if (value === currentValue) {
        // Misma agrupación
        row._showGroup = false; // Estas filas no pintan la celda de grupo
        row._groupValue = currentValue;
        count++;
      } else {
        // Cerramos el grupo anterior
        rows[startIndex]._rowspan = count;

        // Abrimos nuevo grupo
        currentValue = value;
        startIndex = i;
        count = 1;

        row._showGroup = true;
        row._groupValue = currentValue;
      }
    }

    // Cerrar el último grupo
    rows[startIndex]._rowspan = count;
  }

  eventChangePage(event: any) {
    this.page = event.detail;
    this.eventChangePages.emit(this.page);
  }

  simpleCheck(event: any, dt: any, index: any): void {
    if (!this.selectAllItems) {
      let id = this.getIdItem();

      if (event.detail) {
        this.selectedItems.push(dt);
      } else {
        this.selectedItems = this.selectedItems.filter((item) => {
          return item[id[0].key!] !== dt[id[0].key!];
        });
      }
      this.selectedItemsList.emit(this.selectedItems);
    }
    this.validIsCheck(index);
  }

  public selectAll(event: any) {
    this.selectAllItems = event.detail;
    setTimeout(() => {
      let sC: any;
      let listItems = document.querySelectorAll('.singleCheck');
      listItems.forEach((item) => {
        item.childNodes.forEach((subI) => {
          let s = subI.childNodes[0] as HTMLElement;
          sC = s.shadowRoot?.querySelector('input');
          if (sC) {
            if (!sC.checked && this.selectAllItems) {
              sC.checked = true;
            } else if (sC.checked && !this.selectAllItems) {
              sC.checked = false;
            }
          }
        });
      });
      this.selectedItemsList.emit(this.selectAllItems ? this.data : []);
    }, 20);
  }

  validIsCheck(index: any) {
    this.checkAllItem = this.checkAllItem as HTMLInputElement;

    if (this.checkAllItem.checked) {
      this.checkAllItem.checked = false;
      this.selectAllItems = false;

      let d = this.data[index];

      let id = this.getIdItem();
      this.selectedItems = this.data.filter((item) => {
        return item[id[0].key!] !== d[id[0].key!];
      });

      this.selectedItemsList.emit(this.selectedItems);
    }
  }

  getIdItem(): any {
    return this.headers.filter((item) => {
      return item.id;
    });
  }

  validColorByCoincidencia(status: any): string {
    let color: string = '#000000';

    if (TABLE_CONSTANTS.TAG_WARNING.includes(status)) {
      color = '#F9E547';
    }

    if (TABLE_CONSTANTS.TAG_ERROR.includes(status)) {
      color = '#BA4538';
    }

    if (TABLE_CONSTANTS.TAG_OK.includes(status)) {
      color = '#3A8367';
    }

    if (TABLE_CONSTANTS.TAG_ARCHIVATE.includes(status)) {
      color = '#DDE4E3';
    }

    return color;
  }
}
