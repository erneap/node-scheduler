import { Component, computed } from '@angular/core';
import { TeamService } from '../../../../services/team-service';
import { TeamEditorSiteEditEditor } from './team-editor-site-edit-editor/team-editor-site-edit-editor';

@Component({
  selector: 'app-team-editor-site-edit',
  imports: [
    TeamEditorSiteEditEditor
  ],
  templateUrl: './team-editor-site-edit.html',
  styleUrl: './team-editor-site-edit.scss',
})
export class TeamEditorSiteEdit {
  site = computed(() => this.teamService.selectedSite());

  constructor(
    private teamService: TeamService
  ) {}
}
