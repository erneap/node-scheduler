import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditorCofsEditorSection } from './site-editor-cofs-editor-section';

describe('SiteEditorCofsEditorSection', () => {
  let component: SiteEditorCofsEditorSection;
  let fixture: ComponentFixture<SiteEditorCofsEditorSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditorCofsEditorSection],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditorCofsEditorSection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
