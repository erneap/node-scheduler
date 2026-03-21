import { Component, input } from '@angular/core';
import { ILeave } from 'scheduler-models/scheduler/employees';
import { Holiday, IHoliday } from 'scheduler-models/scheduler/teams/company';
import { EmployeeLeavesChartHolidaysHolidayDisplay } from './employee-leaves-chart-holidays-holiday-display/employee-leaves-chart-holidays-holiday-display';

@Component({
  selector: 'app-employee-leaves-chart-holidays-holiday',
  imports: [
    EmployeeLeavesChartHolidaysHolidayDisplay
  ],
  templateUrl: './employee-leaves-chart-holidays-holiday.html',
  styleUrl: './employee-leaves-chart-holidays-holiday.scss',
})
export class EmployeeLeavesChartHolidaysHoliday {
  holiday = input.required<IHoliday>();
  year = input.required<number>();

  constructor() {}

  getCellStyle(): string {
    if (this.holiday().active) {
      return 'background-color: white;';
    } else {
      return 'background-color: darkgray;';
    }
  }

  getTotalActual(): string {
    let total: number = 0;
    const holiday = new Holiday(this.holiday());
    if (holiday.leaves) {
      holiday.leaves.forEach(dt => {
        if (dt.status.toLowerCase() === 'actual') {
          total += dt.hours;
        }
      });
    }
    return total.toFixed(1);
  }

  getTotalOther(): string {
    let total: number = 0;
    const holiday = new Holiday(this.holiday());
    if (holiday.leaves) {
      holiday.leaves.forEach(dt => {
        if (dt.status.toLowerCase() !== 'actual') {
          total += dt.hours;
        }
      });
    }
    return total.toFixed(1);
  }
  
  getReferenceDate(): string {
    let referenceDate = '';
    const months: string[] = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
    const holiday = new Holiday(this.holiday());
    holiday.actualdates.forEach(dt => {
      if (dt.getUTCFullYear() === this.year()) {
        referenceDate = `${dt.getUTCDate()} ${months[dt.getUTCMonth()]}`;
      }
    })
    return referenceDate;
  }

  getHolidayID(): string {
    return `${this.holiday().id.toUpperCase()}${this.holiday().sort}`;
  }
}
