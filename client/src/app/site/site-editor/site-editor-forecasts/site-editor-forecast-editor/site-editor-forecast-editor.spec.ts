import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditorForecastEditor } from './site-editor-forecast-editor';

describe('SiteEditorForecastEditor', () => {
  let component: SiteEditorForecastEditor;
  let fixture: ComponentFixture<SiteEditorForecastEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditorForecastEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditorForecastEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
