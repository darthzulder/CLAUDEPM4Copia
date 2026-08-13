export class AlertZData {
    id?: string;
    message?: string;
    config: 'info' | 'positive' | 'negative' | 'alert' = 'info';
    title?: string;
    dismissible?: boolean = false;
    onShowAnimation?: string = 'fade-in';
    onCloseAnimation?: string = 'fade-out';
    autoCloseAfter?: number = 5000;
    widthPercent?: 25 | 50 | 75 | 100 = 100;
  
    constructor(init?: Partial<AlertZData>) {
      Object.assign(this, init);
      if (!this.id) {
        this.id = Math.random().toString(36).substr(2, 9);
      }
    }
  }
  