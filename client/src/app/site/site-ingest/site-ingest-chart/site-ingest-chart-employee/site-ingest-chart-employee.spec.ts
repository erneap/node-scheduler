import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteIngestChartEmployee } from './site-ingest-chart-employee';

describe('SiteIngestChartEmployee', () => {
  let component: SiteIngestChartEmployee;
  let fixture: ComponentFixture<SiteIngestChartEmployee>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteIngestChartEmployee],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteIngestChartEmployee);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
