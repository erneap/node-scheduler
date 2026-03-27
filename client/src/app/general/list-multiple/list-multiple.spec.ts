import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListMultiple } from './list-multiple';

describe('ListMultiple', () => {
  let component: ListMultiple;
  let fixture: ComponentFixture<ListMultiple>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListMultiple],
    }).compileComponents();

    fixture = TestBed.createComponent(ListMultiple);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
