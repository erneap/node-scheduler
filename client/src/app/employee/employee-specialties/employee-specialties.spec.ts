import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeSpecialties } from './employee-specialties';

describe('EmployeeSpecialties', () => {
  let component: EmployeeSpecialties;
  let fixture: ComponentFixture<EmployeeSpecialties>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeSpecialties],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeSpecialties);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
