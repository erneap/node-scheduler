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
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpErrorResponse } from '@angular/common/http';
import { ISite, Site } from 'scheduler-models/scheduler/sites';
import { form, FormField } from '@angular/forms/signals';

interface ForecastPeriodData {
  outofcycle: Date;
}

@Component({
  selector: 'app-site-editor-forecast-editor-period',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatTooltipModule,
    FormField
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
  private _periods: Period[] = [];
  @Input()
  set periods(prds: Period[]) {
    this._periods = prds;
    this.setPeriods();
  }
  get periods(): Period[] {
    return this._periods;
  }
  site = input<string>('');
  team = signal<string>('');
  forecast = input<string>('');
  changed = output<Forecast>();
  selectedPeriod = signal<string>('');
  list = signal<Item[]>([]);
  periodMap = new Map<string, Period>();
  periodModel = signal<ForecastPeriodData>({
    outofcycle: new Date(),
  });
  periodForm = form(this.periodModel);

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
    this.setPeriods();
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
    this.periods.sort((a,b) => a.compareTo(b));
    this.periods.forEach(prd => {
      const id = formatter.format(prd.month);
      let label = '';
      if (prd.periods) {
        prd.periods.forEach(wprd => {
          if (label !== '') {
            label += ',';
          }
          label += formatter2.format(wprd);
        });
      }
      label = `${id} - ${label}`;
      pList.push({
        id: id,
        value: label,
      });
    });
    this.list.set(pList);
  }

  selectPeriod(id: string) {
    this.selectedPeriod.set(id);
  }

  setItemClass(id: string): string {
    if (id.toLowerCase() === this.selectedPeriod().toLowerCase()) {
      return "item selected";
    }
    return "item";

  }

  onMovePeriod(direction: string) {
    const dateParts = this.selectedPeriod().split('/');
    const fromDate = new Date(Date.UTC(Number(dateParts[1]), (Number(dateParts[0]) - 1), 1));
    let toDate = new Date();
    if (direction.toLowerCase().substring(0,1) === 'b') {
      toDate = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth() - 1, 1));
    } else {
      toDate = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth() + 1, 1));
    }
    const value = `${this.stringFromDate(fromDate)}|${this.stringFromDate(toDate)}`;
    this.siteService.updateForecast(this.team(), this.site(), Number(this.forecast), '',
      '', 'move', value).subscribe({
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
            this.setPeriods();
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

  private stringFromDate(date: Date): string {
    let answer = `${date.getUTCFullYear()}-`;
    if (date.getUTCMonth() < 9) {
      answer += '0';
    }
    answer += `${date.getUTCMonth() + 1}-`
    if (date.getUTCDate() < 10) {
      answer += '0';
    }
    answer += `${date.getUTCDate()}`;
    return answer;
  }

  onAddOutOfCycle() {
    const outDate = new Date(this.periodForm.outofcycle().value());

    this.siteService.updateForecast(this.team(), this.site(), Number(this.forecast), '',
      '', 'addperiod', this.stringFromDate(outDate)).subscribe({
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
            this.setPeriods();
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
