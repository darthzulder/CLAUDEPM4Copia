import { PictogramZ } from './../../projects/lib-zurich/src/lib/components/pictogram-z/pictogram-z';
import { StageBannerZ } from './../../projects/lib-zurich/src/lib/components/stage-banner-z/stage-banner-z';
import { TileZ } from './../../projects/lib-zurich/src/lib/components/tile-z/tile-z';
import { AlertZ } from './../../projects/lib-zurich/src/lib/components/alert-z/alert-z';
import { InputSelectZ } from './../../projects/lib-zurich/src/lib/components/input-select-z/input-select-z';
import { CheckboxZ } from './../../projects/lib-zurich/src/lib/components/checkbox-z/checkbox-z';
import { ModalZ } from './../../projects/lib-zurich/src/lib/components/modal-z/modal-z';
import { CardZ } from './../../projects/lib-zurich/src/lib/components/card-z/card-z';
import { TableZ } from './../../projects/lib-zurich/src/lib/components/table-z/table-z';
import { FooterZ } from './../../projects/lib-zurich/src/lib/components/footer-z/footer-z';
import { NavigationZ } from './../../projects/lib-zurich/src/lib/components/navigation-z/navigation-z';
import { InputPasswordZ } from '../../projects/lib-zurich/src/lib/components/input-password-z/input-password-z';
import { InputDateZ } from '../../projects/lib-zurich/src/lib/components/input-date-z/input-date-z';
import { InputTextZ } from '../../projects/lib-zurich/src/lib/components/input-text-z/input-text-z';
import { ButtonZ } from '../../projects/lib-zurich/src/lib/components/button-z/button-z';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ZTemplate } from '../../projects/lib-zurich/src/lib/derective/z-template';
import { AlertZService } from '../../projects/lib-zurich/src/lib/core/utils/services/alert-service';
import { StageZ } from './../../projects/lib-zurich/src/lib/components/stage-z/stage-z';
import { TabsZ } from './../../projects/lib-zurich/src/lib/components/tabs-z/tabs-z';
import { TooltipZ } from './../../projects/lib-zurich/src/lib/components/tooltip-z/tooltip-z';
import { LoaderZ } from './../../projects/lib-zurich/src/lib/components/loader-z/loader-z';
import { ZaLoader } from '@zurich/angular-components';
import { ShapeZ } from './../../projects/lib-zurich/src/lib/components/shape-z/shape-z';
import { AvatarZ } from '../../projects/lib-zurich/src/lib/components/avatar-z/avatar-z';
import { AccordionZ } from '../../projects/lib-zurich/src/lib/components/accordion-z/accordion-z';
import { InputTimeZ } from '../../projects/lib-zurich/src/lib/components/input-time-z/input-time-z';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    FormsModule,
    AvatarZ,
    ReactiveFormsModule,
    AlertZ,
    ButtonZ,
    InputTextZ,
    InputDateZ,
    InputPasswordZ,
    NavigationZ,
    FooterZ,
    TableZ,
    CardZ,
    ZTemplate,
    ModalZ,
    CheckboxZ,
    InputSelectZ,
    StageZ,
    StageBannerZ,
    TabsZ,
    TooltipZ,
    LoaderZ,
    TileZ,
    ZaLoader,
    ShapeZ,
    AccordionZ,
    InputTimeZ,
    PictogramZ,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class App {
  //contendo para el table
  tabData = {
    con1: 'Contenido para la pestaña 1',
    con2: 'Contenido HTML para la pestaña 2',
    con3: 'Contenido para la pestaña 3',
  };

  public datePrueba: string = '';

  public data = [
    {
      groupLabel: 'A Prueba Group',
      head1: 'Hola',
      head2: 'Mundo',
      head3: 'Prueba',
      head4: 'Prueba',
      head5: 'ACTIVO',
      head6: 'Prueba',
      sub: [
        {
          item: 'Sub Lista',
        },
      ],
    },
    {
      groupLabel: 'Prueba Group',
      head1: 'Hola2',
      head2: 'Mundo',
      head3: 'Prueba',
      head4: 'Prueba',
      head5: 'Warning',
      head6: 'Prueba',
      sub: [
        {
          item: 'Sub Lista 3',
        },
      ],
    },
    {
      groupLabel: 'A Prueba Group',
      head1: 'Hola Esta es la prueba',
      head2: 'Mundo 123',
      head3: 'Prueba',
      head4: 'Prueba',
      head5: 'No disponible',
      head6: 'Prueba',
      sub: [
        {
          item: 'Sub Lista',
        },
      ],
    },
    {
      groupLabel: 'Prueba Group',
      head1: 'Hola2',
      head2: 'Mundo',
      head3: 'Prueba',
      head4: 'Prueba',
      head5: 'Deshabilitado',
      head6: 'Prueba',
      sub: [
        {
          item: 'Sub Lista',
        },
      ],
    },
  ];
  protected title = 's-lib-zurich';
  public fb: FormBuilder = new FormBuilder();
  public fg: any = {};
  public pruebaI: string = '';
  public mCheck: boolean = false;
  public checkValid: boolean = false;
  public statusModal: boolean = false;
  public pruebaPass: string = '';
  public pruebaSelect: any;
  public pruebaSelectM: Array<any> = [];

  constructor(private alerts: AlertZService) {
    this.fg.prueba = this.fb.group({
      prueba: '',
    });
    this.fg.check = this.fb.group({
      checkPrueba: '',
    });
    this.fg.inputPass = this.fb.group({
      inputPass: '',
    });
    this.fg.inputSelect = this.fb.group({
      inputSelect: '',
    });
    this.fg.inputSelectM = this.fb.group({
      inputSelectM: [],
    });

    this.fg.inputDate = this.fb.group({
      inputDate: '',
    });
  }

  modeloCambia() {
    console.log(this.fg);
  }

  getSelected(item: any) {
    console.log('Hola mundo');

    console.log(item);
  }

  openModal() {
    if (this.statusModal) {
      this.statusModal = false;
    } else {
      this.statusModal = true;
    }
  }

  pageChange(page: any) {
    this.exampleChange();
    console.log(page, 'Pagina');
  }
  pruebaCheck(event: any) {
    this.checkValid = event;
  }
  prubaMultiSelect(event: any) {
    console.log(event);
  }

  pruebaSelectedTable(event: any) {
    console.log(event);
  }

  //navbar routes links
  routes = [
    { text: 'Alertas', href: '#alert' },
    { text: 'Botones', href: '#boton' },
    { text: 'Cards', href: '#card' },
    { text: 'Inputs', href: '#inputs' },
    { text: 'Loader', href: '#loader' },
    { text: 'Stage Banner', href: '#stageBanner' },
    { text: 'Tabs', href: '#tabs' },
    { text: 'Tile', href: '#tile' },
    { text: 'Tooltips', href: '#tooltip' },
    { text: 'Modal', href: '#modal' },
  ];

  socialLinks = {
    facebook: 'https://facebook.com',
    twitter: 'https://twitter.com',
    linkedin: 'https://linkedin.com',
    instagram: 'https://instagram.com',
  };

  mostrarAlertaInfo() {
    console.log('Hola mundo');

    this.alerts.info('¡Bienvenido a la app Zurich!', {
      title: 'Información',
      widthPercent: 100,
      autoCloseAfter: 5000,
      onShowAnimation: 'zoom-in',
      onCloseAnimation: 'slide-out',
      dismissible: true,
    });
  }

  mostrarAlertaPositive() {
    this.alerts.positive('Acción realizada con éxito.', {
      title: 'Éxito',
      widthPercent: 75,
      autoCloseAfter: 4000,
      onShowAnimation: 'zoom-in',
      onCloseAnimation: 'slide-out',
      dismissible: true,
    });
  }

  mostrarAlertaAlert() {
    this.alerts.alert('¡Atención! Verifica los datos ingresados.', {
      title: 'Advertencia',
      widthPercent: 50,
      autoCloseAfter: 5000,
      onShowAnimation: 'fade-in',
      onCloseAnimation: 'fade-out',
      dismissible: true,
    });
  }

  mostrarAlertaNegative() {
    this.alerts.negative('Ocurrió un error inesperado.', {
      title: 'Error',
      widthPercent: 100,
      autoCloseAfter: 5000,
      onShowAnimation: 'zoom-in',
      onCloseAnimation: 'shrink-out',
      dismissible: true,
    });
  }

  exampleChange() {
    const secondPage = [
      {
        groupLabel: 'A Prueba Group',
        head1: 'Hola 3',
        head2: 'Mundo',
        head3: 'Prueba',
        head4: 'Prueba',
        head5: 'Prueba',
        head6: 'Prueba',
        sub: [
          {
            item: 'prueba',
          },
        ],
      },
      {
        groupLabel: 'Prueba Group',
        head1: 'Hola4',
        head2: 'Mundo',
        head3: 'Prueba',
        head4: 'Prueba',
        head5: 'Prueba',
        head6: 'Prueba',
        sub: [
          {
            item: 'prueba',
          },
        ],
      },
      {
        groupLabel: 'A Prueba Group',
        head1: 'Hola Esta es la prueba',
        head2: 'Mundo5',
        head3: 'Prueba',
        head4: 'Prueba',
        head5: 'Prueba',
        head6: 'Prueba',
        sub: [
          {
            item: 'prueba',
          },
        ],
      },
      {
        groupLabel: 'Prueba Group',
        head1: 'Hola6',
        head2: 'Mundo',
        head3: 'Prueba',
        head4: 'Prueba',
        head5: 'Prueba',
        head6: 'Prueba',
        sub: [
          {
            item: 'prueba',
          },
        ],
      },
    ];

    console.log(secondPage);

    this.data = secondPage;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
