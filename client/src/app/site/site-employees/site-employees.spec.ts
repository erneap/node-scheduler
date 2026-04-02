import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEmployees } from './site-employees';

describe('SiteEmployees', () => {
  let component: SiteEmployees;
  let fixture: ComponentFixture<SiteEmployees>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEmployees],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEmployees);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
