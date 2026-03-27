import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteSchedule } from './site-schedule';

describe('SiteSchedule', () => {
  let component: SiteSchedule;
  let fixture: ComponentFixture<SiteSchedule>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteSchedule],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteSchedule);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
