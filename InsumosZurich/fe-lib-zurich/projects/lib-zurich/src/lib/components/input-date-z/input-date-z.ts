import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ZaDateInput } from '@zurich/angular-components';
import { UtilService } from '../../core/utils/services/util.service';
import { ToAttrChain } from '@zurich/dev-utils/typescript';
import { ZInput_Size, ZInput_Type } from '@zurich/dev-utils/code';

@Component({
  selector: 'lib-input-date-z',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, ZaDateInput],
  templateUrl: './input-date-z.html',
  styleUrl: './input-date-z.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class InputDateZ implements OnInit, OnChanges, AfterViewInit {
  @ViewChild('dateInput', { read: ElementRef }) dateInputRef!: ElementRef;

  @Input() label: string = '';
  @Input() inputType: string = 'date';
  @Input() name: string = '';
  @Input() model: any;
  @Input() lineType: ToAttrChain<ZInput_Type, ZInput_Size> | undefined;
  @Output() modelChange: EventEmitter<any> = new EventEmitter<any>();
  @Input() group: FormGroup = new FormGroup({});
  @Input() valid: boolean = false;
  @Output() validChange: EventEmitter<any> = new EventEmitter<any>();
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() max: string = '';
  @Input() min: string = '';
  @Input() required: boolean = false;
  @Input() manualValidation: boolean = false;

  constructor(private fb: FormBuilder) {}

  ngAfterViewInit(): void {
    this.updateInvalidState();
  }

  ngOnInit(): void {
    this.generateGroup();
    this.generateControl();
  }

  generateGroup() {
    if (!this.group) {
      this.group = this.fb.group({});
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['valid']) {
      this.updateInvalidState();
    }

    if (changes['model']) {
      setTimeout(() => {
        this.updateControl();
      });
    }
    if (!this.manualValidation && this.group.status == 'INVALID') {
      this.valid = true;
      this.validChange.emit(this.valid);
      this.updateInvalidState();
    }
  }

  updateInvalidState(): void {
    if (this.dateInputRef?.nativeElement) {
      this.dateInputRef.nativeElement.invalid = this.valid;
    }
  }

  generateControl() {
    if (this.group) {
      if (!this.group.get(this.name)) {
        this.name = UtilService.getControlName();
        this.group.addControl(this.name, this.fb.control({}));
      }

      this.group
        .get(this.name)
        ?.setValidators(
          Validators.compose([
            this.group.get(this.name)?.validator,
            () => this.generateValidation(),
          ]),
        );
      UtilService.updateControlValitor(this.group, this.name);
    }
  }

  generateValidation() {
    if (this.validateRequired()) {
      return { errorRequired: true };
    }

    return null;
  }

  validateRequired(): boolean {
    return this.required && !String(this.model || '').trim();
  }

  // validateLenght(): boolean{
  //   return this.maxLength &&
  // }

  updateControl(): void {
    if (this.group && this.group.get(this.name)) {
      this.group.get(this.name)?.setValue(this.model);
    }
  }
}
