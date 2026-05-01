import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPurge } from './admin-purge';

describe('AdminPurge', () => {
  let component: AdminPurge;
  let fixture: ComponentFixture<AdminPurge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPurge],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPurge);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
