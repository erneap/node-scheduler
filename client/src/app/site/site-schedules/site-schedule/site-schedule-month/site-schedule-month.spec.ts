import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteScheduleMonth } from './site-schedule-month';

describe('SiteScheduleMonth', () => {
  let component: SiteScheduleMonth;
  let fixture: ComponentFixture<SiteScheduleMonth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteScheduleMonth],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteScheduleMonth);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
