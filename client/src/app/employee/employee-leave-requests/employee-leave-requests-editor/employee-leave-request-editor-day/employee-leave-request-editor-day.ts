import { Component, Input, output } from '@angular/core';
import { ILeave, Leave } from 'scheduler-models/scheduler/employees';
import { Workcode } from 'scheduler-models/scheduler/labor';
import { TeamService } from '../../../../services/team-service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Team } from 'scheduler-models/scheduler/teams';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Holiday } from 'scheduler-models/scheduler/teams/company';

@Component({
  selector: 'app-employee-leave-request-editor-day',
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './employee-leave-request-editor-day.html',
  styleUrl: './employee-leave-request-editor-day.scss',
})
export class EmployeeLeaveRequestEditorDay {
  private _employee: string = '';
  private _request: string = '';
  private _leave: Leave = new Leave();
  @Input()
  get employee(): string {
    return this._employee;
  }
  set employee(id: string) {
    this._employee = id;
    this.setRequestDay();
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
    this.setLeaveDay();
  }
  changed = output<string>();
  leavecodes: Workcode[];
  holidays: Holiday[];
  hoursList: string[]
  dayForm: FormGroup;

  constructor(
    private teamService: TeamService,
    private builder: FormBuilder
  ) {
    this.leavecodes = [];
    this.holidays = [];
    this.hoursList = [];
    for (let i=1; i < 13; i++) {
      this.hoursList.push(i.toFixed(0));
    }
    this.dayForm = this.builder.group({
      code: '',
      hours: '0',
      tagday: '',
    });
  }

  setRequestDay() {
    this.leavecodes = [];
    this.holidays = [];
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      let company = '';
      let found = false;
      team.sites.forEach(site => {
        if (!found && site.employees) {
          site.employees.forEach(iEmp => {
            if (!found && iEmp._id?.toString() === this.employee) {
              found = true;
              company = iEmp.companyinfo.company;
            }
          })
        }
      });
      if (company !== '') {
        team.companies.forEach(co => {
          if (co.id.toLowerCase() === company.toLowerCase()) {
            if (co.holidays.length > 0) {
              co.holidays.forEach(hol => {
                this.holidays.push(new Holiday(hol));
              });
              this.holidays.sort((a,b) => a.compareTo(b));
            }
          }
        });
        team.workcodes.forEach(wc => {
          if (wc.isLeave && ((wc.id.toLowerCase() === 'h' && this.holidays.length > 0) 
            || wc.id.toLowerCase() !== 'h')) {
            this.leavecodes.push(new Workcode(wc));
          }
        })
      }
    }
  }

  setLeaveDay() {
    this.dayForm.get('code')?.setValue(this.leave.code);
    this.dayForm.get('hours')?.setValue(this.leave.hours.toFixed(0));
    this.dayForm.get('tagday')?.setValue(this.leave.tagday);
    if (this.holidays.length <= 0 || this.leave.code.toLowerCase() !== 'h') {
      this.dayForm.get('tagday')?.disable();
    } else {
      this.dayForm.get('tagday')?.enable();
    }
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
    this.leavecodes.forEach(wc => {
      if (this.leave.code.toLowerCase() === wc.id.toLowerCase()) {
        answer = `background-color: #${wc.backcolor};color: #${wc.textcolor};`;
      }
    });
    return answer;
  }

  onChange(field: string) {
    let chgString = `${this.employee}|${this.request}|day|`
      + `${this.leave.leavedate.getTime()}|`
      + `${field}|${this.dayForm.get(field)?.value}`;
    this.changed.emit(chgString);
  }
}
