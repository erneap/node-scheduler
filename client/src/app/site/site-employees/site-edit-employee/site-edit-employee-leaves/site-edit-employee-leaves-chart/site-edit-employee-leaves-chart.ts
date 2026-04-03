import { Component, Input, input, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EmployeeLeaveRequestEditorDay } 
  from '../../../../../employee/employee-leave-requests/employee-leave-requests-editor/employee-leave-request-editor-day/employee-leave-request-editor-day';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } 
  from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Employee, IEmployee, Leave } from 'scheduler-models/scheduler/employees';
import { Workcode } from 'scheduler-models/scheduler/labor';
import { Holiday } from 'scheduler-models/scheduler/teams/company';
import { AuthService } from '../../../../../services/auth-service';
import { EmployeeService } from '../../../../../services/employee-service';
import { SiteService } from '../../../../../services/site-service';
import { TeamService } from '../../../../../services/team-service';
import { MatDialog } from '@angular/material/dialog';
import { Team } from 'scheduler-models/scheduler/teams';
import { ConfirmationDialog } from '../../../../../general/confirmation-dialog/confirmation-dialog';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-site-edit-employee-leaves-chart',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    EmployeeLeaveRequestEditorDay
  ],
  templateUrl: './site-edit-employee-leaves-chart.html',
  styleUrl: './site-edit-employee-leaves-chart.scss',
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
export class SiteEditEmployeeLeavesChart {
  private _employee: string = '';
  @Input()
  get employee(): string {
    return this._employee;
  }
  set employee(id: string) {
    this._employee = id;
    this.setLeaves();
  }
  year = signal<number>(0);
  leaves = signal<Leave[]>([]);
  newLeaveForm: FormGroup;
  leavecodes = signal<Workcode[]>([]);
  tagcodes = signal<Holiday[]>([])

  constructor(
    private authService: AuthService,
    private empService: EmployeeService,
    private siteService: SiteService,
    private teamService: TeamService,
    private builder: FormBuilder,
    private dialog: MatDialog
  ) {
    this.newLeaveForm = this.builder.group({
      date: [ new Date(), [Validators.required ]],
      code: [ 'V', [Validators.required ]],
      hours: [ 8, [Validators.required, Validators.min(0), Validators.max(12)]],
      status: [ 'REQUESTED', [Validators.required ]],
      tagday: ''
    });
    const now = new Date();
    this.year.set(now.getFullYear());
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      const codeList: Workcode[] = [];
      const holidayList: Holiday[] = [];
      team.workcodes.forEach(code => {
        if (code.isLeave) {
          codeList.push(new Workcode(code));
        }
      });
      codeList.sort((a,b) => a.compareTo(b));
      this.leavecodes.set(codeList);

      // for holiday list, we first need the employee's company, so find the employee
      // then get his/her company identifier, then get the company's list of holidays.
      let companyid = '';
      team.sites.forEach(site => {
        if (companyid === '') {
          if (site.employees) {
            site.employees.forEach(emp => {
              if (companyid === '' && emp.id === this.employee) {
                companyid = emp.companyinfo.company;
              }
            });
          }
        }
      });
      team.companies.forEach(co => {
        if (co.id.toLowerCase() === companyid.toLowerCase()) {
          if (co.holidays && co.holidays.length > 0) {
            co.holidays.forEach(hol => {
              holidayList.push(new Holiday(hol));
            });
            holidayList.sort((a,b) => a.compareTo(b));
          }
        }
      });
      this.tagcodes.set(holidayList);
    }
    if (this.employee !== '') {
      this.setLeaves();
    }
  }

  setLeaves() {
    const leaves: Leave[] = [];
    // find employee and extract leaves for year
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      team.sites.forEach(site => {
        if (leaves.length === 0 && site.employees) {
          site.employees.forEach(emp => {
            if (leaves.length === 0 && emp.id === this.employee) {
              emp.leaves.forEach(lv => {
                if (lv.leavedate.getUTCFullYear() === this.year()) {
                  leaves.push(new Leave(lv));
                }
              });
            }
          });
        }
      });
    }
    leaves.sort((a,b) => b.compareTo(a));
    this.leaves.set(leaves);
  }

  leaveDisplayStyle(): string {
    const height = window.innerHeight - 380;
    return `height: ${height}px;max-height: ${height}px;`;
  }

  onChange(change: string) {
    const parts = change.split('|');
    if (parts.length > 3) {
      const action = parts[3];
      if (action.toLowerCase() === 'delete') {
        const dialogRef = this.dialog.open(ConfirmationDialog, {
          data: {
            title: 'Leave Delete Confirmation',
            message: 'Are you sure you want to delete this leave?',
            negativeButtonTitle: 'No',
            affirmativeButtonTitle: 'Yes'
          }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result.toLowerCase() === 'yes') {
            this.empService.deleteLeave(this.employee, Number(parts[1])).subscribe({
              next: (res) => {
                const iEmp = (res.body as IEmployee);
                if (iEmp) {
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
                  this.setLeaves();
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
        });
      } else {
        this.empService.updateLeave(this.employee, Number(parts[1]), action, parts[4])
          .subscribe({
          next: (res) => {
            const iEmp = (res.body as IEmployee);
            if (iEmp) {
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
              this.setLeaves();
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

  onAdd() {
    const lvDate = new Date(this.newLeaveForm.get('date')?.value);
    const code = this.newLeaveForm.get('code')?.value;
    const hours = Number(this.newLeaveForm.get('hours')?.value);
    const status = this.newLeaveForm.get('status')?.value;
    this.empService.addLeave(this.employee, lvDate, code, hours, status).subscribe({
      next: (res) => {
        const iEmp = (res.body as IEmployee);
        if (iEmp) {
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
          this.setLeaves();
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

  onClear() {
    this.newLeaveForm.get('date')?.setValue(new Date());
    this.newLeaveForm.get('code')?.setValue('V');
    this.newLeaveForm.get('hours')?.setValue(8);
    this.newLeaveForm.get('status')?.setValue('REQUESTED');
    this.newLeaveForm.get('tagday')?.setValue('');
  }

  updateYear(direction: string) {
    let year = this.year();
    if (direction.substring(0,1).toLowerCase() === 'u') {
      year++;
    } else if (direction.substring(0,1).toLowerCase() === 'd') {
      year--;
    }
    this.year.set(year);
    this.setLeaves();
  }
}
