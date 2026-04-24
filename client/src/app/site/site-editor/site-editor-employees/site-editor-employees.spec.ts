import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditorEmployees } from './site-editor-employees';

describe('SiteEditorEmployees', () => {
  let component: SiteEditorEmployees;
  let fixture: ComponentFixture<SiteEditorEmployees>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditorEmployees],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditorEmployees);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
