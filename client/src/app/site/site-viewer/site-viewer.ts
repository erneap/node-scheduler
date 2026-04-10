import { Component, computed } from '@angular/core';
import { Site } from 'scheduler-models/scheduler/sites';
import { SiteService } from '../../services/site-service';
import { TeamService } from '../../services/team-service';
import { Team } from 'scheduler-models/scheduler/teams';
import { SiteEditor } from './site-editor/site-editor';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-site-viewer',
  imports: [
    RouterOutlet
  ],
  templateUrl: './site-viewer.html',
  styleUrl: './site-viewer.scss',
})
export class SiteViewer {
  site = computed(() => this.teamService.selectedSite());

  constructor(
    public siteService: SiteService,
    private teamService: TeamService,
    private router: Router
  ) {
    if (this.teamService.selectedSite() === '') {
      const iSite = this.siteService.getSite();
      if (iSite) {
        this.teamService.selectedSite.set(iSite.id);
      }
    }
    this.setSite();
    if (this.teamService.selectedSite().toLowerCase() === 'new') {
      this.router.navigate(['/site/edit/new']);
    } else {
      this.router.navigate(['/site/edit/edit']);
    }
  }

  setSite() {
    if (this.teamService.selectedSite() !== '') {
      const iTeam = this.teamService.getTeam();
      if (iTeam) {
        const siteid = this.teamService.selectedSite();
        const team = new Team(iTeam);
        let found = false;
        team.sites.forEach(site => {
          if (!found && site.id.toLowerCase() === siteid.toLowerCase()) {
            found = true;
            this.siteService.selectedSite.set(new Site(site));
          }
        });
      }
    }
  }
}
