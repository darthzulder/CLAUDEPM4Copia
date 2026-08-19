import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvatarZ } from './avatar-z';

describe('AvatarZ', () => {
  let component: AvatarZ;
  let fixture: ComponentFixture<AvatarZ>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarZ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvatarZ);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
