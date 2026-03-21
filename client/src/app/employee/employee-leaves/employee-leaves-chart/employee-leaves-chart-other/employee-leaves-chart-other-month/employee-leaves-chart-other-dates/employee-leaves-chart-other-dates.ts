import { Component, Input } from '@angular/core';
import { Leave } from 'scheduler-models/scheduler/employees';
import { TeamService } from '../../../../../../services/team-service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-employee-leaves-chart-other-dates',
  imports: [
    MatTooltipModule
  ],
  templateUrl: './employee-leaves-chart-other-dates.html',
  styleUrl: './employee-leaves-chart-other-dates.scss',
})
export class EmployeeLeavesChartOtherDates {
  private _leaves: Leave[] = [];
  private _employee: string = '';
  tooltip = '';
  @Input()
  get leaves(): Leave[] {
    return this._leaves;
  }
  set leaves(lvs: Leave[]) {
    this._leaves = [];
    lvs.forEach(lv => {
      this._leaves.push(new Leave(lv));
    });
    this._leaves.sort((a,b) => a.compareTo(b));
  }
  @Input()
  get employee(): string {
    return this._employee;
  }
  set employee(id: string) {
    this._employee = id;
  }

  constructor(
    private teamService: TeamService
  ) { }

  getStyle(): string {
    let answer = 'background-color: white;color: black;';
    const team = this.teamService.getTeam();
    if (team && this._leaves.length > 0) {
      const lv = this._leaves[0];
      team.workcodes.forEach(wc => {
        if (wc.id.toLowerCase() === lv.code.toLowerCase()) {
          answer = `color: #${wc.textcolor};background-color: #${wc.backcolor};`;
          this.tooltip = wc.title;
          if (wc.id.toLowerCase() === 'v') {
            if (lv.status.toLowerCase() === 'actual') {
              answer = `background-color: white;color: black;`;
            }
          }
        }
      })
    }
    return answer;
  }

  showHours(): boolean {
    let answer = false;
    const team = this.teamService.getTeam();
    if (team && this.employee !== '') {
      team.sites.forEach(site => {
        if (!answer && site.employees) {
          site.employees.forEach(emp => {
            const lv = this._leaves[0];
            if (emp.id === this.employee) {
              const std = emp.getStandardWorkday(lv.leavedate);
              answer = lv.hours < std;
            }
          });
        }
      });
    }
    return answer;
  }

  getHours(): string {
    const lv = this._leaves[0];
    if (Math.floor(lv.hours) === lv.hours) {
      return lv.hours.toFixed(0);
    }
    return lv.hours.toFixed(1);
  }
}
