import { Component, computed, signal } from '@angular/core';
import { SiteService } from '../../../../../services/site-service';
import { SiteEditorWorkcenterPositionsEditor } from './site-editor-workcenter-positions-editor/site-editor-workcenter-positions-editor';

@Component({
  selector: 'app-site-editor-workcenter-positions',
  imports: [
    SiteEditorWorkcenterPositionsEditor
  ],
  templateUrl: './site-editor-workcenter-positions.html',
  styleUrl: './site-editor-workcenter-positions.scss',
})
export class SiteEditorWorkcenterPositions {
  workcenter = computed(() => this.siteService.selectedWorkcenter());

  constructor(
    private siteService: SiteService
  ) { }
}
