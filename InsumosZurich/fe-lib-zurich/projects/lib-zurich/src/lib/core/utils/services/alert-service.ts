import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AlertZData } from '../models/alertModel'

@Injectable({ providedIn: 'root' })
export class AlertZService {
  private alertsSubject = new BehaviorSubject<AlertZData[]>([]);
  alerts$ = this.alertsSubject.asObservable();

  private genId() {
    return Math.random().toString(36).substr(2, 9);
  }

  /** Métodos rápidos para mostrar alertas */
  info(message: string, opts: Partial<AlertZData> = {}) {
    this.show({ ...opts, message, config: 'info' });
  }
  positive(message: string, opts: Partial<AlertZData> = {}) {
    this.show({ ...opts, message, config: 'positive' });
  }
  negative(message: string, opts: Partial<AlertZData> = {}) {
    this.show({ ...opts, message, config: 'negative' });
  }
  alert(message: string, opts: Partial<AlertZData> = {}) {
    this.show({ ...opts, message, config: 'alert' });
  }

  /** Método genérico */
  show(alert: AlertZData) {
    alert.id = alert.id ?? this.genId();
    const current = this.alertsSubject.value;
    this.alertsSubject.next([...current, alert]);
  }

  /** Remover alerta (por id) */
  remove(id: string) {
    this.alertsSubject.next(this.alertsSubject.value.filter(a => a.id !== id));
  }

  /** Limpiar todas */
  clear() {
    this.alertsSubject.next([]);
  }
}
