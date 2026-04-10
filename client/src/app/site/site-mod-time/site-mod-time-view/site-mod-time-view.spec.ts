import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteModTimeView } from './site-mod-time-view';

describe('SiteModTimeView', () => {
  let component: SiteModTimeView;
  let fixture: ComponentFixture<SiteModTimeView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteModTimeView],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteModTimeView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
