import { CommonModule } from '@angular/common';
import {
  AfterContentInit,
  Component,
  ContentChildren,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
} from '@angular/core';
import { ZTemplate } from '../../derective/z-template';
import { ZaIcon } from '@zurich/angular-components';
@Component({
  selector: 'lib-modal-z',
  standalone: true,
  imports: [CommonModule, ZaIcon],
  templateUrl: './modal-z.html',
  styleUrl: './modal-z.scss',
})
export class ModalZ implements OnInit, AfterContentInit {
  @Input() open: boolean = false;
  @Output() close: EventEmitter<any> = new EventEmitter();
  @Input() tamanio: string = '';
  @Input() ShowBackdrop: boolean = true;

  @ContentChildren(ZTemplate) template!: QueryList<ZTemplate>;

  public title: any;
  public content: any;
  public buttons: any;

  constructor() {}

  ngAfterContentInit(): void {
    this.template.forEach((item) => {
      switch (item.id) {
        case 'title':
          this.title = item.template;
          break;
        case 'content':
          this.content = item.template;
          break;
        case 'buttons':
          this.buttons = item.template;
          break;
      }
    });
  }

  ngOnInit(): void {}

  change(event: any) {
    this.open = false;
    this.close.emit(false);
  }
}
