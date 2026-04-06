import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployeeVariationEditor } from './site-edit-employee-variation-editor';

describe('SiteEditEmployeeVariationEditor', () => {
  let component: SiteEditEmployeeVariationEditor;
  let fixture: ComponentFixture<SiteEditEmployeeVariationEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployeeVariationEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployeeVariationEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
