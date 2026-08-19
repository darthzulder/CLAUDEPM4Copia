import { DatePipe } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ZaRangeDateInput } from '@zurich/angular-components';

@Component({
  selector: 'lib-range-date-z',
  imports: [],
  standalone: true,
  templateUrl: './range-date-z.html',
  styleUrl: './range-date-z.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RangeDateZ {
  @Input() label: string = 'content';
  @Input() config: string = 'teal';
  @Input() helpText: string = 'Rango de fechas de filtro';
  @Input() min: string = 'date';
  @Input() required: boolean = false;
  @Input() ztheme: string = 'dark';

  @Input() modelo: [string | null, string | null] = [null, null];
  @Output() modeloChange = new EventEmitter<[string | null, string | null]>();

  onModeloChange(event: Event) {
    const customEvent = event as CustomEvent<[string | null, string | null]>;

    if (Array.isArray(customEvent.detail) && customEvent.detail.length === 2) {
      const [start, end] = customEvent.detail;

      if (
        (typeof start === 'string' || start === null) &&
        (typeof end === 'string' || end === null)
      ) {
        this.modelo = [start, end];
        console.log('Fechas seleccionadas:', this.modelo);

        // Emitimos el cambio para que el componente padre lo reciba
        this.modeloChange.emit(this.modelo);
      } else {
        console.warn('Valores no válidos en el rango:', customEvent.detail);
      }
    } else {
      console.warn('Formato inesperado del evento:', event);
    }
  }
}
