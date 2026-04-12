import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditorCofs } from './site-editor-cofs';

describe('SiteEditorCofs', () => {
  let component: SiteEditorCofs;
  let fixture: ComponentFixture<SiteEditorCofs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditorCofs],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditorCofs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
