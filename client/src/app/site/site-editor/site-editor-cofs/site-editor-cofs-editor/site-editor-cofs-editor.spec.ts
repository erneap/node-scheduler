import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditorCofsEditor } from './site-editor-cofs-editor';

describe('SiteEditorCofsEditor', () => {
  let component: SiteEditorCofsEditor;
  let fixture: ComponentFixture<SiteEditorCofsEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditorCofsEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditorCofsEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
