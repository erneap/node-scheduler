import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditorWorkcenterShiftsEditor } from './site-editor-workcenter-shifts-editor';

describe('SiteEditorWorkcenterShiftsEditor', () => {
  let component: SiteEditorWorkcenterShiftsEditor;
  let fixture: ComponentFixture<SiteEditorWorkcenterShiftsEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditorWorkcenterShiftsEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditorWorkcenterShiftsEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
