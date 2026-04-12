import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditorWorkcenters } from './site-editor-workcenters';

describe('SiteEditorWorkcenters', () => {
  let component: SiteEditorWorkcenters;
  let fixture: ComponentFixture<SiteEditorWorkcenters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditorWorkcenters],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditorWorkcenters);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
