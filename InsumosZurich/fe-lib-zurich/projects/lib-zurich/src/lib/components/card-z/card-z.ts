import {
  AfterContentInit,
  Component,
  ContentChildren,
  Input,
  OnInit,
  QueryList,
} from '@angular/core';
import { ZaCard } from '@zurich/angular-components';
import { ZTemplate } from '../../derective/z-template';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-card-z',
  standalone: true,
  imports: [CommonModule, ZaCard],
  templateUrl: './card-z.html',
  styleUrl: './card-z.scss',
})
export class CardZ implements OnInit, AfterContentInit {
  @Input() showHeader: boolean = true;
  @Input() showFooter: boolean = true;
  @Input() bgColor: string = '';
  @Input() colorTxt: string = '';
  @ContentChildren(ZTemplate) template!: QueryList<ZTemplate>;

  public header: any;
  public content: any;
  public footer: any;
  public customStr: string | undefined = '';

  constructor() {}
  ngAfterContentInit(): void {
    this.buildCustomStr();
    this.template.forEach((item) => {
      switch (item.id) {
        case 'header':
          this.header = item.template;
          break;
        case 'content':
          this.content = item.template;
          break;
        case 'footer':
          this.footer = item.template;
      }
    });
  }

  ngOnInit(): void {}

  buildCustomStr(): string | undefined {
    const parts: string[] = [];

    const bg = this.bgColor?.trim();
    if (bg) parts.push(`bg:${bg}`);

    const color = this.colorTxt?.trim();
    if (color) parts.push(`color:${color}`);

    const result = parts.join(';');
    this.customStr = result;
    return result || undefined;
  }
}
