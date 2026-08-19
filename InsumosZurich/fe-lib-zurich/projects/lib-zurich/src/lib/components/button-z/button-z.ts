import { ToAttrChain } from '../../../../../../node_modules/@zurich/dev-utils/dist/typescript/ZDS.types';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  Type,
} from '@angular/core';
import { ZaButton } from '@zurich/angular-components';
import { ZButton_Size, ZButton_Type } from '@zurich/dev-utils/code';
import { SizelessIconAttr } from '@zurich/dev-utils/data';

@Component({
  selector: 'lib-button-z',
  standalone: true,
  imports: [ZaButton],
  templateUrl: './button-z.html',
  styleUrl: './button-z.scss',
})
export class ButtonZ implements OnInit {
  @Input() label: string = '';
  @Input() type: ToAttrChain<ZButton_Type, ZButton_Size, 'round'> = 'primary';
  @Input() icon: SizelessIconAttr | undefined;
  @Input() iconRight: boolean = false;
  @Input() disabled: boolean = true;
  @Input() wide: boolean = false;
  @Input() loading: boolean = false;
  @Input() custom_str: string = '';

  @Output() eventClick: EventEmitter<any> = new EventEmitter();

  constructor() {}

  ngOnInit(): void {}
}
