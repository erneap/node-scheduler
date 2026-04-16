import { Component, input } from '@angular/core';
import { Workcode } from 'scheduler-models/scheduler/labor';
import { ScheduleEmployee } from 'scheduler-models/scheduler/sites/schedule';
import { SiteIngestChartEmployeeDay } from './site-ingest-chart-employee-day/site-ingest-chart-employee-day';

@Component({
  selector: 'app-site-ingest-chart-employee',
  imports: [
    SiteIngestChartEmployeeDay
  ],
  templateUrl: './site-ingest-chart-employee.html',
  styleUrl: './site-ingest-chart-employee.scss',
})
export class SiteIngestChartEmployee {
  employee = input<ScheduleEmployee>(new ScheduleEmployee());
  workcodes = input<Map<string, Workcode>>(new Map<string, Workcode>());

  getStyle(): string {
    let bkColor: string = (this.employee().id % 2 === 0) ? "ffffff" : "d9d9d9";
    let txColor: string = "000000";
    return `background-color: #${bkColor};color: #${txColor}`;
  }

  getTotal(): string {
    let hours = 0;
    this.employee().days.forEach(day => {
      if (day.code === '') {
        hours += day.hours;
      }
    });
    return hours.toFixed(1);
  }
}
