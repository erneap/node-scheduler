import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditorWorkcenterShifts } from './site-editor-workcenter-shifts';

describe('SiteEditorWorkcenterShifts', () => {
  let component: SiteEditorWorkcenterShifts;
  let fixture: ComponentFixture<SiteEditorWorkcenterShifts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditorWorkcenterShifts],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditorWorkcenterShifts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
