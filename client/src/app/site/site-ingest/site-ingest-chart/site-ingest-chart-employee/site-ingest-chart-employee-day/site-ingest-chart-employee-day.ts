import { Component, input } from '@angular/core';
import { Workcode } from 'scheduler-models/scheduler/labor';
import { ScheduleDay } from 'scheduler-models/scheduler/sites/schedule';

@Component({
  selector: 'app-site-ingest-chart-employee-day',
  imports: [],
  templateUrl: './site-ingest-chart-employee-day.html',
  styleUrl: './site-ingest-chart-employee-day.scss',
})
export class SiteIngestChartEmployeeDay {
  day = input<ScheduleDay>(new ScheduleDay());
  row = input<number>(0);
  workcodes = input<Map<string, Workcode>>(new Map<string, Workcode>());



  getDisplayValue(): string {
    if (this.day().code === '') {
      if (this.day().hours === Math.floor(this.day().hours)) {
        return this.day().hours.toFixed(0);
      }
      return this.day().hours.toFixed(1);
    }
    return this.day().code;
  }

  dayStyle(): string {
    let bkColor: string = (this.row() % 2 === 0) ? "ffffff" : "d9d9d9";
    let txColor: string = "000000";
    if (this.day().code === '') {
      const dayDate = new Date(this.day().date);
      if (dayDate.getUTCDay() === 0 || dayDate.getUTCDay() === 6) {
        bkColor = (this.row() % 2 === 0) ? "99ccff" : "4da6ff";
      }
    } else {
      const wc = this.workcodes().get(this.day().code);
      if (wc) {
        bkColor = wc.backcolor;
        txColor = wc.textcolor;
      }
    }
    return `background-color: #${bkColor};color: #${txColor}`;
  }
}
