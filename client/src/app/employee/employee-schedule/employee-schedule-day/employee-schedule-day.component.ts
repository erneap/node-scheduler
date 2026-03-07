import { Component, Input } from '@angular/core';
import { IWorkday, Workday } from 'scheduler-node-models/scheduler/employees';
import { Workcenter } from 'scheduler-node-models/scheduler/sites/workcenters';
import { Workcode } from 'scheduler-node-models/scheduler/labor';
import { TeamService } from '../../../services/team-service';

@Component({
    selector: 'app-employee-schedule-day',
    imports: [],
    templateUrl: './employee-schedule-day.component.html',
    styleUrls: ['./employee-schedule-day.component.scss'],
})
export class EmployeeScheduleDayComponent {
  private _workday: Workday = new Workday();
  private _month: Date = new Date();
  @Input() 
  public set workday(wd: Workday) {
    if (!wd) {
      wd = new Workday();
    }
    this._workday = new Workday(wd);
  }
  get workday(): Workday {
    return this._workday;
  }
  @Input() 
  public set month(date: Date) {
    this._month = new Date(date);
  }
  get month(): Date {
    return this._month;
  }
  @Input() workcenters: Workcenter[] = [];
  @Input() width: number = 100;

  constructor(
    protected teamService: TeamService,
  ) { }

  getUTCDateClass() : string {
    const today = new Date();
    let classes = 'dayOfMonth ';
    if (this.workday && this.workday.date) {
      if (today.getFullYear() === this.workday.date.getUTCFullYear() 
        && today.getMonth() === this.workday.date.getUTCMonth()
        && today.getDate() === this.workday.date.getUTCDate()) {
        classes += "today";
      } else if (this.workday.date.getUTCDay() === 0 
        || this.workday.date.getUTCDay() === 6) {
        classes += "weekend";
      } else {
        classes += "weekday";
      }
    } else {
      classes += "weekday";
    }
    return classes;
  }

  getUTCDateStyles(): string {
    if (this.width > 100) {
      this.width = 100;
    }
    const cWidth = (this.width / 4);
    const fontSize = 1.1 * (cWidth / 25);
    return `height: ${cWidth}px;width: ${cWidth}px;font-size: ${fontSize}em;`;
  }

  getWorkdayStyle(): string {
    if (this.width > 100) {
      this.width = 100;
    }
    let bkColor = 'ffffff';
    let txColor = '000000';
    if (this.workday && this.workday.code !== "") {
      // find the workcode setting from the team
      const team = this.teamService.getTeam()
      if (team) {
        let found = false;
        for (let i=0; i < team.workcodes.length && !found; i++) {
          let wc: Workcode = team.workcodes[i];
          if (wc.id.toLowerCase() === this.workday.code.toLowerCase()) {
            found = true;
            bkColor = wc.backcolor;
            txColor = wc.textcolor;
            if (wc.backcolor.toLowerCase() === 'ffffff' 
              && this.workday.date?.getUTCMonth() !== this.month.getUTCMonth())  {
              bkColor = 'C0C0C0';
              txColor = '000000';
            }
          }
        }
      }
    } else if (this.workday?.date?.getUTCMonth() !== this.month.getUTCMonth()) {
      bkColor = 'C0C0C0';
      txColor = '000000';
    } else {
      bkColor = 'ffffff';
      txColor = '000000';
    }
    const style = `height: ${this.width}px;width: ${this.width}px;`
      + `background-color: #${bkColor};color: #${txColor};`;
    return style;
  }

  getWorkcenter(): string {
    if (this.workday) {
      let answer = '';
      this.workcenters.forEach(wc => {
        if (this.workday.workcenter === wc.id) {
          answer = wc.name;
        }
      });
      return answer;
    }
    return '';
  }

  getCodeStyle(): string {
    const fontSize = (this.width / 100) * 1.8;
    const height = (this.width / 100) * 35;
    return `height: ${height}px;font-size: ${fontSize}em;`;
  }

  getWorkcenterStyle(): string {
    const fontSize = (this.width / 100);
    const height = (this.width / 100) * 25;
    return `height: ${height}px;font-size: ${fontSize}em;`;
  }

  getDisplayDate(): string {
    if (this.workday.date) {
      return `${this.workday.date.getUTCDate()}`;
    } else {
      return '0';
    }
  }
}
