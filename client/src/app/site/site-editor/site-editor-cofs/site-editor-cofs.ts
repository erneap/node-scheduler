import { Component, computed } from '@angular/core';
import { TeamService } from '../../../services/team-service';
import { SiteEditorCofsEditor } from './site-editor-cofs-editor/site-editor-cofs-editor';

@Component({
  selector: 'app-site-editor-cofs',
  imports: [
    SiteEditorCofsEditor
  ],
  templateUrl: './site-editor-cofs.html',
  styleUrl: './site-editor-cofs.scss',
})
export class SiteEditorCofs {
  site = computed(() => this.teamService.selectedSite());

  constructor(
    private teamService: TeamService
  ) {}
}
