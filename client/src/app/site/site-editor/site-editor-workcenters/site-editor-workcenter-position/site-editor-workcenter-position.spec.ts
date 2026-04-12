import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditorWorkcenterPosition } from './site-editor-workcenter-position';

describe('SiteEditorWorkcenterPosition', () => {
  let component: SiteEditorWorkcenterPosition;
  let fixture: ComponentFixture<SiteEditorWorkcenterPosition>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditorWorkcenterPosition],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditorWorkcenterPosition);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
