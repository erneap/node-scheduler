import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteIngestChartEmployeeDay } from './site-ingest-chart-employee-day';

describe('SiteIngestChartEmployeeDay', () => {
  let component: SiteIngestChartEmployeeDay;
  let fixture: ComponentFixture<SiteIngestChartEmployeeDay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteIngestChartEmployeeDay],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteIngestChartEmployeeDay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
