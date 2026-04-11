import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditorWorkcenterPositionsEditor } from './site-editor-workcenter-positions-editor';

describe('SiteEditorWorkcenterPositionsEditor', () => {
  let component: SiteEditorWorkcenterPositionsEditor;
  let fixture: ComponentFixture<SiteEditorWorkcenterPositionsEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditorWorkcenterPositionsEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditorWorkcenterPositionsEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
