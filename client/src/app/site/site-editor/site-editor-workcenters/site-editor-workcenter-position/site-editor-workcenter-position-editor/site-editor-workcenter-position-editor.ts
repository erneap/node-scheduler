import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, Input, signal } from '@angular/core';
import { ISite, Site } from 'scheduler-models/scheduler/sites';
import { Team } from 'scheduler-models/scheduler/teams';
import { ConfirmationDialog } from '../../../../../general/confirmation-dialog/confirmation-dialog';
import { Employee } from 'scheduler-models/scheduler/employees';
import { Item } from '../../../../../general/list/list.model';
import { form, FormField, required } from '@angular/forms/signals';
import { AuthService } from '../../../../../services/auth-service';
import { SiteService } from '../../../../../services/site-service';
import { TeamService } from '../../../../../services/team-service';
import { MatDialog } from '@angular/material/dialog';
import { List } from '../../../../../general/list/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface WkctrPositionData {
  id: string;
  name: string;
  assigned: string[];
}

@Component({
  selector: 'app-site-editor-workcenter-position-editor',
  imports: [
    List,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './site-editor-workcenter-position-editor.html',
  styleUrl: './site-editor-workcenter-position-editor.scss',
})
export class SiteEditorWorkcenterPositionEditor {
  private _workcenter: string = ''
  @Input()
  get workcenter(): string {
    return this._workcenter;
  }
  set workcenter(id: string) {
    this._workcenter = id;
    this.setPositions();
  }
  employeesList = signal<Employee[]>([]);
  list = signal<Item[]>([]);
  positionPos = signal<number>(-1);
  positionsLength = signal<number>(0);
  selectedPosition = signal<string>('new');
  site = computed(() => this.teamService.selectedSite());
  team = signal<string>('');

  positionModel = signal<WkctrPositionData>({
    id: '',
    name: '',
    assigned: []
  });
  positionForm = form(this.positionModel, schema => {
    required(schema.id);
    required(schema.name);
  });


  constructor(
    private authService: AuthService,
    private siteService: SiteService,
    private teamService: TeamService,
    private dialog: MatDialog
  ) {
    const eList: Employee[] = [];
    const now = new Date();
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      this.team.set(team.id);
      team.sites.forEach(site => {
        if (site.id.toLowerCase() === this.site().toLowerCase()) {
          if (site.employees) {
            site.employees.forEach(emp => {
              if (emp.isActive(now)) {
                eList.push(new Employee(emp))
              }
            });
          }
        }
      });
    }
    this.employeesList.set(eList);
    this.setPositions();
  }

  setPositions() {
    this.positionPos.set(-1);
    const list: Item[] = [];
    list.push({
      id: 'new',
      value: 'Add New Position'
    });
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      team.sites.forEach(site => {
        if (site.id.toLowerCase() === this.site().toLowerCase()) {
          site.workcenters.forEach(wc => {
            if (wc.id.toLowerCase() === this.workcenter.toLowerCase()) {
              if (wc.positions && wc.positions.length > 0) {
                wc.positions.sort((a,b) => a.compareTo(b));
                this.positionsLength.set(wc.positions.length);
                wc.positions.forEach((pos, p) => {
                  if (pos.id.toLowerCase() === this.selectedPosition().toLowerCase()) {
                    this.positionPos.set(-1);
                    this.selectPosition(pos.id)
                  }
                  list.push({
                    id: pos.id,
                    value: pos.name
                  });
                });
              }
            }
          });
        }
      });
    }
    this.list.set(list);
  }

  selectPosition(id: string) {
    if (id.toLowerCase() === 'new') {
      this.positionPos.set(-1);
      this.selectedPosition.set('new');
      this.positionForm.id().value.set('');
      this.positionForm.name().value.set('');
      this.positionForm.assigned().value.set([]);
    } else {
      this.positionPos.set(-1);
      const iTeam = this.teamService.getTeam();
      if (iTeam) {
        const team = new Team(iTeam);
        team.sites.forEach(site => {
          if (site.id.toLowerCase() === this.site().toLowerCase()) {
            site.workcenters.forEach(wc => {
              if (wc.id.toLowerCase() === this.workcenter.toLowerCase()) {
                wc.positions.forEach((pos, s) => {
                  if (pos.id.toLowerCase() === id.toLowerCase()) {
                    this.positionPos.set(s);
                    this.selectedPosition.set(pos.id);
                    this.positionForm.id().value.set(pos.id);
                    this.positionForm.name().value.set(pos.name);
                    this.positionForm.assigned().value.set(pos.assigned);
                  }
                });
              }
            });
          }
        })
      }
    }
  }

  onAdd() {
    const id = this.positionForm.id().value();
    const name = this.positionForm.name().value();
    if (id !== '' && name !== '') {
      this.siteService.updateWorkcenter(this.team(), this.site(), 
          this.workcenter, 'addposition', `${id}|${name}`).subscribe({
        next: (res) => {
          const iSite = res.body as ISite;
          if (iSite) {
            const site = new Site(iSite);
            this.siteService.selectedSite.set(site);
            this.selectedPosition.set(id);
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
            this.setPositions();
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
    if (this.selectedPosition() !== 'new' ) {
      let value = '';
      switch (field.toLowerCase()) {
        case "name":
          value = this.positionForm.name().value();
          break;
        case "assigned":
          this.positionForm.assigned().value().forEach(asgn => {
            if (value !== '') {
              value += '|';
            }
            value += asgn;
          })
          break;
        case "up":
        case "down":
          value = field;
          field = 'move';
          break;
      }
      this.siteService.updateWorkcenter(this.team(), this.site(), 
        this.workcenter, field, 
        value, 'position', this.selectedPosition()).subscribe({
        next: (res) => {
          const iSite = res.body as ISite;
          if (iSite) {
            const site = new Site(iSite);
            this.siteService.selectedSite.set(site);
            this.selectPosition(this.selectedPosition());
            this.setPositions();
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
        title: 'Workcenter Position Delete Confirmation',
        message: 'Are you sure you want to delete this position?',
        negativeButtonTitle: 'No',
        affirmativeButtonTitle: 'Yes'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.toLowerCase() === 'yes') {
        this.siteService.updateWorkcenter(this.team(), this.site(), 
          this.workcenter, 'remove', 'remove', 'position', 
          this.selectedPosition()).subscribe({
          next: (res) => {
            const iSite = res.body as ISite;
            if (iSite) {
              const site = new Site(iSite);
              this.siteService.selectedSite.set(site);
              this.selectPosition('new');
              this.setPositions();
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
