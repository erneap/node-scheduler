import { Component, computed, Input, signal } from '@angular/core';
import { Workcode } from 'scheduler-models/scheduler/labor';
import { Item } from '../../../../../general/list/list.model';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { AuthService } from '../../../../../services/auth-service';
import { SiteService } from '../../../../../services/site-service';
import { TeamService } from '../../../../../services/team-service';
import { MatDialog } from '@angular/material/dialog';
import { Team } from 'scheduler-models/scheduler/teams';
import { ISite, Site } from 'scheduler-models/scheduler/sites';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmationDialog } from '../../../../../general/confirmation-dialog/confirmation-dialog';
import { List } from '../../../../../general/list/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

interface WkctrShiftData {
  id: string;
  name: string;
  associated: string[];
  paycode: number;
  minimums: number;
}

@Component({
  selector: 'app-site-editor-workcenter-shift-editor',
  imports: [
    List,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule
  ],
  templateUrl: './site-editor-workcenter-shift-editor.html',
  styleUrl: './site-editor-workcenter-shift-editor.scss',
})
export class SiteEditorWorkcenterShiftEditor {
  private _workcenter: string = '';
  @Input()
  get workcenter(): string {
    return this._workcenter;
  }
  set workcenter(id: string) {
    this._workcenter = id;
    this.setShifts();
  }
  workcodes = signal<Workcode[]>([]);
  list = signal<Item[]>([]);
  shiftPos = signal<number>(-1);
  shiftsLength = signal<number>(0);
  selectedShift = signal<string>('new')
  team = signal<string>('');
  site = computed(() => this.teamService.selectedSite());

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
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      team.sites.forEach(site => {
        if (site.id.toLowerCase() === this.site().toLowerCase()) {
          site.workcenters.forEach(wc => {
            if (wc.id.toLowerCase() === this.workcenter.toLowerCase()) {
              if (wc.shifts && wc.shifts.length > 0) {
                wc.shifts.sort((a,b) => a.compareTo(b));
                this.shiftsLength.set(wc.shifts.length);
                wc.shifts.forEach((shft, s) => {
                  if (shft.id.toLowerCase() === this.selectedShift().toLowerCase()) {
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
          })
        }
      });
    }
    this.list.set(shifts);
  }

  selectShift(id: string) {
    console.log(id);
    if (id.toLowerCase() === 'new') {
      this.selectedShift.set(id);
      this.shiftForm.id().value.set('');
      this.shiftForm.name().value.set('');
      this.shiftForm.associated().value.set([]);
      this.shiftForm.paycode().value.set(1);
      this.shiftForm.minimums().value.set(0);
    } else {
      this.shiftPos.set(-1);
      const iTeam = this.teamService.getTeam();
      if (iTeam) {
        const team = new Team(iTeam);
        team.sites.forEach(site => {
          if (site.id.toLowerCase() === this.site().toLowerCase()) {
            site.workcenters.forEach(wc => {
              if (wc.id.toLowerCase() === this.workcenter.toLowerCase()) {
                wc.shifts.forEach((shft, s) => {
                  if (shft.id.toLowerCase() === id.toLowerCase()) {
                    this.shiftPos.set(s);
                    this.selectedShift.set(id);
                    this.shiftForm.id().value.set(id);
                    this.shiftForm.name().value.set(shft.name);
                    this.shiftForm.associated().value.set(shft.associatedCodes);
                    this.shiftForm.paycode().value.set(shft.payCode);
                    this.shiftForm.minimums().value.set(shft.minimums);
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
            this.selectedShift.set(id);
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
    if (this.selectedShift() !== 'new' ) {
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
        value, 'shift', this.selectedShift()).subscribe({
        next: (res) => {
          const iSite = res.body as ISite;
          if (iSite) {
            const site = new Site(iSite);
            this.siteService.selectedSite.set(site);
            this.selectShift(this.selectedShift());
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
          'remove', 'remove', 'shift', this.selectedShift())
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
