import { Component, computed, signal } from '@angular/core';
import { SiteService } from '../../../../../services/site-service';
import { SiteEditorWorkcenterShiftsEditor } from './site-editor-workcenter-shifts-editor/site-editor-workcenter-shifts-editor';

@Component({
  selector: 'app-site-editor-workcenter-shifts',
  imports: [
    SiteEditorWorkcenterShiftsEditor
  ],
  templateUrl: './site-editor-workcenter-shifts.html',
  styleUrl: './site-editor-workcenter-shifts.scss',
})
export class SiteEditorWorkcenterShifts {
  workcenter = computed(() => this.siteService.selectedWorkcenter());

  constructor(
    private siteService: SiteService
  ) {}
}
