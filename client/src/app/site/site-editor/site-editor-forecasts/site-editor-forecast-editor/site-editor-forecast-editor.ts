import { ChangeDetectionStrategy, Component, Input, model, signal } from '@angular/core';
import { Forecast } from 'scheduler-models/scheduler/sites/reports/forecast';
import { Item } from '../../../../general/list/list.model';
import { AuthService } from '../../../../services/auth-service';
import { SiteService } from '../../../../services/site-service';
import { TeamService } from '../../../../services/team-service';
import { MatDialog } from '@angular/material/dialog';
import { Team } from 'scheduler-models/scheduler/teams';
import { List } from '../../../../general/list/list';
import { form, FormField, required } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { SiteEditorForecastEditorPeriod } from "./site-editor-forecast-editor-period/site-editor-forecast-editor-period";
import { FormsModule } from '@angular/forms';
import { SiteEditorForecastEditorLaborcodes } from './site-editor-forecast-editor-laborcodes/site-editor-forecast-editor-laborcodes';
import { HttpErrorResponse } from '@angular/common/http';
import { ISite, Site } from 'scheduler-models/scheduler/sites';
import { Period } from 'scheduler-models/scheduler/sites/reports';
import { ConfirmationDialog } from '../../../../general/confirmation-dialog/confirmation-dialog';

interface ForecastData {
  name: string;
  associated: string;
  sortByFirst: boolean;
  start: Date;
  end: Date;
  periodEnding: string;
}

@Component({
  selector: 'app-site-editor-forecast-editor',
  imports: [
    List,
    FormField,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatButtonModule,
    SiteEditorForecastEditorPeriod,
    SiteEditorForecastEditorLaborcodes
],
  templateUrl: './site-editor-forecast-editor.html',
  styleUrl: './site-editor-forecast-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class SiteEditorForecastEditor {
  private _site: string = '';
  @Input()
  get site(): string {
    return this._site;
  }
  set site(id: string) {
    this._site = id;
    this.setForecastList();
  }
  team = signal<string>('');
  selectedForecast = signal<string>('new');
  periods = signal<Period[]>([]);
  forecastList = signal<Item[]>([]);
  readonly showAll = model(false);
  companyList = signal<Item[]>([]);
  forecastModel = signal<ForecastData>({
    name: '',
    associated: '',
    sortByFirst: false,
    start: new Date(),
    end: new Date(),
    periodEnding: '5',
  });
  forecastForm = form(this.forecastModel, schema => {
    required(schema.name);
    required(schema.associated);
    required(schema.start);
    required(schema.end);
  });

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
      const coList: Item[] = [];
      team.companies.forEach(co => {
        coList.push({
          id: co.id,
          value: co.name,
        })
      });
      this.companyList.set(coList);
    }
    this.setForecastList();
  }

  changeShow() {
    this.setForecastList();
  }

  setForecastList() {
    if (this.site !== '') {
      const list: Item[] = [];
      list.push({
        id: 'new',
        value: 'Add New Forecast',
      });
      let now = new Date();
      now = new Date(Date.UTC(now.getFullYear() - 1, now.getMonth(), 
        now.getDate()));
      const formatter = Intl.DateTimeFormat('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const iTeam = this.teamService.getTeam();
      if (iTeam) {
        const team = new Team(iTeam);
        team.sites.forEach(site => {
          if (site.id.toLowerCase() === this.site.toLowerCase()) {
            if (site.forecasts && site.forecasts.length > 0) {
              site.forecasts.sort((a,b) => b.compareTo(a));
              site.forecasts.forEach(fcst => {
                if (now.getTime() <= fcst.startDate.getTime() 
                  || now.getTime() <= fcst.endDate.getTime()
                  || this.showAll()) {
                  list.push({
                    id: `${fcst.id}`,
                    value: `(${fcst.companyid.toUpperCase()}) ${fcst.name} `
                      + `(${formatter.format(fcst.startDate)} - `
                      + `${formatter.format(fcst.endDate)})`,
                  });
                }
              });
            }
          }
        });
      }
      this.forecastList.set(list);
    }
  }

  selectForecast(id: string) {
    this.selectedForecast.set(id);
    if (id.toLowerCase() === 'new') {
      this.forecastForm.name().value.set('');
      this.forecastForm.associated().value.set('');
      this.forecastForm.sortByFirst().value.set(false);
      this.forecastForm.start().value.set(new Date());
      this.forecastForm.end().value.set(new Date());
      this.forecastForm.periodEnding().value.set('5');
      this.periods.set([]);
    } else {
      const iTeam = this.teamService.getTeam();
      const fID = Number(id);
      if (iTeam) {
        const team = new Team(iTeam);
        team.sites.forEach(site => {
          if (site.id.toLowerCase() === this.site.toLowerCase()) {
            if (site.forecasts && site.forecasts.length > 0) {
              site.forecasts.forEach(fcst => {
                if (fcst.id === fID) {
                  this.periods.set(fcst.periods);
                  this.forecastForm.name().value.set(fcst.name);
                  this.forecastForm.associated().value.set(fcst.companyid);
                  this.forecastForm.sortByFirst().value.set(fcst.sortfirst);
                  this.forecastForm.start().value.set(fcst.startDate);
                  this.forecastForm.end().value.set(fcst.endDate);
                  const day = fcst.periods[0].periods[0].getDay()
                  this.forecastForm.periodEnding().value.set(`${day}`);
                }
              });
            }
          }
        });
      }
    }
  }

  onChange(field: string) {
    if (this.selectedForecast().toLowerCase() !== 'new') {
      let useField = field;
      let value = '';
      switch (field.toLowerCase()) {
        case 'name':
          value = this.forecastForm.name().value();
          break;
        case "associated":
          value = this.forecastForm.associated().value();
          useField = 'company';
          break;
        case "start":
          value = this.dateToString(this.forecastForm.start().value());
          break;
        case "end":
          value = this.dateToString(this.forecastForm.end().value());
          break;
        case "period":
          value = this.forecastForm.periodEnding().value();
          break;
        case "sortfirst":
          value = (this.forecastForm.sortByFirst().value()) ? 'true' : 'false';
          break;
      }
      this.siteService.updateForecast(this.team(), this.site, 
        Number(this.selectedForecast()), '', '', useField, value).subscribe({
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
                  site.forecasts.forEach(fcst => {
                    if (fcst.id === Number(this.selectedForecast())) {
                      this.periods.set(fcst.periods);
                    }
                  })
                }
              });
              if (!found) {
                team.sites.push(site);
              }
              this.teamService.setTeam(team);
              this.setForecastList();
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

  onAddForecast() {
    if (this.selectedForecast().toLowerCase() === 'new' && this.forecastForm().valid()) {
      const name = this.forecastForm.name().value();
      const company = this.forecastForm.associated().value();
      this.siteService.addForecast(this.team(), this.site, name, company,
        new Date(this.forecastForm.start().value()), 
        new Date(this.forecastForm.end().value()), 
        Number(this.forecastForm.periodEnding().value()),
        this.forecastForm.sortByFirst().value()).subscribe({
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
                  site.forecasts.forEach(fcst => {
                    if (fcst.name.toLowerCase() === name.toLowerCase()
                      && fcst.companyid.toLowerCase() === company.toLowerCase()) {
                      this.selectedForecast.set(`${fcst.id}`);
                      this.periods.set(fcst.periods);
                    }
                  })
                }
              });
              if (!found) {
                team.sites.push(site);
              }
              this.teamService.setTeam(team);
              this.setForecastList();
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

  onClearForecast() {
    this.selectForecast('new');
  }

  onDeleteForecast() {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Forecast Delete Confirmation',
        message: 'Are you sure you want to delete this forecast?',
        negativeButtonTitle: 'No',
        affirmativeButtonTitle: 'Yes'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.toLowerCase() === 'yes') {
        this.siteService.deleteForecast(this.team(), this.site, 
          Number(this.selectedForecast())).subscribe({
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
                this.selectForecast('new');
                this.setForecastList();
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
