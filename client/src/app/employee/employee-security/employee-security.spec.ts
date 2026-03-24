import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeSecurity } from './employee-security';

describe('EmployeeSecurity', () => {
  let component: EmployeeSecurity;
  let fixture: ComponentFixture<EmployeeSecurity>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeSecurity],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeSecurity);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
