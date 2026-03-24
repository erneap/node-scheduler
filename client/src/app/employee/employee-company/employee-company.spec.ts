import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeCompany } from './employee-company';

describe('EmployeeCompany', () => {
  let component: EmployeeCompany;
  let fixture: ComponentFixture<EmployeeCompany>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeCompany],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeCompany);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
