import { Component, computed } from '@angular/core';
import { SiteService } from '../../../../services/site-service';
import { SiteEditorWorkcenterShiftEditor } from './site-editor-workcenter-shift-editor/site-editor-workcenter-shift-editor';

@Component({
  selector: 'app-site-editor-workcenter-shift',
  imports: [
    SiteEditorWorkcenterShiftEditor
  ],
  templateUrl: './site-editor-workcenter-shift.html',
  styleUrl: './site-editor-workcenter-shift.scss',
})
export class SiteEditorWorkcenterShift {
  workcenter = computed(() => this.siteService.selectedWorkcenter());

  constructor(
    private siteService: SiteService
  ) {}
}
