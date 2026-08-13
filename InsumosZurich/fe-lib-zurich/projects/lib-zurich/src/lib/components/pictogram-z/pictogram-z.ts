import { Component, Input } from '@angular/core';
import { ZaPictogram } from '@zurich/angular-components';
import { PictogramName } from '@zurich/dev-utils/data';
import { ToAttr } from '@zurich/dev-utils/typescript';

@Component({
  selector: 'lib-pictogram-z',
  imports: [ZaPictogram],
  templateUrl: './pictogram-z.html',
  styleUrl: './pictogram-z.scss',
})
export class PictogramZ {
  @Input() customStr: string = '';
  @Input() typePictogram: ToAttr<PictogramName, 'dark'> | undefined =
    'growth-mindset';
}
