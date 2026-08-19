
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
import { ZaCheckbox } from '@zurich/angular-components';
import { UtilService } from '../../core/utils/services/util.service';

@Component({
  selector: 'lib-checkbox-z',
  standalone: true,
  imports: [ZaCheckbox, FormsModule],
  templateUrl: './checkbox-z.html',
  styleUrl: './checkbox-z.scss',
})
export class CheckboxZ implements OnInit, OnChanges {
  @Input() name: string = '';
  @Input() label: string = '';
  @Input() group: FormGroup = new FormGroup({});
  @Input() model: any;
  @Output() modelChange: EventEmitter<any> = new EventEmitter();
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() valid: boolean = false;
  @Output() validChange: EventEmitter<any> = new EventEmitter<any>();
  @Input() helpText: string = '';
  @Input() showHelpText: boolean = false;
  @Output() eventChange: EventEmitter<any> = new EventEmitter<any>();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.generateGroup();
    this.generateControl();

    if (this.group && this.group.get(this.name)) {
      this.group.get(this.name)!.statusChanges.subscribe((status) => {
        this.valid = status === 'INVALID' ? false : true;
        this.validChange.emit(this.valid);
      });
    }
  }

  ngOnChanges(changes: any): void {
    if (changes.model) {
      setTimeout(() => {
        this.updateControl();
      });
    }
  }

  generateGroup() {
    if (!this.group) {
      this.group = this.fb.group({});
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
    if (this.validRequired()) {
      return { errorRequired: true };
    }
    return null;
  }

  validRequired(): boolean {
    return this.required && this.model;
  }

  updateControl(): void {
    if (this.group && this.group.get(this.name)) {
      this.group.get(this.name)?.setValue(this.model);
    }
  }
}
