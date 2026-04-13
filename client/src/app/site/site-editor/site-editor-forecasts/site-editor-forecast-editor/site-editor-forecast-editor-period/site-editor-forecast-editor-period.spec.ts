import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditorForecastEditorPeriod } from './site-editor-forecast-editor-period';

describe('SiteEditorForecastEditorPeriod', () => {
  let component: SiteEditorForecastEditorPeriod;
  let fixture: ComponentFixture<SiteEditorForecastEditorPeriod>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditorForecastEditorPeriod],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditorForecastEditorPeriod);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
