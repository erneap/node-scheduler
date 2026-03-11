import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MustChange } from './must-change';

describe('MustChange', () => {
  let component: MustChange;
  let fixture: ComponentFixture<MustChange>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MustChange],
    }).compileComponents();

    fixture = TestBed.createComponent(MustChange);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
