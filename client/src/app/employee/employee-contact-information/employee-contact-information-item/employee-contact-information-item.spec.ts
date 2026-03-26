import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeContactInformationItem } from './employee-contact-information-item';

describe('EmployeeContactInformationItem', () => {
  let component: EmployeeContactInformationItem;
  let fixture: ComponentFixture<EmployeeContactInformationItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeContactInformationItem],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeContactInformationItem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
