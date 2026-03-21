import { Component, Input } from '@angular/core';
import { EmployeeLeavesChartOtherDates } from './employee-leaves-chart-other-dates/employee-leaves-chart-other-dates';
import { LeaveMonth } from './employee-leaves-chart-other-month.models'
@Component({
  selector: 'app-employee-leaves-chart-other-month',
  imports: [
    EmployeeLeavesChartOtherDates
  ],
  templateUrl: './employee-leaves-chart-other-month.html',
  styleUrl: './employee-leaves-chart-other-month.scss',
})
export class EmployeeLeavesChartOtherMonth {
  private _month: LeaveMonth = new LeaveMonth();
  private _employee: string = '';
  @Input()
  public set leaveMonth(month: LeaveMonth) {
    this._month = new LeaveMonth(month);
  }
  get leaveMonth(): LeaveMonth {
    return this._month;
  }
  @Input()
  get employee(): string {
    return this._employee;
  }
  set employee(id: string) {
    this._employee = id;
  }
  months: string[] = new Array("JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL",
    "AUG", "SEP", "OCT", "NOV", "DEC");

  getStyle(field: string): string {
    let answer = `${field} `;
    if (this.leaveMonth.active) {
      answer += 'active';
    } else {
      answer += 'disabled';
    }
    return answer;
  }

  getActualHours(): string {
    let total = 0.0;
    this._month.leaveGroups.forEach(lg => {
      lg.leaves.forEach(lv => {
        if (lv.status.toLowerCase() === 'actual' && lv.code.toLowerCase() === 'v') {
          total += lv.hours
        }
      });
    })
    return total.toFixed(1);
  }

  getProjectedHours(): string {
    let total = 0.0;
    this._month.leaveGroups.forEach(lg => {
      lg.leaves.forEach(lv => {
        if (lv.status.toLowerCase() !== 'actual' && lv.code.toLowerCase() === 'v') {
          total += lv.hours
        }
      });
    })
    return total.toFixed(1);
  }
}
