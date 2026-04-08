import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteLeaveApproval } from './site-leave-approval';

describe('SiteLeaveApproval', () => {
  let component: SiteLeaveApproval;
  let fixture: ComponentFixture<SiteLeaveApproval>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteLeaveApproval],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteLeaveApproval);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
