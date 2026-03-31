import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteCoverageMonthWorkcenter } from './site-coverage-month-workcenter';

describe('SiteCoverageMonthWorkcenter', () => {
  let component: SiteCoverageMonthWorkcenter;
  let fixture: ComponentFixture<SiteCoverageMonthWorkcenter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteCoverageMonthWorkcenter],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteCoverageMonthWorkcenter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
