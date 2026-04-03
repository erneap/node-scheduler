import { Component, Input, signal } from '@angular/core';
import { AuthService } from '../../../../../services/auth-service';
import { SiteService } from '../../../../../services/site-service';
import { EmployeeService } from '../../../../../services/employee-service';
import { TeamService } from '../../../../../services/team-service';
import { AnnualLeave, Employee, IEmployee } from 'scheduler-models/scheduler/employees';
import { Team } from 'scheduler-models/scheduler/teams';
import { SiteEditEmployeeLeaveBalancesYear } from './site-edit-employee-leave-balances-year/site-edit-employee-leave-balances-year';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from '../../../../../general/confirmation-dialog/confirmation-dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-site-edit-employee-leave-balances-chart',
  imports: [
    SiteEditEmployeeLeaveBalancesYear,
    MatButtonModule
  ],
  templateUrl: './site-edit-employee-leave-balances-chart.html',
  styleUrl: './site-edit-employee-leave-balances-chart.scss',
})
export class SiteEditEmployeeLeaveBalancesChart {
  private _employee: string = '';
  @Input()
  get employee(): string {
    return this._employee;
  }
  set employee(id: string) {
    this._employee = id;
    this.setBalances();
  }
  balances = signal<AnnualLeave[]>([]);

  constructor(
    private authService: AuthService,
    private empService: EmployeeService,
    private siteService: SiteService,
    private teamService: TeamService,
    private dialog: MatDialog
  ) {

  }

  setBalances() {
    const balances: AnnualLeave[] = [];
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      team.sites.forEach(site => {
        if (balances.length === 0 && site.employees) {
          site.employees.forEach(emp => {
            if (balances.length === 0 && emp.id === this.employee) {
              emp.balances.forEach(bal => {
                balances.push(new AnnualLeave(bal));
              })
            }
          });
        }
      });
    }
    balances.sort((a,b) => b.compareTo(a));
    this.balances.set(balances);
  }

  onChange(change: string) {
    const parts = change.split('|');
    const action = parts[1].toLowerCase();
    if (action === 'delete') {
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        data: {
          title: 'Leave Balance Delete Confirmation',
          message: 'Are you sure you want to delete this leave balance?',
          negativeButtonTitle: 'No',
          affirmativeButtonTitle: 'Yes'
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result.toLowerCase() === 'yes') {
          this.empService.deleteBalance(this.employee, Number(parts[0])).subscribe({
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
                this.setBalances();
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
      this.empService.updateBalance(this.employee, Number(parts[0]), parts[1], 
        Number(parts[2])).subscribe({
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
            this.setBalances();
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

  onAdd() {
    let year = 0;
    this.balances().forEach(bal => {
      if (year < bal.year) {
        year = bal.year;
      }
    });
    if (year > 0) {
      year++;
    } else {
      const now = new Date();
      year = now.getFullYear();
    }
    this.empService.addBalance(this.employee, year).subscribe({
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
          this.setBalances();
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
