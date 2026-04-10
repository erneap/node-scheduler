import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteModTimeMonth } from './site-mod-time-month';

describe('SiteModTimeMonth', () => {
  let component: SiteModTimeMonth;
  let fixture: ComponentFixture<SiteModTimeMonth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteModTimeMonth],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteModTimeMonth);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
