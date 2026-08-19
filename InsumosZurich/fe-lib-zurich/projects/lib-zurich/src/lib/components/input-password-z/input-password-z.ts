
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
import { ZaPasswordInput } from '@zurich/angular-components';
import { UtilService } from '../../core/utils/services/util.service';

@Component({
  selector: 'lib-input-password-z',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, ZaPasswordInput],
  templateUrl: './input-password-z.html',
  styleUrl: './input-password-z.scss',
})
export class InputPasswordZ implements OnInit, OnChanges {
  @Input() name: string = '';
  @Input() model: any;
  @Output() modelChange: EventEmitter<any> = new EventEmitter();
  @Input() label: string = '';
  @Input() lineType: boolean = false;
  @Input() helpText: string = '';
  @Input() invalid: boolean = false;
  @Output() invalidChange: EventEmitter<any> = new EventEmitter();
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() group: FormGroup = new FormGroup({});

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
    if (this.group.status == 'INVALID') {
      this.invalid = true;
      this.invalidChange.emit(this.invalid);
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
          ])
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

  updateControl(): void {
    if (this.group && this.group.get(this.name)) {
      this.group.get(this.name)?.setValue(this.model);
    }
  }
}
