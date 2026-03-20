import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeLeaves } from './employee-leaves';

describe('EmployeeLeaves', () => {
  let component: EmployeeLeaves;
  let fixture: ComponentFixture<EmployeeLeaves>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeLeaves],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeLeaves);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
