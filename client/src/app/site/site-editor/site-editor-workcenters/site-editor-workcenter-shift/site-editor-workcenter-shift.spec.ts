import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditorWorkcenterShift } from './site-editor-workcenter-shift';

describe('SiteEditorWorkcenterShift', () => {
  let component: SiteEditorWorkcenterShift;
  let fixture: ComponentFixture<SiteEditorWorkcenterShift>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditorWorkcenterShift],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditorWorkcenterShift);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
