import { Component, signal } from '@angular/core';
import { List } from '../../../general/list/list';
import { form, FormField, required } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth-service';
import { SiteService } from '../../../services/site-service';
import { TeamService } from '../../../services/team-service';
import { MatDialog } from '@angular/material/dialog';
import { Team } from 'scheduler-models/scheduler/teams';
import { Item } from '../../../general/list/list.model';
import { ISite, Site } from 'scheduler-models/scheduler/sites';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmationDialog } from '../../../general/confirmation-dialog/confirmation-dialog';

interface SiteWorkcenterData {
  id: string;
  name: string;
}

@Component({
  selector: 'app-site-editor-workcenters',
  imports: [
    List,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatToolbarModule,
    RouterOutlet
  ],
  templateUrl: './site-editor-workcenters.html',
  styleUrl: './site-editor-workcenters.scss',
})
export class SiteEditorWorkcenters {
  siteWorkcenterModel = signal<SiteWorkcenterData>({
    id: '',
    name: '',
  });
  wkctrForm = form(this.siteWorkcenterModel, schema => {
    required(schema.id);
    required(schema.name);
  });
  selectedWorkcenter = signal<string>('new');
  workcenterList = signal<Item[]>([]);
  workcenterPos = signal<number>(-1)
  workcentersLength = signal<number>(0);
  site = signal<string>('');
  team = signal<string>('');
  url = signal<string>('')

  constructor(
    private authService: AuthService,
    public siteService: SiteService,
    private teamService: TeamService,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.setWorkcenters();
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      this.team.set(team.id);
    }
    this.url.set(window.location.pathname);
  }

  setWorkcenters() {
    const wcList: Item[] = [];
    wcList.push({
      id: 'new',
      value: 'Add New Workcenter',
    });
    this.site.set(this.teamService.selectedSite());
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      team.sites.forEach(site => {
        if (site.id.toLowerCase() === this.site().toLowerCase()) {
          site.workcenters.forEach(wc => {
            wcList.push({
              id: wc.id,
              value: wc.name.toUpperCase()
            });
          });
        }
      });
    }
    this.workcenterList.set(wcList);
  }

  selectWorkcenter(id: string) {
    this.selectedWorkcenter.set(id);
    if (id !== 'new') {
      const iTeam = this.teamService.getTeam();
      if (iTeam) {
        const team = new Team(iTeam);
        team.sites.forEach(site => {
          if (site.id.toLowerCase() === this.site().toLowerCase()) {
            this.workcentersLength.set(site.workcenters.length);
            site.workcenters.forEach((wc, w) => {
              if (wc.id.toLowerCase() === id.toLowerCase()) {
                this.siteService.selectedWorkcenter.set(id);
                this.wkctrForm.id().value.set(wc.id);
                this.wkctrForm.name().value.set(wc.name);
                this.workcenterPos.set(w);
                if (wc.positions && wc.positions.length > 0) {
                  const path = `${this.url()}/positions`;
                  this.router.navigate([path])
                } else {
                  const path = `${this.url()}/shifts`;
                  this.router.navigate([path])
                }
              }
            });
          }
        });
      }
    } else {
      this.wkctrForm.id().value.set('');
      this.wkctrForm.name().value.set('');
      this.workcenterPos.set(-1);
    }
  } 

  choose(url: string) {
    if (url !== '') {
      const path = `${this.url()}/${url}`;
      this.router.navigate([path]);
    }
  }

  onAdd() {
    const id = this.wkctrForm.id().value();
    const name = this.wkctrForm.name().value();
    if (id !== '' && name !== '') {
      this.siteService.addWorkcenter(this.team(), this.site(), id, name).subscribe({
        next: (res) => {
          const iSite = res.body as ISite;
          if (iSite) {
            const site = new Site(iSite);
            this.siteService.selectedSite.set(site);
            const wkctrid = site.workcenters[site.workcenters.length - 1].id;
            this.selectedWorkcenter.set(wkctrid);
            this.setWorkcenters();
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

  onUpdate(field: string) {
    if (this.selectedWorkcenter() !== 'new' ) {
      let value = '';
      switch (field.toLowerCase()) {
        case "name":
          value = this.wkctrForm.name().value();
          break;
        case "up":
        case "down":
          value = field;
          field = 'move';
          break;
      }
      this.siteService.updateWorkcenter(this.team(), this.site(), 
        this.selectedWorkcenter(), field, value).subscribe({
        next: (res) => {
          const iSite = res.body as ISite;
          if (iSite) {
            const site = new Site(iSite);
            this.siteService.selectedSite.set(site);
            this.selectWorkcenter(this.selectedWorkcenter());
            this.setWorkcenters();
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

  onDelete() {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Workcenter Delete Confirmation',
        message: 'Are you sure you want to delete this workcenter?',
        negativeButtonTitle: 'No',
        affirmativeButtonTitle: 'Yes'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.toLowerCase() === 'yes') {
        this.siteService.deleteWorkcenter(this.team(), this.site(), 
          this.selectedWorkcenter()).subscribe({
          next: (res) => {
            const iSite = res.body as ISite;
            if (iSite) {
              const site = new Site(iSite);
              this.siteService.selectedSite.set(site);
              this.selectWorkcenter('new');
              this.setWorkcenters();
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
  }}
