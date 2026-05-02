import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationMenuGroupItem } from './navigation-menu-group-item';

describe('NavigationMenuGroupItem', () => {
  let component: NavigationMenuGroupItem;
  let fixture: ComponentFixture<NavigationMenuGroupItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationMenuGroupItem],
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationMenuGroupItem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
