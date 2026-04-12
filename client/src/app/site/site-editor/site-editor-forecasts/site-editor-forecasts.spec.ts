import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditorForecasts } from './site-editor-forecasts';

describe('SiteEditorForecasts', () => {
  let component: SiteEditorForecasts;
  let fixture: ComponentFixture<SiteEditorForecasts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditorForecasts],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditorForecasts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
