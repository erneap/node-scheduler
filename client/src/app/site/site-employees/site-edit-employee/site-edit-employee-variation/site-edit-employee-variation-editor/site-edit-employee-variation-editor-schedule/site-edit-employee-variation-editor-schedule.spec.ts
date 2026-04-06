import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployeeVariationEditorSchedule } from './site-edit-employee-variation-editor-schedule';

describe('SiteEditEmployeeVariationEditorSchedule', () => {
  let component: SiteEditEmployeeVariationEditorSchedule;
  let fixture: ComponentFixture<SiteEditEmployeeVariationEditorSchedule>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployeeVariationEditorSchedule],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployeeVariationEditorSchedule);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
