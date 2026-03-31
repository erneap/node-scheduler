import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteMidsListing } from './site-mids-listing';

describe('SiteMidsListing', () => {
  let component: SiteMidsListing;
  let fixture: ComponentFixture<SiteMidsListing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteMidsListing],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteMidsListing);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
