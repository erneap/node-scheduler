import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { EmployeeScheduleMonth } from './employee-schedule-month/employee-schedule-month';

@Component({
  selector: 'app-employee-schedule',
  imports: [
    MatCardModule,
    EmployeeScheduleMonth
  ],
  templateUrl: './employee-schedule.html',
  styleUrl: './employee-schedule.scss',
})
export class EmployeeSchedule {

}
