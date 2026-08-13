import { Component, Input } from '@angular/core';
import { ZaStageBanner } from '@zurich/angular-components';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-stage-banner-z',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stage-banner-z.html',
  styleUrl: './stage-banner-z.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StageBannerZ {
  /* These lines of code are defining input properties for the `StageBannerZ` component in Angular. */
  /* The `@Input() category: string = 'Category Header';` line of code is defining an input property
  named `category` for the `StageBannerZ` component in Angular. This input property allows external
  components to pass a value to the `category` property when using the `StageBannerZ` component in
  their templates. */
  @Input() category: string = 'Category Header';
  /* The `@Input() customStr: string = 'bg: #73DCE6; color: #000;'` line of code is defining an input
  property named `customStr` for the `StageBannerZ` component in Angular. This input property allows
  external components to pass a value to the `customStr` property when using the `StageBannerZ`
  component in their templates. */
  @Input() customStr: string = '';
  @Input() addImage: boolean = false;
  @Input() imageSrc: string = '';
  @Input() content: string = 'CONTENT';
  /* The `@Input() config: string = '';` line of code is defining an input property named `config` for
  the `StageBannerZ` component in Angular. This input property allows external components to pass a
  value to the `config` property when using the `StageBannerZ` component in their templates. */
  @Input() config: string = '';
  /* The `@Input() shape: string = '1';` line of code is defining an input property named `shape` for
  the `StageBannerZ` component in Angular. This input property allows external components to pass a
  value to the `shape` property when using the `StageBannerZ` component in their templates. */
  @Input() shape: string = '';
  @Input() roundedBanner: boolean = false;
}
