import { Component, Input, input, signal } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { SiteScheduleMonthWorkcenterShiftcoverage } from '../../../site-schedule/site-schedule-month/site-schedule-month-workcenter/site-schedule-month-workcenter-shiftcoverage/site-schedule-month-workcenter-shiftcoverage';
import { ScheduleWorkcenter } from 'scheduler-models/scheduler/sites/schedule';
import { SiteScheduleMonthWorkcenterEmployeeDay } from '../../../site-schedule/site-schedule-month/site-schedule-month-workcenter/site-schedule-month-workcenter-employee/site-schedule-month-workcenter-employee-day/site-schedule-month-workcenter-employee-day';

@Component({
  selector: 'app-site-coverage-month-workcenter',
  imports: [
    MatExpansionModule,
    SiteScheduleMonthWorkcenterShiftcoverage,
    SiteScheduleMonthWorkcenterEmployeeDay
  ],
  templateUrl: './site-coverage-month-workcenter.html',
  styleUrl: './site-coverage-month-workcenter.scss',
})
export class SiteCoverageMonthWorkcenter {
  workcenter = input<ScheduleWorkcenter>(new ScheduleWorkcenter());
  private _month: Date = new Date(0);
  @Input()
  get month(): Date {
    return this._month;
  }
  set month(start: Date) {
    this._month = new Date(start);
    this.setDates();
  }
  monthDates = signal<Date[]>([]);
  coverageStyle = signal<string>('width: 248px;');

  setDates() {
    const list: Date[] = [];
    let start = new Date(this.month);
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    while (start.getTime() < end.getTime()) {
      list.push(new Date(start));
      start = new Date(start.getTime() + (24 * 3600000));
    }
    this.monthDates.set(list);
    const width = 248 + (27 * list.length);
    this.coverageStyle.set(`width: ${width}px;`);
  }
}
