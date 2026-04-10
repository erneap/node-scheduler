import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditor } from './site-editor';

describe('SiteEditor', () => {
  let component: SiteEditor;
  let fixture: ComponentFixture<SiteEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
