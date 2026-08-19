import { Component, Input } from '@angular/core';
import { ZaNavigation } from '@zurich/angular-components';
import { NavigationRoute } from './navigation-route.model';
@Component({
  selector: 'lib-navigation-z',
  standalone: true,
  imports: [ZaNavigation],
  templateUrl: './navigation-z.html',
  styleUrl: './navigation-z.css',
})
export class NavigationZ {
  @Input() routes?: NavigationRoute[];
  @Input() social?: {facebook?: string, twitter?: string, linkedin?: string, instagram?: string};
}
