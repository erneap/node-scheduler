import { Component, Input, input, model, output, signal } from '@angular/core';
import { AuthService } from '../../../../services/auth-service';
import { SiteService } from '../../../../services/site-service';
import { TeamService } from '../../../../services/team-service';
import { Team } from 'scheduler-models/scheduler/teams';
import { Site } from 'scheduler-models/scheduler/sites';
import { ScheduleEmployee } from 'scheduler-models/scheduler/sites/schedule';
import { HttpErrorResponse } from '@angular/common/http';
import { SiteIngestChartEmployee } from '../site-ingest-chart-employee/site-ingest-chart-employee';
import { Workcode } from 'scheduler-models/scheduler/labor';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { form, FormField } from '@angular/forms/signals';
import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';
import { DateTime } from 'luxon'

// See the Moment.js docs for the meaning of these formats:
// https://momentjs.com/docs/#/displaying/format/
export const MY_FORMATS = {
  parse: {
    dateInput: 'MM/YYYY',
  },
  display: {
    dateInput: 'MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

interface MonthData {
  month: DateTime;
}

@Component({
  selector: 'app-site-ingest-chart-month',
  imports: [
    FormField,
    MatTooltipModule,
    MatDatepickerModule,
    MatIconModule,
    SiteIngestChartEmployee
  ],
  templateUrl: './site-ingest-chart-month.html',
  styleUrl: './site-ingest-chart-month.scss',
  providers: [
    provideLuxonDateAdapter(MY_FORMATS),
  ],
})
export class SiteIngestChartMonth {
  private _company: string = 'rtx';
  @Input()
  get company(): string {
    return this._company;
  }
  set company(id: string) {
    this._company = id;
    this.getIngestMonth();
  }
  workcodes = input<Map<string, Workcode>>(new Map<string, Workcode>());
  month = signal<Date>(new Date());
  team = signal<string>('');
  site = signal<string>('');
  dates = signal<Date[]>([]);
  employees = signal<ScheduleEmployee[]>([]);
  monthModel = signal<MonthData>({
    month: DateTime.now(),
  });
  monthForm = form(this.monthModel);
  monthChange = output<string>();

  constructor(
    private authService: AuthService,
    public siteService: SiteService,
    private teamService: TeamService
  ) {
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      this.team.set(team.id);
    }
    const iSite = this.siteService.getSite();
    if (iSite) {
      const site = new Site(iSite);
      this.site.set(site.id);
    }
    const now = new Date();
    const nDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    this.month.set(nDate);
    this.monthChange.emit(this.dateToString(nDate));
  }

  getMonth(): string {
    const formatter = Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric'
    });
    return formatter.format(this.month());
  }

  getIngestMonth() {
    const month = this.month();
    const date = new Date(Date.UTC(month.getFullYear(), month.getMonth(), 1));
    const dates: Date[] = [];
    let start = new Date(date);
    while (start.getMonth() === date.getMonth()) {
      dates.push(new Date(start));
      start = new Date(start.getTime() + (24 * 3600000));
    }
    this.dates.set(dates);

    this.siteService.getIngestMonth(this.team(), this.site(), this.company, date).subscribe({
      next: (res) => {
        const employees = res.body as ScheduleEmployee[];
        this.employees.set(employees);
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

  getStyle(date: Date): string {
    let bkColor = 'ffffff';
    if (date.getUTCDay() === 6 || date.getUTCDay() === 0) {
      bkColor = '99ccff';
    }
    return `background-color: #${bkColor};`;
  }

  setMonthAndYear(nmy: DateTime, datepicker: MatDatepicker<DateTime>) {
    const ctrlValue = DateTime.fromObject({
      month: nmy.month,
      year: nmy.year,
    });
    const date = new Date(Date.UTC(nmy.year, nmy.month - 1, 1));
    const luxonDate = DateTime.fromJSDate(date);
    this.monthForm.month().value.set(luxonDate);
    this.month.set(date);
    this.monthChange.emit(this.dateToString(date));
    this.getIngestMonth();
    datepicker.close();
  }

  onChange(size: string, direction: string) {
    if (direction.toLowerCase().substring(0,1) === 'u') {
      if (size.toLowerCase().substring(0,1) === 'y') {
        const nDate = new Date(Date.UTC(this.month().getUTCFullYear() + 1, 
          this.month().getUTCMonth(), 1));
        this.month.set(nDate);
      } else {
        const nDate = new Date(Date.UTC(this.month().getUTCFullYear(), 
          this.month().getUTCMonth() + 1, 1));
        this.month.set(nDate);
      }
    } else {
      if (size.toLowerCase().substring(0,1) === 'y') {
        const nDate = new Date(Date.UTC(this.month().getUTCFullYear() - 1, 
          this.month().getUTCMonth(), 1));
        this.month.set(nDate);
      } else {
        const nDate = new Date(Date.UTC(this.month().getUTCFullYear(), 
          this.month().getUTCMonth() - 1, 1));
        this.month.set(nDate);
      }
    }
    this.monthChange.emit(this.dateToString(this.month()));
    const luxonDate = DateTime.fromJSDate(this.month());
    this.monthForm.month().value.set(luxonDate);
    this.getIngestMonth();
  }

  dateToString(date: Date): string {
    const tdate = new Date(date);
    let answer = `${tdate.getFullYear()}-`;
    if (tdate.getMonth() < 9) {
      answer += '0';
    }
    answer += `${tdate.getMonth() + 1}-`;
    if (tdate.getDate() < 10) {
      answer += '0';
    }
    answer += `${tdate.getDate()}`;
    return answer;
  }

  onRefresh() {
    this.getIngestMonth();
  }
}
