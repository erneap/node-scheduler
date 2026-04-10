import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditorWorkcenterPositions } from './site-editor-workcenter-positions';

describe('SiteEditorWorkcenterPositions', () => {
  let component: SiteEditorWorkcenterPositions;
  let fixture: ComponentFixture<SiteEditorWorkcenterPositions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditorWorkcenterPositions],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditorWorkcenterPositions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
