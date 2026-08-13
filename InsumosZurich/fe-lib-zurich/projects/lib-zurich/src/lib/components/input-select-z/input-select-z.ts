import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ZaMultiselect, ZaSelect } from '@zurich/angular-components';
import { SelectModel } from '../../core/utils/models/selectModel';
import { UtilService } from '../../core/utils/services/util.service';

@Component({
  selector: 'lib-input-select-z',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, ZaSelect, ZaMultiselect],
  templateUrl: './input-select-z.html',
  styleUrl: './input-select-z.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class InputSelectZ implements OnInit, OnChanges {
  @ViewChild('selectInput', { read: ElementRef }) selectInputRef!: ElementRef;

  @Input() name: string = '';
  @Input() options: Array<SelectModel> = [];
  @Input() model: any;
  @Output() modelChange: EventEmitter<any> = new EventEmitter<any>();
  @Input() multiSelect: boolean = false;
  @Input() group: FormGroup = new FormGroup({});
  @Input() label: string = 'Select';
  @Input() typeLine: boolean = false;
  @Input() required: boolean = false;
  @Input() invalid: boolean = false;
  @Output() invalidChange: EventEmitter<any> = new EventEmitter();
  @Input() disable: boolean = false;
  @Input() iconType: boolean = false;
  @Input() icon: string = 'bookmark';
  @Input() helpText: string = '';
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
    if (changes['invalid']) {
      this.updateInvalidState();
    }

    if (changes.model) {
      setTimeout(() => {
        this.updateControl();
      });
    }
    if (!this.manualValidation && this.group.status == 'INVALID') {
      this.invalid = true;
      this.invalidChange.emit(this.invalid);
      this.updateInvalidState();
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
    if (this.multiSelect) {
      //Queda pendiente por ajustar la validación.
      return this.required && this.model;
    } else {
      return this.required && !String(this.model || '').trim();
    }
  }

  updateControl(): void {
    if (this.group && this.group.get(this.name)) {
      this.group.get(this.name)?.setValue(this.model);
    }
  }

  updateInvalidState(): void {
    if (this.selectInputRef?.nativeElement) {
      this.selectInputRef.nativeElement.invalid = this.invalid;
    }
  }
}
