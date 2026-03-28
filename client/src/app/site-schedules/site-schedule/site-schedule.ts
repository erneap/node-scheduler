import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { SiteScheduleMonth } from './site-schedule-month/site-schedule-month';

@Component({
  selector: 'app-site-schedule',
  imports: [
    MatCardModule,
    SiteScheduleMonth
  ],
  templateUrl: './site-schedule.html',
  styleUrl: './site-schedule.scss',
})
export class SiteSchedule {}
