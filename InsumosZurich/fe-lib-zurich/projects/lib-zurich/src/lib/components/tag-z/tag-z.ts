import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { ZaTag } from '@zurich/angular-components';
import { SizelessIconAttr } from '@zurich/dev-utils/data';

@Component({
  selector: 'lib-tag-z',
  imports: [ZaTag],
  templateUrl: './tag-z.html',
  styleUrl: './tag-z.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TagZ {
  @Input() label: string = '';
  @Input() colorTag: string = '#000000';
  @Input() icon: SizelessIconAttr | undefined;
  @Input() iconRight: boolean | undefined = false;
  @Input()
  fill:
    | 'moss'
    | 'azure'
    | 'teal'
    | 'lilac'
    | 'candy'
    | 'peach'
    | 'mint'
    | 'lime'
    | 'lemon'
    | 'powder-pink'
    | undefined;
}
