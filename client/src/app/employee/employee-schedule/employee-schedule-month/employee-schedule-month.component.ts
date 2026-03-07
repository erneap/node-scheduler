import { Component, Input } from '@angular/core';
import { Workday, Employee } from 'scheduler-node-models/scheduler/employees';
import { Workcenter } from 'scheduler-node-models/scheduler/sites/workcenters';
import { WorkWeek } from '../employee-schedule.model';
import { SiteService } from '../../../services/site-service';
import { EmployeeService } from '../../../services/employee-service';
import { TeamService } from '../../../services/team-service';
import { DialogService } from '../../../services/dialog-service.service';
import { AuthService } from '../../../services/auth-service';
import { AppStateService } from '../../../services/app-state-service';
import { EmployeeScheduleDayComponent } from '../employee-schedule-day/employee-schedule-day.component';

@Component({
    selector: 'app-employee-schedule-month',
    imports: [
      EmployeeScheduleDayComponent
    ],
    templateUrl: './employee-schedule-month.component.html',
    styleUrls: ['./employee-schedule-month.component.scss'],
})
export class EmployeeScheduleMonthComponent {
  @Input() workcenters: Workcenter[] = [];
  @Input() width: number = 714;
  months: string[] = new Array("January", "February", "March", "April", "May",
    "June", "July", "August", "September", "October", "November", "December");

  weekdays: string[] = new Array("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat");

  month: Date = new Date();
  startDate: Date = new Date();
  endDate: Date = new Date();
  lastWork: Date = new Date(0);

  workweeks: WorkWeek[] = [];
  monthLabel: string = "";

  constructor(
    protected siteService: SiteService,
    protected employeeService: EmployeeService,
    protected teamService: TeamService,
    protected dialogService: DialogService,
    protected authService: AuthService,
    protected appState: AppStateService
  ) {
    this.month = new Date();
    this.month = new Date(Date.UTC(this.month.getUTCFullYear(), 
      this.month.getUTCMonth(), 1));
    if (this.appState.viewWidth < this.width) {
      const cWidth = Math.floor((this.appState.viewWidth - 14) / 7);
      this.width = (cWidth * 7) + 14;
    }
    this.setMonth();
  }

  getCellWidth(): number {
    return (this.width - 14) / 7;
  }

  setMonth() {
    this.monthLabel = `${this.months[this.month.getUTCMonth()]} `
      + `${this.month.getUTCFullYear()}`;
    
    // calculate the display's start and end date, where start date is always
    // the sunday before the 1st of the month and end date is the saturday after
    // the end of the month.
    this.startDate = new Date(Date.UTC(this.month.getUTCFullYear(), 
      this.month.getUTCMonth(), 1, 0, 0, 0));
    while (this.startDate.getUTCDay() !== 0) {
      this.startDate = new Date(this.startDate.getTime() - (24 * 3600000));
    }
    this.endDate = new Date(Date.UTC(this.month.getUTCFullYear(), 
      this.month.getUTCMonth() + 1, 1, 0, 0, 0));
    while (this.endDate.getUTCDay() !== 0) {
      this.endDate = new Date(this.endDate.getTime() + (24 * 3600000));
    }
    
    const emp = this.employeeService.getEmployee();
    if (emp) {
      /*if (!emp.hasWorkForYear(this.month.getUTCFullYear())) {
        this.dialogService.showSpinner();
        this.employeeService.retrieveEmployeeWork(emp.id, 
          this.month.getUTCFullYear()).subscribe({
          next: resp => {
            this.dialogService.closeSpinner();
            if (resp && resp.id !== '') {
              if (emp.id === resp.id && resp.work) {
                resp.work.forEach(wk => {
                  emp.addWork(wk);
                });
                this.employeeService.setEmployee(emp);
              }
            }
            this.setWorkweeks(emp);
          },
          error: (err: EmployeeWorkResponse) => {
            this.dialogService.closeSpinner();
            this.authService.statusMessage = err.exception;
          }
        });
      } else {*/
        this.setWorkweeks(emp);
      //}
    } else {
      this.authService.message.set('No employee for schedule');
    }

    if (emp && emp.work) {
      emp.work.forEach(wk => {
        if (wk.dateworked.getTime() > this.lastWork.getTime()) {
          this.lastWork = new Date(wk.dateworked);
        }
      });
    }
  }

  setWorkweeks(emp: Employee) {
    this.workweeks = [];
    let count = -1;
    let start = new Date(this.startDate);
    var workweek: WorkWeek | undefined;
    while (start.getTime() < this.endDate.getTime()) {
      if (!workweek || start.getUTCDay() === 0) {
        count++;
        workweek = new WorkWeek(count);
        this.workweeks.push(workweek);
      }
      if (emp) {
        let wd = emp.getWorkday(start);
        if (!wd) {
          wd = new Workday();
          wd.id = start.getUTCDay();
        } else if (wd.id === 0) {
          wd.id = start.getUTCDay();
        } else if (wd.id > 6) {
          wd.id = wd.id % 7;
        }
        wd.date = new Date(start);
        workweek.setWorkday(wd, start);
      } else {
        const wd = new Workday();
        workweek.setWorkday(wd, start);
      }
      start = new Date(start.getTime() + (24 * 3600000));
    }
    this.workweeks.sort((a,b) => a.compareTo(b));
  }

  changeMonth(direction: string, period: string) {
    if (direction.toLowerCase() === 'up') {
      if (period.toLowerCase() === 'month') {
        this.month = new Date(Date.UTC(this.month.getUTCFullYear(), 
          this.month.getUTCMonth() + 1, 1));
      } else if (period.toLowerCase() === 'year') {
        this.month = new Date(Date.UTC(this.month.getUTCFullYear() + 1, 
        this.month.getUTCMonth(), 1));
      }
    } else {
      if (period.toLowerCase() === 'month') {
        this.month = new Date(Date.UTC(this.month.getUTCFullYear(), 
          this.month.getUTCMonth() - 1, 1));
      } else if (period.toLowerCase() === 'year') {
        this.month = new Date(Date.UTC(this.month.getUTCFullYear() - 1, 
        this.month.getUTCMonth(), 1));
      }
    }
    this.setMonth();
  }

  getMoveStyle(): string {
    const ratio = this.width / 714;
    return `width: ${this.getCellWidth()}px;font-size: ${1.3 * ratio}em;`;
  }

  getUTCMonthStyle(): string {
    const ratio = this.width / 714;
    let cWidth = this.getCellWidth();
    const mWidth = this.width - (4 * (cWidth + 2));
    return `width: ${mWidth}px;font-size: ${1.3 * ratio}em;`
  }

  getUTCDayStyle(): string {
    const ratio = this.width / 714;
    return `width: ${this.getCellWidth()}px;font-size: ${1.2 * ratio}em;`;
  }
}
