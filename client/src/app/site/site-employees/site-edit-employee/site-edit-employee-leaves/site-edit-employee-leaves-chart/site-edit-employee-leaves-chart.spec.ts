import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployeeLeavesChart } from './site-edit-employee-leaves-chart';

describe('SiteEditEmployeeLeavesChart', () => {
  let component: SiteEditEmployeeLeavesChart;
  let fixture: ComponentFixture<SiteEditEmployeeLeavesChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployeeLeavesChart],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployeeLeavesChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
