import {
  AfterContentInit,
  Component,
  ContentChildren,
  CUSTOM_ELEMENTS_SCHEMA,
  Input,
  OnInit,
  QueryList,
} from '@angular/core';
import { ZTemplate } from '../../derective/z-template';
import { ZaAccordion } from '@zurich/angular-components';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextZ } from '../input-text-z/input-text-z';
import { ButtonZ } from '../button-z/button-z';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-accordion-z',
  imports: [
    CommonModule,
    ZaAccordion,
    FormsModule,
    ReactiveFormsModule,
    InputTextZ,
    ButtonZ,
  ],
  templateUrl: './accordion-z.html',
  styleUrl: './accordion-z.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AccordionZ implements AfterContentInit {
  @Input() titleLabel: string = '';
  @Input() titleInput: boolean = false;
  @Input() readonlyInput: boolean = true;
  @Input() modelInput: any;
  @Input() groupInput: FormGroup = new FormGroup({});
  @Input() validInput: boolean = false;
  @Input() summaryMargin: string = '2';
  @Input() label: string = 'Ingrese un valor';
  @ContentChildren(ZTemplate) template!: QueryList<ZTemplate>;

  public content: any;
  constructor() {}

  ngAfterContentInit(): void {
    this.content = this.template.first.template;
  }

  changeRead() {
    if (this.readonlyInput) {
      this.readonlyInput = false;
    } else {
      this.readonlyInput = true;
    }
  }
}
