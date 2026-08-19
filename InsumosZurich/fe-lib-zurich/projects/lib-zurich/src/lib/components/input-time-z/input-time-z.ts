import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ZaTimeInput } from '@zurich/angular-components';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ToAttrChain } from '@zurich/dev-utils/typescript';
import { ZInput_Size, ZInput_Type } from '@zurich/dev-utils/code';
import { UtilService } from '../../core/utils/services/util.service';

@Component({
  selector: 'lib-input-time-z',
  imports: [FormsModule, ReactiveFormsModule, ZaTimeInput],
  templateUrl: './input-time-z.html',
  styleUrl: './input-time-z.scss',
})
export class InputTimeZ implements OnInit, OnChanges, AfterViewInit {
  @ViewChild('timeInput', { read: ElementRef }) timeInputRef!: ElementRef;

  @Input() label: string = '';
  @Input() name: string = '';
  @Input() model: any;
  @Output() modelChange: EventEmitter<any> = new EventEmitter<any>();
  @Input() group: FormGroup = new FormGroup({});
  @Input() required: boolean = false;
  @Input() valid: boolean = false;
  @Output() validChange: EventEmitter<any> = new EventEmitter<any>();
  @Input() disabled: boolean = false;
  @Input() helpText: string = 'Ingrese un valor';
  @Input() typeInput: ToAttrChain<ZInput_Type, ZInput_Size> | undefined = '';
  @Input() readonly: boolean = false;
  @Input() range: [
    `${number}${number}:${number}${number}` | null,
    `${number}${number}:${number}${number}` | null,
  ] = ['00:00', '23:00'];
  @Input() manualValidation: boolean = false;

  constructor(private fb: FormBuilder) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.updateReadOnly();
    });
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
    if (changes['readonly']) {
      setTimeout(() => {
        this.updateReadOnly();
      });
    }
    if (changes['model']) {
      setTimeout(() => {
        this.updateControl();
      });
    }
    if (!this.manualValidation && this.group.status == 'INVALID') {
      this.valid = true;
      this.validChange.emit(this.valid);
    }
  }

  updateReadOnly(): void {
    if (this.timeInputRef?.nativeElement) {
      const el = this.timeInputRef.nativeElement;

      // Aplicar al wrapper za-time-input
      el.readonly = this.readonly;

      // Aplicar directamente al z-time-input interno
      setTimeout(() => {
        const zTimeInput = el.querySelector('z-time-input');
        if (zTimeInput) {
          if (this.readonly) {
            zTimeInput.setAttribute('readonly', '');
          } else {
            zTimeInput.removeAttribute('readonly');
          }
          (zTimeInput as any).readonly = this.readonly;
        }
      }, 1);
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
    this.group?.get(this.name)?.setValue(this.model);
  }
}
