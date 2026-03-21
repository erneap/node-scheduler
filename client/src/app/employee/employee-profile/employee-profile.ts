import { Component, Input } from '@angular/core';
import { EmployeeService } from '../../services/employee-service';
import { TeamService } from '../../services/team-service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { SiteService } from '../../services/site-service';
import { AuthService } from '../../services/auth-service';
import { HttpErrorResponse } from '@angular/common/http';
import { Employee, IEmployee } from 'scheduler-models/scheduler/employees';

@Component({
  selector: 'app-employee-profile',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule
  ],
  templateUrl: './employee-profile.html',
  styleUrl: './employee-profile.scss',
})
export class EmployeeProfile {
  private _employee: string = '';
  @Input()
  get employee(): string {
    return this._employee;
  }
  set employee(id: string) {
    this._employee = id;
  }
  profileForm: FormGroup;

  constructor(
    private authService: AuthService,
    private empService: EmployeeService,
    private siteService: SiteService,
    private teamService: TeamService,
    private builder: FormBuilder
  ) {
    if (this.employee === '') {
      const emp = this.empService.getEmployee();
      if (emp) {
        this.employee = emp.id;
      }
    }

    this.profileForm = this.builder.group({
      email: ['', [Validators.required, Validators.email]],
      first: ['', [Validators.required]],
      middle: '',
      last: ['', [Validators.required]],
      company: ['', [Validators.required]],
      employeeid: ['', [Validators.required]],
      alternateid: '',
      jobtitle: '',
      rank: '',
      costcenter: '',
      division: ''
    });
  }

  /**
   * This method will establish the data to the editing form.
   * STEPS:
   * 1) Get the team the employee belongs to.
   * 2) Step through the sites/employees to find the employee with the identifier.
   * 3) Set the profile form with the user name and company information.
   */
  setEmployee() {
    if (this.employee !== '') {
      const team = this.teamService.getTeam();
      if (team) {
        let found = false;
        team.sites.forEach(site => {
          if (!found && site.employees) {
            site.employees.forEach(emp => {
              if (!found && emp.id === this.employee) {
                found = true;
                if (emp.user) {
                  this.profileForm.controls['email'].setValue(emp.user.emailAddress);
                  this.profileForm.controls['first'].setValue(emp.user.firstName);
                  this.profileForm.controls['middle'].setValue(emp.user.middleName);
                  this.profileForm.controls['last'].setValue(emp.user.lastName);
                } else {
                  this.profileForm.controls['email'].setValue(emp.email);
                  this.profileForm.controls['first'].setValue(emp.name.firstname);
                  this.profileForm.controls['middle'].setValue(emp.name.middlename);
                  this.profileForm.controls['last'].setValue(emp.name.lastname);
                }
                this.profileForm.controls['company'].setValue(emp.companyinfo.company);
                this.profileForm.controls['employeeid'].setValue(
                  emp.companyinfo.employeeid);
                if (emp.companyinfo.alternateid) {
                  this.profileForm.controls['alternateid'].setValue(
                    emp.companyinfo.alternateid);
                } else {
                  this.profileForm.controls['alternateid'].setValue('');
                }
                if (emp.companyinfo.jobtitle) {
                  this.profileForm.controls['jobtitle'].setValue(
                    emp.companyinfo.jobtitle);
                } else {
                  this.profileForm.controls['jobtitle'].setValue('');
                }
                if (emp.companyinfo.rank) {
                  this.profileForm.controls['rank'].setValue(
                    emp.companyinfo.rank);
                } else {
                  this.profileForm.controls['rank'].setValue('');
                }
                if (emp.companyinfo.costcenter) {
                  this.profileForm.controls['costcenter'].setValue(
                    emp.companyinfo.costcenter);
                } else {
                  this.profileForm.controls['costcenter'].setValue('');
                }
                if (emp.companyinfo.division) {
                  this.profileForm.controls['division'].setValue(
                    emp.companyinfo.division);
                } else {
                  this.profileForm.controls['division'].setValue('');
                }
              }
            });
          }
        });
      }
    }
  }

  updateUserField(field: string) {
    let value: string = '';
    let id = "";
    switch(field.toLowerCase()) {
      case "email":
        value = this.profileForm.value.email;
        break;
      case "first":
        value = this.profileForm.value.first;
        break;
      case "middle":
        value = this.profileForm.value.middle;
        break;
      case "last":
        value = this.profileForm.value.last;
        break;
      case "company":
        value = this.profileForm.value.company;
        break;
      case "employeeid":
        value = this.profileForm.value.employeeid;
        break;
      case "alternateid":
        value = this.profileForm.value.alternateid;
        break;
      case "jobtitle":
        value = this.profileForm.value.jobtitle;
        break;
      case "rank":
        value = this.profileForm.value.rank;
        break;
      case "costcenter":
        value = this.profileForm.value.costcenter;
        break;
      case "division":
        value = this.profileForm.value.division;
        break;
      default:
        return;
    }
    this.empService.updateEmployee(this.employee, field, value).subscribe({
      next: res => {
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
          const user = this.authService.getUser();
          if (user && user.id === employee.id) {
            this.authService.setUser(employee.user);
          }
        }
      },
      error: err => {
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
