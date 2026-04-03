import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployeeLeaves } from './site-edit-employee-leaves';

describe('SiteEditEmployeeLeaves', () => {
  let component: SiteEditEmployeeLeaves;
  let fixture: ComponentFixture<SiteEditEmployeeLeaves>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployeeLeaves],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployeeLeaves);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
