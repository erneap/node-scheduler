import { Component, Input, model, signal } from '@angular/core';
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
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatButtonModule,
    SiteEditorForecastEditorPeriod
],
  templateUrl: './site-editor-forecast-editor.html',
  styleUrl: './site-editor-forecast-editor.scss',
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
  forecast = signal<Forecast>(new Forecast());
  forecastList = signal<Item[]>([]);
  showAll = model<boolean>(false);
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
      this.forecast.set(new Forecast());
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
                  this.forecast.set(fcst);
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

  }

  onAddForecast() {

  }

  onClearForecast() {

  }

  onDeleteForecast() {

  }
}
