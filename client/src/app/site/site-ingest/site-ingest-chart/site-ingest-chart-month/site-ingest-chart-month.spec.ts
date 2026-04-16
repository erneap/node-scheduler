import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteIngestChartMonth } from './site-ingest-chart-month';

describe('SiteIngestChartMonth', () => {
  let component: SiteIngestChartMonth;
  let fixture: ComponentFixture<SiteIngestChartMonth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteIngestChartMonth],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteIngestChartMonth);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
