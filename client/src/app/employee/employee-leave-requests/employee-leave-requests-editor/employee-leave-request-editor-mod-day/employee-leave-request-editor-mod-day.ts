import { Component, Input, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Employee, ILeave, Leave } from 'scheduler-models/scheduler/employees';
import { Workcode } from 'scheduler-models/scheduler/labor';
import { Workcenter } from 'scheduler-models/scheduler/sites/workcenters/workcenter';
import { TeamService } from '../../../../services/team-service';
import { Team } from 'scheduler-models/scheduler/teams';

@Component({
  selector: 'app-employee-leave-request-editor-mod-day',
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './employee-leave-request-editor-mod-day.html',
  styleUrl: './employee-leave-request-editor-mod-day.scss',
})
export class EmployeeLeaveRequestEditorModDay {
  private _employee: string = '';
  private _request: string = '';
  private _leave: Leave = new Leave();
  @Input()
  get employee(): string {
    return this._employee;
  }
  set employee(id: string) {
    this._employee = id;
    this.setEmployee();
  }
  @Input()
  get request(): string {
    return this._request;
  }
  set request(id: string) {
    this._request = id;
    //this.setRequest();
  }
  @Input()
  get leave(): Leave {
    return this._leave;
  }
  set leave(lv: ILeave) {
    this._leave = new Leave(lv);
    this.setModTime();
  }
  changed = output<string>();
  workcodes: Workcode[];
  workcenters: Workcenter[];
  hoursList: string[]
  dayForm: FormGroup;

  constructor(
    private teamService: TeamService,
    private builder: FormBuilder
  ) {
    this.workcenters = [];
    this.workcodes = [];
    this.hoursList = [];
    for (let i=1; i < 13; i++) {
      this.hoursList.push(i.toFixed(0));
    }
    this.dayForm = this.builder.group({
      code: '',
      hours: '0',
      workcenter: '',
    });
  }

  setEmployee() {
    this.workcenters = [];
    this.workcodes = [];
    if (this.employee !== '') {
      const iTeam = this.teamService.getTeam()
      if (iTeam) {
        const team = new Team(iTeam);
        team.workcodes.forEach(wc => {
          if (!wc.isLeave) {
            this.workcodes.push(new Workcode(wc))
          }
        });
        this.workcodes.sort((a,b) => a.compareTo(b));
        let found = false;
        team.sites.forEach(site => {
          if (!found && site.employees) {
            site.employees.forEach(iEmp => {
              if (!found) {
                const emp = new Employee(iEmp);
                if (emp.id === this.employee) {
                  found = true;
                  site.workcenters.forEach(wc => {
                    this.workcenters.push(new Workcenter(wc));
                  })
                }
              }
            });
          }
        });
      }
    }
  }

  setModTime() {
    this.dayForm.get('code')?.setValue(this.leave.code);
    this.dayForm.get('hours')?.setValue(this.leave.hours);
    this.dayForm.get('workcenter')?.setValue(
      (this.leave.tagday) ? this.leave.tagday : '');
  }

  getDayDate(): string {
    const formatter = new Intl.DateTimeFormat('en-US',
      { year: '2-digit',
        month: '2-digit',
        day: '2-digit'
      }
    );
    return formatter.format(this.leave.leavedate);
  }

  getDayStyle(): string {
    let answer = 'background-color: white;color: black;';
    this.workcodes.forEach(wc => {
      if (this.leave.code.toLowerCase() === wc.id.toLowerCase()) {
        answer = `background-color: #${wc.backcolor};color: #${wc.textcolor};`;
      }
    });
    return answer;
  }

  onChange() {
    let chgString = `${this.employee}|${this.request}|day|`
      + `${this.leave.leavedate.getTime()}|`
      + `${this.dayForm.get('code')?.value}|`
      + `${this.dayForm.get('hours')?.value}|`;
    if (this.dayForm.get('workcenter') && this.dayForm.get('workcenter')?.value) {
      chgString += `${this.dayForm.get('workcenter')?.value}`;
    }
    this.changed.emit(chgString);
  }
}
