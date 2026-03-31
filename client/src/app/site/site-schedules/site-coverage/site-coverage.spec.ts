import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteCoverage } from './site-coverage';

describe('SiteCoverage', () => {
  let component: SiteCoverage;
  let fixture: ComponentFixture<SiteCoverage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteCoverage],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteCoverage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
