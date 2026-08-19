import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { ZaShape } from '@zurich/angular-components';
import { ZShape_Value } from '@zurich/dev-utils/code/Shape.props';

@Component({
  selector: 'lib-shape-z',
  imports: [ZaShape],
  templateUrl: './shape-z.html',
  styleUrl: './shape-z.css',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ShapeZ {
  @Input() size: string = '50';
  @Input() shape: ZShape_Value = '1';
}
