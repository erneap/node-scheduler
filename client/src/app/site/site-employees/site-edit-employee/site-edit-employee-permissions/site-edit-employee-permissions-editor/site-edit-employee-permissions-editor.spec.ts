import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditEmployeePermissionsEditor } from './site-edit-employee-permissions-editor';

describe('SiteEditEmployeePermissionsEditor', () => {
  let component: SiteEditEmployeePermissionsEditor;
  let fixture: ComponentFixture<SiteEditEmployeePermissionsEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditEmployeePermissionsEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditEmployeePermissionsEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
