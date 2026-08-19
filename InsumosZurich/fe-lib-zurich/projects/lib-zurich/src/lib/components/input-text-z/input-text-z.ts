import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ZaTextInput } from '@zurich/angular-components';
import { UtilService } from '../../core/utils/services/util.service';
import { SizelessIconAttr } from '@zurich/dev-utils/data';

@Component({
  selector: 'lib-input-text-z',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, ZaTextInput],
  templateUrl: './input-text-z.html',
  styleUrl: './input-text-z.scss',
})
export class InputTextZ implements OnInit, OnChanges {
  @Input() label: string = '';
  @Input() icon: SizelessIconAttr | undefined;
  @Input() inputType: string = 'text';
  @Input() lineType: boolean = false;
  @Input() name: string = '';
  @Input() model: any;
  @Output() modelChange: EventEmitter<any> = new EventEmitter<any>();
  @Input() group: FormGroup = new FormGroup({});
  @Input() helpText: string = '';
  @Input() valid: boolean = false;
  @Output() validChange: EventEmitter<any> = new EventEmitter<any>();
  @Input() required: boolean = false;
  @Input() readonly: boolean = false;
  @Input() maxLength: boolean = false;
  @Input() maxNumber: number = 0;
  @Input() manualValidation: boolean = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.generateGroup();
    this.generateControl();
  }

  generateGroup() {
    if (!this.group) {
      this.group = this.fb.group({});
    }
  }

  ngOnChanges(changes: any): void {
    if (changes.model) {
      setTimeout(() => {
        this.updateControl();
      });
    }
    if (!this.manualValidation && this.group.status == 'INVALID') {
      this.valid = true;
      this.validChange.emit(this.valid);
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
