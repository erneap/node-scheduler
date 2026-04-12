import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditorWorkcenterShiftEditor } from './site-editor-workcenter-shift-editor';

describe('SiteEditorWorkcenterShiftEditor', () => {
  let component: SiteEditorWorkcenterShiftEditor;
  let fixture: ComponentFixture<SiteEditorWorkcenterShiftEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditorWorkcenterShiftEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditorWorkcenterShiftEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
