import { Component, Input, input } from '@angular/core';
import { ScheduleShift } from 'scheduler-models/scheduler/sites/schedule';
import { SiteScheduleMonthWorkcenterShiftcoverageDay } from './site-schedule-month-workcenter-shiftcoverage-day/site-schedule-month-workcenter-shiftcoverage-day';

@Component({
  selector: 'app-site-schedule-month-workcenter-shiftcoverage',
  imports: [
    SiteScheduleMonthWorkcenterShiftcoverageDay
  ],
  templateUrl: './site-schedule-month-workcenter-shiftcoverage.html',
  styleUrl: './site-schedule-month-workcenter-shiftcoverage.scss',
})
export class SiteScheduleMonthWorkcenterShiftcoverage {
  private _date: Date = new Date(0);
  end: Date = new Date(0);
  workshift = input<ScheduleShift>(new ScheduleShift(), {alias: 'shift'});
  row = input<string>('even');
  @Input()
  get start(): Date {
    return this._date;
  }
  set start(sDate: Date) {
    this._date = new Date(sDate);
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
  
  getCoverage(date: Date): number {
    const day = date.getDate() - 1;
    if (day < this.workshift().counts.length) {
      return this.workshift().counts[day].count;
    }
    return 0;
  }

  getNameStyle(): string {
    let bkColor = 'ffffff'
    if (this.row().toLowerCase() === 'even') {
      bkColor = 'c0c0c0';
    }
    return `background-color: #${bkColor};color: #000000;`;
  }
}
