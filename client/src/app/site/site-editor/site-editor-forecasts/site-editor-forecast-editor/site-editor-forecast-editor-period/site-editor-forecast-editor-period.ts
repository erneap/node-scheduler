import { Component, input, Input, output, signal } from '@angular/core';
import { Forecast, IForecast } from 'scheduler-models/scheduler/sites/reports/forecast';
import { Item } from '../../../../../general/list/list.model';
import { Period } from 'scheduler-models/scheduler/sites/reports/period';
import { AuthService } from '../../../../../services/auth-service';
import { SiteService } from '../../../../../services/site-service';
import { TeamService } from '../../../../../services/team-service';
import { Team } from 'scheduler-models/scheduler/teams';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } 
  from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

interface ForecastPeriodData {
  outofcycle: Date;
}

@Component({
  selector: 'app-site-editor-forecast-editor-period',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule
  ],
  templateUrl: './site-editor-forecast-editor-period.html',
  styleUrl: './site-editor-forecast-editor-period.scss',
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
export class SiteEditorForecastEditorPeriod {
  private _report: string = '';
  @Input()
  set forecast(id: string) {
    this._report = id;
    this.setPeriods();
  }
  get forecast(): string {
    return this._report;
  }
  site = input<string>('');
  team = signal<string>('');
  changed = output<Forecast>();
  periods = signal<Item[]>([]);
  selectedPeriod = signal<string>('');
  periodMap = new Map<string, Period>();

  constructor(
    protected authService: AuthService,
    protected siteService: SiteService,
    protected teamService: TeamService,
  ) {
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      this.team.set(team.id);
    }
  }

  setPeriods() {
    const pList: Item[] = [];
    const formatter = Intl.DateTimeFormat('en-UD', {
      month: '2-digit',
      year: 'numeric',
    });
    const formatter2 = Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      day: 'numeric',
    })
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      team.sites.forEach(site => {
        if (site.id.toLowerCase() === this.site().toLowerCase()) {
          site.forecasts.forEach(fcst => {
            if (fcst.id === Number(this.forecast)) {
              fcst.periods.sort((a,b) => a.compareTo(b));
              fcst.periods.forEach(prd => {
                const id = formatter.format(prd.month);
                let label = '';
                if (prd.periods) {
                  prd.periods.forEach(wprd => {
                    if (label !== '') {
                      label += ',';
                    }
                  });
                }
                label = `${id} - ${label}`;
                pList.push({
                  id: id,
                  value: label,
                });
              });
            }
          });
        }
      });
    }
  }

  selectPeriod(id: string) {

  }

  setItemClass(id: string): string {
    if (id.toLowerCase() === this.selectedPeriod().toLowerCase()) {
      return "item selected";
    }
    return "item";

  }

  onMovePeriod(direction: string) {

  }

  onAddOutOfCycle() {

  }
}
