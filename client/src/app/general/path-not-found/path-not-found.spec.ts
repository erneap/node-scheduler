import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PathNotFound } from './path-not-found';

describe('PathNotFound', () => {
  let component: PathNotFound;
  let fixture: ComponentFixture<PathNotFound>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PathNotFound],
    }).compileComponents();

    fixture = TestBed.createComponent(PathNotFound);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
