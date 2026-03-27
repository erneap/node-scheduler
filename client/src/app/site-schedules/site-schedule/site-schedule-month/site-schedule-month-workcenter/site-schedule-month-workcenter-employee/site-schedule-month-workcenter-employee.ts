import { Component, Input, input } from '@angular/core';
import { Employee } from 'scheduler-models/scheduler/employees';
import { SiteScheduleMonthWorkcenterEmployeeDay } from './site-schedule-month-workcenter-employee-day/site-schedule-month-workcenter-employee-day';

@Component({
  selector: 'app-site-schedule-month-workcenter-employee',
  imports: [
    SiteScheduleMonthWorkcenterEmployeeDay
  ],
  templateUrl: './site-schedule-month-workcenter-employee.html',
  styleUrl: './site-schedule-month-workcenter-employee.scss',
})
export class SiteScheduleMonthWorkcenterEmployee {
  private _date: Date = new Date(0);
  end: Date = new Date(0);
  employee = input<Employee>(new Employee());
  row = input<string>('even');
  @Input()
  get start(): Date {
    return this._date;
  }
  set start(sDatee: Date) {
    this._date = new Date(sDatee);
    this.setDates();
  }
  monthDates: Date[] = [];

  setDates() {
    this.monthDates = [];
    if (this._date.getTime() !== 0) {
      this._date = new Date(Date.UTC(this._date.getUTCFullYear(), 
        this._date.getUTCMonth(), 1));
      this.end = new Date(Date.UTC(this._date.getUTCFullYear(),
        this._date.getUTCMonth() + 1, 1));
      let start = new Date(this._date);
      while (start.getTime() < this.end.getTime()) {
        this.monthDates.push(new Date(start));
        start = new Date(start.getTime() + (24 * 3600000));
      }
    }
  }

  getNameStyle(): string {
    let bkColor = 'ffffff'
    if (this.row().toLowerCase() === 'even') {
      bkColor = 'c0c0c0';
    }
    return `background-color: #${bkColor};color: #000000;`;
  }
}
