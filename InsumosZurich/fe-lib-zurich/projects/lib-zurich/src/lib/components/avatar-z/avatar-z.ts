import { Component, Input, OnInit } from '@angular/core';
import { ZaAvatar } from '@zurich/angular-components';
import { ZAvatar_Props } from '@zurich/dev-utils/code';

@Component({
  selector: 'lib-avatar-z',
  imports: [ZaAvatar],
  templateUrl: './avatar-z.html',
  styleUrl: './avatar-z.scss',
})
export class AvatarZ implements OnInit {
  @Input() name: string = '';
  @Input() content: string = '';
  /**
   * @param {status} status - identifica si el avatar cambia de estado de conectado, valores permitidos [absent, occupied, online, offline]
   */
  @Input() status: ZAvatar_Props['status'] = 'offline';
  /**
   * @param {config} config - Permite configurar el componente para identificar la orientación}
   * del nombre.
   */
  @Input() config: ZAvatar_Props['config'] = 'horizontal';
  @Input() img: string = '';

  public initials: string = '';

  constructor() {}

  ngOnInit(): void {
    let arrayName = this.name.split(' ');

    this.initials = arrayName[0][0].concat(arrayName[1][0]);
  }
}
