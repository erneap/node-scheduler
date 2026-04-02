import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployeeContacts } from './site-edit-employee-contacts';

describe('SiteEditEmployeeContacts', () => {
  let component: SiteEditEmployeeContacts;
  let fixture: ComponentFixture<SiteEditEmployeeContacts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployeeContacts],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployeeContacts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
