import { TemplateRef } from '@angular/core';
import { ZTemplate } from './z-template';

describe('ZTemplate', () => {
  it('should create an instance', () => {
    const directive = new ZTemplate(new TemplateRef(), 'hola');
    expect(directive).toBeTruthy();
  });
});
