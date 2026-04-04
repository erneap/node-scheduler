import { Component, Input, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { Assignment, Employee, IEmployee, Schedule } from 'scheduler-models/scheduler/employees';
import { LaborCode, Workcode } from 'scheduler-models/scheduler/labor';
import { Workcenter } from 'scheduler-models/scheduler/sites/workcenters/workcenter';
import { AuthService } from '../../../../../services/auth-service';
import { EmployeeService } from '../../../../../services/employee-service';
import { SiteService } from '../../../../../services/site-service';
import { TeamService } from '../../../../../services/team-service';
import { Team } from 'scheduler-models/scheduler/teams';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { SiteEditEmployeeAssignmentEditorSchedule } from './site-edit-employee-assignment-editor-schedule/site-edit-employee-assignment-editor-schedule';
import { SiteEditEmployeeAssignmentEditorLabor } from './site-edit-employee-assignment-editor-labor/site-edit-employee-assignment-editor-labor';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from '../../../../../general/confirmation-dialog/confirmation-dialog';

interface AssignmentData {
  assignmentID: number;
  start: Date;
  end: Date;
  workcenter: string;
}

@Component({
  selector: 'app-site-edit-employee-assignment-editor',
  imports: [
    FormField,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatButtonModule,
    MatTooltip,
    SiteEditEmployeeAssignmentEditorSchedule,
    SiteEditEmployeeAssignmentEditorLabor
  ],
  templateUrl: './site-edit-employee-assignment-editor.html',
  styleUrl: './site-edit-employee-assignment-editor.scss',
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
export class SiteEditEmployeeAssignmentEditor {
  // allow for the input of the employee id from the selector
  private _employee: string = '';
  @Input()
  get employee(): string {
    return this._employee;
  }
  set employee(id: string) {
    this._employee = id;
    this.setAssignments();
    this.selectedAssignment.set(new Assignment(this.assignments()[0]));
    this.setAssignment();
  }

  // create the model and form objects for using data from the page
  assignmentModel = signal<AssignmentData>({
    assignmentID: -1,
    start: new Date(),
    end: new Date(),
    workcenter: ''
  });
  assignmentForm = form(this.assignmentModel, (schemaPath) => {
    required(schemaPath.workcenter, {message: 'A workcenter is required'});
    required(schemaPath.start, { message: 'Start Date required'})
  });

  // get the rest of the data for the employee and display to include the list of current
  // employee assignments, workcodes, workcenters, and available labor codes for the
  // assignment. Only the assignments list will be pulled on input, the rest will be 
  // created on contruction of this page.
  assignments = signal<Assignment[]>([]);
  workcodes = signal<Workcode[]>([]);
  workcenters = signal<Workcenter[]>([]);
  laborcodes = signal<LaborCode[]>([]);
  schedules = signal<string[]>([]);
  selectedAssignment = signal<Assignment>(new Assignment());
  schedule = signal<Schedule>(new Schedule());
  site = signal<string>('');

  constructor(
    private authService: AuthService,
    private empService: EmployeeService,
    private siteService: SiteService,
    private teamService: TeamService, 
    private dialog: MatDialog
  ) {
    // workcodes are derived from the employee's team, while the workcenters and labor
    // codes are derived from the employee's site.  So get the team and pull in the work
    // (not leave) codes, then find the employee in the various sites' employee list and
    // when found, create the workcenter and laborcode lists from the associated site.
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      const wlist: Workcode[] = [];
      team.workcodes.forEach(wc => {
        if (!wc.isLeave) {
          wlist.push(new Workcode(wc));
        }
      });
      wlist.sort((a,b) => a.compareTo(b));
      this.workcodes.set(wlist);
    }
  }

  /**
   * This method will be called to compile the list of employee assignments and put them
   * in the holder for display in the page for selection.  To get the list from the
   * employee identifier:
   * STEPS:
   * 1) pull the team object from the service
   * 2) Find the employee in the team's sites' employee lists
   * 3) compile the list, then sort in reverse order, newest first.
   * 4) place in the holder for display
   */
  setAssignments() {
    const asgmtList: Assignment[] = [];
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      let found = false;
      const now = new Date();
      const start = new Date(Date.UTC(now.getFullYear() - 1, 0, 1));
      const end = new Date(Date.UTC(now.getFullYear() + 2, 0, 1));
      team.sites.forEach(site => {
        if (!found && site.employees) {
          site.employees.forEach(iEmp => {
            if (!found) {
              const emp = new Employee(iEmp);
              if (emp.id === this.employee) {
                found = true;
                this.site.set(site.id);
                const codes = site.getCurrentLaborCodes(start, end);
                codes.sort((a,b) => a.compareTo(b));
                this.laborcodes.set(codes);

                const wclist: Workcenter[] = [];
                site.workcenters.forEach(wc => {
                  wclist.push(new Workcenter(wc));
                });
                wclist.sort((a,b) => a.compareTo(b));
                this.workcenters.set(wclist);
                emp.assignments.forEach(asgmt => {
                  asgmtList.push(new Assignment(asgmt));
                });
                asgmtList.sort((a,b) => b.compareTo(a));
                this.assignments.set(asgmtList);
              }
            }
          })
        }
      });
    }
  }

  /**
   * this method is used to set up the input form and to assigned the various display
   * elements like schedule and labor code list.
   */
  setAssignment() {
    if (this.selectedAssignment().id >= 0) {
      this.assignmentForm.assignmentID().value.set(this.selectedAssignment().id);
      this.assignmentForm.workcenter().value.set(this.selectedAssignment().workcenter);
      this.assignmentForm.start().value.set(new Date(this.selectedAssignment().startDate));
      this.assignmentForm.end().value.set(new Date(this.selectedAssignment().endDate));
      const schList: string[] = [];
      this.selectedAssignment().schedules.forEach(sch => {
        schList.push(`${sch.id}`);
      });
      this.schedules.set(schList);
      const schid = this.schedule().id;
      if (schid >= 0) {
        let found = false;
        this.selectedAssignment().schedules.forEach(sch => {
          if (sch.id === schid) {
            found = true;
            this.schedule.set(new Schedule(sch));
          }
        });
        if (!found) {
          this.schedule.set(this.selectedAssignment().schedules[0]);
        }
      } else {
        this.schedule.set(new Schedule(this.selectedAssignment().schedules[0]));
      }
    } else {
      this.assignmentForm.assignmentID().value.set(-1);
      this.assignmentForm.workcenter().value.set('');
      this.assignmentForm.start().value.set(new Date());
      this.assignmentForm.end().value.set(new Date());
      this.schedules.set([]);
      this.schedule.set(new Schedule());
    }
  }

  selectAssignment() {
    const id = this.assignmentForm.assignmentID().value()
    if (id >= 0) {
      this.assignments().forEach(asgmt => {
        if (asgmt.id === id) {
          this.selectedAssignment.set(new Assignment(asgmt));
          this.schedule.set(new Schedule(this.selectedAssignment().schedules[0]));
          this.setAssignment();
        }
      });
    } else {
      this.selectedAssignment.set(new Assignment());
      this.schedule.set(new Schedule());
      this.setAssignment();
    }
  }

  getAssignmentLabel(asgmt: Assignment): string {
    let answer = '';
    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
    answer = `(${asgmt.site.toUpperCase()}) ${formatter.format(asgmt.startDate)} - `;
    if (asgmt.endDate.getFullYear() < 9000) {
      answer += `${formatter.format(asgmt.endDate)}`;
    }
    return answer;
  }

  changeAssignment(field: string) {
    const id = this.assignmentForm.assignmentID().value();
    if (id < 0) {
      if (field.toLowerCase() === 'add') {
        const workcenter = this.assignmentForm.workcenter().value();
        const start = new Date(this.assignmentForm.start().value());
        this.empService.addAssignment(this.employee, this.site(), workcenter, start)
          .subscribe({
          next: (res) => {
            const iEmp = res.body as IEmployee;
            if (iEmp) {
              const employee = this.useEmployeeResponse(iEmp);
              this.setAssignments()
              const asgmt = employee.assignments[employee.assignments.length - 1];
              this.selectedAssignment.set(asgmt);
              this.setAssignment();
            }
          },
          error: (err) => {
            if (err instanceof HttpErrorResponse) {
              if (err.status >= 400 && err.status < 500) {
                this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
              }
            }
          }
        })
      }
    } else if (field.toLowerCase() === 'delete') {
    } else {
      let value = '';
      switch (field.toLowerCase()) {
        case "workcenter":
          value = this.assignmentForm.workcenter().value();
          break;
        case "start":
          const start = new Date(this.assignmentForm.start().value());
          value = this.convertDateToString(start);
          break;
        case "end":
          const end = new Date(this.assignmentForm.end().value());
          value = this.convertDateToString(end);
          break;
      }
      this.empService.updateAssignment(this.employee, this.selectedAssignment().id, 
        field, value).subscribe({
          next: (res) => {
            const iEmp = res.body as IEmployee;
            if (iEmp) {
              const employee = this.useEmployeeResponse(iEmp);
              this.setAssignments()
              employee.assignments.forEach(asgmt => {
                if (asgmt.id === this.selectedAssignment().id) {
                  this.selectedAssignment.set(asgmt);
                  this.setAssignment();
                }
              })
            }
          },
          error: (err) => {
            if (err instanceof HttpErrorResponse) {
              if (err.status >= 400 && err.status < 500) {
                this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
              }
            }
          }
      });
    }
  }

  convertDateToString(date: Date): string {
    let answer = `${date.getUTCFullYear()}-`;
    if (date.getUTCMonth() + 1 < 10) {
      answer += '0';
    }
    answer += `${date.getUTCMonth() + 1}-`;
    if (date.getUTCDate() < 10) {
      answer += '0';
    }
    answer += `${date.getUTCDate()}`;
    return answer;
  }

  useEmployeeResponse(iEmp: IEmployee): Employee {
    const employee = new Employee(iEmp);
    const tEmp = this.empService.getEmployee();
    if (tEmp && tEmp.id === employee.id) {
      this.empService.setEmployee(employee);
    }
    const tSite = this.siteService.getSite();
    let found = false;
    if (tSite && tSite.employees) {
      tSite.employees.forEach((emp, e) => {
        if (!found && emp.id === employee.id && tSite.employees) {
          tSite.employees[e] = new Employee(employee);
          found = true;
          this.siteService.setSite(tSite);
        }
      });
    }
    found = false;
    const tTeam = this.teamService.getTeam();
    if (tTeam) {
      tTeam.sites.forEach((site, s) => {
        if (!found && site.employees) {
          site.employees.forEach((emp, e) => {
            if (!found && emp.id === employee.id && site.employees) {
              site.employees[e] = new Employee(employee);
              found = true;
              this.teamService.setTeam(tTeam);
            }
          });
        }
      });
    }
    return employee;
  }

  onChanged(chg: string) {
    console.log(chg);
    const parts = chg.split('|');
    const action = parts[1];
    const schid = Number(parts[0]);
    let workday: number | undefined = undefined;
    let field = '';
    let value = '';
    switch (action.toLowerCase()) {
      case "addsch":
        field = 'addschedule';
        value = '7';
        break;
      case "chgsch":
        field = '';
        this.selectedAssignment().schedules.forEach(sch => {
          if (sch.id === schid) {
            this.schedule.set(sch);
          }
        });
        break;
      case "chgdays":
        field = 'scheduledays';
        value = parts[2];
        break;
      case "delsch":
        const dialogRef = this.dialog.open(ConfirmationDialog, {
          data: {
            title: 'Assignment Schedule Delete Confirmation',
            message: 'Are you sure you want to delete this Assignment Schedule?',
            negativeButtonTitle: 'No',
            affirmativeButtonTitle: 'Yes'
          }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result.toLowerCase() === 'yes') {
            field = 'removeschedule';
          }
        });
        break;
      case "day":
        workday = Number(parts[2]);
        field = `workday-${parts[3]}`;
        if (parts.length > 4) {
          value = parts[4];
        }
        break;
    }
    if (field !== '') {
      this.empService.updateAssignment(this.employee, this.selectedAssignment().id, field, 
        value, schid, workday).subscribe({
        next: (res) => {
          const iEmp = res.body as IEmployee;
          if (iEmp) {
            const employee = this.useEmployeeResponse(iEmp);
            this.setAssignments()
            employee.assignments.forEach(asgmt => {
              if (asgmt.id === this.selectedAssignment().id) {
                this.selectedAssignment.set(asgmt);
                this.setAssignment();
              }
            });
          }
        },
        error: (err) => {
          if (err instanceof HttpErrorResponse) {
            if (err.status >= 400 && err.status < 500) {
              this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
            }
          }
        }
      });
    }
  }
}
