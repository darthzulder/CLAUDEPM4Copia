import { ButtonZ } from './button-z';

describe('ButtonZ (class-only)', () => {
  it('defaults', () => {
    const c = new ButtonZ();
    expect(c.label).toBe('');
    expect(c.type).toBe('primary');
    expect(c.iconRight).toBeFalse();
    expect(c.disabled).toBeTrue();
    expect(c.wide).toBeFalse();
  });

  it('emits eventClick', (done) => {
    const c = new ButtonZ();
    const evt = new MouseEvent('click');
    c.eventClick.subscribe(e => { expect(e).toBe(evt); done(); });
    c.eventClick.emit(evt);
  });
});