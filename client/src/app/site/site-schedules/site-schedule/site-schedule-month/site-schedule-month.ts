import { Component, input, signal } from '@angular/core';
import { Site } from 'scheduler-models/scheduler/sites';
import { SiteService } from '../../../../services/site-service';
import { Employee } from 'scheduler-models/scheduler/employees';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { SiteScheduleMonthWorkcenter } from './site-schedule-month-workcenter/site-schedule-month-workcenter';
import { Workcode } from 'scheduler-models/scheduler/labor';
import { AuthService } from '../../../../services/auth-service';
import { IScheduleWorkcenter, ScheduleWorkcenter } from 'scheduler-models/scheduler/sites/schedule';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { User } from 'scheduler-models/users';
import { environment } from '../../../../../environments/environment';
import { TeamService } from '../../../../services/team-service';
import { ReportRequest } from 'scheduler-models/general'
import { Team } from 'scheduler-models/scheduler/teams';
import { EmployeeService } from '../../../../services/employee-service';

@Component({
  selector: 'app-site-schedule-month',
  imports: [
    ReactiveFormsModule,
    MatSelectModule,
    MatInputModule,
    MatTooltip,
    MatIconModule,
    MatExpansionModule,
    SiteScheduleMonthWorkcenter
  ],
  templateUrl: './site-schedule-month.html',
  styleUrl: './site-schedule-month.scss',
})
export class SiteScheduleMonth {
  months: string[] = new Array("January", "February", "March", "April", "May",
  "June", "July", "August", "September", "October", "November", "December");

  workcodes = input<Workcode[]>([]);
  workcenters = signal<ScheduleWorkcenter[]>([]);
  month = signal<Date>(new Date());
  site = signal<Site>(new Site());
  leader = signal<boolean>(false);
  expanded = signal<string>('')
  monthForm: FormGroup;

  constructor(
    private authService: AuthService,
    private empService: EmployeeService,
    private siteService: SiteService,
    private teamService: TeamService,
    private builder: FormBuilder,
    private http: HttpClient
  ) {
    const iSite = this.siteService.getSite();
    this.site.set(new Site(iSite));
    const now = new Date();
    this.month.set(new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)));
    this.monthForm = this.builder.group({
      month: this.month().getUTCMonth(),
      year: this.month().getUTCFullYear(),
    });
    const iEmp = this.empService.getEmployee();
    if (iEmp) {
      const emp = new Employee(iEmp);
      let date = new Date(this.month());
      let wd = emp.getWorkday(this.month());
      while (!wd || wd.workcenter === '') {
        date = new Date(date.getTime() + (24 * 3600000));
        wd = emp.getWorkday(date);
      }
      this.expanded.set(wd.workcenter);
    }
    const iUser = this.authService.getUser();
    if (iUser) {
      const user = new User(iUser);
      this.leader.set(user.hasPermission('scheduler', 'siteleader') 
        || user.hasPermission('scheduler', 'scheduler'));
    }
    this.getMonth();
    
  }

  getMonth() {
    const user = this.authService.getUser();
    if (user) {
      this.siteService.getSiteSchedule(user.id, this.month()).subscribe({
        next: (res) => {
          const wkctrs: ScheduleWorkcenter[] = [];
          const data = res.body as IScheduleWorkcenter[];
          data.forEach(wc => {
            const nWc = new ScheduleWorkcenter(wc);
            wkctrs.push(nWc);
          });
          wkctrs.sort((a,b) => a.compareTo(b));
          this.workcenters.set(wkctrs);
        },
        error: (err) => {
          console.log(err);
          if (err instanceof HttpErrorResponse) {
            if (err.status >= 400 && err.status < 500) {
              this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
            }
          }
        }
      })
    }
  }

  changeMonth(direction: string, size: string) {
    if (size.toLowerCase().substring(0,1) === 'y') {
      if (direction.toLowerCase().substring(0,1) === 'u') {
        this.month.set(new Date(Date.UTC(this.month().getUTCFullYear() + 1, 
          this.month().getUTCMonth(), 1)));
      } else {
        this.month.set(new Date(Date.UTC(this.month().getUTCFullYear() - 1, 
          this.month().getUTCMonth(), 1)));
      }
    } else if (size.toLowerCase().substring(0,1) === 'm') {
      if (direction.toLowerCase().substring(0,1) === 'u') {
        this.month.set(new Date(Date.UTC(this.month().getUTCFullYear(), 
          this.month().getUTCMonth() + 1, 1)));
      } else {
        this.month.set(new Date(Date.UTC(this.month().getUTCFullYear(), 
          this.month().getUTCMonth() - 1, 1)));
      }
    }
    this.monthForm.get('month')?.setValue(this.month().getUTCMonth());
    this.monthForm.get('year')?.setValue(this.month().getUTCFullYear());
    this.getMonth();
  }

  selectMonth() {
    const iMonth = this.monthForm.get('month')?.value
    const iYear = this.monthForm.get('year')?.value;
    if (iMonth && iYear) {
      this.month.set(new Date(Date.UTC(Number(iYear), Number(iMonth), 1)));
      this.getMonth();
    }
  }

  onPrintSubmit() {
    const generalURL = environment.generalUrl;
    const url = `${generalURL}/report`;
    const iTeam = this.teamService.getTeam();
    const iSite = this.siteService.getSite();
    if (iTeam && iSite) {
      const team = new Team(iTeam);
      console.log(team.id);
      const request: ReportRequest = {
        reportType: 'siteschedule',
        period: ``,
        teamid: team.id,
        siteid: iSite.id,
        includeDaily: false
      };
      this.http.post(url, request, { responseType: "blob", observe: 'response'})
        .subscribe(file => {
          if (file.body) {
            const blob = new Blob([file.body],
              {type: 'application/vnd.openxmlformat-officedocument.spreadsheetml.sheet'});
              let contentDisposition = file.headers.get('Content-Disposition');
              let parts = contentDisposition?.split(' ');
              let fileName = '';
              parts?.forEach(pt => {
                if (pt.startsWith('filename')) {
                  let fParts = pt.split('=');
                  if (fParts.length > 1) {
                    fileName = fParts[1];
                  }
                }
              });
              if (!fileName) {
                fileName = 'SiteSchedule.xlsx';
              }
              const url = window.URL.createObjectURL(blob);
              
              const a: HTMLAnchorElement = document.createElement('a') as HTMLAnchorElement;
              a.href = url;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
    
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
          }
        })
    }
  }

  isExpanded(workcenter: string) {
    return (this.expanded().toLowerCase() === workcenter.toLowerCase());
  }

  panelChanged(action: string) {
    const parts = action.split('|');
    if (parts.length > 1) {
      if (parts[1].toLowerCase() === 'closed' 
        && this.expanded().toLowerCase() === parts[0].toLowerCase()) {
        this.expanded.set('');
      } else if (parts[1].toLowerCase() === 'opened'
        && this.expanded().toLowerCase() !== parts[0].toLowerCase()) {
        this.expanded.set(parts[0]);
      }
    } else if (parts.length === 1) {
      this.expanded.set(parts[0]);
    }
  }
}
