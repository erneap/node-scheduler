import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEditorWorkcenter } from './site-editor-workcenter';

describe('SiteEditorWorkcenter', () => {
  let component: SiteEditorWorkcenter;
  let fixture: ComponentFixture<SiteEditorWorkcenter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteEditorWorkcenter],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteEditorWorkcenter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
