import { Component, signal } from '@angular/core';
import { List } from '../../../../general/list/list';
import { Item } from '../../../../general/list/list.model';
import { SiteService } from '../../../../services/site-service';
import { Router, RouterOutlet, RouterLinkWithHref } from '@angular/router';
import { form, FormField, required } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TeamService } from '../../../../services/team-service';
import { AuthService } from '../../../../services/auth-service';
import { HttpErrorResponse } from '@angular/common/http';
import { Team } from 'scheduler-models/scheduler/teams';
import { ISite, Site } from 'scheduler-models/scheduler/sites';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from '../../../../general/confirmation-dialog/confirmation-dialog';

interface SiteWorkcenterData {
  id: string;
  name: string;
}

@Component({
  selector: 'app-site-editor-workcenter',
  imports: [
    List,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltip,
    MatToolbarModule,
    RouterOutlet,
    RouterLinkWithHref
],
  templateUrl: './site-editor-workcenter.html',
  styleUrl: './site-editor-workcenter.scss',
})
export class SiteEditorWorkcenter {
  siteWorkcenterModel = signal<SiteWorkcenterData>({
    id: '',
    name: '',
  });
  wkctrForm = form(this.siteWorkcenterModel, schema => {
    required(schema.id);
    required(schema.name);
  });
  workcenterPos = signal<number>(-1)
  workcentersLength = signal<number>(0);
  site = signal<string>('');
  team = signal<string>('');

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
  }

  setWorkcenters() {
    const wcList: Item[] = [];
    wcList.push({
      id: 'new',
      value: 'Add New Workcenter',
    });
    this.site.set(this.siteService.selectedSite().id);
    this.siteService.selectedSite().workcenters.sort((a,b) => a.compareTo(b));
    this.siteService.selectedSite().workcenters.forEach(wc => {
      wcList.push({
        id: wc.id,
        value: wc.name.toUpperCase()
      });
    });
    this.siteService.siteWorkcenterList.set(wcList);
  }

  selectWorkcenter(id: string) {
    this.siteService.selectedWorkcenter.set(id);
    if (id !== 'new') {
      this.workcentersLength.set(this.siteService.selectedSite().workcenters.length);
      this.siteService.selectedSite().workcenters.forEach((wc, w) => {
        if (wc.id === id) {
          this.wkctrForm.id().value.set(wc.id);
          this.wkctrForm.name().value.set(wc.name);
          this.workcenterPos.set(w);
          if (wc.positions && wc.positions.length > 0) {
            this.router.navigate(['/site/edit/edit/workcenter/positions'])
          } else {
            this.router.navigate(['/site/edit/edit/workcenter/shifts'])
          }
        }
      });
    } else {
      this.wkctrForm.id().value.set('');
      this.wkctrForm.name().value.set('');
      this.workcenterPos.set(-1);
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
            this.siteService.selectedWorkcenter.set(wkctrid);
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
    if (this.siteService.selectedWorkcenter() !== 'new' ) {
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
        this.siteService.selectedWorkcenter(), field, value).subscribe({
        next: (res) => {
          const iSite = res.body as ISite;
          if (iSite) {
            const site = new Site(iSite);
            this.siteService.selectedSite.set(site);
            this.selectWorkcenter(this.siteService.selectedWorkcenter());
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
          this.siteService.selectedWorkcenter()).subscribe({
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
  }
}
