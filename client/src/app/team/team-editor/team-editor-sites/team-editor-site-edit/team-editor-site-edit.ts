import { Component, computed } from '@angular/core';
import { TeamService } from '../../../../services/team-service';
import { SiteEditor } from '../../../../site/site-editor/site-editor';

@Component({
  selector: 'app-team-editor-site-edit',
  imports: [
    SiteEditor
  ],
  templateUrl: './team-editor-site-edit.html',
  styleUrl: './team-editor-site-edit.scss',
})
export class TeamEditorSiteEdit {
  site = computed(() => this.teamService.selectedSite());

  constructor(
    public teamService: TeamService
  ) {}
}
