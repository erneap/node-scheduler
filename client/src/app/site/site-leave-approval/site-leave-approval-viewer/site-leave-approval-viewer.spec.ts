import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteLeaveApprovalViewer } from './site-leave-approval-viewer';

describe('SiteLeaveApprovalViewer', () => {
  let component: SiteLeaveApprovalViewer;
  let fixture: ComponentFixture<SiteLeaveApprovalViewer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteLeaveApprovalViewer],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteLeaveApprovalViewer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
