import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewSite } from './new-site';

describe('NewSite', () => {
  let component: NewSite;
  let fixture: ComponentFixture<NewSite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewSite],
    }).compileComponents();

    fixture = TestBed.createComponent(NewSite);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
