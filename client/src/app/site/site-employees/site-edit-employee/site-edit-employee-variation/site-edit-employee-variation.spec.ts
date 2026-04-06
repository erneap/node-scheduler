import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployeeVariation } from './site-edit-employee-variation';

describe('SiteEditEmployeeVariation', () => {
  let component: SiteEditEmployeeVariation;
  let fixture: ComponentFixture<SiteEditEmployeeVariation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployeeVariation],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployeeVariation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
