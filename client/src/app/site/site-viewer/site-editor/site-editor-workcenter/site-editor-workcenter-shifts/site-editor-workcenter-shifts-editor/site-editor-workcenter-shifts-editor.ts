import { Component, Input, signal } from '@angular/core';
import { Workcode } from 'scheduler-models/scheduler/labor';
import { Item } from '../../../../../../general/list/list.model';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { SiteService } from '../../../../../../services/site-service';
import { TeamService } from '../../../../../../services/team-service';
import { Team } from 'scheduler-models/scheduler/teams';
import { List } from '../../../../../../general/list/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Workcenter } from 'scheduler-models/scheduler/sites/workcenters';
import { HttpErrorResponse } from '@angular/common/http';
import { ISite, Site } from 'scheduler-models/scheduler/sites';
import { AuthService } from '../../../../../../services/auth-service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from '../../../../../../general/confirmation-dialog/confirmation-dialog';

interface WkctrShiftData {
  id: string;
  name: string;
  associated: string[];
  paycode: number;
  minimums: number;
}

@Component({
  selector: 'app-site-editor-workcenter-shifts-editor',
  imports: [
    List,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule
  ],
  templateUrl: './site-editor-workcenter-shifts-editor.html',
  styleUrl: './site-editor-workcenter-shifts-editor.scss',
})
export class SiteEditorWorkcenterShiftsEditor {
  private _workcenter: string = '';
  @Input()
  get workcenter(): string {
    return this._workcenter;
  }
  set workcenter(id: string) {
    this._workcenter = id;
    this.setShifts()
  }
  workcodes = signal<Workcode[]>([]);
  list = signal<Item[]>([]);
  shiftPos = signal<number>(-1);
  shiftsLength = signal<number>(0);
  team = signal<string>('');
  site = signal<string>('');

  wkctrShiftModel = signal<WkctrShiftData>({
    id: '',
    name: '',
    associated: [],
    paycode: 1,
    minimums: 0
  });
  shiftForm = form(this.wkctrShiftModel, schema => {
    required(schema.id);
    required(schema.name);
    minLength(schema.associated, 1);
  });

  constructor(
    private authService: AuthService,
    public siteService: SiteService,
    private teamService: TeamService,
    private dialog: MatDialog
  ) {
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      this.team.set(team.id);
      const wclist: Workcode[] = [];
      team.workcodes.forEach(wc => {
        if (!wc.isLeave) {
          wclist.push(new Workcode(wc));
        }
      });
      this.workcodes.set(wclist);
    }
    this.setShifts();
  }

  setShifts() {
    this.shiftPos.set(-1);
    const shifts: Item[] = [];
    shifts.push({
      id: 'new',
      value: 'Add New Shift'
    });
    let found = false;
    this.site.set(this.siteService.selectedSite().id);
    this.siteService.selectedSite().workcenters.forEach(wc => {
      if (!found && wc.id.toLowerCase() === this.workcenter.toLowerCase()) {
        found = true;
        if (wc.shifts && wc.shifts.length > 0) {
          wc.shifts.sort((a,b) => a.compareTo(b));
          this.shiftsLength.set(wc.shifts.length);
          wc.shifts.forEach((shft, s) => {
            if (shft.id.toLowerCase() === this.siteService.selectedWkctrShift().toLowerCase()) {
              this.shiftPos.set(-1);
              this.selectShift(shft.id);
            }
            shifts.push({
              id: shft.id,
              value: shft.name
            });
          });
        }
      }
    });
    this.list.set(shifts);
  }

  selectShift(id: string) {
    console.log(id);
    if (id.toLowerCase() === 'new') {
      this.siteService.selectedWkctrShift.set(id);
      this.shiftForm.id().value.set('');
      this.shiftForm.name().value.set('');
      this.shiftForm.associated().value.set([]);
      this.shiftForm.paycode().value.set(1);
      this.shiftForm.minimums().value.set(0);
    } else {
      this.shiftPos.set(-1);
      this.siteService.selectedSite().workcenters.forEach(wc => {
        if (this.shiftPos() < 0) {
          if (wc.id.toLowerCase() === this.siteService.selectedWorkcenter().toLowerCase()) {
            wc.shifts.forEach((shft, s) => {
              if (shft.id.toLowerCase() === id.toLowerCase()) {
                this.shiftPos.set(s);
                this.siteService.selectedWkctrShift.set(id);
                this.shiftForm.id().value.set(id);
                this.shiftForm.name().value.set(shft.name);
                this.shiftForm.associated().value.set(shft.associatedCodes);
                this.shiftForm.paycode().value.set(shft.payCode);
                this.shiftForm.minimums().value.set(shft.minimums);
              }
            })
          }
        }
      })
    }
  }

  onAdd() {
    const id = this.shiftForm.id().value();
    const name = this.shiftForm.name().value();
    if (id !== '' && name !== '') {
      this.siteService.updateWorkcenter(this.team(), this.site(), this.workcenter, 
        'addshift', `${id}|${name}`).subscribe({
        next: (res) => {
          const iSite = res.body as ISite;
          if (iSite) {
            const site = new Site(iSite);
            this.siteService.selectedSite.set(site);
            this.siteService.selectedWkctrShift.set(id);
            this.setShifts();
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
    if (this.siteService.selectedWkctrShift() !== 'new' ) {
      let value = '';
      switch (field.toLowerCase()) {
        case "name":
          value = this.shiftForm.name().value();
          break;
        case "associated":
          this.shiftForm.associated().value().forEach(asgn => {
            if (value !== '') {
              value += '|';
            }
            value += asgn;
          })
          break;
        case "paycode":
          value = `${this.shiftForm.paycode().value()}`;
          break;
        case "minimums":
          value = `${this.shiftForm.minimums().value()}`;
          break;
        case "up":
        case "down":
          value = field;
          field = 'move';
          break;
      }
      this.siteService.updateWorkcenter(this.team(), this.site(), this.workcenter, field, 
        value, 'shift', this.siteService.selectedWkctrShift()).subscribe({
        next: (res) => {
          const iSite = res.body as ISite;
          if (iSite) {
            const site = new Site(iSite);
            this.siteService.selectedSite.set(site);
            this.selectShift(this.siteService.selectedWkctrShift());
            this.setShifts();
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
        title: 'Workcenter Shift Delete Confirmation',
        message: 'Are you sure you want to delete this shift?',
        negativeButtonTitle: 'No',
        affirmativeButtonTitle: 'Yes'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.toLowerCase() === 'yes') {
        this.siteService.updateWorkcenter(this.team(), this.site(), this.workcenter, 
          'remove', 'remove', 'shift', this.siteService.selectedWkctrShift())
          .subscribe({
          next: (res) => {
            const iSite = res.body as ISite;
            if (iSite) {
              const site = new Site(iSite);
              this.siteService.selectedSite.set(site);
              this.selectShift('new');
              this.setShifts();
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
