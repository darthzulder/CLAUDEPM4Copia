import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  TemplateRef,
  inject,
} from '@angular/core';
import { ZaStage } from '@zurich/angular-components';

@Component({
  selector: 'lib-stage-z',
  standalone: true,
  imports: [CommonModule, ZaStage],
  templateUrl: './stage-z.html',
  styleUrls: ['./stage-z.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'lib-stage-z' },
})
export class StageZ implements OnDestroy {
  @Input({ alias: 'custom-str' }) customStr: string = '';
  @Input({ alias: 'image-src' }) imageSrc: string = '';
  @Input() header: string = '';
  @Input() contentContext: Record<string, any> = {};

  contentTpl?: TemplateRef<any>;
  // private readonly cdr = inject(ChangeDetectorRef);
  private templatesSub?: { unsubscribe(): void };

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this.templatesSub?.unsubscribe?.();
  }
}
