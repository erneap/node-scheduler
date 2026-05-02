import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationMenuGroup } from './navigation-menu-group';

describe('NavigationMenuGroup', () => {
  let component: NavigationMenuGroup;
  let fixture: ComponentFixture<NavigationMenuGroup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationMenuGroup],
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationMenuGroup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
