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
import { ZaTextarea } from '@zurich/angular-components';
import { UtilService } from '../../core/utils/services/util.service';

@Component({
  selector: 'lib-textarea-z',
  imports: [ZaTextarea, FormsModule, ReactiveFormsModule],
  templateUrl: './textarea-z.html',
  styleUrl: './textarea-z.scss',
})
export class TextareaZ implements OnInit, OnChanges {
  @Input() label: string = '';
  @Input() lineType: boolean = false;
  @Input() name: string = '';
  @Input() model: any;
  @Output() modelChange: EventEmitter<any> = new EventEmitter<any>();
  @Input() group: FormGroup = new FormGroup({});
  @Input() helpText: string = '';
  @Input() valid: boolean = false;
  @Output() validChange: EventEmitter<any> = new EventEmitter<any>();
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() maxLength: boolean = false;
  @Input() maxNumber: number = 0;
  @Input() elastic: boolean = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.generateGroup();
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

  updateControl(): void {
    if (this.group && this.group.get(this.name)) {
      this.group.get(this.name)?.setValue(this.model);
    }
  }
}
