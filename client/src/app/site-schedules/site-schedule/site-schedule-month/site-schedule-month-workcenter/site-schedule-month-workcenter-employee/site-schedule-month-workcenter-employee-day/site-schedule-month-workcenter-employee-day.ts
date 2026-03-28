import { Component, input } from '@angular/core';
import { Employee } from 'scheduler-models/scheduler/employees';
import { TeamService } from '../../../../../../services/team-service';
import { Team } from 'scheduler-models/scheduler/teams';

@Component({
  selector: 'app-site-schedule-month-workcenter-employee-day',
  imports: [],
  templateUrl: './site-schedule-month-workcenter-employee-day.html',
  styleUrl: './site-schedule-month-workcenter-employee-day.scss',
})
export class SiteScheduleMonthWorkcenterEmployeeDay {
  employee = input<Employee>(new Employee());
  date = input<Date>(new Date());
  row = input<string>('even');

  constructor(
    private teamService: TeamService
  ) { }

  dayStyle(): string {
    let bkColor = 'ffffff';
    let txColor = '000000';
    let brColor = '000000';
    if (this.employee().id === '') {
      bkColor = '99ccff';
    }
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      const wd = this.employee().getWorkday(this.date());
      if (wd) {
        team.workcodes.forEach(wc => {
          if (wc.id.toLowerCase() === wd.code.toLowerCase()) {
            bkColor = wc.backcolor;
            txColor = wc.textcolor;
          }
        });
      }
    }

    if (this.row().toLowerCase() === 'label' || this.row().toLowerCase() === 'day') {
      bkColor = '000000';
      txColor = 'ffffff';
      if (this.date().getUTCDay() === 0 || this.date().getUTCDay() === 6) {
        bkColor = 'a9a9a9';
        txColor = '000000';
      }
    } else if (bkColor === 'ffffff') {
      if (this.date().getUTCDay() === 0 || this.date().getUTCDay() === 6) {
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

  dayValue(): string {
    const weekdays = new Array("Su", "Mo", "Tu", "We", "Th", "Fr", "Sa");
    if (this.row().toLowerCase() === 'label' || this.row().toLowerCase() === 'day' ) {
      if (this.row().toLowerCase() === 'label') {
        return `${this.date().getUTCDate()}`;
      } 
      return weekdays[this.date().getUTCDay()];
    }
    const wd = this.employee().getWorkday(this.date());
    return (wd) ? wd.code : '';
  }
}
