import { Component, input, Input, signal } from '@angular/core';
import { AuthService } from '../../../../../services/auth-service';
import { SiteService } from '../../../../../services/site-service';
import { TeamService } from '../../../../../services/team-service';
import { Item } from '../../../../../general/list/list.model';
import { Team } from 'scheduler-models/scheduler/teams';
import { form, FormField, min, required } from '@angular/forms/signals';
import { List } from '../../../../../general/list/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ISite, Site } from 'scheduler-models/scheduler/sites';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from '../../../../../general/confirmation-dialog/confirmation-dialog';

interface ForecastLaborData {
  chargeNumber: string;
  extension: string;
  clin: string;
  slin: string;
  wbs: string;
  location: string;
  slots: number;
  hoursPer: number;
  vacant: string;
  start: Date;
  end: Date;
}

@Component({
  selector: 'app-site-editor-forecast-editor-laborcodes',
  imports: [
    List,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatButtonModule
  ],
  templateUrl: './site-editor-forecast-editor-laborcodes.html',
  styleUrl: './site-editor-forecast-editor-laborcodes.scss',
  providers: [
    { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: true } },
    {
        provide: DateAdapter,
        useClass: MomentDateAdapter,
        deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
  ]
})
export class SiteEditorForecastEditorLaborcodes {
  private _forecast: string = '';
  @Input()
  get forecast(): string {
    return this._forecast;
  }
  set forecast(id: string) {
    this._forecast = id;
    this.setLaborcodes();
  }
  site = signal<string>('');
  team = signal<string>('');
  start = signal<Date>(new Date());
  end = signal<Date>(new Date());
  laborcodes = signal<Item[]>([]);
  selectedLaborcode = signal<string>('new');
  laborModel = signal<ForecastLaborData>({
    chargeNumber: '',
    extension: '',
    clin: '',
    slin: '',
    wbs: '',
    location: '',
    slots: 1,
    hoursPer: 1824,
    vacant: 'VACANT',
    start: new Date(),
    end: new Date(),
  });
  laborForm = form(this.laborModel, schema => {
    required(schema.chargeNumber);
    required(schema.extension);
    required(schema.slots, {message: 'required'});
    min(schema.slots, 1, {message: 'must be 1 or more'});
    min(schema.hoursPer, 1, {message: 'must be more than zero'})
  })

  constructor(
    private authService: AuthService,
    private siteService: SiteService,
    private teamService: TeamService,
    private dialog: MatDialog
  ) {
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      this.team.set(team.id);
      this.site.set(this.teamService.selectedSite());
    }
  }

  setLaborcodes() {
    const list: Item[] = [];
    list.push({
      id: 'new',
      value: 'Add New Labor Code',
    });
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      team.sites.forEach(site => {
        if (site.id.toLowerCase() === this.site().toLowerCase()) {
          site.forecasts.forEach(fcst => {
            if (fcst.id === Number(this.forecast)) {
              this.start.set(new Date(fcst.startDate));
              this.end.set(new Date(fcst.endDate));
              if (fcst.laborCodes && fcst.laborCodes.length > 0) {
                fcst.laborCodes.forEach(lc => {
                  list.push({
                    id: `${lc.chargeNumber}|${lc.extension}`,
                    value: `${lc.chargeNumber} - ${lc.extension}`,
                  });
                });
              }
            }
          });
        }
      });
    }
    this.laborcodes.set(list);
  }

  selectLaborCode(id: string) {
    console.log(id);
    if (id.toLowerCase() === 'new') {
      this.selectedLaborcode.set('new');
      this.laborForm.chargeNumber().value.set('');
      this.laborForm.extension().value.set('');
      this.laborForm.clin().value.set('');
      this.laborForm.slin().value.set('');
      this.laborForm.wbs().value.set('');
      this.laborForm.location().value.set('');
      this.laborForm.slots().value.set(1);
      this.laborForm.hoursPer().value.set(0);
      this.laborForm.vacant().value.set('VACANT');
      this.laborForm.start().value.set(new Date(this.start()));
      this.laborForm.end().value.set(new Date(this.end()));
    } else {
      this.selectedLaborcode.set(id);
      const lcParts = id.split('|');
      const iTeam = this.teamService.getTeam();
      if (iTeam) {
        const team = new Team(iTeam);
        team.sites.forEach(site => {
          if (site.id.toLowerCase() === this.site().toLowerCase()) {
            site.forecasts.forEach(fcst => {
              if (fcst.id === Number(this.forecast)) {
                if (fcst.laborCodes && fcst.laborCodes.length > 0) {
                  fcst.laborCodes.forEach(lc => {
                    if (lc.chargeNumber.toLowerCase() === lcParts[0].toLowerCase()
                      && lc.extension.toLowerCase() === lcParts[1].toLowerCase()) {
                      this.laborForm.chargeNumber().value.set(lc.chargeNumber);
                      this.laborForm.extension().value.set(lc.extension);
                      this.laborForm.clin().value.set((lc.clin) ? lc.clin : '');
                      this.laborForm.slin().value.set((lc.slin) ? lc.slin : '');
                      this.laborForm.wbs().value.set((lc.wbs) ? lc.wbs : '');
                      this.laborForm.location().value.set((lc.location) ? lc.location : '');
                      this.laborForm.slots().value.set((lc.minimumEmployees) 
                        ? lc.minimumEmployees : 0);
                      this.laborForm.hoursPer().value.set((lc.hoursPerEmployee) 
                        ? lc.hoursPerEmployee : 0);
                      this.laborForm.vacant().value.set((lc.notAssignedName) 
                        ? lc.notAssignedName : 'VACANT');
                      this.laborForm.start().value.set((lc.startDate) 
                        ? new Date(lc.startDate) : new Date());
                      this.laborForm.end().value.set((lc.endDate) 
                        ? new Date(lc.endDate) : new Date());
                    }
                  });
                }
              }
            });
          }
        });
      }
    }
  }

  onAdd() {
    if (this.laborForm().valid()) {
      this.siteService.addSiteForecastLaborcode(this.team(), this.site(), 
        Number(this.forecast), this.laborForm.chargeNumber().value(), 
        this.laborForm.extension().value(), this.laborForm.slots().value(),
        this.laborForm.vacant().value(), this.laborForm.hoursPer().value(),
        false, this.laborForm.location().value(), this.laborForm.clin().value(),
        this.laborForm.slin().value(), this.laborForm.wbs().value(), 
        new Date(this.laborForm.start().value()), new Date(this.laborForm.end().value()))
        .subscribe({
        next: (res) => {
          const iSite = res.body as ISite;
          if (iSite) {
            const site = new Site(iSite);
            this.siteService.selectedSite.set(site);
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
              this.setLaborcodes();
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

  onClear() {
    this.selectLaborCode(this.selectedLaborcode());
  }

  onUpdate(field: string) {
    if (this.selectedLaborcode().toLowerCase() !== 'new') {
      const lcParts = this.selectedLaborcode().split('|');
      let value = '';
      let useField = field;
      switch (field.toLowerCase()) {
        case "chargenumber":
          value = `${this.laborForm.chargeNumber().value()}`;
          break;
        case "extension":
          value = `${this.laborForm.extension().value()}`;
          break;
        case "location":
          value = `${this.laborForm.location().value()}`;
          break;
        case "clin":
          value = `${this.laborForm.clin().value()}`;
          break;
        case "slin":
          value = `${this.laborForm.slin().value()}`;
          break;
        case "wbs":
          value = `${this.laborForm.wbs().value()}`;
          break;
        case "slots":
          useField = 'minimums';
          value = `${this.laborForm.slots().value()}`;
          break;
        case "hours":
          value = `${this.laborForm.hoursPer().value()}`;
          break;
        case "vacant":
          useField = 'notassigned';
          value = this.laborForm.vacant().value();
          break;
        case "start":
          value = this.dateToString(this.laborForm.start().value());
          break;
        case "end":
          value = this.dateToString(this.laborForm.end().value());
          break;
      }
      this.siteService.updateForecast(this.team(), this.site(), Number(this.forecast),
        lcParts[0], lcParts[1], useField, value).subscribe({
        next: (res) => {
          const iSite = res.body as ISite;
          if (iSite) {
            const site = new Site(iSite);
            this.siteService.selectedSite.set(site);
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
              this.setLaborcodes();
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

  private dateToString(date: Date): string {
    date = new Date(date);
    let answer = `${date.getUTCFullYear()}-`;
    if (date.getUTCMonth() < 9) {
      answer += '0';
    }
    answer += `${date.getUTCMonth() + 1}-`;
    if (date.getUTCDate() < 10) {
      answer += '0';
    }
    answer += `${date.getUTCDate()}`;
    return answer;
  }

  onDelete() {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Forecast Labor Code Delete Confirmation',
        message: 'Are you sure you want to delete this labor code?',
        negativeButtonTitle: 'No',
        affirmativeButtonTitle: 'Yes'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.toLowerCase() === 'yes') {
        const lcParts = this.selectedLaborcode().split('|');
        this.siteService.updateForecast(this.team(), this.site(), Number(this.forecast),
          lcParts[0], lcParts[1], 'remove', '').subscribe({
          next: (res) => {
            const iSite = res.body as ISite;
            if (iSite) {
              const site = new Site(iSite);
              this.siteService.selectedSite.set(site);
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
                this.selectLaborCode('new');
                this.setLaborcodes();
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
