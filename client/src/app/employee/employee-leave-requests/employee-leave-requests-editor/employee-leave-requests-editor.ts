import { Component, Input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { MatButtonModule } from '@angular/material/button';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Leave, LeaveRequest } from 'scheduler-models/scheduler/employees';
import { Workcode } from 'scheduler-models/scheduler/labor';
import { EmployeeService } from '../../../services/employee-service';
import { SiteService } from '../../../services/site-service';
import { TeamService } from '../../../services/team-service';
import { Team } from 'scheduler-models/scheduler/teams';
import { EmployeeLeaveRequestEditorDay } from './employee-leave-request-editor-day/employee-leave-request-editor-day';

@Component({
  selector: 'app-employee-leave-requests-editor',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatTooltipModule,
    ReactiveFormsModule,
    EmployeeLeaveRequestEditorDay
  ],
  templateUrl: './employee-leave-requests-editor.html',
  styleUrl: './employee-leave-requests-editor.scss',
  providers: [
    { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: true } },
    {
        provide: DateAdapter,
        useClass: MomentDateAdapter,
        deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
  ]
})
export class EmployeeLeaveRequestsEditor {
  private _employee: string = '';
  private _request: string = '';
  @Input()
  get employee(): string {
    return this._employee;
  }
  set employee(id: string) {
    this._employee = id;
    this.setRequest();
  }
  @Input()
  get request(): string {
    return this._request;
  }
  set request(id: string) {
    this._request = id;
    this.setRequest();
  }
  changed = output<string>();
  leavecodes: Workcode[];
  requestForm: FormGroup;
  currentRequest = signal<LeaveRequest>(new LeaveRequest());

  constructor(
    private empService: EmployeeService,
    private siteService: SiteService,
    private teamService: TeamService,
    private builder: FormBuilder
  ) {
    const now = new Date();
    this.requestForm = this.builder.group({
      start: [now, [Validators.required]],
      end: [now, [Validators.required]],
      primarycode: ['V', [Validators.required]],
      comment: ''
    });
    const iTeam = this.teamService.getTeam();
    this.leavecodes = [];
    if (iTeam) {
      const team = new Team(iTeam);
      team.workcodes.forEach(wc => {
        if (wc.isLeave) {
          this.leavecodes.push(new Workcode(wc));
        }
      });
      this.leavecodes.sort((a,b) => a.compareTo(b));
    }
  }

  setRequest() {
    if (this.employee !== '' && this.request !== '') {
      const team = this.teamService.getTeam();
      if (team) {
        let found = false;
        team.sites.forEach(site => {
          if (!found && site.employees) {
            site.employees.forEach(emp => {
              if (!found && emp.id === this.employee) {
                found = true;
                emp.requests.forEach(request => {
                  if (request.id === this.request) {
                    this.currentRequest.set(new LeaveRequest(request));
                    this.requestForm.get('start')?.setValue(request.startdate);
                    this.requestForm.get('end')?.setValue(request.enddate);
                    this.requestForm.get('primarycode')?.setValue(request.primarycode);
                  }
                });
              }
            });
          }
        });
      }
    } else {
      this.currentRequest.set(new LeaveRequest());
      const now = new Date();
      this.requestForm.get('start')?.setValue(now);
      this.requestForm.get('end')?.setValue(now);
      this.requestForm.get('primarycode')?.setValue('V');
    }
  }

  onDayChange(evt: string) {
    console.log(evt);
    this.changed.emit(evt);
  }

  onChange(field: string) {
    const value = this.requestForm.get(field)?.value;
    if (field.toLowerCase() === 'start') {
      const tValue = new Date(value);
      const other = this.requestForm.get('end')?.value;
      const oValue = new Date(other);
      if (oValue.getTime() < tValue.getTime()) {
        if (this.request !== '') {
          const chgString = `${this.employee}|${this.request}|end|${value}`;
          this.changed.emit(chgString);
        }
        this.requestForm.get('end')?.setValue(value);
      }
    } else if (field.toLowerCase() === 'end') {
      const tValue = new Date(value);
      const other = this.requestForm.get('start')?.value;
      const oValue = new Date(other);
      if (oValue.getTime() > tValue.getTime()) {
        if (this.request !== '') {
          const chgString = `${this.employee}|${this.request}|start|${value}`;
          this.changed.emit(chgString);
        }
        this.requestForm.get('start')?.setValue(value);
      }
    }
    if (this.request !== '') {
      const chgString = `${this.employee}|${this.request}|${field}|${value}`;
      console.log(chgString);
      this.changed.emit(chgString);
    }
  }
}
