import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditorWorkcenterPositionEditor } from './site-editor-workcenter-position-editor';

describe('SiteEditorWorkcenterPositionEditor', () => {
  let component: SiteEditorWorkcenterPositionEditor;
  let fixture: ComponentFixture<SiteEditorWorkcenterPositionEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditorWorkcenterPositionEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditorWorkcenterPositionEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
