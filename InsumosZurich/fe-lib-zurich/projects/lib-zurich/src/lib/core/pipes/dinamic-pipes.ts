import { CurrencyPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dynamicPipe',
})
export class DynamicPipe implements PipeTransform {
  constructor(
    private datePipe: DatePipe,
    private currencyPipe: CurrencyPipe,
    private upperCasePipe: UpperCasePipe,
  ) {}

  transform(value: any, pipeName?: string): any {
    if (!pipeName) {
      return value;
    }

    switch (pipeName) {
      case 'date':
        return this.datePipe.transform(value, 'dd/MM/yyyy');

      case 'currency':
        return this.currencyPipe.transform(value);

      case 'uppercase':
        return this.upperCasePipe.transform(value);

      case 'strong':
        return `<strong>${value}</strong>`;

      default:
        return value;
    }
  }
}
