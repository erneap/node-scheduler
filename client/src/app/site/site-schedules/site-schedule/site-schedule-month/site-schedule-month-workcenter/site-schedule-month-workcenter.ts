import { Component, input, Input, output, signal } from '@angular/core';
import { SiteScheduleMonthWorkcenterEmployee } from './site-schedule-month-workcenter-employee/site-schedule-month-workcenter-employee';
import { MatExpansionModule } from '@angular/material/expansion';
import { SiteScheduleMonthWorkcenterEmployeeDay } from './site-schedule-month-workcenter-employee/site-schedule-month-workcenter-employee-day/site-schedule-month-workcenter-employee-day';
import { ScheduleWorkcenter } from 'scheduler-models/scheduler/sites/schedule';
import { Workcode } from 'scheduler-models/scheduler/labor';
import { SiteScheduleMonthWorkcenterShiftcoverage } from './site-schedule-month-workcenter-shiftcoverage/site-schedule-month-workcenter-shiftcoverage';

@Component({
  selector: 'app-site-schedule-month-workcenter',
  imports: [
    MatExpansionModule,
    SiteScheduleMonthWorkcenterEmployee,
    SiteScheduleMonthWorkcenterEmployeeDay,
    SiteScheduleMonthWorkcenterShiftcoverage
  ],
  templateUrl: './site-schedule-month-workcenter.html',
  styleUrl: './site-schedule-month-workcenter.scss',
})
export class SiteScheduleMonthWorkcenter {
  workcenter = input<ScheduleWorkcenter>(new ScheduleWorkcenter());
  workcodes = input<Workcode[]>([]);
  leader = input<boolean>(false, { alias: 'showCoverage'});
  private _month: Date = new Date(0);
  @Input()
  get month(): Date {
    return this._month;
  }
  set month(start: Date) {
    this._month = new Date(start);
    this.setDates();
  }
  expanded = input<boolean>(false);
  panelStatus = output<string>({alias: 'panelChanged'});
  monthDates = signal<Date[]>([]);
  coverageStyle = signal<string>('width: 248px;');

  changePanelStatus(direction: string) {
    const chg = `${this.workcenter().wkctrID}|${direction}`;
    this.panelStatus.emit(chg);
  }

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
