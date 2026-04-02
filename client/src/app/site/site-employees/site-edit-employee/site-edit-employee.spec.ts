import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployee } from './site-edit-employee';

describe('SiteEditEmployee', () => {
  let component: SiteEditEmployee;
  let fixture: ComponentFixture<SiteEditEmployee>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployee],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployee);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
