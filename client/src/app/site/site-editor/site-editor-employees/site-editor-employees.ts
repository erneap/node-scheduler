import { Component, computed } from '@angular/core';
import { TeamService } from '../../../services/team-service';
import { SiteEmployees } from '../../site-employees/site-employees';

@Component({
  selector: 'app-site-editor-employees',
  imports: [
    SiteEmployees
  ],
  templateUrl: './site-editor-employees.html',
  styleUrl: './site-editor-employees.scss',
})
export class SiteEditorEmployees {
  site = computed(() => this.teamService.selectedSite());
  constructor(
    private teamService: TeamService
  ) {}
}
