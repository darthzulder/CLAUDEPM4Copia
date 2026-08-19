import {
  Component, Input, OnChanges, SimpleChanges,
  ContentChildren, QueryList, TemplateRef, AfterContentInit, ChangeDetectorRef, AfterViewInit
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ZaTabs } from '@zurich/angular-components';

@Component({
  selector: 'lib-tabs-z',
  standalone: true,
  imports: [ZaTabs, NgTemplateOutlet],
  templateUrl: './tabs-z.html',
  styleUrl: './tabs-z.css'
})
export class TabsZ implements OnChanges, AfterContentInit, AfterViewInit {
  @Input() headers: Array<{ title: string, key: string, icon?: string, disabled?: boolean }> = [];
  @Input() data: { [key: string]: string } = {};

  @ContentChildren(TemplateRef) templates!: QueryList<TemplateRef<any>>;
  templateMap: { [key: string]: TemplateRef<any> } = {};

  tabs: Array<{ key: string, title: string, icon?: string, disabled?: boolean, content: string }> = [];
  activeKey: string = '';

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.headers && this.headers.length) {
      this.initTabs();
      if (this.tabs.length && !this.activeKey) {
        this.activeKey = this.tabs[0].key;
      }
      this.cdr.detectChanges(); 
    }
  }

  ngAfterContentInit() {
    this.templates.forEach((tpl: TemplateRef<any>) => {
      const localName = (tpl as any)._declarationTContainer?.localNames?.[0];
      if (localName) {
        this.templateMap[localName] = tpl;
      }
    });
    this.cdr.detectChanges(); 
  }

  ngAfterViewInit() {
    if (this.headers && this.headers.length) {
      this.initTabs();
      this.cdr.detectChanges();
    }
  }

  private initTabs() {
    this.tabs = this.headers.map(header => ({
      key: header.key,
      title: header.title,
      icon: header.icon,
      disabled: header.disabled,
      content: this.data[header.key] || ''
    }));
  }

  onTabChange(event: CustomEvent) {
    const index = event.detail - 1;
    const selectedTab = this.tabs[index];
    this.activeKey = selectedTab ? selectedTab.key : this.tabs[0]?.key;
    this.cdr.detectChanges(); // Fuerza render tras cambiar de tab
  }

  get activeTab(): any {
    return this.tabs.find(t => t.key === this.activeKey);
  }

  get activeTemplate(): TemplateRef<any> | null {
    return this.templateMap[this.activeKey] || null;
  }
}
