import { Component, Input, signal } from '@angular/core';
import { Item } from '../../../../../../general/list/list.model';
import { form, FormField, required } from '@angular/forms/signals';
import { SiteService } from '../../../../../../services/site-service';
import { Employee } from 'scheduler-models/scheduler/employees';
import { List } from '../../../../../../general/list/list';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { TeamService } from '../../../../../../services/team-service';
import { Team } from 'scheduler-models/scheduler/teams';
import { AuthService } from '../../../../../../services/auth-service';
import { HttpErrorResponse } from '@angular/common/http';
import { ISite, Site } from 'scheduler-models/scheduler/sites';
import { ConfirmationDialog } from '../../../../../../general/confirmation-dialog/confirmation-dialog';

interface WkctrPositionData {
  id: string;
  name: string;
  assigned: string[];
}

@Component({
  selector: 'app-site-editor-workcenter-positions-editor',
  imports: [
    List,
    FormField,
    MatFormField,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './site-editor-workcenter-positions-editor.html',
  styleUrl: './site-editor-workcenter-positions-editor.scss',
})
export class SiteEditorWorkcenterPositionsEditor {
  private _workcenter: string = '';
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
  site = signal<string>('');
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
    public siteService: SiteService,
    private teamService: TeamService,
    private dialog: MatDialog
  ) {
    const eList: Employee[] = [];
    const now = new Date();
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      this.team.set(team.id);
    }
    this.site.set(this.siteService.selectedSite().id);
    if (this.siteService.selectedSite().employees) {
      this.siteService.selectedSite().employees?.forEach(iEmp => {
        const emp = new Employee(iEmp);
        if (emp.isActive(now)) {
          eList.push(emp);
        }
      })
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
    this.siteService.selectedSite().workcenters.forEach(wc => {
      if (wc.id.toLowerCase() === this.workcenter.toLowerCase()) {
        if (wc.positions && wc.positions.length > 0) {
          wc.positions.sort((a,b) => a.compareTo(b));
          this.positionsLength.set(wc.positions.length);
          wc.positions.forEach((pos, p) => {
            if (pos.id.toLowerCase() === this.siteService.selectedWkctrPosition().toLowerCase()) {
              this.positionPos.set(-1);
              this.selectPosition(pos.id);
            }
            list.push({
              id: pos.id,
              value: pos.name
            });
          });
        }
      }
    });
    this.list.set(list);
  }

  selectPosition(id: string) {
    if (id.toLowerCase() === 'new') {
      this.positionPos.set(-1);
      this.siteService.selectedWkctrPosition.set('new');
      this.positionForm.id().value.set('');
      this.positionForm.name().value.set('');
      this.positionForm.assigned().value.set([]);
    } else {
      this.positionPos.set(-1);
      this.siteService.selectedWkctrPosition.set(id);
      this.siteService.selectedSite().workcenters.forEach(wc => {
        if (this.positionPos() < 0) {
          if (wc.id.toLowerCase() === this.workcenter.toLowerCase()) {
            wc.positions.forEach((pos, p) => {
              if (pos.id.toLowerCase() === id.toLowerCase()) {
                this.positionPos.set(p);
                this.positionForm.id().value.set(pos.id);
                this.positionForm.name().value.set(pos.name);
                this.positionForm.assigned().value.set(pos.assigned);
              }
            });
          }
        }
      });
    }
  }

  onAdd() {
    const id = this.positionForm.id().value();
    const name = this.positionForm.name().value();
    if (id !== '' && name !== '') {
      this.siteService.updateWorkcenter(this.team(), this.site(), this.workcenter, 
        'addposition', `${id}|${name}`).subscribe({
        next: (res) => {
          const iSite = res.body as ISite;
          if (iSite) {
            const site = new Site(iSite);
            this.siteService.selectedSite.set(site);
            this.siteService.selectedWkctrPosition.set(id);
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
      })
    }
  }

  onUpdate(field: string) {
    if (this.siteService.selectedWkctrPosition() !== 'new' ) {
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
      this.siteService.updateWorkcenter(this.team(), this.site(), this.workcenter, field, 
        value, 'position', this.siteService.selectedWkctrPosition()).subscribe({
        next: (res) => {
          const iSite = res.body as ISite;
          if (iSite) {
            const site = new Site(iSite);
            this.siteService.selectedSite.set(site);
            this.selectPosition(this.siteService.selectedWkctrPosition());
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
        this.siteService.updateWorkcenter(this.team(), this.site(), this.workcenter, 
          'remove', 'remove', 'position', this.siteService.selectedWkctrPosition())
          .subscribe({
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
  }
}
