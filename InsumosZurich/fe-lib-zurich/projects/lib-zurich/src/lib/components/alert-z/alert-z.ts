import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  inject,
} from '@angular/core';
import { ZaAlert } from '@zurich/angular-components';
import { AlertZData } from '../../core/utils/models/alertModel';
import { AlertZService } from '../../core/utils/services/alert-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'lib-alert-z',
  standalone: true,
  imports: [ZaAlert, CommonModule],
  templateUrl: './alert-z.html',
  styleUrls: ['./alert-z.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertZ implements OnDestroy {
  alerts: AlertZData[] = [];

  private autoCloseTimers = new Map<string, number>();
  private closing = new Set<string>(); // ids en animación de cierre
  // private readonly cdr = inject(ChangeDetectorRef);
  private readonly sub = new Subscription();

  //duracion animaciones
  private readonly animationDurations: Record<string, number> = {
    'fade-out': 250,
    'slide-out': 300,
    'shrink-out': 280,
    __default__: 300,
  };

  constructor(
    private alertService: AlertZService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.sub.add(
      this.alertService.alerts$.subscribe((alerts) => {
        this.scheduleAutoCloseForNew(alerts);
        this.cleanupTimersForRemoved(alerts);
        this.alerts = alerts;
        this.cdr.markForCheck();
      }),
    );
  }

  ngOnDestroy(): void {
    this.autoCloseTimers.forEach((id) => window.clearTimeout(id));
    this.autoCloseTimers.clear();
    this.sub.unsubscribe();
  }

  close(id?: string): void {
    if (!id) return;
    if (this.closing.has(id)) return;

    const alert = this.alerts.find((a) => a.id === id);
    const onCloseClass = alert?.onCloseAnimation;

    if (onCloseClass) {
      this.closing.add(id);
      this.cdr.markForCheck();

      const duration = this.getAnimationDuration(onCloseClass);
      window.setTimeout(() => {
        this.alertService.remove(id);
        this.closing.delete(id);
        this.cdr.markForCheck();
      }, duration);
    } else {
      this.alertService.remove(id);
    }
  }

  /** Clases por ítem para show/close */
  getItemClasses(alert: AlertZData): { [klass: string]: boolean } {
    return {
      [alert.onShowAnimation ?? '']:
        !this.closing.has(alert.id!) && !!alert.onShowAnimation,
      [alert.onCloseAnimation ?? '']:
        this.closing.has(alert.id!) && !!alert.onCloseAnimation,
    };
  }

  // ---- Helpers privados ----
  private scheduleAutoCloseForNew(alerts: AlertZData[]) {
    for (const a of alerts) {
      if (!a.id) continue;
      if (
        a.autoCloseAfter &&
        a.autoCloseAfter > 0 &&
        !this.autoCloseTimers.has(a.id)
      ) {
        const tId = window.setTimeout(() => this.close(a.id), a.autoCloseAfter);
        this.autoCloseTimers.set(a.id, tId);
      }
    }
  }

  private cleanupTimersForRemoved(alerts: AlertZData[]) {
    const currentIds = new Set(
      alerts.map((a) => a.id).filter(Boolean) as string[],
    );
    for (const [id, tId] of this.autoCloseTimers) {
      if (!currentIds.has(id)) {
        window.clearTimeout(tId);
        this.autoCloseTimers.delete(id);
      }
    }
  }
  private getAnimationDuration(name: string): number {
    return (
      this.animationDurations[name] ?? this.animationDurations['__default__']
    );
  }
}
