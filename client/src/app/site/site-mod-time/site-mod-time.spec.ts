import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteModTime } from './site-mod-time';

describe('SiteModTime', () => {
  let component: SiteModTime;
  let fixture: ComponentFixture<SiteModTime>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteModTime],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteModTime);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
