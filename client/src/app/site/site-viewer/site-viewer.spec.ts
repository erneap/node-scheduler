import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteViewer } from './site-viewer';

describe('SiteViewer', () => {
  let component: SiteViewer;
  let fixture: ComponentFixture<SiteViewer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteViewer],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteViewer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
