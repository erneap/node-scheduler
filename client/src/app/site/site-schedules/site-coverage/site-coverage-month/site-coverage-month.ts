import { Component, signal } from '@angular/core';
import { Site } from 'scheduler-models/scheduler/sites';
import { ScheduleWorkcenter } from 'scheduler-models/scheduler/sites/schedule';

@Component({
  selector: 'app-site-coverage-month',
  imports: [],
  templateUrl: './site-coverage-month.html',
  styleUrl: './site-coverage-month.scss',
})
export class SiteCoverageMonth {
  months: string[] = new Array("January", "February", "March", "April", "May",
  "June", "July", "August", "September", "October", "November", "December");

  workcenters = signal<ScheduleWorkcenter[]>([]);
  month = signal<Date>(new Date());
  site = signal<Site>(new Site());}
