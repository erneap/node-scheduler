import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteIngestChart } from './site-ingest-chart';

describe('SiteIngestChart', () => {
  let component: SiteIngestChart;
  let fixture: ComponentFixture<SiteIngestChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteIngestChart],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteIngestChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
