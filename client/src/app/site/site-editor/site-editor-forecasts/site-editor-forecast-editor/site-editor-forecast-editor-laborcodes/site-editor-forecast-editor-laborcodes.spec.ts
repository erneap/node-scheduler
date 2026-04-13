import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditorForecastEditorLaborcodes } from './site-editor-forecast-editor-laborcodes';

describe('SiteEditorForecastEditorLaborcodes', () => {
  let component: SiteEditorForecastEditorLaborcodes;
  let fixture: ComponentFixture<SiteEditorForecastEditorLaborcodes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditorForecastEditorLaborcodes],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditorForecastEditorLaborcodes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
