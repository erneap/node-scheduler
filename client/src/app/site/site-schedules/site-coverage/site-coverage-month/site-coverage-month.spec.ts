import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteCoverageMonth } from './site-coverage-month';

describe('SiteCoverageMonth', () => {
  let component: SiteCoverageMonth;
  let fixture: ComponentFixture<SiteCoverageMonth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteCoverageMonth],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteCoverageMonth);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
