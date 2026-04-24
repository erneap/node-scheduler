import { Component, Input, signal } from '@angular/core';
import { AuthService } from '../../../../../services/auth-service';
import { SiteService } from '../../../../../services/site-service';
import { EmployeeService } from '../../../../../services/employee-service';
import { TeamService } from '../../../../../services/team-service';
import { form, FormField } from '@angular/forms/signals';
import { Team } from 'scheduler-models/scheduler/teams';
import { Employee } from 'scheduler-models/scheduler/employees';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { IUser, User } from 'scheduler-models/users';
import { HttpErrorResponse } from '@angular/common/http';

interface PermissionData {
  employee: boolean;
  scheduler: boolean;
  siteleader: boolean;
  teamleader: boolean;
  admin: boolean;
}

@Component({
  selector: 'app-site-edit-employee-permissions-editor',
  imports: [
    FormField,
    MatCheckboxModule
  ],
  templateUrl: './site-edit-employee-permissions-editor.html',
  styleUrl: './site-edit-employee-permissions-editor.scss',
})
export class SiteEditEmployeePermissionsEditor {
  private _employee: string = '';
  @Input()
  get employee(): string {
    return this._employee;
  }
  set employee(id: string) {
    this._employee = id;
    this.setPermissions();
  }
  permModel = signal<PermissionData>({
    employee: true,
    scheduler: false,
    siteleader: false,
    teamleader: false,
    admin: false
  })
  permForm = form(this.permModel);
  sitePerm = signal<boolean>(false);
  teamPerm = signal<boolean>(false);
  adminPerm = signal<boolean>(false);

  constructor(
    private authService: AuthService,
    private empService: EmployeeService,
    private siteService: SiteService,
    private teamService: TeamService,
  ) {
    const iUser = this.authService.getUser();
    if (iUser) {
      const user = new User(iUser);
      if (user.hasPermission('scheduler', 'scheduler') 
        || user.hasPermission('scheduler', 'siteleader')) {
        this.sitePerm.set(true);
      }
      if (user.hasPermission('scheduer', 'teamleader')) {
        this.teamPerm.set(true);
      }
      if (user.hasPermission('scheduler', 'admin')) {
        this.adminPerm.set(true);
      }
    }
  }

  setPermissions() {
    this.permForm.employee().value.set(true);
    this.permForm.scheduler().value.set(false);
    this.permForm.siteleader().value.set(false);
    this.permForm.teamleader().value.set(false);
    this.permForm.admin().value.set(false);
    
    const site = this.teamService.selectedSite();
    const empID = this.siteService.selectedEmployee();
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      team.sites.forEach(s => {
        if (s.id.toLowerCase() === site.toLowerCase()) {
          if (s.employees) {
            s.employees.forEach(emp => {
              if (emp.id === empID) {
                if (emp.user?.hasPermission('scheduler', 'scheduler')) {
                  this.permForm.scheduler().value.set(true);
                }
                if (emp.user?.hasPermission('scheduler', 'siteleader')) {
                  this.permForm.siteleader().value.set(true);
                }
                if (emp.user?.hasPermission('scheduler', 'teamleader')) {
                  this.permForm.teamleader().value.set(true);
                }
                if (emp.user?.hasPermission('scheduler', 'admin')) {
                  this.permForm.admin().value.set(true);
                }
              }
            })
          }
        }
      });
    }
  }

  onChange(field: string) {
    let value = false;
    let useField = '';
    switch (field.toLowerCase()) {
      case "scheduler":
        value = this.permForm.scheduler().value();
        break;
      case "siteleader":
        value = this.permForm.siteleader().value();
        break;
      case "teamleader":
        value = this.permForm.teamleader().value();
        break;
      case "admin":
        value = this.permForm.admin().value();
        break;
    }
    useField = (value) ? "addperm" : "removeperm";
    const useValue = `scheduler-${field.toLowerCase()}`;
    this.authService.updatePermission(this.employee, useField, useValue).subscribe({
      next: (res) => {
        const iUser = res.body as IUser;
        if (iUser) {
          const user = new User(iUser);
          // set through the team service to replace any employee with user's id 
          // with the new user.
          let found = false;
          const iTeam = this.teamService.getTeam();
          if (iTeam) {
            const team = new Team(iTeam);
            team.sites.forEach((site, s) => {
              if (!found && site.employees) {
                site.employees.forEach((emp, e) => {
                  if (emp.id === user.id) {
                    found = true;
                    emp.user = new User(user);
                    if (site.employees) {
                      site.employees[e] = emp;
                    }
                  }
                });
                // if found, check the cached site and see if the employee's site is 
                // the cached site id.  If so, update the cached site.
                if (found) {
                  const iSite = this.siteService.getSite();
                  if (iSite && iSite.id.toLowerCase() === site.id.toLowerCase()) {
                    this.siteService.setSite(site);
                  }
                }
              }
            })
          }

          // lastly, check the employee and if he/she has the same id, replace it's user
          const iEmp = this.empService.getEmployee();
          if (iEmp) {
            const emp = new Employee(iEmp);
            if (emp.id === user.id) {
              emp.user = new User(user);
              this.empService.setEmployee(emp);
            }
          }

        }

      },
      error: (err) => {
        console.log(err);
        if (err instanceof HttpErrorResponse) {
          if (err.status >= 400 && err.status < 500) {
            this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
          }
        }
      }
    })
  }
}
