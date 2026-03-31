import { Component, input } from '@angular/core';

@Component({
  selector: 'app-site-schedule-month-workcenter-shiftcoverage-day',
  imports: [],
  templateUrl: './site-schedule-month-workcenter-shiftcoverage-day.html',
  styleUrl: './site-schedule-month-workcenter-shiftcoverage-day.scss',
})
export class SiteScheduleMonthWorkcenterShiftcoverageDay {
  coverage = input<number>(0);
  minimums = input<number>(0);
  date = input<Date>(new Date());
  row = input<string>('even');

  dayStyle(): string {
    let bkColor = 'ffffff';
    let txColor = '000000';

    if (bkColor === 'ffffff') {
      if (this.coverage() < this.minimums()) {
        if (this.row().toLowerCase() === 'even') {
          bkColor = '8b0000';
          txColor = 'ffffff';
        } else {
          bkColor = 'e60000';
          txColor = 'ffffff';
        }
      } else if (this.date().getUTCDay() === 0 || this.date().getUTCDay() === 6) {
        if (this.row().toLowerCase() === 'even') {
          bkColor = '3399ff';
        } else {
          bkColor = '99ccff';
        }
      } else {
        if (this.row().toLowerCase() === 'even') {
          bkColor = 'c0c0c0';
        } else {
          bkColor = 'ffffff';
        }
      }
    }
    return `background-color: #${bkColor};color: #${txColor};border: solid 1px #${txColor};`
  }
}
