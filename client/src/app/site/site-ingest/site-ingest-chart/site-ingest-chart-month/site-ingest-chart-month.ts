import { Component, Input, input, model, signal } from '@angular/core';
import { Company } from 'scheduler-models/scheduler/teams/company';
import { AuthService } from '../../../../services/auth-service';
import { EmployeeService } from '../../../../services/employee-service';
import { SiteService } from '../../../../services/site-service';
import { TeamService } from '../../../../services/team-service';
import { Team } from 'scheduler-models/scheduler/teams';
import { Site } from 'scheduler-models/scheduler/sites';
import { ScheduleEmployee } from 'scheduler-models/scheduler/sites/schedule';
import { HttpErrorResponse } from '@angular/common/http';
import { SiteIngestChartEmployee } from '../site-ingest-chart-employee/site-ingest-chart-employee';
import { Workcode } from 'scheduler-models/scheduler/labor';

@Component({
  selector: 'app-site-ingest-chart-month',
  imports: [
    SiteIngestChartEmployee
  ],
  templateUrl: './site-ingest-chart-month.html',
  styleUrl: './site-ingest-chart-month.scss',
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
  }

  getMonth(): string {
    const formatter = Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric'
    });
    return formatter.format(this.month());
  }

  getIngestMonth() {
    const date = new Date(Date.UTC(this.month().getFullYear(), this.month().getMonth(), 1));
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
    this.getIngestMonth();
  }
}
