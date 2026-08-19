import { Attribute, Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: 'ng-template[libZTemplate]',
  standalone: true,
})
export class ZTemplate {
  constructor(
    public template: TemplateRef<any>,
    @Attribute('id') public id: string
  ) {}
}
