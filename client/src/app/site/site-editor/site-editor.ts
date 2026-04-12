import { Component, signal } from '@angular/core';
import { Site } from 'scheduler-models/scheduler/sites';
import { AuthService } from '../../services/auth-service';
import { SiteService } from '../../services/site-service';
import { TeamService } from '../../services/team-service';
import { Team } from 'scheduler-models/scheduler/teams';
import { form, FormField, required } from '@angular/forms/signals';
import { Router, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

interface SiteData {
  id: string;
  name: string;
  offset: number
}

@Component({
  selector: 'app-site-editor',
  imports: [
    RouterOutlet,
    MatToolbarModule,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
],
  templateUrl: './site-editor.html',
  styleUrl: './site-editor.scss',
})
export class SiteEditor {
  site = signal<Site>(new Site());
  team = signal<string>('');
  siteModel = signal<SiteData>({
    id: '',
    name: '',
    offset: 0,
  });
  siteForm = form(this.siteModel, schema => {
    required(schema.id);
    required(schema.name);
    required(schema.offset);
  });
  choosen = signal<string>('');

  constructor(
    private authService: AuthService,
    private siteService: SiteService,
    public teamService: TeamService,
    private router: Router
  ) {
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      this.team.set(team.id);
    }
    if (this.teamService.selectedSite() === '') {
      const iSite = this.siteService.getSite();
      if (iSite) {
        const site = new Site(iSite);
        this.teamService.selectedSite.set(site.id);
      }
    }
    this.setSite();
  }

  setSite() {
    this.site.set(new Site());
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      team.sites.forEach(iSite => {
        const site = new Site(iSite);
        if (site.id.toLowerCase() === this.teamService.selectedSite().toLowerCase()) {
          this.site.set(new Site(site));
        }
      })
    }
    this.siteForm.id().value.set(this.site().id);
    this.siteForm.name().value.set(this.site().name);
    this.siteForm.offset().value.set(this.site().utcOffset);
  }

  style(): string {
    const height = window.innerHeight - 100;
    return `height: ${height}px;`;
  }

  choose(view: string) {
    let url = '';
    switch (view.toLowerCase()) {
      case "workcenters":
        url = '/site/editor/workcenters';
        break;
      case "forecasts":
        url = '/site/editor/forecasts';
        break;
      case "cofs":
        url = '/site/editor/cofs';
        break;
    }
    this.choosen.set(url);
    this.router.navigate([url]);
  }
}
