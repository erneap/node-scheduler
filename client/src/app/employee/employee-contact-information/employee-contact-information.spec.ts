import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeContactInformation } from './employee-contact-information';

describe('EmployeeContactInformation', () => {
  let component: EmployeeContactInformation;
  let fixture: ComponentFixture<EmployeeContactInformation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeContactInformation],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeContactInformation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
