import { Component, input } from '@angular/core';
import { ILeave } from 'scheduler-models/scheduler/employees';

@Component({
  selector: 'app-employee-leaves-chart-holidays-holiday-display',
  imports: [],
  templateUrl: './employee-leaves-chart-holidays-holiday-display.html',
  styleUrl: './employee-leaves-chart-holidays-holiday-display.scss',
})
export class EmployeeLeavesChartHolidaysHolidayDisplay {
  holiday = input.required<ILeave>()
  comma = input.required<boolean>()

  constructor() {}

  getSpanStyle(): string {
    if (this.holiday().status.toLowerCase() !== 'actual') {
      return 'color: #3399ff;';
    } else {
      return 'color: #000000;';
    }
  }

  getHours(): string {
    const iHours = Math.floor(this.holiday().hours);
    if (iHours.toFixed(1) === this.holiday().hours.toFixed(1)) {
      return this.holiday().hours.toFixed(0);
    } 
    return this.holiday().hours.toFixed(1);
  }

  showHours(): boolean {
    return (this.holiday().hours < 8.0);
  }

  getDateDisplay(): string {
    const months: string[] = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
    return `${this.holiday().leavedate.getUTCDate()}-`
      + `${months[this.holiday().leavedate.getUTCMonth()]}`;
  }
}
