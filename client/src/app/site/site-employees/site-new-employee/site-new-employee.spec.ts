import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteNewEmployee } from './site-new-employee';

describe('SiteNewEmployee', () => {
  let component: SiteNewEmployee;
  let fixture: ComponentFixture<SiteNewEmployee>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteNewEmployee],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteNewEmployee);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
