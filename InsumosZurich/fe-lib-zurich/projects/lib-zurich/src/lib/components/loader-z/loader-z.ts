import { Component, Input } from '@angular/core';
import { ZaLoader } from '@zurich/angular-components';
@Component({
  selector: 'lib-loader-z',
  imports: [ZaLoader],
  templateUrl: './loader-z.html',
  styleUrl: './loader-z.css'
})
export class LoaderZ {
  @Input() customStr: string = '';
  @Input() label: string = '';
}
