import { Component, Input } from '@angular/core';
import { ZaButton, ZaTooltip } from '@zurich/angular-components';
import type { ZTooltip_Props } from '@zurich/dev-utils/code/Tooltip';

@Component({
  selector: 'lib-tooltip-z',
  imports: [ZaTooltip],
  templateUrl: './tooltip-z.html',
  styleUrl: './tooltip-z.css'
})
export class TooltipZ {
  @Input() text: string = '';
  @Input() config?: ZTooltip_Props['config'];
  @Input() customStr: string = '';
}
