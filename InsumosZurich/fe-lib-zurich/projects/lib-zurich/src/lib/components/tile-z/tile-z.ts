import {
  AfterContentInit,
  Component,
  ContentChildren,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  Input,
  Output,
  QueryList,
} from '@angular/core';
import { ZaTile } from '@zurich/angular-components';
import { ZTemplate } from '../../derective/z-template';
import { CommonModule } from '@angular/common';
import { ButtonZ } from '../button-z/button-z';

@Component({
  selector: 'lib-tile-z',
  standalone: true,
  imports: [CommonModule, ZaTile, ZTemplate, ButtonZ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './tile-z.html',
  styleUrl: './tile-z.scss',
})
export class TileZ implements AfterContentInit {
  @Input() img: string = '';
  @Input() nameButton = '';
  @Input() customButtons: boolean = true;
  @Input() imgLeft: boolean = false;
  @Output() eventClick: EventEmitter<any> = new EventEmitter<any>();
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

  eventButtonClick(event: any) {
    this.eventClick.emit(event);
  }
}
