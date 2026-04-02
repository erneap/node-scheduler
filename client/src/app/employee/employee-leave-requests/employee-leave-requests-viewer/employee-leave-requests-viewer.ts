import { Component, Input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { List } from '../../../general/list/list';
import { EmployeeLeaveRequestsEditor } from '../employee-leave-requests-editor/employee-leave-requests-editor';
import { Item } from '../../../general/list/list.model';
import { AuthService } from '../../../services/auth-service';
import { EmployeeService } from '../../../services/employee-service';
import { SiteService } from '../../../services/site-service';
import { TeamService } from '../../../services/team-service';
import { MatDialog } from '@angular/material/dialog';
import { Employee, IEmployee, LeaveRequest } from 'scheduler-models/scheduler/employees';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmationDialog, DialogData } from '../../../general/confirmation-dialog/confirmation-dialog';
import { MessageDialog } from '../../../general/message-dialog/message-dialog';

@Component({
  selector: 'app-employee-leave-requests-viewer',
  imports: [
    MatButtonModule,
    List,
    EmployeeLeaveRequestsEditor
  ],
  templateUrl: './employee-leave-requests-viewer.html',
  styleUrl: './employee-leave-requests-viewer.scss',
})
export class EmployeeLeaveRequestsViewer {
  private _employee: string = '';
  @Input()
  get employee(): string {
    return this._employee;
  }
  set employee(id: string) {
    this._employee = id;
    this.setEmployee();
  }
  requests = signal<Item[]>([]);
  selectedItem = signal<string>('');
  refreshEditor = signal<boolean>(false);
  createdOn = signal<string>('');
  requestStatus = signal<string>('');
  approvedBy  = signal<string>('');
  approvedOn  = signal<string>('');
  ptoHours  = signal<string>('');
  holidayHours  = signal<string>('');
  showSubmit = signal<boolean>(true);
  showApprover = signal<boolean>(false);
  siteid = signal<string>('');

  constructor(
    private authService: AuthService,
    private empService: EmployeeService,
    private siteService: SiteService,
    private teamService: TeamService,
    private dialog: MatDialog
  ) {
    if (this.employee === '') {
      const iEmp = this.empService.getEmployee();
      if (iEmp) {
        const emp = new Employee(iEmp);
        this.employee = emp.id;
      }
    }
  }

  setEmployee() {
    const list: Item[] = [];
    list.push({
      id: '',
      value: 'Add New Request'
    });
    const formatter = new Intl.DateTimeFormat('en-US',
      { year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }
    );
    if (this.employee !== '') {
      const team = this.teamService.getTeam();
      if (team) {
        let found = false;
        team.sites.forEach(site => {
          if (!found && site.employees) {
            site.employees.forEach(emp => {
              if (!found && emp.id === this.employee) {
                found = true;
                this.siteid.set(emp.site);
                const now = new Date();
                emp.requests.sort((a,b) => b.compareTo(a));
                emp.requests.forEach(request => {
                  if (request.startdate.getTime() > now.getTime()
                    || request.enddate.getTime() > now.getTime()) {
                    const label = `${formatter.format(request.startdate)}-`
                      + `${formatter.format(request.enddate)}`;
                    list.push({
                      id: request.id,
                      value: label
                    });
                  }
                });
              }
            });
          }
        });
      }
    }
    this.requests.set(list);
  }

  showApproval(): boolean {
    if (this.employee !== '') {
      let approver = false;
      let siteid = '';
      const iEmp = this.empService.getEmployee();
      if (iEmp) {
        const emp = new Employee(iEmp);
        siteid = emp.site;
        if (emp.user) {
          approver = ((emp.user.hasPermission('scheduler', 'scheduler')
            || emp.user.hasPermission('scheduler', 'siteleader'))
            && emp.id !== this.employee && this.siteid() === siteid);
        }
      }
      return approver;
    }
    return false;
  }

  onSelect(id: string) {
    this.selectedItem.set(id);
    const formatter = new Intl.DateTimeFormat('en-US',
      { year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }
    );
    this.createdOn.set('');
    this.requestStatus.set('');
    this.approvedBy.set('');
    this.approvedOn.set('');
    this.ptoHours.set('');
    this.holidayHours.set('');
    if (this.employee !== '') {
      let approver = false;
      let siteid = '';
      const iEmp = this.empService.getEmployee();
      if (iEmp) {
        const emp = new Employee(iEmp);
        siteid = emp.site;
        if (emp.user) {
          approver = (emp.user.hasPermission('scheduler', 'scheduler')
            || emp.user.hasPermission('scheduler', 'siteleader'));
        }
      }
      const team = this.teamService.getTeam();
      if (team) {
        let found = false;
        team.sites.forEach(site => {
          if (!found && site.employees) {
            site.employees.forEach(emp => {
              if (!found && emp.id === this.employee) {
                found = true;
                emp.requests.forEach(request => {
                  if (request.id === id) {
                    this.setRequest(request);
                  }
                })
              }
            });
          }
        });
      }
    }
  }

  setRequest(request: LeaveRequest) {
    const formatter = new Intl.DateTimeFormat('en-US',
      { year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }
    );
    this.showSubmit.set(request.status.toLowerCase() === 'draft');
    this.createdOn.set(formatter.format(request.requestDate));
    this.requestStatus.set(request.status.toUpperCase());
    this.approvedBy.set(this.getApprovedBy(request.approvedby));
    if (request.approvedby !== '') {
      this.approvedOn.set(formatter.format(request.approvalDate));
    } else {
      this.approvedOn.set('-');
    }
    let ptoHours = 0;
    let holHours = 0;
    request.requesteddays.forEach(day => {
      if (day.code.toLowerCase() === 'v') {
        ptoHours += day.hours;
      }
      if (day.code.toLowerCase() === 'h') {
        holHours += day.hours;
      }
    });
    if (Math.floor(ptoHours) === ptoHours) {
      this.ptoHours.set(ptoHours.toFixed(0));
    } else {
      this.ptoHours.set(ptoHours.toFixed(1));
    }
    if (Math.floor(holHours) === holHours) {
      this.holidayHours.set(holHours.toFixed(0));
    } else {
      this.holidayHours.set(holHours.toFixed(1));
    }
    this.showSubmit.set(false);
    this.showApprover.set(false);
    if (request.status.toLowerCase() === 'draft') {
      this.showSubmit.set(true);
    }
    if (request.status.toLowerCase() === 'requested'
      && this.showApproval()) {
      this.showApprover.set(true);
    }
  }

  getApprovedBy(id: string): string {
    const site = this.siteService.getSite();
    if (site) {
      if (site.employees) {
        let answer = '-';
        site.employees.forEach(iEmp => {
          const emp = new Employee(iEmp);
          if (emp.id === id) {
            answer = emp.name.getFirstLast();
          }
        });
        return answer;
      }
    }
    return '-';
  }

  onChanged(evt: string) {
    const parts = evt.split('|');
    let employeeid = '';
    let requestid = '';
    let element = '';
    if (parts.length > 2) {
      employeeid = parts[0];
      requestid = parts[1];
      element = parts[2]
    }
    switch (element.toLowerCase()) {
      case "add":
        if (parts.length > 6) {
          const start = new Date(Number(parts[3]));
          const end = new Date(Number(parts[4]));
          this.empService.addLeaveRequest(employeeid, start, end, parts[5], 
            parts[6]).subscribe({
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
                this.setEmployee();
                employee.requests.forEach(request => {
                  if (request.startdate.getTime() === start.getTime()) {
                    this.selectedItem.set(request.id);
                    this.showSubmit.set(true);
                    this.setRequest(request);
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
        break;
      case "delete":
        const dialogRef = this.dialog.open(ConfirmationDialog, {
          data: {
            title: 'Leave Request Delete Confirmation',
            message: 'Are you sure you want to delete this leave request?',
            negativeButtonTitle: 'No',
            affirmativeButtonTitle: 'Yes'
          }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result.toLowerCase() === 'yes') {
            this.empService.deleteLeaveRequest(employeeid, requestid).subscribe({
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
                  this.setEmployee();
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
            this.selectedItem.set('');
          }
        });
        break;
      case "clear":
        this.selectedItem.set('');
        break;
      case "comment":
        this.updateLeaveRequest(employeeid, requestid, element, parts[3]);
        break;
      case "start":
        const start = new Date(Number(parts[3]));
        this.updateLeaveRequest(employeeid, requestid, element, start.toDateString());
        break;
      case "end":
        const end = new Date(Number(parts[3]));
        this.updateLeaveRequest(employeeid, requestid, element, end.toDateString());
        break;
      case "primarycode":
        this.updateLeaveRequest(employeeid, requestid, element, parts[3]);
        break;
      case "day":
        let chgString = '';
        for (let i=3; i < parts.length; i++) {
          if (i > 3) {
            chgString += '|';
          }
          chgString += parts[i];
        }
        this.updateLeaveRequest(employeeid, requestid, element, chgString);
        break;
      default:
        console.log(evt);
        break;
    }
  }

  updateLeaveRequest(empid: string, requestid: string, field: string, 
    value: string) {
    this.refreshEditor.set(false);
    this.empService.updateLeaveRequest(empid, requestid, field, value).subscribe({
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
          this.setEmployee();
          employee.requests.forEach(request => {
            if (request.id === requestid) {
              this.setRequest(request);
            }
          })
          this.refreshEditor.set(true);
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

  onSubmitForApproval() {
    this.showSubmit.set(false);
    this.updateLeaveRequest(this.employee, this.selectedItem(), 'requested', '');
  }

  onApprove() {
    const iEmp = this.empService.getEmployee();
    if (iEmp) {
      const emp = new Employee(iEmp);
      this.showApprover.set(false);
      this.updateLeaveRequest(this.employee, this.selectedItem(), 'approve', emp.id);
    }
  }

  onUnapprove() {
    const data: DialogData = {
      title: 'Reason for Unapproval',
      inputlabel: 'Reason',
      message: 'Please enter a reason the leave request was not approved.',
      affirmativeButtonTitle: 'Unapprove',
      negativeButtonTitle: 'Cancel'
    };
    const dialogRef = this.dialog.open(MessageDialog, {data: data});
    dialogRef.afterClosed().subscribe(result => {
      if (result && result !== '') {
        this.updateLeaveRequest(this.employee, this.selectedItem(), 'unapprove', result);
      } else {
        this.authService.statusMessage.set('No unapprove reason given');
      }
    });
  }}
