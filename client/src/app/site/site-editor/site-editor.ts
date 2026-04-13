import { Component, computed, input, Input, signal } from '@angular/core';
import { ISite, Site } from 'scheduler-models/scheduler/sites';
import { AuthService } from '../../services/auth-service';
import { SiteService } from '../../services/site-service';
import { TeamService } from '../../services/team-service';
import { ITeam, Team } from 'scheduler-models/scheduler/teams';
import { form, FormField, max, min, required } from '@angular/forms/signals';
import { Router, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from '../../general/confirmation-dialog/confirmation-dialog';

interface SiteData {
  id: string;
  name: string;
  offset: number;
  mids: boolean;
}

@Component({
  selector: 'app-site-editor',
  imports: [
    RouterOutlet,
    MatToolbarModule,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltip
],
  templateUrl: './site-editor.html',
  styleUrl: './site-editor.scss',
})
export class SiteEditor {
  siteid = computed(() => this.teamService.selectedSite());
  site = signal<Site>(new Site());
  team = signal<string>('');
  siteModel = signal<SiteData>({
    id: '',
    name: '',
    offset: 0,
    mids: false,
  });
  siteForm = form(this.siteModel, schema => {
    required(schema.id);
    required(schema.name);
    required(schema.offset, { message: 'required'});
    min(schema.offset, -12, {message: 'must be greater than -12'});
    max(schema.offset, 12, {message: 'must be less than 12'});
  });
  choosen = signal<string>('');
  @Input()
  get setsite(): string {
    return this.siteid();
  }
  set setsite(id: string) {
    this.teamService.selectedSite.set(id);
    this.setSite();
  }
  showDelete = input<boolean>(false);

  constructor(
    private authService: AuthService,
    private siteService: SiteService,
    public teamService: TeamService,
    private router: Router,
    private dialog: MatDialog
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
    const height = window.innerHeight - 70;
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

  onUpdate(field: string) {
    let value = '';
    let valid = false;
    if (this.siteid().toLowerCase() !== 'new') {
      switch (field.toLowerCase()) {
        case "name":
          valid = this.siteForm.name().valid();
          value = this.siteForm.name().value();
          break;
        case "offset":
          valid = this.siteForm.offset().valid();
          value = `${this.siteForm.offset().value()}`;
          break;
        case "mids":
          valid = true;
          value = (this.siteForm.mids().value()) ? 'true' : 'false';
          break;
      }
    }
    if (valid) {
      this.siteService.updateSite(this.team(), this.siteid(), field, value).subscribe({
        next: (res) => {
          const iSite = res.body as ISite;
          if (iSite) {
            const site = this.processSite(iSite);
          }
        },
        error: (err) => {
          if (err instanceof HttpErrorResponse) {
            if (err.status >= 400 && err.status < 500) {
              this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
            }
          }
        }
      });
    }
  }

  onAdd() {
    if (this.siteForm().valid()) {
      const id = this.siteForm.id().value();
      const name = this.siteForm.name().value();
      const offset = this.siteForm.offset().value();
      const mids = this.siteForm.mids().value();
      this.siteService.addSite(this.team(), id, name, offset, mids).subscribe({
        next: (res) => {
          const iSite = res.body as ISite;
          if (iSite) {
            const site = this.processSite(iSite);
          }
        },
        error: (err) => {
          if (err instanceof HttpErrorResponse) {
            if (err.status >= 400 && err.status < 500) {
              this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
            }
          }
        }
      })
    }
  }

  onDelete() {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Site Delete Confirmation',
        message: 'Are you sure you want to delete this site?',
        negativeButtonTitle: 'No',
        affirmativeButtonTitle: 'Yes'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.toLowerCase() === 'yes') {
        this.siteService.deleteSite(this.team(), this.siteid()).subscribe({
          next: (res) => {
            const iTeam = res.body as ITeam;
            if (iTeam) {
              this.teamService.setTeam(iTeam);
            }
          },
          error: (err) => {
            if (err instanceof HttpErrorResponse) {
              if (err.status >= 400 && err.status < 500) {
                this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
              }
            }
          }
        });
      }
    });
  }

  processSite(iSite: ISite): Site {
    const site = new Site(iSite);
    this.siteService.selectedSite.set(site);
    this.teamService.selectedSite.set(site.id);
    this.site.set(site);
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      let found = false;
      const team = new Team(iTeam);
      team.sites.forEach((tsite, s) => {
        if (tsite.id.toLowerCase() === site.id.toLowerCase()) {
          found = true;
          team.sites[s] = site;
        }
      });
      if (!found) {
        team.sites.push(site);
      }
      this.teamService.setTeam(team);
    }
    return site;
  }
}
