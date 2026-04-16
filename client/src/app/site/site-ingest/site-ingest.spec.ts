import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteIngest } from './site-ingest';

describe('SiteIngest', () => {
  let component: SiteIngest;
  let fixture: ComponentFixture<SiteIngest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteIngest],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteIngest);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
