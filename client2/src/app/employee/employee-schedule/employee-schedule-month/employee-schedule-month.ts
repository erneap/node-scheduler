import { Component, signal } from '@angular/core';
import { WorkWeek } from '../employee-schedule.model';
import { EmployeeScheduleMonthDay } 
  from './employee-schedule-month-day/employee-schedule-month-day';
import { EmployeeService } from '../../../services/employee-service';
import { Workday } from 'scheduler-models/scheduler/employees';

@Component({
  selector: 'app-employee-schedule-month',
  imports: [
    EmployeeScheduleMonthDay
  ],
  templateUrl: './employee-schedule-month.html',
  styleUrl: './employee-schedule-month.scss',
})
export class EmployeeScheduleMonth {
  months: string[] = new Array("January", "February", "March", "April", "May",
    "June", "July", "August", "September", "October", "November", "December");

  weekdays: string[] = new Array("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat");

  month: Date = new Date();
  startDate: Date = new Date();
  endDate: Date = new Date();
  lastWork: Date = new Date(0);

  workweeks: WorkWeek[] = [];
  monthLabel = signal('');

  constructor(
    private empService: EmployeeService
  ) {
    const now = new Date();
    this.month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }

  setMonth() {
    this.monthLabel.set(`${this.months[this.month.getUTCMonth()]} `
      + `${this.month.getUTCFullYear()}`);
    
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

    const emp = this.empService.employee();
    this.workweeks = [];
    if (emp) {
      let count = -1;
      let start = new Date(this.startDate);
      let workweek: WorkWeek | undefined;
      while (start.getTime() < this.endDate.getTime()) {
        if (!workweek || start.getUTCDay() === 0) {
          count++;
          workweek = new WorkWeek(count);
          this.workweeks.push(workweek);
        }
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
        if (wd.code.toLowerCase() === 'v') {
          emp.leaves.forEach(lv => {
            if (start.getUTCFullYear() === lv.leavedate.getUTCFullYear()
              && start.getUTCMonth() === lv.leavedate.getUTCMonth()
              && start.getUTCDate() === lv.leavedate.getUTCDate()
              && lv.code.toLowerCase() === 'v') {
              wd.workcenter = (lv.tagday) ? lv.tagday : '';
            }
          });
        }
        workweek.setWorkday(wd, start);
        start = new Date(start.getTime() + (24 * 3600000));
      }
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
}
