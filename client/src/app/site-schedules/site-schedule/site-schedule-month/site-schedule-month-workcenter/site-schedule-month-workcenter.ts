import { Component, input, Input } from '@angular/core';
import { Employee } from 'scheduler-models/scheduler/employees';
import { Workcenter } from 'scheduler-models/scheduler/sites/workcenters/workcenter';
import { SiteScheduleMonthWorkcenterEmployee } from './site-schedule-month-workcenter-employee/site-schedule-month-workcenter-employee';

@Component({
  selector: 'app-site-schedule-month-workcenter',
  imports: [
    SiteScheduleMonthWorkcenterEmployee
  ],
  templateUrl: './site-schedule-month-workcenter.html',
  styleUrl: './site-schedule-month-workcenter.scss',
})
export class SiteScheduleMonthWorkcenter {
  private _workcenter: Workcenter = new Workcenter();
  private _employeeList: Employee[] = [];
  @Input()
  get workcenter(): Workcenter {
    return this._workcenter;
  }
  set workcenter(wkctr: Workcenter) {
    this._workcenter = new Workcenter(wkctr);
  }
  @Input()
  get employees(): Employee[] {
    return this._employeeList;
  }
  set employees(list: Employee[]) {
    this._employeeList = [];
    list.forEach(emp => {
      this._employeeList.push(new Employee(emp))
    });
  }
  date = input<Date>(new Date());

  setWorkcenter() {
    if (this.workcenter.id !== '' && this.employees.length > 0) {
      this.employees.forEach(emp => {
        this.workcenter.assign(emp, this.date());
      });
    }
  }
}
